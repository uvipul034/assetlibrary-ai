import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Note: We do NOT authenticate the incoming request using cookies here because
    // this endpoint is called server-to-server asynchronously from /api/upload.
    // We use the admin client which bypasses RLS to read and update the asset.
    const { assetId } = await request.json();

    if (!assetId) {
      return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
    }

    // Use Admin Client to securely fetch data (bypasses RLS)
    const adminSupabase = createAdminClient();

    // 1. Fetch the asset details
    const { data: asset, error: assetError } = await adminSupabase
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      console.error("Failed to fetch asset for analysis:", assetError);
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Currently only supporting images for AI analysis
    if (!asset.mime_type.startsWith("image/")) {
      return NextResponse.json({ message: "Skipped: Not an image" });
    }

    // 2. Download the file from storage to send to OpenAI
    const { data: fileData, error: downloadError } = await adminSupabase.storage
      .from("assets_bucket")
      .download(asset.storage_path);

    if (downloadError || !fileData) {
      console.error("Failed to download file from storage:", downloadError);
      return NextResponse.json({ error: "Failed to download asset" }, { status: 500 });
    }

    // Convert blob to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${asset.mime_type};base64,${base64Image}`;

    // 3. Call OpenAI Vision API (gpt-4o-mini)
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert digital asset manager. Analyze the provided image. Provide a descriptive alt_text (max 150 chars) and exactly 5 relevant tags describing the content, style, and subjects. Output MUST be in raw JSON format with NO markdown wrapping, following this schema: { \"alt_text\": \"string\", \"tags\": [\"string\"] }"
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse AI response
    let aiData;
    try {
      aiData = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse OpenAI response as JSON:", content);
      throw new Error("Invalid JSON response from AI");
    }

    const { alt_text, tags } = aiData;

    // 4. Update the asset with alt_text
    if (alt_text) {
      const { error: updateError } = await adminSupabase
        .from("assets")
        .update({ alt_text })
        .eq("id", assetId);

      if (updateError) {
        console.error("Failed to update asset alt_text:", updateError);
      }
    }

    // 5. Insert tags into asset_tags table
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagInserts = tags.map((tag: string) => ({
        asset_id: assetId,
        tag_name: tag.toLowerCase().trim(),
        confidence_score: 0.95, // Hardcoded high confidence for GPT-4o-mini vision
        is_ai_generated: true,
      }));

      const { error: tagsError } = await adminSupabase
        .from("asset_tags")
        .insert(tagInserts);

      if (tagsError) {
        console.error("Failed to insert asset tags:", tagsError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { alt_text, tags } 
    });

  } catch (error: any) {
    console.error("AI Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during AI analysis" },
      { status: 500 }
    );
  }
}
