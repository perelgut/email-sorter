# AI-Powered Email Sorter

> Automated email classification and management using the Anthropic Claude API.

[![Deploy to GitHub Pages](https://github.com/{YOUR_GITHUB_USERNAME}/email-sorter/actions/workflows/deploy.yml/badge.svg)](https://github.com/{YOUR_GITHUB_USERNAME}/email-sorter/actions/workflows/deploy.yml)

---

## Project Documents

| Document | ID | Version |
|---|---|---|
| Requirements | REQ-EMAILSORT-001 | v1.1 |
| Technical Specification | SPEC-EMAILSORT-001 | v1.0 |
| Project Plan | PROJ-EMAILSORT-001 | v1.0 |

---

## Technology Stack

| Concern | Technology |
|---|---|
| Frontend | React.js (HTML / CSS / JavaScript) |
| Backend | Node.js — Firebase Cloud Functions |
| Database | Firebase Firestore |
| Authentication | Firebase Auth — Google OAuth 2.0 |
| AI Classification | Anthropic Claude API (Haiku primary) |
| Email — Gmail | Google Gmail API v1 |
| Email — Outlook | Microsoft Graph API |
| Email — Generic | IMAP / SMTP (imap + nodemailer) |
| Hosting — Frontend | GitHub Pages |
| Hosting — Backend | Firebase Cloud Functions (Blaze, $0 spend cap) |
| CI/CD | GitHub Actions |
| IDE | Visual Studio Code |

---

## Repository Structure

```
email-sorter/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── frontend/                   # React application
│   ├── public/
│   │   ├── index.html
│   │   └── 404.html            # SPA routing fallback for GitHub Pages
│   └── src/
│       ├── components/         # React UI components
│       ├── hooks/              # Custom React hooks
│       ├── services/           # Cloud Function call wrappers
│       ├── context/            # React context providers
│       ├── App.jsx
│       └── index.jsx
├── functions/                  # Firebase Cloud Functions (Node.js)
│   └── src/
│       ├── auth/               # OAuth token exchange helpers
│       ├── email/              # Provider integrations (gmail.js, outlook.js, imap.js)
│       ├── classifier/         # Anthropic Claude API integration
│       ├── rules/              # User-defined rule engine
│       └── index.js            # Function exports
├── firestore.rules             # Firestore Security Rules
├── firestore.indexes.json      # Composite index definitions
├── firebase.json               # Firebase project configuration
└── README.md
```

---

## Branch Strategy

**`main` branch only.**

- All development commits directly to `main`.
- GitHub Actions deploys to GitHub Pages on every push to `main`.
- This strategy is appropriate for a single-developer project.
- If multiple developers are added in future, migrate to feature-branch workflow (documented in `BRANCH-STRATEGY.md`).

**Protected branch rules on `main`:**
- Require status checks to pass before merging (CI must be green).
- No force pushes.

---

## Local Development Setup

### Prerequisites

- Node.js 20 LTS — [nodejs.org](https://nodejs.org)
- Firebase CLI — `npm install -g firebase-tools`
- VS Code — [code.visualstudio.com](https://code.visualstudio.com)

### 1. Clone the repository

```bash
git clone https://github.com/{YOUR_GITHUB_USERNAME}/email-sorter.git
cd email-sorter
```

### 2. Install dependencies

```bash
# Frontend
cd frontend && npm install && cd ..

# Cloud Functions
cd functions && npm install && cd ..
```

### 3. Configure environment variables

```bash
# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your Firebase config values

# Functions
cp functions/.env.example functions/.env
# Edit functions/.env with your Anthropic API key and encryption secret
```

### 4. Start Firebase Emulators

```bash
firebase emulators:start
# Auth: http://localhost:9099
# Firestore: http://localhost:8080
# Functions: http://localhost:5001
```

### 5. Start the React development server

```bash
cd frontend && npm start
```

The app will open at `http://localhost:3000` and connect to the local emulators automatically when `REACT_APP_USE_EMULATORS=true` is set in `.env.local`.

---

## GitHub Secrets Required

The following secrets must be configured in **Settings → Secrets and variables → Actions** before the CI/CD pipeline will work:

| Secret | Description |
|---|---|
| `FIREBASE_TOKEN` | Firebase CI token — run `firebase login:ci` to generate |
| `REACT_APP_FIREBASE_API_KEY` | Firebase project API key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID |
| `REACT_APP_FUNCTIONS_BASE_URL` | Deployed Cloud Functions base URL |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `REACT_APP_MS_CLIENT_ID` | Microsoft Entra application client ID |
| `ANTHROPIC_API_KEY` | Anthropic API key — functions only, never exposed to frontend |
| `ENCRYPTION_SECRET` | 32-char secret for AES-256-GCM IMAP credential encryption |

---

## Deployment

Deployment is fully automated via GitHub Actions. Push to `main` to trigger.

Manual deployment (if needed):
```bash
firebase deploy --only functions,firestore:rules
```

Frontend deploys via GitHub Actions only — the build step injects environment variables from GitHub Secrets.

---

## Cost Profile

| Service | Plan | Monthly Cost |
|---|---|---|
| GitHub | Free | $0 |
| GitHub Pages | Free | $0 |
| GitHub Actions | Free (2,000 min/month) | $0 |
| Firebase (Blaze + $0 cap) | Free allocation | $0 |
| Anthropic Claude API | Pay-per-token (existing key) | ~$0.23 typical |

---

## Licence

Private project. All rights reserved.
