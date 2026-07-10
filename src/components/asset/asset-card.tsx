import Link from "next/link";
import type { Database } from "@/lib/supabase/types";

type Asset = Database["public"]["Tables"]["assets"]["Row"];

export function AssetCard({
  asset,
  index,
  isSelected,
  onToggleSelect,
  publicUrl
}: {
  asset: Asset;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  publicUrl: string;
}) {
  const isImage = asset.mime_type.startsWith("image/");
  
  return (
    <div 
      className={`group relative flex flex-col rounded-xl border bg-surface overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-primary ${
        isSelected ? "border-primary shadow-glow" : "border-border hover:border-primary/50 hover:shadow-md"
      }`}
    >
      {/* Selection Checkbox */}
      <div className={`absolute top-3 left-3 z-10 transition-opacity duration-200 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              // Prevent navigation when clicking the checkbox
              e.stopPropagation();
              onToggleSelect(asset.id);
            }}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer"
          />
        </label>
      </div>

      {/* Asset Preview / Link */}
      <Link 
        href={`/asset/${asset.id}`}
        className="flex-1 focus:outline-none"
        data-grid-index={index}
      >
        <div className="aspect-square bg-muted/10 relative flex items-center justify-center overflow-hidden border-b border-border">
          {isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={publicUrl} 
              alt={asset.alt_text || asset.title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="2" y1="7" x2="7" y2="7"></line>
                <line x1="2" y1="17" x2="7" y2="17"></line>
                <line x1="17" y1="17" x2="22" y2="17"></line>
                <line x1="17" y1="7" x2="22" y2="7"></line>
              </svg>
              <span className="mt-2 text-xs font-medium uppercase tracking-wider">{asset.mime_type.split('/')[1]}</span>
            </div>
          )}
          
          {/* Status Badge overlay */}
          <div className="absolute top-3 right-3 flex gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm backdrop-blur-md ${
              asset.status === 'approved' ? 'bg-success-bg/90 text-success-foreground border border-success/20' :
              asset.status === 'rejected' ? 'bg-destructive-bg/90 text-destructive-foreground border border-destructive/20' :
              'bg-warning-bg/90 text-warning-foreground border border-warning/20'
            }`}>
              {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground truncate" title={asset.title}>
            {asset.title}
          </h3>
          <div className="mt-1 flex items-center justify-between text-xs text-muted">
            <span>{(asset.size_bytes / (1024 * 1024)).toFixed(2)} MB</span>
            <span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(asset.created_at))}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
