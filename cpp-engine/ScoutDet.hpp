#pragma once
#include <string>
#include <vector>
#include <memory>
#include <opencv2/opencv.hpp>
#include <onnxruntime_cxx_api.h>

struct BBox {
    int x;
    int y;
    int w;
    int h;
    float confidence;
};

class ScoutDet {
public:
    ScoutDet(const std::string& modelPath);
    std::vector<BBox> runInference(const cv::Mat& image);

private:
    Ort::Env env;
    Ort::SessionOptions sessionOptions;
    std::unique_ptr<Ort::Session> session;
};
