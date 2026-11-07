/* 邮小驿 · 数据层（唯一数据源）
 * 说明：全部数据集中在此，页面只读不写；换图/换音频只需改这里或替换同名文件。
 * 图片：17 个点位全部为实景照（用户提供，见 CREDITS 与 素材声明.md），逐张标注来源；
 *      原创矢量插画保留在 illus 子目录作备份，页面不再引用。
 */
window.YXY = {
  meta: {
    version: "3.0",
    built: "2026-11-11",
    city: "高邮",
    slogan: "一人一驿一 AI，一码游高邮"
  },

  narrator: {
    name: "小史 · 邮城史官",
    avatar: "📮",
    tagline: "17 处点位 · 17 段讲解 · 断网也能听",
    transcript: "嗨，我是小史，高邮这座城的活档案。除了盂城驿那几处，名气在外的高邮还藏着六处硬核古迹——清代的当铺、明代的东塔、宋代城墙上的奎楼、7000 年前的龙虬庄、训诂学王氏父子故居，还有抗战最后一役的受降地。想先听哪一段？"
  },

  /* 图片授权：实景照来源与协议（逐张可回溯） */
  /* 图片授权：17 张实景照均为用户提供，来源逐张可回溯（2026-11-07 更新）
   * 说明：本组图片取自公开网页，版权归原作者/机构所有；仅用于本次大赛非商业展示，
   *      商用（APP/小程序/宣传物料）须另行取得授权或替换为官方图库/自拍素材。 */
  credit: {
    c_yuchengyi: {
      file: "yuchengyi-800.webp", spot: "盂城驿",
      author: "用户实拍（百度图片 UGC）",
      license: "用户实拍照片",
      src: "http://b0.bdstatic.com/ugc/TNNv2t3N_OZKRE3lu29amw2611e6b89a398629ac82b9e952c70405.jpg",
      note: "盂城驿鼓楼与南门大街街景"
    },
    c_zhenguosi: {
      file: "zhenguosi-800.webp", spot: "镇国寺塔",
      author: "新浪图片",
      license: "公开网络图片（版权归原作者）",
      src: "http://n.sinaimg.cn/sinakd20108/0/w2048h1152/20250827/3437-447e509d05df365e13685b2c5b57a138.jpg",
      note: "运河河心岛航拍，原图 2048×1152，本项目所得副本为 448×335"
    },
    c_wenyoutai: {
      file: "wenyoutai-800.webp", spot: "文游台",
      author: "百度图片 feed",
      license: "公开网络图片（版权归原作者）",
      src: "http://se-feed-bucket.bj.bcebos.com/002b10d619773937fe060d57c1033ac1",
      note: "文游台石牌坊正面"
    },
    c_dangpu: {
      file: "dangpu-800.webp", spot: "高邮当铺",
      author: "图虫摄影社区（摄影师作品）",
      license: "商业图库作品，版权归摄影师",
      src: "http://photo.tuchong.com/8962470/f/432372968.jpg",
      note: "同兴当铺门楼「高郵同興當」；图虫为摄影师版权作品，商用须单独授权"
    },
    c_jingtusi: {
      file: "jingtusi-800.webp", spot: "净土寺塔",
      author: "百度图片",
      license: "公开网络图片（版权归原作者）",
      src: "http://gips0.baidu.com/it/u=137148568,2814440626&fm=3074&app=3074&f=JPEG",
      note: "净土寺塔（东塔）塔身与塔院"
    },
    c_kuilou: {
      file: "kuilou-800.webp", spot: "奎楼",
      author: "高邮市融媒体中心（今日高邮）",
      license: "官方媒体公开报道配图",
      src: "http://f.gytoday.cn/p/2025/04-17/2063a863e0601e7610a0a6c58297ce09.jpg",
      note: "奎楼与护城河；原图 740×440，为本组分辨率最低"
    },
    c_longqiuzhuang: {
      file: "longqiuzhuang-800.webp", spot: "龙虬庄遗址",
      author: "百度百科",
      license: "公开网络图片（版权归原作者）",
      src: "http://bkimg.cdn.bcebos.com/pic/8b13632762d0f7032e6aca820cfa513d2797c590",
      note: "龙虬庄遗址木构门楼"
    },
    c_wangshi: {
      file: "wangshi-800.webp", spot: "王氏纪念馆",
      author: "百度图片 feed",
      license: "公开网络图片（版权归原作者）",
      src: "http://se-feed-bucket.bj.bcebos.com/3df15a349bc562df78dfd1663ca97611",
      note: "王氏纪念馆门楼；原图 448×277"
    },
    c_kangzhan: {
      file: "kangzhan-800.webp", spot: "抗战最后一役文化园",
      author: "百度图片 feed",
      license: "公开网络图片（版权归原作者）",
      src: "http://pics7.baidu.com/feed/fd039245d688d43f0fadd634e09bea0b0ff43b01.jpeg",
      note: "纪念馆前红色主题雕塑"
    },
    c_wangzengqi: {
      file: "wangzengqi-800.webp", spot: "汪曾祺纪念馆",
      author: "百度图片",
      license: "公开网络图片（版权归原作者）",
      src: "http://b0.bdstatic.com/ugc/TNNv2t3N_OZKRE3lu29amwa358b6817bef9394507c54c8265fb8d1.jpg",
      note: "纪念馆外立面；原图 448×335"
    },
    c_jiyoujia: {
      file: "jiyoujia-800.webp", spot: "中国集邮家博物馆",
      author: "百度百科",
      license: "公开网络图片（版权归原作者）",
      src: "http://bkimg.cdn.bcebos.com/pic/810a19d8bc3eb13533fab75fc647bfd3fd1f4034ee84",
      note: "馆前题名石；原图 671×503"
    },
    c_museum: {
      file: "museum-800.webp", spot: "高邮市博物馆",
      author: "百度百科",
      license: "公开网络图片（版权归原作者）",
      src: "http://bkimg.cdn.bcebos.com/pic/4afbfbedab64034f78f0b5b335926e310a55b319b77f",
      note: "博物馆正立面"
    },
    c_gaoyouhu: {
      file: "gaoyouhu-800.webp", spot: "高邮湖",
      author: "百度图片",
      license: "公开网络图片（版权归原作者）",
      src: "http://gips1.baidu.com/it/u=595969559,2265696325&fm=3074&app=3074&f=JPEG",
      note: "高邮湖日落与湖面渔船"
    },
    c_huahai: {
      file: "huahai-800.webp", spot: "湖上花海",
      author: "搜狐图片",
      license: "公开网络图片（版权归原作者）",
      src: "http://q9.itc.cn/images01/20260409/7e67fc7e87334ef3bec2dd7145ec6c56.jpeg",
      note: "油菜花田航拍"
    },
    c_yunhexidi: {
      file: "yunhexidi-800.webp", spot: "运河西堤",
      author: "百度图片 feed",
      license: "公开网络图片（版权归原作者）",
      src: "http://pics7.baidu.com/feed/f603918fa0ec08faabfc6023625c887d57fbdafd.jpeg",
      note: "运河西堤公园水岸"
    },
    c_nanmen: {
      file: "nanmen-800.webp", spot: "南门大街",
      author: "百度图片",
      license: "公开网络图片（版权归原作者）",
      src: "http://gips1.baidu.com/it/u=156806554,3385650321&fm=3074&app=3074&f=JPEG",
      note: "南门大街牌楼；原图 800×500"
    },
    c_beimendajie: {
      file: "beimendajie-800.webp", spot: "北门大街",
      author: "百度图片 feed",
      license: "公开网络图片（版权归原作者）",
      src: "http://pics4.baidu.com/feed/9e3df8dcd100baa1c9b254bfb3021f1dc8fc2e3d.jpeg",
      note: "北门大街牌坊与街景；原图 448×252"
    }
  },

  /* 音频：4 段景点讲解 + 1 段全域总览（随包下发，离线可播） */
  audios: {
    "yuchengyi": { src: "assets/audio/yuchengyi.mp3", dur: 24.3, spotId: "yuchengyi", title: "盂城驿 · 讲解", kind: "official" },
    "wenyoutai": { src: "assets/audio/wenyoutai.mp3", dur: 14.3, spotId: "wenyoutai", title: "文游台 · 讲解", kind: "official" },
    "wangzengqi": { src: "assets/audio/wangzengqi.mp3", dur: 17.9, spotId: "wangzengqi", title: "汪曾祺纪念馆 · 讲解", kind: "official" },
    "zhenguosi": { src: "assets/audio/zhenguosi.mp3", dur: 16.1, spotId: "zhenguosi", title: "镇国寺塔 · 讲解", kind: "official" },
    "intro": { src: "assets/audio/gaoyou-intro.mp3", dur: 21.1, title: "小史开场 · 还有六处硬核古迹", kind: "official" },
    "faq-f1": { src: "assets/audio/faq-f1.mp3", dur: 12.2, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f10": { src: "assets/audio/faq-f10.mp3", dur: 8.4, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f11": { src: "assets/audio/faq-f11.mp3", dur: 9.7, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f12": { src: "assets/audio/faq-f12.mp3", dur: 11.6, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f2": { src: "assets/audio/faq-f2.mp3", dur: 8.4, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f3": { src: "assets/audio/faq-f3.mp3", dur: 10.9, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f4": { src: "assets/audio/faq-f4.mp3", dur: 8.1, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f5": { src: "assets/audio/faq-f5.mp3", dur: 8.0, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f6": { src: "assets/audio/faq-f6.mp3", dur: 11.2, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f7": { src: "assets/audio/faq-f7.mp3", dur: 8.4, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f8": { src: "assets/audio/faq-f8.mp3", dur: 9.3, title: "常见问题 · 朗读", kind: "ai" },
    "faq-f9": { src: "assets/audio/faq-f9.mp3", dur: 10.4, title: "常见问题 · 朗读", kind: "ai" },
    "gaoyou-intro": { src: "assets/audio/gaoyou-intro.mp3", dur: 21.1, title: "常见问题 · 朗读", kind: "ai" },
    "kb-k1": { src: "assets/audio/kb-k1.mp3", dur: 15.5, title: "问答 · 朗读", kind: "ai" },
    "kb-k10": { src: "assets/audio/kb-k10.mp3", dur: 17.3, title: "问答 · 朗读", kind: "ai" },
    "kb-k11": { src: "assets/audio/kb-k11.mp3", dur: 12.0, title: "问答 · 朗读", kind: "ai" },
    "kb-k12": { src: "assets/audio/kb-k12.mp3", dur: 13.5, title: "问答 · 朗读", kind: "ai" },
    "kb-k13": { src: "assets/audio/kb-k13.mp3", dur: 13.2, title: "问答 · 朗读", kind: "ai" },
    "kb-k14": { src: "assets/audio/kb-k14.mp3", dur: 12.1, title: "问答 · 朗读", kind: "ai" },
    "kb-k15": { src: "assets/audio/kb-k15.mp3", dur: 12.9, title: "问答 · 朗读", kind: "ai" },
    "kb-k16": { src: "assets/audio/kb-k16.mp3", dur: 12.6, title: "问答 · 朗读", kind: "ai" },
    "kb-k17": { src: "assets/audio/kb-k17.mp3", dur: 13.4, title: "问答 · 朗读", kind: "ai" },
    "kb-k18": { src: "assets/audio/kb-k18.mp3", dur: 13.5, title: "问答 · 朗读", kind: "ai" },
    "kb-k19": { src: "assets/audio/kb-k19.mp3", dur: 13.5, title: "问答 · 朗读", kind: "ai" },
    "kb-k2": { src: "assets/audio/kb-k2.mp3", dur: 12.7, title: "问答 · 朗读", kind: "ai" },
    "kb-k20": { src: "assets/audio/kb-k20.mp3", dur: 12.8, title: "问答 · 朗读", kind: "ai" },
    "kb-k21": { src: "assets/audio/kb-k21.mp3", dur: 13.0, title: "问答 · 朗读", kind: "ai" },
    "kb-k22": { src: "assets/audio/kb-k22.mp3", dur: 13.1, title: "问答 · 朗读", kind: "ai" },
    "kb-k23": { src: "assets/audio/kb-k23.mp3", dur: 13.5, title: "问答 · 朗读", kind: "ai" },
    "kb-k24": { src: "assets/audio/kb-k24.mp3", dur: 12.5, title: "问答 · 朗读", kind: "ai" },
    "kb-k25": { src: "assets/audio/kb-k25.mp3", dur: 15.4, title: "问答 · 朗读", kind: "ai" },
    "kb-k26": { src: "assets/audio/kb-k26.mp3", dur: 14.9, title: "问答 · 朗读", kind: "ai" },
    "kb-k27": { src: "assets/audio/kb-k27.mp3", dur: 19.3, title: "问答 · 朗读", kind: "ai" },
    "kb-k28": { src: "assets/audio/kb-k28.mp3", dur: 14.4, title: "问答 · 朗读", kind: "ai" },
    "kb-k29": { src: "assets/audio/kb-k29.mp3", dur: 14.4, title: "问答 · 朗读", kind: "ai" },
    "kb-k3": { src: "assets/audio/kb-k3.mp3", dur: 14.2, title: "问答 · 朗读", kind: "ai" },
    "kb-k30": { src: "assets/audio/kb-k30.mp3", dur: 13.7, title: "问答 · 朗读", kind: "ai" },
    "kb-k4": { src: "assets/audio/kb-k4.mp3", dur: 14.6, title: "问答 · 朗读", kind: "ai" },
    "kb-k5": { src: "assets/audio/kb-k5.mp3", dur: 15.1, title: "问答 · 朗读", kind: "ai" },
    "kb-k6": { src: "assets/audio/kb-k6.mp3", dur: 16.2, title: "问答 · 朗读", kind: "ai" },
    "kb-k7": { src: "assets/audio/kb-k7.mp3", dur: 12.7, title: "问答 · 朗读", kind: "ai" },
    "kb-k8": { src: "assets/audio/kb-k8.mp3", dur: 13.6, title: "问答 · 朗读", kind: "ai" },
    "kb-k9": { src: "assets/audio/kb-k9.mp3", dur: 5.7, title: "问答 · 朗读", kind: "ai" },
    "spot-beimendajie": { src: "assets/audio/spot-beimendajie.mp3", dur: 21.6, spotId: "beimendajie", kind: "ai" },
    "spot-dangpu": { src: "assets/audio/spot-dangpu.mp3", dur: 31.1, spotId: "dangpu", kind: "ai" },
    "spot-gaoyouhu": { src: "assets/audio/spot-gaoyouhu.mp3", dur: 24.9, spotId: "gaoyouhu", kind: "ai" },
    "spot-huahai": { src: "assets/audio/spot-huahai.mp3", dur: 23.2, spotId: "huahai", kind: "ai" },
    "spot-jingtusi": { src: "assets/audio/spot-jingtusi.mp3", dur: 35.6, spotId: "jingtusi", kind: "ai" },
    "spot-jiyoujia": { src: "assets/audio/spot-jiyoujia.mp3", dur: 30.7, spotId: "jiyoujia", kind: "ai" },
    "spot-kangzhan": { src: "assets/audio/spot-kangzhan.mp3", dur: 32.3, spotId: "kangzhan", kind: "ai" },
    "spot-kuilou": { src: "assets/audio/spot-kuilou.mp3", dur: 26.8, spotId: "kuilou", kind: "ai" },
    "spot-longqiuzhuang": { src: "assets/audio/spot-longqiuzhuang.mp3", dur: 30.6, spotId: "longqiuzhuang", kind: "ai" },
    "spot-museum": { src: "assets/audio/spot-museum.mp3", dur: 24.8, spotId: "museum", kind: "ai" },
    "spot-nanmen": { src: "assets/audio/spot-nanmen.mp3", dur: 25.8, spotId: "nanmen", kind: "ai" },
    "spot-wangshi": { src: "assets/audio/spot-wangshi.mp3", dur: 28.1, spotId: "wangshi", kind: "ai" },
    "spot-yunhexidi": { src: "assets/audio/spot-yunhexidi.mp3", dur: 23.8, spotId: "yunhexidi", kind: "ai" }
  },

  cats: [
    { k: "all", t: "全部" },
    { k: "hist", t: "历史古迹" },
    { k: "museum", t: "文博场馆" },
    { k: "nature", t: "自然生态" },
    { k: "food", t: "街区美食" }
  ],

  spots: [
    {
      id: "yuchengyi", name: "盂城驿", short: "盂城驿", cat: "hist",
      desc: "明代驿站 · 全国规模最大、保存最完好",
      img: "assets/img/photo/yuchengyi-800.webp", thumb: "assets/img/photo/yuchengyi-400.webp",
      stampImg: "assets/img/stamp/yuchengyi-stamp.webp", credit: "c_yuchengyi",
      geo: { lat: 32.7727, lng: 119.43354, crs: "WGS84", confidence: "high" },
      aliases: ["盂城驿", "驿站", "邮驿", "古驿站", "孟城驿", "鼓楼", "皇华厅", "马神庙", "驻节堂"],
      audio: "yuchengyi", heat: 92, ticket: "25 元（学生半价）", hours: "08:15 - 17:30",
      intro: "盂城驿开在明洪武八年，是大运河边上保存最完整的一座明代驿站，也是全国重点文物保护单位和世界文化遗产点。古人把高邮叫「秦邮」，驿站就设在城南运河边：公文到这里换马、换船，官员在这里歇脚。院里的鼓楼是全城的制高点，楼上原本悬鼓报时，楼下就是驿马进出的门洞。今天走进驿站，还能看到皇华厅、驻节堂、马神庙这些原样保留的厅堂——一整套「驿」的运作方式，被完整地留在了一条街里。",
      introSrc: "《高邮州志》卷三·盂城驿条；高邮市文体广电和旅游局公开导览资料",
      tags: ["hist", "culture", "post"]
    },
    {
      id: "zhenguosi", name: "镇国寺塔", short: "镇国寺塔", cat: "hist",
      desc: "唐代方形砖塔 · 俗称「西塔」，运河河心岛",
      img: "assets/img/photo/zhenguosi-800.webp", thumb: "assets/img/photo/zhenguosi-400.webp",
      stampImg: "assets/img/stamp/zhenguosi-stamp.webp", credit: "c_zhenguosi",
      geo: { lat: 32.77499, lng: 119.42585, crs: "WGS84", confidence: "high" },
      aliases: ["镇国寺", "镇国寺塔", "西塔", "河心塔", "南方大雁塔", "运河里的塔", "唐塔"],
      audio: "zhenguosi", heat: 78, ticket: "免费（登岛另计）", hours: "08:00 - 17:00",
      intro: "镇国寺塔立在大运河正中间的河心岛上，高邮人叫它「西塔」。塔是方形七层楼阁式砖塔，保留着唐代的风格，和西安大雁塔是一路做法，所以被称作「南方的大雁塔」。上世纪五十年代大运河拓宽，塔正好在航线正中，为保住这座塔，河道专门改线绕行，塔才留在水里——今天坐船过高邮，先看见的就是它。早年间行船的人看见西塔，就知道高邮到了。",
      introSrc: "高邮市文体广电和旅游局公开资料；镇国寺塔（全国重点文物保护单位）公布信息",
      tags: ["hist", "canal", "photo"]
    },
    {
      id: "wenyoutai", name: "文游台", short: "文游台", cat: "hist",
      desc: "北宋文脉 · 苏轼与秦观雅集之地",
      img: "assets/img/photo/wenyoutai-800.webp", thumb: "assets/img/photo/wenyoutai-400.webp",
      stampImg: "assets/img/stamp/wenyoutai-stamp.webp", credit: "c_wenyoutai",
      geo: { lat: 32.7966, lng: 119.4422, crs: "WGS84", confidence: "high" },
      aliases: ["文游台", "文游", "秦观", "四贤祠", "盍簪堂", "淮堧名胜", "泰山庙"],
      audio: "wenyoutai", heat: 66, ticket: "免费", hours: "08:30 - 17:00",
      intro: "文游台在东大街的尽头，是北宋太平兴国年间筑起的一座高台。当年苏轼路过高邮，和本地才子秦观等人在台上饮酒唱和，广陵太守送来一块写着「文游」的匾，台名就这么定了下来。现在看到的建筑是清代重建的，两层重檐歇山顶，台内有秦观塑像、盍簪堂、四贤祠和秦观读书台。山门上的「淮堧名胜」四个字，说的就是这里在江淮之间的分量。",
      introSrc: "文游台（江苏省文物保护单位）公布信息；高邮市文体广电和旅游局公开导览资料",
      tags: ["hist", "literature", "photo"]
    },
    {
      id: "dangpu", name: "高邮当铺", short: "当铺", cat: "hist",
      desc: "清代同兴当铺 · 保存完整的当铺建筑群",
      img: "assets/img/photo/dangpu-800.webp", thumb: "assets/img/photo/dangpu-400.webp",
      stampImg: "assets/img/stamp/dangpu-stamp.webp", credit: "c_dangpu",
      geo: { lat: 32.7936, lng: 119.42827, crs: "WGS84", confidence: "high" },
      aliases: ["当铺", "高邮当铺", "同兴当铺", "典当", "老当铺"],
      audio: null, heat: 48, ticket: "含盂城驿联票", hours: "08:30 - 17:00",
      intro: "高邮当铺又叫同兴当铺，是清代留下来的一整组当铺建筑，全国重点文物保护单位。前店后库，柜台比人高，高高的柜台就是「当」的规矩——当客仰着头递东西，伙计低着头收货，一高一低之间，价钱已经定了。院里还有存当物的库房、账房和防卫设施，是研究古代金融业少见的实物样本。",
      introSrc: "高邮当铺（全国重点文物保护单位）公布信息；高邮市文体广电和旅游局公开资料",
      tags: ["hist", "commerce"]
    },
    {
      id: "jingtusi", name: "净土寺塔（东塔）", short: "净土寺塔", cat: "hist",
      desc: "明代七层砖塔 · 俗称「东塔」",
      img: "assets/img/photo/jingtusi-800.webp", thumb: "assets/img/photo/jingtusi-400.webp",
      stampImg: "assets/img/stamp/jingtusi-stamp.webp", credit: "c_jingtusi",
      geo: { lat: 32.77523, lng: 119.44215, crs: "WGS84", confidence: "medium" },
      aliases: ["净土寺", "净土寺塔", "东塔", "净土寺塔广场"],
      audio: null, heat: 42, ticket: "免费（外围广场）", hours: "全天（广场）",
      intro: "净土寺塔在高邮老城的东头，高邮人叫它「东塔」，和运河里的西塔一东一西，是老城最有辨识度的一对坐标。塔是明代的七层砖塔，早年这一带就是净土寺的旧址。抗战末年的高邮战役里，这一片是最后攻坚的地方，塔身上留下的痕迹，成了那段历史的见证。现在塔周边辟成了广场，傍晚本地人在这里散步、跳操，是老城的日常。",
      introSrc: "净土寺塔（江苏省文物保护单位）公布信息；高邮市公开史料",
      tags: ["hist", "city"]
    },
    {
      id: "kuilou", name: "奎楼·宋城墙", short: "奎楼", cat: "hist",
      desc: "宋代城墙遗存 · 明代奎星楼",
      img: "assets/img/photo/kuilou-800.webp", thumb: "assets/img/photo/kuilou-400.webp",
      stampImg: "assets/img/stamp/kuilou-stamp.webp", credit: "c_kuilou",
      geo: { lat: 32.77678, lng: 119.43712, crs: "WGS84", confidence: "medium" },
      aliases: ["奎楼", "魁楼", "宋城墙", "城墙", "奎星阁"],
      audio: null, heat: 36, ticket: "免费", hours: "全天（外景）",
      intro: "高邮的城墙从宋代筑起，如今留下的是几段夯土城垣和一座奎楼。奎楼供的是奎星，旧时读书人考前要到这儿来拜一拜，求一支好签。城墙加奎楼这一组，是高邮「城」的证据——七千年的文明史、两千多年的建城史，能摸得着的部分就在这里。",
      introSrc: "高邮城墙及奎楼（江苏省文物保护单位）公布信息",
      tags: ["hist", "city"]
    },
    {
      id: "longqiuzhuang", name: "龙虬庄遗址", short: "龙虬庄", cat: "hist",
      desc: "新石器时代遗址 · 出土炭化稻米",
      img: "assets/img/photo/longqiuzhuang-800.webp", thumb: "assets/img/photo/longqiuzhuang-400.webp",
      stampImg: "assets/img/stamp/longqiuzhuang-stamp.webp", credit: "c_longqiuzhuang",
      geo: { lat: 32.83183, lng: 119.50792, crs: "WGS84", confidence: "high" },
      aliases: ["龙虬庄", "龙虬", "龙虬庄遗址", "遗址", "新石器", "稻米遗址"],
      audio: null, heat: 30, ticket: "免费（遗址公园）", hours: "09:00 - 16:30",
      intro: "龙虬庄遗址在龙虬镇，是一处新石器时代的聚落遗址，全国重点文物保护单位。这里出土过炭化稻米和大量陶器、骨器，把江淮东部早期稻作农业的面貌摊开在眼前——高邮「七千年文明史」的说法，根子就在这片土层里。现在原址建了遗址公园，能看到探方剖面和复原的聚落场景。",
      introSrc: "龙虬庄遗址（全国重点文物保护单位）公布信息；江苏省考古公开资料",
      tags: ["hist", "neolithic", "rural"]
    },
    {
      id: "wangshi", name: "王氏纪念馆", short: "王氏纪念馆", cat: "hist",
      desc: "清代训诂学大家王念孙、王引之父子故居",
      img: "assets/img/photo/wangshi-800.webp", thumb: "assets/img/photo/wangshi-400.webp",
      stampImg: "assets/img/stamp/wangshi-stamp.webp", credit: "c_wangshi",
      geo: { lat: 32.77989, lng: 119.42933, crs: "WGS84", confidence: "high" },
      aliases: ["王氏", "王氏纪念馆", "王念孙", "王引之", "训诂", "广雅疏证", "经义述闻", "父子故居"],
      audio: null, heat: 28, ticket: "免费", hours: "09:00 - 17:00",
      intro: "高邮王氏父子——王念孙、王引之，是清代训诂学的两座高峰，《广雅疏证》《经义述闻》到今天还是读古书的工具。纪念馆就设在他们的故居里，院落不大，陈列的是王氏父子的著作版本和治学脉络。高邮出文人，不只是汪曾祺一个，这条学脉要从清代算起。",
      introSrc: "高邮王氏故居（王氏纪念馆）公开资料；《清史稿·王念孙传》",
      tags: ["hist", "literature"]
    },
    {
      id: "kangzhan", name: "抗日战争最后一役纪念馆", short: "抗战最后一役", cat: "hist",
      desc: "1945 年高邮战役 · 抗战最后一役",
      img: "assets/img/photo/kangzhan-800.webp", thumb: "assets/img/photo/kangzhan-400.webp",
      stampImg: "assets/img/stamp/kangzhan-stamp.webp", credit: "c_kangzhan",
      geo: { lat: 32.7856, lng: 119.43078, crs: "WGS84", confidence: "medium" },
      aliases: ["抗战", "最后一役", "抗日战争最后一役", "高邮战役", "受降", "抗战馆", "胜利广场"],
      audio: null, heat: 40, ticket: "免费", hours: "09:00 - 16:30（周一闭馆）",
      intro: "1945 年 12 月的高邮战役，是抗日战争的最后一次战役。日军投降之后仍盘踞高邮城不肯缴械，新四军两个纵队发起攻坚，一举收复高邮。纪念馆在当年的战场旧址上，用沙盘、实物和影像把这一仗讲清楚。它和净土寺塔只隔几条街，一座塔、一场仗，都是这座城的记忆。",
      introSrc: "高邮战役（抗日战争最后一役）公开史料；纪念馆展陈说明",
      tags: ["hist", "red"]
    },
    {
      id: "wangzengqi", name: "汪曾祺纪念馆", short: "汪曾祺纪念馆", cat: "museum",
      desc: "「抒情的人道主义者」· 高邮的文学名片",
      img: "assets/img/photo/wangzengqi-800.webp", thumb: "assets/img/photo/wangzengqi-400.webp",
      stampImg: "assets/img/stamp/wangzengqi-stamp.webp", credit: "c_wangzengqi",
      geo: { lat: 32.79345, lng: 119.43535, crs: "WGS84", confidence: "high" },
      aliases: ["汪曾祺", "汪曾祺纪念馆", "汪曾祺馆", "受戒", "大淖记事", "汪老"],
      audio: "wangzengqi", heat: 74, ticket: "免费", hours: "09:00 - 17:00（周一闭馆）",
      intro: "汪曾祺是高邮人，写《受戒》《大淖记事》，也写高邮的咸鸭蛋、蒲包肉和街巷里的人。纪念馆用他的手稿、旧物和影像，把他的文字和他写的那座城放在一起——看完展再走一趟南门大街，很多句子会突然对上号。在高邮，文学不是摆在柜子里的，是走在街上就能碰见的。",
      introSrc: "汪曾祺纪念馆展陈资料；汪曾祺公开出版作品",
      tags: ["museum", "literature", "photo"]
    },
    {
      id: "jiyoujia", name: "中国集邮家博物馆", short: "集邮家博物馆", cat: "museum",
      desc: "全国唯一以集邮家为主题的博物馆",
      img: "assets/img/photo/jiyoujia-800.webp", thumb: "assets/img/photo/jiyoujia-400.webp",
      stampImg: "assets/img/stamp/jiyoujia-stamp.webp", credit: "c_jiyoujia",
      geo: { lat: 32.77266, lng: 119.43304, crs: "WGS84", confidence: "medium" },
      aliases: ["集邮", "集邮家", "集邮家博物馆", "中国集邮家博物馆", "邮票博物馆", "大龙邮票", "集邮之乡"],
      audio: null, heat: 32, ticket: "免费", hours: "09:00 - 17:00（周一闭馆）",
      intro: "高邮是「中国集邮之乡」，中国集邮家博物馆就落在这里，是国内唯一以集邮家为主题的博物馆。馆里收的是几代集邮家的藏品和故事：清代大龙邮票、解放区邮票、各地的实寄封。对邮小驿来说，这里也是「数字邮戳」这套玩法的老家——方寸之间，装的是驿站、是邮路、是一座城的往来。",
      introSrc: "中国集邮家博物馆公开资料；高邮「中国集邮之乡」命名背景",
      tags: ["museum", "post"]
    },
    {
      id: "museum", name: "高邮博物馆", short: "高邮博物馆", cat: "museum",
      desc: "地方综合馆 · 一馆看全高邮七千年",
      img: "assets/img/photo/museum-800.webp", thumb: "assets/img/photo/museum-400.webp",
      stampImg: "assets/img/stamp/museum-stamp.webp", credit: "c_museum",
      geo: { lat: 32.78041, lng: 119.46115, crs: "WGS84", confidence: "medium" },
      aliases: ["高邮博物馆", "博物馆", "市博物馆", "文博场馆"],
      audio: null, heat: 38, ticket: "免费", hours: "09:00 - 17:00（周一闭馆）",
      intro: "想一次把高邮看完，先来博物馆。从龙虬庄的陶器、汉代的墓葬，到运河漕运的账册、邮驿的文书，再到汪曾祺的手稿，一条线串起七千年。对第一次来高邮的人，这里是最划算的第一站——看完再决定去哪几处，行程会省很多。",
      introSrc: "高邮博物馆公开展陈资料",
      tags: ["museum", "city"]
    },
    {
      id: "gaoyouhu", name: "高邮湖", short: "高邮湖", cat: "nature",
      desc: "江苏第三大淡水湖 · 湖上日落",
      img: "assets/img/photo/gaoyouhu-800.webp", thumb: "assets/img/photo/gaoyouhu-400.webp",
      stampImg: "assets/img/stamp/gaoyouhu-stamp.webp", credit: "c_gaoyouhu",
      geo: { lat: 32.78688, lng: 119.42108, crs: "WGS84", confidence: "medium" },
      aliases: ["高邮湖", "湖", "大湖", "看湖", "湖边", "湖上"],
      audio: null, heat: 58, ticket: "免费", hours: "全天",
      intro: "高邮湖在城西，是江苏第三大淡水湖。湖面开阔，没有山挡着，日落一直落到水平线里，是高邮最出片的地方。湖边是麻鸭的天下，高邮咸鸭蛋的蛋黄能出油，靠的就是湖里的鱼虾。傍晚来，风大、光好，带件外套。",
      introSrc: "高邮市文体广电和旅游局公开资料；高邮湖水域公开地理资料",
      tags: ["nature", "lake", "photo"]
    },
    {
      id: "huahai", name: "湖上花海", short: "湖上花海", cat: "nature",
      desc: "高邮湖畔油菜花海 · 春季限定",
      img: "assets/img/photo/huahai-800.webp", thumb: "assets/img/photo/huahai-400.webp",
      stampImg: "assets/img/stamp/huahai-stamp.webp", credit: "c_huahai",
      geo: { lat: 32.71608, lng: 119.40073, crs: "WGS84", confidence: "medium" },
      aliases: ["湖上花海", "花海", "油菜花", "花田", "小火车"],
      audio: null, heat: 62, ticket: "季节性售票", hours: "08:30 - 17:30（花季）",
      intro: "湖上花海在高邮湖边，是春天最热闹的一段。油菜花开的时候，一片黄一直铺到水边，景区里有小火车慢慢穿过去，不用走路也能看完。花期短，一般三月中到四月中最好，来之前先看花期播报，别扑空。",
      introSrc: "湖上花海景区公开信息（花季时段以当年公告为准）",
      tags: ["nature", "seasonal", "rural"]
    },
    {
      id: "yunhexidi", name: "运河西堤", short: "运河西堤", cat: "nature",
      desc: "大运河高邮段 · 运河故道风光带",
      img: "assets/img/photo/yunhexidi-800.webp", thumb: "assets/img/photo/yunhexidi-400.webp",
      stampImg: "assets/img/stamp/yunhexidi-stamp.webp", credit: "c_yunhexidi",
      geo: { lat: 32.79675, lng: 119.42323, crs: "WGS84", confidence: "medium" },
      aliases: ["运河西堤", "西堤", "运河", "大运河", "运河边", "湖上升明月", "夜游"],
      audio: null, heat: 54, ticket: "免费", hours: "全天",
      intro: "大运河到高邮这一段，河面宽、船多，西堤是看运河最好的位置。堤上种着树，一路能走到镇国寺对岸，看塔立在河心岛上，货船一艘接一艘从塔边过。晚上有「湖上升明月」的夜游，灯光打在塔上，是另一副样子。",
      introSrc: "大运河（高邮段）世界文化遗产点公开资料；高邮市文旅公开信息",
      tags: ["nature", "canal", "photo"]
    },
    {
      id: "nanmen", name: "南门大街", short: "南门大街", cat: "food",
      desc: "盂城驿前老街 · 明清商业街",
      img: "assets/img/photo/nanmen-800.webp", thumb: "assets/img/photo/nanmen-400.webp",
      stampImg: "assets/img/stamp/nanmen-stamp.webp", credit: "c_nanmen",
      geo: { lat: 32.7724, lng: 119.4319, crs: "WGS84", confidence: "high" },
      aliases: ["南门大街", "南门", "南大街", "老街", "盂城驿街区", "小吃街"],
      audio: null, heat: 76, ticket: "免费", hours: "全天（店铺 09:00-21:00）",
      intro: "南门大街就在盂城驿门口，是当年驿站带起来的一条商业街。青石板、木板门、两层的旧铺面，卖的还是吃食和日用小物：蒲包肉、界首茶干、咸鸭蛋、董糖。街不长，慢慢走半小时够了，但坐下来吃一顿，能把高邮的味道记住。",
      introSrc: "高邮市文体广电和旅游局公开资料；南门大街历史街区公开介绍",
      tags: ["food", "street", "photo"]
    },
    {
      id: "beimendajie", name: "北门大街", short: "北门大街", cat: "food",
      desc: "老城北门 · 市井烟火气",
      img: "assets/img/photo/beimendajie-800.webp", thumb: "assets/img/photo/beimendajie-400.webp",
      stampImg: "assets/img/stamp/beimendajie-stamp.webp", credit: "c_beimendajie",
      geo: { lat: 32.7966, lng: 119.42682, crs: "WGS84", confidence: "medium" },
      aliases: ["北门大街", "北门", "北大街", "人民路"],
      audio: null, heat: 44, ticket: "免费", hours: "全天",
      intro: "北门大街在高邮老城的北门一带，比南门更日常：早上的早点摊、下午的菜场、晚上的烧烤。想看高邮人自己怎么过日子，来这条街比去景区准。从北门往南走，能一路串到奎楼和宋城墙。",
      introSrc: "高邮市公开街区资料；本地走访记录（2026-11）",
      tags: ["food", "street", "local"]
    }
  ],

  /* 路线：按天数给主线，tags 决定站点取舍顺序 */
  routes: [
    {
      id: "r1", title: "半日 · 邮驿精华线", hours: 3.5, tags: ["culture", "photo"],
      intro: "第一次来高邮，时间只有半天：一站把「驿」看透，再上运河看塔。",
      stops: [
        { spotId: "yuchengyi", dur: "1.5h", time: "08:30 - 10:00", tip: "开门就进，鼓楼人少好拍照；先听 24 秒讲解再逛。" },
        { spotId: "nanmen", dur: "1h", time: "10:00 - 11:00", tip: "出门就是，蒲包肉和界首茶干各买一份。" },
        { spotId: "zhenguosi", dur: "1h", time: "11:00 - 12:00", tip: "打车 10 分钟到运河边，看塔在河心岛上。" }
      ]
    },
    {
      id: "r2", title: "一日 · 经典全线", hours: 7, tags: ["culture", "food", "photo"],
      intro: "覆盖 5 个必看点，含一顿正经午饭，节奏不赶。",
      stops: [
        { spotId: "yuchengyi", dur: "2h", time: "08:30 - 10:30", tip: "重点看皇华厅、驻节堂、鼓楼。" },
        { spotId: "dangpu", dur: "40m", time: "10:30 - 11:10", tip: "和盂城驿联票，柜台高度是看点。" },
        { spotId: "nanmen", dur: "1.2h", time: "11:20 - 12:30", tip: "午饭在这吃，少游宴或汪味家常菜。" },
        { spotId: "wangzengqi", dur: "1.5h", time: "13:30 - 15:00", tip: "周一闭馆，注意避开。" },
        { spotId: "zhenguosi", dur: "1h", time: "15:30 - 16:30", tip: "下午顺光，塔身细节最清楚。" },
        { spotId: "yunhexidi", dur: "1h", time: "16:30 - 17:30", tip: "留给日落，别急着走。" }
      ]
    },
    {
      id: "r3", title: "两日一夜 · 过夜游", hours: 14, tags: ["culture", "nature", "photo", "stay"],
      intro: "把「过境」变「过夜」：第一天看城，第二天看湖。",
      stops: [
        { spotId: "yuchengyi", dur: "2h", time: "D1 09:00 - 11:00", tip: "" },
        { spotId: "wangzengqi", dur: "1.5h", time: "D1 13:30 - 15:00", tip: "" },
        { spotId: "kuilou", dur: "40m", time: "D1 15:30 - 16:10", tip: "城墙加奎楼，顺路。" },
        { spotId: "yunhexidi", dur: "1.5h", time: "D1 17:00 - 18:30", tip: "看日落 + 夜游「湖上升明月」。" },
        { spotId: "nanmen", dur: "1.5h", time: "D1 19:00 - 20:30", tip: "晚饭 + 老街夜市，住南门附近。" },
        { spotId: "huahai", dur: "2h", time: "D2 09:00 - 11:00", tip: "花季才有，先查花期。" },
        { spotId: "gaoyouhu", dur: "1.5h", time: "D2 11:30 - 13:00", tip: "湖边吃湖鲜，麻鸭和银鱼。" }
      ]
    },
    {
      id: "r4", title: "亲子 · 边走边学", hours: 5, tags: ["family", "museum"],
      intro: "少走路、多动手，两馆一街刚好一天。",
      stops: [
        { spotId: "museum", dur: "1.5h", time: "09:00 - 10:30", tip: "先看龙虬庄陶器，给孩子一个问题带着走。" },
        { spotId: "longqiuzhuang", dur: "1h", time: "11:00 - 12:00", tip: "遗址剖面很直观，注意防晒。" },
        { spotId: "jiyoujia", dur: "50m", time: "13:30 - 14:20", tip: "集邮博物馆，可以寄一张明信片。" },
        { spotId: "yuchengyi", dur: "1.5h", time: "14:40 - 16:10", tip: "鼓楼可以上去，孩子最爱。" }
      ]
    },
    {
      id: "r5", title: "红色 · 抗战记忆线", hours: 4, tags: ["red", "history"],
      intro: "从最后一役的战场的角度看这座城。",
      stops: [
        { spotId: "kangzhan", dur: "1.5h", time: "09:00 - 10:30", tip: "周一闭馆，团体可预约讲解。" },
        { spotId: "jingtusi", dur: "40m", time: "10:50 - 11:30", tip: "东塔广场，看当年攻坚的方向。" },
        { spotId: "kuilou", dur: "40m", time: "14:00 - 14:40", tip: "宋城墙，城的骨架。" },
        { spotId: "wangshi", dur: "1h", time: "15:00 - 16:00", tip: "看高邮的另一条文脉。" }
      ]
    }
  ],

  /* 常见问题（结构化，答案不经过大模型改写） */
  faqCats: [
    { k: "all", t: "全部" },
    { k: "ticket", t: "门票预约" },
    { k: "park", t: "交通停车" },
    { k: "food", t: "吃点什么" },
    { k: "stay", t: "住一晚" },
    { k: "help", t: "求助投诉" }
  ],
  faqs: [
    { id: "f1", cat: "ticket", q: "盂城驿要门票吗？多少钱？", a: "要，25 元，学生半价。和旁边的高邮当铺有联票，一起看更划算。开放时间 08:15-17:30。", src: "景区公开票价（2025）" },
    { id: "f2", cat: "ticket", q: "镇国寺塔要门票吗？", a: "塔在运河河心岛上，外围和西堤看塔免费；登岛进寺另计，以现场公告为准。", src: "景区公开信息" },
    { id: "f3", cat: "ticket", q: "哪些馆周一闭馆？", a: "汪曾祺纪念馆、中国集邮家博物馆、高邮博物馆、抗战最后一役纪念馆一般周一闭馆，节假日以公告为准。", src: "各馆公开开放时间" },
    { id: "f4", cat: "ticket", q: "需要提前预约吗？", a: "平时不用，节假日和团队建议提前一天电话预约；盂城驿旺季现场限流。", src: "景区公开信息" },
    { id: "f5", cat: "ticket", q: "有优惠票吗？", a: "学生、60 岁以上老人、现役军人等按规定优惠，凭有效证件现场办理。", src: "景区公开票价" },
    { id: "f6", cat: "park", q: "自驾停哪儿？", a: "盂城驿南门大街附近有停车场，节假日 10 点后容易满，建议停远一点步行进来；运河西堤沿线可临时停车。", src: "本地走访（2026-11）" },
    { id: "f7", cat: "park", q: "从高铁站怎么过来？", a: "高邮站打车到盂城驿约 15-20 分钟；也可以先到高邮汽车客运站再换公交。", src: "本地交通公开信息" },
    { id: "f8", cat: "park", q: "景点之间远吗？", a: "盂城驿、南门大街、当铺都在步行范围内；镇国寺塔和运河西堤要打车 10 分钟左右。", src: "本地走访（2026-11）" },
    { id: "f9", cat: "food", q: "高邮有什么必吃？", a: "咸鸭蛋、蒲包肉、界首茶干、汪味家常菜（汪豆腐、炒米糖）、少游宴。南门大街最集中。", src: "高邮市文旅公开资料" },
    { id: "f10", cat: "food", q: "哪条街吃东西最好？", a: "南门大街偏游客、品类全；北门大街更本地、更便宜，早餐和夜宵都在那。", src: "本地走访（2026-11）" },
    { id: "f11", cat: "stay", q: "住哪里方便？", a: "住南门大街或盂城驿周边，晚上能逛老街，第二天去运河也近；湖景房看日落选西堤一带。", src: "本地走访（2026-11）" },
    { id: "f12", cat: "help", q: "我要投诉 / 东西丢了怎么办？", a: "请直接联系景区服务台或拨打 12345；也可以在小史这里开一张诉求单：有单号、有受理时间，内容存本机、可导出 txt（演示原型，不自动转派工单）。", src: "服务流程说明" }
  ],

  /* 本地知识库：断网也能答。tags 用于按景点/主题召回 */
  audios2: {
    "kb-k31": { src: "assets/audio/kb-k31.mp3", title: "问答朗读 · 高邮站打车到盂城驿约十五到二", kind: "ai", kbId: "k31" },
    "kb-k33": { src: "assets/audio/kb-k33.mp3", title: "问答朗读 · 扬州到高邮约六十公里。高铁从", kind: "ai", kbId: "k33" },
    "kb-k34": { src: "assets/audio/kb-k34.mp3", title: "问答朗读 · 南京到高邮没有直达干线，一般", kind: "ai", kbId: "k34" },
    "kb-k35": { src: "assets/audio/kb-k35.mp3", title: "问答朗读 · 上海到高邮高铁多数要在镇江或", kind: "ai", kbId: "k35" },
    "kb-k37": { src: "assets/audio/kb-k37.mp3", title: "问答朗读 · 高邮城区不大，起步价几块钱，", kind: "ai", kbId: "k37" },
    "kb-k45": { src: "assets/audio/kb-k45.mp3", title: "问答朗读 · 凭全日制学生证在售票窗口买半", kind: "ai", kbId: "k45" },
    "kb-k46": { src: "assets/audio/kb-k46.mp3", title: "问答朗读 · 六十岁以上凭身份证或老年证按", kind: "ai", kbId: "k46" },
    "kb-k49": { src: "assets/audio/kb-k49.mp3", title: "问答朗读 · 平时现场买票就行，节假日和团", kind: "ai", kbId: "k49" },
    "kb-k50": { src: "assets/audio/kb-k50.mp3", title: "问答朗读 · 盂城驿和高邮当铺有联票，在盂", kind: "ai", kbId: "k50" },
    "kb-k52": { src: "assets/audio/kb-k52.mp3", title: "问答朗读 · 塔在运河河心岛上，西堤和对岸", kind: "ai", kbId: "k52" },
    "kb-k57": { src: "assets/audio/kb-k57.mp3", title: "问答朗读 · 身高一米二以下一般免票，一米", kind: "ai", kbId: "k57" },
    "kb-k59": { src: "assets/audio/kb-k59.mp3", title: "问答朗读 · 盂城驿八点一刻开门，五点半关", kind: "ai", kbId: "k59" },
    "kb-k60": { src: "assets/audio/kb-k60.mp3", title: "问答朗读 · 高邮的场馆中午不闭馆，盂城驿", kind: "ai", kbId: "k60" },
    "kb-k62": { src: "assets/audio/kb-k62.mp3", title: "问答朗读 · 汪曾祺纪念馆、集邮家博物馆、", kind: "ai", kbId: "k62" },
    "kb-k63": { src: "assets/audio/kb-k63.mp3", title: "问答朗读 · 春节一般照常开放，除夕和初一", kind: "ai", kbId: "k63" },
    "kb-k67": { src: "assets/audio/kb-k67.mp3", title: "问答朗读 · 运河西堤的灯光一般天黑后亮起", kind: "ai", kbId: "k67" },
    "kb-k69": { src: "assets/audio/kb-k69.mp3", title: "问答朗读 · 第一天看城：盂城驿、当铺、南", kind: "ai", kbId: "k69" },
    "kb-k70": { src: "assets/audio/kb-k70.mp3", title: "问答朗读 · 带孩子就走博物馆、龙虬庄、集", kind: "ai", kbId: "k70" },
    "kb-k71": { src: "assets/audio/kb-k71.mp3", title: "问答朗读 · 给老人排平路：盂城驿院落、南", kind: "ai", kbId: "k71" },
    "kb-k72": { src: "assets/audio/kb-k72.mp3", title: "问答朗读 · 下雨就把室内排满：高邮博物馆", kind: "ai", kbId: "k72" },
    "kb-k75": { src: "assets/audio/kb-k75.mp3", title: "问答朗读 · 东塔在城里净土寺广场，西塔在", kind: "ai", kbId: "k75" },
    "kb-k77": { src: "assets/audio/kb-k77.mp3", title: "问答朗读 · 上午文游台看苏轼秦观唱和，中", kind: "ai", kbId: "k77" },
    "kb-k79": { src: "assets/audio/kb-k79.mp3", title: "问答朗读 · 盂城驿一小时半，当铺四十分钟", kind: "ai", kbId: "k79" },
    "kb-k81": { src: "assets/audio/kb-k81.mp3", title: "问答朗读 · 两小时就只做一件事：盂城驿加", kind: "ai", kbId: "k81" },
    "kb-k83": { src: "assets/audio/kb-k83.mp3", title: "问答朗读 · 高邮早茶是包子、烫干丝、肴肉", kind: "ai", kbId: "k83" },
    "kb-k84": { src: "assets/audio/kb-k84.mp3", title: "问答朗读 · 咸鸭蛋、蒲包肉、界首茶干、汪", kind: "ai", kbId: "k84" },
    "kb-k85": { src: "assets/audio/kb-k85.mp3", title: "问答朗读 · 小吃人均二三十，南门大街正餐", kind: "ai", kbId: "k85" },
    "kb-k87": { src: "assets/audio/kb-k87.mp3", title: "问答朗读 · 南门大街和北门菜场都有散装咸", kind: "ai", kbId: "k87" },
    "kb-k92": { src: "assets/audio/kb-k92.mp3", title: "问答朗读 · 湖鲜往高邮湖边和西堤一带的馆", kind: "ai", kbId: "k92" },
    "kb-k95": { src: "assets/audio/kb-k95.mp3", title: "问答朗读 · 住老城最方便，南门大街、盂城", kind: "ai", kbId: "k95" },
    "kb-k96": { src: "assets/audio/kb-k96.mp3", title: "问答朗读 · 湖景房集中在运河西堤和高邮湖", kind: "ai", kbId: "k96" },
    "kb-k98": { src: "assets/audio/kb-k98.mp3", title: "问答朗读 · 城区经济型一两百，连锁三百上", kind: "ai", kbId: "k98" },
    "kb-k99": { src: "assets/audio/kb-k99.mp3", title: "问答朗读 · 多数酒店退房后可以免费寄存到", kind: "ai", kbId: "k99" },
    "kb-k103": { src: "assets/audio/kb-k103.mp3", title: "问答朗读 · 盂城驿院内、南门大街两头、博", kind: "ai", kbId: "k103" },
    "kb-k105": { src: "assets/audio/kb-k105.mp3", title: "问答朗读 · 盂城驿游客中心和博物馆服务台", kind: "ai", kbId: "k105" },
    "kb-k109": { src: "assets/audio/kb-k109.mp3", title: "问答朗读 · 先回想最后停留的点位，直接找", kind: "ai", kbId: "k109" },
    "kb-k110": { src: "assets/audio/kb-k110.mp3", title: "问答朗读 · 各主要景点服务台备有急救箱，", kind: "ai", kbId: "k110" },
    "kb-k113": { src: "assets/audio/kb-k113.mp3", title: "问答朗读 · 鼓楼俯拍南门大街、运河西堤拍", kind: "ai", kbId: "k113" },
    "kb-k114": { src: "assets/audio/kb-k114.mp3", title: "问答朗读 · 城区和景区基本禁飞，盂城驿、", kind: "ai", kbId: "k114" },
    "kb-k117": { src: "assets/audio/kb-k117.mp3", title: "问答朗读 · 高邮湖和运河西堤是看日落的正", kind: "ai", kbId: "k117" },
    "kb-k122": { src: "assets/audio/kb-k122.mp3", title: "问答朗读 · 秦代在这里筑高台、设邮亭，所", kind: "ai", kbId: "k122" },
    "kb-k123": { src: "assets/audio/kb-k123.mp3", title: "问答朗读 · 「盂」是古代的一种盛水器，也", kind: "ai", kbId: "k123" },
    "kb-k125": { src: "assets/audio/kb-k125.mp3", title: "问答朗读 · 秦观是高邮人，北宋词人，苏门", kind: "ai", kbId: "k125" },
    "kb-k126": { src: "assets/audio/kb-k126.mp3", title: "问答朗读 · 汪曾祺是高邮人，十九岁离开，", kind: "ai", kbId: "k126" },
    "kb-k134": { src: "assets/audio/kb-k134.mp3", title: "问答朗读 · 建议扬州两天、高邮一天：扬州", kind: "ai", kbId: "k134" },
    "kb-k135": { src: "assets/audio/kb-k135.mp3", title: "问答朗读 · 高邮到扬州瘦西湖约六十公里，", kind: "ai", kbId: "k135" },
    "kb-k136": { src: "assets/audio/kb-k136.mp3", title: "问答朗读 · 高邮到兴化约六十公里，自驾一", kind: "ai", kbId: "k136" },
    "kb-k142": { src: "assets/audio/kb-k142.mp3", title: "问答朗读 · 三月底到五月初最好，油菜花开", kind: "ai", kbId: "k142" },
    "kb-k144": { src: "assets/audio/kb-k144.mp3", title: "问答朗读 · 高邮湖边和宝应方向的荷塘七八", kind: "ai", kbId: "k144" },
    "kb-k148": { src: "assets/audio/kb-k148.mp3", title: "问答朗读 · 老城都是青石板和石台阶，鼓楼", kind: "ai", kbId: "k148" },
    "kb-h1": { src: "assets/audio/kb-h1.mp3", title: "问答朗读 · 高邮民歌", kind: "ai", kbId: "h1" },
    "kb-h2": { src: "assets/audio/kb-h2.mp3", title: "问答朗读 · 高邮鸭蛋腌制技艺", kind: "ai", kbId: "h2" },
    "kb-h3": { src: "assets/audio/kb-h3.mp3", title: "问答朗读 · 高邮剪纸", kind: "ai", kbId: "h3" },
    "kb-h4": { src: "assets/audio/kb-h4.mp3", title: "问答朗读 · 盂城驿邮驿文化", kind: "ai", kbId: "h4" },
    "kb-h5": { src: "assets/audio/kb-h5.mp3", title: "问答朗读 · 临泽高跷", kind: "ai", kbId: "h5" },
    "kb-k151": { src: "assets/audio/kb-k151.mp3", title: "问答朗读 · 盂城驿门票 25 元，学生凭", kind: "ai", kbId: "k151" },
    "kb-k152": { src: "assets/audio/kb-k152.mp3", title: "问答朗读 · 镇国寺塔本身免费，但要上河心", kind: "ai", kbId: "k152" },
    "kb-k153": { src: "assets/audio/kb-k153.mp3", title: "问答朗读 · 文游台免费开放，凭身份证登记", kind: "ai", kbId: "k153" },
    "kb-k154": { src: "assets/audio/kb-k154.mp3", title: "问答朗读 · 高邮当铺不单卖票，含在盂城驿", kind: "ai", kbId: "k154" },
    "kb-k155": { src: "assets/audio/kb-k155.mp3", title: "问答朗读 · 净土寺塔外围广场免费，随时可", kind: "ai", kbId: "k155" },
    "kb-k156": { src: "assets/audio/kb-k156.mp3", title: "问答朗读 · 奎楼和宋城墙外景免费，沿城墙", kind: "ai", kbId: "k156" },
    "kb-k157": { src: "assets/audio/kb-k157.mp3", title: "问答朗读 · 龙虬庄遗址公园免费，遗址展示", kind: "ai", kbId: "k157" },
    "kb-k158": { src: "assets/audio/kb-k158.mp3", title: "问答朗读 · 王氏纪念馆免费，凭身份证登记", kind: "ai", kbId: "k158" },
    "kb-k159": { src: "assets/audio/kb-k159.mp3", title: "问答朗读 · 抗战最后一役纪念馆免费，周一", kind: "ai", kbId: "k159" },
    "kb-k160": { src: "assets/audio/kb-k160.mp3", title: "问答朗读 · 汪曾祺纪念馆免费，周一闭馆。", kind: "ai", kbId: "k160" },
    "kb-k161": { src: "assets/audio/kb-k161.mp3", title: "问答朗读 · 中国集邮家博物馆免费，周一闭", kind: "ai", kbId: "k161" },
    "kb-k162": { src: "assets/audio/kb-k162.mp3", title: "问答朗读 · 高邮博物馆免费，周一闭馆。临", kind: "ai", kbId: "k162" },
    "kb-k163": { src: "assets/audio/kb-k163.mp3", title: "问答朗读 · 高邮湖不收费，湖边随便走。坐", kind: "ai", kbId: "k163" },
    "kb-k164": { src: "assets/audio/kb-k164.mp3", title: "问答朗读 · 湖上花海是季节性售票，花季（", kind: "ai", kbId: "k164" },
    "kb-k165": { src: "assets/audio/kb-k165.mp3", title: "问答朗读 · 运河西堤免费，全天开放。夜游", kind: "ai", kbId: "k165" },
    "kb-k166": { src: "assets/audio/kb-k166.mp3", title: "问答朗读 · 南门大街是开放街区，不收费。", kind: "ai", kbId: "k166" },
    "kb-k167": { src: "assets/audio/kb-k167.mp3", title: "问答朗读 · 北门大街是开放街区，不收费。", kind: "ai", kbId: "k167" },
    "kb-k168": { src: "assets/audio/kb-k168.mp3", title: "问答朗读 · 盂城驿能看的东西分三块：一是", kind: "ai", kbId: "k168" },
    "kb-k169": { src: "assets/audio/kb-k169.mp3", title: "问答朗读 · 镇国寺塔看三样：塔本身——方", kind: "ai", kbId: "k169" },
    "kb-k170": { src: "assets/audio/kb-k170.mp3", title: "问答朗读 · 文游台主要看文脉：山门匾额「", kind: "ai", kbId: "k170" },
    "kb-k171": { src: "assets/audio/kb-k171.mp3", title: "问答朗读 · 高邮当铺看的是「当」这门生意", kind: "ai", kbId: "k171" },
    "kb-k172": { src: "assets/audio/kb-k172.mp3", title: "问答朗读 · 净土寺塔（东塔）主要看塔身：", kind: "ai", kbId: "k172" },
    "kb-k173": { src: "assets/audio/kb-k173.mp3", title: "问答朗读 · 奎楼建在宋代城墙的遗存上，看", kind: "ai", kbId: "k173" },
    "kb-k174": { src: "assets/audio/kb-k174.mp3", title: "问答朗读 · 龙虬庄是七千年前的新石器聚落", kind: "ai", kbId: "k174" },
    "kb-k175": { src: "assets/audio/kb-k175.mp3", title: "问答朗读 · 王氏纪念馆在王氏父子故居里，", kind: "ai", kbId: "k175" },
    "kb-k176": { src: "assets/audio/kb-k176.mp3", title: "问答朗读 · 抗战最后一役纪念馆看的是 1", kind: "ai", kbId: "k176" },
    "kb-k177": { src: "assets/audio/kb-k177.mp3", title: "问答朗读 · 汪曾祺纪念馆把「他的文字」和", kind: "ai", kbId: "k177" },
    "kb-k178": { src: "assets/audio/kb-k178.mp3", title: "问答朗读 · 中国集邮家博物馆是国内唯一以", kind: "ai", kbId: "k178" },
    "kb-k179": { src: "assets/audio/kb-k179.mp3", title: "问答朗读 · 高邮博物馆是高邮的通史陈列：", kind: "ai", kbId: "k179" },
    "kb-k180": { src: "assets/audio/kb-k180.mp3", title: "问答朗读 · 高邮湖不收费，玩法就三样：看", kind: "ai", kbId: "k180" },
    "kb-k181": { src: "assets/audio/kb-k181.mp3", title: "问答朗读 · 湖上花海的主角是油菜花，花季", kind: "ai", kbId: "k181" },
    "kb-k182": { src: "assets/audio/kb-k182.mp3", title: "问答朗读 · 运河西堤看的是「活着的运河」", kind: "ai", kbId: "k182" },
    "kb-k183": { src: "assets/audio/kb-k183.mp3", title: "问答朗读 · 南门大街是盂城驿门口那条老街", kind: "ai", kbId: "k183" },
    "kb-k184": { src: "assets/audio/kb-k184.mp3", title: "问答朗读 · 北门大街是本地的早市街区，最", kind: "ai", kbId: "k184" },
    "kb-k185": { src: "assets/audio/kb-k185.mp3", title: "问答朗读 · 盂城驿 08:15-17:3", kind: "ai", kbId: "k185" },
    "kb-k186": { src: "assets/audio/kb-k186.mp3", title: "问答朗读 · 镇国寺塔 08:00-17:", kind: "ai", kbId: "k186" },
    "kb-k187": { src: "assets/audio/kb-k187.mp3", title: "问答朗读 · 文游台 08:30-17:0", kind: "ai", kbId: "k187" },
    "kb-k188": { src: "assets/audio/kb-k188.mp3", title: "问答朗读 · 高邮当铺 08:30-17:", kind: "ai", kbId: "k188" },
    "kb-k189": { src: "assets/audio/kb-k189.mp3", title: "问答朗读 · 净土寺塔广场全天开放，塔身晚", kind: "ai", kbId: "k189" },
    "kb-k190": { src: "assets/audio/kb-k190.mp3", title: "问答朗读 · 奎楼和宋城墙外景全天可看，没", kind: "ai", kbId: "k190" },
    "kb-k191": { src: "assets/audio/kb-k191.mp3", title: "问答朗读 · 龙虬庄遗址公园 09:00-", kind: "ai", kbId: "k191" },
    "kb-k192": { src: "assets/audio/kb-k192.mp3", title: "问答朗读 · 王氏纪念馆 09:00-17", kind: "ai", kbId: "k192" },
    "kb-k193": { src: "assets/audio/kb-k193.mp3", title: "问答朗读 · 抗战最后一役纪念馆 09:0", kind: "ai", kbId: "k193" },
    "kb-k194": { src: "assets/audio/kb-k194.mp3", title: "问答朗读 · 汪曾祺纪念馆 09:00-1", kind: "ai", kbId: "k194" },
    "kb-k195": { src: "assets/audio/kb-k195.mp3", title: "问答朗读 · 中国集邮家博物馆 09:00", kind: "ai", kbId: "k195" },
    "kb-k196": { src: "assets/audio/kb-k196.mp3", title: "问答朗读 · 高邮博物馆 09:00-17", kind: "ai", kbId: "k196" },
    "kb-k197": { src: "assets/audio/kb-k197.mp3", title: "问答朗读 · 高邮湖全天开放，看日落最好在", kind: "ai", kbId: "k197" },
    "kb-k198": { src: "assets/audio/kb-k198.mp3", title: "问答朗读 · 湖上花海 08:30-17:", kind: "ai", kbId: "k198" },
    "kb-k199": { src: "assets/audio/kb-k199.mp3", title: "问答朗读 · 运河西堤全天开放。夜游项目一", kind: "ai", kbId: "k199" },
    "kb-k200": { src: "assets/audio/kb-k200.mp3", title: "问答朗读 · 南门大街全天可走，店铺大多 ", kind: "ai", kbId: "k200" },
    "kb-k201": { src: "assets/audio/kb-k201.mp3", title: "问答朗读 · 北门大街全天可走，早市 06", kind: "ai", kbId: "k201" },
  },

  // 意图词典：归一化检索第三层用
  merchants: [
    {
      id: "m1", name: "南门大街 · 文创小店", type: "文创",
      selling: ["邮戳印章", "驿站主题明信片", "手作书签"],
      scriptTpl: [
        "在盂城驿门口盖一枚属于你的邮戳。{product}，把高邮的驿站寄回家。",
        "走完盂城驿，别急着走——拐进南门大街，{product}就在第二家。",
        "一张明信片，一枚邮戳，一段运河。{product}，南门大街自取。"
      ]
    },
    {
      id: "m2", name: "南门大街 · 汪味小馆", type: "餐饮",
      selling: ["汪豆腐", "蒲包肉", "咸鸭蛋"],
      scriptTpl: [
        "汪曾祺写过的家常味，{product}，就在盂城驿隔壁这条街。",
        "一碟{product}，一碗米饭，高邮人的中午就这么过。",
        "来高邮不吃{product}，等于没来。南门大街，中午十一点开灶。"
      ]
    },
    {
      id: "m3", name: "运河西堤 · 湖边民宿", type: "住宿",
      selling: ["湖景房", "日落露台", "湖鲜早餐"],
      scriptTpl: [
        "推开窗就是运河和镇国寺塔。{product}，西堤边，一晚够看两次日落。",
        "货船从塔边过，灯一盏盏亮起来。{product}，留给不想赶路的人。",
        "早上有湖鲜，晚上有风。{product}，高邮西堤。"
      ]
    }
  ]
};

/* 问答 / 美食 / 住宿 / 交通 / 非遗 等扩展数据在 data-kb.js。
 * 打开对应功能时按需加载（见 app.js 的 ensureKB）。
 * 拆成两份是为了让首屏只背景点与音频，不背 201 条知识库。 */
