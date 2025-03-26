import { NextResponse } from "next/server";
import { ContentManager } from "@/managers/contentManager";
import { ScriptModel } from "@/models/Script";
import connectDB from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, data, duration } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const contentManager = new ContentManager();
    const result = await contentManager.generateContent(
      title,
      data || "",
      duration || "short"
    );

    if (result.success) {
      const scriptDoc = new ScriptModel({
        title,
        script: result.script,
        score: result.validation.total,
        validation: result.validation,
      });
      await scriptDoc.save();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
