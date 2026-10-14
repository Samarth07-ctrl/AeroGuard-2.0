const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.zip', '.jpg', '.jpeg', '.png', '.tiff', '.tif'];
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not supported.`), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, 
});
const uploadController  = require('../controllers/uploadController');
const batchController   = require('../controllers/batchController');
const webhookController = require('../controllers/webhookController');
const ScanSession       = require('../models/ScanSession');
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await ScanSession.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json(session);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/upload', upload.single('drone_data'), uploadController.uploadImage);
router.post(
  '/batch/upload',
  upload.any(),   
  batchController.uploadBatch
);
router.get('/batch/:batchId/progress', batchController.getBatchProgress);
router.get('/batch/:batchId/results',  batchController.getBatchResults);
router.post('/webhook/results', webhookController.handleResultsWebhook);
module.exports = router;
