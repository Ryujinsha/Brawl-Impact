# 🎮 Brawl Impact

A 2D multiplayer platform fighter with a medieval theme, built with **React**, **TypeScript**, **Canvas**, **Socket.IO**, and a **Laravel** backend.

---

## 🏛 Architecture Overview

Brawl Impact uses a hybrid architecture designed for competitive real-time web gaming:

1. **Laravel Backend (`/backend`)**:
   - Built with **Laravel 13+** (PHP 8.3) and SQLite database.
   - Manages REST API endpoints:
     - `GET /api/health` — Server health check
     - `GET /api/rooms` & `POST /api/rooms` — War Chamber room lobby management
     - `POST /api/matches/start` & `POST /api/matches/finish` — Match chronicle logging
     - `GET /api/leaderboard` — Hall of Fame warrior rankings and statistics
   - Eloquent models & migrations: `GameRoom`, `GameMatch`, `GameMatchRanking`, `WarriorStat`.

2. **Game Server (`/game-server`)**:
   - Authoritative 60 FPS physics engine and collision simulation.
   - Real-time multiplayer synchronization via **Socket.IO** (port 3001).
   - Automatically synchronizes battle conclusions and warrior statistics to the Laravel API.

3. **Frontend (`/frontend`)**:
   - Built with **React**, **TypeScript**, and **HTML5 Canvas**.
   - Medieval aesthetic featuring **MedievalSharp** typography, dynamic health & damage gauges, crests, and victory fanfare.
   - Proxies `/api` to Laravel (`:8000`) and `/socket.io` to Game Server (`:3001`).

---

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+ & Composer
- Node.js 18+ & npm

### Running with a Single Command
From the root directory:

```bash
npm run dev
```

This concurrently starts:
- **Laravel API**: `http://localhost:8000`
- **Game Server**: `http://localhost:3001`
- **Frontend**: `http://localhost:5173`

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| **A / ←** | Move Left |
| **D / →** | Move Right |
| **W / Space / ↑** | Jump |
| **J / Z** | Basic Attack |
| **K / X** | Ability |
| **L / C** | Ultimate |

---

## ⚔️ Playable Warriors

| Warrior | Class | Special Ability | Ultimate |
|---------|-------|-----------------|----------|
| **Knight** ⚔️ | Balanced | Shield Charge | Grand Slash |
| **Mage** 🔮 | Ranged | Fireball | Meteor |
| **Assassin** 🗡️ | Agility | Kunai Throw | Shadow Step |
| **Fighter** 👊 | Brawler | Uppercut | Ground Slam |
