/* Live previews for the project tiles on the homepage.
   Each preview only animates while it is on screen, and holds a single
   still frame for visitors who ask for reduced motion. */
(function () {
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const requestAnimationFrame = reduceMotion ? function () { return 0; } : window.requestAnimationFrame.bind(window);

(function() {
      const cvs = document.getElementById('glyphPreview');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let running = false, angle = 0, frame = 0;
      const chars = '@#$%&WBMRXoahkbdpqwmZOQ8062ESLCJUYX/|()[]{}?!;:,.*^~-_+=<> ';
      // Rainbow palette matching GLYPH's default
      const palette = [
        '#ff4444','#ff6b35','#ffa500','#ffcc00','#ffe44d',
        '#88dd44','#44bb44','#22ccaa','#22aadd','#4488ff',
        '#6655ff','#8844ee','#aa44cc','#cc44aa','#ff4488'
      ];

      function project(x, y, z) {
        const s = 3.5 / (3.5 + z);
        return [x * s, y * s, s];
      }

      function draw() {
        const dpr = window.devicePixelRatio || 1;
        const displayW = cvs.offsetWidth, displayH = cvs.offsetHeight;
        cvs.width = displayW * dpr;
        cvs.height = displayH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = displayW, h = displayH;
        ctx.clearRect(0, 0, w, h);

        const fontSize = Math.max(9, Math.floor(w / 55));
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        // --- Rotating 3D shape (torus) rendered as colorful ASCII ---
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const cy = Math.cos(angle * 0.6), sy = Math.sin(angle * 0.6);
        const R = 1.2, r = 0.5;
        const ringSegs = 28, tubeSegs = 16;
        const points = [];

        for (let i = 0; i < ringSegs; i++) {
          const theta = (i / ringSegs) * Math.PI * 2;
          for (let j = 0; j < tubeSegs; j++) {
            const phi = (j / tubeSegs) * Math.PI * 2;
            let x = (R + r * Math.cos(phi)) * Math.cos(theta);
            let y = (R + r * Math.cos(phi)) * Math.sin(theta);
            let z = r * Math.sin(phi);
            // Rotate Y
            let x1 = x * cos - z * sin, z1 = x * sin + z * cos;
            // Rotate X
            let y1 = y * cy - z1 * sy, z2 = y * sy + z1 * cy;
            const [px, py] = project(x1, y1, z2);
            const screenX = w * 0.5 + px * w * 0.22;
            const screenY = h * 0.45 + py * h * 0.3;
            const brightness = (1 - (z2 + 1.8) / 3.6);
            points.push({ x: screenX, y: screenY, z: z2, brightness, theta, phi });
          }
        }

        // Sort back-to-front
        points.sort((a, b) => a.z - b.z);

        points.forEach(p => {
          if (p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) return;
          const ci = Math.floor(p.brightness * (chars.length - 2));
          const ch = chars[Math.max(0, Math.min(ci, chars.length - 2))];
          // Color based on angle around the torus + time
          const hueIdx = Math.floor((p.theta / (Math.PI * 2) + frame * 0.003) * palette.length) % palette.length;
          const color = palette[Math.abs(hueIdx) % palette.length];
          const alpha = 0.3 + 0.7 * p.brightness;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fillText(ch, p.x, p.y);
        });

        // --- Scattered ambient ASCII characters (background texture) ---
        ctx.globalAlpha = 0.12;
        const seed = 42;
        for (let i = 0; i < 80; i++) {
          const sx = ((i * 7919 + seed) % 1000) / 1000 * w;
          const sy2 = ((i * 6271 + seed) % 1000) / 1000 * h;
          const ch = chars[(i * 31 + Math.floor(frame * 0.3)) % (chars.length - 1)];
          ctx.fillStyle = palette[i % palette.length];
          ctx.fillText(ch, sx, sy2);
        }

        ctx.globalAlpha = 1;
        angle += 0.008;
        frame++;
        if (running) requestAnimationFrame(draw);
      }

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; draw(); }
        else if (!e.isIntersecting) { running = false; }
      }, { threshold: 0.1 });
      obs.observe(cvs);
    })();

(function() {
      const cvs = document.getElementById('gsplatPreview');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let running = false, frame = 0;

      // Generate particles once
      const particles = [];
      const count = 220;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random(), y: Math.random(),
          z: Math.random() * 0.8 + 0.2,
          vx: (Math.random() - 0.5) * 0.0003,
          vy: (Math.random() - 0.5) * 0.0002,
          hue: 240 + Math.random() * 40, // blue-violet range
          sat: 30 + Math.random() * 40,
          lum: 50 + Math.random() * 30,
          size: Math.random() * 0.6 + 0.3
        });
      }

      function draw() {
        const dpr = window.devicePixelRatio || 1;
        const displayW = cvs.offsetWidth, displayH = cvs.offsetHeight;
        cvs.width = displayW * dpr;
        cvs.height = displayH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = displayW, h = displayH;
        ctx.clearRect(0, 0, w, h);

        // Sort by z for depth
        particles.sort((a, b) => a.z - b.z);

        particles.forEach(p => {
          // Drift
          p.x += p.vx;
          p.y += p.vy;
          // Wrap
          if (p.x < -0.05) p.x = 1.05;
          if (p.x > 1.05) p.x = -0.05;
          if (p.y < -0.05) p.y = 1.05;
          if (p.y > 1.05) p.y = -0.05;

          const px = p.x * w, py = p.y * h;
          const r = p.size * p.z * 4;
          const alpha = p.z * 0.6;

          // Gaussian-like glow
          const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
          grad.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, ${alpha})`);
          grad.addColorStop(0.4, `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, ${alpha * 0.4})`);
          grad.addColorStop(1, `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, r * 3, 0, Math.PI * 2);
          ctx.fill();

          // Bright core
          ctx.fillStyle = `hsla(${p.hue}, ${p.sat - 10}%, ${p.lum + 20}%, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });

        frame++;
        if (running) requestAnimationFrame(draw);
      }

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; draw(); }
        else if (!e.isIntersecting) { running = false; }
      }, { threshold: 0.1 });
      obs.observe(cvs);
    })();

(function() {
      const cvs = document.getElementById('kinesisPreview');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let running = false, frame = 0, particles = null;

      // Tiny hash-based pseudo-noise sufficient for a card preview.
      // Avoids pulling in a full simplex implementation.
      function noise(x, y, t) {
        const a = Math.sin(x * 1.3 + t) * Math.cos(y * 1.7 - t * 0.8);
        const b = Math.sin(x * 2.1 - t * 0.6) * Math.sin(y * 0.9 + t * 0.5);
        return (a + b) * 0.5;
      }
      function curl(x, y, t) {
        const eps = 0.05;
        const dPsi_dy = (noise(x, y + eps, t) - noise(x, y - eps, t)) / (2 * eps);
        const dPsi_dx = (noise(x + eps, y, t) - noise(x - eps, y, t)) / (2 * eps);
        return [dPsi_dy, -dPsi_dx];
      }

      function init(w, h) {
        particles = [];
        for (let i = 0; i < 700; i++) {
          particles.push({ x: Math.random() * w, y: Math.random() * h });
        }
      }

      function draw() {
        const dpr = window.devicePixelRatio || 1;
        const displayW = cvs.offsetWidth, displayH = cvs.offsetHeight;
        if (cvs.width !== displayW * dpr) {
          cvs.width = displayW * dpr;
          cvs.height = displayH * dpr;
          init(displayW, displayH);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = displayW, h = displayH;
        // Trail decay on a beige base, matching the demo's ink palette.
        ctx.fillStyle = 'rgba(234, 224, 203, 0.08)';
        ctx.fillRect(0, 0, w, h);
        const t = frame * 0.006;
        ctx.fillStyle = 'rgba(20, 20, 20, 0.22)';
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const [vx, vy] = curl(p.x * 0.012, p.y * 0.012, t);
          p.x += vx * 1.8;
          p.y += vy * 1.8;
          if (p.x < 0) p.x += w; else if (p.x >= w) p.x -= w;
          if (p.y < 0) p.y += h; else if (p.y >= h) p.y -= h;
          ctx.fillRect(p.x, p.y, 0.9, 0.9);
        }
        frame++;
        if (running) requestAnimationFrame(draw);
      }

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; draw(); }
        else if (!e.isIntersecting) { running = false; }
      }, { threshold: 0.1 });
      obs.observe(cvs);
    })();

(function() {
      const cvs = document.getElementById('pianoCourtsPreview');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let running = false, frame = 0;
      const chords = [
        { name: 'Blues', right: [0, 4, 7, 10], left: [0, 7, 12] },
        { name: 'Soul', right: [0, 4, 7, 11], left: [0, 7, 12] },
        { name: 'Pop', right: [0, 4, 7], left: [0, 7, 12] },
        { name: 'Rock', right: [0, 7], left: [0, 12] }
      ];
      const whiteSteps = [0, 2, 4, 5, 7, 9, 11];
      const blackOffsets = [
        { step: 1, after: 0 },
        { step: 3, after: 1 },
        { step: 6, after: 3 },
        { step: 8, after: 4 },
        { step: 10, after: 5 }
      ];

      function drawRow(w, y, h, chord, hand) {
        const cols = 14;
        const gap = 3;
        const margin = w * 0.08;
        const keyW = (w - margin * 2 - gap * (cols - 1)) / cols;
        const active = hand === 'right' ? chord.right : chord.left;
        const fill = hand === 'right' ? '#eadf9c' : '#244866';
        const stroke = hand === 'right' ? '#eadf9c' : '#386b95';

        for (let i = 0; i < cols; i++) {
          const x = margin + i * (keyW + gap);
          const note = whiteSteps[i % 7] + Math.floor(i / 7) * 12;
          const on = active.some((n) => (n % 12) === (note % 12));
          ctx.fillStyle = on ? fill : '#050505';
          ctx.strokeStyle = on ? stroke : 'rgba(255,255,255,0.72)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, keyW, h, 6);
          ctx.fill();
          ctx.stroke();
        }

        blackOffsets.concat(blackOffsets.map((k) => ({ step: k.step + 12, after: k.after + 7 }))).forEach((key) => {
          if (key.after >= cols - 1) return;
          const x = margin + (key.after + 1) * (keyW + gap) - keyW * 0.28;
          const on = active.some((n) => (n % 12) === (key.step % 12));
          ctx.fillStyle = on ? fill : '#000000';
          ctx.strokeStyle = on ? stroke : 'rgba(255,255,255,0.82)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, keyW * 0.56, h * 0.58, 5);
          ctx.fill();
          ctx.stroke();
        });
      }

      function draw() {
        const dpr = window.devicePixelRatio || 1;
        const displayW = cvs.offsetWidth, displayH = cvs.offsetHeight;
        cvs.width = displayW * dpr;
        cvs.height = displayH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = displayW, h = displayH;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        const chordIndex = Math.floor(frame / 110) % chords.length;
        const chord = chords[chordIndex];
        drawRow(w, h * 0.26, h * 0.24, chord, 'right');
        drawRow(w, h * 0.56, h * 0.24, chord, 'left');

        ctx.fillStyle = 'rgba(214, 216, 220, 0.86)';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.fillText(chord.name, w * 0.08, h * 0.16);
        ctx.fillStyle = 'rgba(248, 244, 234, 0.94)';
        ctx.font = '800 28px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('C7', w * 0.5, h * 0.47);
        ctx.textAlign = 'left';

        frame++;
        if (running) requestAnimationFrame(draw);
      }

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; draw(); }
        else if (!e.isIntersecting) { running = false; }
      }, { threshold: 0.1 });
      obs.observe(cvs);
    })();

(function() {
      const cvs = document.getElementById('sharpsplatPreview');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let running = false, frame = 0;

      // Cluster splats around a central subject silhouette so the
      // preview reads as "single photo to splat" rather than the
      // diffuse field used on the G-Splat card.
      const particles = [];
      const count = 180;
      for (let i = 0; i < count; i++) {
        const r = Math.pow(Math.random(), 0.7) * 0.35;
        const a = Math.random() * Math.PI * 2;
        particles.push({
          baseX: 0.5 + Math.cos(a) * r * 0.8,
          baseY: 0.5 + Math.sin(a) * r,
          z: Math.random() * 0.8 + 0.2,
          phase: Math.random() * Math.PI * 2,
          hue: 14 + Math.random() * 22,
          sat: 60 + Math.random() * 25,
          lum: 55 + Math.random() * 25,
          size: Math.random() * 0.6 + 0.4
        });
      }

      function draw() {
        const dpr = window.devicePixelRatio || 1;
        const displayW = cvs.offsetWidth, displayH = cvs.offsetHeight;
        cvs.width = displayW * dpr;
        cvs.height = displayH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = displayW, h = displayH;
        ctx.clearRect(0, 0, w, h);

        const spin = frame * 0.004;
        particles.sort((a, b) => a.z - b.z);
        particles.forEach((p) => {
          const wobble = Math.sin(frame * 0.02 + p.phase) * 0.012;
          // Gentle yaw rotation around the center to suggest a 3D subject.
          const dx = p.baseX - 0.5;
          const dy = (p.baseY - 0.5);
          const rx = dx * Math.cos(spin) - dy * 0 * Math.sin(spin) + wobble;
          const px = (0.5 + rx) * w;
          const py = (p.baseY + wobble * 0.5) * h;
          const r = p.size * p.z * 4.2;
          const alpha = p.z * 0.7;

          const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 3);
          grad.addColorStop(0,   `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, ${alpha})`);
          grad.addColorStop(0.4, `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, ${alpha * 0.4})`);
          grad.addColorStop(1,   `hsla(${p.hue}, ${p.sat}%, ${p.lum}%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, r * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `hsla(${p.hue + 10}, ${p.sat - 10}%, ${p.lum + 22}%, ${alpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(px, py, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        });

        frame++;
        if (running) requestAnimationFrame(draw);
      }

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; draw(); }
        else if (!e.isIntersecting) { running = false; }
      }, { threshold: 0.1 });
      obs.observe(cvs);
    })();

(function() {
      const cvs = document.getElementById('omniiPreview');
      if (!cvs) return;
      const ctx = cvs.getContext('2d');
      let running = false, frame = 0;

      function draw() {
        const dpr = window.devicePixelRatio || 1;
        const dw = cvs.offsetWidth, dh = cvs.offsetHeight;
        cvs.width = dw * dpr; cvs.height = dh * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, dw, dh);

        const cx = dw / 2, cy = dh / 2;
        const maxR = Math.max(dw, dh) * 0.6;
        const t = frame * 0.015;

        for (let i = 0; i < 6; i++) {
          const r = (maxR * 0.15) + (i * maxR * 0.14) + Math.sin(t + i * 0.8) * 8;
          const alpha = 0.08 + Math.sin(t + i * 1.2) * 0.04;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        frame++;
        if (running) requestAnimationFrame(draw);
      }

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; draw(); }
        else if (!e.isIntersecting) { running = false; }
      }, { threshold: 0.1 });
      obs.observe(cvs);
    })();

(()=>{
  const cvs=document.getElementById('darkFactoryPreview');
  if(!cvs)return;
  const ctx=cvs.getContext('2d');
  let running=false,frame=0;
  const CHARS='01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ#@%&*<>/\\|[]{}';
  const LINES=[
    '> INITIALIZING DARK FACTORY...',
    '> CONNECTING TO AUTONOMOUS NODE_02',
    '> LOADING PHANTOM GRID v4.1.7...',
    '> AUTH: ████████ [BYPASSED]',
    '> STATUS: 2 MACHINES ACTIVE',
    '> OUTPUT STREAM: LIVE',
    '> HUMAN OVERSIGHT: NONE',
    '> DEPLOYING ARTIFACTS...',
    '> COMMIT a3f9b12 — AUTO',
    '> PUBLISH OK [00:00:03]',
    '> NEXT CYCLE IN 00:04:17',
    '> WARNING: UNSUPERVISED AI',
    '> FACTORY RUNNING...',
  ];
  const FONT_SIZE=11;
  let COLS,ROWS,drops,speeds;
  let termLines=[],nextLineIdx=0,lineTimer=0;
  const LINE_INTERVAL=28;
  function resize(){
    cvs.width=cvs.offsetWidth||300;
    cvs.height=cvs.offsetHeight||256;
    COLS=Math.floor(cvs.width/FONT_SIZE);
    ROWS=Math.floor(cvs.height/FONT_SIZE);
    drops=Array.from({length:COLS},()=>Math.random()*ROWS*-1);
    speeds=Array.from({length:COLS},()=>0.18+Math.random()*0.22);
  }
  function draw(){
    if(!running)return;
    frame++;
    ctx.fillStyle='rgba(0,0,0,0.18)';
    ctx.fillRect(0,0,cvs.width,cvs.height);
    ctx.font=FONT_SIZE+'px monospace';
    for(let i=0;i<COLS;i++){
      const ch=CHARS[Math.floor(Math.random()*CHARS.length)];
      const alpha=0.15+Math.random()*0.55;
      ctx.fillStyle=`rgba(74,222,128,${alpha})`;
      ctx.fillText(ch,i*FONT_SIZE,Math.floor(drops[i])*FONT_SIZE);
      drops[i]+=speeds[i];
      if(drops[i]>ROWS+2)drops[i]=Math.random()*-10;
    }
    // terminal log overlay
    if(frame%LINE_INTERVAL===0&&nextLineIdx<LINES.length){
      termLines.push(LINES[nextLineIdx++]);
      if(termLines.length>6)termLines.shift();
    }
    const lineH=FONT_SIZE+3;
    const startY=cvs.height-termLines.length*lineH-8;
    ctx.font='bold '+FONT_SIZE+'px monospace';
    termLines.forEach((ln,i)=>{
      ctx.fillStyle='rgba(0,0,0,0.72)';
      ctx.fillRect(6,startY+i*lineH-FONT_SIZE+2,cvs.width-12,lineH);
      ctx.fillStyle='rgba(74,222,128,0.92)';
      ctx.fillText(ln,8,startY+i*lineH);
    });
    // cursor blink
    if(Math.floor(frame/15)%2===0){
      const lastY=startY+(termLines.length-1)*lineH;
      ctx.fillStyle='rgba(74,222,128,0.9)';
      ctx.fillText('█',8+(termLines.length?ctx.measureText(termLines[termLines.length-1]).width:0),lastY);
    }
    requestAnimationFrame(draw);
  }
  const obs=new IntersectionObserver(([e])=>{
    if(e.isIntersecting&&!running){running=true;resize();draw();}
    else if(!e.isIntersecting){running=false;}
  },{threshold:0.1});
  obs.observe(cvs);
})();

/* Lingbot-Desktop preview: a slowly orbiting point-cloud scan of a room */
(function() {
  const cvs = document.getElementById('lingbotPreview');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  let running = false, frame = 0;
  // Build a corridor-like scan: floor, two walls, a ceiling edge and a few objects.
  const pts = [];
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1600; i++) {
    const r = rnd();
    let x, y, z;
    if (r < 0.35) { x = (rnd() - 0.5) * 2; y = 0.8; z = (rnd() - 0.5) * 4; }            // floor
    else if (r < 0.6) { x = -1; y = 0.8 - rnd() * 1.5; z = (rnd() - 0.5) * 4; }         // left wall
    else if (r < 0.85) { x = 1; y = 0.8 - rnd() * 1.5; z = (rnd() - 0.5) * 4; }          // right wall
    else { const a = rnd() * 6.283; x = 0.25 + Math.cos(a) * 0.18; y = 0.8 - rnd() * 0.7; z = 0.4 + Math.sin(a) * 0.18; } // object
    pts.push({ x, y, z, h: 245 + rnd() * 45, l: 55 + rnd() * 25 });
  }
  function draw() {
    const dpr = window.devicePixelRatio || 1;
    const w = cvs.offsetWidth, h = cvs.offsetHeight;
    cvs.width = w * dpr; cvs.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const a = Math.sin(frame * 0.004) * 0.6, ca = Math.cos(a), sa = Math.sin(a);
    const f = Math.min(w, h) * 0.9;
    for (const p of pts) {
      const x = p.x * ca - p.z * sa, z = p.x * sa + p.z * ca + 3.2;
      const sx = w / 2 + (x / z) * f, sy = h * 0.42 + (p.y / z) * f;
      const alpha = Math.max(0, Math.min(1, 1.6 - z * 0.35));
      ctx.fillStyle = `hsla(${p.h}, 80%, ${p.l}%, ${alpha})`;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    frame++;
    if (running) requestAnimationFrame(draw);
  }
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; draw(); }
    else if (!e.isIntersecting) { running = false; }
  }, { threshold: 0.1 });
  obs.observe(cvs);
})();

})();
