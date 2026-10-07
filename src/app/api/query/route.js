import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

// Give the function enough time for retries (Vercel)
export const maxDuration = 30;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Models to try in order. If the first one is busy (503), the next one is used.
const CHAT_MODELS = [
  "models/gemini-3.6-flash",
  "models/gemini-3.5-flash",
  "models/gemini-3.5-flash-lite",
];

const ATTEMPTS_PER_MODEL = 2;
const RETRY_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Errors that are temporary and worth retrying / switching model for
function isTemporaryError(error) {
  const msg = String(error?.message || "");
  return (
    error?.status === 503 ||
    error?.status === 429 ||
    error?.status === 500 ||
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.toLowerCase().includes("high demand") ||
    msg.toLowerCase().includes("overloaded")
  );
}

// Try each model (with a retry) until one works
async function generateWithFallback(prompt) {
  let lastError = null;

  for (const modelName of CHAT_MODELS) {
    const model = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        console.log(`Answer generated with ${modelName} (attempt ${attempt})`);
        return result.response.text();
      } catch (error) {
        lastError = error;
        console.error(`${modelName} attempt ${attempt} failed:`, error.message);

        // Not a temporary problem (bad key, bad request, etc.) -> stop right away
        if (!isTemporaryError(error)) throw error;

        if (attempt < ATTEMPTS_PER_MODEL) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
  }

  // All models failed
  throw lastError;
}

export async function POST(request) {
  try {
    // Step 1: Get the question and document ID from the request
    const { question, docId } = await request.json();

    if (!question || question.trim().length === 0) {
      return Response.json({ error: "No question provided" }, { status: 400 });
    }

    if (!docId) {
      return Response.json({ error: "No document selected" }, { status: 400 });
    }

    console.log("Question received:", question, "| Document namespace:", docId);

    // Step 2: Convert the question into an embedding (same model as upload)
    const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

    const embedResult = await embeddingModel.embedContent({
      content: { parts: [{ text: question }] },
      outputDimensionality: 768,
    });

    const questionEmbedding = embedResult.embedding.values;

    // Step 3: Search Pinecone for the most relevant chunks, only within this document's namespace
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    const searchResults = await index.namespace(docId).query({
      vector: questionEmbedding,
      topK: 4,
      includeMetadata: true,
    });

    console.log("Matches found:", searchResults.matches.length);

    if (searchResults.matches.length === 0) {
      return Response.json({
        answer: "I couldn't find any relevant information in the uploaded documents. Please upload a document first.",
      });
    }

    // Step 4: Build context from the retrieved chunks
    const context = searchResults.matches
      .map((match) => match.metadata.text)
      .join("\n\n---\n\n");

    // Step 5: Ask Gemini to answer using only that context
    const prompt = `You are a helpful assistant. You are given context from a document the user uploaded, followed by their question.

Instructions:
1. First, try to answer using ONLY the document context below.
2. If the document context clearly contains the answer, answer from it and don't mention anything about "general knowledge."
3. If the document context does NOT contain the answer, say so briefly, then answer using your own general knowledge instead. Make it clear when you're doing this, for example: "This isn't mentioned in the document, but generally speaking..."

Formatting rules (important):
- Do NOT use markdown symbols like **, *, #, or backticks.
- If listing multiple points, put each one on its own line starting with a dash (-), with a blank line between points.
- Keep it concise and easy to scan. Avoid long single-paragraph walls of text.

Document context:
${context}

Question: ${question}

Answer clearly and concisely, following the formatting rules above.`;

    const answer = await generateWithFallback(prompt);

    return Response.json({ answer });
  } catch (error) {
    console.error("Query error:", error);

    // Friendly message instead of the raw Google error
    if (isTemporaryError(error)) {
      return Response.json(
        { error: "The AI is very busy right now. Please try again in a minute." },
        { status: 503 }
      );
    }

    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
