import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Helper: wait for a bit (avoids hitting rate limits)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to split text into chunks
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

export async function POST(request) {
  try {
    // Step 1: Get the uploaded file
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File received:", file.name, file.size, "bytes");

    // Generate a unique ID for this document — used as a Pinecone namespace
    // so each upload's data stays isolated from other uploads
    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Step 2: Extract text — method depends on file type (PDF vs Word)
    const arrayBuffer = await file.arrayBuffer();
    let fullText = "";

    const isDocx =
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");

    const isTxt =
      file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");

    if (isDocx) {
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      fullText = result.value;
    } else if (isTxt) {
      fullText = new TextDecoder("utf-8").decode(arrayBuffer);
    } else {
      const buffer = new Uint8Array(arrayBuffer);
      const pdf = await getDocumentProxy(buffer);
      const { text } = await extractText(pdf, { mergePages: true });
      fullText = text;
    }

    console.log("Extracted text length:", fullText ? fullText.length : 0);
    console.log("First 200 chars:", fullText ? fullText.slice(0, 200) : "(empty)");

    if (!fullText || fullText.trim().length < 20) {
      return Response.json(
        { error: "This file appears to have no readable text. It may be a scanned or image-based document." },
        { status: 400 }
      );
    }

    // Step 3: Split text into chunks
    const chunks = chunkText(fullText);
    console.log("Number of chunks created:", chunks.length);

    if (chunks.length === 0) {
      return Response.json({ error: "No text chunks could be created from this PDF." }, { status: 400 });
    }

    // Step 4: Generate embeddings for each chunk using Gemini
    const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Embedding chunk ${i + 1} of ${chunks.length}...`);

      const result = await embeddingModel.embedContent({
        content: { parts: [{ text: chunks[i] }] },
        outputDimensionality: 768,
      });

      const embedding = result.embedding.values;

      vectors.push({
        id: `chunk-${Date.now()}-${i}`,
        values: embedding,
        metadata: {
          text: chunks[i],
          fileName: file.name,
        },
      });

      // Wait 1 second between requests to avoid hitting the free tier rate limit
      if (i < chunks.length - 1) {
        await sleep(1000);
      }
    }

    console.log("Total vectors created:", vectors.length);

    if (vectors.length === 0) {
      return Response.json({ error: "Failed to generate embeddings for this document." }, { status: 500 });
    }

    // Step 5: Store vectors in Pinecone, isolated in this document's namespace
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
    await index.namespace(docId).upsert(vectors);

    console.log("Successfully upserted to Pinecone under namespace:", docId);

    return Response.json({
      success: true,
      message: `Processed ${chunks.length} chunks from ${file.name}`,
      chunksCount: chunks.length,
      docId,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: error.message || "Something went wrong" }, { status: 500 });
  }
}