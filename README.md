# 🧠 MindSense AI - Mental Health Support Platform

A comprehensive AI-powered mental health support system that leverages advanced emotion recognition, multi-modal analysis, and personalized therapeutic interventions. MindSense AI combines real-time facial expression analysis, natural language processing, and voice interaction to provide empathetic mental health support.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://python.org)

---

## ✨ Key Features

### 🤖 AI-Powered Chat
- **Groq LLM Integration**: Real-time streaming responses from advanced language models
- **Context-Aware Conversations**: Maintains conversation history for personalized interactions
- **Crisis Detection**: Automatic risk assessment based on user input

### 😊 Emotion & Risk Analysis
- **Facial Expression Recognition**: Real-time emotion detection via webcam using DeepFace
- **NLP Sentiment Analysis**: Advanced text emotion classification using transformer models
- **Multi-Modal Fusion**: Combines facial and text-based emotion signals for comprehensive risk scoring
- **Exponential Moving Average (EMA)**: Smooth risk trajectory tracking to prevent false alarms

### 🎮 Stress Reduction Tools
- **Coloring Canvas**: Therapeutic digital art activity
- **Dino Game**: Engaging gamified stress relief
- **Zen Runner**: Meditative endless runner game
- **Voice Input**: Hands-free interaction support

### 📊 Dashboard & Analytics
- **Session History**: Track mental health journey over time
- **Risk Score Visualization**: See emotional trends with interactive gauges
- **Insights & Recommendations**: AI-generated wellness suggestions
- **Therapist Matching**: Intelligent therapist recommendations based on needs

### 🎁 Reward System
- **Voucher Generation**: Unlock wellness rewards after consistent engagement
- **Gamification**: Badges and achievements for healthy coping strategies

### 🔐 Security & Privacy
- **Firebase Authentication**: Secure user login and account management
- **API Rate Limiting**: Protection against abuse and DoS attacks
- **Secure API Proxying**: Backend-protected Groq API keys
- **HTTPS Ready**: Production-grade security

---

## 🏗️ Project Structure

```
teamthinkai/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HeroPage.tsx          # Landing page with 3D animations
│   │   │   ├── AuthPage.tsx          # Login/Signup interface
│   │   │   ├── ChatPage.tsx          # Main chat interface
│   │   │   ├── DashboardPage.tsx     # Analytics & session history
│   │   │   └── ReduceStressPage.tsx  # Stress reduction games
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Navigation bar
│   │   │   ├── CrisisPanel.tsx       # Crisis alert system
│   │   │   ├── VoucherModal.tsx      # Reward voucher display
│   │   │   ├── webcam/
│   │   │   │   └── WebcamCapture.tsx # Facial expression input
│   │   │   └── ui/
│   │   │       ├── ColoringCanvas.tsx
│   │   │       ├── ColoringGame.tsx
│   │   │       ├── DinoGame.tsx
│   │   │       ├── ZenRunner.tsx
│   │   │       ├── VoiceInput.tsx
│   │   │       ├── therapist-card.tsx
│   │   │       └── [Other UI components]
│   │   ├── hooks/
│   │   │   ├── useChat.ts            # Chat state & Groq API integration
│   │   │   ├── useRiskScore.ts       # Risk assessment engine
│   │   │   ├── useSpeechToText.ts    # Voice recognition
│   │   │   └── useTextToSpeech.ts    # Text-to-speech synthesis
│   │   ├── lib/
│   │   │   ├── firebase.ts           # Firebase configuration
│   │   │   └── utils.ts              # Utility functions
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript type definitions
│   │   ├── App.tsx                   # Root component
│   │   ├── main.tsx                  # React entry point
│   │   └── index.css                 # Global styles
│   └── [Config files: vite.config.ts, tsconfig.json, package.json]
├── backend/
│   ├── main.py                       # FastAPI application entry
│   ├── limiter.py                    # Rate limiting middleware
│   ├── requirements.txt              # Python dependencies
│   ├── routers/
│   │   ├── chat.py                   # Groq LLM proxy
│   │   ├── text_analysis.py          # NLP emotion scoring
│   │   ├── face_analysis.py          # Facial expression detection
│   │   ├── emotion_fusion.py         # Multi-modal fusion engine
│   │   ├── insights.py               # AI wellness insights generation
│   │   ├── voice.py                  # Voice processing
│   │   └── voucher.py                # Reward system
│   └── models/
│       └── facial_expression_model_weights.h5
├── STRUCTURE_AND_LOGIC.md            # Detailed technical documentation
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.6.2** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **Firebase** - Authentication & database
- **Three.js** - 3D graphics
- **Spline** - 3D design integration

### Backend
- **FastAPI 0.104.1** - Fast web framework
- **Python 3.10+** - Core language
- **DeepFace** - Facial expression analysis
- **Hugging Face Transformers** - NLP models
- **TensorFlow/Keras** - ML model inference
- **Uvicorn** - ASGI server
- **Groq API** - LLM inference

### Infrastructure
- **Firebase** - Auth, Firestore, Storage
- **Groq Cloud** - LLM API access
- **Hugging Face Models** - Emotion detection model

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm/yarn
- **Python 3.10+** and pip
- **Git**
- Firebase account (free tier available)
- Groq API key

### Frontend Setup

```bash
# Clone repository
git clone https://github.com/technicalcouncil-gcoej/teamthinkai.git
cd teamthinkai

# Install dependencies
npm install

# Create .env file with Firebase config
echo "VITE_FIREBASE_API_KEY=your_key" > .env
echo "VITE_FIREBASE_PROJECT_ID=your_project" >> .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with API keys
echo "GROQ_API_KEY=your_groq_key" > .env
echo "FIREBASE_CREDENTIALS=path_to_firebase_json" >> .env

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

---

## 📖 API Documentation

Once the backend is running, access the interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

#### Chat
- `POST /chat/stream` - Stream chat responses from Groq

#### Analysis
- `POST /analyze/text` - Analyze text sentiment and emotion
- `POST /analyze/face` - Detect facial expressions from base64 image
- `POST /analyze/fusion` - Multi-modal emotion fusion

#### Insights
- `POST /insights/generate` - Generate wellness insights
- `POST /insights/therapist-match` - Get therapist recommendations

#### Voice
- `POST /voice/transcribe` - Speech-to-text conversion
- `GET /voice/synthesize` - Text-to-speech synthesis

#### Rewards
- `POST /voucher/generate` - Create reward vouchers
- `GET /voucher/validate` - Validate voucher codes

---

## 🧠 Risk Assessment Algorithm

MindSense uses a sophisticated **Multi-Modal Emotion Fusion** system:

### 1. Text Analysis
- Semantic emotion classification using DistilRoBERTa
- Crisis keyword detection
- Distress level quantification

### 2. Facial Expression Analysis
- Real-time face detection and emotion classification
- Confidence scoring for emotional signals
- Temporal smoothing with EMA

### 3. Fusion & Risk Scoring
$$FinalScore = (TextScore \times 0.6) + (FaceScore \times 0.4)$$

- Exponential Moving Average prevents erratic fluctuations
- Crisis thresholds trigger immediate interventions
- Longitudinal tracking for emotional patterns

See `STRUCTURE_AND_LOGIC.md` for detailed algorithms and mathematics.

---

## 📊 Usage

### For Users
1. **Sign Up**: Create account via Firebase authentication
2. **Chat**: Interact with MindSense AI therapist
3. **Webcam**: Enable facial expression analysis for enhanced understanding
4. **Games**: Engage with stress-reduction activities
5. **Dashboard**: View progress and insights
6. **Rewards**: Unlock wellness vouchers

### For Developers

#### Running Tests
```bash
# Frontend
npm run lint

# Backend
pytest backend/
```

#### Building for Production
```bash
# Frontend
npm run build

# Backend
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use React hooks and functional components
- Write meaningful commit messages
- Test changes before submitting PR

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 💡 Support & Feedback

- **Issues**: Report bugs or feature requests on [GitHub Issues](https://github.com/technicalcouncil-gcoej/teamthinkai/issues)
- **Discussions**: Join our community [discussions](https://github.com/technicalcouncil-gcoej/teamthinkai/discussions)
- **Documentation**: Check [STRUCTURE_AND_LOGIC.md](STRUCTURE_AND_LOGIC.md) for technical details

---

## ⚖️ Disclaimer

**⚠️ Important**: MindSense AI is a supportive tool and should not replace professional mental health treatment. If you or someone you know is in crisis, please contact:
- **National Suicide Prevention Lifeline**: 988 (US)
- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/
- **Crisis Text Line**: Text HOME to 741741

---

## 🙏 Acknowledgments

- Built with ❤️ by the Technical Council GCOEJ
- Powered by [Groq](https://groq.com) for fast LLM inference
- ML models from [Hugging Face](https://huggingface.co)
- Facial analysis by [DeepFace](https://github.com/serengp/deepface)
- Web framework [FastAPI](https://fastapi.tiangolo.com)
- UI framework [React](https://react.dev)

---

**Made with ❤️ for mental health support**
