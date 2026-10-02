# Deployment Guide: DayPlanner

This guide walks you through deploying **DayPlanner**:
- **Backend (Node.js/Express + Groq AI)** on **[Render](https://render.com/)**
- **Frontend (React + Vite)** on **[Vercel](https://vercel.com/)**

---

## 1. Push Your Code to GitHub

First, initialize Git and push your repository to GitHub (make sure `.gitignore` is in place so your local `.env` is **never** committed):

```bash
git init
git add .
git commit -m "Initial commit with deployment config"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## 2. Deploy Backend on Render

1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Name**: `dayplanner-api` (or any name you prefer)
   - **Region**: Closest to you (e.g., Singapore, Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free

5. Scroll down to **Environment Variables** and add the following:
   | Key | Value | Notes |
   | --- | --- | --- |
   | `NODE_ENV` | `production` | Production mode |
   | `MONGO_URI` | *(Copy value from your `server/.env`)* | Your MongoDB connection string |
   | `JWT_SECRET` | *(Copy value from your `server/.env` or generate one)* | Secret for signing auth tokens |
   | `GROQ_API_KEY` | *(Copy value from your `server/.env`)* | Groq API Key |
   | `GROQ_MODEL` | `qwen/qwen3.8-27b` | Model ID |
   | `CLIENT_URL` | `https://<your-vercel-app>.vercel.app` | You can update this after Vercel gives you your URL |

6. Click **Deploy Web Service**.
7. Once deployed, copy your Render service URL (e.g. `https://dayplanner-api.onrender.com`).
   > Test health endpoint: `https://dayplanner-api.onrender.com/api/health` should return `{"status":"ok",...}`.

---

## 3. Deploy Frontend on Vercel

1. Go to **[vercel.com](https://vercel.com/)** and sign in.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
5. Expand **Environment Variables** and add:
   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<your-render-backend-url>.onrender.com` |

   *(Note: The client automatically appends `/api` if omitted)*

6. Click **Deploy**.
7. Once deployment finishes, copy your live Vercel URL (e.g. `https://day-planner-xyz.vercel.app`).

---

## 4. Final Polish: Link Frontend URL in Render (Optional)

To ensure strict CORS security:
1. In your **Render Dashboard** → Your `dayplanner-api` service → **Environment**.
2. Set or update `CLIENT_URL` to your Vercel URL (e.g., `https://day-planner-xyz.vercel.app`).
3. Click **Save Changes** (Render will automatically redeploy).

---

## Summary of Configuration Files Created
- [`client/vercel.json`](file:///e:/Projects/Day-planner/client/vercel.json): Configures SPA client-side route rewrites.
- [`render.yaml`](file:///e:/Projects/Day-planner/render.yaml): Blueprint definition for Render.
- [`.gitignore`](file:///e:/Projects/Day-planner/.gitignore): Protects secret `.env` files and `node_modules` from Git.
- [`server/.env.example`](file:///e:/Projects/Day-planner/server/.env.example) & [`client/.env.example`](file:///e:/Projects/Day-planner/client/.env.example): Reference env templates.
