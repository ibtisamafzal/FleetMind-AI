# FleetMind AI — AI-Powered Fleet Intelligence MVP

A modern, production-grade fleet intelligence platform designed for logistics, courier, and transportation enterprises. FleetMind AI combines **conventional Machine Learning**, **Retrieval-Augmented Generation (RAG)**, and **local Generative AI** with an ultra-sleek **ArgoLogics** SaaS interface.

---

## 1. Project Overview
FleetMind AI enables fleet managers to transition from reactive maintenance to predictive intelligence. The platform continuously monitors operational telematics to forecast transit delays, quantify multi-factor vehicle fatigue, and provide hallucination-free AI recommendations grounded in official fleet policies.

## 2. Problem Statement
Commercial fleet operators face severe margin erosion from:
1. Unforeseen vehicle mechanical breakdowns and overdue service intervals.
2. Unplanned delivery delays resulting in service-level agreement (SLA) penalties.
3. Lack of actionable root-cause explanations connecting sensor data to maintenance SOPs.

FleetMind AI solves this by separating **ML prediction → deterministic telemetry calculation → GenAI policy explanation**.

## 3. Core Features
- **ArgoLogics SaaS Interface**: Consistent emerald/slate aesthetic across all 12 pages featuring a floating pill navigation, dark night-mode maps, and 3D vehicle spotlight cards.
- **Dark Interactive Telematics Map**: High-contrast Leaflet map displaying active transit corridors, vehicle markers, and location search.
- **ML Model #1 — Delivery Delay Prediction**: Logistic Regression & Random Forest classifier predicting transit delay probability (`POST /api/ml/predict-delay`).
- **ML Model #2 — Vehicle Operational Risk Scoring**: Multi-component risk model synthesizing Maintenance Risk (40%), Fuel Efficiency Risk (30%), and Delay Risk (30%).
- **RAG Knowledge Base & Ollama Integration**: TF-IDF & vector retrieval across 5 operational policy guidelines with zero hallucination enforcement (`POST /api/ai/chat`).
- **Vehicle Detail Telematics**: Real-time breakdown of vehicle risk, 30-day risk trend charts, historical logs, and 1-click "Ask FleetMind" trigger.
- **Bulk CSV Data Upload**: Direct ingestion of bulk trip records into the local SQLite database.
- **Dynamic Risk Weight Sliders**: Customizable operational weights that dynamically re-rank fleet attention priorities.

## 4. Architecture
```
FleetMind-AI/
├── backend/
│   ├── config.py              # Pydantic & environment settings
│   ├── database.py            # SQLAlchemy engine (SQLite)
│   ├── models/                # Vehicle, Driver, Trip, Fuel, Maintenance, User
│   ├── schemas/               # Request/Response validation schemas
│   ├── routes/                # Auth, Vehicles, Drivers, Trips, ML, Analytics, AI, Settings
│   ├── services/              # ML predictor, RAG engine, LLM service, Recommendation engine
│   ├── seed_data.py           # Auto-populates 110+ vehicles, 4,000 trips
│   └── main.py                # FastAPI ASGI application & static SPA mount
├── ml/
│   ├── data/                  # Synthetic datasets (110 vehicles, 55 drivers, 4,000 trips)
│   ├── preprocessing.py       # Feature engineering & historical aggregation
│   ├── train_delay_model.py   # Baseline vs Random Forest model training & evaluation
│   ├── train_risk_model.py    # Multi-component risk model pipeline
│   ├── evaluate.py            # Accuracy, Precision, Recall, F1, ROC-AUC metrics
│   ├── predict.py             # Live inference engine
│   └── saved_models/          # Persisted Joblib models
├── rag/
│   ├── documents/             # 5 fleet maintenance, fuel, safety & dispatch policies
│   └── rag_engine.py          # Document loader, chunker, vectorizer & retriever
├── frontend/                  # React JS Frontend Application (Vite + React 19)
│   ├── index.html             # React Root Entrypoint
│   ├── package.json           # React dependencies & scripts (dev, build, start)
│   ├── vite.config.js         # Vite configuration with /api proxy to FastAPI
│   ├── src/
│   │   ├── main.jsx           # React DOM root render
│   │   ├── App.jsx            # React Router, global Chart.js, theme provider
│   │   ├── App.css            # ArgoLogics SaaS design system & components
│   │   ├── api.js             # Unified React API client
│   │   ├── components/
│   │   │   ├── TopHeader.jsx  # Floating centered pill navigation & user badge
│   │   │   └── LeafletDarkMap.jsx # Night-mode telematics map (Lahore & M-2)
│   │   └── pages/             # All 12 React pages:
│   │       ├── Dashboard.jsx
│   │       ├── Vehicles.jsx
│   │       ├── VehicleDetail.jsx
│   │       ├── RiskRadar.jsx
│   │       ├── Simulator.jsx
│   │       ├── ActionCenter.jsx
│   │       ├── Drivers.jsx
│   │       ├── Trips.jsx
│   │       ├── Analytics.jsx
│   │       ├── AIAssistant.jsx
│   │       ├── Settings.jsx
│   │       └── Login.jsx
│   └── public/assets/images/  # Delivery truck, van & driver avatars
├── tests/                     # Pytest suite for ML, Vehicles API, and AI Assistant
└── run_app.py                 # Single-command launcher
```

## 5. Technology Stack
- **Frontend**: **React 19, JavaScript (ES6+ / JSX), Vite**, React Router, Lucide React, Chart.js, React-Chartjs-2, Leaflet.js, ArgoLogics Design System Tokens.
- **Backend**: Python 3.11+, FastAPI, Pydantic, SQLAlchemy, PyJWT.
- **Database**: SQLite.
- **Machine Learning**: Scikit-learn, Pandas, NumPy, Joblib (Logistic Regression, Random Forest).
- **AI / RAG**: Persistent Chroma policy retrieval with TF-IDF fallback, local Llama 3.2 response generation through Ollama, and a deterministic SQLite/ML/RAG fallback when Ollama is unavailable. Each chat response reports its generator as `llama3.2` or `sqlite_fallback`.

---

## 6. Installation & Quick Start

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "C:\path\to\FleetMind-AI"
```

### Step 2: Install Python Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Run the Application

#### Option A: Unified Full-Stack Local Server (FastAPI + React SPA)
```powershell
cd frontend
npm install
npm run build
cd ..
python run_app.py
```
- **React Web App**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Option B: React JS Dev Server (Hot Module Replacement)
```powershell
cd frontend
npm run dev
# or: npm start
```
- **React Dev Server**: [http://localhost:5173](http://localhost:5173) (automatically proxies `/api` calls to port 8000)

---

## 7. Environment Variables (`.env`)
Create a `.env` file from `.env.example`:
```ini
DATABASE_URL=sqlite:///./fleetmind.db
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
OLLAMA_ENABLED=true
VECTOR_DB_PATH=./rag/chroma_db
RAG_USE_CHROMA=true
JWT_SECRET_KEY=your-secret-key
WEIGHT_MAINTENANCE=0.40
WEIGHT_FUEL=0.30
WEIGHT_DELAY=0.30
```

## 8. Database Seeding & Synthetic Dataset
To manually generate or reset the synthetic dataset (110 vehicles, 55 drivers, 4,000 trips):
```powershell
python ml/data/generate_synthetic_data.py
python backend/seed_data.py
```

## 9. Machine Learning Training Pipeline
Train and evaluate the delivery delay and vehicle risk models:
```powershell
python ml/train_delay_model.py
python ml/train_risk_model.py
python ml/evaluate.py
```

## 10. Ollama / Llama 3.2 Local Setup
The `/api/ai/chat` endpoint uses the locally installed `llama3.2` model through
Ollama as the primary response generator when `OLLAMA_ENABLED=true`. The model
receives verified context from ML, telemetry, database data, and RAG policy
sources. The response still includes the structured risk data and citations
calculated by FleetMind. If Ollama is disabled, unavailable, or times out, the
deterministic SQLite/ML/RAG response is returned as the fallback.

1. Install Ollama from [ollama.com](https://ollama.com).
2. Download the model:
   ```bash
   ollama pull llama3.2
   ```
3. Confirm Ollama is running. On Windows, the Ollama application normally runs
   the service automatically. If needed, start it manually:
   ```bash
   ollama serve
   ```
4. Ensure `.env` contains:
   ```ini
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   OLLAMA_ENABLED=true
   ```
5. Test Ollama directly, without FleetMind:
   ```bash
   ollama run llama3.2
   ```
   Type a question such as `Explain why preventive maintenance matters`, then
   press `Ctrl+D` (or enter `/bye`) to exit.

### Test Llama through FleetMind

Start the application:
```powershell
python run_app.py
```

In another PowerShell window, send a vehicle question to the API:
```powershell
$body = @{
  message = "Why is vehicle VH-027 high risk?"
  vehicle_id = "VH-027"
} | ConvertTo-Json

$result = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/ai/chat" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

$result.response
```

When Ollama is being used successfully, the JSON response contains:
```json
{
  "response_source": "llama3.2"
}
```
The response should still contain the deterministic risk score, vehicle ID,
recommendations, and policy citations in their structured fields. The frontend
also displays **Generated by Llama 3.2** on the response badge. The API can also be tested through
the Swagger UI at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

To test the fallback deliberately, set `OLLAMA_ENABLED=false` in `.env`,
restart FleetMind, and repeat the request. The response should still succeed,
with:
```json
{
  "response_source": "sqlite_fallback"
}
```
The frontend then displays **SQLite fallback**.

## 11. RAG Storage
Policy chunks are persisted in the local Chroma database at `VECTOR_DB_PATH`.
Set `RAG_USE_CHROMA=false` to use the original in-memory TF-IDF index instead.
If Chroma cannot initialize or a query fails, the application logs a warning and
automatically falls back to TF-IDF retrieval.

## 12. Testing
Run the complete automated test suite:
```powershell
python -m pytest tests
```

## 13. Vehicle & Driver Management APIs

### Vehicle Endpoints
* `GET /api/vehicles` — List and filter fleet vehicles with dynamic ML risk scores.
* `POST /api/vehicles` — Register a new vehicle. (Accepts `registration_number`, `make`, `model`, `vehicle_type`, `fuel_type`, `mileage`, `manufacturing_year`, etc. Auto-generates `vehicle_id` if omitted).
* `GET /api/vehicles/{id}` — Get telemetry details, 30-day risk trend, and AI recommendations.
* `PUT /api/vehicles/{id}` — Update vehicle specifications and operational status.
* `DELETE /api/vehicles/{id}` — Decommission vehicle from active fleet.

### Driver Endpoints
* `GET /api/drivers` — List fleet drivers with safety ratings and delay metrics.
* `POST /api/drivers` — Register a new driver. (Accepts `name`, `experience_years`, `average_speed`, `rating`, `status`. Auto-generates `driver_id` if omitted).
* `GET /api/drivers/{id}` — Get driver profile and performance history.
* `PUT /api/drivers/{id}` — Update driver record.
* `DELETE /api/drivers/{id}` — Remove driver record.

---

## 14. Frontend Navigation Map
- `/dashboard` — Telematics map, delivery volumes, spotlight truck WA-4823K, driver Robert Reynolds.
- `/vehicles` — Fleet catalog, search, status & risk level filters, grid/table view.
- `/vehicles/:id` — Spotlight vehicle (e.g. `VH-027`), 80+/100 High Risk breakdown, AI explanation, recommended actions.
- `/drivers` — Driver roster, safety ratings, accident logs, delay frequency.
- `/trips` — Transit log, bulk CSV drag-and-drop upload, interactive ML delay prediction calculator.
- `/analytics` — Delivery, fuel consumption anomalies, and maintenance expenditure charts.
- `/ai-assistant` — ChatGPT-style conversation copilot with RAG policy source citations.
- `/settings` — Dynamic risk formula sliders & Ollama model selector.
- `/login` — ArgoLogics-themed authentication with 1-click demo logins.

---

## 14. Demo User Accounts & Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Fleet Manager** | Tariq Mehmood | `manager@fleetmind.ai` | `fleetmind123` |
| **Safety Officer** | Sarah Khan | `safety@fleetmind.ai` | `fleetmind123` |
| **System Administrator** | System Admin | `admin@fleetmind.ai` | `admin123` |

*All accounts feature 1-click instant login directly on the `/login` screen.*
