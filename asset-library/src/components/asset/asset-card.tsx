'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AssetCard({ id, image, tags }: { id: number; image: string; tags: string[] }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Add a quick confirmation pop-up so users don't delete by accident
    if (!confirm('Are you sure you want to delete this image?')) return;

    setIsDeleting(true);

    // 1. Delete the data row from the PostgreSQL database
    await supabase.from('assets').delete().eq('id', id);

    // 2. Extract the file name from the URL and delete the actual image file from Storage
    const fileName = image.split('/').pop();
    if (fileName) {
      await supabase.storage.from('assets').remove([fileName]);
    }

    setIsDeleting(false);

    // 3. Force the page to instantly refresh so the image disappears from the screen
    router.refresh();
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">

      {/* 
        The Delete Button 
        It sits in the top right corner and only appears when the user hovers over the card
      */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-3 right-3 z-10 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md cursor-pointer shadow-md"
        title="Delete asset"
      >
        {isDeleting ? "⏳" : "🗑️"}
      </button>

      {/* The Image */}
      <img
        src={image}
        alt="Asset"
        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* The Overlay & Tags */}
      {/* Added 'pointer-events-none' so the overlay doesn't block the delete button clicks */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5 pointer-events-none">
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