const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    farmerId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    isVerified: { type: Boolean, default: false },
    lastLat: { type: Number, default: 18.5204 }, // Defaults to Pune
    lastLon: { type: Number, default: 73.8567 }  // Defaults to Pune
  },
  { timestamps: true }
);

module.exports = mongoose.model('Farmer', farmerSchema);
