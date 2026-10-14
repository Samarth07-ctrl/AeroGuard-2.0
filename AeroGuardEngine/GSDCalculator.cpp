#include "GSDCalculator.h"
#include <cmath>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

const double EARTH_RADIUS_M = 6378137.0;

GSDCalculator::GSDCalculator() {}

std::pair<double, double> GSDCalculator::calculateLatLong(double baseLat, double baseLong, int pixelOffsetX, int pixelOffsetY, double gsdMetersPerPixel) {
    double distanceX = static_cast<double>(pixelOffsetX) * gsdMetersPerPixel; 
    double distanceY = static_cast<double>(pixelOffsetY) * gsdMetersPerPixel; 

    double latOffsetRadians = distanceY / EARTH_RADIUS_M;
    
    double baseLatRadians = baseLat * (M_PI / 180.0);
    double lonOffsetRadians = distanceX / (EARTH_RADIUS_M * std::cos(baseLatRadians));

    double newLat = baseLat + (latOffsetRadians * (180.0 / M_PI));
    double newLong = baseLong + (lonOffsetRadians * (180.0 / M_PI));

    return {newLat, newLong};
}
