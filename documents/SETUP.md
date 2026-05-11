# Setup and Deployment Guide

This document outlines all the steps necessary to set up, install, and deploy this Tabata/Interval Timer application locally on a macOS device, and how to deploy it into Google Cloud. 

## 1. Local Setup on macOS

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher is recommended. Install via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install 18
  nvm use 18
  ```
- **Git**: Provided by default on macOS, or can be updated using `brew install git`.

### Installation & Running Locally

1. **Clone the repository** (if not already downloaded):
   ```bash
   git clone <repository_url>
   cd <repository_name>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open a browser and navigate to `http://localhost:3000` (or the port specified in your output).

---

## 2. Audio Files Verification

**Note on AudioFiles:** You might have noticed that there are no `.mp3`, `.wav`, or `.ogg` files in this project's directory. 

This is intentional! The application uses the **Web Audio API** (`window.AudioContext`) in `src/App.tsx` (`playSound` function) to programmatically generate/synthesize all timer beeps and ticks in real-time. 
This provides a more robust offline-capable experience, prevents latency issues, and removes the need to deploy and load heavy audio files.

---

## 3. Deployment to Google Cloud (Cloud Run)

The easiest way to deploy this React/Vite Single Page Application (SPA) to Google Cloud is to build the static files and serve them using a lightweight web server (like NGINX), or to use Google Cloud Run with the built-in Buildpacks.

### Prerequisites for Google Cloud
- **Google Cloud SDK (`gcloud`)**: Install via [Homebrew](https://formulae.brew.sh/cask/google-cloud-sdk) or the [official docs](https://cloud.google.com/sdk/docs/install-sdk).
  ```bash
  brew install --cask google-cloud-sdk
  ```
- A Google Cloud Project with Billing enabled.

### Deployment Process (using gcloud)

1. **Authenticate your CLI**:
   ```bash
   gcloud auth login
   gcloud config set project [YOUR_PROJECT_ID]
   ```

2. **Build the Production Distrubtion**:
   Depending on whether you plan to deploy it as a static bucket or via Cloud Run, you can build the standard static assets.
   ```bash
   npm run build
   ```
   *This outputs production files to the `dist/` directory.*

3. **Option A: Deploy to Firebase Hosting (Easiest for SPAs)**
   If you have Firebase enabled on your GCP project:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting # Select default settings and set 'dist' as public directory
   firebase deploy
   ```

4. **Option B: Deploy to Cloud Run (Containerized SPA)**
   Because this environment automatically uses Buildpacks, we can deploy NodeJS apps to Cloud Run directly from source by providing a `start` script.
   
   However, since this is a Vite-based SPA, ensure `package.json` contains a production server script, or let Cloud Build automatically create a Node environment. First, ensure a `start` script is in your `package.json` to tell the environment how to run the production app (like using `express` or `serve`).

   Then execute:
   ```bash
   gcloud run deploy tabata-timer \
     --source . \
     --region us-east1 \
     --allow-unauthenticated
   ```
   Google Cloud Build will detect Node, build the project, package it, and return a public-facing URL you can visit.

---

## 4. Maintenance / Contribution

- The project uses **Vite** for fast HMR and compilation. 
- **TailwindCSS** + **framer-motion** are the primary libraries handling styling and animations.
- Refer to `AGENTS.md` and `ARCHITECTURE.md` (in the `documents/` folder) for technical conventions and prompt guidelines for AI agents working on this project.
