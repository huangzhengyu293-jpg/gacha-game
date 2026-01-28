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
    // 后端新增：promotion=1 表示主播
    promotion?: number;
    // 后端字段：robot === 1 表示机器人
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
  // 后端新增：已开启金额（用于列表/历史展示）
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

export const battleListData: RawBattleListItem[] = [
    {
      "id": 101409,
      "user_id": 14899,
      "num": 3,
      "join": 3,
      "bean": "2.00",
      "status": 2,
      "created_at": "2025-11-24 19:56:32",
      "open_at": 1763985394,
      "title": "nn好网",
      "app": 0,
      "time": "0",
      "time_bean": "0.00",
      "password": "",
      "type": 0,
      "updated_at": "2025-11-24 19:56:34",
      "win_bean": "0.02",
      "win_bean_double": "0.01",
      "users": [
        {
          "id": 237954,
          "user_id": 14899,
          "online": 1,
          "order": 1,
          "user": {
            "id": 14899,
            "name": "nn好网",
            "avatar": "https://www.nncsgo.com/static/img/my/5.webp",
            "vip": 0
          }
        },
        {
          "id": 237955,
          "user_id": 11604,
          "online": 1,
          "order": 2,
          "user": {
            "id": 11604,
            "name": "柳如烟",
            "avatar": "https://oss.66images.com/storage/nn/avatar/images/20250814/ab4cb519c0d5e40689fcbe56c1582f18.webp",
            "vip": 11
          }
        },
        {
          "id": 237956,
          "user_id": 11605,
          "online": 1,
          "order": 3,
          "user": {
            "id": 11605,
            "name": "沈幼楚",
            "avatar": "https://oss.66images.com/storage/nn/admin/images/20250908/50ae9aa71c9ad4c86f8a448e5015b3a4.webp",
            "vip": 11
          }
        }
      ],
      "is_password": 0,
      "fight_user_type": 1,
      "boxs": [
        793,
        793
      ],
      "boxs_num": 2,
      "win_user": [
        14899,
        11604,
        11605
      ],
      "peoples": 0,
      "user": {
        "id": 14899,
        "name": "nn好网",
        "avatar": "https://www.nncsgo.com/static/img/my/5.webp"
      },
      "updated_at_time": 1763985394
    },
    {
      "id": 101408,
      "user_id": 15530,
      "num": 3,
      "join": 3,
      "bean": "36.00",
      "status": 2,
      "created_at": "2025-11-24 19:46:20",
      "open_at": 1763984781,
      "title": "黑子哥",
      "app": 0,
      "time": "0",
      "time_bean": "0.00",
      "password": "",
      "type": 0,
      "updated_at": "2025-11-24 19:46:21",
      "win_bean": "9.11",
      "win_bean_double": "0.25",
      "users": [
        {
          "id": 237951,
          "user_id": 15530,
          "online": 1,
          "order": 1,
          "user": {
            "id": 15530,
            "name": "黑子哥",
            "avatar": "https://www.nncsgo.com/static/img/my/6.webp",
            "vip": 0
          }
        },
        {
          "id": 237952,
          "user_id": 11604,
          "online": 1,
          "order": 2,
          "user": {
            "id": 11604,
            "name": "柳如烟",
            "avatar": "https://oss.66images.com/storage/nn/avatar/images/20250814/ab4cb519c0d5e40689fcbe56c1582f18.webp",
            "vip": 11
          }
        },
        {
          "id": 237953,
          "user_id": 11605,
          "online": 1,
          "order": 3,
          "user": {
            "id": 11605,
            "name": "沈幼楚",
            "avatar": "https://oss.66images.com/storage/nn/admin/images/20250908/50ae9aa71c9ad4c86f8a448e5015b3a4.webp",
            "vip": 11
          }
        }
      ],
      "is_password": 0,
      "fight_user_type": 1,
      "boxs": [
        795,
        795,
        795,
        795,
        795,
        795,
        795,
        795,
        795,
        795,
        795,
        795
      ],
      "boxs_num": 12,
      "win_user": [
        11605
      ],
      "peoples": 0,
      "user": {
        "id": 15530,
        "name": "黑子哥",
        "avatar": "https://www.nncsgo.com/static/img/my/6.webp"
      },
      "updated_at_time": 1763984781
    },
    {
      "id": 101407,
      "user_id": 15530,
      "num": 2,
      "join": 2,
      "bean": "42.00",
      "status": 2,
      "created_at": "2025-11-24 19:44:12",
      "open_at": 1763984658,
      "title": "黑子哥",
      "app": 0,
      "time": "0",
      "time_bean": "0.00",
      "password": "",
      "type": 0,
      "updated_at": "2025-11-24 19:44:18",
      "win_bean": "36.07",
      "win_bean_double": "0.86",
      "users": [
        {
          "id": 237949,
          "user_id": 15530,
          "online": 1,
          "order": 1,
          "user": {
            "id": 15530,
            "name": "黑子哥",
            "avatar": "https://www.nncsgo.com/static/img/my/6.webp",
            "vip": 0
          }
        },
        {
          "id": 237950,
          "user_id": 11604,
          "online": 1,
          "order": 2,
          "user": {
            "id": 11604,
            "name": "柳如烟",
            "avatar": "https://oss.66images.com/storage/nn/avatar/images/20250814/ab4cb519c0d5e40689fcbe56c1582f18.webp",
            "vip": 11
          }
        }
      ],
      "is_password": 0,
      "fight_user_type": 1,
      "boxs": [
        838,
        838,
        838,
        838,
        838,
        838,
        838,
        838,
        794
      ],
      "boxs_num": 9,
      "win_user": [
        15530
      ],
      "peoples": 0,
      "user": {
        "id": 15530,
        "name": "黑子哥",
        "avatar": "https://www.nncsgo.com/static/img/my/6.webp"
      },
      "updated_at_time": 1763984658
    },
    {
      "id": 101406,
      "user_id": 15530,
      "num": 2,
      "join": 2,
      "bean": "30.00",
      "status": 2,
      "created_at": "2025-11-24 19:41:16",
      "open_at": 1763984478,
      "title": "黑子哥",
      "app": 0,
      "time": "0",
      "time_bean": "0.00",
      "password": "",
      "type": 0,
      "updated_at": "2025-11-24 19:41:18",
      "win_bean": "13.09",
      "win_bean_double": "0.44",
      "users": [
        {
          "id": 237947,
          "user_id": 15530,
          "online": 1,
          "order": 1,
          "user": {
            "id": 15530,
            "name": "黑子哥",
            "avatar": "https://www.nncsgo.com/static/img/my/6.webp",
            "vip": 0
          }
        },
        {
          "id": 237948,
          "user_id": 11604,
          "online": 1,
          "order": 2,
          "user": {
            "id": 11604,
            "name": "柳如烟",
            "avatar": "https://oss.66images.com/storage/nn/avatar/images/20250814/ab4cb519c0d5e40689fcbe56c1582f18.webp",
            "vip": 11
          }
        }
      ],
      "is_password": 0,
      "fight_user_type": 1,
      "boxs": [
        793,
        793,
        793,
        793,
        793,
        838,
        838,
        838,
        838,
        838
      ],
      "boxs_num": 10,
      "win_user": [
        15530
      ],
      "peoples": 0,
      "user": {
        "id": 15530,
        "name": "黑子哥",
        "avatar": "https://www.nncsgo.com/static/img/my/6.webp"
      },
      "updated_at_time": 1763984478
    },
   
   
  ];