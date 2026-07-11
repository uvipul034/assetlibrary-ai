export default function AssetCard({ image, tags }: { image: string; tags: string[] }) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">

      {/* The Image */}
      <img
        src={image}
        alt="Asset"
        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* 
        The Overlay & Tags 
        Notice the 'opacity-0 group-hover:opacity-100' - This makes it invisible until hovered!
      */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-xs font-semibold text-white shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}