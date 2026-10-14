const mongoose = require('mongoose');
const diseaseSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    severity:     { type: String, required: true, trim: true },
    confidence:   { type: Number, default: null },
    lat:          { type: Number, default: null },
    lon:          { type: Number, default: null },
    riskRadius:   { type: Number, default: null },
    riskScore:    { type: Number, default: null },
    spreadRadius: { type: Number, default: null },
  },
  { _id: false }
);
const analysisSessionSchema = new mongoose.Schema(
  {
    sessionId:   { type: String, required: true, trim: true, unique: true, index: true },
    batchId:     { type: String, default: null, index: true },
    farmerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    farmerEmail: { type: String, default: '', trim: true, lowercase: true, index: true },
    imagePath:   { type: String, required: true, trim: true },
    imageUrl:    { type: String, default: null },
    baseLat:     { type: Number, default: 18.5204 },
    baseLon:     { type: Number, default: 73.8567 },
    gpsSource:   { type: String, enum: ['exif', 'fallback'], default: 'fallback' },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [73.8567, 18.5204] },
    },
    isVerified:  { type: Boolean, default: false },
    diseases:    { type: [diseaseSchema], default: [] },
    aiAdvice: {
      english: { type: String, default: null },
      hindi: { type: String, default: null },
      marathi: { type: String, default: null }
    },
    weatherPrecautions: { type: String, default: null },
    nrsScore:    { type: Number, default: null },
    createdAt:   { type: Date, default: Date.now },
  },
  { versionKey: false }
);
analysisSessionSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('AnalysisSession', analysisSessionSchema);
