#pragma once
#include <opencv2/opencv.hpp>
#include <vector>

class Slicer {
public:
    Slicer();
    std::vector<cv::Rect> getSlices(const cv::Mat& image, int sliceWidth, int sliceHeight, double overlap);
};
