# Mahi Assistant

Mahi Assistant is a browser-based chat interface with Gemini-powered replies, image analysis, optional voice input/output, response-language selection, and a face-detection camera page.

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- A modern browser such as Chrome or Edge for microphone and camera features

## Run locally

Do **not** open `index.html` with Live Server or directly from the filesystem. The application needs its Node server to keep the Gemini key private and to provide the `/api/generate` endpoint.

## Get and use a Gemini API key

1. Open [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account and select **Create API key**.
3. Copy the newly created Gemini API key.
4. Use it only in your terminal command below. Do not paste it into `script.js`, `server.js`, or `index.html`.

Open a PowerShell terminal in the project folder and run:

```powershell
cd "D:\MAHI'S\MAHI'S"
$env:GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE"
node server.js
```

Replace `PASTE_YOUR_GEMINI_API_KEY_HERE` with the Gemini API key copied from Google AI Studio. For example, keep the quotes and paste the full key between them:

```powershell
$env:GEMINI_API_KEY = "your-real-key-goes-here"
```

When the terminal shows the following message, open the app in a browser:

```text
Mahi Assistant is running at http://localhost:3000
```

Open: <http://localhost:3000>

Keep the terminal open while using the app. Press `Ctrl+C` to stop the server.

## Deploy on GitHub and Netlify

This repository includes a Netlify Function at `netlify/functions/generate.mjs`. It securely sends Gemini requests on the server, so the API key is never exposed to visitors. The `netlify.toml` rewrite sends browser requests from `/api/generate` to that function automatically.

### 1. Push the project to GitHub

Create an empty GitHub repository, then run these commands in this project folder. Replace the example repository URL with your own.

```powershell
git init
git add .
git commit -m "Initial Mahi Assistant deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Never add your Gemini API key to a file or commit it to GitHub. The included `.gitignore` excludes common local secret files.

### 2. Create a Netlify site

1. Sign in to [Netlify](https://app.netlify.com/).
2. Select **Add new project** → **Import an existing project**.
3. Select GitHub, authorize Netlify if asked, and choose your repository.
4. Keep the build settings from `netlify.toml`:
   - Build command: leave empty
   - Publish directory: `.`
5. Select **Deploy site**.

### 3. Add the Gemini key in Netlify

Before using the deployed chat, add the key in Netlify:

1. Open your Netlify project.
2. Go to **Project configuration** → **Environment variables**.
3. Add a variable named `GEMINI_API_KEY`.
4. Paste the Gemini API key as its value and save it. If scopes are shown, include **Functions**.
5. Trigger a new deploy so the function receives the new value.

Your deployed site will be available at the Netlify URL, such as `https://your-site-name.netlify.app`.

### Optional: test the Netlify Function locally

Netlify CLI runs the function and redirects exactly as Netlify will in production:

```powershell
$env:GEMINI_API_KEY = "PASTE_YOUR_GEMINI_API_KEY_HERE"
npx netlify-cli dev
```

Open the localhost address printed by the command.

## Features

- Gemini chat with automatic retry for temporary capacity errors
- Automatic fallback to `gemini-3.1-flash-lite` if `gemini-3.5-flash` is temporarily unavailable
- Image upload and image analysis
- Voice input (Chrome/Edge)
- Optional spoken responses
- English, Spanish, French, German, Hindi, Japanese, and Chinese response options
- Face detection, expressions, age, and gender estimates at <http://localhost:3000/index1.html>

## Troubleshooting

| Message or symptom | What to do |
| --- | --- |
| `ERR_CONNECTION_REFUSED` | Start the server with `node server.js`, then open `http://localhost:3000`. |
| `The assistant server was not found` | You are probably using Live Server (`127.0.0.1:5500`). Use `http://localhost:3000` instead. |
| `API key not valid` | Replace the placeholder with a real active Gemini API key, restart the server, and refresh the page. |
| `high demand` | This is a temporary Gemini capacity issue. The app retries and then tries its fallback model automatically. |
| Camera or microphone does not work | Use Chrome or Edge, allow the permission prompt, and access the page through `http://localhost:3000`. |

## Security

- Never paste an API key into `script.js`, `server.js`, `index.html`, or any file committed to Git.
- Set `GEMINI_API_KEY` only in the terminal session before starting the server.
- For Netlify, add `GEMINI_API_KEY` in the Netlify environment-variable settings, not in `netlify.toml`.
- If a key is exposed, rotate it in Google AI Studio immediately.
