const mongoose = require('mongoose');
const batchSessionSchema = new mongoose.Schema(
  {
    batchId:      { type: String, required: true, unique: true, index: true },
    authSessionId:{ type: String, required: true },
    farmerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    farmerEmail:  { type: String, required: true },
    originalFileName: { type: String, default: '' },
    zipCloudUrl:      { type: String, default: null },
    totalImages:     { type: Number, default: 0 },
    processedImages: { type: Number, default: 0 },
    failedImages:    { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['queued', 'extracting', 'processing', 'syncing', 'completed', 'failed'],
      default: 'queued',
    },
    uploadIds: [{ type: String }],
    totalDetections: { type: Number, default: 0 },
    riskSummary:     { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { versionKey: false }
);
module.exports = mongoose.model('BatchSession', batchSessionSchema);
