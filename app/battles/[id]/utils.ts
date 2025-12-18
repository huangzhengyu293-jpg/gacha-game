export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

type JackpotWeightEntry = {
  id: string;
  weight: number;
};

/**
 * 将权重分配成“百分比的 0.01% 单位”（basis points），保证：
 * - 总和恒为 100.00%（= 10000 bps）
 * - 任何 weight > 0 的条目至少是 0.01%（= 1 bps），避免展示 0.00%
 *
 * 注意：如果非 0 条目数量 > 10000，则无法给每个条目至少 0.01%，此时会退化为尽可能分配。
 */
export function allocateJackpotPercentageBps(
  entries: JackpotWeightEntry[],
  options?: { totalBps?: number; minBpsForPositiveWeight?: number },
): Record<string, number> {
  const totalBps = Number(options?.totalBps ?? 10000);
  const minBpsForPositiveWeight = Number(options?.minBpsForPositiveWeight ?? 1);

  if (!Array.isArray(entries) || entries.length === 0) {
    return {};
  }

  const safeTotalBps = Number.isFinite(totalBps) && totalBps > 0 ? Math.floor(totalBps) : 10000;
  const safeMinBps =
    Number.isFinite(minBpsForPositiveWeight) && minBpsForPositiveWeight >= 0
      ? Math.floor(minBpsForPositiveWeight)
      : 1;

  const normalized = entries
    .map((entry, index) => {
      const id = entry?.id ? String(entry.id) : '';
      const rawWeight = Number(entry?.weight);
      const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 0;
      return { id, weight, index };
    })
    .filter((entry) => Boolean(entry.id));

  if (normalized.length === 0) {
    return {};
  }

  const positive = normalized.filter((entry) => entry.weight > 0);
  const positiveCount = positive.length;

  // 1) 全部为 0：均分（仍保证总和=10000bps）
  if (positiveCount === 0) {
    const base = Math.floor(safeTotalBps / normalized.length);
    let remainder = safeTotalBps - base * normalized.length;
    const result: Record<string, number> = {};
    normalized.forEach((entry) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      result[entry.id] = base + extra;
    });
    return result;
  }

  // 2) 预留“最小显示”份额（避免 0.00%）
  const minSum = positiveCount * safeMinBps;
  if (minSum > safeTotalBps) {
    // 条目太多无法每个都至少 0.01%，尽量按权重从大到小给 1 bps，剩余为 0
    const sorted = [...positive].sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.index - b.index;
    });
    const result: Record<string, number> = {};
    normalized.forEach((entry) => {
      result[entry.id] = 0;
    });
    let remaining = safeTotalBps;
    for (const entry of sorted) {
      if (remaining <= 0) break;
      result[entry.id] = 1;
      remaining -= 1;
    }
    return result;
  }

  const totalPositiveWeight = positive.reduce((sum, entry) => sum + entry.weight, 0);
  const remainingBps = safeTotalBps - minSum;

  // 3) 将剩余 bps 按权重比例分配，并用最大余数法补齐
  const allocations = positive.map((entry) => {
    const rawExtra =
      totalPositiveWeight > 0 ? (entry.weight / totalPositiveWeight) * remainingBps : 0;
    const extraFloor = Math.floor(rawExtra);
    const remainder = rawExtra - extraFloor;
    return {
      id: entry.id,
      index: entry.index,
      bps: safeMinBps + extraFloor,
      remainder,
      weight: entry.weight,
    };
  });

  const allocatedSum = allocations.reduce((sum, a) => sum + a.bps, 0);
  let leftover = safeTotalBps - allocatedSum;

  if (leftover > 0) {
    allocations.sort((a, b) => {
      if (b.remainder !== a.remainder) return b.remainder - a.remainder;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.index - b.index;
    });
    for (let i = 0; i < allocations.length && leftover > 0; i += 1) {
      allocations[i] = { ...allocations[i], bps: allocations[i].bps + 1 };
      leftover -= 1;
    }
  }

  const result: Record<string, number> = {};
  normalized.forEach((entry) => {
    result[entry.id] = 0;
  });
  allocations.forEach((a) => {
    result[a.id] = a.bps;
  });
  return result;
}

