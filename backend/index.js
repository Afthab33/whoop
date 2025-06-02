import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});
const pineconeIndex = pinecone.Index("whoop-ai-coach");

const PORT = process.env.PORT || 8080;

// Single GPT-4o call for intent + metadata identification
async function analyzeUserQuery(message) {
  const structuredPrompt = `Analyze this WHOOP user question and identify clearly:

- Intent (e.g., analyze_recovery, analyze_sleep, improve_recovery, track_trends, analyze_strain, recovery_trends, sleep_trends, general_question)
- Relevant date-range or timeframe needed (today, yesterday, last_week, last_month, recent, specific_date)
- Metrics to focus on (recovery_score, sleep_performance, hrv, strain, workout_performance, overall)

Question: "${message}"

If the question mentions "trends", use "track_trends" or specific trend type like "recovery_trends".
For trends, prefer longer timeframes like "last_month" or "recent".

Respond in structured JSON exactly like this:

{
  "intent": "recovery_trends",
  "timeframe": "last_month", 
  "metrics": ["recovery_score", "sleep_performance", "hrv"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: structuredPrompt }],
      temperature: 0.1,
      max_tokens: 120,
    });
    
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Query analysis error:', error);
    // Enhanced fallback for trends
    const msg = message.toLowerCase();
    return {
      intent: msg.includes('trends') || msg.includes('trend') ? 'track_trends' : 
              msg.includes('sleep') ? 'analyze_sleep' : 
              msg.includes('recovery') ? 'analyze_recovery' : 'general_question',
      timeframe: msg.includes('trends') || msg.includes('trend') ? 'last_month' :
                 msg.includes('yesterday') || msg.includes('last night') ? 'yesterday' : 
                 msg.includes('today') ? 'today' : 
                 msg.includes('week') ? 'last_week' : 'recent',
      metrics: msg.includes('trends') ? ['recovery_score', 'sleep_performance', 'hrv'] : ['overall']
    };
  }
}

// Convert timeframe to date filter
function getDateFilter(timeframe) {
  const today = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  // Helper to generate date range array for string-based date filtering
  const getDateRange = (startDate, days) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i);
      dates.push(formatDate(date));
    }
    return dates;
  };
  
  switch (timeframe) {
    case 'today':
      return { 
        type: 'exact',
        filter: { 
          date: { "$eq": formatDate(today) },
          type: { "$eq": "day" }
        },
        topK: 3
      };
      
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { 
        type: 'exact',
        filter: { 
          date: { "$eq": formatDate(yesterday) },
          type: { "$eq": "day" }
        },
        topK: 3
      };
      
    case 'last_week':
      return { 
        type: 'range',
        filter: { 
          date: { "$in": getDateRange(today, 7) }, // Back to 7 days for week
          type: { "$eq": "day" }
        },
        topK: 10
      };
      
    case 'last_month':
      return { 
        type: 'range',
        filter: { 
          date: { "$in": getDateRange(today, 30) }, // Back to 30 days for month
          type: { "$eq": "day" }
        },
        topK: 20
      };
      
    case 'recent':
      return { 
        type: 'range',
        filter: { 
          date: { "$in": getDateRange(today, 14) }, // Back to 14 days for recent
          type: { "$eq": "day" }
        },
        topK: 15
      };
      
    default:
      return { 
        type: 'recent',
        filter: null, // Remove type filter to get ANY available data
        topK: 15 // Increased for better coverage
      };
  }
}

// Metadata-rich Pinecone query
async function queryPineconeWithMetadata(userEmbedding, analysis) {
  const dateFilter = getDateFilter(analysis.timeframe);
  
  // Optimize search query based on metrics
  const searchParams = {
    vector: userEmbedding,
    topK: dateFilter.topK,
    includeMetadata: true,
  };
  
  // Apply date filter if available
  if (dateFilter.filter) {
    searchParams.filter = dateFilter.filter;
  }
  
  try {
    const searchResponse = await pineconeIndex.query(searchParams);
    
    let matches = searchResponse.matches.map(match => ({
      score: parseFloat(match.score.toFixed(3)),
      date: match.metadata.date,
      summary: match.metadata.text_summary || match.metadata.summary, // Handle both field names
    }));
    
    // Lower similarity threshold
    matches = matches.filter(match => match.score > 0.4); // Lowered threshold
    
    // If no matches with date filter, try without filter but get RECENT data
    if (matches.length === 0 && dateFilter.filter) {
      console.log('No matches with date filter, trying to get most recent data...');
      const fallbackResponse = await pineconeIndex.query({
        vector: userEmbedding,
        topK: 30, // Get more results
        filter: { type: { "$eq": "day" } }, // Only daily data
        includeMetadata: true,
      });
      
      matches = fallbackResponse.matches
        .map(match => ({
          score: parseFloat(match.score.toFixed(3)),
          date: match.metadata.date,
          summary: match.metadata.text_summary || match.metadata.summary,
        }))
        .filter(match => match.score > 0.3) // Lower threshold
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date DESC to get most recent
        .slice(0, 15); // Take 15 most recent
    }
    
    // Final fallback: get ANY data, sorted by recency
    if (matches.length === 0) {
      console.log('No semantic matches, getting most recent data available...');
      const typeOnlyResponse = await pineconeIndex.query({
        vector: userEmbedding,
        topK: 50,
        filter: { type: { "$eq": "day" } },
        includeMetadata: true,
      });
      
      matches = typeOnlyResponse.matches
        .map(match => ({
          score: parseFloat(match.score.toFixed(3)),
          date: match.metadata.date,
          summary: match.metadata.text_summary || match.metadata.summary,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date DESC
        .slice(0, 20); // Take 20 most recent regardless of score
    }
    
    return {
      matches,
      searchType: dateFilter.type,
      hasDateFilter: !!dateFilter.filter
    };
    
  } catch (error) {
    console.error('Pinecone query error:', error);
    throw error;
  }
}

// Build precise context from metadata with aggregations
function buildPreciseContext(matches, analysis) {
  if (matches.length === 0) {
    return "No WHOOP data available for the requested timeframe.";
  }
  
  // Sort by date for chronological context
  const sortedMatches = matches.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Extract and aggregate key metrics
  const recoveryScores = [];
  const sleepScores = [];
  const strainScores = [];
  const hrvValues = [];
  const rhrValues = [];
  
  sortedMatches.forEach(match => {
    // Parse the summary to extract numeric values
    const summary = match.summary;
    
    // Extract Recovery score
    const recoveryMatch = summary.match(/Recovery (\d+(?:\.\d+)?)%/);
    if (recoveryMatch) recoveryScores.push(parseFloat(recoveryMatch[1]));
    
    // Extract Sleep score
    const sleepMatch = summary.match(/Sleep (\d+(?:\.\d+)?)%/);
    if (sleepMatch) sleepScores.push(parseFloat(sleepMatch[1]));
    
    // Extract Strain
    const strainMatch = summary.match(/Strain (\d+(?:\.\d+)?)/);
    if (strainMatch) strainScores.push(parseFloat(strainMatch[1]));
    
    // Extract HRV
    const hrvMatch = summary.match(/HRV (\d+(?:\.\d+)?) ms/);
    if (hrvMatch) hrvValues.push(parseFloat(hrvMatch[1]));
    
    // Extract RHR
    const rhrMatch = summary.match(/RHR (\d+(?:\.\d+)?) bpm/);
    if (rhrMatch) rhrValues.push(parseFloat(rhrMatch[1]));
  });
  
  // Calculate averages
  const avgRecovery = recoveryScores.length ? Math.round(recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length) : null;
  const avgSleep = sleepScores.length ? Math.round(sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length) : null;
  const avgStrain = strainScores.length ? Math.round(strainScores.reduce((a, b) => a + b, 0) / strainScores.length * 10) / 10 : null;
  const avgHRV = hrvValues.length ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length) : null;
  const avgRHR = rhrValues.length ? Math.round(rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length) : null;
  
  // Get date range
  const startDate = sortedMatches[0].date;
  const endDate = sortedMatches[sortedMatches.length - 1].date;
  
  // Build aggregated context
  let context = `WHOOP Data Analysis (${formatDateRange(startDate, endDate)}, ${matches.length} days):\n\n`;
  
  context += `**Aggregated Metrics:**\n`;
  if (avgRecovery) context += `- Average Recovery: ${avgRecovery}%\n`;
  if (avgSleep) context += `- Average Sleep Performance: ${avgSleep}%\n`;
  if (avgStrain) context += `- Average Strain: ${avgStrain}\n`;
  if (avgHRV) context += `- Average HRV: ${avgHRV} ms\n`;
  if (avgRHR) context += `- Average RHR: ${avgRHR} bpm\n`;
  
  context += `\n**Daily Details:**\n`;
  sortedMatches.forEach(match => {
    context += `- ${match.summary}\n`;
  });
  
  // Add analysis focus
  context += `\n**Analysis Focus:** ${analysis.metrics.join(', ')}\n`;
  context += `**Intent:** ${analysis.intent}\n`;
  context += `**Timeframe:** ${analysis.timeframe}\n`;
  
  return context;
}

// Helper function to format dates for display
function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const formatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', formatOptions);
  const endStr = end.toLocaleDateString('en-US', formatOptions);
  
  // Add year if different from current year
  const currentYear = new Date().getFullYear();
  if (start.getFullYear() !== currentYear || end.getFullYear() !== currentYear) {
    return `${startStr}, ${start.getFullYear()} - ${endStr}, ${end.getFullYear()}`;
  }
  
  return `${startStr} - ${endStr}`;
}

// Create optimized system prompt
function createOptimizedSystemPrompt(analysis, context) {
  const basePrompt = `You are WHOOP AI Coach. Answer concisely (150-200 words) matching this EXACT format. Use ONLY the provided context data.

Context:
${context}

Format your response EXACTLY like this example:

"Your recovery trends over the last [TIMEFRAME] ([START DATE] - [END DATE]) show:

- **Average Recovery**: [X]% ([COLOR] zone). [Brief interpretation with specific insight].
- **HRV**: Averaged [X] ms, [specific health note].
- **RHR**: [X] bpm, [specific fitness indicator].
- **[Other specific metric]**: [Value], [brief note].

To improve recovery:
- [Specific action with actual numbers from data].
- [Another specific action referencing real metrics].
- [Third recommendation tied to actual data points].

Want to dive deeper into specific behaviors impacting your recovery?"

RULES:
- Include actual date ranges from context
- Reference specific numbers from the data
- Use color zones: Green (80-100%), Yellow (50-79%), Red (0-49%)
- Make recommendations specific to the actual metrics shown
- Keep positive tone but be specific about improvements needed`;

  return basePrompt;
}

// Routes
app.get('/', (req, res) => {
  res.send('🚀 Optimized WHOOP backend with single-call pipeline!');
});

app.get('/callback', (req, res) => {
  res.send('✅ Callback route is working. You can now paste this URL in WHOOP Dashboard.');
});

app.post('/api/ai-coach', async (req, res) => {
  try {
    const { message } = req.body;
    const startTime = Date.now();

    // Step 1: Single GPT-4o call for intent + metadata identification
    const analysis = await analyzeUserQuery(message);
    
    // Step 2: Create embedding for semantic search
    const embedResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: message, // Simplified - just use the original message
    });
    const userEmbedding = embedResponse.data[0].embedding;

    // Step 3: Metadata-rich Pinecone query
    const searchResult = await queryPineconeWithMetadata(userEmbedding, analysis);
    const { matches, searchType, hasDateFilter } = searchResult;

    // Step 4: Handle no data scenarios
    if (matches.length === 0) {
      return res.json({
        response: `I don't have WHOOP data available for ${analysis.timeframe}. This could mean:\n\n• Your device wasn't worn during that period\n• Data hasn't synced yet\n• You might need to check your WHOOP app connectivity\n\nTry asking about a different time period or check if your device is syncing properly.`,
        analysis: {
          intent: analysis.intent,
          timeframe: analysis.timeframe,
          metrics: analysis.metrics,
          daysAnalyzed: 0,
          noDataFound: true
        },
        processingTime: Date.now() - startTime,
        messageId: 'no-data-' + Date.now(),
      });
    }

    // Step 5: Build precise context
    const context = buildPreciseContext(matches, analysis);

    // Step 6: Create optimized system prompt
    const systemPrompt = createOptimizedSystemPrompt(analysis, context);

    // Step 7: Final GPT-4o call for accurate response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 350,
    });

    // Clean up the response by removing markdown formatting
    let cleanResponse = completion.choices[0].message.content;
    
    // Remove markdown bold formatting
    cleanResponse = cleanResponse.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove any remaining asterisks
    cleanResponse = cleanResponse.replace(/\*/g, '');

    // Step 8: Return structured response
    res.json({
      response: cleanResponse, // Use cleaned response
      analysis: {
        intent: analysis.intent,
        timeframe: analysis.timeframe,
        metrics: analysis.metrics,
        daysAnalyzed: matches.length,
        searchType: searchType,
        usedDateFilter: hasDateFilter,
        accuracy: 'high'
      },
      availableDates: matches.map(m => m.date).slice(0, 5),
      processingTime: Date.now() - startTime,
      messageId: completion.id,
    });

  } catch (error) {
    console.error('AI Coach Error:', error);
    res.status(500).json({
      error: 'Failed to get response from AI coach',
      details: error.message,
      processingTime: Date.now() - (req.startTime || Date.now()),
    });
  }
});

// Add this route for debugging
app.get('/debug/data', async (req, res) => {
  try {
    const testQuery = await pineconeIndex.query({
      vector: new Array(1536).fill(0.1), // Correct dimension for text-embedding-3-large
      topK: 20,
      filter: { type: { "$eq": "day" } },
      includeMetadata: true,
    });
    
    const sortedByDate = testQuery.matches
      .map(m => ({
        date: m.metadata.date,
        type: m.metadata.type,
        score: m.score.toFixed(3)
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first
    
    res.json({
      totalMatches: testQuery.matches.length,
      mostRecentDate: sortedByDate[0]?.date,
      oldestDate: sortedByDate[sortedByDate.length - 1]?.date,
      sampleDates: sortedByDate.slice(0, 10) // Show 10 most recent
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Optimized server with single-call pipeline running on port ${PORT}`);
});
