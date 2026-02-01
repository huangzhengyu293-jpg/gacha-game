import HomePageClient from './HomePageClient';
import { serverFetch, serverGet } from '@/app/lib/serverFetcher';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [boxNewList, fightBestRecord, luckyBestRecord, boxBestRecord, boxRecord2] = await Promise.all([
    // POST x-www-form-urlencoded（body 为空）
    serverFetch('/api/box/newList', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: '',
    }),
    serverGet('/api/fight/bestRecord'),
    serverGet('/api/lucky/bestRecord'),
    serverGet('/api/box/bestRecord'),
    serverGet('/api/box/record2'),
  ]);

  return (
    <HomePageClient
      initialBoxNewList={boxNewList}
      initialFightBestRecord={fightBestRecord}
      initialLuckyBestRecord={luckyBestRecord}
      initialBoxBestRecord={boxBestRecord}
      initialBoxRecord2={boxRecord2}
    />
  );
}
