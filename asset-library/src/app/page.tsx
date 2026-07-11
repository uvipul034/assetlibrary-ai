import UploadButton from '@/components/UploadButton';
import AssetGrid from '@/components/AssetGrid';

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center p-10">
      <h1 className="text-4xl font-bold mb-8">Asset Library AI</h1>
      <UploadButton />
      <AssetGrid />
    </main>
  );
}