import BattleDetailClient from "./BattleDetailClient";

type BattleDetailPageProps = {
  params: Promise<{
    id?: string;
  }>;
};

export default async function BattleDetailPage({ params }: BattleDetailPageProps) {
  const resolvedParams = await params;
  return <BattleDetailClient battleId={resolvedParams?.id ?? null} />;
}

