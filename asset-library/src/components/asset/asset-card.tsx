export default function AssetCard({ image, tags }: { image: string; tags: string[] }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* 
        The 'object-cover' class is the magic word here. 
        It forces the image to fill the space WITHOUT stretching or distorting.
      */}
      <img
        src={image}
        alt="Asset"
        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* 
        The Tags Overlay - This creates a dark gradient at the bottom 
        so the tags are always readable, and styles the tags as modern badges.
      */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity flex items-end p-5">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-medium text-gray-100 shadow-sm"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}