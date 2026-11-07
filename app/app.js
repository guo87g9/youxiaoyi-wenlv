/* 邮小驿 · 交互逻辑
 * 依赖：data.js（window.YXY）
 * 原则：断网可用（本地知识库 + 随包音频）；管理员解锁后走代理接 DeepSeek 实时联网。
 */
(function () {
  "use strict";

  var D = window.YXY;
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- 本地存储（file:// 下可能抛异常，全部包住） ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- 全局状态 ---------- */
  var state = {
    tab: "home",
    cat: "all",
    spot: D.spots[0],
    got: new Set(),
    preview: new Set(),
    audio: { key: null, playing: false, failed: false }
  };

  /* 代理地址推断（决定手机上能否连到 AI）
   * - http 页面（本地演示，proxy --lan 同源托管）：直接用当前源，
   *   手机访问 http://<电脑IP>:8787 时自动指向同一台机器，无需任何配置
   * - file:// 打开单文件版、或 https 线上站点：回落本机 127.0.0.1:8787
   * - config.js 里显式写了非本机地址时（如部署到内网服务器），尊重它
   * 之前写死 127.0.0.1 的问题：手机上 127.0.0.1 是手机自己，必然连不上。
   */
  function defaultApiBase() {
    var cfg = (window.YXY_CONFIG && YXY_CONFIG.api && YXY_CONFIG.api.base) || "";
    var isLoopback = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(cfg);
    if (cfg && !isLoopback) return cfg.replace(/\/+$/, "");
    if (location.protocol === "http:" && location.host) return location.origin;
    return cfg || "http://127.0.0.1:8787";
  }

  var AI = {
    mode: "demo",           // demo | live
    base: LS.get("yxy.api", "") || defaultApiBase(),
    token: "",
    failStreak: 0,
    busy: false
  };

  /* ================= 通用 ================= */
  function toast(msg, ms) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, ms || 2200);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function switchTab(key) {
    state.tab = key;
    $$(".page").forEach(function (p) { p.classList.remove("active"); });
    var pg = $("pg-" + key);
    if (pg) pg.classList.add("active");
    $$(".tabbar .tab").forEach(function (t) { t.classList.remove("on"); });
    var tb = $("tb-" + key);
    if (tb) tb.classList.add("on");
    if (key !== "guide") AudioCtl.stop(true);
    if (key === "passport") {
      Road.mount();
      // 页面 active 之后容器才有真实尺寸，延一帧再刷
      requestAnimationFrame(function () { Road.refresh(); });
    }
    if (key === "chat") {
      window.scrollTo(0, 0);
      QKB.ensure(function () {
        // 数据到了：引擎重建，示例问题按真实语料刷新
        renderChatIntro(true);
        renderGuide(state.spot);
        setModeUI();
      });
    }
  }

  /* ================= 音频：本地 MP3 单例播放器 ================= */
  var AudioCtl = (function () {
    var a = new Audio();
    a.preload = "none";
    a.setAttribute("playsinline", "");
    a.setAttribute("webkit-playsinline", "");
    var unlocked = false, key = null, timer = null, introDone = false;

    function unlock() {
      if (unlocked) return;
      unlocked = true;
      try {
        var u = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=");
        var p = u.play();
        if (p && p.then) p.then(function () { u.pause(); }).catch(function () {});
      } catch (e) {}
    }

    function ui() {
      var card = $("voiceCard"), btn = $("vbtn"), bar = $("vprog");
      if (!card) return;
      card.classList.toggle("playing", state.audio.playing);
      card.classList.toggle("failed", !!state.audio.failed);
      btn.textContent = state.audio.playing ? "❚❚" : "▶";
      if (!state.audio.playing && bar && !a.duration) bar.style.width = "0%";
    }

    function setMeta(meta, spot) {
      $("vTitle").textContent = meta ? meta.title : (spot.name + " · 讲解");
      $("vSub").textContent = meta
        ? Math.round(meta.dur) + " 秒 · 离线可播 · 合成音，非真人录音"
        : "该点位语音讲解制作中 · 先看下方文字讲解";
    }

    function fail(reason) {
      state.audio.playing = false;
      state.audio.failed = true;
      ui();
      toast("语音没播出来（" + (reason || "未知") + "），已切到文字讲解");
    }

    function play(k) {
      var meta = audioMeta(k);
      if (!meta) { setMeta(null, state.spot); return; }
      unlock();
      if (key === k && state.audio.playing) { a.pause(); state.audio.playing = false; ui(); return; }
      key = k;
      state.audio.failed = false;
      state.audio.playing = true;
      setMeta(meta, state.spot);
      try {
        a.src = meta.src;
        a.load();
        var p = a.play();
        if (p && p.catch) p.catch(function (e) { fail(e && e.name); });
      } catch (e) { fail("play"); }
      ui();
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (state.audio.playing && a.currentTime === 0) fail("timeout");
      }, 8000);
    }

    function stop(reset) {
      try { a.pause(); if (reset) a.currentTime = 0; } catch (e) {}
      state.audio.playing = false;
      ui();
    }

    a.addEventListener("playing", function () {
      clearTimeout(timer);
      state.audio.playing = true;
      state.audio.failed = false;
      ui();
    });
    a.addEventListener("timeupdate", function () {
      if (a.duration) $("vprog").style.width = (a.currentTime / a.duration * 100).toFixed(1) + "%";
    });
    a.addEventListener("ended", function () {
      state.audio.playing = false;
      $("vprog").style.width = "100%";
      ui();
      if (key === "intro" && !introDone) {
        introDone = true;
        var line = $("introLine");
        if (line) { line.classList.remove("playing"); line.querySelector(".play").textContent = "▶"; }
        setTimeout(function () {
          switchTab("home");
          state.cat = "hist"; renderFilter(); renderSpots();
          var grid = $("spotFilter");
          if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
          toast("听完导语，挑一处进去");
        }, 500);
      }
    });
    a.addEventListener("error", function () { fail("decode"); });

    return {
      play: play, stop: stop, unlock: unlock,
      get key() { return key; }
    };
  })();

  /* ================= 首页：景点列表 ================= */
  function renderFilter() {
    $("spotFilter").innerHTML = D.cats.map(function (c) {
      return '<button data-cat="' + c.k + '"' + (state.cat === c.k ? ' class="on"' : "") + ">" +
        esc(c.t) + (c.k === "all" ? " " + D.spots.length : "") + "</button>";
    }).join("");
  }

  function renderSpots() {
    var list = D.spots.filter(function (s) { return state.cat === "all" || s.cat === state.cat; });
    $("spotGrid").innerHTML = list.map(function (s) {
      var cat = D.cats.filter(function (c) { return c.k === s.cat; })[0];
      return '<article class="spot" data-spot="' + s.id + '">' +
        '<div class="pic"><img loading="lazy" src="' + s.thumb + '" alt="' + esc(s.name) + '">' +
        '<span class="cat ' + s.cat + '">' + esc(cat ? cat.t : "") + "</span>" +
        ((audioMeta(audioKeyOf(s))) ? '<span class="badge-audio">🎧</span>' : "") + "</div>" +
        '<div class="info"><h4>' + esc(s.name) + "</h4><p>" + esc(s.desc) + "</p></div></article>";
    }).join("");
    $("spotCount").textContent = list.length + " 处点位";
  }

  /* ================= 讲解页 ================= */
  function renderGuide(spot) {
    state.spot = spot;
    $("gThumb").src = spot.thumb;
    $("gThumb").alt = spot.name;
    $("gName").textContent = spot.name;
    $("gDesc").textContent = spot.desc;

    var meta = metaOf(spot);
    if (meta) {
      $("vTitle").textContent = meta.title || (spot.name + " · 讲解");
      $("vSub").textContent = Math.round(meta.dur) + " 秒 · 离线可播";
      var src = $("vSrc");
      if (src) {
        src.textContent = meta.kind === "official" ? "景区授权录音" : "AI 合成讲解（小史）";
        src.className = "vsrc " + (meta.kind === "official" ? "official" : "ai");
      }
      $("voiceCard").style.opacity = "1";
    } else {
      $("vTitle").textContent = spot.name + " · 语音制作中";
      $("vSub").textContent = "该点位暂无录音 · 先看下方文字讲解";
      var src2 = $("vSrc");
      if (src2) { src2.textContent = ""; src2.className = "vsrc"; }
      $("voiceCard").style.opacity = ".72";
    }
    state.audio.playing = false;
    state.audio.failed = false;
    $("vprog").style.width = "0%";
    $("voiceCard").classList.remove("playing", "failed");
    $("vbtn").textContent = meta ? "▶" : "·";
    AudioCtl.stop(true);

    $("gIntro").innerHTML = '<p>' + esc(spot.intro) + "</p>" +
      '<div class="src">讲解词来源：' + esc(spot.introSrc) + "</div>" +
      '<div class="src">开放 ' + esc(spot.hours) + " · 门票 " + esc(spot.ticket) + "</div>";

    renderSuggests(spot);
    renderPark(spot);
  }

  function renderSuggests(spot) {
    var sug = suggestFor(spot || state.spot);
    $("gSuggests").innerHTML = sug.map(function (q) {
      return '<button data-ask="' + esc(q) + '">' + esc(q) + "</button>";
    }).join("");
  }

  var SUG_DEFAULT = ["这里要门票吗？", "附近有什么吃的？", "应该留多长时间？"];

  // 旧 30 条（k1–k30）的 q 是"关键词组"（["驿站","盂城驿","干什么"]），
  // 不能直接当问题展示——会出现"驿站""一封公文"这种按钮。这里挑能独立成句的。
  function looksLikeQuestion(s) {
    if (!s || s.length < 4) return false;
    return /[？?]$/.test(s) || /怎么|多少|什么|哪|吗|几点|多久|能不能|要不要|值不值/.test(s);
  }

  function suggestFor(spot) {
    // 扩展语料还没加载时先用固定三问占位，加载完 renderGuide 会重绘成真实高频问
    if (!D.kb) return SUG_DEFAULT.slice();

    // 三段语料都要翻：kb 是旧的关键词组，kb2/kb3 才是带景点标签的完整问法
    var all = (D.kb || []).concat(D.kb2 || [], D.kb3 || []);
    var pool = all.filter(function (k) {
      return k.tags && k.tags.indexOf(spot.id) >= 0;
    });
    var out = [];
    pool.forEach(function (k) {
      if (out.length >= 3) return;
      var qs = k.q || [];
      for (var i = 0; i < qs.length; i++) {
        if (looksLikeQuestion(qs[i]) && out.indexOf(qs[i]) < 0) { out.push(qs[i]); break; }
      }
    });
    SUG_DEFAULT.forEach(function (q) {
      if (out.length < 3 && out.indexOf(q) < 0) out.push(q);
    });
    return out.slice(0, 3);
  }

  /* ================= 路线规则引擎 ================= */
  function genRoute() {
    var idx = parseInt($("selHours").value, 10) || 0;
    var style = $("selStyle").value;
    var r = D.routes[idx] || D.routes[1];
    var stops = r.stops.slice();

    if (style !== "all") {
      var prefer = stops.filter(function (s) {
        var sp = byId(s.spotId);
        return sp && sp.tags.indexOf(style) >= 0;
      });
      if (prefer.length >= 2) {
        var rest = stops.filter(function (s) { return prefer.indexOf(s) < 0; });
        stops = prefer.concat(rest);
      }
    }

    var html = '<div class="route"><h4>' + esc(r.title) + "</h4>" +
      '<div class="rmeta">' + esc(r.intro) + " · 共 " + r.hours + " 小时 / " + stops.length + " 站</div>" +
      '<div class="timeline">' + stops.map(function (s) {
        var sp = byId(s.spotId) || { name: s.spotId };
        var peak = (sp.heat || 0) >= 70 ? '<span class="peak">热度高·建议错峰</span>' : "";
        return '<div class="stop"><h5>' + esc(sp.name) + peak + "</h5>" +
          "<p>" + esc(s.tip || sp.desc || "") + "</p>" +
          '<div class="time">' + esc(s.time) + " · 建议停留 " + esc(s.dur) + "</div></div>";
      }).join("") + "</div></div>";

    $("routeBox").innerHTML = html;
  }

  function audioKeyOf(spot) { return spot.audio || ("spot-" + spot.id); }
  function metaOf(spot) { return audioMeta(audioKeyOf(spot)); }

  /* ================= 到达与停车（原型） =================
   * 只做三件能兑现的事：给出点位入口坐标、一键跳第三方地图导航、
   * 一键跳第三方地图搜周边停车场。
   * 车位空位数据没有接入，所以页面任何一个字都不说"实时车位"。
   * 坐标是 WGS84（GPS/OSM 口径），高德/腾讯用 GCJ-02，
   * 不换算会偏 300~500 米，直接把车导到河里去。
   * ====================================================== */
  function outOfChina(lat, lng) {
    return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
  }
  function transformLat(x, y) {
    var r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    r += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
    r += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
    return r;
  }
  function transformLng(x, y) {
    var r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    r += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    r += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
    r += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
    return r;
  }
  function wgs2gcj(lat, lng) {
    if (outOfChina(lat, lng)) return { lat: lat, lng: lng };
    var a = 6378245.0, ee = 0.00669342162296594323;
    var dLat = transformLat(lng - 105.0, lat - 35.0);
    var dLng = transformLng(lng - 105.0, lat - 35.0);
    var radLat = lat / 180.0 * Math.PI;
    var magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    var sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
    return { lat: lat + dLat, lng: lng + dLng };
  }

  function parkLinks(spot) {
    var g = spot.geo ? wgs2gcj(spot.geo.lat, spot.geo.lng) : null;
    if (!g) return null;
    var nm = encodeURIComponent(spot.name);
    var lng = g.lng.toFixed(6), lat = g.lat.toFixed(6);
    return {
      lat: lat, lng: lng,
      nav: "https://uri.amap.com/navigation?to=" + lng + "," + lat + "," + nm +
        "&mode=car&coordinate=gaode&callnative=1&src=yxy&name=" + nm,
      park: "https://uri.amap.com/search?keyword=" + encodeURIComponent("停车场") +
        "&center=" + lng + "," + lat + "&radius=1500&callnative=1&src=yxy",
      coord: spot.geo.lat.toFixed(5) + ", " + spot.geo.lng.toFixed(5)
    };
  }

  function renderPark(spot) {
    var box = $("gPark");
    if (!box) return;
    var L = parkLinks(spot);
    if (!L) { box.innerHTML = ""; return; }
    box.innerHTML =
      '<div class="park-h"><b>到达与停车</b><span class="park-tag">原型 · 车位数据未接入</span></div>' +
      '<div class="park-grid">' +
      '<a class="park-btn" href="' + L.nav + '" target="_blank" rel="noopener">导航到门口</a>' +
      '<a class="park-btn" href="' + L.park + '" target="_blank" rel="noopener">搜周边停车场</a>' +
      '<button class="park-btn ghost2" data-coord="' + L.coord + '">复制坐标</button>' +
      "</div>" +
      '<div class="park-note">入口坐标 ' + L.coord + "（WGS84，链接里已换算成高德坐标系）。" +
      "周边停车场由高德地图实时检索，本页不保存、也不宣称空位；断网时请用上面的坐标在手机地图里搜。" +
      "自驾提示：老城街区路窄、停车位有限，节假日建议停外围步行进入。</div>";
  }

  /* ================= 诉求受理（原型） =================
   * 以前只回一句"已记录"，其实什么都没留下。
   * 现在真的落一条记录：单号 + 时间 + 原文 + 后续补充，
   * 存 localStorage（不采集位置、不上传），可复制、可导出 txt。
   * 仍然要说清楚：这是原型，不会真的转派工单。
   * ================================================= */
  var TK = (function () {
    var KEY = "yxy.tickets";
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function all() {
      try { return JSON.parse(LS.get(KEY, "[]")) || []; } catch (e) { return []; }
    }
    function save(list) {
      // 只留最近 20 条，避免 localStorage 越写越大
      LS.set(KEY, JSON.stringify(list.slice(-20)));
    }
    function newId(list) {
      var d = new Date();
      var day = "" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
      var seq = 1;
      list.forEach(function (t) {
        if (t.id && t.id.indexOf("YXY-" + day) === 0) seq++;
      });
      return "YXY-" + day + "-" + pad(seq);
    }
    function add(text) {
      var list = all();
      var d = new Date();
      var t = {
        id: newId(list),
        at: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
          " " + pad(d.getHours()) + ":" + pad(d.getMinutes()),
        text: String(text || "").slice(0, 300),
        extra: []
      };
      list.push(t);
      save(list);
      return t;
    }
    function recent(min) {
      var list = all();
      if (!list.length) return null;
      var t = list[list.length - 1];
      if (!t.at) return null;
      var ts = new Date(t.at.replace(/-/g, "/")).getTime();
      if (!ts) return null;
      if (new Date().getTime() - ts > (min || 30) * 60000) return null;
      return t;
    }
    function append(t, text) {
      var list = all();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === t.id) {
          list[i].extra = list[i].extra || [];
          list[i].extra.push(String(text || "").slice(0, 300));
          save(list);
          return list[i];
        }
      }
      return t;
    }
    function text(t) {
      var s = "邮小驿 · 游客诉求单\n";
      s += "单号：" + t.id + "\n";
      s += "受理时间：" + t.at + "\n";
      s += "诉求内容：" + t.text + "\n";
      (t.extra || []).forEach(function (x, i) { s += "补充 " + (i + 1) + "：" + x + "\n"; });
      s += "\n说明：本单由邮小驿（演示原型）生成，仅保存在本机浏览器，未上传服务器，也未自动转派。\n";
      s += "紧急情况请拨 12345 或直接联系景区服务台。\n";
      return s;
    }
    return { all: all, add: add, recent: recent, append: append, text: text };
  })();

  function downloadText(name, content) {
    try {
      var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        URL.revokeObjectURL(a.href);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 400);
      return true;
    } catch (e) { return false; }
  }

  function copyText(s) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(s).then(function () { toast("已复制"); }, function () { toast("复制失败，请长按文字"); });
    } else {
      toast("当前环境不支持自动复制，请长按文字");
    }
  }

  function byId(id) {
    for (var i = 0; i < D.spots.length; i++) if (D.spots[i].id === id) return D.spots[i];
    return null;
  }

  /* ================= 护照 · 真实打卡 v2 =================
   * 旧版：点一下就算打卡，还能反复开关，等于没验证。
   * 新版：
   *   1) 点击 → 申请定位（navigator.geolocation，高精度）
   *   2) haversine 算到景点的真实距离
   *   3) 半径内（默认 300m）才盖章；超出给出真实距离与"游客模式"选项
   *   4) 已盖的戳不可取消（真实打卡没有"撤销"）
   *   5) 游客模式：明确标注为预览，不计入集章进度，仅本地存，用于演示/无网
   * ============================================================ */
  var GEO = {
    radius: 300,
    timeout: 8000,
    // 最近一次定位结果，避免短时间内重复申请权限
    last: null,
    lastAt: 0
  };

  var STAMP_TP = {
    apply: "正在申请定位…",
    deny: "定位权限被拒绝",
    timeout: "定位超时（室内常见）",
    unsupported: "此环境不支持定位",
    far: "距离太远"
  };

  function loadGot() {
    var raw = LS.get("yxy.got", "");
    state.got = new Set(raw ? raw.split(",").filter(Boolean) : []);
    var praw = LS.get("yxy.preview", "");
    state.preview = new Set(praw ? praw.split(",").filter(Boolean) : []);
  }
  function saveGot() {
    LS.set("yxy.got", Array.from(state.got).join(","));
    LS.set("yxy.preview", Array.from(state.preview || []).join(","));
  }

  // haversine，单位米
  function distanceM(lat1, lng1, lat2, lng2) {
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function fmtDist(m) {
    if (m < 1000) return Math.round(m) + " 米";
    return (m / 1000).toFixed(1) + " 公里";
  }

  // 统一封装定位，带缓存（60 秒内复用）
  function getPosition(force) {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) return reject(new Error("unsupported"));
      var now = Date.now();
      if (!force && GEO.last && now - GEO.lastAt < 60000) return resolve(GEO.last);
      navigator.geolocation.getCurrentPosition(function (pos) {
        var p = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy || 0 };
        GEO.last = p; GEO.lastAt = Date.now();
        resolve(p);
      }, function (err) {
        var code = err && err.code === 1 ? "deny" : (err && err.code === 3 ? "timeout" : "timeout");
        reject(new Error(code));
      }, { enableHighAccuracy: true, timeout: GEO.timeout, maximumAge: 30000 });
    });
  }

  function renderStamps() {
    $("stampGrid").innerHTML = D.spots.map(function (s) {
      var got = state.got.has(s.id);
      var prev = state.preview && state.preview.has(s.id);
      var cls = "stamp" + (got ? " got" : "") + (prev && !got ? " preview" : "");
      var tip = got ? "已打卡" : (prev ? "游客模式预览（不计入进度）" : "点击打卡 · 需到现场");
      return '<button class="' + cls + '" data-stamp="' + s.id + '" title="' + tip + '">' +
        '<div class="s-ico"><img loading="lazy" src="' + s.stampImg + '" alt=""></div>' +
        "<span>" + esc(s.short) + "</span></button>";
    }).join("");
    var n = state.got.size, t = D.spots.length;
    $("progNum").textContent = "已集 " + n + " / " + t + " 站";
    $("progBar").style.width = (n / t * 100).toFixed(1) + "%";
    var pv = state.preview ? state.preview.size : 0;
    var tipEl = $("roadTip");
    if (tipEl) {
      tipEl.textContent = pv
        ? "其中 " + pv + " 枚为游客模式预览，不计入进度"
        : "点亮已打卡的邮戳 · 点击下方邮戳册打卡";
    }
  }

  // 打卡主流程
  function tryStamp(id) {
    var s = byId(id);
    if (!s) return;

    if (state.got.has(id)) {
      toast(s.short + " 已盖戳 · 到场打卡不可撤销");
      return;
    }
    if (!s.geo) {
      toast("这个点位还缺坐标，暂不能打卡");
      return;
    }

    toast(STAMP_TP.apply);
    getPosition().then(function (pos) {
      var d = distanceM(pos.lat, pos.lng, s.geo.lat, s.geo.lng);
      var radius = (window.YXY_CONFIG && YXY_CONFIG.geo && YXY_CONFIG.geo.radius) || GEO.radius;
      // 定位精度差时把半径放宽一点，避免明明在现场却打不上
      var eff = radius + Math.min(pos.acc || 0, 150);

      if (d <= eff) {
        state.got.add(id);
        if (state.preview) state.preview.delete(id);
        saveGot();
        renderStamps();
        Road.refresh();
        var n = state.got.size;
        toast("盖戳成功 · " + s.short + "（距目标 " + fmtDist(d) + "）" +
          (n === D.spots.length ? "｜集齐 " + n + " 站，可到服务台兑换通关礼" : "（" + n + "/17）"), 2800);
      } else {
        askFarStamp(s, d, pos);
      }
    }).catch(function (e) {
      var code = (e && e.message) || "timeout";
      offerPreview(s, code);
    });
  }

  // 距离不够：给出真实距离 + 游客模式
  function askFarStamp(s, d, pos) {
    var NL = String.fromCharCode(10);
    var acc = pos && pos.acc ? "（定位精度 ±" + Math.round(pos.acc) + " 米）" : "";
    var ok = window.confirm(
      "还没到 " + s.name + NL +
      "你当前位置距目标约 " + fmtDist(d) + acc + NL +
      "打卡需要在现场 " + (((window.YXY_CONFIG && YXY_CONFIG.geo && YXY_CONFIG.geo.radius) || GEO.radius)) + " 米范围内。" + NL + NL +
      "要以「游客模式」预览这一站的邮戳吗？" + NL +
      "（预览只改变显示，不计入集章进度，可随时在下方清除）"
    );
    if (ok) applyPreview(s);
  }

  // 定位失败：解释原因 + 游客模式
  function offerPreview(s, code) {
    var reason = STAMP_TP[code] || STAMP_TP.timeout;
    var hint = code === "deny"
      ? "浏览器拦下了定位请求。可以点地址栏左侧的锁图标，把「位置」改为允许后重试。"
      : "室内、地下车库容易定位失败，走到窗边或室外再试一次。";
    var ok = window.confirm(
      s.name + " · 打卡需要定位" + String.fromCharCode(10) + String.fromCharCode(10) +
      "原因：" + reason + String.fromCharCode(10) + hint + String.fromCharCode(10) + String.fromCharCode(10) +
      "要以「游客模式」预览这一站的邮戳吗？" + String.fromCharCode(10) +
      "（预览只改变显示，不计入集章进度）"
    );
    if (ok) applyPreview(s);
  }

  function applyPreview(s) {
    if (!state.preview) state.preview = new Set();
    state.preview.add(s.id);
    saveGot();
    renderStamps();
    Road.refresh();
    toast("游客模式 · " + s.short + " 邮戳已预览（不计入进度）", 2600);
  }

  // 清空游客模式预览
  function clearPreview() {
    if (!state.preview || !state.preview.size) { toast("没有需要清除的预览"); return; }
    var n = state.preview.size;
    state.preview.clear();
    saveGot();
    renderStamps();
    Road.refresh();
    toast("已清除 " + n + " 枚预览邮戳");
  }

  /* ================= 运河邮路 · 真实地图 =================
   * 旧版是 canvas 手绘的"假地图"：座标按 index 算、正弦蛇形排布，
   * 跟高邮的实际地理毫无关系，也跟"已点亮 11/17"的计数对不上。
   * 新版接 shared/map.js：天地图 Web Mercator 瓦片 + 自绘节点，
   * 景点按真实经纬度落位；无 key / 断网时自动降级为示意地图，入口不失效。
   * ============================================================ */
  var Road = (function () {
    var map = null, mounted = false;

    function mount() {
      var host = $("road");
      if (!host || mounted) return;
      if (typeof YXYMap === "undefined") { toast("地图组件未加载"); return; }
      mounted = true;

      map = YXYMap.create(host, {
        spots: D.spots,
        got: state.got,
        preview: state.preview,
        onSpot: function (id) {
          var s = byId(id);
          if (!s) return;
          renderGuide(s);
          switchTab("guide");
        }
      });
    }

    function refresh() {
      if (!map) return;
      map.setGot(state.got);
      map.setPreview(state.preview);
    }

    return {
      mount: mount,
      refresh: refresh,
      focus: function (id) { if (map) map.focus(id); },
      debug: function () { return map; },
      instance: function () { return map; }
    };
  })();

  /* 调试出口（现场排查地图问题用，不影响功能） */
  window.__yxRoad = Road;

  /* ================= 本地知识库检索 ================= */
  /* ---- 归一化检索：委托给 shared/qa.js ---- */
  // 旧的 indexOf 打分已废弃。新引擎做四层归一化，把同义问法合并，
  // 详见 app/shared/qa.js 顶部注释；评测见 tools/qa_eval.mjs。
  /* 音频查表：audios（原有 61 条） + audios2（新增语音，增量注册）
   * 两张表分开存，是为了守住"不修改原有 30 条语音"这条约束：
   * 老表一字不动，新条目只追加到 audios2。 */
  function audioMeta(key) {
    if (!key) return null;
    if (D.audios && D.audios[key]) return D.audios[key];
    if (D.audios2 && D.audios2[key]) return D.audios2[key];
    return null;
  }

  /* ================= 扩展数据按需加载（data-kb.js） =================
   * data.js 只留首屏必需的 11 个键（景点/音频/路线/商户）。
   * 问答、非遗、美食、住宿、交通这 8 个键单独放 data-kb.js，
   * 打开问答页 / 吃住行非遗入口时再插 <script> 拉进来，file:// 下同样有效。
   * 目的：首屏 JS 从 137 KB 压到 44 KB，弱网下第一屏更快出。
   * ============================================================== */
  var QKB = (function () {
    var ready = !!(D.kb && D.kb.length);
    var loading = null, cbs = [];
    function fire() {
      var list = cbs; cbs = [];
      list.forEach(function (f) { try { f(); } catch (e) {} });
    }
    function ensure(cb) {
      if (ready) { cb && cb(); return; }
      if (cb) cbs.push(cb);
      if (loading) return;
      var s = document.createElement("script");
      s.src = "data-kb.js";
      s.async = true;
      s.onload = s.onerror = function () {
        var kb = window.YXY_KB;
        if (kb && window.YXY) {
          for (var k in kb) {
            if (Object.prototype.hasOwnProperty.call(kb, k)) window.YXY[k] = kb[k];
          }
        }
        ready = !!(D.kb && D.kb.length);
        loading = null;
        ENGINE = null;      // 语料变了，重建检索引擎
        fire();
      };
      loading = s;
      document.head.appendChild(s);
    }
    return { ensure: ensure, isReady: function () { return ready || !!(window.YXY && window.YXY.kb); } };
  })();

  /* 首屏就开拉问答数据：
   * 只影响开屏后 1~2 帧的带宽，用户在首页浏览的十几秒里早就收完了。
   * 这样切到问答页/打开吃住行时 data-kb.js 基本已就绪，
   * 不会出现"引擎先按旧语料建好、音频键查不到"的时序问题。
   * 加载失败也不阻塞：ensure 里的 onerror 同样会触发回调。 */
  (function () {
    var kick = function () { QKB.ensure(); };
    if (document.readyState === "complete") setTimeout(kick, 60);
    else window.addEventListener("load", function () { setTimeout(kick, 60); });
  })();

  var ENGINE = null;
  // 对外口径 201 = 30 + 120 + 51，只算问答语料；非遗 5 项单独计，不能混进来充数
  function kbTotal() {
    return (D.kb ? D.kb.length : 0) + (D.kb2 ? D.kb2.length : 0) +
           (D.kb3 ? D.kb3.length : 0);
  }

  var INTENT_ZH = {
    transport: "交通", ticket: "门票", hours: "开放时间", duration: "游览时长",
    route: "行程规划", food: "吃", stay: "住宿", photo: "拍照",
    play: "玩什么", history: "历史", red: "红色研学", shop: "买什么",
    howto: "使用帮助", help: "求助", weather: "天气季节", heritage: "非遗"
  };
  function intentLabel(k) { return INTENT_ZH[k] || k; }

  function corpusVersion() {
    // 语料指纹：只要 kb 条数变了（data-kb.js 刚到 / 热更新），引擎就必须重建。
    // 光靠 QKB 回调里手动置 null 不够——回调可能在引擎已经建好之后才触发。
    return (D.kb ? D.kb.length : 0) + "/" + (D.kb2 ? D.kb2.length : 0) + "/" +
           (D.kb3 ? D.kb3.length : 0) + "/" + (D.heritage ? D.heritage.length : 0);
  }

  function getEngine() {
    var ver = corpusVersion();
    if (ENGINE && ENGINE.__ver === ver) return ENGINE;
    if (typeof YXYQA === "undefined") return null;
    if (!QKB.isReady()) return null;   // 扩展语料还没到，先别建引擎（否则少 200 条）
    ENGINE = YXYQA.createEngine(D);
    ENGINE.__ver = ver;
    return ENGINE;
  }

  // 返回 { a, src, id, kind, audioKey } 或 null
  function searchKB(q, spot) {
    var eng = getEngine();
    if (!eng) return null;

    // 景点详情页：限定只答本景点（用户要求"每个景点内嵌问答只答该景点"）
    var scope = spot ? spot.id : null;
    var r = eng.search(q, { spotId: scope });

    if (r.hit) {
      return {
        a: r.a,
        src: r.src || "本地知识库",
        id: r.id,
        kind: r.id && r.id.charAt(0) === "h" ? "heritage" : "kb",
        audioKey: r.audioKey,
        score: r.score,
        intent: r.intent
      };
    }

    // 未命中时再看旧 faqs（这 12 条是首页固定的高频问答，保留作为兜底）
    var qn = eng.normalize(q);
    var bestF = null, bestS = 0;
    D.faqs.forEach(function (f) {
      var fq = eng.normalize(f.q);
      var score = 0;
      if (fq === qn) score = 12;
      else if (qn.indexOf(fq) >= 0 || fq.indexOf(qn) >= 0) score = 5;
      if (score > bestS) { bestS = score; bestF = f; }
    });
    if (bestF) {
      return {
        a: bestF.a, src: bestF.src || "常见问题", id: bestF.id,
        kind: "faq", audioKey: "faq-" + bestF.id
      };
    }
    return null;
  }

  /* ================= 问答 ================= */
  function bubble(role, text, opts) {
    opts = opts || {};
    var wrap = document.createElement("div");
    wrap.className = "msg " + role;
    var b = document.createElement("div");
    b.className = "bub";
    var tn = document.createTextNode("");
    b.appendChild(tn);
    wrap.appendChild(b);
    $("chat").appendChild(wrap);
    if (text) tn.data = text;
    scrollChat();
    return { wrap: wrap, bub: b, tn: tn, opts: opts };
  }

  function scrollChat() {
    var c = $("chat");
    c.scrollTop = c.scrollHeight;
  }

  var typer = null;      // 当前打字机的 interval id
  var typerNode = null;  // 对应的气泡节点（setInterval 返回数字，不能挂属性）
  var typerText = "";
  function aiSay(text, opts) {
    opts = opts || {};
    // 上一条还在打字就来了新的：先把上一条一次性写完并补上元信息，
    // 否则 clearInterval 会让那条永远缺"来源 + 朗读"——长回答里特别明显。
    if (typer) {
      clearInterval(typer);
      typer = null;
      if (typerNode) {
        typerNode.tn.data = typerText;
        if (!typerNode.done) { typerNode.done = true; renderMeta(typerNode, typerNode.opts); }
      }
    }
    var node = bubble("ai", "", opts);
    var i = 0;
    typerNode = node;
    typerText = text;
    typer = setInterval(function () {
      i += 2;
      node.tn.data = text.slice(0, i);
      scrollChat();
      if (i > text.length) {
        clearInterval(typer);
        typer = null;
        if (!node.done) { node.done = true; renderMeta(node, opts); }
      }
    }, 16);
  }

  function renderMeta(node, opts) {
    if (opts.src) {
      var d = document.createElement("div");
      d.className = "src";
      d.textContent = "来源：" + opts.src;
      node.bub.appendChild(d);
    }
    if (opts.links && opts.links.length) {
      var box = document.createElement("div");
      box.className = "src";
      opts.links.forEach(function (l) {
        var a = document.createElement("a");
        a.href = l.u; a.target = "_blank"; a.rel = "noopener";
        a.textContent = "· " + l.t;
        box.appendChild(a);
      });
      node.bub.appendChild(box);
    }
    if (opts.audioKey && audioMeta(opts.audioKey)) {
      var sb = document.createElement("button");
      sb.className = "speak";
      sb.type = "button";
      sb.textContent = "🔊 朗读";
      sb.onclick = function (ev) { ev.stopPropagation(); AudioCtl.play(opts.audioKey); };
      node.bub.appendChild(sb);
    }
    if (opts.actions && opts.actions.length) {
      var ab = document.createElement("div");
      ab.className = "acts";
      opts.actions.forEach(function (a) {
        var bt = document.createElement("button");
        bt.type = "button";
        bt.className = "act";
        bt.textContent = a.t;
        bt.onclick = function (ev) { ev.stopPropagation(); a.fn(); };
        ab.appendChild(bt);
      });
      node.bub.appendChild(ab);
    }
    if (opts.mode) {
      var t = document.createElement("div");
      t.className = "tip";
      t.textContent = opts.mode;
      node.bub.appendChild(t);
    }
    scrollChat();
  }

  function pushUser(text) {
    bubble("user", text);
  }

  function showTickets() {
    var list = TK.all();
    if (!list.length) {
      aiSay("本机还没有诉求记录。直接说「我要投诉……」就能开单。", { mode: "本机留档为空" });
      return;
    }
    var NL = String.fromCharCode(10);
    var out = "本机共 " + list.length + " 张诉求单（只存这台设备）：" + NL;
    list.slice(-5).reverse().forEach(function (t) {
      out += NL + t.id + " · " + t.at + NL + "· " + t.text.slice(0, 40) +
        (t.extra && t.extra.length ? NL + "· 另有 " + t.extra.length + " 条补充" : "") ;
    });
    aiSay(out, {
      src: "诉求受理 · 本机留档",
      mode: "原型能力 · 不联网 ·不上传",
      actions: [{
        t: "导出全部",
        fn: function () {
          var all = TK.all().map(TK.text).join(NL + "----------" + NL);
          toast(downloadText("邮小驿-诉求单汇总.txt", all) ? "已导出" : "导出失败");
        }
      }]
    });
  }

  function ask(q) {
    q = String(q || "").trim();
    if (!q) return;
    if (q.length > 120) q = q.slice(0, 120);
    var spotQ = /这|这里|此处/.test(q) ? state.spot : null;
    pushUser(q);
    $("chatInput").value = "";

    if (/投诉|丢|求助|表扬|建议|退货|宰客|乱收费/.test(q)) {
      var NL = String.fromCharCode(10);
      var t = TK.add(q);
      aiSay(
        "已受理，诉求单号 " + t.id + "（" + t.at + "）。" + NL +
        "这条已经在本机留档，可以复制单号、导出文本，或继续补充情况。" + NL +
        "想让我记全，补三件事就行：" + NL +
        "1）时间（大概几点）" + NL +
        "2）地点（哪个点位或店铺）" + NL +
        "3）具体发生了什么" + NL +
        "紧急情况请直接拨打 12345，或找景区服务台。" + NL +
        "说明：这是演示原型，记录只存在本机浏览器，不会自动转派工单。",
        {
          src: "诉求受理 · 本机留档（不联网）",
          mode: "原型能力 · 单号 " + t.id,
          actions: [
            { t: "复制单号", fn: function () { copyText(t.id); } },
            { t: "导出诉求单", fn: function () {
              var ok = downloadText("诉求单-" + t.id + ".txt", TK.text(t));
              toast(ok ? "已导出 txt" : "导出失败，请复制下方文字");
            } },
            { t: "看全部记录", fn: function () { showTickets(); } }
          ]
        }
      );
      return;
    }

    // 刚提过诉求又接着说细节：并到同一张单里，不要每句都开新单
    var openT = TK.recent(30);
    if (openT && q.length >= 6) {
      TK.append(openT, q);
      aiSay("已补进诉求单 " + openT.id + "。三件事齐了（时间 / 地点 / 经过）我就能整理成一段可转派的描述。",
        { src: "诉求受理 · 本机留档", mode: "补充第 " + (openT.extra ? openT.extra.length : 1) + " 条" });
      return;
    }

    var hit = searchKB(q, spotQ);
    if (hit) {
      aiSay(hit.a, {
        src: hit.src || "本地知识库",
        mode: "本地知识库命中 · 未联网" + (hit.intent ? " · " + intentLabel(hit.intent) : ""),
        audioKey: hit.audioKey
      });
      return;
    }

    // 首次提问时扩展语料可能还在路上：先给"正在查"，加载完再自动重放这一问，
    // 避免用户第一次问就吃到"未收录"的错答案。
    if (!QKB.isReady()) {
      aiSay("正在翻开本地知识库…", { mode: "加载问答数据" });
      QKB.ensure(function () { ask(q); });
      return;
    }

    if (AI.mode === "demo") {
      aiSay(
        "（演示模式）本地知识库里有 " + kbTotal() + " 条高邮文旅知识，这条还没收录。\n" +
        "可以换个说法，或者由管理员开启「实时联网」——开启后我会检索公开资料再回答，并附上来源。",
        { mode: "本地知识库 · 未命中" }
      );
      return;
    }

    if (AI.busy) { toast("上一条还在写，稍等一下"); return; }
    AI.busy = true;
    var node = bubble("ai", "正在检索公开资料…", {});
    var buf = "";
    var started = false;

    fetchWithTimeout(AI.base + "/ask", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": AI.token },
      body: JSON.stringify({ q: q, spot: spotQ ? spotQ.name : "", persona: D.narrator.name })
    }, 12000).then(function (r) {
      if (!r.ok) throw new Error("http_" + r.status);
      var srcs = [];
      try { srcs = JSON.parse(decodeURIComponent(r.headers.get("x-src") || "[]")); } catch (e) {}
      node.opts.links = srcs.slice(0, 3).map(function (x) { return { t: x.t, u: x.u }; });

      var reader = r.body.getReader();
      var dec = new TextDecoder();
      var acc = "";
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) {
            // 注意：这里判断的必须是已累积的正文 buf，不是解析残留 acc。
            // 流末尾的 "\n\n" 会让 acc 变成空串，用 acc 判断会把正常回答误判成 empty。
            if (!buf) throw new Error("empty");
            node.tn.data = buf;
            renderMeta(node, { links: node.opts.links, mode: "实时联网 · DeepSeek 国产大模型 · 请自行核对来源" });
            AI.failStreak = 0;
            AI.busy = false;
            scrollChat();
            return;
          }
          acc += dec.decode(res.value, { stream: true });
          var parts = acc.split("\n\n");
          acc = parts.pop();
          parts.forEach(function (p) {
            var line = p.split("\n").filter(function (l) { return l.indexOf("data:") === 0; })[0];
            if (!line) return;
            var d = line.slice(5).trim();
            if (d === "[DONE]") return;
            try {
              var j = JSON.parse(d);
              var t = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
              if (t) { buf += t; node.tn.data = buf; scrollChat(); started = true; }
            } catch (e) {}
          });
          return pump();
        });
      }
      return pump();
    }).catch(function (e) {
      AI.busy = false;
      AI.failStreak++;
      node.wrap.parentNode && node.wrap.parentNode.removeChild(node.wrap);
      if (AI.failStreak >= 2) {
        AI.mode = "demo";
        setModeUI();
        $("banner").classList.add("show");
        toast("联网连续失败，已切回本地知识库");
      }
      var fb = searchKB(q, spotQ);
      var fbk = fb ? fb.audioKey : null;
      aiSay(
        fb ? fb.a : "网络暂时不通，我先按本地知识库答：" + state.spot.intro.slice(0, 90) + "…",
        { src: fb ? fb.src : "本地知识库", mode: "已降级本地 · " + (e && e.message ? e.message : "网络错误"), audioKey: fbk }
      );
    });
  }

  function fetchWithTimeout(url, opt, ms) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    if (ctl) opt.signal = ctl.signal;
    var p = fetch(url, opt);
    if (!ctl) return p;
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { ctl.abort(); rej(new Error("timeout")); }, ms);
      p.then(function (r) { clearTimeout(t); res(r); }, function (e) { clearTimeout(t); rej(e); });
    });
  }

  /* ================= 管理员 ================= */
  function setModeUI() {
    var bar = $("modebar");
    bar.classList.remove("live", "fail");
    if (AI.mode === "live") {
      bar.classList.add("live");
      $("modeText").textContent = "联网模式 · DeepSeek 国产大模型 · 检索增强";
    } else {
      $("modeText").textContent = "演示模式 · 本地知识库 " + kbTotal() + " 条";
    }
  }

  function openAdmin() {
    $("adminKv").innerHTML =
      "当前：<b>" + (AI.mode === "live" ? "联网模式" : "演示模式") + "</b><br>" +
      "代理地址：<b>" + esc(AI.base) + "</b><br>" +
      "说明：口令由代理服务校验，页面不留存密钥。";
    $("adminSheet").classList.add("show");
    $("adminInput").value = "";
    setTimeout(function () { $("adminInput").focus(); }, 120);
  }

  function verifyAdmin(token) {
    if (!token) { toast("请输入口令"); return; }
    $("adminOk").textContent = "校验中…";

    // 依次尝试：当前推断地址 → 同主机的 8787
    // 后者覆盖「页面用 python -m http.server 8000 起、代理另占 8787」这种开发姿势
    var candidates = [AI.base];
    if (location.protocol === "http:" && location.hostname) {
      var alt = "http://" + location.hostname + ":8787";
      if (alt !== AI.base) candidates.push(alt);
    }

    // https 页面无法请求明文 http 的本地代理（浏览器按混合内容拦截），
    // 直接给出人话解释，别在评面前甩一串控制台报错
    if (location.protocol === "https:" && /^http:\/\//.test(AI.base)) {
      AI.mode = "demo"; setModeUI();
      toast("线上版不带联网 AI（密钥不能放前端），离线知识库照常可用；联网演示请用局域网版", 4600);
      $("adminOk").textContent = "解锁";
      return;
    }

    (function tryNext(i) {
      if (i >= candidates.length) {
        AI.mode = "demo"; setModeUI();
        toast("口令不对，或代理没启动（先运行 node tools/proxy.mjs）", 3200);
        $("adminOk").textContent = "解锁";
        return;
      }
      var base = candidates[i];
      fetchWithTimeout(base + "/health", { headers: { "x-admin-token": token } }, 6000)
        .then(function (r) {
          if (!r.ok) throw new Error("bad");
          return r.json();
        })
        .then(function (j) {
          // 必须是代理返回的 JSON，不能是静态托管兜底返回的 index.html
          if (!j || j.ok !== true) throw new Error("not_proxy");
          AI.base = base;
          LS.set("yxy.api", base);
          AI.token = token;
          AI.mode = "live";
          AI.failStreak = 0;
          $("banner").classList.remove("show");
          setModeUI();
          $("adminSheet").classList.remove("show");
          toast("已切换联网模式");
          $("adminOk").textContent = "解锁";
        })
        .catch(function () { tryNext(i + 1); });
    })(0);
  }

  /* ================= 景区门票（暂未开放） ================= */
  // 产品决策：门票预约功能真实上线需要对接景区票务系统与支付资质，
  // 现阶段不做出票、不生成假核销码，只如实展示票价与开放时段，按钮置"敬请期待"。
  function renderTicket() {
    var box = $("ticketList");
    if (!box) return;
    var list = D.spots.filter(function (s) { return s.ticket; });
    box.innerHTML = list.map(function (s) {
      var free = String(s.ticket).indexOf("免费") >= 0;
      return '<div class="tk-card" data-spot="' + s.id + '">' +
        '<div class="tk-top"><b>' + esc(s.name) + '</b>' +
          '<span class="tk-price' + (free ? " free" : "") + '">' + esc(s.ticket) + '</span></div>' +
        '<div class="tk-meta">开放时段 · ' + esc(s.hours || "以景区公告为准") + '</div>' +
        '<div class="tk-foot"><span class="tk-tag">线上预约暂未开放</span>' +
          '<button class="tk-btn" disabled>敬请期待</button></div>' +
        '</div>';
    }).join("") +
    '<div class="tk-note">线上购票与预约核销正在对接景区票务系统，开放后可在本页直接购票、到闸机出示。' +
    '当前请通过景区窗口或官方公众号购票。</div>';
  }

  /* ================= 通用详情层（吃 / 住 / 行 / 非遗） =================
   * 首页四个入口不各开一页，统一走这一个滑入层：
   * 页面数不膨胀，返回路径单一，用户不会"点进去出不来"。
   * ============================================================ */
  function openDetail(title, html) {
    $("dTitle").textContent = title;
    $("dBody").innerHTML = html;
    $("detailSheet").classList.add("show");
    document.body.classList.add("kb-open");
  }

  function closeDetail() {
    $("detailSheet").classList.remove("show");
    document.body.classList.remove("kb-open");
  }

  function rows(list, render) {
    return list.map(function (x) { return render(x); }).join("");
  }

  var ENTRY = {
    food: function () {
      var html = rows(D.foods, function (f) {
        return '<div class="d-card">' +
          '<div class="d-card-h"><b>' + esc(f.name) + '</b>' +
          '<span class="d-price">' + esc(f.price) + '</span></div>' +
          '<div class="d-tag">' + esc(f.type) + '</div>' +
          '<div class="d-desc">' + esc(f.desc) + '</div>' +
          '<div class="d-line"><i>在哪</i>' + esc(f.where) + '</div>' +
          '<div class="d-line"><i>提示</i>' + esc(f.tip) + '</div>' +
          '</div>';
      });
      openDetail("吃什么 · " + D.foods.length + " 样本地味道",
        html + '<div class="d-note">价格与营业信息为 2026 年 11 月核对，实际以门店为准。</div>');
    },
    stay: function () {
      var html = rows(D.stays, function (x) {
        return '<div class="d-card">' +
          '<div class="d-card-h"><b>' + esc(x.name) + '</b>' +
          '<span class="d-price">' + esc(x.price) + '</span></div>' +
          '<div class="d-tag">' + esc(x.type) + '</div>' +
          '<div class="d-desc">' + esc(x.desc) + '</div>' +
          '<div class="d-line ok"><i>合适</i>' + esc(x.pros) + '</div>' +
          '<div class="d-line warn"><i>注意</i>' + esc(x.cons) + '</div>' +
          '</div>';
      });
      openDetail("住哪儿 · " + D.stays.length + " 类选择",
        html + '<div class="d-note">本项目不代订房，仅按位置与预算给出选择建议。</div>');
    },
    transport: function () {
      var html = rows(D.transport, function (x) {
        return '<div class="d-card">' +
          '<div class="d-card-h"><b>' + esc(x.mode) + ' · ' + esc(x.name) + '</b></div>' +
          '<div class="d-desc">' + esc(x.desc) + '</div>' +
          '<ul class="d-ul">' + rows(x.detail, function (l) { return "<li>" + esc(l) + "</li>"; }) + '</ul>' +
          '</div>';
      });
      openDetail("怎么来 · 到高邮的四种走法",
        html + '<div class="d-note">班次与票价以铁路 12306 与公交集团实时信息为准。' +
        '<br>自驾停车：进任一景点讲解页，底部「到达与停车」可一键导航、一键搜周边停车场（车位实时数据未接入，跳转第三方地图查询）。</div>');
    },
    heritage: function () {
      var html = rows(D.heritage, function (h) {
        return '<div class="d-card">' +
          '<div class="d-card-h"><b>' + esc(h.name) + '</b>' +
          '<span class="d-tag">' + esc(h.cat) + '</span></div>' +
          '<div class="d-desc">' + esc(h.desc) + '</div>' +
          '<div class="d-line q"><i>常问</i>' + esc(h.q) + '</div>' +
          '<div class="d-a">' + esc(h.a) + '</div>' +
          '<div class="d-src">来源：' + esc(h.src) + '</div>' +
          '</div>';
      });
      openDetail("非遗 · " + D.heritage.length + " 项活着的技艺",
        html + '<div class="d-note">可点下方「问小史」直接问某一项，能听到语音讲解。</div>');
    }
  };

  function openEntry(k) {
    var fn = ENTRY[k];
    if (!fn) return;
    // 吃住行非遗的数据在 data-kb.js 里，拉到了再开层；已就绪则直接开
    QKB.ensure(fn);
  }

  function renderShops() {
    $("shopSel").innerHTML = D.merchants.map(function (m) {
      return '<option value="' + m.id + '">' + esc(m.name) + "（" + esc(m.type) + "）</option>";
    }).join("");
  }

  function genTool() {
    var m = D.merchants.filter(function (x) { return x.id === $("shopSel").value; })[0] || D.merchants[0];
    var kind = $("tplSel").value;
    var lines;

    if (kind === "copy") {
      lines = m.scriptTpl.map(function (t) {
        var p = m.selling[Math.floor(Math.random() * m.selling.length)];
        return t.replace(/\{product\}/g, p);
      });
    } else {
      var p = m.selling[0];
      lines = [
        "【0-3s 画面】门店招牌 + 出镜人手拿" + p + "｜口播：" + m.name.split("·").pop().trim() + "，就在盂城驿这条街上。",
        "【3-8s 画面】特写细节 3 个镜头｜口播：我们家的" + p + "，每天现做，卖完就收。",
        "【8-12s 画面】游客拿到手、笑着吃｜口播：来高邮，走完盂城驿拐进来就能找到。",
        "【12-15s 画面】门头 + 定位条｜字幕：南门大街 · 邮小驿推荐点位｜口播：报「邮小驿」有惊喜。"
      ];
    }

    $("toolOut").innerHTML = lines.map(function (t, i) {
      return '<div class="line">' + esc(t) + '<button class="cp" data-cp="' + i + '">复制</button></div>';
    }).join("") +
      '<div class="ai-note">AI 生成内容 · 模板由本地规则生成' +
      (AI.mode === "live" ? "，联网模式下可由 DeepSeek 润色" : "，断网可用") +
      " · 发布前请商家自行核对价格与营业信息。</div>";

    $("toolOut").dataset.lines = JSON.stringify(lines);
  }

  /* ================= 事件绑定 ================= */
  function bind() {
    document.addEventListener("click", function (e) {
      var go = e.target.closest("[data-go]");
      if (go) { switchTab(go.getAttribute("data-go")); return; }

      var cat = e.target.closest("[data-cat]");
      if (cat) { state.cat = cat.getAttribute("data-cat"); renderFilter(); renderSpots(); return; }

      var sp = e.target.closest("[data-spot]");
      if (sp) {
        var s = byId(sp.getAttribute("data-spot"));
        if (s) { renderGuide(s); switchTab("guide"); }
        return;
      }

      var askBtn = e.target.closest("[data-ask]");
      if (askBtn) { var q = askBtn.getAttribute("data-ask"); switchTab("chat"); ask(q); return; }

      var st = e.target.closest("[data-stamp]");
      if (st) { tryStamp(st.getAttribute("data-stamp")); return; }

      var en = e.target.closest("[data-entry]");
      if (en) { openEntry(en.getAttribute("data-entry")); return; }

      if (e.target.closest("#dClose") || e.target.id === "detailSheet") { closeDetail(); return; }

      var cp = e.target.closest("[data-cp]");
      if (cp) {
        var lines = JSON.parse($("toolOut").dataset.lines || "[]");
        var txt = lines[parseInt(cp.getAttribute("data-cp"), 10)];
        if (txt && navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("已复制"); });
        else toast("长按上面的文字复制");
        return;
      }

      var co = e.target.closest("[data-coord]");
      if (co) { copyText(co.getAttribute("data-coord")); return; }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDetail();
    });

    $("vbtn").addEventListener("click", function () {
      var k = audioKeyOf(state.spot);
      if (!audioMeta(k)) { toast("该点位语音讲解制作中，先看文字讲解"); return; }
      AudioCtl.play(k);
    });

    $("introText").textContent = D.narrator.transcript || "";
    $("introTextBtn").addEventListener("click", function () {
      var el = $("introText");
      var on = el.classList.toggle("show");
      this.textContent = on ? "收起文字稿" : "看这段的文字稿";
    });

    $("introLine").addEventListener("click", function () {
      AudioCtl.play("intro");
      var el = $("introLine");
      var on = el.classList.toggle("playing");
      el.querySelector(".play").textContent = on ? "❚❚" : "▶";
      if (!on) AudioCtl.stop(true);
    });

    $("genBtn").addEventListener("click", genRoute);
    $("selHours").addEventListener("change", genRoute);
    $("selStyle").addEventListener("change", genRoute);

    $("resetStamp").addEventListener("click", function () {
      // 真实打卡不可撤销，这里只允许清除"游客模式预览"
      if (!state.preview || !state.preview.size) {
        toast("已到场打卡的邮戳不可撤销；游客模式预览没有需要清除的");
        return;
      }
      if (window.confirm("清除 " + state.preview.size + " 枚游客模式预览邮戳？\n已到场打卡的记录不受影响。")) {
        clearPreview();
      }
    });

    $("toolGen").addEventListener("click", genTool);

    // 地图 2D/3D 切换（按钮真实生效，不再是死链接）
    // 页面右上角的「切换 X」与地图内的小按钮是同一个状态的两个入口，
    // 所以统一由 syncToggle() 渲染，任一个被点都要刷新另一个。
    var rt = $("roadToggle");
    function syncToggle(is3D) {
      if (!rt) return;
      if (typeof is3D !== "boolean") {
        var m = Road.instance();
        is3D = m ? m.is3D() : false;   // 地图还没建时按默认 2D 渲染
      }
      // 按钮写的是"下一步动作"：当前 3D → 显示「切换 2D」
      rt.textContent = is3D ? "切换 2D" : "切换 3D";
    }
    if (rt) rt.addEventListener("click", function () {
      Road.mount();                    // 保证实例存在
      var m = Road.instance();
      if (!m) { toast("地图还没准备好"); return; }
      m.toggle2D();
      syncToggle();
    });
    // 地图内小按钮切换后，右上角跟着变
    window.addEventListener("yxy:viewmode", function (e) { syncToggle(e.detail && e.detail.is3D); });
    syncToggle(false);

    $("sendBtn").addEventListener("click", function () { ask($("chatInput").value); });
    $("chatInput").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      if (e.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      ask($("chatInput").value);
    });

    // 管理员：连点印章 5 次
    var taps = 0, tapTimer = null;
    $("seal").addEventListener("click", function () {
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { taps = 0; }, 1600);
      if (taps >= 5) { taps = 0; openAdmin(); }
    });

    $("adminCancel").addEventListener("click", function () { $("adminSheet").classList.remove("show"); });

    // 商业模式说明层
    var bizEntry = $("bizEntry");
    if (bizEntry) bizEntry.addEventListener("click", function () { $("bizSheet").classList.add("show"); });
    var bizClose = $("bizClose");
    if (bizClose) bizClose.addEventListener("click", function () { $("bizSheet").classList.remove("show"); });
    $("adminOk").addEventListener("click", function () { verifyAdmin($("adminInput").value.trim()); });
    $("adminInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") verifyAdmin($("adminInput").value.trim());
    });
    $("adminSheet").addEventListener("click", function (e) {
      if (e.target === $("adminSheet")) $("adminSheet").classList.remove("show");
    });

    // 键盘弹起时收起 tabbar（避免遮住输入框）
    var vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", function () {
        document.body.classList.toggle("kb-open", vv.height < window.innerHeight - 140);
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) AudioCtl.stop(false);
    });
  }

  /* ================= 启动 ================= */
  function boot() {
    // 管理参数：?admin=xxx 或 ?api=http://host:port
    var qs = new URLSearchParams(location.search);
    var pApi = qs.get("api");
    if (pApi) { AI.base = pApi.replace(/\/$/, ""); LS.set("yxy.api", AI.base); }
    var pAdmin = qs.get("admin");
    if (pAdmin) {
      AI.mode = "demo";
      try { history.replaceState(null, "", location.pathname); } catch (e) {}
      setTimeout(function () { verifyAdmin(pAdmin); }, 300);
    }

    var qr = $("qrLine");
    if (qr) {
      qr.innerHTML = '<img src="assets/img/qr.png" alt="扫码体验"><div><b>扫码体验</b><br>手机打开即为全屏版<br>桌面预览为手机壳演示</div>';
    }

    loadGot();
    renderFilter();
    renderSpots();
    renderChatIntro();
    renderGuide(state.spot);
    renderStamps();
    renderShops();
    renderTicket();
    genRoute();
    setModeUI();
    bind();
    genTool();

    // data-kb.js 是后到的：到货后把"本地知识库 N 条"和高频问法刷一遍，
    // 否则模式栏会一直停在开屏那一刻的 0 条（答辩时很显眼）。
    QKB.ensure(function () {
      setModeUI();
      renderChatIntro(true);
      if (state.spot) renderSuggests(state.spot);
    });
  }

  function renderChatIntro(silent) {
    var picks = ["高邮怎么半天玩完？", "盂城驿门票多少？", "有什么必吃的？", "周一哪些馆闭馆？", "汪曾祺写过什么？"];
    $("chatSuggests").innerHTML = picks.map(function (q) {
      return '<button data-ask="' + esc(q) + '">' + esc(q) + "</button>";
    }).join("");
    if (silent) return;   // 二次调用（扩展语料到位）只刷示例，不重复打招呼
    aiSay(
      "我是邮小驿的 AI 讲解员。\n" +
      "高邮 " + D.spots.length + " 处点位、门票、路线、吃住，你都可以问我；点上面的问题试试，或者直接打字。\n" +
      "（默认演示模式，用本地知识库回答，断网也能用；联网模式由管理员开启。）",
      { mode: "本地知识库 · 演示模式" }
    );
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
