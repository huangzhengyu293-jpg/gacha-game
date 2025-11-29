export interface FightDetailAward {
  id?: number | string;
  name?: string;
  item_name?: string;
  cover?: string;
  bean?: number | string;
  lv?: number | string;
}

export interface FightDetailBoxAward {
  id?: number | string;
  lv?: number | string;
  awards?: FightDetailAward;
}

export interface FightDetailBox {
  id: number;
  name?: string;
  cover?: string;
  bean?: number | string;
  box_award?: FightDetailBoxAward[];
}

export interface FightDetailWinBoxEntry {
  private_box?: number;
  type?: string;
  bean?: number | string;
  box_awards_id?: number | string;
  awards_id?: number | string;
  box_id?: number | string;
  box_price?: number | string;
  lv?: number | string;
  min_val?: number | string;
  max_val?: number | string;
  percent_odds?: string;
  box_record_id?: number | string;
  belong_id?: number | string;
  roll?: number | string;
  order?: number | string;
  name?: string;
  item_name?: string;
  cover?: string;
  item?: string[];
  awards?: FightDetailAward;
  [key: string]: unknown;
}

export interface FightDetailWinData {
  box?: Record<string, FightDetailWinBoxEntry[]>;
  bean?: Record<string, number | string>;
  [key: string]: unknown;
}

export interface FightDetailData {
  box?: Array<number | string>;
  win?: FightDetailWinData;
  data?: {
    eliminate?: Array<number | string> | Record<string, number | string>;
    [key: string]: unknown;
  };
  eliminate?: Array<number | string> | Record<string, number | string>;
  [key: string]: unknown;
}

export interface FightDetailUserWrapper {
  user?: {
    id?: number | string;
    name?: string;
    avatar?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface FightDetailRaw {
  id: number | string;
  user_id?: number | string;
  num?: number;
  join?: number;
  bean?: number | string;
  person_team?: number | string;
  team_size?: number | string;
  status?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  open_at?: number | string | null;
  title?: string;
  app?: number;
  time?: string;
  time_bean?: number | string;
  type?: number;
  mode?: number | string;
  fast?: number;
  finally?: number;
  win_bean?: number | string;
  win_bean_double?: number | string;
  win_user?: Array<number | string>;
  win_double_user?: Array<number | string> | null;
  robot?: number;
  is_details?: boolean;
  updated_at_time?: number | string;
  now_at?: number | string;
  data: FightDetailData;
  users?: Array<FightDetailUserWrapper | null | undefined>;
  box?: FightDetailBox[];
  [key: string]: unknown;
}


