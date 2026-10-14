#pragma once

struct GPSCoordinate {
    double latitude;
    double longitude;
};

class GeoMath {
public:
    GeoMath(double center_lat, double center_lon, double altitude_m, double fov_degrees);
    GPSCoordinate pixelToGPS(int x, int y, int image_width, int image_height);

private:
    double center_lat_;
    double center_lon_;
    double altitude_m_;
    double fov_degrees_;
};
