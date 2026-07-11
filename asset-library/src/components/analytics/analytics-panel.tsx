"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AnalyticsPanel() {
  const supabase = createClient();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [totalStorageBytes, setTotalStorageBytes] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      
      // Fetch total pending count
      const { count } = await supabase
        .from("assets")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending")
        .is("deleted_at", null);
        
      if (count !== null) setPendingCount(count);

      // Fetch total storage used
      const { data } = await supabase
        .from("assets")
        .select("size_bytes")
        .is("deleted_at", null);
        
      if (data) {
        const totalBytes = data.reduce((acc, curr) => acc + Number(curr.size_bytes), 0);
        setTotalStorageBytes(totalBytes);
      }
      
      setLoading(false);
    }

    fetchAnalytics();
  }, [supabase]);

  // Format storage size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="h-24 bg-surface border border-border rounded-xl animate-pulse"></div>
        <div className="h-24 bg-surface border border-border rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {/* Metric 1: Pending Approvals */}
      <div className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted mb-1">Pending Approvals</p>
          <h3 className="text-3xl font-bold text-foreground">{pendingCount}</h3>
        </div>
        <div className="w-12 h-12 bg-warning-bg rounded-full flex items-center justify-center text-warning">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
      </div>

      {/* Metric 2: Total Storage Used */}
      <div className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-sm font-medium text-muted mb-1">Total Storage Used</p>
          <h3 className="text-3xl font-bold text-foreground">{formatSize(totalStorageBytes)}</h3>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
