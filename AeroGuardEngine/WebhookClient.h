#pragma once
#include <string>

class WebhookClient {
private:
    std::string serverUrl;

public:
    WebhookClient(const std::string& url);

    bool sendAlert(const std::string& sessionId,
                   const std::string& farmerId,
                   const std::string& disease, 
                   double lat, 
                   double lon, 
                   const std::string& severity, 
                   const std::string& pesticide,
                   float confidence);
};
