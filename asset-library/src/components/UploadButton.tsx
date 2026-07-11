'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function UploadButton() {
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // 1. Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, file);

        if (uploadError) {
            alert('Error uploading: ' + uploadError.message);
            setIsUploading(false);
            return;
        }

        // 2. Get Public URL
        const { data: publicData } = supabase.storage.from('assets').getPublicUrl(fileName);
        const publicUrl = publicData.publicUrl;

        // 3. Try AI (Fallback if it fails)
        let finalTags = ["Untagged"];
        try {
            const res = await fetch('/api/analyze-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: publicUrl }),
            });
            const data = await res.json();
            if (res.ok && data.tags) {
                // Assuming AI returns a comma-separated string like "cartoon, art, visual"
                finalTags = data.tags.split(',').map((t: string) => t.trim());
            }
        } catch (err) {
            console.warn('AI failed, using fallback tags');
        }

        // 4. Save to Database
        await supabase.from('assets').insert([
            { url: publicUrl, tags: finalTags }
        ]);

        setIsUploading(false);
        // Force the page to refresh and show the new image
        router.refresh();
    };

    return (
        <div className="mb-8">
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full cursor-pointer font-bold transition shadow-lg hover:shadow-blue-500/50">
                {isUploading ? 'Uploading...' : '+ Upload New Asset'}
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
        </div>
    );
}