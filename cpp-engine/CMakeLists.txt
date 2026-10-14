cmake_minimum_required(VERSION 3.14)
project(AeroVisionEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(OpenCV REQUIRED)

find_package(onnxruntime QUIET)
if (NOT onnxruntime_FOUND)
    message(WARNING "onnxruntime not found via find_package. Using manual link if needed. Ensure it is installed.")
endif()

find_package(CURL REQUIRED)

include(FetchContent)
FetchContent_Declare(json
  URL https://github.com/nlohmann/json/releases/download/v3.11.2/json.tar.xz
)
FetchContent_MakeAvailable(json)

add_executable(aeroguard_engine
    main.cpp
    ScoutDet.cpp
    DoctorClassify.cpp
    GeoMath.cpp
)

target_link_libraries(aeroguard_engine
    PRIVATE
    ${OpenCV_LIBS}
    ${CURL_LIBRARIES}
    nlohmann_json::nlohmann_json
)

if (onnxruntime_FOUND)
    target_link_libraries(aeroguard_engine PRIVATE onnxruntime::onnxruntime)
else()
    target_link_libraries(aeroguard_engine PRIVATE onnxruntime)
endif()
