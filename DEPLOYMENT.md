# 🚀 Deployment Guide — MindSense AI

This guide explains how to deploy the **MindSense AI** platform: the **Vite + React Frontend** on **Vercel** and the **FastAPI Backend** on a cloud provider like **Render** or **Railway**.

---

## 🏗️ Deployment Architecture

1. **Frontend (Vercel)**: Serves the React UI. Highly responsive, free, and directly integrated with your GitHub repo.
2. **Backend (Render / Railway)**: Hosts the Python FastAPI server. A separate host is required because the backend uses heavy Machine Learning libraries (**DeepFace**, **TensorFlow**, and **Hugging Face Transformers**) which exceed Vercel's serverless size limits (50MB–250MB) and execution timeout limits.

---

## 1. 🖥️ Deploying the Backend (Render / Railway)

We recommend deploying the backend on [Render.com](https://render.com) (Web Service) or [Railway.app](https://railway.app).

### Setup Steps (e.g., Render):
1. Create a free account on **Render**.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository: `https://github.com/sanchitaaX/MindSense-AI-`.
4. Configure the service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3` (or use Docker if preferred, as Render supports Dockerfiles)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add the required keys (listed below).
6. Click **Deploy Web Service**. Render will build the project and provide a public URL (e.g., `https://mindsense-backend.onrender.com`).

### 🔑 Backend Environment Variables:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Groq LLM API Key (used for the AI chatbot therapist) | `gsk_yOuRaPiKeY...` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs (CORS) | `https://your-app-name.vercel.app` |

---

## 2. 🎨 Deploying the Frontend (Vercel)

1. Create a free account on [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository: `https://github.com/sanchitaaX/MindSense-AI-`.
4. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (Root of the repo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add the required variables listed below.
6. Click **Deploy**. Vercel will build your frontend and provide a public URL (e.g., `https://mindsense-ai.vercel.app`).

### 🔑 Frontend Environment Variables:

These must be configured in Vercel. They are required by **Firebase** (for authentication/database) and for communicating with your backend:

| Variable Name | Source / Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | The URL of your deployed FastAPI backend (from Step 1) | `https://mindsense-backend.onrender.com` |
| `VITE_FIREBASE_API_KEY` | Firebase Console -> Project Settings -> general | `AIzaSyA1...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console -> Project Settings -> general | `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console -> Project Settings -> general | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Console -> Project Settings -> general | `your-project-id.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Firebase Console -> Project Settings -> general | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase Console -> Project Settings -> general | `1:12345:web:abcdef` |

---

## 🔄 How Frontend and Backend Talk to Each Other

1. When you deploy the **Backend**, you get a URL like `https://mindsense-backend.onrender.com`.
2. Save this URL in your **Frontend** Vercel project under `VITE_API_BASE_URL`.
3. When you deploy the **Frontend**, you get a URL like `https://mindsense-ai.vercel.app`.
4. Save this URL in your **Backend** environment variables under `ALLOWED_ORIGINS` (this resolves CORS errors and allows your frontend to fetch analysis data from the backend).
