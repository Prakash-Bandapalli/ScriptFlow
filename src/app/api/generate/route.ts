// /pages/api/generate.ts (or /app/api/generate/route.ts)

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ContentManager } from "@/managers/contentManager";
import { GenreClassifierAgent } from "@/agents/genreClassifier";
import { ScriptModel } from "@/models/Script";
import connectDB from "@/lib/mongodb";
import { StatusUpdate } from "@/types";

// --- Database Pattern Fetching Logic (Keep as is) ---
const PATTERN_COLLECTION = "patterns";
const PATTERN_KEY_FIELD = "genre";
const PATTERN_VALUE_FIELD = "data";

async function fetchGenrePattern(genre: string): Promise<string> {
  try {
    // console.log("genre passed: ", genre); // uncomment for debugging if needed
    await connectDB();
    const client = mongoose.connection.getClient();
    const db = client.db();
    const collection = db.collection(PATTERN_COLLECTION);
    const patternDoc = await collection.findOne({ [PATTERN_KEY_FIELD]: genre });
    console.log(
      // uncomment for debugging if needed
      `data feched: ${patternDoc ? patternDoc[PATTERN_VALUE_FIELD] : "nothing"}`
    );

    if (patternDoc && typeof patternDoc[PATTERN_VALUE_FIELD] === "string") {
      console.log(
        // uncomment for debugging if needed
        `Fetched pattern for genre: ${genre} using existing connection's client.`
      );
      return patternDoc[PATTERN_VALUE_FIELD];
    } else {
      console.log(
        // uncomment for debugging if needed
        `No pattern found for genre: ${genre} using existing connection's client.`
      );
      return "";
    }
  } catch (error) {
    console.error(
      "Error fetching genre pattern from DB using existing connection's client:",
      error
    );
    return "";
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
    const detectedGenre = await genreClassifier.classifyGenre(title); // Keep this result
    logStatus(`🕵️ Genre classification result: "${detectedGenre}"`);
    // --- End Genre Classification ---

    // --- Fetch Pattern ---
    let genrePatternText = "";
    const NOT_FOUND_MESSAGE = "genre is not found try something else";
    if (detectedGenre !== NOT_FOUND_MESSAGE) {
      logStatus(`📚 Fetching style pattern for genre: "${detectedGenre}"...`);
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
    // Pass detectedGenre to the manager
    const result = await contentManager.generateContent(
      title,
      data || "",
      duration || "short",
      genrePatternText,
      detectedGenre // <-- Pass the classification result here
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
        // Optionally add this error to the response if needed
        // result.statusUpdates.push({ message: `DB Save Error: ${dbError.message}`, timestamp: new Date().toISOString() });
      }
    } else {
      logStatus(
        `❌ Script generation did not meet quality threshold or failed.`
      );
    }
    // --- End Save Result ---

    logStatus("🎉 Process finished. Returning results.");
    return NextResponse.json({
      ...result,
      statusUpdates: allStatusUpdates, // Return combined status updates
    });
  } catch (error: any) {
    console.error("API Route Unhandled error:", error);
    logStatus(`💥 Unhandled Server Error: ${error.message}`);
    // Ensure status updates collected so far are returned even in case of error
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
        statusUpdates, // Return updates collected up to the error point
        interactions: [], // Return empty interactions on server error
        script: "",
        validation: undefined,
        attempts: 0,
      },
      { status: 500 }
    );
  }
}
