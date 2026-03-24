// Load images

const bgImage = new Image();
bgImage.src = "background.png"; // your file path

let bgLoaded = false;
bgImage.onload = () => {
  bgLoaded = true;
};

const itemNames = [
  "shell", "eye", "mask",
  "chain", "shield", "waves",
  "flame", "net", "spiral"
];

const images = {};

let imagesLoaded = 0;
const totalImages = itemNames.length;

itemNames.forEach(name => {
  const img = new Image();
  img.src = `items/${name}.png`;

  img.onload = () => {
    imagesLoaded++;
    // Start animation ONLY when all images are ready
    if (imagesLoaded === totalImages) {
      startApp();
    }
  };

  images[name] = img;
});

console.log(imagesLoaded);

// Global variables

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// ----------------------
// WHEEL CLASS
// ----------------------

function drawRingBoundary(radius, style = "solid") {
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);

  ctx.lineWidth = 1;
  ctx.shadowColor = "rgba(255,255,255,0.3)";
  ctx.shadowBlur = 4;

  if (style === "dotted") {
    ctx.setLineDash([20, 4]);
  } else {
    ctx.setLineDash([]);
  }

  if (style === "gradient") {
    const grad = ctx.createRadialGradient(0, 0, radius - 10, 0, 0, radius + 10);
    grad.addColorStop(0, "rgba(200,200,200,0)");
    grad.addColorStop(0.5, "silver");
    grad.addColorStop(1, "rgba(200,200,200,0)");
    ctx.strokeStyle = grad;
  } else {
    ctx.strokeStyle = "silver";
  }

  ctx.stroke();
  ctx.globalAlpha = 0.9;
}

function drawFilledRing(radius, thickness) {
  const outer = radius + thickness / 2;
  const inner = radius - thickness / 2;

  ctx.save();

  // ---- Glow effect ----
  ctx.shadowColor = "rgba(255,255,255,0.2)";
  ctx.shadowBlur = 12;

  // ---- Ring shape ----
  ctx.beginPath();
  ctx.arc(0, 0, outer, 0, Math.PI * 2);
  ctx.arc(0, 0, inner, 0, Math.PI * 2, true);

  // ---- Gradient fill (depth + metallic feel) ----
  const grad = ctx.createRadialGradient(0, 0, inner, 0, 0, outer);
  grad.addColorStop(0, "rgba(88, 59, 5, 0.05)");
  grad.addColorStop(0.5, "rgba(198,144,42,0.15)");
  grad.addColorStop(1, "rgba(0,0,0,0.15)");

  ctx.fillStyle = grad;
  ctx.fill("evenodd");

  // Reset glow before strokes
  ctx.shadowBlur = 0;

  // ---- Outer highlight (light edge) ----
  ctx.beginPath();
  ctx.arc(0, 0, outer, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(169, 145, 82, 0.35)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // ---- Inner shadow edge (dark edge) ----
  ctx.beginPath();
  ctx.arc(0, 0, inner, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

const itemSizes = {
  shell: 1.0,
  eye: 1.2,
  mask: 1.3,
  chain: 1.2,
  shield: 1.0,
  waves: 1.5,
  flame: 1.5,
  net: 1.3,
  spiral: 1.0
};

function drawItemIcon(item, baseSize) {
  const img = images[item];
  if (!img || !img.complete) return;

  const scale = itemSizes[item] || 1;
  const maxSize = baseSize * scale;

  const aspect = img.width / img.height;

  let drawWidth, drawHeight;

  if (aspect > 1) {
    drawWidth = maxSize;
    drawHeight = maxSize / aspect;
  } else {
    drawHeight = maxSize;
    drawWidth = maxSize * aspect;
  }

  ctx.save();

  // Boost color + contrast
  ctx.filter = "contrast(1.3) saturate(1.5)";

  // Glow
  ctx.shadowColor = "rgba(255, 180, 100, 0.6)";
  ctx.shadowBlur = 14;

  // Slight "bold" effect
  ctx.drawImage(img, -drawWidth / 2 - 0.5, -drawHeight / 2 - 0.5, drawWidth, drawHeight);

  ctx.drawImage(
    img,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight
  );

  ctx.restore();
  ctx.filter = "none";
}

class Wheel {
  constructor(radius, items) {
    this.radius = radius;
    this.items = items;

    this.rotation = 0;
    this.velocity = 0;

    this.isDragging = false;
    this.lastAngle = 0;
  }

  draw() {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);

    // Draw ring
    const thickness = 50;
    drawFilledRing(this.radius, thickness);
    // drawRingBoundary(this.radius + thickness / 2, "solid");
    // drawRingBoundary(this.radius - thickness / 2, "solid");

    // Draw items
    const step = (Math.PI * 2) / this.items.length;

    this.items.forEach((item, i) => {
      const angle = i * step - Math.PI / 2;

      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;

      ctx.save();
      ctx.translate(x, y);

      // Keep upright
      ctx.rotate(-this.rotation);

      // ctx.fillStyle = "white";
      // ctx.font = "16px Arial";
      // ctx.textAlign = "center";
      // ctx.textBaseline = "middle";
      // ctx.fillText(item, 0, 0);
      drawItemIcon(item, 40);
      ctx.restore();
    });

    ctx.restore();
  }

  update() {
    // Apply inertia
    this.rotation += this.velocity;

    // Friction
    this.velocity *= 0.5;

    // Snap when slow
    if (!this.isDragging && Math.abs(this.velocity) < 0.002) {
      this.snapToNearest();
    }
  }

  snapToNearest() {
    const step = (Math.PI * 2) / (this.items.length * 2);
    const snapped = Math.round(this.rotation / step) * step;

    // Smooth snapping
    this.rotation += (snapped - this.rotation) * 0.35;
  }

  getMouseAngle(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    return Math.atan2(y, x);
  }

  handleDown(e) {
    this.isDragging = true;
    this.lastAngle = this.getMouseAngle(e);
    this.velocity = 0;
  }

  handleMove(e) {
    if (!this.isDragging) return;

    const angle = this.getMouseAngle(e);
    const delta = angle - this.lastAngle;

    this.rotation += delta;
    this.velocity = delta;

    this.lastAngle = angle;
  }

  handleUp() {
    this.isDragging = false;
  }
}

// ----------------------
// CREATE WHEELS
// ----------------------
const wheels = [
  new Wheel(160, ["spiral", "flame", "net"]),
  new Wheel(100, ["chain", "mask", "waves"]),
  new Wheel(40, ["shell", "shield", "eye"])
];

// ----------------------
// MOUSE LOGIC
// ----------------------
function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left - centerX,
    y: e.clientY - rect.top - centerY
  };
}

function getDistance(x, y) {
  return Math.sqrt(x * x + y * y);
}

function getWheelUnderMouse(e) {
  const pos = getMousePos(e);
  const dist = getDistance(pos.x, pos.y);

  for (let wheel of wheels) {
    if (Math.abs(dist - wheel.radius) < 20) {
      return wheel;
    }
  }
  return null;
}

let activeWheel = null;

canvas.addEventListener("mousedown", (e) => {
  activeWheel = getWheelUnderMouse(e);
  if (activeWheel) activeWheel.handleDown(e);
});

canvas.addEventListener("mousemove", (e) => {
  if (activeWheel) activeWheel.handleMove(e);
});

canvas.addEventListener("mouseup", () => {
  if (activeWheel) activeWheel.handleUp();
  activeWheel = null;
});

canvas.addEventListener("mouseleave", () => {
  if (activeWheel) activeWheel.handleUp();
  activeWheel = null;
});

// ----------------------
// UNLOCK LOGIC
// ----------------------

function getItemAngle(wheel, targetItem) {
  const index = wheel.items.indexOf(targetItem);
  if (index === -1) return null;

  const step = (Math.PI * 2) / wheel.items.length;

  let angle = index * step + wheel.rotation;

  // Normalize to [0, 2π)
  angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  return angle;
}

function isAligned(wheel) {
  const step = (Math.PI * 2) / wheel.items.length;
  const diff = wheel.rotation % step;
  return Math.abs(diff) < 0.05;
}

const correctCombination = ["spiral", "mask", "eye"];

let wasAligned = false;

function checkUnlock() {
  const angles = wheels.map((wheel, i) => {
    return getItemAngle(wheel, correctCombination[i]);
  });

  if (angles.includes(null)) return;

  const tolerance = 0.05;
  const base = angles[0];

  const isAlignedNow = angles.every(angle => {
    let diff = angle - base;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    return Math.abs(diff) < tolerance;
  });

  const allStopped = wheels.every(w => Math.abs(w.velocity) < 0.002);

  // // 🔥 Only trigger when alignment JUST happened
  // if (isAlignedNow && !wasAligned && allStopped) {
  //   setTimeout(() => {
  //     alert("Unlocked!");
  //   }, 100);
  // }

  // Update state for next frame
  wasAligned = isAlignedNow;
}

// ----------------------
// ANIMATION LOOP
// ----------------------
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bgLoaded) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  wheels.forEach(w => {
    w.update();
    w.draw();
  });

  checkUnlock();

  requestAnimationFrame(animate);
}

function startApp() {
  animate();
}

// animate();
