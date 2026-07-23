# 🛸 AeroVision — Drone-Based Crop Disease Detection System

> An end-to-end AI-powered platform that uses drone imagery, YOLO object detection, and GPS micro-mapping to detect plant diseases in real time and alert farmers.

---

## 📚 Table of Contents

1. [What is AeroVision?](#what-is-aerovision)
2. [How the System Works (Simple Explanation)](#how-the-system-works)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [Database Models](#database-models)
6. [All API Endpoints](#all-api-endpoints)
7. [Environment Setup](#environment-setup)
8. [Running the Project](#running-the-project)
9. [The C++ AI Engine Explained](#the-c-ai-engine-explained)
10. [Key Concepts for New Developers](#key-concepts-for-new-developers)

---

## What is AeroVision?

AeroVision is a **smart farming system** built for the MIT Hackathon. A drone flies over a farmer's field and takes photos. Those photos are sent to an AI engine that detects plant diseases. The results are shown on an interactive map so the farmer and agronomist can see exactly where diseases are spreading and what pesticide to use.

**The 3 big parts:**
- 🤖 **C++ AI Engine** — runs YOLO model on drone images, fires GPS-tagged disease alerts
- 🟢 **Node.js Server** — receives alerts, manages farmers, stores results in MongoDB
- ⚛️ **React Dashboard** — shows disease map, risk predictions, session history

---

## How the System Works

```
Step 1: Admin invites a farmer via email → farmer gets a 6-digit OTP + QR code
Step 2: Farmer scans QR (or enters OTP) on mobile app → session is "verified"
Step 3: Admin uploads drone image(s) to the dashboard
Step 4: Server saves image → starts C++ engine in background
Step 5: C++ engine loads YOLO model → slices image → runs disease detection
Step 6: Each disease found → C++ fires a webhook to /api/alerts with GPS coords
Step 7: Server passes the confidence gate (≥60%) → saves to MongoDB
Step 8: React dashboard polls /api/alerts → shows pins on live map
Step 9: Farmer's mobile app queries /api/farmer-detections → sees their results
```

---

## Project Structure

```
mit_Hacathon/
│
├── AeroVisionEngine/          # C++ YOLO inference engine
│   ├── main.cpp              # Entry point — loads model, runs inference, fires webhooks
│   ├── best.onnx             # Trained YOLOv8 model (10 disease classes)
│   ├── Slicer.cpp/.h         # SAHI image slicing (splits large drone images)
│   ├── GSDCalculator.cpp/.h  # GPS pixel-to-coordinate math
│   ├── WebhookClient.cpp/.h  # HTTP client that POSTs results to Node.js
│   ├── GSDCalculator.cpp/.h  # Converts pixel offset → real GPS offset
│   └── CMakeLists.txt        # Build configuration
│
├── cpp-engine/               # Alternate C++ engine (ScoutDet classifier)
│   ├── main.cpp
│   ├── ScoutDet.cpp/.hpp     # Detection module
│   ├── DoctorClassify.cpp    # Disease classification
│   └── GeoMath.cpp/.hpp      # Geospatial math
│
├── server/                   # Node.js Express backend
│   ├── server.js             # Main app — mounts all routes, alert endpoints
│   ├── controllers/
│   │   ├── authController.js      # Admin register/login
│   │   ├── farmerController.js    # OTP & QR verification
│   │   ├── uploadController.js    # Single image upload → starts C++ engine
│   │   ├── batchController.js     # Bulk ZIP/multi-image processing
│   │   ├── analysisController.js  # Query analysis sessions, map data, risk
│   │   ├── clusterController.js   # Spatial clustering of detections
│   │   ├── sessionController.js   # Session status helpers
│   │   └── webhookController.js   # Legacy C++ callback handler
│   ├── models/
│   │   ├── User.js            # Admin user model
│   │   ├── Farmer.js          # Farmer profile
│   │   ├── ScanSession.js     # OTP session (invite ticket)
│   │   ├── AnalysisSession.js # Per-image result with GPS diseases
│   │   └── BatchSession.js    # Multi-image batch metadata
│   ├── routes/
│   │   ├── index.js           # Upload & batch routes
│   │   ├── authRoutes.js      # /api/auth/*
│   │   ├── farmerRoutes.js    # /api/farmer/*
│   │   └── analysisRoutes.js  # /api/analysis-sessions/*
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT verification
│   ├── services/
│   │   └── mailer.js          # Nodemailer OTP email sender
│   ├── utils/
│   │   ├── extractGps.js      # EXIF GPS extractor (uses exifr)
│   │   ├── riskEngine.js      # Risk score calculator + bbox GPS offset
│   │   └── cloudinaryClient.js # Cloudinary image upload
│   └── Dockerfile
│
├── client/                   # React + Vite frontend
│   └── src/
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   └── dashboard/     # Main command center UI
│       ├── components/        # Reusable UI components
│       └── context/           # React context (auth state etc.)
│
├── dataset/                  # Training dataset (plant disease images)
├── docker-compose.yml        # Starts MongoDB + Node.js server
└── package.json              # Root workspace config
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI Engine** | C++17, OpenCV DNN, YOLOv8 ONNX, Exiv2 (EXIF GPS) |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose) |
| **Frontend** | React 19, Vite, TailwindCSS, Leaflet / Mapbox GL |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **File Upload** | Multer (disk storage, up to 500MB) |
| **Cloud Storage** | Cloudinary (image + ZIP archiving) |
| **Email** | Nodemailer (OTP delivery) |
| **Containerization** | Docker, Docker Compose |
| **Geospatial** | GeoJSON 2dsphere index, Haversine formula |
| **External API** | Open-Meteo (live humidity for risk prediction) |

---

## Database Models

### `ScanSession` — The Invite Ticket
Created when admin sends an OTP to a farmer. This is the **authentication session**.
```
sessionId     — unique hex ID
farmerEmail   — who was invited
otpCode       — 6-digit code (valid 30 min)
qrToken       — "aero-qr-xxxx" (alternative to OTP)
appLinkStatus — "pending_app_install" | "app_linked"
isVerified    — true after OTP/QR verified
status        — "pending" | "processing" | "completed"
uploadPath    — path of uploaded image
results[]     — array of {lat, long, disease, severity}
```

### `AnalysisSession` — The Per-Image Result
Created for **every image** processed. Stores GPS-tagged disease detections.
```
sessionId    — matches the uploadId from upload controller
batchId      — groups images from the same batch upload
farmerId     — ref to Farmer doc
farmerEmail  — denormalized (for fast mobile queries without joins)
imagePath    — local file path
imageUrl     — Cloudinary URL after upload
baseLat/Lon  — GPS coords from image EXIF (or Pune fallback)
gpsSource    — "exif" | "fallback"
location     — GeoJSON Point (for $near queries)
isVerified   — true once a disease passes confidence gate
diseases[]   — array of {name, severity, confidence, lat, lon, riskScore, riskRadius}
```

### `Farmer` — The Farmer Profile
Auto-created when OTP is first verified.
```
farmerId    — "FARM-XXXX" human-readable ID
email       — farmer's email
isVerified  — true after first OTP/QR verification
```

### `BatchSession` — Bulk Upload Tracker
Tracks multi-image or ZIP uploads.
```
batchId          — unique batch identifier
authSessionId    — the OTP sessionId that authorized this batch
farmerId         — ref to Farmer
farmerEmail      — denormalized
originalFileName — name of uploaded file/zip
totalImages      — how many images in the batch
processedImages  — counter
failedImages     — counter
totalDetections  — total disease hits
status           — "queued" | "processing" | "completed" | "failed"
uploadIds[]      — list of AnalysisSession IDs in this batch
zipCloudUrl      — Cloudinary URL of the original ZIP
```

### `User` (Admin)
```
email      — admin email (unique)
fcm_token  — Firebase Cloud Messaging token
name       — display name
```

---

## All API Endpoints

Base URL: `http://localhost:5000`

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | None | Register a new admin account |
| `POST` | `/api/auth/login` | None | Login, returns JWT token |

**POST `/api/auth/register`**
```json
// Request body
{ "email": "admin@aerovision.com", "password": "secret123", "name": "Admin" }

// Response 201
{ "message": "User registered successfully" }
```

**POST `/api/auth/login`**
```json
// Request body
{ "email": "admin@aerovision.com", "password": "secret123" }

// Response 200
{ "token": "eyJ...", "user": { "email": "...", "name": "..." } }
```

---

### 👨‍🌾 Farmer Onboarding — `/api/farmer`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/farmer/request-otp` | None | Admin sends OTP invite to farmer |
| `POST` | `/api/farmer/verify-otp` | None | Farmer verifies OTP (or QR token) |
| `POST` | `/api/farmer/verify-qr` | None | Farmer scans QR code to link app |
| `GET` | `/api/farmer/debug-sessions` | None | Debug: view OTP sessions for email |

**POST `/api/farmer/request-otp`**
```json
// Request body
{ "email": "farmer@gmail.com" }

// Response 200
{
  "message": "OTP sent successfully",
  "sessionId": "abc123...",
  "qrToken": "aero-qr-xxxx",
  "otpCode": "483921",
  "emailStatus": "sent"
}
```

**POST `/api/farmer/verify-otp`**
```json
// Flow 1: Admin dashboard (send sessionId)
{ "email": "farmer@gmail.com", "otp": "483921", "sessionId": "abc123..." }

// Flow 2: Mobile app (no sessionId needed)
{ "email": "farmer@gmail.com", "otp": "483921" }

// Response 200
{
  "success": true,
  "sessionId": "abc123...",
  "farmer": { "farmerId": "FARM-A1B2", "email": "farmer@gmail.com" }
}
```

**POST `/api/farmer/verify-qr`**
```json
// Request body
{ "qrToken": "aero-qr-a1b2c3d4e5" }

// Response 200
{ "success": true, "sessionId": "abc123...", "farmer": { ... } }
```

**GET `/api/farmer/debug-sessions?email=farmer@gmail.com`**
```json
// Response 200
{
  "email": "farmer@gmail.com",
  "count": 2,
  "sessions": [{ "sessionId": "...", "otpCode": "...", "isVerified": true, ... }]
}
```

---

### 📤 Upload — `/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/upload` | None | Upload single drone image |
| `POST` | `/api/batch/upload` | None | Upload ZIP or multiple images |
| `GET` | `/api/session/:sessionId` | None | Poll session status |
| `GET` | `/api/batch/:batchId/progress` | None | Poll batch processing progress |
| `GET` | `/api/batch/:batchId/results` | None | Get all results for a batch |
| `POST` | `/api/webhook/results` | None | Legacy C++ callback (batch complete) |

**POST `/api/upload`** *(multipart/form-data)*
```
Form fields:
  drone_data  — image file (.jpg, .jpeg, .png, .tiff)
  sessionId   — the verified OTP session ID
  farmerId    — (optional) farmer ID override

Response 200:
{
  "message": "Upload successful, processing started",
  "sessionId": "uploadId-hex...",
  "authSessionId": "otpSessionId...",
  "gps": { "lat": 18.5204, "lon": 73.8567, "source": "exif" }
}
```
> After responding, the server starts `AeroVisionEngine.exe` in the background.

**POST `/api/batch/upload`** *(multipart/form-data)*
```
Form fields:
  drone_data  — ZIP file OR multiple images (up to 200 files, 500MB max)
  sessionId   — verified OTP session ID

Response 202:
{
  "message": "Batch accepted — processing started",
  "batchId": "hex...",
  "totalImages": 12,
  "pollUrl": "/api/batch/<batchId>/progress"
}
```

**GET `/api/batch/:batchId/progress`**
```json
{
  "batchId": "...",
  "status": "processing",
  "totalImages": 12,
  "processedImages": 5,
  "totalDetections": 8,
  "currentFile": "DJI_0042.jpg",
  "message": "Processing image 6/12"
}
```

**GET `/api/batch/:batchId/results`**
```json
{
  "batchId": "...",
  "count": 12,
  "sessions": [ /* array of AnalysisSession objects */ ]
}
```

---

### 🚨 Alerts — `/api/alerts` (C++ Engine ↔ Server)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/alerts` | None | **C++ Engine** sends a disease detection |
| `GET` | `/api/alerts` | None | Frontend polls for live alerts |
| `GET` | `/api/alerts/history/:sessionId` | None | Get persisted alerts for a session |
| `DELETE` | `/api/alerts` | None | Clear all in-memory live alerts |
| `POST` | `/api/alerts/complete` | None | C++ engine signals session is done |

**POST `/api/alerts`** *(called by C++ engine, not the UI)*
```json
// Request body
{
  "sessionId": "uploadId-hex",
  "farmer_id": "FARMER-884A",
  "disease": "Powdery_Mildew",
  "severity": "High",
  "confidence": 0.82,
  "lat": 18.5210,
  "long": 73.8571,
  "pesticide": "Sulfur Dust Treatment",
  "bbox": { "x": 120, "y": 80, "w": 60, "h": 45 },
  "imgWidth": 640,
  "imgHeight": 640
}

// Iron Gate: passes only if confidence >= 0.60 OR severity is "High"/"Severe"
// Response 200: { "message": "Alert accepted." }
// Response 200: { "message": "Detection filtered by confidence gate." }
```

**GET `/api/alerts?sessionId=xxx`**
```json
// Response 200 — merged in-memory + DB results
[
  {
    "sessionId": "...",
    "disease": "Powdery_Mildew",
    "severity": "High",
    "lat": 18.521,
    "long": 73.857,
    "pesticide": "Sulfur Dust Treatment",
    "timestamp": "2026-05-16T13:00:00.000Z"
  }
]
```

**POST `/api/alerts/complete`**
```json
// Called by C++ when it finishes processing an image
{ "sessionId": "uploadId-hex" }

// If zero diseases passed the gate, saves a "Healthy Field" sentinel
// Response 200: { "message": "Session marked complete." }
```

---

### 🌍 Workspaces & Mobile — `/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/workspaces` | None | All verified sessions (dashboard recovery) |
| `GET` | `/api/farmer-detections` | None | Mobile app: all detections for a farmer |
| `GET` | `/api/clusters/:sessionId` | None | Spatial clustering for a session |

**GET `/api/workspaces`**
```json
[
  {
    "email": "farmer@gmail.com",
    "sessionId": "abc123...",
    "verifiedAt": "2026-05-16T10:00:00Z",
    "qrToken": "aero-qr-...",
    "appLinkStatus": "app_linked"
  }
]
```

**GET `/api/farmer-detections?email=farmer@gmail.com`**
```json
{
  "email": "farmer@gmail.com",
  "count": 3,
  "detections": [
    {
      "sessionId": "...",
      "disease": "Tar_Spot",
      "severity": "High",
      "confidence": 0.87,
      "lat": 18.521,
      "lon": 73.857,
      "riskScore": 74,
      "riskRadius": 198,
      "spreadRadius": 198,
      "createdAt": "..."
    }
  ]
}
```

---

### 📊 Analysis Sessions — `/api/analysis-sessions`

All routes except farmer lookup require **JWT Bearer token** in `Authorization` header.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analysis-sessions/` | ✅ JWT | All sessions (admin view) |
| `GET` | `/api/analysis-sessions/farmer/:email` | None | All sessions for one farmer |
| `GET` | `/api/analysis-sessions/session/:sessionId` | None | Sessions for an OTP session |
| `GET` | `/api/analysis-sessions/map-data` | ✅ JWT | Map pin data (lat/lon/disease) |
| `GET` | `/api/analysis-sessions/risk-prediction` | ✅ JWT | AI risk spread prediction |
| `GET` | `/api/map-data` | ✅ JWT | Alias (same as above) |
| `GET` | `/api/risk-prediction` | ✅ JWT | Alias (same as above) |

**GET `/api/analysis-sessions/map-data`**
```json
[
  {
    "sessionId": "...",
    "farmerEmail": "farmer@gmail.com",
    "disease": "Black_knot",
    "severity": "Severe",
    "lat": 18.521,
    "lon": 73.857,
    "createdAt": "..."
  }
]
```

**GET `/api/analysis-sessions/risk-prediction`**
```json
{
  "humidity": 78,
  "zones": [
    {
      "sourceSessionId": "...",
      "disease": "Powdery_Mildew",
      "catalyst": "High Humidity",
      "humidity": 78,
      "distanceKm": 3.5,
      "radiusKm": 5,
      "lat": 18.525,
      "lon": 73.862,
      "riskScore": 83,
      "message": "Warning: Farms near [18.5250, 73.8620] are at 83% risk..."
    }
  ]
}
```

---

## Environment Setup

### Server `.env` (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aerovision
JWT_SECRET=your_jwt_secret_here

# Email (Nodemailer) — optional, QR code works without it
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary — for image archiving
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Client `.env` (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## Running the Project

### Option A: Docker (Recommended — MongoDB + Server)
```bash
# Start MongoDB and the Node.js server
docker-compose up --build

# Server runs on: http://localhost:5000
# MongoDB runs on: localhost:27017
```

### Option B: Manual (Development)

**1. Start MongoDB** (install locally or use MongoDB Atlas)

**2. Start the Node.js server**
```bash
cd server
npm install
npm run dev       # uses nodemon for hot reload
# OR
npm start         # plain node
```

**3. Start the React client**
```bash
cd client
npm install
npm run dev       # starts Vite dev server on http://localhost:5173
```

**4. Build the C++ Engine** (Windows, requires CMake + vcpkg)
```bash
cd AeroVisionEngine
mkdir build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=../../vcpkg/scripts/buildsystems/vcpkg.cmake
cmake --build . --config Release
# Produces: build/Release/AeroVisionEngine.exe
```

**5. Run the C++ engine manually** (for testing)
```bash
cd AeroVisionEngine
.\build\Release\AeroVisionEngine.exe "C:\path\to\image.jpg" "your-session-id"
```

---

## The C++ AI Engine Explained

The engine (`AeroVisionEngine/main.cpp`) does the following for each image:

1. **Loads YOLO** — reads `best.onnx` (trained on 10 plant disease classes)
2. **Reads EXIF GPS** — extracts real drone GPS from image metadata. Falls back to Pune coords (18.5204, 73.8567) if no EXIF found
3. **SAHI Slicing** — splits large drone images into 640×640 overlapping tiles (20% overlap) for better small-object detection
4. **Inference** — runs each tile through YOLOv8 with NMS (Non-Maximum Suppression)
5. **GSD Mapping** — converts each bounding box pixel offset to real GPS coordinates (assumes 5cm/pixel = drone at ~30m altitude)
6. **Severity grading** — confidence ≥ 0.8 → Severe, ≥ 0.6 → High, ≥ 0.4 → Medium, else Low
7. **Webhook** — fires `POST /api/alerts` to Node.js for every detection

### Detectable Diseases (10 classes)
| Class | Pesticide |
|-------|-----------|
| Black_knot | Captan Fungicide |
| Chlorosis | Iron Chelate Supplement |
| Dog_vomit_slime_mold | Potassium Bicarbonate |
| Elderberry_rust | Mancozeb Spray |
| Golden_canker | Copper Hydroxide |
| Gymnosporangium_Rusts | Myclobutanil Fungicide |
| Powdery_Mildew | Sulfur Dust Treatment |
| Sooty_Mold | Neem Oil Application |
| Tar_Spot | Propiconazole Spray |
| Peach_leaf_curl | Chlorothalonil Fungicide |

---

## Key Concepts for New Developers

### 🔑 Two Types of Session IDs
- **`authSessionId` / `sessionId` (OTP session)** — created when admin invites a farmer. Used for authentication.
- **`uploadId`** — created fresh for every image upload. This is what `AnalysisSession` and the C++ engine use. They are **different IDs**.

### 🚦 The Iron Gate (Confidence Filter)
Every webhook from C++ is checked:
- If `confidence >= 0.60` → let it through
- If `severity == "High"` or `"Severe"` → let it through regardless of confidence
- Otherwise → silently dropped (returns 200 but doesn't save)

This prevents noisy low-confidence detections from polluting the map.

### 🗺️ Micro-GPS (BBox Offset)
When a disease is detected inside a 640×640 image tile, its pixel position is converted to a real-world GPS offset using:
- The image's base GPS (from EXIF)
- The bounding box center pixel
- Ground Sample Distance (GSD = 5cm/pixel at 30m altitude)

This means every disease pin on the map points to its **actual location in the field**, not just the drone's flight path point.

### 🌊 Risk Prediction
Uses **Open-Meteo API** for live humidity. High-severity detections are treated as "seed points" and projected outward using the Haversine formula to predict which nearby farms might be affected within 48 hours. Risk score (0–100) increases with humidity and proximity to known hotspots.

### 💊 Session Isolation
Each time the C++ engine finishes an image, it calls `POST /api/alerts/complete`. If zero detections passed the gate, the server saves a **"Healthy Field / No Anomalies Found"** sentinel so the History page always shows a result row — never a blank.

### 📱 Mobile App Integration
The mobile app (separate repo) can:
1. Verify farmer identity via `POST /api/farmer/verify-otp` or `POST /api/farmer/verify-qr`
2. Fetch all their detections via `GET /api/farmer-detections?email=...`
3. See nearby disease clusters using `GET /api/clusters/:sessionId`

The `farmerEmail` field is **denormalized** (copied) into every `AnalysisSession` so the mobile app can query with a single indexed field — no database joins needed.

---

## Quick Reference: Endpoint Summary

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Farmer | `POST /api/farmer/request-otp`, `POST /api/farmer/verify-otp`, `POST /api/farmer/verify-qr` |
| Upload | `POST /api/upload`, `POST /api/batch/upload` |
| Batch | `GET /api/batch/:id/progress`, `GET /api/batch/:id/results` |
| Alerts | `POST /api/alerts`, `GET /api/alerts`, `GET /api/alerts/history/:id`, `POST /api/alerts/complete`, `DELETE /api/alerts` |
| Workspaces | `GET /api/workspaces`, `GET /api/clusters/:sessionId` |
| Mobile | `GET /api/farmer-detections?email=...` |
| Analysis | `GET /api/analysis-sessions/`, `GET /api/analysis-sessions/farmer/:email` |
| Map/Risk | `GET /api/map-data`, `GET /api/risk-prediction` |
| Session | `GET /api/session/:sessionId` |

---

*Built for MIT Hackathon — AeroVision Team*
