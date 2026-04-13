# AODB Resource Management System — v3.0

Production-grade React frontend for the AODB Resource Management System. The companion API is the **Spring Boot** project **`RMSBackend`** (for example `~/Desktop/RMSBackend`). It listens on **`http://localhost:8081`** by default (`server.port` in `application.properties`), which matches `VITE_API_URL` in this app.

## What's New in v3

- **Drag-and-Drop Gantt** — DnD Kit-powered allocation reallocation on the timeline
- **Rules CRUD** — Full create/edit/delete with scoring criteria builder
- **Constraints CRUD** — Hard/soft constraint management with JSON editor
- **Simulations** — Create, run, and apply what-if scenarios with impact analysis
- **Templates** — Template CRUD with date-range apply workflow
- **WebSocket Live Feed** — Real-time event feed on dashboard
- **Radar Chart** — Operations scorecard on dashboard
- **Enhanced Dashboard** — Radar chart, mode utilization, WS live feed

## Setup

```bash
unzip rms-v3.zip && cd rms-v3
cp .env.example .env.local
# Edit VITE_API_URL and VITE_WS_URL
npm install
npm run dev   # → http://localhost:3010
```

## Environment Variables

```env
VITE_API_URL=http://localhost:8081
VITE_WS_URL=ws://localhost:8081
VITE_RMS_WS_URL=ws://localhost:8081/api/v1/ws/rms   # optional
```
