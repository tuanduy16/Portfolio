(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel) => document.querySelector(sel);

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- boot sequence (once per session) ---------- */
  const boot = $("#boot");
  let seenBoot = false;
  try { seenBoot = sessionStorage.getItem("booted") === "1"; } catch (_) {}

  async function runBoot() {
    const log = $("#boot-log");
    const lines = [
      "DP-OS v26.10 // neural link handshake",
      "loading kernel modules ........ <span class='ok'>[ok]</span>",
      "mounting /experience .......... <span class='ok'>[ok]</span>",
      "spawning agents (5) ........... <span class='ok'>[ok]</span>",
      "calibrating neon .............. <span class='ok'>[ok]</span>",
      "",
      "welcome, guest.",
    ];
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      boot.classList.add("fade");
      setTimeout(() => boot.classList.remove("on", "fade"), 400);
      try { sessionStorage.setItem("booted", "1"); } catch (_) {}
    };
    $("#boot-skip").addEventListener("click", finish);
    document.addEventListener("keydown", finish, { once: true });
    boot.classList.add("on");
    for (const l of lines) {
      if (done) return;
      log.innerHTML += l + "\n";
      await sleep(170);
    }
    await sleep(350);
    finish();
  }
  if (!seenBoot && !reduceMotion) runBoot();

  /* ---------- role typer ---------- */
  const roles = ["aspiring software engineer", "backend + fullstack engineer", "problem solver", "always learning"];
  const typer = $("#role-typer");
  if (!reduceMotion) {
    (async () => {
      let i = 0;
      await sleep(1600);
      for (;;) {
        const word = roles[i % roles.length];
        for (let n = typer.textContent.length; n >= 0; n--) { typer.textContent = typer.textContent.slice(0, n); await sleep(28); }
        for (let n = 1; n <= word.length; n++) { typer.textContent = word.slice(0, n); await sleep(55); }
        await sleep(2200);
        i++;
      }
    })();
  }

  /* ---------- reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    const revealTargets = document.querySelectorAll(".panel, .section-title, .archive");
    revealTargets.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    revealTargets.forEach((el) => io.observe(el));
  }

  /* ---------- Voyagent orchestration sim ---------- */
  const stage = $("#sim-stage");
  const svg = $("#sim-wires");
  const core = $("#node-core");
  const agents = [...stage.querySelectorAll(".node.agent")];
  const simLog = $("#sim-log");
  const NS = "http://www.w3.org/2000/svg";
  const wires = {};
  let centers = {};

  function layout() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const cx = w / 2, cy = h / 2;
    const rx = Math.min(w * 0.36, 210), ry = h * 0.36;
    core.style.left = cx + "px";
    core.style.top = cy + "px";
    centers = { orchestrator: [cx, cy] };
    svg.innerHTML = "";
    agents.forEach((a, i) => {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / agents.length;
      const x = cx + rx * Math.cos(ang), y = cy + ry * Math.sin(ang);
      a.style.left = x + "px";
      a.style.top = y + "px";
      centers[a.dataset.agent] = [x, y];
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", cx); line.setAttribute("y1", cy);
      line.setAttribute("x2", x); line.setAttribute("y2", y);
      svg.appendChild(line);
      wires[a.dataset.agent] = line;
    });
  }
  layout();
  window.addEventListener("resize", layout);

  const node = (name) => (name === "orchestrator" ? core : stage.querySelector(`[data-agent="${name}"]`));
  const setState = (name, state) => {
    const n = node(name);
    n.classList.remove("busy", "done", "warn");
    if (state) n.classList.add(state);
  };
  const say = (html) => {
    simLog.innerHTML += "\n" + html;
    simLog.scrollTop = simLog.scrollHeight;
  };

  function packet(from, to, ms = 650) {
    return new Promise((resolve) => {
      const [x1, y1] = centers[from], [x2, y2] = centers[to];
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", 4);
      svg.appendChild(dot);
      const wire = wires[from === "orchestrator" ? to : from];
      wire && wire.classList.add("hot");
      const start = performance.now();
      const step = (t) => {
        const p = Math.min((t - start) / ms, 1);
        dot.setAttribute("cx", x1 + (x2 - x1) * p);
        dot.setAttribute("cy", y1 + (y2 - y1) * p);
        if (p < 1) return requestAnimationFrame(step);
        dot.remove();
        wire && wire.classList.remove("hot");
        resolve();
      };
      requestAnimationFrame(step);
    });
  }

  async function runAgent(name, msg, minMs, maxMs) {
    await packet("orchestrator", name);
    setState(name, "busy");
    await sleep(minMs + Math.random() * (maxMs - minMs));
    say(`<span class="c">[${name}]</span> ${msg}`);
    await packet(name, "orchestrator");
    setState(name, "done");
  }

  let simRunning = false;
  const runBtn = $("#sim-run");
  runBtn.addEventListener("click", async () => {
    if (simRunning) return;
    simRunning = true;
    runBtn.disabled = true;
    layout();
    ["orchestrator", ...agents.map((a) => a.dataset.agent)].forEach((n) => setState(n, null));
    simLog.innerHTML = '<span class="y">&gt; request:</span> tokyo · 5 days · budget $2,500 · food, temples';
    await sleep(500);
    setState("orchestrator", "busy");
    say('<span class="y">[orchestrator]</span> asyncio.gather → dispatching 5 specialist agents');

    await Promise.all([
      runAgent("weather", "open-meteo forecast fetched", 500, 900),
      runAgent("activities", "wikipedia + openstreetmap → candidate spots ranked", 900, 1500),
      runAgent("flights", "serpapi → flight options collected", 800, 1400),
      runAgent("hotels", "serpapi → hotel options collected", 800, 1400),
      runAgent("pricing", "ecb exchange rates → usd/jpy loaded", 400, 800),
    ]);

    setState("orchestrator", "warn");
    say('<span class="m">[budget]</span> plan total $2,840 &gt; $2,500 ✗ over budget');
    await sleep(700);
    setState("orchestrator", "busy");
    say('<span class="y">[orchestrator]</span> feedback loop → re-run flights + hotels under price caps');
    setState("flights", null);
    setState("hotels", null);
    await Promise.all([
      runAgent("flights", "cheaper fare found under cap", 600, 1000),
      runAgent("hotels", "hotel swapped under cap", 600, 1000),
    ]);
    say('<span class="c">[budget]</span> plan total $2,410 ≤ $2,500 ✓');
    await sleep(400);
    say('<span class="c">[validate]</span> pydantic schema ok · unverified links dropped');
    await sleep(400);
    setState("orchestrator", "done");
    say('<span class="y">&gt; itinerary ready:</span> 5 days, booking links attached');
    say('<span class="m">// simulated run, illustrative only. real code on github.</span>');
    simRunning = false;
    runBtn.disabled = false;
    runBtn.textContent = "↻ run again";
  });

  /* ---------- DAYS command wall ---------- */
  const cmds = [...document.querySelectorAll("#cmd-wall li")];
  if (!reduceMotion && cmds.length) {
    let i = 0;
    setInterval(() => {
      cmds.forEach((c) => c.classList.remove("lit"));
      cmds[i % cmds.length].classList.add("lit");
      i++;
    }, 700);
  }

})();
