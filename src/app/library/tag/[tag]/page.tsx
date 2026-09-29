import LibraryScreen from '@/components/app/LibraryScreen';

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  return <LibraryScreen filter={{ tag: name }} title={name} back />;
}
