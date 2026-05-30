# VisionQ — AI Question Detector

Point your camera at any question (on screen, paper, whiteboard) and get instant AI answers.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your API key**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your ANTHROPIC_API_KEY
   ```

3. **Run the dev server**
   ```bash
   npm run dev
   ```

4. **Expose via ngrok (for mobile access)**
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3000
   ```

5. **Open on your phone**
   - Copy the ngrok HTTPS URL (e.g. `https://xxxx.ngrok-free.app`)
   - Open it in your phone's browser
   - Allow camera permissions
   - Tap "START SCANNING"

## How it works

- Camera passively captures a frame every N seconds (configurable: 2s, 4s, 6s, 10s)
- Each frame is sent to Claude Vision API
- Claude detects if there's a visible question in the frame
- If detected, it answers it immediately and shows it on screen
- Previous answers are saved in the history panel

## Features

- 📱 Mobile-responsive design
- 🔄 Front/rear camera flip
- ⏱️ Adjustable scan interval
- 📜 Answer history (last 10)
- 🚫 Deduplication (same question won't be answered twice)
