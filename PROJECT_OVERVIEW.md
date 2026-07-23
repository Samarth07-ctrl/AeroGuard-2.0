# AeroVision - Complete Project Overview

## 🌾 What is AeroVision?

AeroVision is an **AI-powered agricultural disease detection system** that uses drone imagery to identify plant diseases and help farmers protect their crops. Think of it as a "smart doctor for plants" that can analyze thousands of acres in minutes.

### The Problem It Solves
- **Manual crop inspection is slow** - A farmer can only check a few acres per day on foot
- **Disease spreads fast** - By the time you see symptoms, it might be too late
- **Expertise shortage** - Not every farmer knows how to identify all plant diseases
- **Economic impact** - Crop diseases cause billions in losses worldwide

### The Solution
- **Drone surveillance** - Cover hundreds of acres in one flight
- **AI detection** - Instantly identify diseases from aerial photos
- **Real-time alerts** - Get notifications the moment diseases are detected
- **Precision mapping** - Know exactly where the problems are
- **Treatment recommendations** - Get specific pesticide suggestions

---

## 🏗️ System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DRONE LAYER   │    │   WEB PLATFORM  │    │  AI/ML ENGINE   │
│                 │    │                 │    │                 │
│ • Capture Images│───▶│ • Upload Portal │───▶│ • YOLO Detection│
│ • GPS Metadata  │    │ • Farmer Portal │    │ • C++ Processing│
│ • Batch Upload  │    │ • Admin Dashboard│    │ • Confidence Gate│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   DATABASE      │              │
         │              │                 │              │
         └──────────────▶│ • MongoDB       │◀─────────────┘
                        │ • Farmer Data   │
                        │ • Disease Records│
                        │ • GPS Coordinates│
                        └─────────────────┘
```

---

## 🛠️ Technology Stack Breakdown

### Frontend (Client) - React.js Application
**Location:** `/client/` folder

#### Core Technologies:
- **React 18** - Modern JavaScript UI framework
- **Vite** - Fast build tool and development server
- **React Router** - Navigation between pages
- **Axios** - HTTP client for API calls
- **Tailwind CSS** - Utility-first CSS framework

#### Key Libraries:
- **Leaflet** - Interactive maps for disease visualization
- **Lucide React** - Beautiful icons
- **React QR Code** - QR code generation for farmer invites

#### File Structure:
```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AuthOverlay.jsx     # Login/Register forms
│   │   ├── Dashboard.jsx       # Main dashboard layout
│   │   └── ProtectedRoute.jsx  # Route authentication
│   ├── pages/               # Full page components
│   │   ├── dashboard/          # Admin dashboard pages
│   │   │   ├── DashboardHome.jsx    # Farmer management
│   │   │   ├── FarmerWorkspace.jsx  # Individual farmer view
│   │   │   ├── MapPage.jsx          # Global disease map
│   │   │   └── HistoryPage.jsx      # Upload history
│   │   ├── LandingPage.jsx     # Public homepage
│   │   └── LoginPage.jsx       # Authentication
│   ├── context/             # React Context for state
│   │   ├── AuthContext.jsx     # User authentication state
│   │   └── FarmerContext.jsx   # Farmer session management
│   └── assets/              # Images and static files
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

---

### Backend (Server) - Node.js API
**Location:** `/server/` folder

#### Core Technologies:
- **Node.js** - JavaScript runtime for server
- **Express.js** - Web framework for APIs
- **MongoDB** - NoSQL database for flexible data storage
- **Mongoose** - MongoDB object modeling
- **Multer** - File upload handling

#### Key Features:
- **RESTful API** - Clean HTTP endpoints
- **JWT Authentication** - Secure user sessions
- **File Processing** - Handle image and ZIP uploads
- **Real-time Updates** - Polling-based live data
- **Email Integration** - OTP delivery system

#### File Structure:
```
server/
├── controllers/             # Business logic
│   ├── authController.js       # User login/register
│   ├── farmerController.js     # Farmer invites & OTP
│   ├── uploadController.js     # Single image uploads
│   ├── batchController.js      # ZIP/bulk uploads
│   ├── analysisController.js   # Disease data retrieval
│   ├── clusterController.js    # Spatial clustering
│   └── webhookController.js    # C++ engine callbacks
├── models/                  # Database schemas
│   ├── User.js                 # Admin users
│   ├── Farmer.js               # Farmer accounts
│   ├── ScanSession.js          # OTP sessions
│   ├── AnalysisSession.js      # Individual image analysis
│   └── BatchSession.js         # Bulk upload tracking
├── routes/                  # API endpoints
│   ├── authRoutes.js           # /api/auth/*
│   ├── farmerRoutes.js         # /api/farmer/*
│   └── analysisRoutes.js       # /api/analysis-sessions/*
├── middleware/              # Request processing
│   └── authMiddleware.js       # JWT token validation
├── services/                # External integrations
│   └── mailer.js               # Email sending
├── utils/                   # Helper functions
│   ├── extractGps.js           # EXIF GPS extraction
│   ├── riskEngine.js           # Disease spread calculations
│   └── cloudinaryClient.js     # Image cloud storage
├── scripts/                 # Maintenance tools
│   ├── diagnose-database.js    # Database health check
│   └── migrate-farmer-email.js # Data migration
└── server.js               # Main application entry
```

---

### AI/ML Engine - C++ YOLO Detection
**Location:** `/AeroVisionEngine/` and `/cpp-engine/` folders

#### Core Technologies:
- **C++** - High-performance image processing
- **YOLO (You Only Look Once)** - Real-time object detection
- **ONNX Runtime** - Cross-platform ML inference
- **OpenCV** - Computer vision library
- **CMake** - Build system

#### Pre-trained Models:
- **yolo11n.pt** - Latest YOLO model
- **yolov8n.pt** - Backup model
- **best.onnx** - Custom-trained disease detection model

#### Detection Process:
1. **Image Input** - Receives drone photo path
2. **Preprocessing** - Resize, normalize image
3. **AI Inference** - Run through YOLO model
4. **Post-processing** - Filter detections by confidence
5. **Webhook Callback** - Send results to Node.js server

#### Supported Diseases:
- Powdery Mildew
- Black Knot
- Sooty Mold
- Chlorosis
- Gymnosporangium Rusts
- Golden Canker
- Dog Vomit Slime Mold
- And more...

---

### Database - MongoDB
**Location:** Cloud or local MongoDB instance

#### Collections (Tables):

##### 1. **farmers** - Farmer Accounts
```javascript
{
  _id: ObjectId,
  farmerId: "FARM-A1B2C3D4",     // Unique farmer ID
  email: "farmer@example.com",    // Contact email
  isVerified: true,               // Account status
  createdAt: Date,
  updatedAt: Date
}
```

##### 2. **scansessions** - OTP Authentication
```javascript
{
  _id: ObjectId,
  sessionId: "abc123...",         // Unique session ID
  farmerEmail: "farmer@example.com",
  otpCode: "123456",              // 6-digit verification code
  qrToken: "aero-qr-xyz...",      // QR code token
  isVerified: true,               // OTP verified status
  appLinkStatus: "app_linked",    // Mobile app connection
  status: "completed",            // Upload status
  createdAt: Date
}
```

##### 3. **analysissessions** - Individual Image Analysis
```javascript
{
  _id: ObjectId,
  sessionId: "def456...",         // Unique per image
  batchId: "batch789...",         // Groups ZIP images
  farmerId: ObjectId,             // Reference to farmer
  farmerEmail: "farmer@example.com", // Denormalized for speed
  imagePath: "uploads/image.jpg", // Local file path
  imageUrl: "https://cloudinary...", // Cloud URL
  baseLat: 18.5204,              // GPS coordinates
  baseLon: 73.8567,
  gpsSource: "exif",             // "exif" or "fallback"
  location: {                    // GeoJSON for spatial queries
    type: "Point",
    coordinates: [73.8567, 18.5204]
  },
  diseases: [{                   // Detected diseases
    name: "Powdery_Mildew",
    severity: "High",
    confidence: 0.85,
    lat: 18.5204,
    lon: 73.8567,
    riskScore: 75,
    riskRadius: 150
  }],
  isVerified: true,              // Has diseases
  createdAt: Date
}
```

##### 4. **batchsessions** - ZIP Upload Tracking
```javascript
{
  _id: ObjectId,
  batchId: "batch789...",        // Unique batch ID
  authSessionId: "abc123...",    // Links to OTP session
  farmerId: ObjectId,
  farmerEmail: "farmer@example.com",
  originalFileName: "scan_data.zip",
  totalImages: 10,               // Images in ZIP
  processedImages: 10,           // Successfully processed
  failedImages: 0,               // Failed to process
  status: "completed",           // Processing status
  uploadIds: ["def456...", ...], // All image session IDs
  totalDetections: 25,           // Total diseases found
  createdAt: Date,
  completedAt: Date
}
```

---

## 🔄 Data Flow Walkthrough

### 1. **Farmer Invitation Process**

```
Admin Dashboard → Invite Farmer → Email + QR Code → Farmer Verification
```

**Step by Step:**
1. **Admin enters farmer email** in dashboard
2. **Server generates OTP + QR token** (`farmerController.js`)
3. **Email sent with 6-digit code** (`mailer.js`)
4. **QR code displayed** for mobile app scanning
5. **Farmer verifies** via OTP or QR scan
6. **Farmer account created** in database

### 2. **Image Upload Process**

```
Farmer Upload → File Processing → AI Analysis → Disease Detection → Map Display
```

**Single Image Upload:**
1. **Farmer selects image** in workspace
2. **Frontend uploads to `/api/upload`** (`uploadController.js`)
3. **Server saves file** and creates `AnalysisSession`
4. **C++ engine called** with image path
5. **AI processes image** and detects diseases
6. **Results sent via webhook** to `/api/alerts`
7. **Database updated** with disease data
8. **Frontend polls** and displays results

**ZIP Batch Upload:**
1. **Farmer uploads ZIP** to `/api/batch/upload`
2. **Server extracts images** (`batchController.js`)
3. **Creates BatchSession** for tracking
4. **Processes each image sequentially** (GPU safety)
5. **Updates progress** in real-time
6. **Calculates spatial clusters** after completion
7. **All images appear** in farmer workspace

### 3. **Disease Detection Process**

```
Image → YOLO Model → Confidence Filter → GPS Mapping → Risk Calculation
```

**AI Pipeline:**
1. **Image preprocessing** - Resize to 640x640
2. **YOLO inference** - Detect disease bounding boxes
3. **Confidence gate** - Only keep detections >60%
4. **GPS extraction** - Read coordinates from EXIF data
5. **Micro-GPS offset** - Apply bounding box positioning
6. **Risk scoring** - Calculate spread probability
7. **Database storage** - Save all detection data

### 4. **Real-time Updates**

```
Database Changes → Polling → Frontend Updates → Map Refresh
```

**Update Mechanism:**
1. **Frontend polls every 4 seconds** for new data
2. **Server queries database** for farmer-specific data
3. **New detections appear** automatically
4. **Maps update** with new markers
5. **Clusters recalculate** based on proximity
6. **Alerts show** in live feed

---

## 🗺️ User Interface Breakdown

### Admin Dashboard
**Purpose:** Manage multiple farmers and view global data

#### Pages:
1. **Command Center** (`DashboardHome.jsx`)
   - Invite new farmers
   - Manage active workspaces
   - View farmer status (app linked/pending)

2. **Global Map** (`MapPage.jsx`)
   - See all farmers' disease detections
   - Risk prediction zones
   - Weather integration

3. **History** (`HistoryPage.jsx`)
   - All uploaded images across farmers
   - Disease detection results
   - Upload timestamps

### Farmer Workspace
**Purpose:** Individual farmer's disease monitoring interface

#### Features:
1. **Drone Dock** - Upload images/ZIP files
2. **Weather Intel** - Live weather + fungal risk
3. **Live Alert Feed** - Real-time disease detections
4. **Tactical Map** - Spatial clusters and quarantine zones

#### Map Features:
- **Disease markers** - Color-coded by severity
- **Infection zones** - Red boxes around diseased areas
- **Quarantine perimeters** - Orange dashed boundaries
- **Adaptive sizing** - Expands based on humidity

---

## 🔧 Key Algorithms & Features

### 1. **Spatial Clustering Algorithm**
**File:** `server/controllers/clusterController.js`

**Purpose:** Group nearby disease detections into manageable zones

**Algorithm:**
```javascript
// DBSCAN-like clustering
function clusterPoints(points, radiusMeters = 100) {
  // 1. For each disease detection point
  // 2. Find all neighbors within 100m radius
  // 3. Group connected neighbors into clusters
  // 4. Calculate infection zone boundaries
  // 5. Expand quarantine perimeter based on humidity
}
```

**Output:**
- **Infection zones** - Tight boundaries around diseased plants
- **Quarantine perimeters** - Expanded safety zones
- **Risk scores** - Probability of disease spread

### 2. **GPS Extraction System**
**File:** `server/utils/extractGps.js`

**Purpose:** Get precise coordinates from drone images

**Process:**
```javascript
// 1. Read EXIF metadata from image
// 2. Extract GPS coordinates if available
// 3. Convert to decimal degrees
// 4. Fallback to Pune coordinates if missing
// 5. Apply micro-GPS offset based on detection bounding box
```

**Accuracy:** Sub-meter precision for disease location

### 3. **Risk Engine**
**File:** `server/utils/riskEngine.js`

**Purpose:** Calculate disease spread probability

**Factors:**
- **Distance** - Closer diseases = higher risk
- **Humidity** - >70% = rapid spread
- **Wind patterns** - Directional spread modeling
- **Plant density** - More plants = faster transmission

### 4. **Confidence Gate System**
**File:** `server/server.js` (webhook handler)

**Purpose:** Filter out false positive detections

**Rules:**
```javascript
// Only accept detections if:
// 1. Confidence >= 60% OR
// 2. Severity is "High" or "Severe"
// This prevents noise while catching critical diseases
```

---

## 🔐 Security & Authentication

### Multi-Level Security:
1. **Admin Authentication** - JWT tokens for dashboard access
2. **Farmer Verification** - OTP + QR code system
3. **Session Management** - Temporary upload permissions
4. **File Validation** - Only accept image/ZIP files
5. **Input Sanitization** - Prevent injection attacks

### Data Privacy:
- **Farmer isolation** - Each farmer only sees their data
- **Secure file storage** - Cloudinary integration
- **GPS anonymization** - Coordinates rounded for privacy

---

## 🚀 Deployment & Scaling

### Current Setup:
- **Frontend:** Vite development server
- **Backend:** Node.js Express server
- **Database:** Local/Cloud MongoDB
- **AI Engine:** Local C++ executable
- **File Storage:** Local uploads + Cloudinary

### Production Considerations:
- **Docker containers** for consistent deployment
- **Load balancing** for multiple farmers
- **CDN integration** for image delivery
- **GPU clusters** for AI processing
- **Database sharding** for large datasets

---

## 🐛 Common Issues & Solutions

### 1. **Images Not Appearing in Farmer Workspace**
**Cause:** Missing `farmerEmail` field in database
**Solution:** Run migration script
```bash
node server/scripts/migrate-farmer-email.js
```

### 2. **C++ Engine Not Responding**
**Cause:** Model files missing or GPU issues
**Solution:** Check model paths and dependencies

### 3. **GPS Coordinates Wrong**
**Cause:** EXIF data missing from images
**Solution:** System falls back to default coordinates

### 4. **Upload Fails**
**Cause:** File size limits or format issues
**Solution:** Check file types and size limits

---

## 📊 Performance Metrics

### Current Capabilities:
- **Image Processing:** ~30 seconds per image
- **Batch Processing:** 10 images in ~5 minutes
- **Detection Accuracy:** 85%+ confidence
- **Coverage Area:** 100+ acres per flight
- **Response Time:** <4 seconds for UI updates

### Optimization Opportunities:
- **GPU acceleration** for faster AI inference
- **Parallel processing** for batch uploads
- **Image compression** for faster uploads
- **Caching strategies** for repeated queries

---

## 🔮 Future Enhancements

### Planned Features:
1. **Mobile App** - Native iOS/Android farmer app
2. **Real-time Streaming** - Live drone video analysis
3. **Treatment Tracking** - Monitor pesticide effectiveness
4. **Yield Prediction** - Estimate crop output
5. **Weather Integration** - Automated risk alerts
6. **Multi-crop Support** - Beyond current disease set
7. **Blockchain Traceability** - Farm-to-table tracking

### Technical Improvements:
1. **WebSocket Integration** - True real-time updates
2. **GraphQL API** - More efficient data fetching
3. **Microservices Architecture** - Better scalability
4. **Edge Computing** - On-drone AI processing
5. **Machine Learning Pipeline** - Continuous model improvement

---

## 🎯 Getting Started (Developer Guide)

### Prerequisites:
```bash
# Required software
- Node.js 18+
- MongoDB 5.0+
- Python 3.8+ (for AI engine)
- Git
- Visual Studio Code (recommended)
```

### Setup Steps:

#### 1. Clone Repository
```bash
git clone <repository-url>
cd aerovision-project
```

#### 2. Setup Backend
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB connection
npm start
```

#### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```

#### 4. Setup AI Engine
```bash
cd AeroVisionEngine
# Follow C++ build instructions
mkdir build && cd build
cmake ..
make
```

#### 5. Test the System
```bash
# 1. Open http://localhost:3000
# 2. Register admin account
# 3. Invite a farmer
# 4. Upload test images
# 5. Verify disease detection
```

---

## 📚 Learning Resources

### For Beginners:
1. **React Tutorial** - https://react.dev/learn
2. **Node.js Guide** - https://nodejs.org/en/docs/
3. **MongoDB Basics** - https://docs.mongodb.com/
4. **REST API Design** - https://restfulapi.net/

### For Advanced Users:
1. **YOLO Documentation** - https://docs.ultralytics.com/
2. **Computer Vision** - OpenCV tutorials
3. **Geospatial Data** - MongoDB geospatial queries
4. **Performance Optimization** - Node.js best practices

---

## 🤝 Contributing

### Code Structure Guidelines:
1. **Frontend:** Use functional components with hooks
2. **Backend:** Follow MVC pattern (Model-View-Controller)
3. **Database:** Use Mongoose schemas for validation
4. **API:** RESTful endpoints with proper HTTP codes
5. **Documentation:** Comment complex algorithms

### Development Workflow:
1. **Create feature branch** from main
2. **Write tests** for new functionality
3. **Follow coding standards** (ESLint, Prettier)
4. **Test thoroughly** before submitting
5. **Create pull request** with detailed description

---

This comprehensive overview should give you a solid understanding of the AeroVision project! Each component works together to create a powerful agricultural monitoring system that helps farmers protect their crops using cutting-edge AI technology.

Feel free to ask about any specific part you'd like me to explain in more detail! 🌱