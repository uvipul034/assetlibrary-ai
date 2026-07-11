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
      <div className="flex flex-col items-center justify-center space-y-6 mb-12">
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

      {/* Grid Section or Empty State */}
      <div className="max-w-7xl mx-auto">
        {assetList.length === 0 ? (

          /* NEW PREMIUM EMPTY STATE */
          <div className="flex flex-col items-center justify-center max-w-md mx-auto min-h-[35vh] p-10 mt-8 bg-white/[0.02] border border-white/10 rounded-3xl shadow-2xl backdrop-blur-md">
            <div className="bg-white/5 p-4 rounded-full mb-6 ring-1 ring-white/10">
              {/* Image Icon SVG */}
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-200 mb-3 tracking-tight">No assets found</h3>
            <p className="text-gray-500 text-center text-sm leading-relaxed">
              Your library is currently empty. Click the upload button above to add your first image and see the AI in action!
            </p>
          </div>

        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {assetList.map((asset: any) => (
              <AssetCard key={asset.id} id={asset.id} image={asset.url} tags={asset.tags || ["Untagged"]} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}