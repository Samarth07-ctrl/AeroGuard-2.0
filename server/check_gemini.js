require('dotenv').config();
async function checkKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set in your .env file.");
    return;
  }
  console.log("🔍 Checking Gemini API Key...");
  console.log(`Key snippet: ${apiKey.slice(0, 10)}...`);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });
    const data = await response.json();
    if (response.ok) {
      console.log("\n✅ SUCCESS: Your Gemini API Key is VALID and working perfectly!");
      console.log(`Test Response: "${data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}"`);
    } else {
      console.log("\n❌ FAILED: The API Key was rejected.");
      console.log("Error details:", data.error.message);
      if (data.error.message.includes('API key not valid')) {
        console.log("👉 Action: Generate a new API key from Google AI Studio.");
      } else if (data.error.message.includes('quota')) {
        console.log("👉 Action: You have hit the free tier quota limit.");
      }
    }
  } catch (err) {
    console.error("❌ Network Error: Could not connect to Gemini API.", err.message);
  }
}
checkKey();
