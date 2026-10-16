
"use client";

import { useEffect, useRef, useState } from "react";

const WORLD = 2800;
const FLOOR = 420;

type Enemy = { x: number; alive: boolean };
type Coin = { x: number; y: number; taken: boolean };

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);
  const [result, setResult] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = 900;
    canvas.height = 500;

    const keys = new Set<string>();

    let player = {
      x: 60, y: 300, vx: 0, vy: 0,
      w: 28, h: 38, grounded: false,
      face: 1, attack: 0, invincible: 0,
    };

    const platforms = [
      { x: 0, y: FLOOR, w: 580, h: 80 },
      { x: 680, y: FLOOR, w: 450, h: 80 },
      { x: 1230, y: FLOOR, w: 500, h: 80 },
      { x: 1840, y: FLOOR, w: 420, h: 80 },
      { x: 2370, y: FLOOR, w: 430, h: 80 },
      { x: 230, y: 340, w: 130, h: 16 },
      { x: 420, y: 280, w: 130, h: 16 },
      { x: 790, y: 340, w: 130, h: 16 },
      { x: 990, y: 290, w: 120, h: 16 },
      { x: 1350, y: 340, w: 150, h: 16 },
      { x: 1580, y: 280, w: 120, h: 16 },
      { x: 1940, y: 340, w: 150, h: 16 },
      { x: 2160, y: 290, w: 130, h: 16 },
      { x: 2470, y: 340, w: 150, h: 16 },
    ];

    let enemies: Enemy[] = [
      { x: 350, alive: true },
      { x: 840, alive: true },
      { x: 1430, alive: true },
      { x: 2000, alive: true },
      { x: 2490, alive: true },
    ];

    let coins: Coin[] = Array.from({ length: 22 }, (_, i) => ({
      x: 150 + i * 120,
      y: i % 2 === 0 ? 380 : 310,
      taken: false,
    }));

    let camera = 0;
    let scoreValue = 0;
    let health = 3;
    let frame = 0;
    let mode = "ready";
    let jumpHeld = false;
    let attackHeld = false;
    let last = 0;
    let raf = 0;

    const reset = () => {
      player = {
        x: 60, y: 300, vx: 0, vy: 0,
        w: 28, h: 38, grounded: false,
        face: 1, attack: 0, invincible: 0,
      };
      enemies = [
        { x: 350, alive: true },
        { x: 840, alive: true },
        { x: 1430, alive: true },
        { x: 2000, alive: true },
        { x: 2490, alive: true },
      ];
      coins = Array.from({ length: 22 }, (_, i) => ({
        x: 150 + i * 120,
        y: i % 2 === 0 ? 380 : 310,
        taken: false,
      }));
      camera = 0;
      scoreValue = 0;
      health = 3;
      frame = 0;
      mode = "playing";
      jumpHeld = false;
      attackHeld = false;
      setScore(0);
      setHp(3);
      setResult("");
    };

    const rect = (
      x: number, y: number, w: number, h: number, color: string
    ) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };

    const overlap = (
      a: { x: number; y: number; w: number; h: number },
      b: { x: number; y: number; w: number; h: number }
    ) =>
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y;

    function update() {
      if (mode !== "playing") return;
      frame++;

      const left = keys.has("arrowleft") || keys.has("a");
      const right = keys.has("arrowright") || keys.has("d");
      const jump = keys.has(" ") || keys.has("arrowup") || keys.has("w");
      const attack = keys.has("x") || keys.has("j");

      if (left) {
        player.vx -= 0.7;
        player.face = -1;
      }
      if (right) {
        player.vx += 0.7;
        player.face = 1;
      }
      if (!left && !right) player.vx *= 0.8;
      player.vx = Math.max(-5, Math.min(5, player.vx));

      if (jump && player.grounded && !jumpHeld) {
        player.vy = -13;
        player.grounded = false;
      }
      jumpHeld = jump;

      if (attack && !attackHeld && player.attack <= 0) {
        player.attack = 14;
      }
      attackHeld = attack;

      if (player.attack > 0) player.attack--;
      if (player.invincible > 0) player.invincible--;

      const oldY = player.y;
      player.x += player.vx;
      player.x = Math.max(0, Math.min(WORLD - player.w, player.x));
      player.vy = Math.min(13, player.vy + 0.6);
      player.y += player.vy;
      player.grounded = false;

      for (const p of platforms) {
        if (
          player.vy >= 0 &&
          oldY + player.h <= p.y &&
          player.y + player.h >= p.y &&
          player.x + player.w > p.x &&
          player.x < p.x + p.w
        ) {
          player.y = p.y - player.h;
          player.vy = 0;
          player.grounded = true;
        }
      }

      for (const c of coins) {
        if (!c.taken && overlap(player, {
          x: c.x - 9, y: c.y - 9, w: 18, h: 18,
        })) {
          c.taken = true;
          scoreValue += 100;
        }
      }

      for (const e of enemies) {
        if (!e.alive) continue;

        const enemyY = FLOOR - 30;
        e.x += Math.sin(frame * 0.025 + e.x) * 0.6;

        const enemyBox = { x: e.x, y: enemyY, w: 30, h: 30 };
        const distance = player.face > 0
          ? e.x - (player.x + player.w)
          : player.x - (e.x + 30);

        const inRange =
          distance >= -4 &&
          distance < 48 &&
          Math.abs(player.y - enemyY) < 45;

        if (player.attack > 0 && inRange) {
          e.alive = false;
          scoreValue += 250;
        } else if (
          overlap(player, enemyBox) &&
          player.invincible <= 0
        ) {
          if (player.vy > 1 && oldY + player.h < enemyY + 15) {
            e.alive = false;
            player.vy = -9;
            scoreValue += 200;
          } else {
            health--;
            player.invincible = 90;
            player.vy = -7;
            player.vx = player.x < e.x ? -6 : 6;
            if (health <= 0) {
              mode = "over";
              setResult("GAME OVER");
            }
          }
        }
      }

      if (player.y > 650) {
        health--;
        if (health <= 0) {
          mode = "over";
          setResult("GAME OVER");
        } else {
          player.x = Math.max(20, camera + 30);
          player.y = 250;
          player.vy = 0;
          player.invincible = 90;
        }
      }

      if (player.x >= WORLD - 100) {
        mode = "clear";
        scoreValue += health * 500;
        setResult("STAGE CLEAR!");
      }

      camera = Math.max(0, Math.min(WORLD - 900, player.x - 300));

      if (frame % 6 === 0) {
        setScore(scoreValue);
        setHp(health);
      }
    }

    function draw() {
      const sky = ctx.createLinearGradient(0, 0, 0, 500);
      sky.addColorStop(0, "#080c22");
      sky.addColorStop(1, "#24113f");
      rect(0, 0, 900, 500, "#080c22");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 900, 500);

      for (let i = 0; i < 75; i++) {
        const x = ((i * 137 - camera * 0.2) % 900 + 900) % 900;
        const y = (i * 67) % 300;
        rect(x, y, 2, 2, "#8af7ff");
      }

      for (let i = 0; i < 14; i++) {
        const x = i * 100 - (camera * 0.3) % 100;
        const h = 90 + (i * 43) % 140;
        rect(x, FLOOR - h, 65, h, "#111b40");
        for (let y = FLOOR - h + 15; y < FLOOR - 10; y += 22) {
          rect(x + 12, y, 5, 8, "#30416e");
          rect(x + 32, y, 5, 8, "#30416e");
        }
      }

      ctx.save();
      ctx.translate(-camera, 0);

      for (const p of platforms) {
        rect(p.x, p.y, p.w, p.h, "#171c3b");
        rect(p.x, p.y, p.w, 5, "#36f3ff");
        rect(p.x, p.y + 5, p.w, 3, "#8855ff");
      }

      for (const c of coins) {
        if (c.taken) continue;
        const bob = Math.sin(frame * 0.08 + c.x) * 4;
        ctx.beginPath();
        ctx.arc(c.x, c.y + bob, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd85a";
        ctx.shadowColor = "#ffbb33";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      for (const e of enemies) {
        if (!e.alive) continue;
        rect(e.x, FLOOR - 30, 30, 30, "#ff397e");
        rect(e.x + 5, FLOOR - 22, 7, 6, "#fff");
        rect(e.x + 19, FLOOR - 22, 7, 6, "#fff");
        rect(e.x + 7, FLOOR - 10, 16, 3, "#80154b");
      }

      ctx.strokeStyle = "#ad8aff";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#8b5cf6";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.ellipse(WORLD - 55, FLOOR - 40, 22, 40, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (player.invincible <= 0 || frame % 8 < 4) {
        ctx.shadowColor = "#39f5ff";
        ctx.shadowBlur = 18;
        rect(player.x, player.y, player.w, player.h, "#39eaff");
        ctx.shadowBlur = 0;
        rect(
          player.x + (player.face > 0 ? 18 : 3),
          player.y + 8, 7, 7, "#13233f"
        );
        rect(player.x + 5, player.y + 30, 7, 8, "#9b63ff");
        rect(player.x + 17, player.y + 30, 7, 8, "#9b63ff");

        if (player.attack > 0) {
          ctx.fillStyle = "#fff";
          ctx.shadowColor = "#8af7ff";
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(
            player.x + player.w / 2 + player.face * 35,
            player.y + 20, 20, 0, Math.PI * 2
          );
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();

      rect(16, 16, 225, 75, "rgba(4,8,25,.85)");
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px monospace";
      ctx.fillText("NEON QUEST", 28, 40);
      ctx.fillStyle = "#83f8ff";
      ctx.font = "14px monospace";
      ctx.fillText(`SCORE ${scoreValue}`, 28, 63);
      ctx.fillStyle = "#ff638f";
      ctx.fillText(`HP ${"♥ ".repeat(Math.max(0, health))}`, 28, 82);

      if (mode === "playing") {
        ctx.fillStyle = "#aab9e8";
        ctx.font = "12px monospace";
        ctx.fillText("MOVE: ← →   JUMP: SPACE   ATTACK: X", 530, 28);
      }

      if (mode === "clear" || mode === "over") {
        rect(0, 0, 900, 500, "rgba(4,6,20,.78)");
        ctx.fillStyle = mode === "clear" ? "#70faff" : "#ff548b";
        ctx.textAlign = "center";
        ctx.font = "bold 42px monospace";
        ctx.fillText(mode === "clear" ? "STAGE CLEAR!" : "GAME OVER", 450, 230);
        ctx.fillStyle = "#fff";
        ctx.font = "18px monospace";
        ctx.fillText(`FINAL SCORE: ${scoreValue}`, 450, 270);
        ctx.textAlign = "left";
      }

      if (mode === "ready") {
        rect(0, 0, 900, 500, "rgba(4,6,20,.65)");
        ctx.fillStyle = "#75faff";
        ctx.textAlign = "center";
        ctx.font = "bold 42px monospace";
        ctx.fillText("NEON QUEST", 450, 210);
        ctx.fillStyle = "#fff";
        ctx.font = "17px monospace";
        ctx.fillText("RUN  /  JUMP  /  FIGHT", 450, 250);
        ctx.textAlign = "left";
      }
    }

    const keyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ([" ", "arrowleft", "arrowright", "arrowup"].includes(k)) {
        e.preventDefault();
      }
      keys.add(k);
    };

    const keyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    const onStart = () => {
      reset();
    };

    const loop = (now: number) => {
      const dt = last ? Math.min((now - last) / 16.667, 3) : 1;
      last = now;

      if (mode === "playing") {
        const steps = Math.max(1, Math.round(dt));
        for (let i = 0; i < steps; i++) update();
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("neon-start", onStart);
    reset();
    mode = "ready";
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("neon-start", onStart);
    };
  }, []);

  return (
    <main style={{
      minHeight: "100vh", background: "#080b1d", color: "#f3f5ff",
      fontFamily: "Arial, sans-serif", padding: "24px 16px",
    }}>
      <header style={{
        maxWidth: 1000, margin: "0 auto 32px",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", color: "#83f8ff",
      }}>
        <strong style={{ letterSpacing: 3 }}>✦ NEON QUEST</strong>
        <span style={{ fontSize: 12, color: "#929dc7" }}>ARCADE EDITION / 001</span>
      </header>

      <section style={{ maxWidth: 1000, margin: "0 auto 28px" }}>
        <p style={{ color: "#9b78ff", letterSpacing: 4, fontSize: 12 }}>
          A CYBERPUNK PLATFORM ADVENTURE
        </p>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", margin: "10px 0" }}>
          ENTER THE <span style={{ color: "#65f6ff" }}>NEON</span>
        </h1>
        <p style={{ color: "#aab4da" }}>
          Run. Jump. Fight. Escape the digital frontier.
        </p>
      </section>

      <section style={{
        maxWidth: 1000, margin: "0 auto", border: "1px solid #27375c",
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 0 40px #34206a55",
      }}>
        <div style={{
          padding: "14px 18px", background: "#111630",
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, fontSize: 13,
        }}>
          <span style={{ color: "#65f6ff" }}>● LIVE GAME</span>
          <span>SCORE <b>{score}</b>　 COINS / BONUS　 HP <b style={{ color: "#ff638f" }}>{"♥ ".repeat(hp)}</b></span>
        </div>

        <div style={{ position: "relative", background: "#080c22", lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "auto", display: "block" }}
            aria-label="NEON QUEST game"
          />
          {!started && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", justifyContent: "center",
              alignItems: "center", textAlign: "center",
              background: "rgba(5,8,25,.65)", padding: 20,
            }}>
              <h2 style={{ color: "#8af7ff", fontSize: 30, margin: 8 }}>
                {result || "FIND THE EXIT"}
              </h2>
              <p style={{ color: "#d0d8ff", lineHeight: 1.6 }}>
                Collect coins, defeat enemies, and reach the portal.
              </p>
              <button
                onClick={() => {
                  setStarted(true);
                  setResult("");
                  window.dispatchEvent(new Event("neon-start"));
                }}
                style={{
                  background: "#65f6ff", color: "#080b1d",
                  padding: "14px 28px", border: 0, borderRadius: 6,
                  fontWeight: 800, cursor: "pointer", fontSize: 15,
                }}
              >
                ▶ START GAME
              </button>
            </div>
          )}
        </div>
      </section>

      <section style={{
        maxWidth: 1000, margin: "24px auto",
        display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: 14,
      }}>
        {[
          ["01 / EXPLORE", "Neon Frontier", "Run through a futuristic city and leap across platforms."],
          ["02 / COMBAT", "Fight Back", "Attack enemies with X or jump on them."],
          ["03 / COLLECT", "Chase The Score", "Collect coins and reach the glowing exit portal."],
        ].map(([tag, title, description]) => (
          <article key={tag} style={{
            background: "#10152d", border: "1px solid #283456",
            padding: 20, borderRadius: 10,
          }}>
            <small style={{ color: "#8b7aff" }}>{tag}</small>
            <h3>{title}</h3>
            <p style={{ color: "#aab4da", lineHeight: 1.7, fontSize: 14 }}>
              {description}
            </p>
          </article>
        ))}
      </section>

      <footer style={{
        maxWidth: 1000, margin: "40px auto 0",
        borderTop: "1px solid #242d4d", paddingTop: 20,
        color: "#818db8", fontSize: 12,
      }}>
        NEON QUEST © 2026 — BUILT FOR THE NEXT LEVEL
      </footer>
    </main>
  );
}
