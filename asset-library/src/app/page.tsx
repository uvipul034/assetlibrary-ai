import UploadButton from "@/components/UploadButton";
import AssetCard from "@/components/asset/asset-card";
import { supabase } from '@/lib/supabase';

// This forces Vercel to always fetch fresh data when the page loads
export const revalidate = 0;

export default async function Dashboard() {
  // Fetch assets from your database
  const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  const assetList = assets || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 md:p-12 lg:p-20">

      {/* Header Section */}
      <div className="flex flex-col items-center justify-center space-y-6 mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          Asset Library AI
        </h1>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
          <div className="relative">
            <UploadButton />
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="max-w-7xl mx-auto">
        {assetList.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 border-2 border-dashed border-gray-800 rounded-2xl p-12">
            <p className="text-xl">No assets found.</p>
            <p className="text-sm mt-2">Upload your first image to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {assetList.map((asset: any) => (
              // Ensure tags is always an array
              <AssetCard key={asset.id} image={asset.url} tags={asset.tags || ["Untagged"]} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}