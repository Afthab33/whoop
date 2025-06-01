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

// Helper function for query analysis
async function analyzeQueryIntent(message) {
  const intentPrompt = `Analyze this WHOOP query and return JSON only:
{
  "queryType": "trend|comparison|single_day|recommendation",
  "needsMultipleDays": boolean,
  "timeScope": "recent|week|month|specific",
  "dataFocus": "sleep|recovery|strain|workout|overall",
  "isDateSpecific": boolean
}

Query: "${message}"

Examples:
- "How's my recovery today?" → {"queryType": "single_day", "needsMultipleDays": false, "timeScope": "recent", "dataFocus": "recovery", "isDateSpecific": true}
- "How was my sleep last night?" → {"queryType": "single_day", "needsMultipleDays": false, "timeScope": "specific", "dataFocus": "sleep", "isDateSpecific": true}
- "How has my sleep been trending?" → {"queryType": "trend", "needsMultipleDays": true, "timeScope": "week", "dataFocus": "sleep", "isDateSpecific": false}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: intentPrompt }],
      temperature: 0.1,
      max_tokens: 120,
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    // Enhanced fallback analysis
    const msg = message.toLowerCase();
    return {
      queryType: msg.includes('trend') || msg.includes('pattern') ? 'trend' : 'single_day',
      needsMultipleDays: msg.includes('week') || msg.includes('month') || msg.includes('trend') || msg.includes('pattern'),
      timeScope: msg.includes('week') ? 'week' : msg.includes('month') ? 'month' : 'recent',
      dataFocus: msg.includes('sleep') ? 'sleep' : msg.includes('recovery') ? 'recovery' : 'overall',
      isDateSpecific: msg.includes('yesterday') || msg.includes('last night') || msg.includes('today')
    };
  }
}

// Helper function for date calculations
function calculateDateRange(intent, message) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  // Check for specific temporal references
  const msg = message.toLowerCase();
  
  if (msg.includes('last night') || msg.includes('yesterday')) {
    return {
      start: formatDate(yesterday),
      end: formatDate(yesterday),
      type: 'specific_day'
    };
  }
  
  if (msg.includes('today')) {
    return {
      start: formatDate(today),
      end: formatDate(today),
      type: 'specific_day'
    };
  }
  
  if (msg.includes('this week') || intent.timeScope === 'week') {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    return {
      start: formatDate(weekStart),
      end: formatDate(today),
      type: 'week_range'
    };
  }
  
  if (msg.includes('this month') || intent.timeScope === 'month') {
    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 30);
    return {
      start: formatDate(monthStart),
      end: formatDate(today),
      type: 'month_range'
    };
  }
  
  return null; // No specific date range
}

// Enhanced search strategy
function getSearchStrategy(intent) {
  const strategies = {
    trend: { topK: 14, requiresSorting: true, needsTrendAnalysis: true },
    comparison: { topK: 10, requiresSorting: true, needsTrendAnalysis: true },
    single_day: { topK: 3, requiresSorting: false, needsTrendAnalysis: false },
    recommendation: { topK: 7, requiresSorting: false, needsTrendAnalysis: false }
  };
  
  return strategies[intent.queryType] || strategies.single_day;
}

// Trend analysis function
function calculateTrends(sortedDays) {
  if (sortedDays.length < 3) return null;

  // Extract metrics from summaries
  const recoveryScores = [];
  const sleepScores = [];
  
  sortedDays.forEach(day => {
    const summary = day.summary.toLowerCase();
    
    // Extract recovery scores (look for "recovery: 85%" or "recovery score: 85")
    const recoveryMatch = summary.match(/recovery[:\s]*(\d+)%?/);
    if (recoveryMatch) recoveryScores.push(parseInt(recoveryMatch[1]));
    
    // Extract sleep scores
    const sleepMatch = summary.match(/sleep[:\s]*(\d+)%?/);
    if (sleepMatch) sleepScores.push(parseInt(sleepMatch[1]));
  });

  const analyzeTrend = (scores, metricName) => {
    if (scores.length < 2) return null;
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const change = last - first;
    
    let direction = 'stable';
    if (change > 5) direction = 'improving';
    else if (change < -5) direction = 'declining';
    
    return {
      metric: metricName,
      direction,
      first,
      last,
      average: Math.round(avg),
      change,
      dataPoints: scores.length
    };
  };

  return {
    recovery: analyzeTrend(recoveryScores, 'Recovery'),
    sleep: analyzeTrend(sleepScores, 'Sleep'),
    dateRange: `${sortedDays[0].date} to ${sortedDays[sortedDays.length - 1].date}`,
    totalDays: sortedDays.length
  };
}

// Enhanced context builder
function buildEnhancedContext(matches, intent, strategy, trends = null) {
  let context = `WHOOP Data Analysis Context:\n`;
  
  // Add trend analysis if available
  if (trends) {
    context += `\nTREND ANALYSIS (${trends.totalDays} days: ${trends.dateRange}):\n`;
    
    if (trends.recovery) {
      context += `Recovery: ${trends.recovery.direction} (${trends.recovery.first}% → ${trends.recovery.last}%, avg: ${trends.recovery.average}%)\n`;
    }
    
    if (trends.sleep) {
      context += `Sleep: ${trends.sleep.direction} (${trends.sleep.first}% → ${trends.sleep.last}%, avg: ${trends.sleep.average}%)\n`;
    }
    context += '\n';
  }
  
  // Add daily data
  context += `RELEVANT DAYS:\n`;
  matches.slice(0, 8).forEach(day => {
    context += `${day.date} (relevance: ${day.score}): ${day.summary.substring(0, 150)}...\n\n`;
  });
  
  return context;
}

// Dynamic system prompt
function createSystemPrompt(intent, context) {
  let basePrompt = `You are WHOOP AI Coach, an expert fitness and recovery advisor.`;
  
  switch (intent.queryType) {
    case 'trend':
      basePrompt += ` Analyze patterns and trends in the data. Focus on what's changing over time and provide insights about the direction of key metrics.`;
      break;
    case 'comparison':
      basePrompt += ` Compare different time periods or metrics. Highlight key differences and their significance.`;
      break;
    case 'recommendation':
      basePrompt += ` Provide specific, actionable recommendations based on the user's data patterns and current state.`;
      break;
    default:
      basePrompt += ` Provide personalized insights based on the user's recent data.`;
  }
  
  basePrompt += `\n\nBe concise (2-3 paragraphs), specific, and reference actual data points from the context. Avoid generic advice.\n\nContext:\n${context}`;
  
  return basePrompt;
}

// Routes
app.get('/', (req, res) => {
  res.send('👋 Hello from WHOOP backend with Pinecone retrieval!');
});

app.get('/callback', (req, res) => {
  res.send('✅ Callback route is working. You can now paste this URL in WHOOP Dashboard.');
});

app.post('/api/ai-coach', async (req, res) => {
  try {
    const { message } = req.body;

    // 1️⃣ Analyze intent
    const intent = await analyzeQueryIntent(message);
    const strategy = getSearchStrategy(intent);
    const dateRange = calculateDateRange(intent, message);

    // 2️⃣ Optimize embedding for specific focus areas
    let searchQuery = message;
    if (intent.dataFocus !== 'overall') {
      searchQuery = `${intent.dataFocus} ${message}`;
    }

    const embedResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: searchQuery,
    });
    const userEmbedding = embedResponse.data[0].embedding;

    // 3️⃣ IMPROVED: More flexible Pinecone query
    const searchParams = {
      topK: strategy.topK,
      vector: userEmbedding,
      includeMetadata: true,
    };

    // 🔧 IMPROVED: Don't use strict date filtering, get more results instead
    if (dateRange) {
      // Get more results and filter manually for better flexibility
      searchParams.topK = dateRange.type === 'specific_day' ? 10 : 50;
    } else if (intent.timeScope === 'recent') {
      searchParams.topK = 30;
    }

    const searchResponse = await pineconeIndex.query(searchParams);

    // 4️⃣ IMPROVED: More flexible date filtering
    let matches = searchResponse.matches.map(match => ({
      score: parseFloat(match.score.toFixed(3)),
      date: match.metadata.date,
      summary: match.metadata.text_summary,
    }));

    // Filter by date range if needed (more flexible)
    if (dateRange) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      matches = matches.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate >= startDate && matchDate <= endDate;
      });
      
      // 🆕 If no exact matches, expand the search backwards
      if (matches.length === 0) {
        console.log(`No data found for ${dateRange.start} to ${dateRange.end}, expanding search...`);
        
        // Look for data in the past 30 days instead
        const expandedStart = new Date(startDate);
        expandedStart.setDate(expandedStart.getDate() - 30);
        
        matches = searchResponse.matches
          .map(match => ({
            score: parseFloat(match.score.toFixed(3)),
            date: match.metadata.date,
            summary: match.metadata.text_summary,
          }))
          .filter(match => {
            const matchDate = new Date(match.date);
            return matchDate >= expandedStart && matchDate <= endDate;
          });
      }
    }

    // Filter by recent timeframe (more flexible)
    if (!dateRange && intent.timeScope === 'recent') {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30); // Extended to 30 days
      
      matches = matches.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate >= recentDate;
      });
    }

    // 5️⃣ IMPROVED: Better no-data handling
    if (matches.length === 0) {
      // Try one more time with just semantic search (no date filtering)
      console.log('No matches found, trying semantic search only...');
      
      const fallbackResponse = await pineconeIndex.query({
        topK: 20,
        vector: userEmbedding,
        includeMetadata: true,
      });
      
      const fallbackMatches = fallbackResponse.matches
        .map(match => ({
          score: parseFloat(match.score.toFixed(3)),
          date: match.metadata.date,
          summary: match.metadata.text_summary,
        }))
        .filter(match => match.score > 0.6) // Lower threshold
        .slice(0, 10);
      
      if (fallbackMatches.length > 0) {
        const timeframe = dateRange ? `for ${dateRange.start}${dateRange.type === 'week_range' ? ' to ' + dateRange.end : ''}` : 'for your query';
        
        return res.json({
          response: `I don't have specific WHOOP data ${timeframe}, but I found some relevant information from your recent activity. Let me analyze what I have available.`,
          analysis: { 
            queryType: intent.queryType, 
            daysAnalyzed: fallbackMatches.length,
            fallbackUsed: true,
            timeScope: intent.timeScope
          },
          fallbackData: fallbackMatches.slice(0, 3),
          messageId: 'fallback-' + Date.now(),
        });
      }
      
      return res.json({
        response: `I don't have sufficient WHOOP data to answer your question about strain patterns. This could mean:\n\n• Your device wasn't worn during that period\n• Data hasn't synced yet\n• You might need to check your WHOOP app connectivity\n\nTry asking about a different time period or check if your device is syncing properly.`,
        analysis: { queryType: intent.queryType, daysAnalyzed: 0, noDataFound: true },
        messageId: 'no-data-' + Date.now(),
      });
    }

    // 6️⃣ More lenient relevance filtering
    matches = matches.filter(match => match.score > 0.6); // Lowered from 0.7

    // 7️⃣ Sort only when needed
    if (strategy.requiresSorting) {
      matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 8️⃣ Limit results based on strategy
    matches = matches.slice(0, strategy.topK);

    // 9️⃣ Skip trend analysis if insufficient data
    let trends = null;
    if (strategy.needsTrendAnalysis && matches.length >= 2) { // Lowered from 3
      trends = calculateTrends(matches);
    }

    // 🔟 Build context
    const context = buildEnhancedContext(matches.slice(0, 6), intent, strategy, trends);

    // 1️⃣1️⃣ Create prompt with data availability info
    let systemPrompt = createSystemPrompt(intent, context);
    
    if (dateRange) {
      systemPrompt += `\n\nNote: User asked about ${dateRange.start}${dateRange.type === 'week_range' ? ' to ' + dateRange.end : ''}. `;
      if (matches.length < 5) {
        systemPrompt += `Limited data available for this period - work with what you have and mention data gaps if relevant.`;
      }
    }

    // 1️⃣2️⃣ Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    res.json({
      response: completion.choices[0].message.content,
      analysis: {
        queryType: intent.queryType,
        daysAnalyzed: matches.length,
        trendsCalculated: !!trends,
        timeScope: intent.timeScope,
        dateSearched: dateRange?.start || null,
        dateRange: dateRange,
        dataAvailability: matches.length < 3 ? 'limited' : 'good'
      },
      availableDates: matches.map(m => m.date).slice(0, 5),
      messageId: completion.id,
    });
  } catch (error) {
    console.error('AI Coach Error:', error);
    res.status(500).json({
      error: 'Failed to get response from AI coach',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server with Pinecone vector search running on port ${PORT}`);
});
