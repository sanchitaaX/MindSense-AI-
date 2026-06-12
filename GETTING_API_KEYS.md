# 🔑 Step-by-Step Guide to Get API Keys

This guide walks you through creating and finding all the environment variable keys required to run and deploy **MindSense AI**.

---

## 1. 🔥 How to Get Firebase Keys
Firebase is used for user authentication and storing user data.

1. **Go to Firebase Console**:
   Open [console.firebase.google.com](https://console.firebase.google.com/) and log in with your Google account.

2. **Create a Firebase Project**:
   - Click **Add project** (or **Create a project**).
   - Enter a name for your project (e.g., `MindSense AI`).
   - Click **Continue**. You can choose to enable or disable Google Analytics (disabling it is faster for setup).
   - Click **Create project** and wait for it to build.

3. **Register a Web App**:
   - Once your project is open, click the **Web icon** (`</>`) on the project home screen.
   - Enter an App nickname (e.g., `mindsense-web`).
   - Click **Register app**.

4. **Copy the Configuration Keys**:
   - Firebase will show you a code block containing `firebaseConfig`. It looks like this:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSyA1...",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:12345:web:abcdef..."
     };
     ```
   - Copy these values. They map directly to your environment variables:
     * `VITE_FIREBASE_API_KEY` = `apiKey`
     * `VITE_FIREBASE_AUTH_DOMAIN` = `authDomain`
     * `VITE_FIREBASE_PROJECT_ID` = `projectId`
     * `VITE_FIREBASE_STORAGE_BUCKET` = `storageBucket`
     * `VITE_FIREBASE_MESSAGING_SENDER_ID` = `messagingSenderId`
     * `VITE_FIREBASE_APP_ID` = `appId`

5. **Enable Firebase Authentication** (Crucial for login to work):
   - In the left sidebar of the Firebase Console, click **Build** -> **Authentication**.
   - Click **Get Started**.
   - Under the **Sign-in method** tab, enable **Email/Password** provider and save.

---

## 2. ⚡ How to Get the Groq API Key
Groq is used by the backend to power the AI chatbot therapist with super-fast responses.

1. **Go to Groq Console**:
   Open [console.groq.com](https://console.groq.com/) and sign up or sign in.

2. **Navigate to API Keys**:
   - In the left sidebar menu, click on **API Keys**.

3. **Generate Key**:
   - Click the **Create API Key** button.
   - Give it a name (e.g., `MindSense AI`).
   - Click **Submit** or **Generate**.

4. **Copy the Key**:
   - Copy the generated API key immediately (it starts with `gsk_`). 
   - *Note: You will only be shown this key once, so copy it and save it in a safe place.*
   - This key maps to `GROQ_API_KEY` on your backend.
