// 移植自旧 packs.ts 的基础数据（为保证独立运行，不再依赖旧文件）
type LegacyProduct = {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    probability: number;
    backlightColor: string;
};
type LegacyPack = {
    id: string;
    title: string;
    image: string;
    price: number;
    itemCount: number;
    items?: Array<{
        id: string;
        name: string;
        description: string;
        image: string;
        price: number;
        probability: number;
        backlightColor: string;
    }>;
};

const packs: LegacyPack[] = [
    {
        id: "pack_onepiece_ace",
        title: "One Piece Fire Fist Ace",
        price: 10.45,
        image:
            "https://ik.imagekit.io/hr727kunx/packs/cmho66b2h0000l50gpl7u48cu_8686310__8Vx22oJXm?tr=w-3840,c-at_max",
        itemCount: 16,
        items: [
            {
                id: "item_opace_1",
                name: "Portgas.D.Ace (Serial Numbered) - One Piece Promotion Cards (OP-PR)",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 4000,
                probability: 0.00005,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho5dh460000l40m4l3l0nbv_5717727__5nBCY5qmi?tr=w-3840,c-at_max",
                backlightColor: "#E4AE33"
            },
            {
                id: "item_opace_2",
                name: "Portgas.D.Ace (Parallel) (Manga) (Alternate Art) - Paramount War (OP02)",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 1500,
                probability: 0.0001,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho51a1p0000jy0hek7kfn9r_2824139__nSTVQ8uFw?tr=w-3840,c-at_max",
                backlightColor: "#E4AE33"
            },
            {
                id: "item_opace_3",
                name: "Portgas.D.Ace (SP) Two Legends",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 132,
                probability: 0.0049,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho2nh4c0000l20f9jkidtx6_5174877__AJTAhN21mz?tr=w-3840,c-at_max",
                backlightColor: "#E4AE33"
            },
            {
                id: "item_opace_4",
                name: "Portgas.D.Ace (SP) Legacy of the Master",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 109,
                probability: 0.005,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho1zrdq0000k10fr4ekbo9u_8033143__vDfU8-MTMa?tr=w-3840,c-at_max",
                backlightColor: "#E4AE33"
            },
            {
                id: "item_opace_5",
                name: "Portgas.D.Ace (TR) Royal Blood",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 55,
                probability: 0.04995,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho16rhm0001l40fvoifstma_4764497__vJTaDeC36?tr=w-3840,c-at_max",
                backlightColor: "#EB4B4B"
            },
            {
                id: "item_opace_6",
                name: "Portgas.D.Ace (119) (Parallel) 500 Years in the Future",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 23,
                probability: 0.045,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0vw100000js0gg1ambqc6_1472259__2C6wi3oR8?tr=w-3840,c-at_max",
                backlightColor: "#8847FF"
            },
            {
                id: "item_opace_7",
                name: "Portgas.D.Ace (011) (Parallel) Ultra Deck: The Three Brothers",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 19,
                probability: 0.05,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0u6gz0000jw0f4odrv8s8_4528519__Lbpeff3Cu?tr=w-3840,c-at_max",
                backlightColor: "#8847FF"
            },
            {
                id: "item_opace_8",
                name: "Portgas.D.Ace (Parallel) Two Legends",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 9.21,
                probability: 0.1,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0qsaw0000l40f4ug9ytpv_2805305__1ZxWCNkRZ?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_9",
                name: "Portgas.D.Ace (011) Ultra Deck: The Three Brothers",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 5.22,
                probability: 0.1,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0p1bu0000jx0heb18v1kt_8674853__udiKhJpX2h?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_10",
                name: "Portgas.D.Ace Paramount War",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 4.85,
                probability: 0.125,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0nefb0000jr0fsei8viv6_9124244__rdEynuhnI?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_11",
                name: "Portgas.D.Ace (119) 500 Years in the Future",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 4.24,
                probability: 0.12,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0litt0000jy0kzokdvtqv_7911407__CwD8G_rz7?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_12",
                name: "Portgas.D.Ace - PRB02-018 Premium Booster -The Best- Vol. 2",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 1.27,
                probability: 0.1,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0k3nm0001jr0gkatcle20_3856396___TZMugvb-?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_13",
                name: "Portgas.D.Ace Starter Deck 15: RED Edward.Newgate",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 1.09,
                probability: 0.1,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0iv1j0000lc0mub0wlehh_965386__ffBpvGlRu?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_14",
                name: "Portgas.D.Ace Starter Deck 9: Yamato",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 0.44,
                probability: 0.1,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0hfuk0000jr0gtp5hrz9i_3369288__ffwWx21G9?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_15",
                name: "Portgas.D.Ace Two Legends",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 0.43,
                probability: 0.05,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0fvbi0000jx0nrqb6uhpi_4773053__4Sp3ulaWZ?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_opace_16",
                name: "Portgas.D.Ace (053) 500 Years in the Future",
                description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
                price: 0.27,
                probability: 0.05,
                image: "https://ik.imagekit.io/hr727kunx/products/cmho0cs1j0000li0f0kfkr2pd_7131111__J1WTCGScT?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            }
        ]
    },
    {
        id: "pack_celestial",
        title: "Celestial",
        image: "https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G",
        price: 20507.39,
        itemCount: 11,
        items: [
            {
                id: "celestial_item_1",
                name: "2025 Bentley Continental GTC First Edition",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh117vpi0000la0g1auoppim_8354404__emK2iQL3J",
                price: 450000,
                probability: 0.000125,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_2",
                name: "Patek Philippe Celestial Grand Blue Dial 44mm",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh2kx0m40000jy0mnpnzlpc1_8591189__RMfXhwba7",
                price: 450000,
                probability: 0.000125,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_3",
                name: "2023 Bentley Bentayga",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh2j7rh80000jv0fr55h29nw_9723925__br_RJn3x-",
                price: 418000,
                probability: 0.000125,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_4",
                name: "1925 Bentley 3 4½ Litre",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh2j3zwl0000jr0f42ry77ba_1018105__4JJPu_Yc5",
                price: 414000,
                probability: 0.000125,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_5",
                name: "2023 Bentley GTC",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh2jc98i0004jv0fvm20qshi_3573318__phHeaFq1F",
                price: 396000,
                probability: 0.000125,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_6",
                name: "2025 Bentley Bentayga Azure",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh11dc5u0000la0f585gk5oe_957947__EC8XyZBnt",
                price: 302500,
                probability: 0.0005,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_7",
                name: "Cartier Santos 35mm",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh12kkcn0005l70gxgidhu0j_9759371__jzIW006Bc",
                price: 279000,
                probability: 0.0005,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_8",
                name: "2025 Land Rover Defender 110",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh2jfaqg0000js0fy0yt1glq_1507162__6-K5odw69",
                price: 268000,
                probability: 0.00075,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_9",
                name: "2023 Audi R8 v10 Performance",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmgfhk8ag0000l70gfygqghzv_3927629__k1-xSHM27",
                price: 220000,
                probability: 0.00075,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_10",
                name: "Apocalypse Hellfire 2.0 6X6",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cmh2hkeyd0000jy0ga6nq4bt9_2079065__TaK0h4fEY",
                price: 215000,
                probability: 0.0015,
                backlightColor: "#E4AE33",
            },
            {
                id: "celestial_item_11",
                name: "Hermès Birkin 30 Himalaya Niloticus Crocodile Palladium Hardware",
                description: "来自 Celestial 礼包的高端精品藏品。",
                image: "https://ik.imagekit.io/hr727kunx/products/cls1a2r81006rlb163shw0vru_5387319__yR_Dj10xR",
                price: 214500,
                probability: 0.0015,
                backlightColor: "#E4AE33",
            },
        ],
    },
    {
        id: "pack_pokegals",
        title: "PokeGals",
        price: 1.84,
        image: "https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh",
        itemCount: 7,
        items: [
            {
                id: "item_pokegals_1",
                name: "莉莉",
                description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
                price: 70.0,
                probability: 0.0015,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo82y170000jp0fc2k2gj4y_949410__jYZt5PBjQ",
                backlightColor: "#E4AE33",
              },
              {
                id: "item_pokegals_2",
                name: "玛妮",
                description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
                price: 34.0,
                probability: 0.0035,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo80mob0000l40mgvpqqxiy_763004__7jRIYNvGA",
                backlightColor: "#E4AE33",
              },
              {
                id: "item_pokegals_3",
                name: "离子",
                description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
                price: 25.0,
                probability: 0.005,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo7y7z50001l50i3dvrh5t7_2587383__KszFCRqvU",
                backlightColor: "#E4AE33",
              },
              {
                id: "item_pokegals_4",
                name: "芍药",
                description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
                price: 11.3,
                probability: 0.01,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo7vsxm0000l50i2kzsbv28_7925041__bpiG50wjx",
                backlightColor: "#EB4B4B",
              },
              {
                id: "item_pokegals_5",
                name: "罗克珊",
                description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
                price: 6.3,
                probability: 0.02,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo7tme30000kv0kdhldycqx_3550781__jss6m6e1J",
                backlightColor: "#D32CE6",
              },
              {
                id: "item_pokegals_6",
                name: "茴香",
                description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
                price: 1.95,
                probability: 0.06,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo7qf8u0000jv0m5vqdxffv_6839547__emfZVD1ch",
                backlightColor: "#4B69FF",
              },
              {
                id: "item_pokegals_7",
                name: "精灵球",
                description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
                price: 1.0,
                probability: 0.9,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo7mskd0000ju0kmqso6xbn_2808674__6u5KNOlaE",
                backlightColor: "#829DBB",
              }]
    },
    {
        id: "pack_halloween_pokemon",
        title: "不给糖就捣蛋宝可梦",
        price: 398.30,
        image: "https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-3840,c-at_max",
        itemCount: 11,
        items: [
            {
                id: "item_halloween_1",
                name: "仙子伊布 VMAX",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 735.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max",
                backlightColor: "#8847FF"
            },
            {
                id: "item_halloween_2",
                name: "火箭队的超梦前任",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 685.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max",
                backlightColor: "#8847FF"
            },
            {
                id: "item_halloween_3",
                name: "Zekrom ex",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 588.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max",
                backlightColor: "#4B69FF"
            },
            {
                id: "item_halloween_4",
                name: "喷火龙ex",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 385.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_halloween_5",
                name: "喷火龙ex",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 370.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmg8qwvr20000kv0f7xwnyvu9_1596630__cqx8MRYg1?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_halloween_6",
                name: "Zekrom ex",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 335.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo5of0l0000js0mqdkst7ia_3091949__o_1YBmAkO?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_halloween_7",
                name: "雷希拉姆",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 255.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_halloween_8",
                name: "盖诺赛克特",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 79.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_halloween_9",
                name: "梅迪查姆五世",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 31.00,
                probability: 0.10,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo2qell0001i50haz4762if_4053677__c3NUX4VJv?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_halloween_10",
                name: "烛光五世",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 2.59,
                probability: 0.05,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo2lik80000i50hy2hsb2qa_8750657__9B1p0b16-?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
            {
                id: "item_halloween_11",
                name: "螃蟹V",
                description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
                price: 1.84,
                probability: 0.05,
                image: "https://ik.imagekit.io/hr727kunx/products/cmgo2hrjf0000kv0fqj7vt6yb_8772392__iqnuqYLx7?tr=w-3840,c-at_max",
                backlightColor: "#829DBB"
            },
        ]
    }
];

// 全站“商品池”（与卡包解耦，不标记所属卡包）
const productsRaw: Array<any> = [
    {
        id: "celestial_item_1",
        name: "2025 Bentley Continental GTC First Edition",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh117vpi0000la0g1auoppim_8354404__emK2iQL3J",
        price: 450000,
        probability: 0.000125,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_2",
        name: "Patek Philippe Celestial Grand Blue Dial 44mm",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh2kx0m40000jy0mnpnzlpc1_8591189__RMfXhwba7",
        price: 450000,
        probability: 0.000125,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_3",
        name: "2023 Bentley Bentayga",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh2j7rh80000jv0fr55h29nw_9723925__br_RJn3x-",
        price: 418000,
        probability: 0.000125,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_4",
        name: "1925 Bentley 3 4½ Litre",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh2j3zwl0000jr0f42ry77ba_1018105__4JJPu_Yc5",
        price: 414000,
        probability: 0.000125,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_5",
        name: "2023 Bentley GTC",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh2jc98i0004jv0fvm20qshi_3573318__phHeaFq1F",
        price: 396000,
        probability: 0.000125,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_6",
        name: "2025 Bentley Bentayga Azure",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh11dc5u0000la0f585gk5oe_957947__EC8XyZBnt",
        price: 302500,
        probability: 0.0005,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_7",
        name: "Cartier Santos 35mm",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh12kkcn0005l70gxgidhu0j_9759371__jzIW006Bc",
        price: 279000,
        probability: 0.0005,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_8",
        name: "2025 Land Rover Defender 110",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh2jfaqg0000js0fy0yt1glq_1507162__6-K5odw69",
        price: 268000,
        probability: 0.00075,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_9",
        name: "2023 Audi R8 v10 Performance",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmgfhk8ag0000l70gfygqghzv_3927629__k1-xSHM27",
        price: 220000,
        probability: 0.00075,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_10",
        name: "Apocalypse Hellfire 2.0 6X6",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cmh2hkeyd0000jy0ga6nq4bt9_2079065__TaK0h4fEY",
        price: 215000,
        probability: 0.0015,
        backlightColor: "#E4AE33",
    },
    {
        id: "celestial_item_11",
        name: "Hermès Birkin 30 Himalaya Niloticus Crocodile Palladium Hardware",
        description: "来自 Celestial 礼包的高端精品藏品。",
        image: "https://ik.imagekit.io/hr727kunx/products/cls1a2r81006rlb163shw0vru_5387319__yR_Dj10xR",
        price: 214500,
        probability: 0.0015,
        backlightColor: "#E4AE33",
    },
    {
        id: "item_pokegals_1",
        name: "莉莉",
        description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
        price: 70.0,
        probability: 0.0015,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo82y170000jp0fc2k2gj4y_949410__jYZt5PBjQ",
        backlightColor: "#E4AE33",
    },
    {
        id: "item_pokegals_2",
        name: "玛妮",
        description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
        price: 34.0,
        probability: 0.0035,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo80mob0000l40mgvpqqxiy_763004__7jRIYNvGA",
        backlightColor: "#E4AE33",
    },
    {
        id: "item_pokegals_3",
        name: "离子",
        description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
        price: 25.0,
        probability: 0.005,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo7y7z50001l50i3dvrh5t7_2587383__KszFCRqvU",
        backlightColor: "#E4AE33",
    },
    {
        id: "item_pokegals_4",
        name: "芍药",
        description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
        price: 11.3,
        probability: 0.01,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo7vsxm0000l50i2kzsbv28_7925041__bpiG50wjx",
        backlightColor: "#EB4B4B",
    },
    {
        id: "item_pokegals_5",
        name: "罗克珊",
        description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
        price: 6.3,
        probability: 0.02,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo7tme30000kv0kdhldycqx_3550781__jss6m6e1J",
        backlightColor: "#D32CE6",
    },
    {
        id: "item_pokegals_6",
        name: "茴香",
        description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
        price: 1.95,
        probability: 0.06,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo7qf8u0000jv0m5vqdxffv_6839547__emfZVD1ch",
        backlightColor: "#4B69FF",
    },
    {
        id: "item_pokegals_7",
        name: "精灵球",
        description: "来自 PokeGals 礼包的宝可梦主题卡牌。",
        price: 1.0,
        probability: 0.9,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo7mskd0000ju0kmqso6xbn_2808674__6u5KNOlaE",
        backlightColor: "#829DBB",
    },
    {
        id: "item_halloween_1",
        name: "仙子伊布 VMAX",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 735.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max",
        backlightColor: "#8847FF"
    },
    {
        id: "item_halloween_2",
        name: "火箭队的超梦前任",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 685.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max",
        backlightColor: "#8847FF"
    },
    {
        id: "item_halloween_3",
        name: "Zekrom ex",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 588.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max",
        backlightColor: "#4B69FF"
    },
    {
        id: "item_halloween_4",
        name: "喷火龙ex",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 385.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_halloween_5",
        name: "喷火龙ex",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 370.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmg8qwvr20000kv0f7xwnyvu9_1596630__cqx8MRYg1?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_halloween_6",
        name: "Zekrom ex",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 335.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo5of0l0000js0mqdkst7ia_3091949__o_1YBmAkO?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_halloween_7",
        name: "雷希拉姆",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 255.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_halloween_8",
        name: "盖诺赛克特",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 79.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_halloween_9",
        name: "梅迪查姆五世",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 31.00,
        probability: 0.10,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo2qell0001i50haz4762if_4053677__c3NUX4VJv?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_halloween_10",
        name: "烛光五世",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 2.59,
        probability: 0.05,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo2lik80000i50hy2hsb2qa_8750657__9B1p0b16-?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_halloween_11",
        name: "螃蟹V",
        description: "来自 不给糖就捣蛋宝可梦 礼包的万圣主题卡牌。",
        price: 1.84,
        probability: 0.05,
        image: "https://ik.imagekit.io/hr727kunx/products/cmgo2hrjf0000kv0fqj7vt6yb_8772392__iqnuqYLx7?tr=w-3840,c-at_max",
        backlightColor: "#829DBB"
    },
    {
        id: "item_opace_1",
        name: "Portgas.D.Ace (Serial Numbered) - One Piece Promotion Cards (OP-PR)",
        description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
        price: 4000,
        probability: 0.00005,
        image: "https://ik.imagekit.io/hr727kunx/products/cmho5dh460000l40m4l3l0nbv_5717727__5nBCY5qmi?tr=w-3840,c-at_max",
        backlightColor: "#E4AE33"
    },
    {
        id: "item_opace_2",
        name: "Portgas.D.Ace (Parallel) (Manga) (Alternate Art) - Paramount War (OP02)",
        description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
        price: 1500,
        probability: 0.0001,
        image: "https://ik.imagekit.io/hr727kunx/products/cmho51a1p0000jy0hek7kfn9r_2824139__nSTVQ8uFw?tr=w-3840,c-at_max",
        backlightColor: "#E4AE33"
    },
    {
        id: "item_opace_3",
        name: "Portgas.D.Ace (SP) Two Legends",
        description: "来自 One Piece Fire Fist Ace 礼包的海贼王主题卡牌。",
        price: 132,
        probability: 0.0049,
        image: "https://ik.imagekit.io/hr727kunx/products/cmho2nh4c0000l20f9jkidtx6_5174877__AJTAhN21mz?tr=w-3840,c-at_max",
        backlightColor: "#E4AE33"
    },
    {
        id: "item_opace_4",
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

// 归一化 products：显式丢弃任何 packId 信息（商品不属于任何卡包）
const products: LegacyProduct[] = (productsRaw as any[]).map((pr) => ({
    id: pr.id,
    name: pr.name,
    description: pr.description,
    image: pr.image,
    price: pr.price,
    probability: pr.probability,
    backlightColor: pr.backlightColor,
}));

// 品质（依据 backlightColor 分组）
export interface Quality {
    id: string;
    name: string;
    color: string;
    order: number;
}

export const qualities: Quality[] = [
    { id: "common", name: "普通", color: "#829DBB", order: 1 },
    { id: "rare", name: "稀有", color: "#4B69FF", order: 2 },
    { id: "epic", name: "史诗", color: "#8847FF", order: 3 },
    { id: "mythic", name: "神话", color: "#EB4B4B", order: 4 },
    { id: "legendary", name: "传说", color: "#E4AE33", order: 5 },
];

const colorToQualityId: Record<string, Quality["id"]> = {
    "#829DBB": "common",
    "#4B69FF": "rare",
    "#8847FF": "epic",
    "#EB4B4B": "mythic",
    "#E4AE33": "legendary",
};

// 新的商品结构（与 pack 解耦）
export interface CatalogItem {
    id: string; // 新生成，与原 product.id 不同但唯一
    name: string;
    description: string;
    image: string;
    price: number;
    dropProbability: number;
    qualityId: Quality["id"];
}

// 生成稳定的新 ID（与旧 ID 不同）
function generateCatalogItemId(index: number): string {
    const n = index + 1;
    return `item_${String(n).padStart(4, "0")}`;
}

// 建立 productId -> CatalogItem 的映射，确保 pack 中引用与 catalogItems 一致
const productIdToCatalogItem: Record<string, CatalogItem> = {};

export const catalogItems: CatalogItem[] = products.map((pr, idx) => {
    const qualityId = colorToQualityId[pr.backlightColor] ?? "common";
    const item: CatalogItem = {
        id: generateCatalogItemId(idx),
        name: pr.name,
        description: pr.description,
        image: pr.image,
        price: pr.price,
        dropProbability: pr.probability,
        qualityId,
    };
    productIdToCatalogItem[pr.id] = item;
    return item;
});

// 新的卡包结构（内含该卡包的商品数组，采用新的 CatalogItem 结构）
export interface CatalogPack {
    id: string;
    title: string;
    image: string;
    price: number;
    itemCount: number;
    items: CatalogItem[];
}

function toCatalogItemFromPackItem(item: any): CatalogItem {
    const qualityId = colorToQualityId[item.backlightColor] ?? "common";
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image,
        price: item.price,
        dropProbability: item.probability,
        qualityId,
    };
}

function buildCatalogPacksFromLegacy(): CatalogPack[] {
    return packs.map((p) => {
        const items: CatalogItem[] = Array.isArray((p as any).items)
            ? ((p as any).items as any[]).map(toCatalogItemFromPackItem)
            : [];
        return {
            id: p.id,
            title: p.title,
            image: p.image,
            price: p.price,
            itemCount: p.itemCount,
            items,
        };
    });
}

// 类似 packs.ts 的 packToProducts，提供按 packId 查询新结构的商品
// 每个 CatalogPack 自带 items，不再需要额外的 packId->items 映射

// 便捷映射：packId -> CatalogPack
// 旧版 map 已不再对外使用

// 允许在运行时追加“用户创建的礼包”并在全局聚合使用
// 运行时创建的新礼包直接写入 packs（与源码结构一致）

// 运行时追加本地包的旧逻辑已废弃，改为通过后端 API 创建礼包

// 旧聚合方法已废弃，前端通过 API 获取 packs 数据

// 品质 id -> 颜色 的映射
export const qualityIdToColor: Record<string, string> = qualities.reduce((acc, q) => {
    acc[q.id] = q.color;
    return acc;
}, {} as Record<string, string>);

// 卡包封面图片版本（从提供的 HTML 列表抽取 1~40）
// 旧版封面图片版本数据由数据库 packbg 提供，这里移除本地常量

// 根据掉落概率（支持 0-1 或 0-100）返回光晕颜色
export function getGlowColorFromProbability(probability: number | undefined): string {
    const raw = typeof probability === 'number' ? probability : 0;
    const pct = raw <= 1 ? raw * 100 : raw; // 兼容小数与百分比两种输入
    if (pct <= 1) return '#E4AE33';
    if (pct <= 5) return '#EB4B4B';
    if (pct <= 10) return '#8847FF';
    if (pct <= 30) return '#4B69FF';
    return '#829DBB';
}

// 显示用标准商品类型（供 UI 组件消费，不依赖旧 packs.ts）
export interface DisplayProduct {
    id: string;
    name: string;
    description?: string;
    image: string;
    price: number;
    probability?: number;
    backlightColor: string;
}

export function toDisplayProductFromCatalog(item: CatalogItem): DisplayProduct {
    return {
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image,
        price: item.price,
        probability: item.dropProbability,
        backlightColor: getGlowColorFromProbability(item.dropProbability),
    };
}


