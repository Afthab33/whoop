import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Load environment variables
dotenv.config();

const app = express();

// Use PORT from environment or default to 8080 (Cloud Run requirement)
const PORT = process.env.PORT || 8080;

// Enhanced CORS for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://whoopapp.vercel.app'] // Replace with your frontend URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint (required for Cloud Run)
app.get('/', (req, res) => {
  res.json({ 
    status: 'WHOOP AI Coach API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});
const pineconeIndex = pinecone.Index("whoop-ai-coach");

// Single GPT-4o call for intent + metadata identification
async function analyzeUserQuery(message) {
  const structuredPrompt = `Analyze this WHOOP user question and identify clearly:

- Intent (e.g., improve_sleep, analyze_sleep, improve_recovery, analyze_recovery, analyze_strain, track_trends, recovery_trends, sleep_trends, strain_trends, general_question)
- Relevant date-range or timeframe needed (today, yesterday, last_week, last_month, recent, specific_date)
- Metrics to focus on (recovery_score, sleep_performance, hrv, strain, workout_performance, overall)

Question: "${message}"

For "improve" questions, use intent like "improve_sleep" or "improve_recovery".
For "analyze" questions, use intent like "analyze_sleep" or "analyze_recovery".
If the question mentions "trends", use "track_trends" or specific trend type like "recovery_trends".
For trends, prefer longer timeframes like "last_month" or "recent".

Respond in structured JSON exactly like this:

{
  "intent": "improve_sleep",
  "timeframe": "recent", 
  "metrics": ["sleep_performance", "sleep_stages", "sleep_debt"]
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
    // Enhanced fallback
    const msg = message.toLowerCase();
    return {
      intent: msg.includes('improve') && msg.includes('sleep') ? 'improve_sleep' :
              msg.includes('improve') && msg.includes('recovery') ? 'improve_recovery' :
              msg.includes('trends') || msg.includes('trend') ? 'track_trends' : 
              msg.includes('sleep') ? 'analyze_sleep' : 
              msg.includes('recovery') ? 'analyze_recovery' : 
              msg.includes('strain') ? 'analyze_strain' : 'general_question',
      timeframe: msg.includes('trends') || msg.includes('trend') ? 'last_month' :
                 msg.includes('yesterday') || msg.includes('last night') ? 'yesterday' : 
                 msg.includes('today') ? 'today' : 
                 msg.includes('week') ? 'last_week' : 'recent',
      metrics: msg.includes('sleep') ? ['sleep_performance', 'sleep_stages', 'sleep_debt'] :
               msg.includes('recovery') ? ['recovery_score', 'hrv', 'rhr'] :
               msg.includes('strain') ? ['strain', 'workout_performance'] : ['overall']
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
          date: { "$in": getDateRange(today, 7) },
          type: { "$eq": "day" }
        },
        topK: 10
      };
      
    case 'last_month':
      return { 
        type: 'range',
        filter: { 
          date: { "$in": getDateRange(today, 30) },
          type: { "$eq": "day" }
        },
        topK: 20
      };
      
    case 'recent':
      return { 
        type: 'range',
        filter: { 
          date: { "$in": getDateRange(today, 14) },
          type: { "$eq": "day" }
        },
        topK: 15
      };
      
    default:
      return { 
        type: 'recent',
        filter: null,
        topK: 15
      };
  }
}

// Metadata-rich Pinecone query
async function queryPineconeWithMetadata(userEmbedding, analysis) {
  const dateFilter = getDateFilter(analysis.timeframe);
  
  const searchParams = {
    vector: userEmbedding,
    topK: dateFilter.topK,
    includeMetadata: true,
  };
  
  if (dateFilter.filter) {
    searchParams.filter = dateFilter.filter;
  }
  
  try {
    const searchResponse = await pineconeIndex.query(searchParams);
    
    let matches = searchResponse.matches.map(match => ({
      score: parseFloat(match.score.toFixed(3)),
      date: match.metadata.date,
      summary: match.metadata.text_summary || match.metadata.summary,
    }));
    
    matches = matches.filter(match => match.score > 0.4);
    
    if (matches.length === 0 && dateFilter.filter) {
      
      const fallbackResponse = await pineconeIndex.query({
        vector: userEmbedding,
        topK: 30,
        filter: { type: { "$eq": "day" } },
        includeMetadata: true,
      });
      
      matches = fallbackResponse.matches
        .map(match => ({
          score: parseFloat(match.score.toFixed(3)),
          date: match.metadata.date,
          summary: match.metadata.text_summary || match.metadata.summary,
        }))
        .filter(match => match.score > 0.3)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 15);
    }
    
    if (matches.length === 0) {
      
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
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20);
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
  
  const sortedMatches = matches.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Extract metrics based on intent
  const recoveryScores = [];
  const sleepScores = [];
  const strainScores = [];
  const hrvValues = [];
  const rhrValues = [];
  const sleepDebts = [];
  const deepSleepValues = [];
  const remSleepValues = [];
  
  sortedMatches.forEach(match => {
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
    
    // Extract Sleep Debt
    const sleepDebtMatch = summary.match(/Sleep debt (\d+) min/);
    if (sleepDebtMatch) sleepDebts.push(parseFloat(sleepDebtMatch[1]));
    
    // Extract Deep Sleep
    const deepSleepMatch = summary.match(/Deep sleep (\d+) min/);
    if (deepSleepMatch) deepSleepValues.push(parseFloat(deepSleepMatch[1]));
    
    // Extract REM Sleep
    const remSleepMatch = summary.match(/REM sleep (\d+) min/);
    if (remSleepMatch) remSleepValues.push(parseFloat(remSleepMatch[1]));
  });
  
  // Calculate averages
  const avgRecovery = recoveryScores.length ? Math.round(recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length) : null;
  const avgSleep = sleepScores.length ? Math.round(sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length) : null;
  const avgStrain = strainScores.length ? Math.round(strainScores.reduce((a, b) => a + b, 0) / strainScores.length * 10) / 10 : null;
  const avgHRV = hrvValues.length ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length) : null;
  const avgRHR = rhrValues.length ? Math.round(rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length) : null;
  const avgSleepDebt = sleepDebts.length ? Math.round(sleepDebts.reduce((a, b) => a + b, 0) / sleepDebts.length) : null;
  const avgDeepSleep = deepSleepValues.length ? Math.round(deepSleepValues.reduce((a, b) => a + b, 0) / deepSleepValues.length) : null;
  const avgRemSleep = remSleepValues.length ? Math.round(remSleepValues.reduce((a, b) => a + b, 0) / remSleepValues.length) : null;
  
  // Get date range
  const startDate = sortedMatches[0].date;
  const endDate = sortedMatches[sortedMatches.length - 1].date;
  
  // Build context based on intent
  let context = `WHOOP Data Analysis (${formatDateRange(startDate, endDate)}, ${matches.length} days):\n\n`;
  
  context += `**Aggregated Metrics:**\n`;
  
  // Focus on relevant metrics based on intent
  if (analysis.intent.includes('sleep')) {
    if (avgSleep) context += `- Average Sleep Performance: ${avgSleep}%\n`;
    if (avgSleepDebt) context += `- Average Sleep Debt: ${avgSleepDebt} minutes\n`;
    if (avgDeepSleep) context += `- Average Deep Sleep: ${avgDeepSleep} minutes\n`;
    if (avgRemSleep) context += `- Average REM Sleep: ${avgRemSleep} minutes\n`;
    if (avgHRV) context += `- Average HRV: ${avgHRV} ms\n`;
    if (avgRHR) context += `- Average RHR: ${avgRHR} bpm\n`;
  } else if (analysis.intent.includes('recovery')) {
    if (avgRecovery) context += `- Average Recovery: ${avgRecovery}%\n`;
    if (avgHRV) context += `- Average HRV: ${avgHRV} ms\n`;
    if (avgRHR) context += `- Average RHR: ${avgRHR} bpm\n`;
    if (avgSleep) context += `- Average Sleep Performance: ${avgSleep}%\n`;
  } else if (analysis.intent.includes('strain')) {
    if (avgStrain) context += `- Average Strain: ${avgStrain}\n`;
    if (avgRecovery) context += `- Average Recovery: ${avgRecovery}%\n`;
    if (avgHRV) context += `- Average HRV: ${avgHRV} ms\n`;
  } else {
    // General - show all available
    if (avgRecovery) context += `- Average Recovery: ${avgRecovery}%\n`;
    if (avgSleep) context += `- Average Sleep Performance: ${avgSleep}%\n`;
    if (avgStrain) context += `- Average Strain: ${avgStrain}\n`;
    if (avgHRV) context += `- Average HRV: ${avgHRV} ms\n`;
    if (avgRHR) context += `- Average RHR: ${avgRHR} bpm\n`;
  }
  
  context += `\n**Daily Details:**\n`;
  sortedMatches.forEach(match => {
    context += `- ${match.summary}\n`;
  });
  
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
  
  const currentYear = new Date().getFullYear();
  if (start.getFullYear() !== currentYear || end.getFullYear() !== currentYear) {
    return `${startStr}, ${start.getFullYear()} - ${endStr}, ${end.getFullYear()}`;
  }
  
  return `${startStr} - ${endStr}`;
}

// Create dynamic system prompt based on intent
function createDynamicSystemPrompt(analysis, context) {
  // Sleep improvement prompt
  if (analysis.intent === 'improve_sleep') {
    return `You are WHOOP AI Coach specializing in sleep optimization. Answer concisely (150-200 words) using ONLY the provided context data.

Context:
${context}

Format your response for SLEEP IMPROVEMENT exactly like this:

"Based on your sleep data over [TIMEFRAME] ([START DATE] - [END DATE]):

**Current Sleep Metrics:**
- Sleep Performance: [X]% (needs improvement/good/excellent)
- Average Sleep Debt: [X] minutes ([interpretation])
- Deep Sleep: [X] minutes per night ([assessment])
- REM Sleep: [X] minutes per night ([assessment])

**Sleep Improvement Strategies:**
- [Specific action based on sleep debt data with numbers]
- [Specific action for deep sleep optimization with actual metrics]
- [Specific action for REM sleep enhancement with data reference]
- [Additional recommendation based on patterns in your data]

**Expected Outcomes:**
Target: Increase sleep performance to 85%+ and reduce sleep debt to under 30 minutes.

Ready to create a personalized sleep schedule based on your patterns?"

RULES:
- Focus ONLY on sleep-related metrics and advice
- Reference actual sleep data from context
- Be specific with sleep debt, deep sleep, and REM sleep numbers
- Don't mention recovery or strain unless directly related to sleep impact`;
  }
  
  // Recovery improvement prompt
  if (analysis.intent === 'improve_recovery') {
    return `You are WHOOP AI Coach specializing in recovery optimization. Answer concisely (150-200 words) using ONLY the provided context data.

Context:
${context}

Format your response for RECOVERY IMPROVEMENT exactly like this:

"Your recovery analysis over [TIMEFRAME] ([START DATE] - [END DATE]):

**Current Recovery Status:**
- Average Recovery: [X]% ([color] zone - [interpretation])
- HRV: [X] ms ([assessment of autonomic nervous system])
- Resting Heart Rate: [X] bpm ([cardiovascular fitness indicator])

**Recovery Enhancement Plan:**
- [Specific HRV improvement strategy with actual numbers]
- [RHR optimization technique based on your data]
- [Sleep quality improvement tied to recovery data]
- [Stress management approach based on patterns]

**Target Goals:**
Aim for 70%+ recovery scores and HRV above [X+10] ms consistently.

Want to explore specific recovery protocols based on your worst recovery days?"

RULES:
- Focus on recovery, HRV, RHR primarily
- Use color zones: Green (70-100%), Yellow (34-69%), Red (0-33%)
- Reference specific recovery patterns from data
- Connect sleep to recovery but keep recovery as main focus`;
  }
  
  // Sleep analysis prompt
  if (analysis.intent === 'analyze_sleep') {
    return `You are WHOOP AI Coach providing sleep pattern analysis. Answer concisely (150-200 words) using ONLY the provided context data.

Context:
${context}

Format your response for SLEEP ANALYSIS exactly like this:

"Sleep Analysis for [TIMEFRAME] ([START DATE] - [END DATE]):

**Sleep Performance Breakdown:**
- Average Sleep Score: [X]% ([interpretation])
- Sleep Debt Patterns: [X] minutes average ([trend analysis])
- Sleep Stage Quality:
  • Deep Sleep: [X] minutes ([compared to optimal 90-120 min])
  • REM Sleep: [X] minutes ([compared to optimal 90-120 min])

**Key Insights:**
- [Pattern observation from best sleep days]
- [Pattern observation from worst sleep days]
- [Correlation with recovery/performance if relevant]

**Sleep Trends:**
[Specific trend about consistency, debt accumulation, or stage distribution]

Need help creating an action plan to optimize these sleep patterns?"

RULES:
- Analyze sleep data patterns objectively
- Compare to optimal sleep stage durations
- Identify best and worst performing days from data
- Keep analysis factual and data-driven`;
  }
  
  // Default/general prompt for other intents
  return `You are WHOOP AI Coach. Answer concisely (150-200 words) matching the user's specific question using ONLY the provided context data.

Context:
${context}

Format your response based on what the user asked about:

For general questions: Provide relevant data analysis with specific numbers from the context.
For trends: Show patterns over time with actual dates and metrics.
For strain: Focus on workout performance and strain scores.
For recovery: Focus on recovery percentages and related metrics.

**Key Guidelines:**
- Use actual data from the context
- Reference specific dates and numbers
- Provide actionable insights based on the data
- Keep the response focused on what was asked
- End with a relevant follow-up question

RULES:
- Match the user's question intent exactly
- Use specific metrics from the provided data
- Don't force a particular format if it doesn't match the question
- Be helpful and specific to their actual query`;
}

// Routes
app.get('/', (req, res) => {
  res.send('🚀 Optimized WHOOP backend with dynamic intent-based responses!');
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
      input: message,
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

    // Step 6: Create dynamic system prompt based on intent
    const systemPrompt = createDynamicSystemPrompt(analysis, context);

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
      response: cleanResponse,
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
      vector: new Array(1536).fill(0.1),
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
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      totalMatches: testQuery.matches.length,
      mostRecentDate: sortedByDate[0]?.date,
      oldestDate: sortedByDate[sortedByDate.length - 1]?.date,
      sampleDates: sortedByDate.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WHOOP AI Coach API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
