#pragma once
#include <utility>

class GSDCalculator {
public:
    GSDCalculator();
    std::pair<double, double> calculateLatLong(double baseLat, double baseLong, int pixelOffsetX, int pixelOffsetY, double gsdMetersPerPixel);
};
