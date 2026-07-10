import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadSchema } from "@/lib/validations/upload";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 });
    }

    // 3. Server-side validation using Zod
    const result = uploadSchema.safeParse({ file, title });
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.issues },
        { status: 400 }
      );
    }

    // 4. Generate unique storage path
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const storagePath = `${user.id}/${fileName}`;

    // 5. Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("assets_bucket")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    // 6. Insert record into assets table
    const { data: asset, error: dbError } = await supabase
      .from("assets")
      .insert({
        title,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
        // Status defaults to 'pending' via DB schema
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Attempt to clean up storage if DB insert fails
      await supabase.storage.from("assets_bucket").remove([storagePath]);
      return NextResponse.json({ error: "Failed to save asset record" }, { status: 500 });
    }

    // 7. Trigger non-blocking AI analysis
    // We intentionally don't await this to return the response quickly to the user
    if (asset && asset.mime_type.startsWith("image/")) {
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("host");
      const baseUrl = `${protocol}://${host}`;
      
      fetch(`${baseUrl}/api/analyze-asset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assetId: asset.id }),
      }).catch(err => {
        console.error("Failed to trigger AI analysis:", err);
      });
    }

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload" },
      { status: 500 }
    );
  }
}
