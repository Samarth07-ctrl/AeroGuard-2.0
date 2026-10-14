const crypto = require('crypto');
const Farmer = require('../models/Farmer');
const ScanSession = require('../models/ScanSession');
const { sendOtpEmail } = require('../services/mailer');
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = String(email).trim().toLowerCase();
    const sessionId  = crypto.randomBytes(16).toString('hex');
    const otpCode    = Math.floor(100000 + Math.random() * 900000).toString();
    const qrToken    = `aero-qr-${crypto.randomBytes(5).toString('hex')}`;
    await ScanSession.create({
      sessionId,
      farmerEmail:   normalizedEmail,
      otpCode,
      qrToken,
      appLinkStatus: 'pending_app_install',
      isVerified:    false,
      status:        'pending'
    });
    let emailStatus = 'sent';
    try {
      await sendOtpEmail(normalizedEmail, otpCode);
    } catch (mailErr) {
      emailStatus = 'skipped';
      console.warn(`[FARMER] Email not sent (${mailErr.message}) — session still created, QR available.`);
    }
    console.log(`\n=== DUAL HANDSHAKE TICKET ===`);
    console.log(`To:       ${normalizedEmail}`);
    console.log(`OTP:      ${otpCode}`);
    console.log(`QR Token: ${qrToken}`);
    console.log(`Session:  ${sessionId}`);
    console.log(`Email:    ${emailStatus}`);
    console.log(`=============================\n`);
    return res.status(200).json({
      message:     emailStatus === 'sent' ? 'OTP sent successfully' : 'Invite created (email not configured — use QR code)',
      sessionId,
      qrToken,
      otpCode,     
      emailStatus,
      email:       normalizedEmail
    });
  } catch (error) {
    console.error('[FARMER] request-otp error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, sessionId, qrToken } = req.body;
    if (qrToken && !otp) {
      console.log(`[VERIFY-OTP] QR token received, delegating to QR flow: ${qrToken}`);
      return exports.verifyQr(req, res);
    }
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedOtp   = String(otp).trim();
    console.log(`\n[VERIFY-OTP] ════════════════════════════════════════`);
    console.log(`  email     = "${normalizedEmail}"`);
    console.log(`  otp       = "${normalizedOtp}" (length=${normalizedOtp.length})`);
    console.log(`  sessionId = ${sessionId || '(none — mobile app flow)'}`);
    let scanSession;
    if (sessionId) {
      scanSession = await ScanSession.findOne({ sessionId, farmerEmail: normalizedEmail });
      if (!scanSession) {
        scanSession = await ScanSession.findOne({ sessionId });
        if (scanSession) {
          console.log(`  ⚠️  Found session by ID but farmerEmail="${scanSession.farmerEmail}" vs query="${normalizedEmail}"`);
        }
      }
    } else {
      scanSession = await ScanSession.findOne({
        farmerEmail: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        otpCode:     normalizedOtp,
        isVerified:  false,
      }).sort({ createdAt: -1 });
    }
    if (!scanSession) {
      const allSessions = await ScanSession.find({
        farmerEmail: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      }).sort({ createdAt: -1 }).limit(5).lean();
      console.log(`  ❌ No matching session found.`);
      console.log(`  📋 Recent sessions for this email (${allSessions.length}):`);
      for (const s of allSessions) {
        console.log(`     session=${s.sessionId.slice(0, 12)} otp_stored="${s.otpCode}" verified=${s.isVerified} age=${Math.round((Date.now() - new Date(s.createdAt).getTime()) / 60000)}min`);
      }
      if (allSessions.length === 0) {
        return res.status(404).json({ error: 'No invite found for this email. Ask the admin to send a new invite.' });
      }
      const allVerified = allSessions.every(s => s.isVerified);
      if (allVerified) {
        return res.status(409).json({ error: 'This session is already verified. You can proceed to upload.' });
      }
      const latestUnverified = allSessions.find(s => !s.isVerified);
      if (latestUnverified) {
        console.log(`  💡 Expected OTP: "${latestUnverified.otpCode}" but received: "${normalizedOtp}"`);
      }
      return res.status(401).json({ error: 'Invalid OTP. Please check the code and try again.' });
    }
    console.log(`  ✅ Session found: ${scanSession.sessionId.slice(0, 12)} otp_stored="${scanSession.otpCode}"`);
    const ageMs = Date.now() - new Date(scanSession.createdAt).getTime();
    const isExpired = ageMs > (30 * 60 * 1000);
    if (isExpired) {
      console.log(`  ❌ OTP expired (age=${Math.round(ageMs / 60000)}min)`);
      return res.status(410).json({ error: 'OTP expired. Please ask admin to send a new invite.' });
    }
    if (sessionId && scanSession.otpCode !== normalizedOtp) {
      console.log(`  ❌ OTP mismatch: stored="${scanSession.otpCode}" received="${normalizedOtp}"`);
      return res.status(401).json({ error: 'Invalid OTP' });
    }
    scanSession.isVerified    = true;
    scanSession.appLinkStatus = 'app_linked';
    await scanSession.save();
    let farmer = await Farmer.findOne({ email: normalizedEmail });
    if (!farmer) {
      farmer = await Farmer.create({
        farmerId:   `FARM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        email:      normalizedEmail,
        isVerified: true
      });
    } else if (!farmer.isVerified) {
      farmer.isVerified = true;
      await farmer.save();
    }
    console.log(`  ✅ VERIFIED ${normalizedEmail} session=${scanSession.sessionId.slice(0, 8)}`);
    console.log(`[VERIFY-OTP] ════════════════════════════════════════\n`);
    return res.status(200).json({
      success: true,
      message: 'Farmer verified successfully',
      sessionId: scanSession.sessionId,
      farmer: {
        id:         farmer._id,
        farmerId:   farmer.farmerId,
        email:      farmer.email,
        isVerified: farmer.isVerified
      }
    });
  } catch (error) {
    console.error('[FARMER] verify-otp error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
exports.verifyQr = async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ error: 'qrToken is required' });
    const scanSession = await ScanSession.findOne({ qrToken });
    if (!scanSession) return res.status(404).json({ error: 'Invalid or expired QR token' });
    const isExpired = Date.now() - new Date(scanSession.createdAt).getTime() > (30 * 60 * 1000);
    if (isExpired) return res.status(410).json({ error: 'QR token expired. Admin must generate a new invite.' });
    scanSession.isVerified    = true;
    scanSession.appLinkStatus = 'app_linked';
    await scanSession.save();
    let farmer = await Farmer.findOne({ email: scanSession.farmerEmail });
    if (!farmer) {
      farmer = await Farmer.create({
        farmerId:   `FARM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        email:      scanSession.farmerEmail,
        isVerified: true
      });
    } else if (!farmer.isVerified) {
      farmer.isVerified = true;
      await farmer.save();
    }
    console.log(`[QR] App linked for ${scanSession.farmerEmail} via QR scan`);
    return res.status(200).json({
      success:   true,
      message:   'App linked successfully via QR code',
      sessionId: scanSession.sessionId,
      farmer: {
        id:         farmer._id,
        farmerId:   farmer.farmerId,
        email:      farmer.email,
        isVerified: farmer.isVerified
      }
    });
  } catch (error) {
    console.error('[FARMER] verify-qr error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
exports.deleteFarmer = async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });
    console.log(`[FARMER] Hard deleting farmer and history for: ${email}`);
    const Farmer = require('../models/Farmer');
    const ScanSession = require('../models/ScanSession');
    const AnalysisSession = require('../models/AnalysisSession');
    const BatchSession = require('../models/BatchSession');
    await Farmer.deleteOne({ email });
    await ScanSession.deleteMany({ farmerEmail: email });
    await AnalysisSession.deleteMany({ farmerEmail: email });
    await BatchSession.deleteMany({ farmerEmail: email });
    return res.status(200).json({ success: true, message: 'Farmer and history deleted' });
  } catch (error) {
    console.error('[FARMER] delete error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
