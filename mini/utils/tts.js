// 语音播报封装
// 优先使用「微信同声传译」插件（需在 app.json 中声明，见 README）；
// 未声明时自动降级：页面会提示如何开启，不会报错。

let si = null;
let audio = null;

try {
  si = requirePlugin('WechatSI');
} catch (e) {
  si = null;
}

function ensureAudio() {
  if (!audio) {
    audio = wx.createInnerAudioContext();
    audio.obeyMuteSwitch = false;
  }
  return audio;
}

function available() {
  return !!(si && si.textToSpeech);
}

function speak(text, onFail) {
  if (!available()) {
    if (onFail) onFail();
    return false;
  }
  const content = String(text || '').slice(0, 500);
  if (!content) return false;
  si.textToSpeech({
    lang: 'zh_CN',
    tts: true,
    content: content,
    success(res) {
      const a = ensureAudio();
      a.src = res.filename;
      a.play();
    },
    fail() {
      if (onFail) onFail();
    }
  });
  return true;
}

function stop() {
  if (audio) {
    try { audio.stop(); } catch (e) {}
  }
}

module.exports = { speak, stop, available };
