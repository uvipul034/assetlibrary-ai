import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse URL parameters
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status") || "all";
    const searchParam = searchParams.get("search") || "";

    // 3. Build Query
    let query = supabase
      .from("assets")
      .select("id, title, mime_type, size_bytes, status, alt_text, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (statusParam && statusParam !== "all") {
      query = query.eq("status", statusParam as "pending" | "approved" | "rejected");
    }

    if (searchParam) {
      query = query.ilike("title", `%${searchParam}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Export query error:", error);
      return new NextResponse("Failed to export data", { status: 500 });
    }

    // 4. Format as CSV
    const headers = ["ID", "Title", "MIME Type", "Size (Bytes)", "Status", "Alt Text", "Created At"];
    const rows = data.map(asset => [
      asset.id,
      `"${asset.title.replace(/"/g, '""')}"`, // Escape quotes
      asset.mime_type,
      asset.size_bytes,
      asset.status,
      `"${(asset.alt_text || "").replace(/"/g, '""')}"`,
      asset.created_at
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // 5. Return CSV Response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="assets-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error("Export route error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
