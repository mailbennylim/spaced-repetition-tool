import FeedScreen from '@/components/app/FeedScreen';

export default async function FeedFolderPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <FeedScreen folder={decodeURIComponent(name)} title={decodeURIComponent(name)} />;
}
