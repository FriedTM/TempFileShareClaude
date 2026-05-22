/* Sharp RP-117 Custom Lovelace Card
 * Secure: uses HA's own connection (no credentials). Reads live state from
 * sensors, fires script.turntable_* services on tap.
 *
 * INSTALL:
 *   1) Put this file at /config/www/turntable-card.js
 *   2) Settings -> Dashboards -> (3-dot) -> Resources -> Add Resource
 *      URL: /local/turntable-card.js   Type: JavaScript Module
 *   3) Add a card:  type: custom:turntable-card
 *
 * ENTITIES (from v20 driver):
 *   binary_sensor.turntable_power, sensor.turntable_speed, binary_sensor.turntable_tray_open
 * COMMAND MAP -> script.turntable_<word>
 */
const CARD_CSS = `:host{display:block;height:auto;--ha-card-background:transparent;background:transparent;
  color:#24221f;}
.deck *{box-sizing:border-box;}

  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
  :root{
    --panel:#dcdfe2;
    --hairline:repeating-linear-gradient(180deg,rgba(255,255,255,.35) 0 1px,rgba(0,0,0,.04) 1px 2px);
    --btn:linear-gradient(180deg,#ffffff 0%,#ededed 22%,#d2d2d2 60%,#b4b4b4 100%);
    --btn-lo:linear-gradient(180deg,#d6d6d6,#b0b0b0);
    --slate:linear-gradient(180deg,#9aa0a6 0%,#7c8086 30%,#5d6166 80%,#4b4e53 100%);
    --display:#0c0e0d;
    --green:#39ff14; --red:#ff3b3b; --amber:#ffae3b;
    --txt:#24221f; --edge:#9a9ea3;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:radial-gradient(circle at 50% -10%,#222,#0a0a0a 70%);
    min-height:100vh;display:flex;flex-direction:column;align-items:center;
    font-family:'DM Mono',monospace;color:#e8e2d6;padding:26px 12px 60px;
  }
  .kicker{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#7d8893;margin-bottom:6px}
  h1{font-size:23px;font-weight:500;font-family:'DM Mono',monospace}
  .subt{font-size:12px;color:#7d756a;margin:4px 0 22px}

  /* ===== faceplate ===== */
  .deck{
    width:min(940px,99vw);margin:0 auto;background:#dcdfe2 !important;position:relative;
    border-radius:7px;border:1px solid #888c91;
    box-shadow:0 30px 70px -22px rgba(0,0,0,.85),0 1px 0 rgba(255,255,255,.6) inset,
      0 -3px 8px rgba(0,0,0,.22) inset;
    padding:18px 20px;transition:filter .3s;
  }

  .deck.off{}

  /* FULL (desktop): three columns side by side */
  .grid{display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center}
  .deck{height:auto;overflow:visible}

  /* MID (tablet): hide center tray, keep left + right */
  @media (max-width: 880px){
    .grid{grid-template-columns:1fr 1fr;gap:18px;align-items:start}
    .traywrap{display:none !important}
    .left,.right{min-width:0}
  }

  /* MOBILE: stack left over right, tray graphic below */
  @media (max-width: 560px){
    .grid{grid-template-columns:1fr;gap:18px;align-items:start}
    .left,.right{min-width:0;width:100%}
    .traywrap{display:flex !important;order:3;width:100%}
    .left{order:1}
    .right{order:2}
    .deck{padding:16px;height:auto}
    .tray{height:150px}
  }

  /* ---- generic button ---- */
  .btn{
    background:linear-gradient(180deg,#ffffff 0%,#ededed 22%,#d2d2d2 60%,#b4b4b4 100%);
    border:1px solid #9a9ea3;border-radius:3px;cursor:pointer;
    color:#24221f;font-size:10px;letter-spacing:.02em;padding:9px 6px;text-align:center;
    box-shadow:0 2px 0 #a4a8ad,0 1px 1px rgba(0,0,0,.2);transition:.08s;user-select:none;white-space:nowrap;
  }
  .btn:hover{filter:brightness(1.04)}
  .btn:active,.btn.flash{transform:translateY(2px);box-shadow:0 0 0 #a4a8ad;background:linear-gradient(180deg,#d6d6d6,#b0b0b0)}
  .btn.flash{outline:1px solid var(--green)}
  .btn.slate{background:linear-gradient(180deg,#9aa0a6 0%,#7c8086 30%,#5d6166 80%,#4b4e53 100%);color:#eef0f2;border-color:#3e4146;
    box-shadow:0 2px 0 #303236,0 1px 1px rgba(0,0,0,.3)}

  .cap{font-size:8px;letter-spacing:.13em;color:#5a5d61;text-transform:uppercase;text-align:center}
  .cap2{font-size:8px;letter-spacing:.14em;color:#3a3d41;text-transform:uppercase;text-align:center;line-height:1.5;font-weight:500}
  .apmshdr{font-size:9px;letter-spacing:.22em;color:#d8dbde;text-align:center;font-weight:600;
    background:#4a4d51;width:fit-content;margin:0 auto;padding:2px 10px;border-radius:2px}

  /* ===== LEFT ===== */
  .left{display:flex;flex-direction:column;gap:14px;min-width:248px}
  .left .apmshdr{margin-left:auto;margin-right:auto}
  .brandrow{display:flex;align-items:center;justify-content:space-between;gap:18px}
  .brand{font-size:30px;font-weight:800;letter-spacing:-.01em;font-style:italic;
    color:#2b2d30;
    text-shadow:0 1px 0 #fff,0 -1px 0 #0006,1px 1px 1px #aaa;
    -webkit-text-stroke:.4px #1a1c1f;}
  .pw{display:flex;flex-direction:column;align-items:center;gap:3px;margin-top:16px}
  .pwcap{font-size:8px;letter-spacing:.16em;color:#3a3d41}
  .onoff{display:flex;align-items:center;gap:5px;margin-top:3px}
  .marks .tophat{height:11px}
  .marks{display:flex;flex-direction:column;gap:6px;justify-content:center}
  .tophat{position:relative;width:14px;height:11px}
  /* base line */
  .tophat::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;
    background:#3a3d41;border-radius:1px}
  /* raised stem (the button) */
  .tophat::before{content:"";position:absolute;left:50%;transform:translateX(-50%);bottom:2px;
    width:7px;background:#3a3d41;border-radius:1px}
  .tophat.tall::before{height:7px}   /* ON  = button out (taller) */
  .tophat.short::before{height:4px}  /* OFF = button in (shorter) */
  .onofftxt{display:flex;flex-direction:column;gap:6px;justify-content:center}
  .onofftxt span{font-size:9px;letter-spacing:.06em;color:#2a2d31;font-weight:700;
    height:11px;display:flex;align-items:center;line-height:1;padding-top:2px}
  .pwbtn{width:74px;height:22px;border-radius:3px;cursor:pointer;border:1px solid #9a9ea3;
    background:linear-gradient(180deg,#ffffff 0%,#ededed 22%,#d2d2d2 60%,#b4b4b4 100%);box-shadow:0 2.5px 0 #a4a8ad,0 1px 1px rgba(0,0,0,.2);transition:.1s}
  /* OFF = out (raised). ON = pushed in (depressed, recessed look) */
  .deck:not(.off) .pwbtn{transform:translateY(2.5px);
    box-shadow:0 0 0 #a4a8ad,0 1px 3px rgba(0,0,0,.35) inset;
    background:linear-gradient(180deg,#d6d6d6,#b0b0b0)}

  .numpad{display:grid;grid-template-columns:repeat(4,1fr);gap:11px 12px;width:100%}
  .numcell{display:flex;flex-direction:column;align-items:stretch;gap:3px}
  .numcell .numlbl{text-align:center}
  .numlbl{font-size:8px;letter-spacing:.04em;color:#3a3d41}
  .btn.slim{width:100%;height:14px;padding:0;border-radius:2px;
    box-shadow:0 1.5px 0 #a4a8ad,0 1px 1px rgba(0,0,0,.15)}
  .btn.slim:active,.btn.slim.flash{transform:translateY(1.5px);box-shadow:0 0 0 #a4a8ad}
  

  /* ===== CENTER tray (my disk graphic) ===== */
  .traywrap{display:flex;flex-direction:column;gap:7px}
  .tray{position:relative;border-radius:5px;height:172px;cursor:pointer;
    background:radial-gradient(circle at 50% 45%,#241f19,#0c0a08 72%);
    border:2px solid #43403a;box-shadow:0 0 0 2px #8c8678,0 8px 18px rgba(0,0,0,.5) inset;
    display:flex;align-items:center;justify-content:center;overflow:hidden;transition:.4s}
  .tray .disc{width:150px;height:150px;border-radius:50%;position:relative;transition:.45s;
    background:repeating-radial-gradient(circle at 50% 50%,#14110e 0 2px,#211c17 2px 4px);
    box-shadow:0 6px 16px rgba(0,0,0,.5) inset,0 0 0 1px #2a241d}
  
  
  .tray.open .disc{transform:translateY(62%);opacity:.3}
    .tray .emboss{position:absolute;bottom:8px;right:12px;font-size:8px;letter-spacing:.18em;color:#6a6052}
  .tray .tstate{position:absolute;top:9px;left:0;right:0;text-align:center;font-size:8.5px;
    letter-spacing:.18em;color:var(--amber);opacity:0;transition:.3s}
  .tray.open .tstate{opacity:1}

  /* ===== RIGHT (properly aligned) ===== */
  .right{display:flex;flex-direction:column;gap:12px;min-width:300px}
  .rtop{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;align-items:start;margin-top:18px}
  .rtop .rcell{justify-content:flex-end;height:100%}
  .rtop .btn.tallbtn{width:100%;height:34px;padding:0;border-radius:3px;
    box-shadow:0 1.5px 0 #a4a8ad,0 1px 1px rgba(0,0,0,.15)}
  .rtop .btn.shortbtn{width:100%;height:21px;padding:0;border-radius:3px;
    box-shadow:0 1.5px 0 #a4a8ad,0 1px 1px rgba(0,0,0,.15)}
  .transportwrap{position:relative;margin-top:40px}
  .transport{display:grid;grid-template-columns:1fr 1fr 1fr 1.6fr;gap:10px;align-items:end;padding-top:8px}
  .rcell{display:flex;flex-direction:column;align-items:center;gap:3px}
  .rlbl{font-size:8px;letter-spacing:.06em;color:#3a3d41;white-space:nowrap}
  .apmsbadge{font-size:8px;letter-spacing:.2em;color:#d8dbde;font-weight:600;
    background:#4a4d51;width:fit-content;padding:2px 9px;border-radius:2px;
    position:absolute;top:-15px;left:22%;transform:translateX(-50%);z-index:2}
  .apmsline{position:absolute;top:2px;left:11%;width:22%;height:1.5px;background:#3a3d41;pointer-events:none}

  .speedline{display:flex;align-items:flex-end;justify-content:flex-end;gap:12px;margin-top:2px}
  .speedline .rcell{width:21%}
  .speedline .spdlight{margin-bottom:1px;background:#2a2418;box-shadow:0 0 0 1px #000 inset}
  .speedline .cap{margin-bottom:1px}
  .spdlight{width:10px;height:10px;border-radius:50%;background:#243; box-shadow:0 0 0 1px #000 inset;transition:.25s}
  .deck:not(.off) .spdlight.on{background:#39c46e !important;box-shadow:0 0 8px 1px #39c46e}
  .spdval{font-size:14px;color:#2faa1e;font-weight:500;min-width:30px}

  .legend{width:min(940px,99vw);margin-top:18px;font-size:11px;line-height:1.7;
    color:#6f675c;border-left:2px solid #7d8893;padding-left:14px}
  .legend b{color:#aab0b6}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);
    background:var(--green);color:#04210a;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;
    box-shadow:0 12px 30px -8px rgba(57,255,20,.5);opacity:0;transition:.28s;z-index:50}
  .toast.show{transform:translateX(-50%) translateY(0);opacity:1}
`;
const CARD_HTML = `<div class="deck" id="deck">
    <div class="grid">
      <!-- LEFT -->
      <div class="left">
        <div class="brandrow">
          <span class="brand">SHARP</span>
          <div class="pw" title="Power">
            <span class="pwcap">POWER</span>
            <button class="pwbtn" id="pwbtn" data-cmd="power"></button>
            <div class="onoff">
              <div class="marks"><span class="tophat short"></span><span class="tophat tall"></span></div>
              <div class="onofftxt"><span>ON</span><span>OFF</span></div>
            </div>
          </div>
        </div>
        <div class="apmshdr">APMS</div>
        <div class="numpad" style="margin-top:4px">
          <div class="numcell"><span class="numlbl">1</span><button class="btn slim" data-cmd="t1"></button></div>
          <div class="numcell"><span class="numlbl">2</span><button class="btn slim" data-cmd="t2"></button></div>
          <div class="numcell"><span class="numlbl">3</span><button class="btn slim" data-cmd="t3"></button></div>
          <div class="numcell"><span class="numlbl">4</span><button class="btn slim" data-cmd="t4"></button></div>
          <div class="numcell"><span class="numlbl">5</span><button class="btn slim" data-cmd="t5"></button></div>
          <div class="numcell"><span class="numlbl">6</span><button class="btn slim" data-cmd="t6"></button></div>
          <div class="numcell"><span class="numlbl">7</span><button class="btn slim" data-cmd="t7"></button></div>
          <div class="numcell"><span class="numlbl">CLEAR</span><button class="btn slim" data-cmd="clear"></button></div>
        </div>
        <div class="cap2">AUTOMATIC&nbsp;&nbsp;PROGRAMMABLE<br>MUSIC&nbsp;SELECTOR</div>
      </div>

      <!-- CENTER -->
      <div class="traywrap">
        <div class="tray" id="tray" data-cmd="eject">
          <div class="disc"></div>
          <div class="tstate" id="tstate">▲ TRAY OPEN ▲</div>
          <div class="emboss">OPEN ▸</div>
        </div>
        <div class="cap">Front Loading Door — tap to open / close</div>
      </div>

      <!-- RIGHT -->
      <div class="right">
        <div class="rtop">
          <div class="rcell"><span class="rlbl">SIDE A/B</span><button class="btn slate shortbtn" data-cmd="side"></button></div>
          <div class="rcell"><span class="rlbl">BOTH SIDES</span><button class="btn slate shortbtn" data-cmd="both"></button></div>
          <div class="rcell"><span class="rlbl">REPEAT</span><button class="btn slate tallbtn" data-cmd="repeat"></button></div>
          <div class="rcell"><span class="rlbl">LOADING</span><button class="btn tallbtn" data-cmd="eject"></button></div>
        </div>
        <div class="transportwrap">
          <div class="apmsbadge">APMS</div>
          <div class="apmsline"></div>
          <div class="transport">
          <div class="rcell"><span class="rlbl">FWD</span><button class="btn slim" data-cmd="next"></button></div>
          <div class="rcell"><span class="rlbl">REV</span><button class="btn slim" data-cmd="prev"></button></div>
          <div class="rcell"><span class="rlbl">CUE</span><button class="btn slim" data-cmd="pause"></button></div>
          <div class="rcell"><span class="rlbl">PLAY-CUT</span><button class="btn slim" data-cmd="play"></button></div>
          </div>
        </div>
        <div class="speedline" style="margin-top:12px">
          <div class="rcell"><span class="rlbl">SPEED</span><button class="btn slim" data-cmd="speed"></button></div>
          <span class="spdlight" id="spdLight"></span>
          <span class="cap" style="margin:0">45</span>
        </div>
      </div>
    </div>
  </div>

  

  `;

// data-cmd -> script suffix
const CMD_MAP = {
  power:  null,        // special: chooses power_on / power_off from state
  eject:  'tray',
  play:   'play',
  pause:  'pause',
  speed:  'speed',
  side:   'side',
  repeat: 'repeat',
  both:   'both_sides',
  next:   'skip_fwd',
  prev:   'skip_rev',
  clear:  'clear',
  t1:'track_1', t2:'track_2', t3:'track_3', t4:'track_4',
  t5:'track_5', t6:'track_6', t7:'track_7',
};

const E = {
  power: 'binary_sensor.turntable_power',
  speed: 'sensor.turntable_speed',
  tray:  'binary_sensor.turntable_tray_open',
};

class TurntableCard extends HTMLElement {
  constructor() {
    super();
    // attach shadow ONCE in constructor (safe; avoids double-attach errors in the app)
    this._root = this.attachShadow({ mode: 'open' });
  }
  setConfig(config) { this._config = config || {}; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); this._update(); }
  getCardSize() {
    try {
      const deck = this._root && this._root.querySelector('.deck');
      if (deck) { const h = deck.getBoundingClientRect().height; if (h) return Math.ceil(h/50); }
    } catch(e){}
    return 8;
  }
  // tell Sections/grid dashboards how much space we want
  getGridOptions() {
    // span the full width of whatever section/column it's placed in
    return { columns: 'full', rows: 'auto', min_columns: 1, max_columns: 12 };
  }

  _render() {
    if (this._built || !this._root) return;
    try {
      const style = document.createElement('style');
      style.textContent = CARD_CSS;
      const wrap = document.createElement('div');
      wrap.innerHTML = CARD_HTML;
      this._root.appendChild(style);
      this._root.appendChild(wrap);
      this._built = true;
      this._root.querySelectorAll('[data-cmd]').forEach(btn => {
        btn.addEventListener('click', () => this._onCmd(btn.dataset.cmd, btn));
      });
    } catch (e) {
      // never let a render error bubble up as a broken card
      console.error('turntable-card render error', e);
    }
  }

  _toast(msg) { /* popups disabled */ }
  _flash(el){ if(el && el.classList && el.classList.contains('btn')){ el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'),150);} }

  _state() {
    const h = this._hass; if (!h) return { power:false, speed:33, tray:false };
    const ps = h.states[E.power], ss = h.states[E.speed], ts = h.states[E.tray];
    return {
      power: ps ? ps.state === 'on' : false,
      speed: ss ? (parseInt(ss.state) || 33) : 33,
      tray:  ts ? ts.state === 'on' : false,
    };
  }

  _update() {
    if (!this._root || !this._built) return;
    const s = this._state();
    const deck = this._root.querySelector('.deck');
    if (deck) deck.classList.toggle('off', !s.power);
    const sl = this._root.getElementById('spdLight');
    if (sl) sl.classList.toggle('on', s.power && s.speed == 45);
    const tr = this._root.getElementById('tray');
    if (tr) tr.classList.toggle('open', s.tray);
  }

  _call(word) {
    if (!this._hass) return;
    this._hass.callService('script', 'turntable_' + word);
  }

  _onCmd(cmd, el) {
    this._flash(el);
    const s = this._state();
    if (cmd === 'power') { this._call(s.power ? 'power_off' : 'power_on'); return; }
    if (!s.power) { this._toast('Player is off'); return; }
    const word = CMD_MAP[cmd];
    if (word) this._call(word);
  }
}
customElements.define('turntable-card', TurntableCard);
window.customCards = window.customCards || [];
window.customCards.push({ type:'turntable-card', name:'Sharp RP-117 Turntable', description:'Custom turntable control panel' });
