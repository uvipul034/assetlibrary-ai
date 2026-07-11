export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 md:p-12 lg:p-20">

      {/* Header Section */}
      <div className="flex flex-col items-center justify-center space-y-6 mb-16">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          Asset Library AI
        </h1>

        {/* Replace your current simple button with this styled one */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
          <button className="relative flex items-center gap-2 bg-gray-900 border border-gray-700 hover:border-gray-500 text-white font-medium py-3 px-8 rounded-full transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Upload New Asset
          </button>
        </div>
      </div>

      {/* Grid Section - Adding 'gap-8' gives the cards breathing room */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
        {/* Render your AssetCards here */}
      </div>

    </div>
  );
}