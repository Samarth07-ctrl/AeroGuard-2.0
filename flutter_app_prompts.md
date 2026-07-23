# AeroGuard AI - Flutter App Reconstruction Prompts (Direct MongoDB)

Based on your project's architecture, the Flutter mobile app connects **DIRECTLY** to MongoDB Atlas using `mongo_dart`. We are **NOT** using a backend REST API (no `dio`, no Express endpoints).

These prompts should be fed sequentially into an AI coding assistant (like Claude 3.5 Sonnet, GPT-4o, or Gemini 1.5 Pro).

## Phase 0: Data Models & MongoDB Schemas

**Prompt:**
> "I need to build a Flutter application called 'AeroGuard AI'. We are connecting **DIRECTLY to MongoDB Atlas** using the `mongo_dart` package. There is NO backend REST API.
> 
> Let's start by defining the Dart data models. The AI engine writes directly to these collections, so field names must match EXACTLY. Use `freezed` and `json_serializable`.
> 
> **1. AnalysisSession Model (Collection: `analysissessions`)**
> ```json
> {
>   "_id": "ObjectId",
>   "sessionId": "String",
>   "farmerEmail": "String (lowercase)",
>   "imagePath": "String",
>   "isVerified": "Boolean",
>   "createdAt": "DateTime",
>   "diseases": [
>     {
>       "name": "String",
>       "severity": "String",
>       "confidence": "double (nullable)",
>       "lat": "double (nullable)",
>       "lon": "double (nullable) // IMPORTANT: It is 'lon' not 'long'",
>       "riskRadius": "double (nullable)",
>       "spreadRadius": "double (nullable)"
>     }
>   ]
> }
> ```
> 
> **2. ScanSession Model (Collection: `scansessions`)**
> ```json
> {
>   "_id": "ObjectId",
>   "sessionId": "String",
>   "farmerEmail": "String",
>   "otpCode": "String // Stored as a string (e.g. '123456')",
>   "qrToken": "String",
>   "isVerified": "Boolean",
>   "appLinkStatus": "String",
>   "results": [
>     {
>       "disease": "String",
>       "severity": "String",
>       "lat": "double",
>       "long": "double // IMPORTANT: Here it is 'long' not 'lon'"
>     }
>   ]
> }
> ```
> 
> Please generate the Dart data models for `AnalysisSession`, `Disease`, `ScanSession`, and `ScanResult`."

---

## Phase 1: Project Setup & MongoDB Service

**Prompt:**
> "Now let's do the foundational setup, theming, routing, and the direct MongoDB connection.
> 
> **Requirements:**
> 1. **Dependencies:** 
>    - State Management & Routing: `flutter_riverpod`, `go_router`
>    - Database: `mongo_dart` (Direct DB access)
>    - Storage: `flutter_secure_storage` (To store the farmer's email after login)
>    - Map: `google_maps_flutter` (or `flutter_map` if you prefer for CircleMarkers)
>    - Scanning: `mobile_scanner`
> 2. **Theme:** 
>    - Primary colors: dark forest green (`#2B5339`) and white.
>    - Secondary: vibrant green (`#3C8B3F`), warning red (`#D32F2F`).
> 3. **MongoDB Service (`mongo_service.dart`):** Create a service class to manage the `mongo_dart` connection.
>    - Create methods to open and close the connection.
>    - Store the URI in a `.env` file or constant (e.g., `mongodb+srv://...`). Database name is `test`.
> 4. **Routing Structure:** Set up `go_router`:
>    - `'/login'` (Welcome Back Sign-In)
>    - `'/link-farm'` (OTP & QR verification)
>    - `'/'` (Dashboard)
>    - `'/risk-map'`
>    - `'/analysis-feed'`
> 
> Please generate `pubspec.yaml`, `main.dart`, `theme.dart`, the `MongoService`, and the base `router.dart`."

---

## Phase 2: Authentication (Direct MongoDB OTP/QR Verification)

**Prompt:**
> "Let's build the Authentication flow. We bypass the backend and verify OTPs/QR codes by querying the `scansessions` collection directly.
> 
> **Screen 1: Welcome Back (Sign In - '/login')**
> - Standard UI with Email/Password fields and 'Continue with Google'. However, for our core logic, we just need to get the user's email and redirect them to `/link-farm` if they are new, or to `/` if they are already stored securely on the device.
> 
> **Screen 2: Link Farm ('/link-farm')**
> - **UI:** TabBar with two tabs: 'Scan QR Code' and 'Enter OTP'.
> - **Enter OTP Logic:** 
>   - The farmer enters their email and a 6-digit OTP string.
>   - Use `MongoService` to query `scansessions`: 
>     `db.collection('scansessions').findOne({'farmerEmail': email.trim().toLowerCase(), 'otpCode': otpString, 'isVerified': false})`
>   - If found: Update document to `{'$set': {'isVerified': true, 'appLinkStatus': 'app_linked'}}`. Save email to `flutter_secure_storage` and navigate to Dashboard.
>   - If null: Show 'Invalid OTP'.
> - **Scan QR Code Logic:** 
>   - Use `mobile_scanner`. The QR contains a string like 'aero-qr-c50...'.
>   - Query `scansessions`: `findOne({'qrToken': scannedValue, 'isVerified': false})`.
>   - If found: update flags, save the `farmerEmail` from the document to secure storage, and navigate to Dashboard.
> 
> Please generate the Auth providers and the UI for `login_screen.dart` and `link_farm_screen.dart`."

---

## Phase 3: Dashboard Screen & MongoDB Data Fetching

**Prompt:**
> "Next, let's build the Dashboard screen (route: '/'). The dashboard displays stats fetched directly from MongoDB.
> 
> **Data Integration:**
> - Create a Riverpod `FutureProvider` that uses `MongoService` to fetch the farmer's data from `analysissessions`:
>   `db.collection('analysissessions').find({'farmerEmail': loggedInEmail, 'isVerified': true}).toList()`
> 
> **UI Layout:**
> - **Header Row:** Title "My Farm" (bold, dark navy). Include a profile icon that, when tapped, asks "Log out?". If confirmed, clear `flutter_secure_storage` and go to `'/login'`.
> - **Greeting:** "Good Morning, Farmer" with the logged-in email.
> - **Stats Row:**
>   - "Total Scans": The number of documents returned.
>   - "Active Alerts": Loop through all `diseases` arrays in all documents. Count diseases where `severity != 'Safe'` AND `name != 'Healthy Field / No Anomalies Found'`.
> - **Field Health Card:** A green gradient card showing a calculated health percentage.
> - **Quick Actions:** "Risk Map" and "Analysis Feed" buttons.
> - **Recent Sessions:** A ListView of recent scans from the `analysissessions` data.
> 
> Please generate `dashboard_provider.dart` and `dashboard_screen.dart`."

---

## Phase 4: Tactical Risk Map Screen (Spatial Correlation)

**Prompt:**
> "Let's build the 'Tactical Risk Map' screen (route: '/risk-map'). This is our USP.
> 
> **Data Integration:**
> - Use the same `analysissessions` provider from the Dashboard.
> 
> **UI Requirements:**
> 1. **Map Body:** Use a Map package (`google_maps_flutter` or `flutter_map`).
> 2. **Plotting Markers:** Loop through all documents, and then loop through their `diseases` array.
>    - Skip items where `severity == 'Safe'` or name indicates healthy.
>    - Use `disease.lat` and `disease.lon` to place a red pin marker.
>    - **CRITICAL USP:** Read `disease.riskRadius` or `disease.spreadRadius`. Draw a transparent orange/red circle around the infected point using this radius.
> 3. **Legend & Empty States:** Show a floating legend (Red pin = Infected, Orange circle = Risk Zone). If no data, show an empty state overlay.
> 
> Please provide the Flutter code for `risk_map_screen.dart` implementing the map markers and risk circles."

---

## Phase 5: Analysis Feed

**Prompt:**
> "Finally, let's build the 'Analysis Feed' screen (route: '/analysis-feed').
> 
> **Analysis Feed Screen:**
> - Use the same `analysissessions` provider.
> - **UI:** AppBar (dark green, "Analysis Feed").
> - **Populated State:** Display a list of detection cards. Loop through the documents and their `diseases` arrays. 
> - Show the disease `name`, `severity` string, and format the `createdAt` date from the parent document.
> - Ensure safe/healthy items are filtered out or visually distinct as 'Safe'.
> 
> Please provide `analysis_feed_screen.dart`."
