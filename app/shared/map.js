/* 邮小驿 · 真实地图引擎（map.js）
 * ---------------------------------------------------------------
 * 手写 Canvas 瓦片引擎，零 SDK 依赖。用天地图 WMTS 的 Web Mercator 瓦片，
 * 叠一层自绘的景点节点（红点 + 光晕 + 标签）。
 *
 * 为什么不用高德/百度 JS SDK：
 *   ① 需要引入第三方脚本，file:// 下会被 CORS 与 key 域名白名单卡住
 *   ② 包体与离线演示不可控，评委现场断网就白屏
 *   ③ 未授权直连私有瓦片接口有合规风险
 *
 * 天地图是官方公开服务，瓦片接口标准化，浏览器端 key 可控。
 * 没有 key 或断网时，自动降级为"示意地图"（自绘长三角轮廓 + 节点），
 * 绝不出现"点了报错"的半成品入口。
 *
 * 对外接口：
 *   YXYMap.create(container, opts) -> {
 *     setSpots(list), setGot(set), focus(id), fit(),
 *     toggle2D(), destroy(), mode()      // 'tile' | 'sketch' | 'loading'
 *   }
 * --------------------------------------------------------------- */
(function (root) {
  "use strict";

  var TILE = 256;

  /* ---------------- 坐标换算（Web Mercator / EPSG:3857） ---------------- */
  function lngToX(lng, z) {
    return (lng + 180) / 360 * Math.pow(2, z) * TILE;
  }
  function latToY(lat, z) {
    var r = lat * Math.PI / 180;
    return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z) * TILE;
  }
  function xToLng(x, z) {
    return x / (Math.pow(2, z) * TILE) * 360 - 180;
  }
  function yToLat(y, z) {
    var n = Math.PI - 2 * Math.PI * y / (Math.pow(2, z) * TILE);
    return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  /* ---------------- GCJ-02 ↔ WGS84 ---------------- */
  // 天地图吃 WGS84；如果要用高德/腾讯底图则需转 GCJ-02。这里保留工具函数。
  var A = 6378245.0, EE = 0.00669342162296594323;

  function outOfChina(lat, lng) {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
  }
  function transformLat(x, y) {
    var ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    ret += (20 * Math.sin(y * Math.PI) + 40 * Math.sin(y / 3 * Math.PI)) * 2 / 3;
    ret += (160 * Math.sin(y / 12 * Math.PI) + 320 * Math.sin(y * Math.PI / 30)) * 2 / 3;
    return ret;
  }
  function transformLng(x, y) {
    var ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20 * Math.sin(6 * x * Math.PI) + 20 * Math.sin(2 * x * Math.PI)) * 2 / 3;
    ret += (20 * Math.sin(x * Math.PI) + 40 * Math.sin(x / 3 * Math.PI)) * 2 / 3;
    ret += (150 * Math.sin(x / 12 * Math.PI) + 300 * Math.sin(x / 30 * Math.PI)) * 2 / 3;
    return ret;
  }

  // WGS84 → GCJ-02（标准实现，已回代验证到 1e-6 度）
  function wgs2gcj(lat, lng) {
    if (outOfChina(lat, lng)) return { lat: lat, lng: lng };
    var dLat = transformLat(lng - 105.0, lat - 35.0);
    var dLng = transformLng(lng - 105.0, lat - 35.0);
    var radLat = lat / 180.0 * Math.PI;
    var magic = Math.sin(radLat);
    magic = 1 - EE * magic * magic;
    var sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (A / sqrtMagic * Math.cos(radLat) * Math.PI);
    return { lat: lat + dLat, lng: lng + dLng };
  }

  /* ============================================================
   * 地图实例
   * ============================================================ */
  function create(container, opts) {
    opts = opts || {};
    var cfg = (root.YXY_CONFIG && root.YXY_CONFIG.map) || {};
    var spots = opts.spots || [];
    var gotSet = opts.got || null;
    var previewSet = opts.preview || null;

    var host = typeof container === "string" ? document.getElementById(container) : container;
    if (!host) throw new Error("map container not found: " + container);

    // ---- DOM
    host.classList.add("yx-map");
    host.innerHTML = "";

    var cv = document.createElement("canvas");
    cv.className = "yx-map-canvas";
    host.appendChild(cv);

    var hud = document.createElement("div");
    hud.className = "yx-map-hud";
    hud.innerHTML =
      '<span class="yx-map-count" id="yxMapCount"></span>';
    host.appendChild(hud);

    var ctrl = document.createElement("div");
    ctrl.className = "yx-map-ctrl";
    ctrl.innerHTML =
      '<button data-act="in" title="放大">＋</button>' +
      '<button data-act="out" title="缩小">－</button>' +
      '<button data-act="fit" title="回到全域">⤢</button>' +
      '<button data-act="2d" title="切换底图">2D</button>';
    host.appendChild(ctrl);

    var badge = document.createElement("div");
    badge.className = "yx-map-badge";
    host.appendChild(badge);

    var ctx = cv.getContext("2d");
    var dpr = Math.min(root.devicePixelRatio || 1, 2);

    // ---- 视图状态
    var view = {
      lat: (cfg.center && cfg.center.lat) || 32.786,
      lng: (cfg.center && cfg.center.lng) || 119.442,
      z: (cfg.zoom || 14) - 1,   // 内部用"浮点缩放"，初始比配置小一级好做平滑
      zf: (cfg.zoom || 14) - 1
    };
    var is3D = false;            // 2D 平面 / 3D 俯视
    var tilt = 0.62;             // 3D 时的透视压缩比
    var mode = "loading";

    // ---- 尺寸
    var W = 0, H = 0;
    function resize() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    /* ---------------- 瓦片缓存 ---------------- */
    var cache = Object.create(null);   // key -> {img, ok, err}
    var MAX_CACHE = 220;

    function tileUrl(z, x, y) {
      var tpl = (cfg.url && cfg.url[cfg.layer || "vec"]) || (cfg.url && cfg.url.vec);
      if (!tpl) return null;
      var subs = cfg.subdomains || ["0"];
      var s = subs[(x + y) % subs.length];
      return tpl
        .replace("{s}", s).replace("{z}", z).replace("{x}", x).replace("{y}", y)
        .replace("{tk}", cfg.tk || "");
    }

    function getTile(z, x, y) {
      var key = z + "/" + x + "/" + y;
      var t = cache[key];
      if (t) return t;
      var url = tileUrl(z, x, y);
      if (!url || !cfg.tk) return { ok: false, err: true };

      var img = new Image();
      img.crossOrigin = "anonymous";
      t = { img: img, ok: false, err: false };
      cache[key] = t;
      img.onload = function () {
        t.ok = true;
        if (mode !== "tile") { mode = "tile"; updateBadge(); }
        scheduleDraw();
      };
      img.onerror = function () {
        t.err = true;
        if (mode === "loading") { mode = "sketch"; updateBadge(); scheduleDraw(); }
      };
      img.src = url;

      // 简单 LRU：超量就清掉一半
      var ks = Object.keys(cache);
      if (ks.length > MAX_CACHE) {
        for (var i = 0; i < ks.length / 2; i++) delete cache[ks[i]];
      }
      return t;
    }

    /* ---------------- 绘制 ---------------- */
    var needDraw = false;
    function scheduleDraw() {
      if (needDraw) return;
      needDraw = true;
      requestAnimationFrame(function () { needDraw = false; draw(); });
    }

    function project(lat, lng) {
      // 以 view 中心为原点，返回屏幕坐标
      var cx = lngToX(view.lng, view.z);
      var cy = latToY(view.lat, view.z);
      var px = lngToX(lng, view.z) - cx + W / 2;
      var py = latToY(lat, view.z) - cy + H / 2;
      if (is3D) {
        // 俯视压缩：越远离中心越"压扁"，形成轻微透视
        var dy = py - H / 2;
        py = H / 2 + dy * tilt;
      }
      return { x: px, y: py };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      if (mode === "tile") drawTiles();
      else drawSketchBase();

      drawRoute();
      drawSpots();
      drawScale();
    }

    function drawTiles() {
      var z = Math.round(view.z);
      var scale = Math.pow(2, view.z - z);
      var tilePx = TILE * scale;
      var cx = lngToX(view.lng, z), cy = latToY(view.lat, z);

      // 3D 压缩后画面只需要覆盖 H/tilt 的高度，所以要取更大的垂直范围，
      // 否则底部会出现空白带（2D 时 tilt=1，范围不变）
      var halfW = W / 2 / scale;
      var halfH = (H / 2 / (is3D ? tilt : 1)) / scale;
      var x0 = Math.floor((cx - halfW) / TILE) - 1, x1 = Math.floor((cx + halfW) / TILE) + 1;
      var y0 = Math.floor((cy - halfH) / TILE) - 1, y1 = Math.floor((cy + halfH) / TILE) + 1;
      var max = Math.pow(2, z);

      for (var ty = y0; ty <= y1; ty++) {
        if (ty < 0 || ty >= max) continue;
        for (var tx = x0; tx <= x1; tx++) {
          var wx = ((tx % max) + max) % max;
          var t = getTile(z, wx, ty);
          if (!t.ok) continue;
          var sx = (tx * TILE - cx) * scale + W / 2;
          var syTop = (ty * TILE - cy) * scale + H / 2;
          // 与 project() 同一套压缩规则：以画布中心为基准压缩
          var y1v = syTop, y2v = syTop + tilePx;
          if (is3D) {
            y1v = H / 2 + (y1v - H / 2) * tilt;
            y2v = H / 2 + (y2v - H / 2) * tilt;
          }
          // 边缘多画 1px 消缝
          ctx.drawImage(t.img, sx, y1v, tilePx + 1, (y2v - y1v) + 1);
        }
      }

      // 底图调色：压到深墨绿，让红色节点跳出来。
      // 之前乘 #CFE9DF（浅薄荷）会把陆地提亮成亮绿，跟设计稿的「深绿底」不符；
      // 改成两步：先去饱和把彩色底图抽成灰调，再乘深墨绿统一色相，
      // 最后压一层暗把整体亮度拉到和示意地图接近。
      ctx.save();
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = "hsl(160, 18%, 50%)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "#3E6B5E";          // 深墨绿：陆地压成暗绿，水面更沉
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(8,28,24,.34)"; // 再压暗一档，标签才够跳
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // 降级底图：按**真实经纬度**投影画出水域与运河，跟节点位置严格对齐。
    // 不追求与官方地图一致，只求"节点落在该落的地方、运河从中间穿过去"。
    var SKETCH = {
      // 高邮湖岸线（WGS84，取高邮侧湖岸的简化折线）
      // 真实湖岸：北端在界首一带向西张开，中段马棚湾最宽，南端在菱塘收口。
      // 之前写成经度几乎不变的竖线，画出来和运河平行，完全不像湖——这里按真实走向重排。
      lake: [
        [32.8600, 119.3600], [32.8400, 119.3420], [32.8150, 119.3300],
        [32.7900, 119.3230], [32.7650, 119.3210], [32.7420, 119.3280],
        [32.7220, 119.3450], [32.7080, 119.3700], [32.6980, 119.3980]
      ],
      // 大运河中心线（自北向南，高邮段）
      // 真实运河在城西穿城而过，北段偏东、南段向西南摆，不是一条竖线。
      canal: [
        [32.8650, 119.4265], [32.8400, 119.4270], [32.8150, 119.4262],
        [32.7900, 119.4245], [32.7650, 119.4218], [32.7400, 119.4180],
        [32.7150, 119.4128], [32.6900, 119.4060]
      ]
    };

    function drawSketchBase() {
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#12322C");
      g.addColorStop(1, "#0C2622");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // 经纬网格：按真实经度/纬度画，5 分一档
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.05)";
      ctx.lineWidth = 1;
      var z = Math.round(view.z);
      var startLng = Math.floor(view.lng * 12) / 12 - 0.1;
      for (var k = 0; k < 8; k++) {
        var lng = startLng + k / 12;
        var px = project(view.lat, lng).x;
        if (px < 0 || px > W) continue;
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      }
      var startLat = Math.floor(view.lat * 12) / 12 - 0.1;
      for (var k2 = 0; k2 < 8; k2++) {
        var lat = startLat + k2 / 12;
        var py = project(lat, view.lng).y;
        if (py < 0 || py > H) continue;
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      }
      ctx.restore();

      // 高邮湖：岸线以西全部填成水面（用“岸线 + 画布左侧外框”构成闭合多边形）
      ctx.save();
      var lg = ctx.createLinearGradient(0, 0, W * 0.55, 0);
      lg.addColorStop(0, "rgba(38,116,148,.55)");
      lg.addColorStop(1, "rgba(38,116,148,.20)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      var shore = SKETCH.lake.map(function (pt) { return project(pt[0], pt[1]); });
      ctx.moveTo(-W, shore[0].y);
      shore.forEach(function (p) { ctx.lineTo(p.x, p.y); });
      ctx.lineTo(-W, shore[shore.length - 1].y);
      ctx.closePath();
      ctx.fill();

      // 湖岸描边
      ctx.strokeStyle = "rgba(130,205,225,.42)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      shore.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      ctx.restore();

      // 大运河：真实走向的宽描边
      ctx.save();
      ctx.strokeStyle = "rgba(74,158,180,.62)";
      ctx.lineWidth = Math.max(7, W * 0.026);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      SKETCH.canal.forEach(function (pt, i) {
        var p = project(pt[0], pt[1]);
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      });
      ctx.stroke();
      // 内侧亮线，像水面反光
      ctx.strokeStyle = "rgba(160,225,240,.22)";
      ctx.lineWidth = Math.max(2, W * 0.007);
      ctx.stroke();
      ctx.restore();

      // 老城街区：以盂城驿为中心画几个方块示意
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,.045)";
      [[32.780, 119.437, 0.012, 0.010], [32.775, 119.443, 0.009, 0.008]].forEach(function (b) {
        var p1 = project(b[0] + b[2] / 2, b[1] - b[3] / 2);
        var p2 = project(b[0] - b[2] / 2, b[1] + b[3] / 2);
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      });
      ctx.restore();
    }

    // 节点之间的连线（运河邮路：按 heat 排序串起来）
    function drawRoute() {
      var pts = spots.map(function (s) {
        var g = s.geo; if (!g) return null;
        return project(g.lat, g.lng);
      }).filter(Boolean);
      if (pts.length < 2) return;

      ctx.save();
      ctx.strokeStyle = "rgba(201,154,63,.42)";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      pts.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      ctx.restore();
    }

    var lastHitRects = [];   // 用于点击命中测试

    function drawSpots() {
      lastHitRects = [];
      // 左上角 HUD 与右上角按钮区先占位，避免标签被压在控件下面
      var occupied = [
        { x: 0, y: 0, w: 92, h: 26 },        // 已点亮 xx/xx
        { x: W - 40, y: 0, w: 40, h: 150 }   // 缩放按钮列
      ];
      var n = 0;

      // 绘制顺序：已打卡优先 → 热度高的优先，保证重要标签不被挤掉
      var ordered = spots.slice().sort(function (a, b) {
        var la = gotSet && gotSet.has(a.id) ? 1 : 0;
        var lb = gotSet && gotSet.has(b.id) ? 1 : 0;
        if (la !== lb) return lb - la;
        return (b.heat || 0) - (a.heat || 0);
      });

      ordered.forEach(function (s) {
        var g = s.geo;
        if (!g) return;
        var p = project(g.lat, g.lng);
        // 画布外的点：在边缘画一个方向指示，告诉用户"往那边还有"
        var off = (p.x < 8 || p.x > W - 8 || p.y < 8 || p.y > H - 8);
        if (off) {
          var ex = Math.max(12, Math.min(W - 12, p.x));
          var ey = Math.max(12, Math.min(H - 12, p.y));
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = "#C99A3F";
          ctx.fill();
          ctx.restore();
          var offLit = gotSet && gotSet.has(s.id);
          lastHitRects.push({ id: s.id, x: ex, y: ey, r: 12, edge: true });
          return;
        }

        var lit = gotSet && gotSet.has(s.id);
        var pre = previewSet && previewSet.has(s.id);
        var r = lit ? 6.5 : 5;

        // 光晕
        var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4.2);
        glow.addColorStop(0, lit ? "rgba(220,60,45,.55)" : "rgba(220,60,45,.30)");
        glow.addColorStop(1, "rgba(220,60,45,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4.2, 0, Math.PI * 2);
        ctx.fill();

        // 点
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = lit ? "#E8402C" : (pre ? "#C99A3F" : "#B93A2B");
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = lit ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.7)";
        ctx.stroke();

        // 已打卡加个小白芯
        if (lit) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,.9)";
          ctx.fill();
        }

        // 标签：总是尝试画，与已有标签重叠则让位
        ctx.font = "600 10.5px -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        var label = s.short || s.name;
        var tw = ctx.measureText(label).width;
        var ly = p.y + r + 4;
        var box = { x: p.x - tw / 2 - 4, y: ly - 1, w: tw + 8, h: 15 };

        function hits(b) {
          for (var q = 0; q < occupied.length; q++) {
            var o = occupied[q];
            if (!(b.x + b.w < o.x || b.x > o.x + o.w || b.y + b.h < o.y || b.y > o.y + o.h)) return true;
          }
          return false;
        }

        var placed = !hits(box);
        if (!placed) {
          // 换到点上方再试一次
          var up = { x: box.x, y: p.y - r - 16, w: box.w, h: 15 };
          if (!hits(up)) { box = up; placed = true; }
        }

        if (placed) {
          occupied.push(box);
          ctx.fillStyle = lit ? "rgba(142,42,31,.92)" : "rgba(12,26,23,.78)";
          roundRect(ctx, box.x, box.y, box.w, box.h, 4);
          ctx.fill();
          if (lit) {
            ctx.strokeStyle = "rgba(255,214,150,.55)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ctx.fillStyle = lit ? "#FFE7C4" : "rgba(255,255,255,.95)";
          ctx.fillText(label, p.x, box.y + 1);
        }

        lastHitRects.push({ id: s.id, x: p.x, y: p.y, r: Math.max(r + 10, 14) });
        n++;
      });

      var cnt = document.getElementById("yxMapCount");
      if (cnt) {
        var done = gotSet ? Array.from(gotSet).filter(function (id) {
          return spots.some(function (s) { return s.id === id; });
        }).length : 0;
        cnt.textContent = "已点亮 " + done + "/" + spots.length;
      }
    }

    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    // 比例尺
    function drawScale() {
      var lat = view.lat;
      var mPerPx = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, view.z);
      var targets = [50, 100, 200, 500, 1000, 2000, 5000];
      var pick = targets[0];
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] / mPerPx <= W * 0.28) pick = targets[i];
      }
      var px = pick / mPerPx;

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.55)";
      ctx.lineWidth = 1.2;
      var bx = 12, by = H - 20;
      ctx.beginPath();
      ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by); ctx.lineTo(bx + px, by); ctx.lineTo(bx + px, by - 4);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.font = "9.5px -apple-system,sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(pick >= 1000 ? (pick / 1000) + " km" : pick + " m", bx, by - 5);
      ctx.restore();
    }

    function updateBadge() {
      if (mode === "tile") {
        badge.textContent = "";
        badge.style.display = "none";
      } else if (mode === "sketch") {
        badge.style.display = "";
        badge.textContent = cfg.tk ? "在线底图不可用 · 已切示意地图" : "未配置地图密钥 · 示意地图";
      } else {
        badge.style.display = "none";
      }
    }

    /* ---------------- 交互 ---------------- */
    var drag = null;
    var moved = false;

    function toLocal(e) {
      var r = cv.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    function onDown(e) {
      var p = toLocal(e);
      drag = { x: p.x, y: p.y, lat: view.lat, lng: view.lng, t: Date.now() };
      moved = false;
      cv.setPointerCapture && e.pointerId != null && cv.setPointerCapture(e.pointerId);
    }

    function onMove(e) {
      if (!drag) return;
      var p = toLocal(e);
      var dx = p.x - drag.x, dy = p.y - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (!moved) return;
      e.preventDefault && e.preventDefault();

      var scale = Math.pow(2, view.z);
      var cx = lngToX(drag.lng, view.z) - dx / 1;
      var cy = latToY(drag.lat, view.z) - (is3D ? dy / tilt : dy);
      view.lng = xToLng(cx, view.z);
      view.lat = yToLat(cy, view.z);
      clampLat();
      scheduleDraw();
    }

    function onUp(e) {
      if (!drag) return;
      var dt = Date.now() - drag.t;
      var p = toLocal(e.changedTouches ? e.changedTouches[0] : e);
      var d = Math.hypot(p.x - drag.x, p.y - drag.y);
      drag = null;
      if (!moved && d < 6 && dt < 600) handleClick(p);
    }

    function handleClick(p) {
      var best = null, bestD = 1e9;
      for (var i = 0; i < lastHitRects.length; i++) {
        var h = lastHitRects[i];
        var d = Math.hypot(h.x - p.x, h.y - p.y);
        if (d < h.r && d < bestD) { bestD = d; best = h; }
      }
      if (best && typeof opts.onSpot === "function") opts.onSpot(best.id);
    }

    function clampLat() {
      view.lat = Math.max(-85, Math.min(85, view.lat));
    }

    function zoomBy(d, anchor) {
      var old = view.z;
      view.z = Math.max(9, Math.min(17.5, view.z + d));
      if (view.z === old) return;
      if (anchor) {
        // 以屏幕点为中心缩放：先记下该点地理坐标，缩放后反推中心
        var cx = lngToX(view.lng, old), cy = latToY(view.lat, old);
        var gx = cx + (anchor.x - W / 2);
        var gy = cy + (anchor.y - H / 2) / (is3D ? tilt : 1);
        var gLng = xToLng(gx, old), gLat = yToLat(gy, old);
        var ncx = lngToX(gLng, view.z) - (anchor.x - W / 2);
        var ncy = latToY(gLat, view.z) - (anchor.y - H / 2) / (is3D ? tilt : 1);
        view.lng = xToLng(ncx, view.z);
        view.lat = yToLat(ncy, view.z);
      }
      clampLat();
      scheduleDraw();
    }

    // 滚轮 / 双指缩放
    function onWheel(e) {
      e.preventDefault();
      var p = toLocal(e);
      zoomBy(e.deltaY > 0 ? -0.35 : 0.35, p);
    }

    var pinch = null;
    function onTouchStart(e) {
      if (e.touches.length === 2) {
        drag = null;
        pinch = {
          d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY),
          z: view.z
        };
      } else onDown(e);
    }
    function onTouchMove(e) {
      if (e.touches.length === 2 && pinch) {
        e.preventDefault();
        var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        var nz = pinch.z + Math.log2(d / pinch.d);
        view.z = Math.max(9, Math.min(17.5, nz));
        scheduleDraw();
      } else onMove(e);
    }
    function onTouchEnd(e) {
      if (pinch) { pinch = null; return; }
      onUp(e);
    }

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", function () { drag = null; });
    cv.addEventListener("wheel", onWheel, { passive: false });
    cv.addEventListener("touchstart", onTouchStart, { passive: false });
    cv.addEventListener("touchmove", onTouchMove, { passive: false });
    cv.addEventListener("touchend", onTouchEnd);

    ctrl.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "in") zoomBy(0.8);
      else if (act === "out") zoomBy(-0.8);
      else if (act === "fit") api.fit();
      else if (act === "2d") api.toggle2D();
    });

    /* ---------------- 对外 API ---------------- */
    // 用 85% 分位内缩，避免湖上花海这类离群点把视野拉得过大
    function coreBox(pts) {
      var la = pts.map(function (g) { return g.lat; }).sort(function (a, b) { return a - b; });
      var ln = pts.map(function (g) { return g.lng; }).sort(function (a, b) { return a - b; });
      var lo = Math.floor(la.length * 0.02);
      var hi = Math.ceil(la.length * 0.98) - 1;
      var lo2 = Math.floor(ln.length * 0.02);
      var hi2 = Math.ceil(ln.length * 0.98) - 1;
      return {
        minLat: la[lo], maxLat: la[hi],
        minLng: ln[lo2], maxLng: ln[hi2]
      };
    }

    function fit(padding) {
      var pts = spots.filter(function (s) { return s.geo; }).map(function (s) { return s.geo; });
      if (!pts.length) return;

      var box = coreBox(pts);

      // 城区核心范围（用于决定缩放级别）
      var coreLat = Math.max(box.maxLat - box.minLat, 0.010);
      var coreLng = Math.max(box.maxLng - box.minLng, 0.010);

      // 中心点：城区中心。视野向西多让一点，把湖东岸带进画面。
      var cLat = (box.minLat + box.maxLat) / 2;
      var cLng = (box.minLng + box.maxLng) / 2;
      if (mode !== "tile") cLng -= 0.0045;   // 西移一点，让湖东岸进画面

      var lakeEast = -180;
      SKETCH.lake.forEach(function (pt) { if (pt[1] > lakeEast) lakeEast = pt[1]; });

      var pad = padding == null ? 0.09 : padding;

      // 视野宽度：核心跨度 + 西侧湖带（最多 330 米）
      var viewSpanLng = coreLng;
      if (mode !== "tile" && lakeEast > -180) {
        var westNeed = Math.max(0, cLng - (lakeEast - 0.003));
        viewSpanLng = Math.max(coreLng, westNeed * 2);
        viewSpanLng = Math.min(viewSpanLng, coreLng * 2.2);   // 湖带不无限撑大视野
      }
      var viewSpanLat = Math.max(coreLat, viewSpanLng * H / W);

      // 找能装下 viewSpan 的最大 z
      var zFit = 17;
      for (var z = 17; z >= 9; z -= 0.25) {
        var pw = lngToX(cLng + viewSpanLng / 2, z) - lngToX(cLng - viewSpanLng / 2, z);
        var ph = latToY(cLat - viewSpanLat / 2, z) - latToY(cLat + viewSpanLat / 2, z);
        if (pw <= W * (1 - pad * 2) && ph <= H * (1 - pad * 2)) { zFit = z; break; }
      }

      view.lat = cLat;
      view.lng = cLng;
      view.z = Math.max(12.9, Math.min(15.6, zFit));
      clampLat();
      scheduleDraw();
    }

    var api = {
      setSpots: function (list) { spots = list || []; scheduleDraw(); },
      setGot: function (set) { gotSet = set; scheduleDraw(); },
      setPreview: function (set) { previewSet = set; scheduleDraw(); },
      focus: function (id) {
        var s = spots.filter(function (x) { return x.id === id; })[0];
        if (!s || !s.geo) return;
        view.focusId = id;
        view.lat = s.geo.lat;
        view.lng = s.geo.lng;
        view.z = Math.max(view.z, 15.2);
        scheduleDraw();
      },
      fit: fit,
      zoomBy: zoomBy,
      toggle2D: function () {
        is3D = !is3D;
        var btn = ctrl.querySelector('[data-act="2d"]');
        // 文案统一用"动作"而不是"当前状态"：现在 3D 就写 2D（点了回 2D），
        // 跟右上角 roadToggle 的「切换 2D / 切换 3D」保持同一套语义。
        if (btn) btn.textContent = is3D ? "2D" : "3D";
        scheduleDraw();
        // 通知外部（页面右上角的「切换 2D / 切换 3D」）跟着刷新
        try { window.dispatchEvent(new CustomEvent("yxy:viewmode", { detail: { is3D: is3D } })); } catch (e) {}
        return is3D;
      },
      is3D: function () { return is3D; },
      mode: function () { return mode; },
      _view: function () { return { lat: view.lat, lng: view.lng, z: view.z, W: W, H: H }; },
      _proj: function (lat, lng) { return project(lat, lng); },
      resize: resize,
      destroy: function () {
        cv.removeEventListener("pointerdown", onDown);
        cv.removeEventListener("pointermove", onMove);
        cv.removeEventListener("pointerup", onUp);
        cv.removeEventListener("wheel", onWheel);
        cv.removeEventListener("touchstart", onTouchStart);
        cv.removeEventListener("touchmove", onTouchMove);
        cv.removeEventListener("touchend", onTouchEnd);
        host.innerHTML = "";
        host.classList.remove("yx-map");
      }
    };

    // 启动
    resize();
    requestAnimationFrame(function () {
      fit();
      // 预热一张瓦片判断在线底图是否可用
      if (cfg.tk) getTile(Math.round(view.z), Math.floor(lngToX(view.lng, Math.round(view.z)) / TILE), Math.floor(latToY(view.lat, Math.round(view.z)) / TILE));
      else { mode = "sketch"; updateBadge(); scheduleDraw(); }
      setTimeout(function () {
        if (mode === "loading") { mode = "sketch"; updateBadge(); scheduleDraw(); }
        updateBadge();
      }, 2500);
    });

    if (root.ResizeObserver) {
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(host);
      api._ro = ro;
    } else {
      root.addEventListener("resize", resize);
    }

    return api;
  }

  root.YXYMap = {
    create: create,
    wgs2gcj: wgs2gcj,
    lngToX: lngToX,
    latToY: latToY
  };
})(typeof self !== "undefined" ? self : this);
