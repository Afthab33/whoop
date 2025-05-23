import express from 'express';
const app = express();

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('👋 Hello from your WHOOP backend! Ready for OAuth.');
});

// Required by WHOOP — must exist even if it's empty
app.get('/callback', (req, res) => {
  res.send('✅ Callback route is working. You can now paste this URL in WHOOP Dashboard.');
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});