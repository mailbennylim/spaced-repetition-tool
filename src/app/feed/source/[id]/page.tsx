import { prisma } from '@/lib/prisma';
import FeedScreen from '@/components/app/FeedScreen';

export default async function FeedSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feed = await prisma.feed.findUnique({ where: { id }, select: { title: true } });
  return <FeedScreen feedId={id} title={feed?.title ?? 'Feed'} />;
}
