# Admin Panel - Firebase Authentication

A modern admin panel built with React, TypeScript, and Vite, featuring Firebase authentication with multiple sign-in methods: Email/Password, Google OAuth, and Phone Number.

## Features

- 🔐 **Email Authentication** - Sign up and sign in with email and password
- 🌐 **Google Authentication** - One-click sign in with Google account
- 📱 **Phone Authentication** - Sign in using phone number with SMS verification
- 🛡️ **Protected Routes** - Secure dashboard accessible only to authenticated users
- 🎨 **Modern UI** - Beautiful, responsive design with gradient backgrounds

## Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication methods:
   - Go to **Authentication** > **Sign-in method**
   - Enable **Email/Password**
   - Enable **Google** (configure OAuth consent screen)
   - Enable **Phone** (requires Firebase Blaze plan for production)
3. Get your Firebase configuration:
   - Go to **Project Settings** > **General** > **Your apps**
   - Copy the Firebase SDK configuration values

### 3. Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Run the Development Server

```bash
yarn dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable components
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Firebase authentication context
├── firebase/           # Firebase configuration
│   └── config.ts
├── pages/              # Page components
│   ├── Login.tsx       # Main login page with auth options
│   ├── EmailAuth.tsx   # Email/password authentication
│   ├── GoogleAuth.tsx  # Google OAuth authentication
│   ├── PhoneAuth.tsx   # Phone number authentication
│   └── Dashboard.tsx   # Protected admin dashboard
└── App.tsx             # Main app component with routing
```

## Usage

1. Navigate to `/login` to see authentication options
2. Choose your preferred authentication method:
   - **Email**: Sign up or sign in with email and password
   - **Google**: One-click Google sign-in
   - **Phone**: Enter phone number and verify with SMS code
3. After authentication, you'll be redirected to the protected dashboard

## Technologies Used

- React 19
- TypeScript
- Vite
- Firebase Authentication
- React Router DOM
- CSS3 (Modern styling with gradients)

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
