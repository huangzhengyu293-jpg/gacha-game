// Mock packs & products data with lookup helpers

export interface Product {
  id: string;
  name: string;
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
    image: "https://ik.imagekit.io/hr727kunx/products/cmh117vpi0000la0g1auoppim_8354404__emK2iQL3J",
    price: 450000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_2",
    packId: "pack_celestial",
    name: "Patek Philippe Celestial Grand Blue Dial 44mm",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2kx0m40000jy0mnpnzlpc1_8591189__RMfXhwba7",
    price: 450000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_3",
    packId: "pack_celestial",
    name: "2023 Bentley Bentayga",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2j7rh80000jv0fr55h29nw_9723925__br_RJn3x-",
    price: 418000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_4",
    packId: "pack_celestial",
    name: "1925 Bentley 3 4½ Litre",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2j3zwl0000jr0f42ry77ba_1018105__4JJPu_Yc5",
    price: 414000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_5",
    packId: "pack_celestial",
    name: "2023 Bentley GTC",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2jc98i0004jv0fvm20qshi_3573318__phHeaFq1F",
    price: 396000,
    probability: 0.000125,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_6",
    packId: "pack_celestial",
    name: "2025 Bentley Bentayga Azure",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh11dc5u0000la0f585gk5oe_957947__EC8XyZBnt",
    price: 302500,
    probability: 0.0005,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_7",
    packId: "pack_celestial",
    name: "Cartier Santos 35mm",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh12kkcn0005l70gxgidhu0j_9759371__jzIW006Bc",
    price: 279000,
    probability: 0.0005,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_8",
    packId: "pack_celestial",
    name: "2025 Land Rover Defender 110",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2jfaqg0000js0fy0yt1glq_1507162__6-K5odw69",
    price: 268000,
    probability: 0.00075,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_9",
    packId: "pack_celestial",
    name: "2023 Audi R8 v10 Performance",
    image: "https://ik.imagekit.io/hr727kunx/products/cmgfhk8ag0000l70gfygqghzv_3927629__k1-xSHM27",
    price: 220000,
    probability: 0.00075,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_10",
    packId: "pack_celestial",
    name: "Apocalypse Hellfire 2.0 6X6",
    image: "https://ik.imagekit.io/hr727kunx/products/cmh2hkeyd0000jy0ga6nq4bt9_2079065__TaK0h4fEY",
    price: 215000,
    probability: 0.0015,
    backlightColor: "#E4AE33",
  },
  {
    id: "celestial_item_11",
    packId: "pack_celestial",
    name: "Hermès Birkin 30 Himalaya Niloticus Crocodile Palladium Hardware",
    image: "https://ik.imagekit.io/hr727kunx/products/cls1a2r81006rlb163shw0vru_5387319__yR_Dj10xR",
    price: 214500,
    probability: 0.0015,
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_1",
    packId: "pack_pokegals",
    name: "莉莉",
    price: 70.0,
    probability: 0.0015,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo82y170000jp0fc2k2gj4y_949410__jYZt5PBjQ",
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_2",
    packId: "pack_pokegals",
    name: "玛妮",
    price: 34.0,
    probability: 0.0035,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo80mob0000l40mgvpqqxiy_763004__7jRIYNvGA",
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_3",
    packId: "pack_pokegals",
    name: "离子",
    price: 25.0,
    probability: 0.005,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7y7z50001l50i3dvrh5t7_2587383__KszFCRqvU",
    backlightColor: "#E4AE33",
  },
  {
    id: "item_pokegals_4",
    packId: "pack_pokegals",
    name: "芍药",
    price: 11.3,
    probability: 0.01,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7vsxm0000l50i2kzsbv28_7925041__bpiG50wjx",
    backlightColor: "#EB4B4B",
  },
  {
    id: "item_pokegals_5",
    packId: "pack_pokegals",
    name: "罗克珊",
    price: 6.3,
    probability: 0.02,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7tme30000kv0kdhldycqx_3550781__jss6m6e1J",
    backlightColor: "#D32CE6",
  },
  {
    id: "item_pokegals_6",
    packId: "pack_pokegals",
    name: "茴香",
    price: 1.95,
    probability: 0.06,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7qf8u0000jv0m5vqdxffv_6839547__emfZVD1ch",
    backlightColor: "#4B69FF",
  },
  {
    id: "item_pokegals_7",
    packId: "pack_pokegals",
    name: "精灵球",
    price: 1.0,
    probability: 0.9,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo7mskd0000ju0kmqso6xbn_2808674__6u5KNOlaE",
    backlightColor: "#829DBB",
  },
  {
    id: "item_halloween_1",
    packId: "pack_halloween_pokemon",
    name: "仙子伊布 VMAX",
    price: 735.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max",
    backlightColor: "#8847FF"
  },
  {
    id: "item_halloween_2",
    packId: "pack_halloween_pokemon",
    name: "火箭队的超梦前任",
    price: 685.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max",
    backlightColor: "#8847FF"
  },
  {
    id: "item_halloween_3",
    packId: "pack_halloween_pokemon",
    name: "Zekrom ex",
    price: 588.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max",
    backlightColor: "#4B69FF"
  },
  {
    id: "item_halloween_4",
    packId: "pack_halloween_pokemon",
    name: "喷火龙ex",
    price: 385.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_5",
    packId: "pack_halloween_pokemon",
    name: "喷火龙ex",
    price: 370.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmg8qwvr20000kv0f7xwnyvu9_1596630__cqx8MRYg1?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_6",
    packId: "pack_halloween_pokemon",
    name: "Zekrom ex",
    price: 335.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5of0l0000js0mqdkst7ia_3091949__o_1YBmAkO?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_7",
    packId: "pack_halloween_pokemon",
    name: "雷希拉姆",
    price: 255.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_8",
    packId: "pack_halloween_pokemon",
    name: "盖诺赛克特",
    price: 79.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_9",
    packId: "pack_halloween_pokemon",
    name: "梅迪查姆五世",
    price: 31.00,
    probability: 0.10,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo2qell0001i50haz4762if_4053677__c3NUX4VJv?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_10",
    packId: "pack_halloween_pokemon",
    name: "烛光五世",
    price: 2.59,
    probability: 0.05,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo2lik80000i50hy2hsb2qa_8750657__9B1p0b16-?tr=w-3840,c-at_max",
    backlightColor: "#829DBB"
  },
  {
    id: "item_halloween_11",
    packId: "pack_halloween_pokemon",
    name: "螃蟹V",
    price: 1.84,
    probability: 0.05,
    image: "https://ik.imagekit.io/hr727kunx/products/cmgo2hrjf0000kv0fqj7vt6yb_8772392__iqnuqYLx7?tr=w-3840,c-at_max",
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


