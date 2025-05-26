import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('👋 Hello from your WHOOP backend! Ready for OAuth.');
});

// Required by WHOOP — must exist even if it's empty
app.get('/callback', (req, res) => {
  res.send('✅ Callback route is working. You can now paste this URL in WHOOP Dashboard.');
});

// AI Coach API endpoint
app.post('/api/ai-coach', async (req, res) => {
  try {
    const { message, userData, date, hasData } = req.body;
    
    // Format date for display
    const dateDisplay = date ? new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }) : 'today';
    
    // Create context from user data
    let userContext = '';
    
    if (hasData && userData) {
      // Extract key metrics for the AI to reference
      const physiologicalData = userData.physiological_summary || {};
      const sleepData = userData.sleep_summary || {};
      const workouts = userData.workouts || [];
      
      userContext = `
Date: ${dateDisplay}

Key Metrics:
- Day Strain: ${physiologicalData["Day Strain"] || 'N/A'}
- Recovery: ${physiologicalData["Recovery score %"] || 'N/A'}%
- Sleep Performance: ${sleepData["Sleep performance %"] || 'N/A'}%
- Resting Heart Rate: ${physiologicalData["Resting heart rate (bpm)"] || 'N/A'} bpm
- HRV: ${physiologicalData["Heart rate variability (ms)"] || 'N/A'} ms
- Sleep Duration: ${Math.floor((sleepData["Asleep duration (min)"] || 0) / 60)}h ${(sleepData["Asleep duration (min)"] || 0) % 60}m
- Sleep Needed: ${Math.floor((sleepData["Sleep need (min)"] || 0) / 60)}h ${(sleepData["Sleep need (min)"] || 0) % 60}m
- Respiratory Rate: ${physiologicalData["Respiratory rate (rpm)"] || 'N/A'} rpm

${workouts.length > 0 ? `Workouts on this day:
${workouts.map(workout => `- ${workout.sport || 'Workout'}: Duration ${Math.floor(workout.duration_min / 60)}h ${workout.duration_min % 60}m, Strain: ${workout.strain || 'N/A'}`).join('\n')}` : 'No workouts recorded for this day.'}
`;
    } else {
      userContext = `No specific data available for ${dateDisplay}. Providing general fitness advice.`;
    }
    
    // Generate response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are WHOOP AI Coach, a fitness and wellness advisor specialized in analyzing WHOOP health tracking data.
          
You provide personalized guidance based on the user's WHOOP metrics like strain, recovery, sleep, HRV, and workouts.
Be encouraging, motivational, and scientifically accurate.
Keep responses concise (2-3 paragraphs maximum) and actionable.
Include specific references to the user's metrics when available.
When data is not available, provide general fitness and wellness advice.

USER CONTEXT:
${userContext}`
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    // Send the AI response back
    res.json({ 
      response: completion.choices[0].message.content,
      messageId: completion.id
    });
    
  } catch (error) {
    console.error('AI Coach Error:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI coach',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});