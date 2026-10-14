const AnalysisSession = require('../models/AnalysisSession');
const Farmer = require('../models/Farmer');
exports.generateReport = async (req, res) => {
  try {
    const { sessionId, language, weather } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    const ScanSession = require('../models/ScanSession');
    let sessions = await AnalysisSession.find({ sessionId }).lean();
    if (!sessions || sessions.length === 0) {
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
    const diseases = sessions.flatMap(s => s.diseases || []);
    const infected = diseases.filter(d => {
      const sev = (d.severity || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return sev !== 'safe' && !name.includes('healthy') && !name.includes('no disease');
    });
    if (infected.length === 0) {
      return res.status(400).json({ error: 'No diseases found to report' });
    }
    const langKey = language ? language.toLowerCase() : 'english';
    let aiText = "AI-generated recommendations are currently unavailable. Please consult your local agronomist.";
    let nrsScore = "N/A";
    const sessionWithAdvice = sessions.find(s => s.aiAdvice && s.aiAdvice[langKey]);
    if (sessionWithAdvice) {
      aiText = sessionWithAdvice.aiAdvice[langKey];
      nrsScore = sessionWithAdvice.nrsScore || "N/A";
    }
    const humidity = weather?.relative_humidity_2m || '--';
    const temp = weather?.temperature_2m || '--';
    const riskLevel = nrsScore !== "N/A" && nrsScore >= 70 ? "CRITICAL RISK" : "MODERATE RISK";
    const diseaseListHtml = infected.map(d => 
      `<li style="margin-bottom: 8px; padding: 10px; background: #fff3f3; border-left: 4px solid #dc2626; border-radius: 4px;">
        <strong>${d.name.replace(/_/g, ' ')}</strong><br/>
        <span style="font-size: 12px; color: #666;">Severity: ${d.severity} | GPS: ${d.lat}, ${d.lon}</span>
      </li>`
    ).join('');
    // Build the HTML report instantly (0ms latency!) with a rich, dynamic layout
    const htmlOutput = `
      <div style="font-family: 'Inter', sans-serif; max-width: 800px; margin: auto; color: #1f2937;">
        <h2 style="color: #166534; border-bottom: 2px solid #166534; padding-bottom: 8px;">AeroGuard Precision Spray Report</h2>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <h3 style="margin-top: 0; color: #166534;">Field Health Analysis</h3>
          <p>Total Infected Plants Detected: <strong>${infected.length}</strong></p>
          <p>Live Weather Conditions: <strong>${temp}°C</strong> | <strong>${humidity}% Humidity</strong></p>
          <p>Neighborhood Risk Score (NRS): <strong style="color: ${nrsScore >= 70 ? '#dc2626' : '#ea580c'};">${nrsScore} / 100 (${riskLevel})</strong></p>
        </div>
        <h3 style="margin-top: 24px; color: #1f2937;">Precision Treatment Plan (Gemini AI)</h3>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-size: 16px; line-height: 1.6;">
          <strong>AI Agronomist Recommendation:</strong><br/>
          ${aiText}
        </div>
        <h3 style="margin-top: 24px; color: #1f2937;">Targeted Spray Coordinates</h3>
        <p style="font-size: 13px; color: #64748b;">Applying localized pesticide to these precise coordinates will reduce chemical usage by approximately 70% compared to blanket spraying.</p>
        <ul style="list-style-type: none; padding-left: 0;">
          ${diseaseListHtml}
        </ul>
      </div>
    `;
    return res.json({ html: htmlOutput });
  } catch (error) {
    console.error('AI Report Gen Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
