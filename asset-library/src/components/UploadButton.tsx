'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UploadButton() {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        // 1. Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;

        // 2. Upload to Supabase Storage
        const { data: uploadData, error } = await supabase.storage
            .from('assets')
            .upload(fileName, file);

        if (error) {
            alert('Error uploading: ' + error.message);
            setIsUploading(false);
        } else {
            // 3. Get the public URL
            const { data: publicData } = supabase.storage.from('assets').getPublicUrl(fileName);
            const publicUrl = publicData.publicUrl;

            alert('Success! Image saved. Analyzing with AI...');


            // 4. Call our new AI route
            fetch('/api/analyze-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: publicUrl }),
            })
                .then(async (res) => {
                    const data = await res.json();
                    // If the server sends an error status (like 500), force it to the .catch() block
                    if (!res.ok) throw new Error(data.error || 'Something went wrong');
                    return data;
                })
                .then((data) => {
                    console.log('AI Tags generated:', data.tags);
                    alert('AI Tags generated: ' + data.tags);
                })
                .catch((err) => {
                    console.error('AI Error:', err);
                    alert('AI Error: ' + err.message);
                })
                .finally(() => setIsUploading(false));
        }
    };

    return (
        <div className="mb-8">
            <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer font-bold transition">
                {isUploading ? 'Uploading & Analyzing...' : '+ Upload New Asset'}
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
        </div>
    );
}