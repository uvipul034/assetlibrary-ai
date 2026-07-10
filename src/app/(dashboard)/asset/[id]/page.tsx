"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AiTagsBadge } from "@/components/asset/ai-tags-badge";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Asset = Database["public"]["Tables"]["assets"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AssetTag = Database["public"]["Tables"]["asset_tags"]["Row"];
type ApprovalLog = Database["public"]["Tables"]["approval_logs"]["Row"] & {
  profiles: { email: string } | null;
};

export default function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { id } = use(params);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tags, setTags] = useState<AssetTag[]>([]);
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (pData) setProfile(pData);
      }

      // Fetch asset
      const { data: aData } = await supabase.from("assets").select("*").eq("id", id).single();
      if (aData) {
        setAsset(aData);
        
        // Fetch tags
        const { data: tData } = await supabase.from("asset_tags").select("*").eq("asset_id", id).order("confidence_score", { ascending: false });
        if (tData) setTags(tData);

        // Fetch logs with profile emails
        const { data: lData } = await supabase
          .from("approval_logs")
          .select("*, profiles(email)")
          .eq("asset_id", id)
          .order("created_at", { ascending: false });
        // Type assertion needed because supabase join types can be tricky
        if (lData) setLogs(lData as any);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  const handleAction = async (status_to: "approved" | "rejected") => {
    if (!profile || !asset) return;
    setActionLoading(true);

    // Update asset
    const { error: updateError } = await supabase
      .from("assets")
      .update({ status: status_to })
      .eq("id", id);

    if (!updateError) {
      // Create log
      await supabase.from("approval_logs").insert({
        asset_id: id,
        actioned_by: profile.id,
        status_to,
        comments: comment || (status_to === "approved" ? "Approved" : "Rejected")
      });
      
      // Update local state
      setAsset({ ...asset, status: status_to });
      setComment("");
      
      // Refresh logs
      const { data: lData } = await supabase
        .from("approval_logs")
        .select("*, profiles(email)")
        .eq("asset_id", id)
        .order("created_at", { ascending: false });
      if (lData) setLogs(lData as any);
    }
    
    setActionLoading(false);
  };

  const handleSoftDelete = async () => {
    if (!asset || !profile) return;
    const confirm = window.confirm("Are you sure you want to move this asset to the trash?");
    if (!confirm) return;

    setActionLoading(true);
    const { error } = await supabase
      .from("assets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      router.push("/");
    } else {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="spinner text-primary" width="32" height="32" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="15" />
        </svg>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-xl font-bold">Asset not found</h3>
        <p className="text-muted mt-2 mb-6">It may have been deleted or you don't have permission to view it.</p>
        <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  const { data: publicUrlData } = supabase.storage.from("assets_bucket").getPublicUrl(asset.storage_path);
  const isImage = asset.mime_type.startsWith("image/");
  const canApprove = profile?.role === 'manager' || profile?.role === 'admin';
  const canDelete = profile?.role === 'admin' || profile?.id === asset.uploaded_by;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 text-sm text-muted mb-6">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Grid
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Asset Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="aspect-video bg-muted/10 flex items-center justify-center relative">
              {isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={publicUrlData.publicUrl} 
                  alt={asset.alt_text || asset.title}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video 
                  src={publicUrlData.publicUrl} 
                  controls 
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-foreground">{asset.title}</h1>
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-md ${
                  asset.status === 'approved' ? 'bg-success-bg text-success-foreground border border-success/20' :
                  asset.status === 'rejected' ? 'bg-destructive-bg text-destructive-foreground border border-destructive/20' :
                  'bg-warning-bg text-warning-foreground border border-warning/20'
                }`}>
                  {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                </span>
              </div>
              
              {asset.alt_text && (
                <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h3 className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    AI Alt Text
                  </h3>
                  <p className="text-sm text-foreground/80">{asset.alt_text}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted block mb-1">MIME Type</span>
                  <span className="font-medium bg-surface border border-border px-2 py-1 rounded">{asset.mime_type}</span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Size</span>
                  <span className="font-medium bg-surface border border-border px-2 py-1 rounded">
                    {(asset.size_bytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Uploaded</span>
                  <span className="font-medium text-foreground">
                    {new Date(asset.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Auto-Generated Tags</h3>
                  <AiTagsBadge tags={tags} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Actions & Logs */}
        <div className="space-y-6">
          {/* Action Panel */}
          {asset.status === 'pending' && canApprove && (
            <div className="rounded-xl border border-primary/20 bg-surface shadow-md p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              
              <h2 className="text-lg font-bold text-foreground mb-4">Review Asset</h2>
              
              <div className="form-group mb-4">
                <label className="form-label" htmlFor="comment">Decision Comment (Optional)</label>
                <textarea 
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave a note about your decision..."
                  className="form-input min-h-[80px] resize-y"
                  disabled={actionLoading}
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction("rejected")}
                  disabled={actionLoading}
                  className="flex-1 btn btn-demo bg-surface border-border hover:bg-destructive-bg hover:text-destructive-foreground hover:border-destructive/30"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleAction("approved")}
                  disabled={actionLoading}
                  className="flex-1 btn btn-primary"
                >
                  Approve
                </button>
              </div>
            </div>
          )}

          {canDelete && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-destructive mb-2">Danger Zone</h2>
              <button 
                onClick={handleSoftDelete}
                disabled={actionLoading}
                className="w-full btn btn-demo bg-surface text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Move to Trash
              </button>
            </div>
          )}

          {/* Audit Logs */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Approval History</h2>
            
            {logs.length === 0 ? (
              <p className="text-sm text-muted italic">No actions recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="flex-shrink-0 mt-1">
                      {log.status_to === 'approved' ? (
                        <div className="w-6 h-6 rounded-full bg-success-bg flex items-center justify-center text-success">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-destructive-bg flex items-center justify-center text-destructive">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {log.profiles?.email || 'Unknown User'}{" "}
                        <span className="font-normal text-muted">marked as</span>{" "}
                        {log.status_to}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                      {log.comments && (
                        <div className="mt-2 text-foreground/80 bg-muted/10 p-2 rounded-md border border-border/50">
                          {log.comments}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
