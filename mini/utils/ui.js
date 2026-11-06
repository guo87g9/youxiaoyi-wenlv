// 由 tools/gen_mini_ui.py 生成，请勿手改。
// 只放「小程序展示层」的元数据（图标 / 配色 / 人格 / 戳），
// 文旅知识一律来自 utils/db.js（与网页版同源）。

const personas = [
  {
    "idx": 0,
    "short": "驿丞老爷",
    "icon": "👲",
    "color": "#B93A2B"
  },
  {
    "idx": 1,
    "short": "秦少游",
    "icon": "🖋️",
    "color": "#5B7DB1"
  },
  {
    "idx": 2,
    "short": "汪老",
    "icon": "📚",
    "color": "#C9A254"
  },
  {
    "idx": 3,
    "short": "小塔",
    "icon": "🗼",
    "color": "#2F6E63"
  },
  {
    "idx": 4,
    "short": "小史",
    "icon": "🏺",
    "color": "#7A5C3E"
  }
];

const spotUI = {
  "yuchengyi": {
    "icon": "🏛️",
    "bg": "linear-gradient(135deg,#B93A2B,#8E2A1F)",
    "persona": 0,
    "personaName": "驿丞老爷",
    "stamp": "盂城驿"
  },
  "zhenguosi": {
    "icon": "🗼",
    "bg": "linear-gradient(135deg,#2F6E63,#1F4A42)",
    "persona": 3,
    "personaName": "小塔",
    "stamp": "镇国寺塔"
  },
  "wenyoutai": {
    "icon": "🖌️",
    "bg": "linear-gradient(135deg,#5B7DB1,#3D5A8F)",
    "persona": 1,
    "personaName": "秦少游",
    "stamp": "文游台"
  },
  "dangpu": {
    "icon": "🏦",
    "bg": "linear-gradient(135deg,#8C6239,#5E3F22)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "高邮当铺"
  },
  "jingtusi": {
    "icon": "🗿",
    "bg": "linear-gradient(135deg,#6E86A8,#43597A)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "净土寺塔"
  },
  "kuilou": {
    "icon": "🏯",
    "bg": "linear-gradient(135deg,#A8632F,#7A4420)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "奎楼宋城墙"
  },
  "longqiuzhuang": {
    "icon": "🏺",
    "bg": "linear-gradient(135deg,#7A6A3F,#4F4325)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "龙虬庄遗址"
  },
  "wangshi": {
    "icon": "✍️",
    "bg": "linear-gradient(135deg,#4F6B63,#2F463F)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "王氏纪念馆"
  },
  "kangzhan": {
    "icon": "🎖️",
    "bg": "linear-gradient(135deg,#9B3B33,#6B211C)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "抗战最后一役"
  },
  "wangzengqi": {
    "icon": "📖",
    "bg": "linear-gradient(135deg,#C9A254,#A5813B)",
    "persona": 2,
    "personaName": "汪老",
    "stamp": "汪曾祺纪念馆"
  },
  "jiyoujia": {
    "icon": "🏤",
    "bg": "linear-gradient(135deg,#7E6BA8,#514379)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "集邮家博物馆"
  },
  "museum": {
    "icon": "🖼️",
    "bg": "linear-gradient(135deg,#5E7F8C,#3C5A66)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "高邮博物馆"
  },
  "gaoyouhu": {
    "icon": "🌊",
    "bg": "linear-gradient(135deg,#3F7F9C,#255A73)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "高邮湖"
  },
  "huahai": {
    "icon": "🌼",
    "bg": "linear-gradient(135deg,#D2A63C,#A87B1F)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "湖上花海"
  },
  "yunhexidi": {
    "icon": "🌅",
    "bg": "linear-gradient(135deg,#C97A3E,#8C4A1D)",
    "persona": 3,
    "personaName": "小塔",
    "stamp": "运河西堤"
  },
  "nanmen": {
    "icon": "🏮",
    "bg": "linear-gradient(135deg,#B65A45,#8B3728)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "南门大街"
  },
  "beimendajie": {
    "icon": "🧧",
    "bg": "linear-gradient(135deg,#A06A3C,#6E4322)",
    "persona": 4,
    "personaName": "小史",
    "stamp": "北门大街"
  }
};

const stamps = [
  { n: "盂城驿", i: "🏛️", spotId: "yuchengyi" },
  { n: "镇国寺塔", i: "🗼", spotId: "zhenguosi" },
  { n: "文游台", i: "🖌️", spotId: "wenyoutai" },
  { n: "高邮当铺", i: "🏦", spotId: "dangpu" },
  { n: "净土寺塔", i: "🗿", spotId: "jingtusi" },
  { n: "奎楼宋城墙", i: "🏯", spotId: "kuilou" },
  { n: "龙虬庄遗址", i: "🏺", spotId: "longqiuzhuang" },
  { n: "王氏纪念馆", i: "✍️", spotId: "wangshi" },
  { n: "抗战最后一役", i: "🎖️", spotId: "kangzhan" },
  { n: "汪曾祺纪念馆", i: "📖", spotId: "wangzengqi" },
  { n: "集邮家博物馆", i: "🏤", spotId: "jiyoujia" },
  { n: "高邮博物馆", i: "🖼️", spotId: "museum" },
  { n: "高邮湖", i: "🌊", spotId: "gaoyouhu" },
  { n: "湖上花海", i: "🌼", spotId: "huahai" },
  { n: "运河西堤", i: "🌅", spotId: "yunhexidi" },
  { n: "南门大街", i: "🏮", spotId: "nanmen" },
  { n: "北门大街", i: "🧧", spotId: "beimendajie" },
];

// 给景点数组套上展示字段（保持 db.js 原顺序，18 处一处不落）
function decorate(spots) {
  return spots.map(function (s) {
    const u = spotUI[s.id] || {};
    return Object.assign({}, s, {
      icon: u.icon || '📍',
      bg: u.bg || 'linear-gradient(135deg,#8C6239,#5E3F22)',
      persona: u.persona || 4,
      personaName: u.personaName || '小史',
      stamp: u.stamp || s.name
    });
  });
}

module.exports = { personas: personas, spotUI: spotUI, stamps: stamps, decorate: decorate };
