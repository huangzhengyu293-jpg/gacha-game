// Mock packs & products data with lookup helpers

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  probability: number;
  backlightColor: string;
  packId: string;
}

export interface Pack {
  id: string;
  title: string;
  image: string;
  price: number;
  itemCount: number;
}

// Data arrays
export const packs: Pack[] = [
  {
    id: "pack_onepiece_ace",
    title: "One Piece Fire Fist Ace",
    price: 10.45,
    image:
      "https://ik.imagekit.io/hr727kunx/packs/cmho66b2h0000l50gpl7u48cu_8686310__8Vx22oJXm?tr=w-3840,c-at_max",
    itemCount: 16,
  },
  {
    id: "pack_celestial",
    title: "Celestial",
    image: "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G",
    price: 20507.39,
    itemCount: 11,
  },
  {
    id: "pack_pokegals",
    title: "PokeGals",
    price: 1.84,
    image: "https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh",
    itemCount: 7
  },
  {
    id: "pack_halloween_pokemon",
    title: "不给糖就捣蛋宝可梦",
    price: 398.30,
    image: "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-3840,c-at_max",
    itemCount: 11
  }
];

export const products: Product[] = [
  {
    id: "celestial_item_1",
    packId: "pack_celestial",
    name: "2025 Bentley Continental GTC First Edition",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh117vpi0000la0g1auoppim_8354404__emK2iQL3J",
    price: 450000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_2",
    packId: "pack_celestial",
    name: "Patek Philippe Celestial Grand Blue Dial 44mm",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2kx0m40000jy0mnpnzlpc1_8591189__RMfXhwba7",
    price: 450000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_3",
    packId: "pack_celestial",
    name: "2023 Bentley Bentayga",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2j7rh80000jv0fr55h29nw_9723925__br_RJn3x-",
    price: 418000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_4",
    packId: "pack_celestial",
    name: "1925 Bentley 3 4½ Litre",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2j3zwl0000jr0f42ry77ba_1018105__4JJPu_Yc5",
    price: 414000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_5",
    packId: "pack_celestial",
    name: "2023 Bentley GTC",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2jc98i0004jv0fvm20qshi_3573318__phHeaFq1F",
    price: 396000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_6",
    packId: "pack_celestial",
    name: "2025 Bentley Bentayga Azure",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh11dc5u0000la0f585gk5oe_957947__EC8XyZBnt",
    price: 302500,
    probability: 0.0005,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_7",
    packId: "pack_celestial",
    name: "Cartier Santos 35mm",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh12kkcn0005l70gxgidhu0j_9759371__jzIW006Bc",
    price: 279000,
    probability: 0.0005,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_8",
    packId: "pack_celestial",
    name: "2025 Land Rover Defender 110",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2jfaqg0000js0fy0yt1glq_1507162__6-K5odw69",
    price: 268000,
    probability: 0.00075,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_9",
    packId: "pack_celestial",
    name: "2023 Audi R8 v10 Performance",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmgfhk8ag0000l70gfygqghzv_3927629__k1-xSHM27",
    price: 220000,
    probability: 0.00075,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_10",
    packId: "pack_celestial",
    name: "Apocalypse Hellfire 2.0 6X6",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2hkeyd0000jy0ga6nq4bt9_2079065__TaK0h4fEY",
    price: 215000,
    probability: 0.0015,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_11",
    packId: "pack_celestial",
    name: "Hermès Birkin 30 Himalaya Niloticus Crocodile Palladium Hardware",
    description: "来自 Celestial 礼包的高端精品藏品。",
    image: "https://ik.imagekit.io/hr727kunx/products/cls1a2r81006rlb163shw0vru_5387319__yR_Dj10xR",
    price: 214500,
    probability: 0.0015,
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_1",
    packId: "pack_pokegals",
    name: "莉莉",
    description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
    price: 70.0,
    probability: 0.0015,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo82y170000jp0fc2k2gj4y_949410__jYZt5PBjQ",
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_2",
    packId: "pack_pokegals",
    name: "玛妮",
    description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
    price: 34.0,
    probability: 0.0035,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo80mob0000l40mgvpqqxiy_763004__7jRIYNvGA",
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_3",
    packId: "pack_pokegals",
    name: "离子",
    description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
    price: 25.0,
    probability: 0.005,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7y7z50001l50i3dvrh5t7_2587383__KszFCRqvU",
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_4",
    packId: "pack_pokegals",
    name: "芍药",
    description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
    price: 11.3,
    probability: 0.01,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7vsxm0000l50i2kzsbv28_7925041__bpiG50wjx",
    backlightColor: "#EB4B4B",
  },
  {
    id: "item_pokegals_5",
    packId: "pack_pokegals",
    name: "罗克珊",
    description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
    price: 6.3,
    probability: 0.02,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7tme30000kv0kdhldycqx_3550781__jss6m6e1J",
    backlightColor: "#D32CE6",
  },
  {
    id: "item_pokegals_6",
    packId: "pack_pokegals",
    name: "茴香",
    description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
    price: 1.95,
    probability: 0.06,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7qf8u0000jv0m5vqdxffv_6839547__emfZVD1ch",
    backlightColor: "#4B69FF",
  },
  {
    id: "item_pokegals_7",
    packId: "pack_pokegals",
    name: "精灵球",
    description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
    price: 1.0,
    probability: 0.9,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7mskd0000ju0kmqso6xbn_2808674__6u5KNOlaE",
    backlightColor: "#829DBB",
  },
  {
    id: "item_halloween_1",
    packId: "pack_halloween_pokemon",
    name: "仙子伊布 VMAX",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 735.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max",
    backlightColor: "#8847FF"
  },
  {
    id: "item_halloween_2",
    packId: "pack_halloween_pokemon",
    name: "火箭队的超梦前任",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 685.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max",
    backlightColor: "#8847FF"
  },
  {
    id: "item_halloween_3",
    packId: "pack_halloween_pokemon",
    name: "Zekrom ex",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 588.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max",
    backlightColor: "#4B69FF"
  },
  {
    id: "item_halloween_4",
    packId: "pack_halloween_pokemon",
    name: "喷火龙ex",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 385.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_5",
    packId: "pack_halloween_pokemon",
    name: "喷火龙ex",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 370.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmg8qwvr20000kv0f7xwnyvu9_1596630__cqx8MRYg1?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_6",
    packId: "pack_halloween_pokemon",
    name: "Zekrom ex",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 335.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5of0l0000js0mqdkst7ia_3091949__o_1YBmAkO?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_7",
    packId: "pack_halloween_pokemon",
    name: "雷希拉姆",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 255.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_8",
    packId: "pack_halloween_pokemon",
    name: "盖诺赛克特",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 79.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_9",
    packId: "pack_halloween_pokemon",
    name: "梅迪查姆五世",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 31.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo2qell0001i50haz4762if_4053677__c3NUX4VJv?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_10",
    packId: "pack_halloween_pokemon",
    name: "烛光五世",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 2.59,
    probability: 0.05,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo2lik80000i50hy2hsb2qa_8750657__9B1p0b16-?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_11",
    packId: "pack_halloween_pokemon",
    name: "螃蟹V",
    description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
    price: 1.84,
    probability: 0.05,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo2hrjf0000kv0fqj7vt6yb_8772392__iqnuqYLx7?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  }, {
    id: "item_opace_1",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (Serial Numbered) - One Piece Promotion Cards (OP-PR)",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 4000,
    probability: 0.00005,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho5dh460000l40m4l3l0nbv_5717727__5nBCY5qmi?tr=w-3840,c-at_max",
    backlightColor: "#E4AE33"
  },
  {
    id: "item_opace_2",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (Parallel) (Manga) (Alternate Art) - Paramount War (OP02)",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 1500,
    probability: 0.0001,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho51a1p0000jy0hek7kfn9r_2824139__nSTVQ8uFw?tr=w-3840,c-at_max",
    backlightColor: "#E4AE33"
  },
  {
    id: "item_opace_3",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (SP) Two Legends",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 132,
    probability: 0.0049,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho2nh4c0000l20f9jkidtx6_5174877__AJTAhN21mz?tr=w-3840,c-at_max",
    backlightColor: "#E4AE33"
  },
  {
    id: "item_opace_4",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (SP) Legacy of the Master",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 109,
    probability: 0.005,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho1zrdq0000k10fr4ekbo9u_8033143__vDfU8-MTMa?tr=w-3840,c-at_max",
    backlightColor: "#E4AE33"
  },
  {
    id: "item_opace_5",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (TR) Royal Blood",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 55,
    probability: 0.04995,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho16rhm0001l40fvoifstma_4764497__vJTaDeC36?tr=w-3840,c-at_max",
    backlightColor: "#EB4B4B"
  },
  {
    id: "item_opace_6",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (119) (Parallel) 500 Years in the Future",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 23,
    probability: 0.045,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0vw100000js0gg1ambqc6_1472259__2C6wi3oR8?tr=w-3840,c-at_max",
    backlightColor: "#8847FF"
  },
  {
    id: "item_opace_7",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (011) (Parallel) Ultra Deck: The Three Brothers",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 19,
    probability: 0.05,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0u6gz0000jw0f4odrv8s8_4528519__Lbpeff3Cu?tr=w-3840,c-at_max",
    backlightColor: "#8847FF"
  },
  {
    id: "item_opace_8",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (Parallel) Two Legends",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 9.21,
    probability: 0.1,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0qsaw0000l40f4ug9ytpv_2805305__1ZxWCNkRZ?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_9",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (011) Ultra Deck: The Three Brothers",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 5.22,
    probability: 0.1,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0p1bu0000jx0heb18v1kt_8674853__udiKhJpX2h?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_10",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace Paramount War",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 4.85,
    probability: 0.125,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0nefb0000jr0fsei8viv6_9124244__rdEynuhnI?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_11",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (119) 500 Years in the Future",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 4.24,
    probability: 0.12,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0litt0000jy0kzokdvtqv_7911407__CwD8G_rz7?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_12",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace - PRB02-018 Premium Booster -The Best- Vol. 2",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 1.27,
    probability: 0.1,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0k3nm0001jr0gkatcle20_3856396___TZMugvb-?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_13",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace Starter Deck 15: RED Edward.Newgate",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 1.09,
    probability: 0.1,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0iv1j0000lc0mub0wlehh_965386__ffBpvGlRu?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_14",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace Starter Deck 9: Yamato",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 0.44,
    probability: 0.1,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0hfuk0000jr0gtp5hrz9i_3369288__ffwWx21G9?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_15",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace Two Legends",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 0.43,
    probability: 0.05,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0fvbi0000jx0nrqb6uhpi_4773053__4Sp3ulaWZ?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_opace_16",
    packId: "pack_onepiece_ace",
    name: "Portgas.D.Ace (053) 500 Years in the Future",
    description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
    price: 0.27,
    probability: 0.05,
    image: "https://ik.imagekit.io/hr727kunx/products/cmho0cs1j0000li0f0kfkr2pd_7131111__J1WTCGScT?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  }
];

// Lookup maps for fast access
export const packMap: Record<string, Pack> = {};
export const productMap: Record<string, Product> = {};
export const packToProducts: Record<string, Product[]> = {};

// Initialize lookup maps
for (const p of packs) {
  packMap[p.id] = p;
}

for (const pr of products) {
  productMap[pr.id] = pr;
  (packToProducts[pr.packId] ||= []).push(pr);
}

// Get all products in a pack by packId
export function getProductsByPack(packId: string): Product[] {
  return packToProducts[packId] ?? [];
}

// Get pack info by productId
export function getPackByProduct(productId: string): Pack | null {
  const product = productMap[productId];
  if (!product) return null;
  return packMap[product.packId] ?? null;
}


