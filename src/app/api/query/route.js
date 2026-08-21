import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

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

    // Step 3: Search Pinecone for the most relevant chunks — only within this document's namespace
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
    const chatModel = genAI.getGenerativeModel({ model: "models/gemini-3.6-flash" });

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

    const result = await chatModel.generateContent(prompt);
    const answer = result.response.text();

    console.log("Answer generated successfully.");

    return Response.json({ answer });
  } catch (error) {
    console.error("Query error:", error);
    return Response.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}