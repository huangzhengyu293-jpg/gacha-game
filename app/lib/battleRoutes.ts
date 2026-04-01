/** 对战列表 */
export const BATTLE_LIST_PATH = "/battles";

/** 对战房详情 */
export function battleDetailPath(id: string | number) {
  return `/battles/${id}`;
}
