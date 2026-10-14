function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; 
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function calculateRiskScore(distanceKm, humidity) {
  const cappedDistance = Math.max(0, Math.min(5, distanceKm));
  const distanceFactor = 1 - (cappedDistance / 5); 
  const humidityFactor = Math.max(0, Math.min(1, Number(humidity || 0) / 100));
  const score = ((distanceFactor * 0.65) + (humidityFactor * 0.35)) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}
function destinationPoint(lat, lon, bearingDeg, distanceKm) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const brng = toRad(bearingDeg);
  const dByR = distanceKm / R;
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) +
    Math.cos(lat1) * Math.sin(dByR) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(dByR) * Math.cos(lat1),
    Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2)
  );
  return { lat: toDeg(lat2), lon: toDeg(lon2) };
}
function applyBboxOffset(baseLat, baseLon, bbox, imgW = 640, imgH = 640) {
  if (!bbox || !Array.isArray(bbox) || bbox.length < 4) {
    return { lat: baseLat, lon: baseLon };
  }
  let [bx, by, bw, bh] = bbox.map(Number);
  if (bx <= 1 && by <= 1 && bw <= 1 && bh <= 1) {
    bx *= imgW;
    by *= imgH;
    bw *= imgW;
    bh *= imgH;
  }
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const dx = cx - imgW / 2;
  const dy = cy - imgH / 2;
  const DEG_PER_PX = 0.00001;
  const shiftedLat = baseLat - dy * DEG_PER_PX; 
  const shiftedLon = baseLon + dx * DEG_PER_PX;
  return {
    lat: Number(shiftedLat.toFixed(7)),
    lon: Number(shiftedLon.toFixed(7)),
  };
}
module.exports = {
  haversineDistanceKm,
  calculateRiskScore,
  destinationPoint,
  applyBboxOffset,
};
