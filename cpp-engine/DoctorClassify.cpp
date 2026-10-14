#include "DoctorClassify.hpp"
#include <iostream>

DoctorClassify::DoctorClassify(const std::string& modelPath) 
    : env(ORT_LOGGING_LEVEL_WARNING, "DoctorClassify") {
    std::cout << "[Doctor] EfficientNet Model loaded (Mock) from " << modelPath << std::endl;
}

ClassificationResult DoctorClassify::classifyCrop(const cv::Mat& original_image, const BBox& bbox) {
    cv::Rect crop_region(bbox.x, bbox.y, bbox.w, bbox.h);
    
    crop_region &= cv::Rect(0, 0, original_image.cols, original_image.rows);
    
    cv::Mat crop = original_image(crop_region);
    
    cv::Mat resized_crop;
    if (!crop.empty()) {
        cv::resize(crop, resized_crop, cv::Size(224, 224));
    }

    std::cout << "[Doctor] Cropped and resized region at (" << bbox.x << ", " << bbox.y << ")" << std::endl;
    
    ClassificationResult result;
    if (bbox.x > 1500) {
        result.disease_name = "Yellow Rust";
        result.confidence = 0.95f;
    } else {
        result.disease_name = "Healthy";
        result.confidence = 0.89f;
    }

    std::cout << "[Doctor] Classification Output: " << result.disease_name << " (" << result.confidence * 100 << "%)" << std::endl;
    return result;
}
