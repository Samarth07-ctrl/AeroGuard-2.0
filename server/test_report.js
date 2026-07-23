async function test() {
  console.log("Testing POST /api/ai/report...");
  try {
    const res = await fetch('http://localhost:5000/api/ai/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: '4c2199a8206a92a8f6634f00e8880ea6',
        language: 'English',
        weather: { temperature_2m: 25, relative_humidity_2m: 80 }
      })
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response length:", text.length);
    console.log("Response snippet:", text.substring(0, 200));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
