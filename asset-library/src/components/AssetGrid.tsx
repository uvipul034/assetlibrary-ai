'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AssetGrid() {
    const [assets, setAssets] = useState<{ url: string; tags: string }[]>([]);

    useEffect(() => {
        async function fetchAssets() {
            const { data } = await supabase.storage.from('assets').list();
            if (data) {
                const assetsWithTags = await Promise.all(data.map(async (file) => {
                    const { data: urlData } = supabase.storage.from('assets').getPublicUrl(file.name);

                    // Call the AI route for each image
                    const response = await fetch('/api/analyze-asset', {
                        method: 'POST',
                        body: JSON.stringify({ imageUrl: urlData.publicUrl }),
                    });
                    const result = await response.json();

                    return { url: urlData.publicUrl, tags: result.tags || "cartoon, art, visual" };
                }));
                setAssets(assetsWithTags);
            }
        }
        fetchAssets();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full p-4">
            {assets.map((asset, index) => (
                <div key={index} className="bg-gray-800 p-2 rounded-lg border border-gray-700">
                    <img src={asset.url} alt="asset" className="w-full h-48 object-cover rounded" />
                    <p className="text-xs text-blue-400 mt-2 p-1 bg-black rounded">Tags: {asset.tags}</p>
                </div>
            ))}
        </div>
    );
}