/* ============================================================
 * 邮小驿 · 本地配置（占位模板）
 * ------------------------------------------------------------
 * 使用方法：
 *   cp app/config.example.js app/config.js
 *   # 然后编辑 app/config.js 填入真实值
 *
 * app/config.js 已被 .gitignore 排除，不会进入版本库。
 * 若没有 config.js，前端所有功能仍可运行：
 *   - 地图自动降级为自绘手绘地图
 *   - AI 兜底问答自动降级为固定话术
 * ============================================================ */
window.YXY_CONFIG = {
  /* ---- 地图瓦片（天地图） ---- */
  map: {
    // 天地图访问密钥。到 https://console.tianditu.gov.cn/ 创建"浏览器端"应用获取。
    // 留空则使用自绘手绘地图。
    tk: "",
    // 瓦片风格：vec 矢量底图 / img 影像底图
    layer: "vec",
    // 初始中心点与缩放（高邮城区）
    center: { lat: 32.7860, lng: 119.4420 },
    zoom: 14,
    // 瓦片服务地址模板，一般不用改
    url: {
      vec: "https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={tk}",
      cva: "https://t{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={tk}",
      img: "https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={tk}",
      cia: "https://t{s}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk={tk}"
    },
    subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"]
  },

  /* ---- AI 兜底问答（本地代理） ---- */
  api: {
    // tools/proxy.mjs 的地址。留空则关闭 AI 兜底。
    base: "http://127.0.0.1:8787",
    // 代理侧要求的管理口令，与 ADMIN_TOKEN 环境变量一致
    token: ""
  },

  /* ---- 打卡地理围栏 ---- */
  geo: {
    // 打卡半径（米）
    radius: 300,
    // 定位超时（毫秒）
    timeout: 8000
  }
};
