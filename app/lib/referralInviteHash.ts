/**
 * 推荐链接：https://www.flamedraw.com/#/{inviteCode}
 * 示例：#/ABC123 → 邀请码 ABC123
 */
export const REFERRAL_INVITE_LINK_BASE = 'https://www.flamedraw.com/#/';

const HASH_PATH_PREFIX = '#/';

export function parseInviteCodeFromHash(hash: string): string | null {
  if (!hash || !hash.startsWith(HASH_PATH_PREFIX)) return null;
  const code = hash.slice(HASH_PATH_PREFIX.length).trim();
  return code || null;
}
