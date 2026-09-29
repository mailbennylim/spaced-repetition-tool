import LibraryScreen from '@/components/app/LibraryScreen';

const TITLES: Record<string, string> = { article: 'Articles', epub: 'Books', pdf: 'PDFs', email: 'Emails' };

export default async function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <LibraryScreen filter={{ type }} title={TITLES[type] ?? type} back />;
}
