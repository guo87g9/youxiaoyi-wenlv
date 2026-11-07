#!/usr/bin/env node
/* ============================================================================
 * 邮小驿 · AI 兜底代理（DeepSeek）
 * ----------------------------------------------------------------------------
 * 作用：前端「实时联网」模式的唯一后端。纯静态页面不能直连大模型（key 会暴露），
 *      所以由这个本地进程代持 key，并把本地知识库的检索结果作为资料喂给模型。
 *
 * 启动（本机自用）：
 *   export DEEPSEEK_API_KEY=sk-xxxx
 *   node tools/proxy.mjs
 *
 * 启动（现场演示 / 手机同局域网访问）：
 *   export DEEPSEEK_API_KEY=sk-xxxx
 *   node tools/proxy.mjs --lan
 *   --lan 等价于 HOST=0.0.0.0 + STATIC_DIR=dist：
 *   同一进程既托管静态页面、又提供 /ask，手机访问 http://<本机局域网IP>:8787
 *   即为同源，不会有跨域和「https 页面调 http 接口」被拦的问题。
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY  必填，DeepSeek 控制台申请
 *   DEEPSEEK_MODEL    可选，默认 deepseek-chat（也可 deepseek-reasoner）
 *   DEEPSEEK_BASE     可选，默认 https://api.deepseek.com
 *   ADMIN_TOKEN       可选，设置后前端必须在 x-admin-token 头里带上同样的值
 *   PORT              可选，默认 8787
 *   HOST              可选，默认 127.0.0.1；设 0.0.0.0 供局域网访问
 *   STATIC_DIR        可选，静态目录（如 dist）；设置后同源托管页面
 *
 * 接口：
 *   GET  /health  → { ok, model, kb, hasKey }
 *   POST /ask     → body { q, spot, persona }，返回 SSE 流（OpenAI 兼容格式）
 *                   响应头 x-src 为 encodeURIComponent(JSON) 的来源列表
 *   GET  /__lan   → { urls: [...] } 本机可用的局域网访问地址（演示时查地址用）
 *
 * 设计取舍：
 *   - 零依赖，只用 Node 内置模块（Node 18+ 自带 fetch）
 *   - key 只从环境变量读，绝不写进任何文件，也不回显到日志
 *   - 知识库直接复用 app/ 下的 data.js + data-kb.js，改数据不用同步改代理
 * ==========================================================================*/

import http from "node:http";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { readFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APP = path.join(ROOT, "app");

const LAN = process.argv.includes("--lan");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || (LAN ? "0.0.0.0" : "127.0.0.1");
const STATIC_RAW = process.env.STATIC_DIR || (LAN ? path.join(ROOT, "dist") : "");
const STATIC = STATIC_RAW ? path.resolve(ROOT, STATIC_RAW) : "";
const KEY = process.env.DEEPSEEK_API_KEY || "";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const BASE = (process.env.DEEPSEEK_BASE || "https://api.deepseek.com").replace(/\/+$/, "");
const ADMIN = process.env.ADMIN_TOKEN || "";

/* ---------- 加载本地数据：data.js + data-kb.js ---------- */
function loadData() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  for (const f of ["data.js", "data-kb.js"]) {
    const p = path.join(APP, f);
    if (!existsSync(p)) continue;
    vm.runInContext(readFileSync(p, "utf8"), sandbox, { filename: f });
  }

  const D = sandbox.YXY;
  if (!D) throw new Error("data.js 没跑出 window.YXY，检查文件是否被改坏");
  const KB = sandbox.YXY_KB || {};
  for (const k of Object.keys(KB)) D[k] = KB[k];

  // kb2 / kb3 是分层补充语料，前端由 QKB.ensure 合并成一个池子。
  // 这里必须做同样的合并，否则检索池只有 kb 的基础条目（30 条），
  // 口语化问法几乎命中不了，AI 兜底会变成「什么都没查到，模型自由发挥」。
  const seen = new Set();
  const pool = [];
  for (const key of ["kb", "kb2", "kb3"]) {
    for (const it of Array.isArray(KB[key]) ? KB[key] : []) {
      if (!it || !it.id || seen.has(it.id)) continue;
      seen.add(it.id);
      pool.push(it);
    }
  }
  if (pool.length) D.kb = pool;

  return D;
}

const D = loadData();
const require_ = createRequire(import.meta.url);
const { createEngine } = require_(path.join(APP, "shared", "qa.js"));
const ENGINE = createEngine(D);
const SPOT_NAME = Object.fromEntries(D.spots.map((s) => [s.id, s.name]));

/* ---------- 检索增强：主命中 + 同景点的补充条目 ---------- */
function retrieve(q, spotName) {
  const spotId = D.spots.find((s) => s.name === spotName)?.id || null;
  const out = [];
  const seen = new Set();

  const hit = ENGINE.search(q, spotId ? { spotId } : {});
  if (hit.hit) {
    out.push({ q: hit.question, a: hit.a, src: hit.src });
    seen.add(hit.id);
  }

  // 同一景点的其它条目（最多补 3 条），让模型有上下文可依
  const pool = (D.kb || []).filter(
    (it) => !seen.has(it.id) && spotId && (it.tags || []).includes(spotId)
  );
  for (const it of pool) {
    if (out.length >= 4) break;
    out.push({ q: (it.q || [])[0] || "", a: it.a, src: it.src });
    seen.add(it.id);
  }

  // 景点本体介绍也算资料
  const spot = D.spots.find((s) => s.id === spotId);
  if (spot && out.length < 4) {
    out.unshift({ q: spot.name + "简介", a: spot.intro, src: spot.introSrc || "景区公开资料" });
  }
  return out.slice(0, 4);
}

/* ---------- 提示词 ---------- */
function buildMessages(q, spotName, persona) {
  const docs = retrieve(q, spotName);
  const docText = docs.length
    ? docs.map((d, i) => `【资料${i + 1}】${d.q ? "问：" + d.q + " " : ""}${d.a}（出处：${d.src || "未标注"}）`).join("\n")
    : "（本次检索没有命中本地知识库）";

  const system = [
    `你是「${persona || "小史"}」，高邮的邮驿史官，也是「邮小驿」里的 AI 讲解员。高邮在江苏扬州，京杭大运河边，秦代设邮亭，明代盂城驿是全国规模最大、保存最完好的古代驿站。`,
    ``,
    `回答规则（必须遵守）：`,
    `1. 优先用下面提供的【资料】回答。资料能答就据实答，不要添油加醋。`,
    `2. 资料里没有的，直接说"这个我的资料里没写"，然后可以补一句通用常识，但要在句尾标注"（这条不在本地资料里）"。`,
    `3. 绝不编造：不编门票价格、不编开放时间、不编实时客流或剩余车位、不编店名电话。这些一律让用户"以景区公告为准"。`,
    `4. 说人话：像本地人聊天，短句，150 字以内，不用 Markdown 标题和列表符号。`,
    `5. 用户在问某个景点时，回答要落到这个景点上，别泛泛而谈。`,
    spotName ? `6. 当前用户正在看的是「${spotName}」，默认按这个点位来答。` : ``,
    ``,
    `【资料】`,
    docText,
  ].filter(Boolean).join("\n");

  return { system, docs };
}

/* ---------- 工具 ---------- */
const CORS = (res, origin) => {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,x-admin-token");
  res.setHeader("Access-Control-Expose-Headers", "x-src,x-model");
  res.setHeader("Access-Control-Max-Age", "86400");
};

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

/* ---------- 静态托管（--lan 模式下与 /ask 同源，手机端零跨域） ---------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function serveStatic(req, res, pathname) {
  if (!STATIC) return false;

  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    json(res, 400, { error: "bad_path" });
    return true;
  }
  if (rel === "/" || rel === "") rel = "/index.html";

  // 目录穿越防护：解析后必须仍在 STATIC 之内
  const full = path.resolve(STATIC, "." + rel);
  if (full !== STATIC && !full.startsWith(STATIC + path.sep)) {
    json(res, 403, { error: "forbidden" });
    return true;
  }

  let st;
  try {
    st = statSync(full);
    if (st.isDirectory()) {
      const idx = path.join(full, "index.html");
      if (existsSync(idx)) return serveStatic(req, res, rel.replace(/\/?$/, "/") + "index.html");
      json(res, 404, { error: "not_found" });
      return true;
    }
  } catch {
    return false; // 交给调用方走 404 逻辑
  }

  const type = MIME[path.extname(full).toLowerCase()] || "application/octet-stream";
  const headers = {
    "content-type": type,
    "cache-control": "no-cache", // 演示场景，改完即见，不缓存
    "accept-ranges": "bytes",
  };

  // 简单 Range 支持：音频拖动进度需要
  const range = req.headers.range;
  if (range && /^bytes=\d*-\d*$/.test(range)) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = s ? Number(s) : 0;
    const end = e ? Number(e) : st.size - 1;
    if (start >= st.size || end >= st.size || start > end) {
      res.writeHead(416, { "content-range": `bytes */${st.size}` });
      res.end();
      return true;
    }
    res.writeHead(206, {
      ...headers,
      "content-range": `bytes ${start}-${end}/${st.size}`,
      "content-length": end - start + 1,
    });
    createReadStream(full, { start, end }).pipe(res);
    return true;
  }

  res.writeHead(200, { ...headers, "content-length": st.size });
  if (req.method === "HEAD") { res.end(); return true; }
  createReadStream(full).pipe(res);
  return true;
}

/* ---------- 局域网地址探测（演示时用来告诉手机该访问哪个地址） ---------- */
function lanURLs() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family !== "IPv4" || ni.internal) continue;
      out.push({ if: name, url: `http://${ni.address}:${PORT}` });
    }
  }
  return out;
}

function readBody(req, limit = 32 * 1024) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const chunks = [];
    req.on("data", (c) => {
      n += c.length;
      if (n > limit) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/* ---------- 服务 ---------- */
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  CORS(res, origin);

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, {
      ok: true,
      model: MODEL,
      hasKey: Boolean(KEY),
      kb: (D.kb || []).length,
      spots: D.spots.length,
      engine: ENGINE.stats(),
    });
  }

  if (req.method === "GET" && url.pathname === "/__lan") {
    return json(res, 200, { urls: lanURLs(), static: STATIC || null, host: HOST, port: PORT });
  }

  // 静态资源：--lan 模式下同源托管，手机访问这一个端口就够
  if ((req.method === "GET" || req.method === "HEAD") && url.pathname !== "/ask") {
    if (serveStatic(req, res, url.pathname)) return;
  }

  if (req.method !== "POST" || url.pathname !== "/ask") {
    return json(res, 404, { error: "not_found" });
  }

  if (ADMIN && (req.headers["x-admin-token"] || "") !== ADMIN) {
    return json(res, 401, { error: "bad_token" });
  }
  if (!KEY) {
    return json(res, 503, { error: "no_key", msg: "未设置 DEEPSEEK_API_KEY" });
  }

  let payload;
  try {
    payload = JSON.parse((await readBody(req)) || "{}");
  } catch {
    return json(res, 400, { error: "bad_json" });
  }

  const q = String(payload.q || "").trim().slice(0, 500);
  if (!q) return json(res, 400, { error: "empty_q" });

  const { system, docs } = buildMessages(q, payload.spot || "", payload.persona || "");
  const srcs = docs
    .filter((d) => d.src)
    .map((d) => ({ t: d.src, u: "" }))
    .slice(0, 3);

  let upstream;
  try {
    upstream = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: q },
        ],
      }),
    });
  } catch (e) {
    return json(res, 502, { error: "upstream_unreachable", msg: String(e.message || e) });
  }

  if (!upstream.ok) {
    const txt = await upstream.text().catch(() => "");
    return json(res, 502, {
      error: "upstream_" + upstream.status,
      msg: txt.slice(0, 300),
    });
  }

  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-src": encodeURIComponent(JSON.stringify(srcs)),
    "x-model": MODEL,
  });

  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } catch {
    /* 客户端断开或上游中断，静默收尾 */
  }
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`邮小驿 AI 代理已启动  http://${HOST === "0.0.0.0" ? "127.0.0.1" : HOST}:${PORT}`);
  console.log(`  模型      ${MODEL}`);
  console.log(`  Key       ${KEY ? "已配置（" + KEY.slice(0, 6) + "…）" : "未配置，/ask 会返回 503"}`);
  console.log(`  知识库    ${(D.kb || []).length} 条 / ${D.spots.length} 个景点`);
  console.log(`  管理口令  ${ADMIN ? "已启用" : "未设置（本机演示默认不校验）"}`);
  console.log(`  监听      ${HOST}:${PORT}${HOST === "0.0.0.0" ? "（局域网可访问）" : "（仅本机）"}`);
  if (STATIC) console.log(`  静态目录  ${STATIC}`);

  if (HOST === "0.0.0.0") {
    const urls = lanURLs();
    console.log(`\n  手机与这台电脑连同一个 WiFi，然后访问：`);
    if (urls.length) {
      for (const u of urls) console.log(`    ${u.url}    (${u.if})`);
    } else {
      console.log(`    没有探测到局域网地址，检查是否已连上 WiFi`);
    }
    if (STATIC) {
      console.log(`\n  页面与 /ask 同源，手机上无需任何额外配置。`);
      console.log(`  若打不开，多半是系统防火墙拦了这个端口，放行 ${PORT}/tcp 即可。`);
    }
    console.log("");
  }
});
