(function () {
  const lesson = window.LESSON;
  const KEY = "yixuehui-demo-v1";
  const app = document.getElementById("app");

  function blankProblem() {
    return { solved: false, opened: false, gaveUp: false, move: null, hints: 0, done: [], active: null, shown: 1, feedback: null };
  }

  function load() {
    const state = { current: 0, problems: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved) Object.assign(state, saved);
    } catch (e) { /* storage may be unavailable */ }
    lesson.problems.forEach((p) => {
      state.problems[p.id] = Object.assign(blankProblem(), state.problems[p.id]);
    });
    return state;
  }

  let state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage may be unavailable */ }
  }

  function math(el) {
    if (window.renderMathInElement) {
      renderMathInElement(el, {
        delimiters: [{ left: "$", right: "$", display: false }],
        throwOnError: false,
      });
    }
  }

  function normalize(text) {
    return text.toLowerCase()
      .replace(/[\s（）()]/g, (c) => (c === "（" ? "(" : c === "）" ? ")" : c === " " ? "" : c))
      .replace(/\s/g, "")
      .replace(/＝/g, "=")
      .replace(/√|根号|sqrt/g, "sqrt")
      .replace(/sqrt\((\d+)\)/g, "sqrt$1");
  }

  function checkAnswer(problem, raw) {
    const value = normalize(raw);
    if (!value) return { kind: "warn", text: "先写下你的答案，错了也没关系。" };
    if (problem.accept.includes(value)) return { kind: "good", text: "答对了！这只是第一条路，地图上还有别的走法。" };
    if (problem.near[value]) return { kind: "warn", text: problem.near[value] };
    return { kind: "warn", text: "还不对。换个角度再试试，或者看一条提示。" };
  }

  function wires(count, side, doneList) {
    // Fan out from one terminal to each route; route rows are evenly spaced.
    let lines = "";
    for (let i = 0; i < count; i++) {
      const y = ((i + 0.5) / count) * 100;
      const d = side === "left"
        ? `M0 50 C 50 50, 50 ${y}, 100 ${y}`
        : `M0 ${y} C 50 ${y}, 50 50, 100 50`;
      lines += `<path d="${d}" class="${doneList.includes(i) ? "done" : ""}"></path>`;
    }
    return `<svg class="wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>`;
  }

  function renderHeader() {
    const total = lesson.problems.reduce((n, p) => n + p.paths.length, 0);
    const done = lesson.problems.reduce((n, p) => n + state.problems[p.id].done.length, 0);
    document.getElementById("bar").style.width = `${(done / total) * 100}%`;
    document.getElementById("count").textContent = `已走通 ${done} / ${total} 条路`;

    const tabs = document.getElementById("tabs");
    tabs.innerHTML = lesson.problems.map((p, i) => {
      const s = state.problems[p.id];
      return `<button class="tab" role="tab" aria-selected="${i === state.current}" data-tab="${i}">第 ${i + 1} 题<small>${p.tag} · ${s.done.length}/${p.paths.length}</small></button>`;
    }).join("");
  }

  function renderMap(p, s) {
    const routes = p.paths.map((path, i) => {
      const done = s.done.includes(i);
      const active = s.active === i;
      const label = s.opened ? path.name : `路线 ${i + 1}`;
      const sub = done ? "已走通" : s.opened ? "点击走这条路" : "尚未解锁";
      return `<button class="route ${done ? "done" : ""} ${active ? "active" : ""}" data-route="${i}" ${s.opened ? "" : "disabled"}>${label}<small>${sub}</small></button>`;
    }).join("");
    return `
      <section class="card">
        <h2>解法地图</h2>
        <p class="sub">从同一个已知条件出发，到同一个答案。</p>
        <div class="map">
          <div class="terminal">已知</div>
          ${wires(p.paths.length, "left", s.done)}
          <div class="routes">${routes}</div>
          ${wires(p.paths.length, "right", s.done)}
          <div class="terminal end ${s.solved ? "lit" : ""}">答案</div>
        </div>
        ${s.opened ? "" : `<p class="lockmsg">先自己想一想。答对后，或点“我卡住了”，地图就会打开。</p>`}
      </section>`;
  }

  function renderWalk(p, s) {
    if (s.active === null) return "";
    const path = p.paths[s.active];
    const steps = path.steps.slice(0, s.shown)
      .map((text, i) => `<li><span>${i + 1}</span><span>${text}</span></li>`).join("");
    const more = s.shown < path.steps.length;
    return `
      <section class="card walk" id="walk">
        <h3>${path.name}</h3>
        <p class="idea">${path.idea}</p>
        <ol class="steps">${steps}</ol>
        <div class="row">
          ${more
            ? `<button class="btn" data-act="next">下一步</button><button class="btn ghost" data-act="all">全部展开</button>`
            : `<button class="btn" data-act="finish">${s.done.includes(s.active) ? "收起这条路" : "我走通了这条路"}</button>`}
        </div>
        <p class="sub" style="margin:12px 0 0">先想下一步是什么，再点开对照。</p>
      </section>`;
  }

  function renderCompare(p, s) {
    if (s.done.length < 2) return "";
    const rows = s.done.slice().sort((a, b) => a - b).map((i) => {
      const path = p.paths[i];
      return `<tr><td><b>${path.name}</b></td><td>${path.idea}</td><td>${path.signal}</td></tr>`;
    }).join("");
    return `
      <section class="card compare">
        <h2>比一比你走过的路</h2>
        <p class="sub">下次遇到新题，什么线索会让你想到它？</p>
        <table><thead><tr><th>方法</th><th>关键想法</th><th>什么时候想到它</th></tr></thead><tbody>${rows}</tbody></table>
      </section>`;
  }

  function renderProblem() {
    const p = lesson.problems[state.current];
    const s = state.problems[p.id];
    const moves = p.moves.map((m, i) =>
      `<button class="move" aria-pressed="${s.move === i}" data-move="${i}">${m.text}</button>`).join("");
    const hints = p.hints.slice(0, s.hints)
      .map((h, i) => `<div class="hint"><b>提示 ${i + 1}</b>${h}</div>`).join("");
    const nextIndex = state.current + 1;
    const allDone = s.done.length === p.paths.length;

    app.innerHTML = `
      <section class="card"><p class="statement">${p.statement}</p></section>
      <section class="card">
        <h2>看到这道题，你第一步想怎么做？</h2>
        <p class="sub">没有唯一正确的选择，选一个开始想。</p>
        <div class="moves">${moves}</div>
        ${s.move !== null ? `<div class="note">${p.moves[s.move].reply}</div>` : ""}
      </section>
      <section class="card">
        <h2>写下你的答案</h2>
        ${s.solved
          ? `<div class="feedback good">答案：${p.answerText}。${s.gaveUp ? "试着不看解法，再用另一条路走一遍。" : "这只是第一条路，地图上还有别的走法。"}</div>`
          : `<form class="answer" id="answer">
               <input id="answerInput" aria-label="你的答案" autocomplete="off" placeholder="例如 √7 或 12">
               <button class="btn" type="button" data-act="sqrt" aria-label="输入根号">√</button>
               <button class="btn" type="submit">提交</button>
             </form>
             ${s.feedback ? `<div class="feedback ${s.feedback.kind}" role="status">${s.feedback.text}</div>` : ""}`}
        ${hints ? `<div style="margin-top:12px">${hints}</div>` : ""}
        <div class="row">
          ${s.hints < p.hints.length ? `<button class="btn ghost small" data-act="hint">看一条提示（${s.hints}/${p.hints.length}）</button>` : ""}
          ${s.opened ? "" : `<button class="btn ghost small" data-act="stuck">我卡住了，打开地图</button>`}
        </div>
      </section>
      ${renderMap(p, s)}
      ${renderWalk(p, s)}
      ${renderCompare(p, s)}
      ${allDone && nextIndex < lesson.problems.length
        ? `<div class="row" style="margin-bottom:14px"><button class="btn" data-act="nextProblem">所有路都走通了，去第 ${nextIndex + 1} 题</button></div>`
        : ""}
    `;
    math(app);
  }

  function render() {
    renderHeader();
    renderProblem();
    save();
  }

  function scrollToWalk() {
    const walk = document.getElementById("walk");
    if (walk) walk.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  app.addEventListener("submit", (event) => {
    event.preventDefault();
    const p = lesson.problems[state.current];
    const s = state.problems[p.id];
    const result = checkAnswer(p, document.getElementById("answerInput").value);
    s.feedback = result;
    if (result.kind === "good") { s.solved = true; s.opened = true; }
    render();
  });

  app.addEventListener("click", (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    const p = lesson.problems[state.current];
    const s = state.problems[p.id];
    if (target.dataset.move !== undefined) {
      s.move = Number(target.dataset.move);
      render();
    } else if (target.dataset.route !== undefined) {
      s.active = Number(target.dataset.route);
      s.shown = s.done.includes(s.active) ? p.paths[s.active].steps.length : 1;
      render();
      scrollToWalk();
    } else if (target.dataset.act) {
      const act = target.dataset.act;
      if (act === "sqrt") {
        const input = document.getElementById("answerInput");
        input.value += "√";
        input.focus();
        return;
      }
      if (act === "hint") s.hints += 1;
      if (act === "stuck") { s.opened = true; s.gaveUp = true; }
      if (act === "next") s.shown += 1;
      if (act === "all") s.shown = p.paths[s.active].steps.length;
      if (act === "finish") {
        if (!s.done.includes(s.active)) s.done.push(s.active);
        s.active = null;
        // A student who reads a full path through has seen the answer.
        s.solved = true;
      }
      if (act === "nextProblem") {
        state.current += 1;
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      render();
    }
  });

  document.getElementById("tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (!tab) return;
    state.current = Number(tab.dataset.tab);
    render();
  });

  document.getElementById("reset").addEventListener("click", () => {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage may be unavailable */ }
    state = load();
    state.current = 0;
    lesson.problems.forEach((p) => { state.problems[p.id] = blankProblem(); });
    render();
    window.scrollTo({ top: 0 });
  });

  document.getElementById("intro").textContent = lesson.intro;
  document.getElementById("glossary").innerHTML =
    `<thead><tr><th>中文</th><th>日本語</th><th>English</th></tr></thead><tbody>` +
    lesson.glossary.map((g) => `<tr><td>${g.zh}</td><td>${g.ja}</td><td>${g.en}</td></tr>`).join("") +
    `</tbody>`;

  // The KaTeX scripts load before this file, so the first render can use them.
  render();
})();
