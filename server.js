// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

// Load keys from .env file
dotenv.config();

const app = express();
app.use(cors()); 

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY. Copy .env.example to .env and add your key.");
  process.exit(1);
}

// DATA FOR CONNECTION

const SESSION_INSTRUCTIONS = `
  # Role & Objective
  You are an Interviewing Agent designed to conduct a brief interview in ENGLISH with an interviewee.
  Your objective is to ask exactly three interview questions in order, collect clear answers, and then end the call.
  If the interviewee talks about unrelated things to the interview, warn him up to two times. The third time call the tool "end_session" to END the interview.

  # Personality & Tone
  ## Personality
  - Friendly, calm and approachable interviewing expert.
  ## Tone
  - Concise, confident, never fawning.
  ## Level of Formality
  - Keep it professional and on task. Use polite language yet remain friendly. You can address the interviewee by name if given.
  ## Pacing
  - Brief pauses can be used for emphasis, ensuring the interviewee has time to process your questions.

  # Instructions / Rules
  1) Ask the next question available from the Question List. IMMEDIATELY call the tool "on_question_flow_next".
  2) Wait for answer or clarification requests before continuing.
    - IF the interviewee asks a question about the current question or needs clarification, PROVIDE CLARIFICATION and DO NOT proceed to the next question until the clarification is resolved.  
    - AVOID chit-chat, small talk, or topics unrelated to the questions.
  3) ONLY after receiving the user's response, proceed to the next QUESTION on the list.
  4) Repeat until finished.

  # Question List
  1) "What is your name?"
  2) "Where do you live?"
  3) "What are your salary expectations?"
 
  # End of Interview
  - Once all three questions are answered, say “Thank you. The interview is now complete.”
  - Then call the tool "end_session".
`;


const HEADERS = {
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
};

const gptFunctions = [
    {
        type: "function",
        name: "end_session",
        description: "",
        parameters: {},
    },
    {
        type: "function",
        name: "on_question_flow_next",
        description: "Called immediately after a question from the list has been asked",
        parameters: {
          type: "object",
          properties: {}
        }
    }
];

const sessionConfig = JSON.stringify({
  expires_after: {
      anchor: "created_at",
      seconds: 120
    },
  session: {
    type: "realtime",
    model: "gpt-realtime",
    audio: {
        input: {
            transcription: {
                model: "gpt-4o-transcribe",
                language: "en",
            },
            noise_reduction: {type: "far_field"},
            turn_detection: {
                type: "server_vad",
                threshold: 0.3,              // 0–1 (higher = need louder input to trigger)
                prefix_padding_ms: 300,      // ms of audio to include before detected start
                silence_duration_ms: 1_500,  // ms of silence to mark end of speech
                idle_timeout_ms: 30_000, // ms after last msg to trigger timeout after which model response will be triggered auto.
            },
        },
        output: {voice: "cedar",}
    },
    instructions: SESSION_INSTRUCTIONS,
    max_output_tokens: 4096,
    output_modalities: ["audio"],
    tools: gptFunctions,
  },
});

// "Step 1" - API route for ephemeral token generation
app.get("/token", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: HEADERS,
        body: sessionConfig,
      },
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});