export type TopThreePlayer = {
  rank: number;
  name: string;
  avatar: string;
  packCount: string; // 显示 VIP 等级或占位
  prize: string;
  opened: string;
  avatarImage?: string;
};

export type TablePlayer = {
  rank: number;
  name: string;
  tickets: string; // 展示已开启金额
  prize: string;
  avatar: string;
  avatarImage?: string;
};

export function mapConsumeRanking(
  raw: any,
  raceKey: string,
  getPrizeByRank: (rank: number) => string,
  formatOpened: (val: any) => string,
): { topThree: TopThreePlayer[]; tableData: TablePlayer[] } {
  const list: any[] = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  const topThree = list.slice(0, 3).map((item, idx) => {
    const user = item?.user || {};
    const vip = user?.vip;
    const rank = idx + 1;
    return {
      rank,
      name: user?.name || "--",
      avatar: `${raceKey}-top-${idx + 1}`,
      avatarImage: typeof user?.avatar === "string" ? user.avatar : undefined,
      packCount: vip === 0 || vip ? String(vip) : "--",
      prize: getPrizeByRank(rank),
      opened: formatOpened(item?.bean),
    };
  });
  const tableData = list.slice(3).map((item, idx) => {
    const user = item?.user || {};
    const opened = formatOpened(item?.bean);
    const rank = idx + 4;
    return {
      rank,
      name: user?.name || "--",
      tickets: opened,
      prize: getPrizeByRank(rank),
      avatar: `${raceKey}-row-${idx + 4}`,
      avatarImage: typeof user?.avatar === "string" ? user.avatar : undefined,
    };
  });
  return { topThree, tableData };
}


