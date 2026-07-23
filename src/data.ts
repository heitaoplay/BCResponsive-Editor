// BC 活动 / 身体部位候选词库
// 插件本身不对活动/部位名做校验（只要求是字符串数组），因此本词库仅用于「智能提示」，
// 用户始终可以输入任意名称，保证与插件 100% 兼容。
// 活动名参考插件 V1 默认分组（pain/tickle/masturbate）及 BC 常见互动活动整理。

export const ACTIVITY_CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: "痛苦 (Pain)",
    items: ["Slap", "Bite", "Spank", "Kick", "Pinch", "SpankItem", "ShockItem"],
  },
  {
    label: "瘙痒 (Tickle)",
    items: ["Tickle", "TickleItem"],
  },
  {
    label: "抚慰 (Masturbate)",
    items: [
      "MasturbateHand",
      "MasturbateFist",
      "MasturbateFoot",
      "MasturbateTongue",
      "MasturbateItem",
      "PenetrateFast",
      "PenetrateSlow",
      "PenetrateItem",
    ],
  },
  {
    label: "恋足 (Feet)",
    items: ["MassageFeet", "Step", "Kick", "MasturbateFoot"],
  },
  {
    label: "常见互动",
    items: [
      "Kiss",
      "FrenchKiss",
      "Hug",
      "Grope",
      "Caress",
      "Pet",
      "Nuzzle",
      "Lick",
      "Suck",
      "BiteLip",
      "NeckKiss",
      "EarKiss",
      "Cuddle",
      "Massage",
      "ShoulderMassage",
      "BackMassage",
      "FootMassage",
    ],
  },
  {
    label: "支配 / 束缚相关",
    items: [
      "Collar",
      "Leash",
      "Gag",
      "Blindfold",
      "Bind",
      "Unbind",
      "Cuff",
      "Spread",
      "Carry",
      "PickUp",
      "CarryBridal",
      "Order",
      "Command",
      "PetCommand",
      "Present",
    ],
  },
  {
    label: "感官 / 调教",
    items: [
      "Tease",
      "TickleFeet",
      "Worship",
      "FootWorship",
      "Spit",
      "SlapFace",
      "HairPull",
      "Choke",
      "Whisper",
      "Flirt",
      "Taunt",
      "TeaseDeny",
      "Edge",
      "Deny",
      "Reward",
      "Punish",
    ],
  },
  {
    label: "道具互动",
    items: [
      "Whip",
      "Crop",
      "Paddle",
      "Cane",
      "Flog",
      "Clamp",
      "Plug",
      "Vibe",
      "Dildo",
      "TickleFeather",
      "Ice",
      "Wax",
    ],
  },
];

// 扁平化活动名（用于模糊搜索 / 自动补全）
export const ALL_ACTIVITIES: string[] = Array.from(
  new Set(ACTIVITY_CATEGORIES.flatMap((c) => c.items))
).sort();

// 身体部位（AssetGroup.Name 常见值），用于部位选择器
export const BODYPARTS: { value: string; label: string }[] = [
  { value: "ItemArms", label: "手臂 (Arms)" },
  { value: "ItemLegs", label: "腿 (Legs)" },
  { value: "ItemFeet", label: "脚 (Feet)" },
  { value: "ItemBoots", label: "靴子 (Boots)" },
  { value: "ItemHands", label: "手 (Hands)" },
  { value: "ItemHood", label: "头罩 (Hood)" },
  { value: "ItemHead", label: "头 (Head)" },
  { value: "ItemHair", label: "头发 (Hair)" },
  { value: "ItemMouth", label: "嘴 (Mouth)" },
  { value: "ItemMouth2", label: "嘴2 (Mouth2)" },
  { value: "ItemNeck", label: "脖 (Neck)" },
  { value: "ItemNeckAccessory", label: "颈饰 (NeckAccessory)" },
  { value: "ItemNipples", label: "乳头 (Nipples)" },
  { value: "ItemBreast", label: "胸 (Breast)" },
  { value: "ItemTorso", label: "躯干 (Torso)" },
  { value: "ItemPelvis", label: "骨盆 (Pelvis)" },
  { value: "ItemVulva", label: "阴部 (Vulva)" },
  { value: "ItemButt", label: "臀 (Butt)" },
  { value: "ItemAnal", label: "肛门 (Anal)" },
  { value: "ItemPenis", label: "阴茎 (Penis)" },
  { value: "ItemTesticles", label: "睾丸 (Testicles)" },
  { value: "ItemBack", label: "背 (Back)" },
  { value: "ItemWings", label: "翼 (Wings)" },
  { value: "ItemTail", label: "尾 (Tail)" },
  { value: "ItemHalo", label: "光环 (Halo)" },
  { value: "ItemHeader", label: "头顶 (Header)" },
  { value: "ItemMisc", label: "杂项 (Misc)" },
  { value: "ItemAddon", label: "附加 (Addon)" },
];
