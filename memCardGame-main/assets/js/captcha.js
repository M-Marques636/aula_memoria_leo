(function () {
  const rnd = (a, b) => Math.random() * (b - a) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => arr.sort(() => Math.random() - 0.5);

  document.body.classList.add("locked");
  const root = document.createElement("div");
  root.className = "cp-overlay";
  root.innerHTML = `<div class="cp-box">
    <div class="cp-head"><b id="cp-title"></b><span id="cp-step"></span></div>
    <div class="cp-body" id="cp-body"></div>
    <div class="cp-foot"><span id="cp-msg"></span><button class="cp-btn" id="cp-btn">Verificar</button></div>
  </div>`;
  document.body.appendChild(root);
  const $ = id => document.getElementById(id);
  const box = root.querySelector(".cp-box"), body = $("cp-body"), msg = $("cp-msg"), btn = $("cp-btn");

  function say(t, cls) { msg.textContent = t; msg.className = cls || ""; }
  function fail(t) {
    say(t, "err");
    box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
  }

  /* ---------- Nível 1: "Não sou um robô" ---------- */
  function level1(api) {
    body.innerHTML = `<label class="cp-check"><span class="cp-cb"></span><span>Não sou um robô</span></label>`;
    const cb = body.querySelector(".cp-cb"); let busy = false;
    body.querySelector(".cp-check").onclick = () => {
      if (busy) return; busy = true;
      cb.classList.add("spin"); say("Verificando…");
      setTimeout(() => { cb.classList.remove("spin"); cb.classList.add("ok"); api.pass(); }, 1500);
    };
  }

  /* ---------- Nível 2: texto distorcido ---------- */
  function level2(api) {
    body.innerHTML = `<p class="cp-hint">Digite os caracteres da imagem (diferencia maiúsculas de minúsculas)</p>
      <canvas width="280" height="90"></canvas>
      <div class="cp-row"><input id="cp-in" autocomplete="off" autocapitalize="off" spellcheck="false"><button id="cp-re" title="Novo código">↻</button></div>`;
    const cv = body.querySelector("canvas"), c = cv.getContext("2d");
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabdefghjkmnpqrty23456789";
    let code = "";
    function draw() {
      code = Array.from({ length: 7 }, () => pick([...chars])).join("");
      c.fillStyle = "#eef0f4"; c.fillRect(0, 0, 280, 90);
      for (let i = 0; i < 6; i++) {
        c.strokeStyle = `hsl(${rnd(0, 360)},40%,60%)`; c.lineWidth = rnd(1, 3); c.beginPath();
        c.moveTo(0, rnd(0, 90)); c.bezierCurveTo(rnd(0, 280), rnd(0, 90), rnd(0, 280), rnd(0, 90), 280, rnd(0, 90)); c.stroke();
      }
      [...code].forEach((ch, i) => {
        c.save(); c.translate(18 + i * 36, 55 + rnd(-10, 10)); c.rotate(rnd(-0.6, 0.6));
        c.font = `${Math.round(rnd(30, 46))}px serif`; c.fillStyle = `hsl(${rnd(0, 360)},50%,28%)`; c.fillText(ch, 0, 0); c.restore();
      });
      for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(0,0,0,${rnd(.1, .4)})`; c.fillRect(rnd(0, 280), rnd(0, 90), 2, 2); }
    }
    draw();
    $("cp-re").onclick = () => { draw(); $("cp-in").value = ""; };
    api.check = () => {
      if ($("cp-in").value === code) return true;
      draw(); $("cp-in").value = ""; return "Código incorreto. Tente novamente.";
    };
  }

  /* ---------- Nível 3: grade de imagens (3 rodadas) ---------- */
  function level3(api) {
    const rounds = [
      { t: "🚦", label: "semáforos" },
      { t: "🚲", label: "bicicletas" },
      { t: "🚦", label: "tudo que NÃO é um semáforo", neg: true }
    ];
    const pool = ["🚗", "🚌", "🏍️", "🚲", "🌳", "🏠", "🛑", "🚧", "🚦", "🐕", "🔥"];
    let r = 0, tiles = [], sel = new Set();
    function build() {
      const R = rounds[r];
      sel = new Set();
      tiles = Array(9).fill(null);
      const idx = shuffle([...Array(9).keys()]);
      for (let i = 0; i < 3; i++) tiles[idx[i]] = R.t;
      for (let i = 0; i < 9; i++) if (!tiles[i]) tiles[i] = pick(pool.filter(e => e !== R.t));
      body.innerHTML = `<p class="cp-hint">Selecione todas as imagens com <b>${R.label}</b>.<br><small>Rodada ${r + 1} de ${rounds.length}</small></p><div class="cp-grid"></div>`;
      const g = body.querySelector(".cp-grid");
      tiles.forEach((e, i) => {
        const d = document.createElement("div"); d.className = "cp-tile"; d.textContent = e;
        d.onclick = () => { sel.has(i) ? sel.delete(i) : sel.add(i); d.classList.toggle("sel"); };
        g.appendChild(d);
      });
    }
    build();
    api.check = () => {
      const R = rounds[r];
      const ok = tiles.every((e, i) => sel.has(i) === (R.neg ? e !== R.t : e === R.t));
      if (!ok) { build(); return "Seleção incorreta. Novas imagens carregadas."; }
      if (++r < rounds.length) { say("Carregando novas imagens…"); setTimeout(() => { build(); say(""); }, 700); return "wait"; }
      return true;
    };
  }

  /* ---------- Nível 4: peça de quebra-cabeça (mouse "calibrado") ---------- */
  function level4(api) {
    const target = Math.round(rnd(110, 230));
    body.innerHTML = `<p class="cp-hint">Deslize para encaixar a peça no espaço vazio</p>
      <div class="cp-puzzle"><div class="cp-hole" style="left:${target}px"></div><div class="cp-piece"></div></div>
      <input class="cp-range" type="range" min="0" max="240" value="0" step="1">`;
    const piece = body.querySelector(".cp-piece"), rg = body.querySelector("input");
    const pos = v => Math.round(v * v / 240); // detecção de bots: o movimento nunca é linear
    rg.oninput = () => { piece.style.left = pos(+rg.value) + "px"; };
    rg.onchange = () => {
      if (Math.abs(pos(+rg.value) - target) <= 4) { say("Verificado", "ok"); api.pass(); }
      else { fail("A peça não encaixou. Tente novamente."); rg.value = 0; piece.style.left = "0px"; }
    };
  }

  /* ---------- Nível 5: o checkbox que desconfia de você ---------- */
  function level5(api) {
    body.innerHTML = `<div class="cp-arena"><label class="cp-check" style="left:0;top:30px"><span class="cp-cb"></span><span>Não sou um robô</span></label></div>`;
    const el = body.querySelector(".cp-check"), cb = body.querySelector(".cp-cb");
    const lines = ["Movimento muito preciso detectado.", "Humanos tremem. Você não tremeu.", "Clique rápido demais. Suspeito.", "Quase. Tente parecer mais cansado."];
    let dodges = 0, busy = false;
    function dodge() {
      if (dodges >= lines.length || busy) return;
      el.style.left = rnd(0, 70) + "px"; el.style.top = rnd(0, 70) + "px";
      fail(lines[dodges++]);
    }
    el.onpointerenter = dodge; el.onpointerdown = dodge;
    el.onclick = () => {
      if (dodges < lines.length || busy) return; busy = true;
      cb.classList.add("spin"); say("Analisando sua humanidade…");
      setTimeout(() => { cb.classList.remove("spin"); cb.classList.add("ok"); say("Você é humano. Provavelmente.", "ok"); api.pass(); }, 2200);
    };
  }

  const levels = [
    { title: "Verificação de segurança", fn: level1, auto: true },
    { title: "Digite o texto da imagem", fn: level2 },
    { title: "Selecione as imagens", fn: level3 },
    { title: "Quebra-cabeça de segurança", fn: level4, auto: true },
    { title: "Última verificação", fn: level5, auto: true }
  ];
  let cur = 0;

  function load() {
    const L = levels[cur];
    $("cp-title").textContent = L.title;
    $("cp-step").textContent = `${cur + 1}/${levels.length}`;
    say(""); btn.hidden = !!L.auto;
    const api = {
      check: null,
      pass() { setTimeout(next, 900); }
    };
    L.fn(api);
    btn.onclick = () => {
      const res = api.check();
      if (res === true) { say("Verificado", "ok"); next(); }
      else if (res !== "wait") fail(res);
    };
  }

  function next() {
    if (++cur < levels.length) return load();
    root.classList.add("out");
    document.body.classList.remove("locked");
    setTimeout(() => root.remove(), 600);
  }

  load();
})();
