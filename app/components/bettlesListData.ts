export interface RawBattleListUserSlot {
  id: number;
  user_id: number;
  online: number;
  order: number;
  user: {
    id: number;
    name: string;
    avatar: string;
    vip: number;
    promotion?: number;
    robot?: number;
  };
}

export interface RawBattleListItem {
  id: number;
  user_id: number;
  num: number;
  join: number;
  mode?: number | string;
  fast?: number | string;
  finally?: number | string;
  bean: string;
  status: number;
  created_at: string;
  open_at: number;
  title: string;
  app: number;
  time: string;
  time_bean: string;
  password: string;
  type: number;
  updated_at: string;
  win_bean: string;
  sum_bean?: string;
  win_bean_double: string;
  person_team?: number | string;
  team_size?: number | string;
  users: RawBattleListUserSlot[];
  is_password: number;
  fight_user_type: number;
  boxs: number[];
  boxs_cover?: Record<string, unknown> | Array<Record<string, unknown> | string> | string | null;
  boxs_num: number;
  win_user: number[];
  peoples: number;
  user: {
    id: number;
    name: string;
    avatar: string;
  };
  updated_at_time: number;
}
