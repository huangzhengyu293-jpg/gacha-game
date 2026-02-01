import BattlesPageClient from './BattlesPageClient';
import { serverGet } from '@/app/lib/serverFetcher';

export const dynamic = 'force-dynamic';

export default async function BattlesPage() {
  const [fightList, boxBestRecord, boxRecord2] = await Promise.all([
    serverGet('/api/fight/list'),
    serverGet('/api/box/bestRecord'),
    serverGet('/api/box/record2'),
  ]);

  return (
    <BattlesPageClient
      initialFightList={fightList}
      initialBoxBestRecord={boxBestRecord}
      initialBoxRecord2={boxRecord2}
    />
  );
}


