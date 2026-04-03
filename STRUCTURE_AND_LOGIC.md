# MindSense AI: Project Structure & Technical Logic

This document provides a comprehensive breakdown of every file in the MindSense project, explaining its individual role and the mathematical algorithms used for emotional risk assessment.

---

## 📂 1. Project Map (Frontend)

### Root Configuration
- **`package.json`**: Defines dependencies (React, Vite, Framer Motion, Three.js) and build scripts.
- **`vite.config.ts`**: Configures the Vite build tool, proxy settings, and path aliases.
- **`tsconfig.json`**: Root TypeScript configuration for the project.
- **`index.html`**: Entry point for the browser; contains the root div and metadata.
- **`.env`**: (Ignored on Git) Stores sensitive Firebase keys and API URLs.

### Source Code (`/src`)
- **`main.tsx`**: Bootstraps the React application and attaches it to the DOM.
- **`App.tsx`**: Defines top-level routing (Hero, Auth, Chat, Dashboard, Pricing) and Layout.
- **`index.css`**: Global styles, mesh-gradient backgrounds, and Neobrutalist design variables.

#### Pages (`/src/pages`)
- **`HeroPage.tsx`**: Landing screen featuring the 3D Living Fluid animation and marketing copy.
- **`AuthPage.tsx`**: Manages Login and Signup flows using an iPhone-mockup UI.
- **`ChatPage.tsx`**: The main interface for AI interaction, camera toggles, and crisis detection.
- **`DashboardPage.tsx`**: Aggregates session history and visualizes data with the Score Gauge.
- **`PricingPage.tsx`**: Displays neobrutalist subscription cards.

#### Components (`/src/components`)
- **`Navbar.tsx`**: Persistent navigation with the branding logo and auth-state buttons.
- **`CrisisPanel.tsx`**: Floating notification/modal that appears if risk scores cross 75.
- **`VoucherModal.tsx`**: The reward UI triggered after 10 sessions/messages at low risk.
- **`webcam/WebcamCapture.tsx`**: Handles hardware camera access, frame capture, and status indicators.
- **`ui/`**: Reusable base components like `card-5.tsx` (HighlightCard), `living-fluid-hero.tsx`, and `loader-15.tsx`.

#### Logic & Hooks (`/src/hooks` & `/src/lib`)
- **`useChat.ts`**: Manages Groq API streaming, message history, and server communication.
- **`useRiskScore.ts`**: **The Engine.** Fuses text and facial telemetry into a unified risk number.
- **`firebase.ts`**: Safe initialization of Firebase Auth and Firestore DB.
- **`utils.ts`**: Helper functions like the Tailwind `cn` merger.

---

## 📂 2. Project Map (Backend)

### Root Files
- **`main.py`**: The FastAPI entry point; configures CORS, Middleware, and routes.
- **`requirements.txt`**: Lists Python dependencies (FastAPI, DeepFace, Transformers, Uvicorn).
- **`limiter.py`**: Implementation of rate-limiting to prevent API abuse.

### Routers (`/backend/routers`)
- **`text_analysis.py`**: Core NLP logic. Uses the `j-hartmann/emotion-english-distilroberta-base` model to score text sentiment.
- **`face_analysis.py`**: Core Computer Vision logic. Uses DeepFace to analyze base64 frames.
- **`chat.py`**: Securely proxies Groq LLM requests to ensure the API key is never exposed to the client.
- **`voucher.py`**: Validates eligibility for discount tokens.

---

## 🧠 3. The Risk Assessment Algorithms

MindSense does not rely on simple word-counters. It uses a **Fused Multi-Modal Trajectory** approach.

### A. Raw NLP Scoring (Backend)
The backend returns a `distress_score` based on the semantic weight of the user's message:
- **Crisis Keywords**: "suicide", "self-harm" → **80 points**
- **Distress Keywords**: "hopeless", "pain", "anxious" → **40 points**
- **Sadness Keywords**: "tired", "sad", "lost" → **20 points**
- **Positive Keywords**: "happy", "fine" → **Forces score toward 0**

### B. Scaled Feedback Loop (Frontend Mapping)
To ensure the score accurately reflects mental state changes, we remap the raw backend score before processing:
1. **Happy Signal (0)**: Mapped to **15** (Drives the risk score down aggressively).
2. **Neutral Signal (1-10)**: Mapped to **50** (Anchors the score at the median).
3. **Distress Signal (>10)**: Mapped using the formula:  
   $NewValue = 55 + (RawBackendScore \times 0.45)$  
   *Result*: This pushes negative emotions into the **60 to 100** high-risk range.

### C. Exponential Moving Average (EMA)
To prevent the score from jumping erratically on a single word, we use **EMA**. This creates a "memory effect" where history influences the current number:
$$Score_{new} = (Score_{prev} \times 0.65) + (ScaledInput \times 0.35)$$
*Why this is needed*: Human emotions are longitudinal. A user who has been calm for 10 minutes shouldn't trigger an emergency alert for one slightly frustrated sentence.

### D. Multi-Modal Fusion (Blending Face + Text)
When the webcam is active, the system calculates a **Fused Risk Score**:
1. **Condition**: If no face is detected, the score defaults strictly to Text.
2. **Blend Formula**:  
   $$FinalScore = (TextScore \times 0.6) + (SmoothedFaceScore \times 0.4)$$
3. **Peak Severity Override**: If both the Text and Facial scores cross **40** simultaneously, the system adds a **+8 complexity weight** to indicate high-intensity emotional resonance.

---

## 🚀 4. Why This Architecture?

- **TypeScript vs JS**: Predictability. Handling real-time hardware data streams requires strict type safety to prevent memory leaks and runtime crashes.
- **FastAPI**: It is asynchronous and Python-based, allowing native integration with the Hugging Face and DeepFace ML libraries without slow bridge processes.
- **Mobile-First Response**: Despite being a web app, the UI uses React Framer Motion to mimic high-end mobile app interactions (spring-based physics), making it feel approachable during crisis moments.
