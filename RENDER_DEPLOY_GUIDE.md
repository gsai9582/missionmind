# MissionMind — Render Deployment Guide 🚀

This guide explains how to deploy **MissionMind** to [Render](https://render.com) using either:
- **Method 1: One-Click Render Blueprint (Recommended)** — Automatically provisions all 3 services using [`render.yaml`](./render.yaml).
- **Method 2: Manual Dashboard Setup** — Step-by-step instructions to create each service individually.

---

## Architecture on Render

```
┌─────────────────────────────────┐
│     missionmind-frontend        │  Type: Static Site (Free, Global CDN)
│  https://<frontend>.onrender.com│  Build: npm install && npm run build
└────────────────┬────────────────┘  Publish: dist
                 │ API Requests (VITE_API_URL)
                 ▼
┌─────────────────────────────────┐
│     missionmind-backend         │  Type: Web Service (Node.js)
│  https://<backend>.onrender.com │  Build: npm install
└────────────────┬────────────────┘  Start: node server.js
                 │ Analysis Requests (ANALYSIS_SERVICE_URL)
                 ▼
┌─────────────────────────────────┐
│     missionmind-analysis        │  Type: Web Service (Python 3.11)
│  https://<analysis>.onrender.com│  Build: CPU PyTorch + requirements.txt
└─────────────────────────────────┘  Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Step 1: Push Code to GitHub

Render builds your services directly from a Git repository (GitHub or GitLab).

1. Open PowerShell or Terminal in the project root:
   ```bash
   git add .
   git commit -m "Configure MissionMind for Render deployment"
   ```

2. Create a new repository on [GitHub](https://github.com/new) (e.g., `missionmind`).

3. Link and push your local repository:
   ```bash
   git remote add origin https://github.com/<your-username>/missionmind.git
   git branch -M main
   git push -u origin main
   ```

> [!NOTE]
> Your `.gitignore` is already configured to exclude `.env`, `node_modules`, `venv`, and `__pycache__`. Never commit your real secret keys to GitHub.

---

## Step 2: Deploy to Render

### Method 1: Render Blueprint (Recommended — Fast & Automated)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) and select **Blueprint**.
3. Connect your GitHub account and select your `missionmind` repository.
4. Render will detect [`render.yaml`](./render.yaml) and list all 3 services:
   - `missionmind-analysis` (Python Web Service)
   - `missionmind-backend` (Node Web Service)
   - `missionmind-frontend` (Static Site)
5. Fill in the prompted environment variables:
   - **`OPENAI_API_KEY`**: Your OpenAI API key (`sk-...`)
   - **`MONGODB_URI`**: Your MongoDB Atlas connection string (`mongodb+srv://...`)
   - **`VITE_API_URL`**: Set this to `https://missionmind-backend.onrender.com/api` (replace `missionmind-backend` with your backend service name once deployed, or leave blank initially and update after backend is created).
6. Click **Apply**. Render will automatically build and deploy all services!

---

### Method 2: Manual Dashboard Setup

If you prefer to configure each service manually in the Render dashboard:

#### 1. Analysis Service (`missionmind-analysis`)
- Click **New +** -> **Web Service**.
- Connect your repository.
- **Name**: `missionmind-analysis`
- **Region**: Choose closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
- **Branch**: `main`
- **Root Directory**: `analysis-service`
- **Runtime**: `Python`
- **Build Command**:
  ```bash
  pip install --upgrade pip && pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Instance Type**: `Free`
- **Advanced -> Health Check Path**: `/health`
- **Environment Variables**:
  - `PYTHON_VERSION` = `3.11.9`
  - `OPENAI_API_KEY` = `sk-...`
  - `LLM_MODEL` = `gpt-4o-mini`
- Click **Create Web Service**. Note the URL (e.g., `https://missionmind-analysis.onrender.com`).

---

#### 2. Backend Service (`missionmind-backend`)
- Click **New +** -> **Web Service**.
- Connect your repository.
- **Name**: `missionmind-backend`
- **Region**: Same region as Analysis Service
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Instance Type**: `Free`
- **Advanced -> Health Check Path**: `/health`
- **Environment Variables**:
  - `NODE_VERSION` = `20.18.0`
  - `MONGODB_URI` = `mongodb+srv://GlamSphere:Missionmind07@missionmind.pkgzgwl.mongodb.net/?appName=Missionmind`
  - `JWT_SECRET` = (Generate any random 32+ character string)
  - `ANALYSIS_SERVICE_URL` = `https://missionmind-analysis.onrender.com` (use your Analysis Service URL from step 1)
- Click **Create Web Service**. Note the URL (e.g., `https://missionmind-backend.onrender.com`).

---

#### 3. Frontend Static Site (`missionmind-frontend`)
- Click **New +** -> **Static Site**.
- Connect your repository.
- **Name**: `missionmind-frontend`
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL` = `https://missionmind-backend.onrender.com/api` (use your Backend URL + `/api`)
- **Redirects / Rewrites**:
  - Click **Add Rule** under Redirects/Rewrites:
    - **Type**: `Rewrite`
    - **Source**: `/*`
    - **Destination**: `/index.html`
- Click **Create Static Site**.

---

## Step 3: Seed the Database

Once the backend is deployed, you should seed the initial Mars 2020 mission, MEDA instrument, and historical observations into MongoDB Atlas.

You can do this either:
- **Option A (From Render Dashboard Shell)**:
  1. Open your `missionmind-backend` service on Render.
  2. Click the **Shell** tab on the left menu.
  3. Run:
     ```bash
     npm run seed
     ```
- **Option B (From Local PowerShell)**:
  Run the seed script locally against your Atlas URI:
  ```powershell
  cd backend
  node seed.js
  ```

---

## Environment Variables Summary

| Service | Variable | Value Example | Required? |
|---|---|---|---|
| **Analysis** | `PYTHON_VERSION` | `3.11.9` | Yes |
| **Analysis** | `OPENAI_API_KEY` | `sk-proj-...` | Yes (for RAG LLM explanations) |
| **Analysis** | `LLM_MODEL` | `gpt-4o-mini` | Optional |
| **Backend** | `NODE_VERSION` | `20.18.0` | Yes |
| **Backend** | `MONGODB_URI` | `mongodb+srv://...` | Yes |
| **Backend** | `JWT_SECRET` | `random_64_character_string` | Yes |
| **Backend** | `ANALYSIS_SERVICE_URL` | `https://missionmind-analysis.onrender.com` | Yes |
| **Frontend** | `VITE_API_URL` | `https://missionmind-backend.onrender.com/api` | Yes |

---

## Important Render Free Tier Tips

1. **Cold Starts**: Render free web services spin down after 15 minutes of inactivity. The first request after sleep may take ~30–50 seconds to wake up.
2. **CPU PyTorch**: The build command is pre-configured to use the lightweight CPU-only PyTorch build (`https://download.pytorch.org/whl/cpu`), preventing build timeouts and keeping memory well within Render's 512 MB free tier RAM limit.
3. **MongoDB Atlas Network Access**: Ensure MongoDB Atlas allows connections from Render:
   - In MongoDB Atlas: Go to **Network Access** -> **Add IP Address** -> Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render's dynamic IP addresses can connect.
