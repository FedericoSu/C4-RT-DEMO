# AI Interviewer

A voice interviewer that runs in the browser. It uses the OpenAI Realtime API to ask three short questions out loud and listens to the answers through your microphone.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- An OpenAI API key with access to the Realtime API
- A browser with a microphone, such as Chrome or Edge

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and put your key in it:

```
OPENAI_API_KEY=sk-...
```

## Run

1. Start the server:
   ```bash
   npm start
   ```
   You should see `Server running on http://localhost:3000`.
2. Open `index.html` in your browser. You can double-click the file or use VS Code Live Server.
3. Allow microphone access and start the interview.

Keep the server running while you use the page.

## Project files

| File | What it does |
|---|---|
| `server.js` | A small Express server that keeps your API key private and gives the browser a temporary token at `/token`. It also holds the interviewer's instructions and questions. |
| `index.html` | The interview page. |
| `index_cost/index.html` | The same page with a cost estimate. When the session ends, it downloads the transcript along with the token usage and an estimated price. |
| `.env.example` | A template for your `.env` file. |

## How it works

1. The browser asks `server.js` for a token (`GET /token`).
2. The server uses your real key to request a temporary client secret from OpenAI. That secret expires after 2 minutes.
3. The browser uses the temporary secret to connect straight to OpenAI over WebRTC. Your real key never reaches the browser.

## Customizing

Everything below is in `server.js`:

- **Questions and behavior:** edit `SESSION_INSTRUCTIONS`.
- **Voice, language and turn detection:** edit `sessionConfig`.
