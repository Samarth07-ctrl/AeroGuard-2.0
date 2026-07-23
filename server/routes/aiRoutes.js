const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/report', aiController.generateReport);

module.exports = router;
