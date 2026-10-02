# LogiShield — Forward Supply Chain Operating System

> **Operational Logistics Decision-Support Platform**  
> **Tagline:** *Predict. Prioritize. Deliver.*  
> **Security Enclave:** Tier-4 Protected Logistics Grid

---

## 1. System Overview

Forward military formations deployed across geographically dispersed and operationally challenging terrains require assured and timely supply chain support. Maintaining operational readiness across fragmented information streams—consumption velocity, depot stock, transit bottlenecks, and pass meteorology—demands predictive visibility.

**LogiShield** is an integrated operational logistics intelligence system designed to anticipate supply requirements, calculate deterministic risk indices, and optimize the forward movement of critical stores.

### The Four Core Operational Invariants

1. **WHAT IS HAPPENING?**  
   Real-time multi-echelon telemetry tracks stock levels, daily consumption velocity, and convoy asset status across all 20 forward sectors and depots.
2. **WHY IS IT HAPPENING?**  
   Causal factor decomposition links inventory drawdown to weather friction, heating surges, and route passability restrictions.
3. **WHAT WILL HAPPEN NEXT?**  
   Deterministic time-series forecasting projects exact stock-out dates, demand surges, and safety buffer shrinkage up to 14 days in advance.
4. **WHAT SHOULD THE LOGISTICS PLANNER DO?**  
   The replenishment engine calculates economic reorder quantities, designates staging depots, selects appropriate all-weather transport modes, and stages dispatch orders.

---

## 2. System Architecture

```text
Multi-Source Data Ingestion (Historical Issues, IoT Telemetry, Road Weather Stations)
                                  │
                                  ▼
           ML Demand Forecasting Engine (OLS + Harmonic Seasonality)
             [Validated Metrics: RMSE = 3.42, MAE = 2.18, R² = 0.88]
                                  │
                                  ▼
          Deterministic Risk Engine (Multi-Factor Weighted Scoring 0–100)
            [Inventory 35% + Demand 25% + Transport 15% + Weather 15% + Lead 10%]
                                  │
                                  ▼
      Multi-Echelon Replenishment & Transport Optimization Engine
            [Economic Reorder Batching + Fleet Selection + Route Corridors]
                                  │
                                  ▼
                   Express REST API Engine (server.ts)
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
React Enterprise UI (Tailwind CSS,                LogiCopilot (Gemini 3.8 Flash)
Leaflet GIS, Recharts, Decision Chain)             [Audit-Grade Explanation Layer]
```

---

## 3. Core Operational Modules

1. **Executive Dashboard:**  
   High-density command cockpit providing real-time formation readiness, fleet utilization, aggregate stock across all supply classes, and critical warning counters.
2. **Predictive Decision Chain:**  
   End-to-end cognitive reasoning pipeline:
   $$\text{Raw Telemetry Signals} \longrightarrow \text{ML Demand Projection} \longrightarrow \text{0–100 Risk Scoring} \longrightarrow \text{Operational Impact} \longrightarrow \text{Authorized Convoy Dispatch}$$
3. **Demand Forecasting Engine:**  
   Ordinary Least Squares (OLS) regressor paired with 7-day harmonic seasonality and sub-zero weather friction multipliers. Generates 14-day projections, 95% statistical confidence intervals, and stock-out horizons.
4. **Inventory Intelligence Matrix:**  
   Dense scannable tracking of Class I (Rations), Class II (Cold Weather Clothing/Gear), Class III (POL & Fuel), Class V (Ammunition), Class VIII (Medical), and Class IX (Vehicle Spares).
5. **Transparent Risk Intelligence:**  
   Deterministic 0–100 composite scoring decomposed into 5 causal factors:
   $$\text{Composite Risk} = 0.35 \times R_{\text{inv}} + 0.25 \times R_{\text{demand}} + 0.15 \times R_{\text{transport}} + 0.15 \times R_{\text{env}} + 0.10 \times R_{\text{lead}}$$
6. **Logistics GIS Map:**  
   Interactive geospatial visualization featuring dark tactical layers, forward outpost nodes, supply depots, and pass routes styled by real-time condition (Clear, Unpaved, Landslide Risk, Snow/Ice Bound).
7. **Transport Fleet Management:**  
   Asset-level tracking of heavy 6x6 carriers, 4x4 high-mobility tankers, high-altitude rotary utility aircraft, and mountain pack columns.
8. **Environmental & Pass Weather Friction:**  
   Pass monitoring stations tracking ambient temperature, snow accumulation, wind velocity, and visibility, converted into a logistics delay multiplier ($1.0\times$ to $2.5\times$).
9. **Field Telemetry Stream:**  
   Continuous digital monitoring of fuel tank levels, cold-chain medical temperatures, and crate seal vibration sensors.
10. **Replenishment Optimization & Dispatch Engine:**  
    Automated multi-echelon push queue categorizing requirements into CRITICAL, HIGH, MEDIUM, and LOW priorities with one-click dispatch authorization.
11. **What-If Scenario Stress Simulator:**  
    Dynamic stress testing across consumption shocks ($\pm 50\%$), fleet capacity shifts ($\pm 50\%$), severe blizzard conditions, and transit lead time delays.
12. **LogiCopilot Decision Support Layer:**  
    Server-side Gemini AI integration (`gemini-3.8-flash`) acting as an audit-grade explanation assistant. Grounded strictly in deterministic backend snapshots to ensure zero hallucination of figures.
13. **Operational Alert Center:**  
    Filterable warning console with acknowledgement workflows and direct formation inspection links.

---

## 4. Mathematical Formulas & Deterministic Logic

### Days Remaining
$$\text{Days Remaining} = \frac{\text{Current Stock}}{\text{Predicted Daily Consumption}}$$

### Dynamic Reorder Point (ROP)
$$\text{ROP} = (\text{Transit Lead Time in Days} \times \text{Predicted Daily Consumption}) + \text{Safety Stock Buffer}$$

### Model Evaluation Metrics
$$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N (y_i - \hat{y}_i)^2}, \quad \text{MAE} = \frac{1}{N}\sum_{i=1}^N |y_i - \hat{y}_i|, \quad R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$$

---

## 5. REST API Specifications

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Aggregated executive KPIs, risk distributions, and alerts |
| `GET` | `/api/locations` | All 20 forward formations and depots with risk ratings |
| `GET` | `/api/inventory` | Complete inventory records with days remaining and ROP |
| `GET` | `/api/forecast/:itemId` | Time-series forecast, confidence bounds, and metrics |
| `GET` | `/api/risk` | Multi-factor risk decomposition across all sectors |
| `GET` | `/api/transport` | Fleet asset availability, payload capacity, and status |
| `GET` | `/api/routes` | GIS supply corridors with terrain and condition statuses |
| `GET` | `/api/weather` | Pass temperatures, wind speeds, and logistics multipliers |
| `GET` | `/api/iot` | Live field telemetry sensor array |
| `POST` | `/api/iot/toggle-simulation` | Toggle telemetry polling loop |
| `GET` | `/api/replenishment` | Calculated multi-echelon replenishment queue |
| `POST` | `/api/replenishment/dispatch` | Authorize and stage emergency convoy dispatch |
| `POST` | `/api/simulation` | Run What-If operational contingency stress test |
| `GET` | `/api/alerts` | Active operational threshold alerts |
| `POST` | `/api/alerts/acknowledge` | Acknowledge alert |
| `GET` | `/api/decision-chain/:sectorId` | 5-step Predictive Decision Chain trace data |
| `POST` | `/api/copilot/query` | LogiCopilot query grounded in backend state |

---

## 6. Installation & Execution

### Prerequisites
- Node.js $\ge 20$
- npm $\ge 10$

### Setup
```bash
# Install dependencies
npm install

# Start development server (Full-Stack Express + Vite on Port 3000)
npm run dev

# Run TypeScript compilation and lint verification
npm run lint

# Build production bundle
npm run build

# Start production server
npm start
```

### Environment Configuration (`.env`)
```ini
# Gemini API Key for server-side decision support
GEMINI_API_KEY="your-api-key"

# Server Port
PORT=3000
```
