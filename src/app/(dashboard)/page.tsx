"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AssetCard } from "@/components/asset/asset-card";
import { useDebounce } from "@/hooks/use-debounce";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { AssetUploadDialog } from "@/components/upload/asset-upload-dialog";
import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/lib/supabase/types";

type Asset = Database["public"]["Tables"]["assets"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // URL State
  const querySearch = searchParams.get("search") || "";
  const queryStatus = searchParams.get("status") || "all";
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Sync URL params when debounce search changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, router, searchParams]);

  // Fetch Data
  const fetchAssets = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("assets").select("*").is("deleted_at", null).order("created_at", { ascending: false });

    const statusParam = searchParams.get("status");
    if (statusParam && statusParam !== "all") {
      query = query.eq("status", statusParam as "pending" | "approved" | "rejected");
    }

    const searchParam = searchParams.get("search");
    if (searchParam) {
      query = query.ilike("title", `%${searchParam}%`);
    }

    const { data } = await query;
    if (data) {
      setAssets(data);
    }
    setLoading(false);
  }, [supabase, searchParams]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: pData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (pData) setProfile(pData);
      }
      fetchAssets();
    }
    init();
  }, [fetchAssets, supabase]);

  // Bulk Actions
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0 || !profile || profile.role === 'editor') return;
    
    // Convert Set to Array for bulk update
    const ids = Array.from(selectedIds);
    
    const { error } = await supabase
      .from("assets")
      .update({ status: "approved" })
      .in("id", ids);

    if (!error) {
      // Create approval logs
      const logs = ids.map(id => ({
        asset_id: id,
        actioned_by: profile.id,
        status_to: "approved" as const,
        comments: "Bulk approved"
      }));
      await supabase.from("approval_logs").insert(logs);
      
      setSelectedIds(new Set());
      fetchAssets();
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0 || !profile || profile.role === 'editor') return;
    
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("assets")
      .update({ status: "rejected" })
      .in("id", ids);

    if (!error) {
      const logs = ids.map(id => ({
        asset_id: id,
        actioned_by: profile.id,
        status_to: "rejected" as const,
        comments: "Bulk rejected"
      }));
      await supabase.from("approval_logs").insert(logs);
      
      setSelectedIds(new Set());
      fetchAssets();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === assets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map(a => a.id)));
    }
  };

  // Keyboard Nav
  useKeyboardNavigation(
    assets.length,
    4, // Assuming roughly 4 columns on desktop. We could calculate dynamically but 4 is safe.
    (index) => {
      const assetId = assets[index]?.id;
      if (assetId) router.push(`/asset/${assetId}`);
    },
    () => setSelectedIds(new Set())
  );

  const canApprove = profile?.role === 'manager' || profile?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Asset Library</h1>
          <p className="text-muted text-sm mt-1">Manage, approve, and organize digital assets.</p>
        </div>
        
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="btn btn-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Upload Asset
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-surface p-2 rounded-lg border border-border">
        <div className="relative w-full sm:w-96">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search assets by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-transparent border-none text-sm text-foreground focus:outline-none focus:ring-0"
          />
        </div>
        
        <div className="h-6 w-px bg-border hidden sm:block"></div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(["all", "pending", "approved", "rejected"] as const).map(status => (
            <button
              key={status}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("status", status);
                router.replace(`/?${params.toString()}`, { scroll: false });
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                (queryStatus === status) 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted hover:text-foreground hover:bg-muted/10"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar (Appears when items selected) */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={selectedIds.size === assets.length}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary ml-1"
            />
            <span className="text-sm font-medium text-primary">
              {selectedIds.size} asset{selectedIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          
          {canApprove && (
            <div className="flex gap-2">
              <button 
                onClick={handleBulkReject}
                className="btn btn-demo bg-surface border-border hover:bg-destructive-bg hover:text-destructive-foreground hover:border-destructive/30"
              >
                Reject Selected
              </button>
              <button 
                onClick={handleBulkApprove}
                className="btn btn-primary"
              >
                Approve Selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="aspect-square bg-muted/10 animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted/20 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-muted/20 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-dashed border-border rounded-xl">
          <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center text-muted mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground">No assets found</h3>
          <p className="text-muted max-w-sm mt-1 mb-6">
            {querySearch || queryStatus !== 'all' 
              ? "Try adjusting your filters or search term to find what you're looking for." 
              : "Your library is empty. Upload your first digital asset to get started."}
          </p>
          {!querySearch && queryStatus === 'all' && (
            <button onClick={() => setIsUploadOpen(true)} className="btn btn-primary">
              Upload First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((asset, index) => {
            const { data: publicUrlData } = supabase.storage.from("assets_bucket").getPublicUrl(asset.storage_path);
            
            return (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                index={index}
                isSelected={selectedIds.has(asset.id)}
                onToggleSelect={toggleSelect}
                publicUrl={publicUrlData.publicUrl}
              />
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <AssetUploadDialog 
        isOpen={isUploadOpen} 
        onClose={() => {
          setIsUploadOpen(false);
          fetchAssets(); // Refresh after upload
        }} 
      />
    </div>
  );
}
