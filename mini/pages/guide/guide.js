const db = require('../../utils/db.js');
const ui = require('../../utils/ui.js');
const qa = require('../../utils/qa.js');
const tts = require('../../utils/tts.js');

let typeTimer = null;
let seq = 0;
let eng = null;

function engine() {
  if (!eng) eng = qa.createEngine(db);
  return eng;
}

/* 5 位讲解员各管一摊：
 * 驿丞 → 盂城驿；秦少游 → 文游台；汪老 → 咸鸭蛋与吃；小塔 → 运河与塔；小史 → 其余古迹。
 * 开场白和推荐问题按人格从知识库里挑，不再手写死数据——
 * 网页版加了条目，小程序这边自动就有。 */
const PERSONA_CFG = [
  { spotId: 'yuchengyi',  seedQ: ['盂城驿值得去吗', '古代驿站的公文怎么传', '驿站里都有什么分工'] },
  { spotId: 'wenyoutai',  seedQ: ['文游台值得去吗', '苏轼和秦观在这里做了什么', '文游台的书法值得看吗'] },
  { spotId: 'gaoyouhu',   seedQ: ['高邮咸鸭蛋为什么好', '哪里能吃湖鲜', '有什么特产可以带'] },
  { spotId: 'zhenguosi',  seedQ: ['镇国寺塔为什么建在运河边', '运河西堤看落日几点去', '大运河申遗和高邮有什么关系'] },
  { spotId: 'museum',     seedQ: ['高邮当铺是谁的产业', '龙虬庄遗址凭什么重要', '盂城驿和王氏纪念馆离得远吗'] }
];

Page({
  data: {
    personas: [],
    cur: 0,
    messages: [],
    input: '',
    voiceOn: false,
    lastId: '',
    suggest: [],
    tip: '开启后每条讲解自动朗读 · 需启用同声传译插件'
  },

  onLoad() {
    engine();
    const spots = db.spots || [];
    const list = ui.personas.map(function (p, i) {
      const cfg = PERSONA_CFG[i] || {};
      const spot = spots.filter(function (s) { return s.id === cfg.spotId; })[0] || {};
      return {
        name: p.short + ' · 讲解员',
        short: p.short,
        avatar: p.icon,
        color: p.color,
        spot: spot.name || '',
        hello: spot.name
          ? '我是' + p.short + '。' + spot.name + '这边的事我熟——' +
            (spot.desc || '') + '。想听哪一段，或者直接问我。'
          : '我是' + p.short + '，高邮的旧事我都能说上几句。',
        suggest: cfg.seedQ || []
      };
    });
    this.setData({ personas: list });
    this.setPersona(0);
  },

  onShow() {
    const flag = wx.getStorageSync('youxiaoyi_persona_new');
    if (flag) {
      wx.setStorageSync('youxiaoyi_persona_new', 0);
      const i = Number(wx.getStorageSync('youxiaoyi_persona') || 0);
      if (i !== this.data.cur && this.data.personas.length) this.setPersona(i);
    }
  },

  onHide() { tts.stop(); clearInterval(typeTimer); },
  onUnload() { clearInterval(typeTimer); tts.stop(); },

  setPersona(i) {
    clearInterval(typeTimer);
    tts.stop();
    const p = this.data.personas[i];
    if (!p) return;
    seq = 0;
    this.setData({ cur: i, messages: [], input: '', suggest: p.suggest });
    this.pushAI(p.hello, p.short);
  },

  onPersona(e) {
    const i = Number(e.currentTarget.dataset.idx);
    if (i === this.data.cur) return;
    this.setPersona(i);
  },

  pushAI(text, who) {
    const id = ++seq;
    const messages = this.data.messages.concat([{ id: id, role: 'ai', who: who, text: '', done: false }]);
    this.setData({ messages: messages, lastId: 'm' + id });
    let n = 0;
    clearInterval(typeTimer);
    typeTimer = setInterval(() => {
      n += 2;
      const list = this.data.messages;
      const last = list[list.length - 1];
      if (!last) { clearInterval(typeTimer); return; }
      last.text = text.slice(0, n);
      if (n >= text.length) {
        last.done = true;
        clearInterval(typeTimer);
        if (this.data.voiceOn) tts.speak(text, () => this.noTTS());
      }
      this.setData({ messages: list, lastId: 'm' + id });
    }, 45);
  },

  pushMe(text) {
    const id = ++seq;
    const messages = this.data.messages.concat([{ id: id, role: 'me', who: '', text: text, done: true }]);
    this.setData({ messages: messages, lastId: 'm' + id });
  },

  onInput(e) { this.setData({ input: e.detail.value }); },

  onSend() {
    const q = (this.data.input || '').trim();
    if (!q) return;
    this.setData({ input: '' });
    this.ask(q);
  },

  onSuggest(e) { this.ask(e.currentTarget.dataset.q); },

  ask(q) {
    this.pushMe(q);
    // 讲解页带 scopeId：当前人格对应的景点优先，
    // 这样"门票多少钱"在盂城驿人格下答盂城驿，不会跳到别的景点。
    const cfg = PERSONA_CFG[this.data.cur] || {};
    const r = engine().search(q, { spotId: cfg.spotId });

    let ans;
    if (r.hit) {
      ans = r.a || '';
      if (r.src) ans += '\n—— ' + r.src;
    } else {
      const s = engine().suggest(3);
      ans = '这个我没把握，别乱讲。要不你换个问法，或者先听这几句：' + s.join(' / ');
    }
    setTimeout(() => this.pushAI(ans, this.data.personas[this.data.cur].short), 380);
  },

  toggleVoice() {
    const on = !this.data.voiceOn;
    if (on && !tts.available()) { this.noTTS(); return; }
    this.setData({
      voiceOn: on,
      tip: on ? '语音已开启 · 每条讲解自动朗读，点「重听」可重复播放'
              : '开启后每条讲解自动朗读 · 需启用同声传译插件'
    });
    if (on) {
      const ai = this.data.messages.filter(function (m) { return m.role === 'ai' && m.done; });
      const text = ai.length ? ai[ai.length - 1].text : this.data.personas[this.data.cur].hello;
      tts.speak(text, () => this.noTTS());
    } else {
      tts.stop();
    }
  },

  replay(e) {
    if (!tts.available()) { this.noTTS(); return; }
    tts.speak(e.currentTarget.dataset.text, () => this.noTTS());
  },

  noTTS() {
    this.setData({ voiceOn: false, tip: '需启用同声传译插件后发声，详见 README' });
    wx.showModal({
      title: '小程序端语音',
      content: '当前未启用「微信同声传译」插件。按 README 在 app.json 声明该插件即可真实发声；网页版（浏览器）语音已可直接使用。',
      showCancel: false
    });
  }
});
