const express = require('express');
const farmerController = require('../controllers/farmerController');
const ScanSession = require('../models/ScanSession');
const router = express.Router();
router.post('/request-otp', farmerController.requestOtp);
router.post('/verify-otp',  farmerController.verifyOtp);
router.post('/verify-qr',   farmerController.verifyQr);
router.get('/debug-sessions', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email query param required' });
    const sessions = await ScanSession.find({
      farmerEmail: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).sort({ createdAt: -1 }).limit(10).lean();
    return res.json({
      email,
      count: sessions.length,
      sessions: sessions.map(s => ({
        sessionId:     s.sessionId,
        otpCode:       s.otpCode,
        qrToken:       s.qrToken,
        farmerEmail:   s.farmerEmail,
        isVerified:    s.isVerified,
        appLinkStatus: s.appLinkStatus,
        createdAt:     s.createdAt,
        ageMinutes:    Math.round((Date.now() - new Date(s.createdAt).getTime()) / 60000),
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
router.delete('/:email', farmerController.deleteFarmer);
router.get('/:email', async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const Farmer = require('../models/Farmer');
    const farmer = await Farmer.findOne({ email });
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    return res.json(farmer);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});
module.exports = router;
