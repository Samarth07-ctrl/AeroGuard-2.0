#include <iostream>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include <curl/curl.h>
#include <opencv2/opencv.hpp>

#include "ScoutDet.hpp"
#include "DoctorClassify.hpp"
#include "GeoMath.hpp"

using json = nlohmann::json;

static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

void fireWebhook(const std::string& payload) {
    CURL* curl;
    CURLcode res;
    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();
    if(curl) {
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        
        curl_easy_setopt(curl, CURLOPT_URL, "http://localhost:5000/api/webhook/results");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload.c_str());

        std::string response_string;
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response_string);

        res = curl_easy_perform(curl);
        if(res != CURLE_OK) {
            std::cerr << "[Webhook Error] curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;
        } else {
            std::cout << "[Webhook] Node.js Ack! Server replied: " << response_string << std::endl;
        }

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    curl_global_cleanup();
}

int main(int argc, char** argv) {
    if (argc < 3) {
        std::cerr << "Usage: ./aerovision_engine <session_id> <image_path>" << std::endl;
        return 1;
    }

    std::string session_id = argv[1];
    std::string image_path = argv[2];

    std::cout << "--- AeroVision C++ Dual-Stage AI Engine ---" << std::endl;
    std::cout << "Session ID: " << session_id << " | Image: " << image_path << std::endl;

    cv::Mat image = cv::imread(image_path);
    if (image.empty()) {
        std::cerr << "[Warning] Could not load raw image: " << image_path << ". Generating a mock 4K blank canvas." << std::endl;
        image = cv::Mat::zeros(2160, 3840, CV_8UC3); 
    }

    ScoutDet scout("weights/yolo11_scout.onnx");
    DoctorClassify doctor("weights/efficientnet_b0.onnx");
    
    GeoMath geoMath(18.520430, 73.856743, 85.0, 60.0); 

    std::cout << "\n>>> Phase 1: Scout YOLOv11 Engine Starting..." << std::endl;
    std::vector<BBox> detections = scout.runInference(image);

    json payload;
    payload["sessionId"] = session_id;
    json results_array = json::array();

    std::cout << "\n>>> Phase 2: Doctor Classification Engine Starting..." << std::endl;
    
    for (const auto& bbox : detections) {
        ClassificationResult cls = doctor.classifyCrop(image, bbox);
        
        int plant_px_x = bbox.x + (bbox.w / 2);
        int plant_px_y = bbox.y + (bbox.h / 2);

        GPSCoordinate gps = geoMath.pixelToGPS(plant_px_x, plant_px_y, image.cols, image.rows);

        json anomaly_item;
        anomaly_item["lat"] = gps.latitude;
        anomaly_item["long"] = gps.longitude;
        anomaly_item["disease"] = cls.disease_name;
        anomaly_item["severity"] = (cls.disease_name == "Healthy") ? "Low" : "High";
        anomaly_item["confidence"] = cls.confidence;
        
        results_array.push_back(anomaly_item);
    }

    payload["results"] = results_array;

    std::cout << "\n>>> Phase 3: Aggregating & Forwarding via libcurl..." << std::endl;
    
    std::string string_payload = payload.dump();
    std::cout << "[Engine Output Payload] " << string_payload << std::endl;
    
    fireWebhook(string_payload);

    std::cout << "--- AeroVision C++ Operations Completed Successfully ---" << std::endl;
    return 0;
}
