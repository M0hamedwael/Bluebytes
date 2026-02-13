


const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const endScreen = document.getElementById("endScreen");
const restartButton = document.getElementById("restartButton");
const music = document.getElementById("bg-music");

document.addEventListener("click", () => {
    if (music && music.paused) {
        music.volume = 0.3;
        music.play().catch(e => console.log("Audio play failed:", e));
    }
}, { once: true });
/* =========================
   PHYSICS
========================= */
const gravity = 0.25;
const particles = [];

/* =========================
   IMAGES
========================= */
const pipeImg = new Image();
pipeImg.src = "../../assets/pipes.png";

const plasterImg = new Image();
plasterImg.src = "../../assets/plaster.jpg";

const tickImg = new Image();
tickImg.src = "../../assets/tick.png";

/* =========================
   ORIGINAL IMAGE SIZE
========================= */
const ORIGINAL_WIDTH = 640;
const ORIGINAL_HEIGHT = 640;

/* =========================
   PIPE MODEL
========================= */
const pipe = {
    x: 0,
    y: 0,
    width: 650,
    height: 650,
    img: pipeImg,
    leaks: [
        { x: 335, y: 120, dir: Math.PI/4, amp: 4.5, pipeWidth: 38, pipeOrientation: 0, fixed: false, indicatorOffsetX: 15, indicatorOffsetY: -10, plasterOffsetX: 22, plasterOffsetY: -19 },
        { x: 335, y: 340, dir: Math.PI/2, amp: 3, pipeWidth: 37, pipeOrientation: 0, fixed: false, indicatorOffsetX: 12, indicatorOffsetY: -20, plasterOffsetX: 18, plasterOffsetY: -19 },
        { x: 490, y: 409, dir: Math.PI/2 + 0.5, amp: 1.3, pipeWidth: 18, pipeOrientation: 1.6, fixed: false, indicatorOffsetX: -20, indicatorOffsetY: 5, plasterOffsetX: 8, plasterOffsetY: 10 },
        { x: 87, y: 484, dir: Math.PI, amp: 3, pipeWidth: 18, pipeOrientation: 1.6, fixed: false, indicatorOffsetX: 30, indicatorOffsetY: 0, plasterOffsetX: 7, plasterOffsetY: 9 },
        { x: 310, y: 540, dir: 3*Math.PI/2, amp: 3, pipeWidth: 18, pipeOrientation: 0, fixed: false, indicatorOffsetX: 0, indicatorOffsetY: 30, plasterOffsetX: -10, plasterOffsetY: 6 }
    ]
};

/* =========================
   HELPERS
========================= */
let hoveredLeak = null;

function worldLeak(leak) {
    return {
        x: pipe.x + (leak.x / ORIGINAL_WIDTH) * pipe.width,
        y: pipe.y + (leak.y / ORIGINAL_HEIGHT) * pipe.height,
        dir: leak.dir,
        amp: leak.amp,
        pipeWidth: leak.pipeWidth,
        pipeOrientation: leak.pipeOrientation,
        fixed: leak.fixed,
        indicatorOffsetX: leak.indicatorOffsetX || 0,
        indicatorOffsetY: leak.indicatorOffsetY || 0,
        plasterOffsetX: leak.plasterOffsetX || 0,
        plasterOffsetY: leak.plasterOffsetY || 0,
        plasterScale: leak.plasterScale || 0,
        tickScale: leak.tickScale || 0,
        tickDelay: leak.tickDelay || 0
    };
}

function isHoveringIndicator(mx, my) {
    hoveredLeak = null;
    for (const leak of pipe.leaks) {
        if (leak.fixed) continue;
        const origin = worldLeak(leak);
        const cx = origin.x + origin.indicatorOffsetX;
        const cy = origin.y + origin.indicatorOffsetY;
        const dx = mx - cx;
        const dy = my - cy;
        if (Math.sqrt(dx * dx + dy * dy) <= 8) {
            hoveredLeak = leak;
            return true;
        }
    }
    return false;
}

/* =========================
   PARTICLES
========================= */
class WaterParticle {
    constructor(origin) {
        this.x = origin.x + (Math.random() - 0.5) * 3;
        this.y = origin.y + (Math.random() - 0.5) * 3;
        const angle = origin.dir + (Math.random()-0.5)*0.6*origin.amp;
        const speed = 0.6 + Math.random()*(1.2*origin.amp);
        this.vx = Math.cos(angle)*speed;
        this.vy = Math.sin(angle)*speed;
        this.radius = Math.random()*1.2 +1;
        this.life = Math.floor(Math.random()*15)+35-origin.amp*4;
        this.maxLife = this.life;
    }
    update() {
        this.vy += gravity;
        this.vx *= 0.985;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw() {
        const alpha = this.life/this.maxLife;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
        ctx.fillStyle = `rgba(0,150,255,${alpha*0.85})`;
        ctx.fill();
    }
}

/* =========================
   EMIT WATER
========================= */
function emitWater() {
    pipe.leaks.forEach(leak => {
        if (leak.fixed) return;
        const origin = worldLeak(leak);
        const count = Math.ceil(2 * origin.amp);
        for (let i = 0; i < count; i++) {
            particles.push(new WaterParticle(origin));
        }
    });
}

/* =========================
   DRAW PIPE, PLASTER, AND TICK
========================= */
function drawPipes() {
    ctx.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    pipe.leaks.forEach(leak => {
        const origin = worldLeak(leak);

        // Indicator
        if (!leak.fixed) {
            const cx = origin.x + origin.indicatorOffsetX;
            const cy = origin.y + origin.indicatorOffsetY;
            const baseRadius = 8;
            const hoverRadius = 10;
            const radius = hoveredLeak === leak ? hoverRadius : baseRadius;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#b0b0b0';
            ctx.stroke();
        }

        // Plaster + tick
        if (leak.fixed) {
            if (leak.plasterScale < 1) leak.plasterScale += 0.1;
            const size = origin.pipeWidth * leak.plasterScale;
            ctx.save();
            ctx.translate(origin.x + origin.plasterOffsetX, origin.y + origin.plasterOffsetY);
            ctx.rotate(origin.pipeOrientation);
            ctx.drawImage(plasterImg, -size/2, -size/2, size, size);
            ctx.restore();

            leak.tickDelay += 1;
            if (leak.tickDelay > 15) {
                if (leak.tickScale < 1) leak.tickScale += 0.1;
                const tickSize = 16 * leak.tickScale;
                ctx.drawImage(
                    tickImg,
                    origin.x + origin.indicatorOffsetX - tickSize / 2,
                    origin.y + origin.indicatorOffsetY - tickSize / 2,
                    tickSize,
                    tickSize
                );
            }
        }
    });
}

/* =========================
   DEBUG MODE
========================= */
let debug = false;
let mouseX = 0, mouseY = 0;
const debugDisplay = document.getElementById("debugDisplay");

window.addEventListener("keydown", e => {
    if (e.shiftKey && e.code === "KeyD") {
        debug = !debug;
        debugDisplay.style.display = debug ? "block" : "none";
    }
});

canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    canvas.style.cursor = isHoveringIndicator(mouseX, mouseY)
        ? "pointer"
        : "default";
});

function updateDebugDisplay() {
    if (!debug) return;
    const scaledX = ((mouseX - pipe.x) / pipe.width) * ORIGINAL_WIDTH;
    const scaledY = ((mouseY - pipe.y) / pipe.height) * ORIGINAL_HEIGHT;
    debugDisplay.textContent = `X: ${scaledX.toFixed(0)}, Y: ${scaledY.toFixed(0)}`;
}

/* =========================
   CLICK TO APPLY PLASTER
========================= */
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    pipe.leaks.forEach(leak => {
        if (leak.fixed) return;
        const origin = worldLeak(leak);
        const dx = mx - (origin.x + origin.indicatorOffsetX);
        const dy = my - (origin.y + origin.indicatorOffsetY);
        if (Math.sqrt(dx * dx + dy * dy) <= 8) {
            leak.fixed = true;
            leak.plasterScale = 0.5; // start partially done
            leak.tickScale = 0;
            leak.tickDelay = 0;
        }
    });
});

/* =========================
   CHECK WIN CONDITION
========================= */
function checkAllAnimationsDone() {
    return pipe.leaks.every(leak => leak.fixed && leak.plasterScale >= 1 && leak.tickScale >= 1);
}

/* =========================
   ANIMATION LOOP
========================= */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPipes();
    emitWater();

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    updateDebugDisplay();

    if (pipe.leaks.every(leak => leak.fixed)) {
        // Wait until all animations finish
        if (checkAllAnimationsDone()) {
            endScreen.style.display = "flex";
        } else {
            requestAnimationFrame(animate);
        }
    } else {
        requestAnimationFrame(animate);
    }
}

/* =========================
   RESTART GAME
========================= */
function restartGame() {
    endScreen.style.display = "none";
    pipe.leaks.forEach(leak => {
        leak.fixed = false;
        leak.plasterScale = 0.5;
        leak.tickScale = 0;
        leak.tickDelay = 0;
    });
    particles.length = 0;
    animate();
}

/* =========================
   START
========================= */
pipeImg.onload = animate;
restartButton.addEventListener("click", restartGame);
