// /pages/api/generate.ts (or /app/api/generate/route.ts)

import { NextResponse } from "next/server";
import mongoose from "mongoose"; // Import mongoose
import { ContentManager } from "@/managers/contentManager";
import { GenreClassifierAgent } from "@/agents/genreClassifier";
import { ScriptModel } from "@/models/Script";
import connectDB from "@/lib/mongodb"; // Your existing DB connection utility
import { StatusUpdate } from "@/types";

// --- Database Pattern Fetching Logic (Using existing Mongoose connection's client) ---
const PATTERN_COLLECTION = "patterns"; // The name of your patterns collection
const PATTERN_KEY_FIELD = "genre"; // Field in DB matching the genre name (e.g., "history")
const PATTERN_VALUE_FIELD = "data"; // Field containing the pattern text

async function fetchGenrePattern(genre: string): Promise<string> {
  try {
    console.log("genre passed: ", genre);
    // Ensure DB is connected via the shared utility
    await connectDB();

    // --- Access the underlying native MongoDB Db object via the client ---
    const client = mongoose.connection.getClient(); // Get the MongoClient instance

    // Mongoose might not expose the default DB directly on the client,
    // so specify it if needed, or rely on the default from the URI.
    // If your MONGODB_URI includes the database name, client.db() is usually sufficient.
    // If not, you might need: client.db("yourDatabaseName")
    const db = client.db(); // Get the default Db instance from the client

    const collection = db.collection(PATTERN_COLLECTION);
    // --- End Accessing Native DB ---

    const patternDoc = await collection.findOne({ [PATTERN_KEY_FIELD]: genre });
    console.log(
      `data feched: ${patternDoc ? patternDoc[PATTERN_VALUE_FIELD] : "nothing"}`
    );

    if (patternDoc && typeof patternDoc[PATTERN_VALUE_FIELD] === "string") {
      console.log(
        `Fetched pattern for genre: ${genre} using existing connection's client.`
      );
      return patternDoc[PATTERN_VALUE_FIELD];
    } else {
      console.log(
        `No pattern found for genre: ${genre} using existing connection's client.`
      );
      return "";
    }
  } catch (error) {
    console.error(
      "Error fetching genre pattern from DB using existing connection's client:",
      error
    );
    return ""; // Return empty string on error
  }
}
// --- End Database Pattern Fetching Logic ---

export async function POST(request: Request) {
  const initialTimestamp = new Date().toISOString();
  const statusUpdates: StatusUpdate[] = [
    { message: "Received request...", timestamp: initialTimestamp },
  ];

  const logStatus = (message: string) => {
    statusUpdates.push({ message, timestamp: new Date().toISOString() });
    console.log(`[API Status] ${new Date().toLocaleTimeString()}: ${message}`);
  };

  try {
    // Connect DB early - needed for both pattern fetching and saving results
    logStatus("Connecting to database...");
    await connectDB();
    logStatus("Database connected.");

    const body = await request.json();
    const { title, data, duration } = body;

    if (!title) {
      logStatus("Error: Title is missing.");
      return NextResponse.json(
        { error: "Title is required", statusUpdates },
        { status: 400 }
      );
    }
    logStatus(`Received Title: "${title}"`);

    // --- Genre Classification ---
    logStatus("🤔 Analyzing title genre...");
    const genreClassifier = new GenreClassifierAgent();
    const detectedGenre = await genreClassifier.classifyGenre(title);
    logStatus(`🕵️ Genre classification result: "${detectedGenre}"`);
    // --- End Genre Classification ---

    // --- Fetch Pattern ---
    let genrePatternText = "";
    const NOT_FOUND_MESSAGE = "genre is not found try something else";
    if (detectedGenre !== NOT_FOUND_MESSAGE) {
      logStatus(`📚 Fetching style pattern for genre: "${detectedGenre}"...`);
      // Now uses the refactored function relying on the established Mongoose connection's client
      genrePatternText = await fetchGenrePattern(detectedGenre);
      if (genrePatternText) {
        logStatus(`✅ Pattern found for "${detectedGenre}".`);
      } else {
        logStatus(
          `⚠️ No specific pattern found for "${detectedGenre}". Proceeding with general style.`
        );
      }
    } else {
      logStatus(
        `ℹ️ Genre not matched to predefined patterns. Proceeding with general style.`
      );
    }
    // --- End Fetch Pattern ---

    logStatus("🚀 Initializing content generation manager...");
    const contentManager = new ContentManager();

    // --- Generate Content ---
    const result = await contentManager.generateContent(
      title,
      data || "",
      duration || "short",
      genrePatternText // Pass the fetched pattern
    );
    // --- End Generate Content ---

    // Combine status updates from API route and manager
    const allStatusUpdates = [
      ...statusUpdates,
      ...(result.statusUpdates || []),
    ];

    // --- Save Result (if successful) ---
    if (result.success) {
      try {
        logStatus("💾 Saving successful script to database...");
        const scriptDoc = new ScriptModel({
          title,
          script: result.script,
          score: result.validation.total,
          validation: {
            scores: result.validation.scores,
            total: result.validation.total,
            passed: result.validation.passed,
            feedback: result.validation.feedback,
            fullEvaluation: result.validation.fullEvaluation,
          },
          createdAt: new Date(),
        });
        await scriptDoc.save();
        logStatus("✅ Script saved successfully.");
      } catch (dbError: any) {
        logStatus(`⚠️ Error saving script to database: ${dbError.message}`);
        console.error("Database Save Error:", dbError);
      }
    } else {
      logStatus(
        `❌ Script generation did not meet quality threshold or failed.`
      );
    }
    // --- End Save Result ---

    logStatus("🎉 Process finished. Returning results.");
    // Return combined result from manager + API status updates
    return NextResponse.json({
      ...result,
      statusUpdates: allStatusUpdates,
    });
  } catch (error: any) {
    console.error("API Route Unhandled error:", error);
    logStatus(`💥 Unhandled Server Error: ${error.message}`);
    return NextResponse.json(
      { error: "Internal server error", success: false, statusUpdates },
      { status: 500 }
    );
  }
}
