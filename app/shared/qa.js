/* 邮小驿 · 归一化问答引擎（qa.js）
 * ---------------------------------------------------------------
 * 目标：把"盂城驿有啥玩的""盂城驿可以玩什么""盂城驿有啥逛的"
 *      识别为同一个问题，播同一段语音、给同一个答案。
 *
 * 四层流水线：
 *   L1 归一化  全角转半角 / 去标点 / 去语气词 / 同义替换 / 简繁统一
 *   L2 实体    命中景点名或别名 → 锁定 spotId（可多选，取最长匹配）
 *   L3 意图    命中意图词典 + 每条 kb 自带的 intent 字段 → 锁定 intent
 *   L4 打分    score = 意图契合*4 + 实体契合*3 + 关键词重合*2 + 字符召回*1
 *              超过阈值才返回；否则判为未命中，交给第三方兜底
 *
 * 设计约束：零依赖、可在浏览器和 Node 里同时跑（UMD 风格）。
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === "object" && module.exports) module.exports = mod;
  else root.YXYQA = mod;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ============================================================
   * L1 归一化
   * ============================================================ */

  // 语气词 / 口水词：删掉不影响语义
  var FILLERS = /(请问|想问下|想问一下|想问|问一下|问下|麻烦问下|麻烦|帮我|帮忙|帮个忙|能不能|可不可以|可以吗|好吗|行吗|告诉我|说一说|讲一讲|说一下|介绍一下|介绍|了解|知道|呢|啊|呀|吧|嘛|哦|喔|噢|嗯|哎|诶|那个|这个|就是|我想|我要|想去|想看|的话|有没有|有木有|怎么样|咋样)/g;

  // 同义替换：统一到一套说法（顺序敏感，长的先换）
  var SYNONYMS = [
    // 疑问词
    ["有什么好玩", "玩什么"], ["有啥好玩", "玩什么"], ["有什么可玩", "玩什么"],
    ["有什么可以玩", "玩什么"], ["能玩什么", "玩什么"], ["可以玩什么", "玩什么"],
    ["有什么玩的", "玩什么"], ["有啥玩的", "玩什么"], ["有啥玩", "玩什么"],
    ["有什么看", "玩什么"], ["有啥看", "玩什么"], ["有什么可看", "玩什么"],
    ["有什么逛", "玩什么"], ["有啥逛", "玩什么"], ["逛什么", "玩什么"],
    ["有什么", "玩什么"], ["有啥", "玩什么"],
    // 时间
    ["几点钟", "几点"], ["什么时候", "几点"], ["啥时候", "几点"],
    ["多长时间", "多久"], ["多少时间", "多久"], ["要多久", "多久"],
    // 费用
    ["多少钱", "票价"], ["价格", "票价"], ["费用", "票价"], ["花多少钱", "票价"],
    ["要钱吗", "票价"], ["收费吗", "票价"], ["贵不贵", "票价"],
    // 交通
    ["怎么过去", "怎么去"], ["怎样去", "怎么去"], ["如何去", "怎么去"],
    ["咋去", "怎么去"], ["怎么走", "怎么去"], ["咋走", "怎么去"],
    ["怎么到达", "怎么去"], ["到得了", "怎么去"], ["能到", "怎么去"],
    // 地点统称
    ["这个地方", ""], ["这儿", ""], ["那里", ""], ["那边", ""], ["景点", ""],
    // 简繁（少量高频）
    ["驛", "驿"], ["遊", "游"], ["臺", "台"], ["鎮", "镇"], ["國", "国"],
    ["門", "门"], ["館", "馆"], ["郵", "邮"], ["博物館", "博物馆"], ["遺址", "遗址"]
  ];

  // 标点与空白
  var PUNCT = /[\s,，。.!！?？、;；:：'"'"()（）\[\]【】<>《》~～\-—_/\\|·`@#$%^&*+=]+/g;

  function toHalfWidth(s) {
    return s.replace(/[\uFF01-\uFF5E]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    }).replace(/\u3000/g, " ");
  }

  function normalize(raw) {
    if (!raw) return "";
    var s = String(raw);
    s = toHalfWidth(s);
    s = s.toLowerCase();
    for (var i = 0; i < SYNONYMS.length; i++) {
      s = s.split(SYNONYMS[i][0]).join(SYNONYMS[i][1]);
    }
    s = s.replace(PUNCT, "");
    s = s.replace(FILLERS, "");
    s = s.replace(/[的了]+$/g, "");
    s = s.replace(/(.)\1{2,}/g, "$1"); // 「好好好好」→「好」
    return s;
  }

  /* 高邮常见"别名反向"：用户说「西塔」时也可能在问东塔（对比类问题）。
     这类不做自动改写，交给实体权重 + tags 去区分。 */

  /* ============================================================
   * 通用工具
   * ============================================================ */

  // 二元组（中文没空格，用 bigram 做召回）
  function bigrams(s) {
    var out = [], i;
    if (!s) return out;
    if (s.length === 1) return [s];
    for (i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  }

  function overlap(aList, bList) {
    if (!aList.length || !bList.length) return 0;
    var setB = Object.create(null), hit = 0, i;
    for (i = 0; i < bList.length; i++) setB[bList[i]] = 1;
    var seen = Object.create(null);
    for (i = 0; i < aList.length; i++) {
      if (setB[aList[i]] && !seen[aList[i]]) { seen[aList[i]] = 1; hit++; }
    }
    return hit / Math.max(aList.length, 1);
  }

  /* ============================================================
   * 引擎本体
   * ============================================================ */

  function createEngine(D) {
    if (!D) throw new Error("createEngine 需要 data 对象");

    var spots = D.spots || [];
    var kbAll = (D.kb || []).concat(D.kb2 || []).concat(D.kb3 || []);
    var heritage = D.heritage || [];
    var intentLex = D.intentLex || {};

    /* ---- 实体词典：名字 / 别名 → spotId，按长度倒序保证最长匹配 ---- */
    var entityList = [];
    spots.forEach(function (s) {
      var names = [s.name, s.short].concat(s.aliases || []).filter(Boolean);
      names.forEach(function (n, idx) {
        entityList.push({
          id: s.id,
          name: s.name,
          term: normalize(n),
          raw: n,
          // 主名权重高于别名
          w: idx === 0 ? 1.0 : (idx === 1 ? 0.9 : 0.75)
        });
      });
    });
    entityList = entityList.filter(function (e) { return e.term; });
    entityList.sort(function (a, b) { return b.term.length - a.term.length; });

    /* ---- 意图词典：关键词 → intent ---- */
    var intentList = [];
    Object.keys(intentLex).forEach(function (intent) {
      intentLex[intent].forEach(function (w) {
        var t = normalize(w);
        if (t) intentList.push({ intent: intent, term: t });
      });
    });
    intentList.sort(function (a, b) { return b.term.length - a.term.length; });

    /* ---- 归一化后的语料 ---- */
    var corpus = kbAll.map(function (it, i) {
      var nq = (it.q || []).map(normalize);
      var na = normalize(it.a || "");
      var ntags = (it.tags || []).map(normalize);
      return {
        item: it,
        idx: i,
        nq: nq,
        nqAll: nq.join(""),
        na: na,
        ntags: ntags,
        nqBigrams: nq.map(bigrams),
        intent: it.intent || "",
        audio: it.audio === true,
        // 语音键：有 audio 的用 id，方便 audios 表里一一对应
        audioKey: it.audio === true ? ("kb-" + it.id) : null
      };
    });

    /* ---- 归一化缓存 ---- */
    var cache = Object.create(null);
    var CACHE_MAX = 500;

    /* ============================================================
     * 解析：把一句话拆成 {norm, entities[], intents[], words[]}
     * ============================================================ */
    function parse(raw) {
      var norm = normalize(raw);
      if (!norm) return { norm: "", entities: [], intents: [], words: [] };

      var rest = norm;
      var entities = [];
      // 最长优先匹配，匹配到就"挖掉"，避免「高邮湖」被「湖」重复命中
      for (var i = 0; i < entityList.length; i++) {
        var e = entityList[i];
        if (e.term.length < 2) continue;
        var p = rest.indexOf(e.term);
        if (p < 0) continue;
        // 同一 spot 只取一次，保留权重最高（首次即最长/主名）
        var dup = false;
        for (var j = 0; j < entities.length; j++) {
          if (entities[j].id === e.id) { dup = true; break; }
        }
        if (!dup) {
          entities.push({ id: e.id, name: e.name, term: e.term, w: e.w, pos: p });
        }
        rest = rest.slice(0, p) + "\u0000".repeat(e.term.length) + rest.slice(p + e.term.length);
      }
      rest = rest.replace(/\u0000/g, "");
      // 实体位置靠前的优先（"盂城驿怎么去文游台"应以盂城驿为主）
      entities.sort(function (a, b) { return a.pos - b.pos; });

      var intents = [];
      var rest2 = rest;
      for (var k = 0; k < intentList.length; k++) {
        var it = intentList[k];
        if (it.term.length < 2) continue;
        var q = rest2.indexOf(it.term);
        if (q < 0) continue;
        if (intents.indexOf(it.intent) < 0) intents.push(it.intent);
        rest2 = rest2.slice(0, q) + "\u0000".repeat(it.term.length) + rest2.slice(q + it.term.length);
      }
      rest2 = rest2.replace(/\u0000/g, "");

      var words = rest2.split(/[^\u4e00-\u9fa5a-z0-9]+/).filter(function (w) {
        return w.length >= 2;
      });

      return {
        norm: norm,
        entities: entities,
        intents: intents,
        words: words,
        residue: rest2
      };
    }

    /* ============================================================
     * 检索：返回 { hit, score, item, audioKey, debug }
     * ============================================================ */
    function search(raw, opts) {
      opts = opts || {};
      var qNorm = normalize(raw);
      if (!qNorm) return { hit: false, score: 0, reason: "empty" };

      var ck = qNorm + "|" + (opts.spotId || "");
      if (cache[ck]) return cache[ck];

      var p = parse(raw);
      var qBigrams = bigrams(qNorm.replace(/\u0000/g, ""));

      // 当前页面上聚焦的景点（景点详情页里的问答只答本景点）
      var scopeId = opts.spotId || null;
      if (!scopeId && p.entities.length) scopeId = p.entities[0].id;

      var best = null;

      for (var i = 0; i < corpus.length; i++) {
        var c = corpus[i];
        var s = 0;
        var dbg = {};

        /* --- ① 意图契合 --- */
        if (c.intent && p.intents.indexOf(c.intent) >= 0) {
          s += 4;
          dbg.intent = c.intent;
        }

        /* --- ② 实体契合：条目 tags 里是否含当前实体 --- */
        var tg = c.item.tags || [];
        if (scopeId && tg.indexOf(scopeId) >= 0) {
          s += 4;
          dbg.entity = scopeId;
        } else if (scopeId && c.intent && p.intents.indexOf(c.intent) >= 0) {
          // 有实体但这条是通用条目：给一部分分，避免"盂城驿怎么去"答成别的景点通法
          s += 2;
          dbg.entityLoose = scopeId;
        }

        /* --- ②b 整句就是实体名（或实体名占了大半）：这是"这个点是啥"的强信号 --- */
        if (scopeId && p.entities.length && p.residue.length <= 2) {
          if (tg.indexOf(scopeId) >= 0) {
            s += 3;
            dbg.bareEntity = scopeId;
          }
        }

        /* --- ③ 关键词重合（问法 bigram） --- */
        var kw = 0;
        for (var m = 0; m < c.nqBigrams.length; m++) {
          var o = overlap(qBigrams, c.nqBigrams[m]);
          if (o > kw) kw = o;
        }
        s += kw * 2.5;
        dbg.kw = Math.round(kw * 100) / 100;

        /* --- ④ 字符召回（兜底，防止短问法完全打不中） --- */
        var rec = 0;
        if (c.nqAll && qNorm.length >= 2) {
          var hitN = 0;
          for (var b = 0; b < qBigrams.length; b++) {
            if (c.nqAll.indexOf(qBigrams[b]) >= 0) hitN++;
          }
          rec = qBigrams.length ? hitN / qBigrams.length : 0;
        }
        s += rec * 1.2;
        dbg.rec = Math.round(rec * 100) / 100;

        /* --- ⑤ 完整问法直接命中：最高优先级 --- */
        for (var n = 0; n < c.nq.length; n++) {
          if (c.nq[n] && (c.nq[n] === qNorm || qNorm.indexOf(c.nq[n]) >= 0 && c.nq[n].length >= 4)) {
            s += 8;
            dbg.exact = c.nq[n];
            break;
          }
        }

        /* --- ⑥ 剥离实体后的核心问句与本条问法的贴合度 --- */
        // 实体名（盂城驿）在所有相关条目里都会命中，区分不出"问什么"。
        // 真正决定意图的是实体去掉之后剩下的那截（"有啥玩的"/"门票多少钱"）。
        var core = p.residue.replace(/[\s\u0000]/g, "");
        if (core.length >= 2) {
          var cB = bigrams(core);
          var bestCov = 0;
          for (var n3 = 0; n3 < c.nq.length; n3++) {
            var nq = c.nq[n3];
            if (!nq) continue;
            var hitC = 0;
            for (var b3 = 0; b3 < cB.length; b3++) {
              if (nq.indexOf(cB[b3]) >= 0) hitC++;
            }
            var cov = cB.length ? hitC / cB.length : 0;
            if (cov > bestCov) bestCov = cov;
          }
          s += bestCov * 5.0;
          dbg.core = Math.round(bestCov * 100) / 100;
        }

        /* --- ⑦ 整条问法被问句包含（越长越可信） --- */
        var minLen = 99;
        for (var ml = 0; ml < c.nq.length; ml++) {
          var L = c.nq[ml].replace(/\s/g, "").length;
          if (L >= 2 && L < minLen) minLen = L;
        }
        if (minLen < 99) {
          var inQ = false;
          for (var n4 = 0; n4 < c.nq.length; n4++) {
            if (c.nq[n4] && qNorm.indexOf(c.nq[n4]) >= 0) { inQ = true; break; }
          }
          if (inQ) {
            s += 2.5;
            dbg.inQ = 1;
          }
        }

        if (!best || s > best.score) {
          best = { score: s, item: c.item, audioKey: c.audioKey, intent: c.intent, debug: dbg };
        }
      }

      // 非遗条目也进候选（它们是独立小节，不混进 kb）
      // 门槛：必须"点到名"才进候选——非遗条目自带同名词（如「高邮民歌」），
      // 随便一句话都能蹭到字符重合，不设门槛会把普通问句抢走。
      for (var h = 0; h < heritage.length; h++) {
        var hb = heritage[h];
        var hs = 0, hdbg = {};
        var hQ = normalize(hb.q || "");
        var hName = normalize(hb.name || "");
        var hKey = normalize(hb.name + (hb.desc || "") + (hb.q || "") + (hb.a || "").slice(0, 40));
        var touched = false;

        // ① 名字直接出现 —— 最强信号
        if (hName && qNorm.indexOf(hName) >= 0) {
          hs += 12;
          hdbg.hname = hb.name;
          touched = true;
        } else if (hName.length >= 4) {
          // 名字片段命中："鸭蛋腌制技艺" ⊂ "高邮咸鸭蛋的腌制技艺"
          var hNqB = bigrams(hName);
          var hnHit = 0;
          for (var x1 = 0; x1 < hNqB.length; x1++) {
            if (qNorm.indexOf(hNqB[x1]) >= 0) hnHit++;
          }
          if (hNqB.length && hnHit / hNqB.length >= 0.6) {
            hs += 7;
            hdbg.hnamePartial = Math.round(hnHit / hNqB.length * 100);
            touched = true;
          }
        }

        // ② 问法整句命中
        if (hQ && (hQ === qNorm || qNorm.indexOf(hQ) >= 0)) {
          hs += 12;
          hdbg.hexact = hQ;
          touched = true;
        }

        // ③ 用户明确问"非遗"
        if (p.intents.indexOf("heritage") >= 0 && (hb.tags || []).indexOf("heritage") >= 0) {
          hs += 3;
          hdbg.hintent = 1;
          touched = true;
        }

        if (!touched) continue;

        // ④ 覆盖率只做加权，不做准入
        var hrec = 0;
        for (var hq2 = 0; hq2 < qBigrams.length; hq2++) {
          if (hKey.indexOf(qBigrams[hq2]) >= 0) hrec++;
        }
        hrec = qBigrams.length ? hrec / qBigrams.length : 0;
        hs += hrec * 4;
        hdbg.hrec = Math.round(hrec * 100) / 100;

        for (var en = 0; en < p.entities.length; en++) {
          if (hb.tags && hb.tags.indexOf(p.entities[en].id) >= 0) { hs += 2.5; hdbg.hentity = p.entities[en].id; }
        }

        if (hs > (best ? best.score : 0)) {
          best = {
            score: hs,
            item: { id: hb.id, q: [hb.q], a: hb.a, src: hb.src, tags: hb.tags, intent: "heritage" },
            audioKey: "kb-" + hb.id,
            intent: "heritage",
            debug: hdbg
          };
        }
      }

      var THRESHOLD = opts.threshold == null ? 4.0 : opts.threshold;
      var res;
      if (best && best.score >= THRESHOLD) {        res = {
          hit: true,
          score: Math.round(best.score * 100) / 100,
          id: best.item.id,
          a: best.item.a,
          src: best.item.src || "",
          audioKey: best.audioKey,
          intent: best.intent,
          tags: best.item.tags || [],
          question: (best.item.q && best.item.q[0]) || "",
          parsed: p,
          scope: scopeId,
          debug: best.debug
        };
      } else {
        res = {
          hit: false,
          score: best ? Math.round(best.score * 100) / 100 : 0,
          best: best ? { id: best.item.id, a: best.item.a, score: res0(best.score) } : null,
          parsed: p,
          scope: scopeId,
          reason: "below-threshold"
        };
      }
      function res0(v) { return Math.round(v * 100) / 100; }

      if (Object.keys(cache).length > CACHE_MAX) cache = Object.create(null);
      cache[ck] = res;
      return res;
    }

    /* ---- 给 UI 用的建议问法 ---- */
    function suggest(spotId, n) {
      n = n || 4;
      var out = [];
      kbAll.forEach(function (it) {
        if (out.length >= n) return;
        if (spotId && (it.tags || []).indexOf(spotId) >= 0 && (it.q || []).length) {
          out.push(it.q[0]);
        }
      });
      if (out.length < n) {
        kbAll.forEach(function (it) {
          if (out.length >= n) return;
          if (it.intent === "route" || it.intent === "food" || it.intent === "transport") {
            if ((it.q || []).length && out.indexOf(it.q[0]) < 0) out.push(it.q[0]);
          }
        });
      }
      return out.slice(0, n);
    }

    return {
      normalize: normalize,
      parse: parse,
      search: search,
      suggest: suggest,
      stats: function () {
        return {
          spots: spots.length,
          kb: kbAll.length,
          heritage: heritage.length,
          entities: entityList.length,
          intents: Object.keys(intentLex).length
        };
      }
    };
  }

  return { createEngine: createEngine, normalize: normalize };
});
