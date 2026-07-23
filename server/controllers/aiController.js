const AnalysisSession = require('../models/AnalysisSession');
const Farmer = require('../models/Farmer');

exports.generateReport = async (req, res) => {
  try {
    const { sessionId, language, weather } = req.body;
    
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    const ScanSession = require('../models/ScanSession');
    let sessions = await AnalysisSession.find({ sessionId }).lean();
    if (!sessions || sessions.length === 0) {
      // Fallback: lookup by farmerEmail if sessionId is actually a ScanSession ID
      const scan = await ScanSession.findOne({ sessionId });
      if (scan && scan.farmerEmail) {
        const normalizedEmail = String(scan.farmerEmail).trim().toLowerCase();
        sessions = await AnalysisSession.find({ farmerEmail: normalizedEmail }).lean();
      }
    }

    if (!sessions || sessions.length === 0) {
      console.error('Session not found for ID:', sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }

    // Extract all diseases
    const diseases = sessions.flatMap(s => s.diseases || []);
    const infected = diseases.filter(d => {
      const sev = (d.severity || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return sev !== 'safe' && !name.includes('healthy') && !name.includes('no disease');
    });

    if (infected.length === 0) {
      return res.status(400).json({ error: 'No diseases found to report' });
    }

    const lang = language || 'English';
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API Key missing' });
    }

    const diseaseList = infected.map(d => `${d.name} (Severity: ${d.severity})`).join(', ');
    const humidity = weather?.relative_humidity_2m || 'Unknown';
    const temp = weather?.temperature_2m || 'Unknown';

    const prompt = `
You are an expert agronomist AI for AeroGuard. Generate a professional PDF report body in HTML format.
Language: ${lang}
Context:
- Pathogens Found: ${diseaseList}
- Total Infected Plants: ${infected.length}
- Weather: ${temp}°C, Humidity: ${humidity}%

Provide:
1. An Executive Summary (mentioning that precision spot-spraying these specific plants will save 70% on pesticide costs vs blanket spraying).
2. Predictive Epidemiology (Neighborhood Risk Score). Warn about spread based on current weather.
3. Pesticide Spray Plan (Detailed actionable advice on which chemicals to use for the pathogens).

Format ONLY as clean HTML (no markdown tags, no \`\`\`html) using <div>, <h2>, <p>, <ul>, <li>, <strong> styling. Make it look professional and ready to print. Do not include <html> or <body> tags, just the inner HTML.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('Gemini API Error:', data.error);
    }
    
    let htmlOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Clean markdown if gemini outputs it
    if (htmlOutput) {
      htmlOutput = htmlOutput.replace(/```html/g, '').replace(/```/g, '').trim();
    } else {
      // Fallback robust HTML if Gemini fails
      htmlOutput = `
        <h2>Executive Summary</h2>
        <p>AeroGuard has successfully mapped and analyzed the field. By utilizing Precision Spot-Spraying based on these exact GPS coordinates, you will save approximately <strong>70% on pesticide costs</strong> compared to blanket spraying.</p>
        
        <h2>Precision Treatment Plan</h2>
        <p>The following pathogens require immediate localized treatment:</p>
        <ul>
          ${infected.map(d => `<li><strong>${d.name}</strong> (Severity: ${d.severity}) at GPS: ${d.lat}, ${d.lon}</li>`).join('')}
        </ul>
      `;
    }

    return res.json({ html: htmlOutput });
  } catch (error) {
    console.error('AI Report Gen Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
