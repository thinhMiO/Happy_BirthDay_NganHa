const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const stars = [];
const explosions = [];
const shootingStars = [];
const fullTextList = [
  ["DEAR HÀ NGÂN"],
  [
    "Chúc mừng sinh nhật Đào Hà Ngân!",
    "Mong tuổi mới mang đến cho ",
    "Ngân nhiều niềm vui, sức khỏe,",
    " hạnh phúc và thành công trong",
    "mọi dự định."
  ],
  [
    "Cảm ơn Ngân đã luôn là động lực,",
    "niềm vui và người bạn tuyệt vời.",
    "Hãy luôn rạng rỡ, tự tin và ",
    "giữ vững ước mơ của mình nhé!"
  ],
  [
    "Chúc Ngân một ngày sinh nhật ",
    "ý nghĩa, tràn ngập tiếng cười,",
    "khoảnh khắc đẹp bên ",
    "gia đình và bạn bè."
  ],
  ["Người gửi: Nguyễn Công Thịnh"],
];
const fontSize =100;
const fontFamily = "Arial";
const lineHeight = 120;
const bearX = 70;
let bearY = canvas.height - 80;
let dots = [];
let targetDotsQueue = [];
let currentCharIndex = 0;
let animationDone = false;
let currentTextIndex = 0;
let showGiftBox = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bearY = canvas.height - 80;

  stars.length = 0;
  for (let i = 0; i < 300; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      delta: (Math.random() * 0.02) + 0.005
    });
  }

  function checkOrientation() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isPortrait = window.innerHeight > window.innerWidth;

    const notice = document.getElementById("rotateNotice");
    if (isMobile && isPortrait) {
      notice.style.display = "block";
      canvas.style.display = "none";
      document.getElementById("bear").style.display = "none";
    } else {
      notice.style.display = "none";
      canvas.style.display = "block";
      document.getElementById("bear").style.display = "block";
    }
  }

  window.addEventListener('resize', () => {
    resizeCanvas();
    checkOrientation();
  });
  checkOrientation();

  targetDotsQueue = [];
  currentCharIndex = 0;
  animationDone = false;
  generateAllTargetDots();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function createExplosion(x, y) {
  const count = 20;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    explosions.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60,
      opacity: 1
    });
  }
}

function drawStars() {
  for (let star of stars) {
    star.alpha += star.delta;
    if (star.alpha >= 1 || star.alpha <= 0) {
      star.delta = -star.delta;
    }

    ctx.save();
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createShootingStar() {
  const startX = Math.random() * canvas.width;
  const startY = Math.random() * canvas.height / 2;
  shootingStars.push({
    x: startX,
    y: startY,
    length: Math.random() * 300 + 100,
    speed: Math.random() * 10 + 6,
    angle: Math.PI / 4,
    opacity: 1
  });
}

function drawShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    const endX = s.x - Math.cos(s.angle) * s.length;
    const endY = s.y - Math.sin(s.angle) * s.length;

    const gradient = ctx.createLinearGradient(s.x, s.y, endX, endY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    s.opacity -= 0.01;

    if (s.opacity <= 0) {
      shootingStars.splice(i, 1);
    }
  }
}

function generateCharDots(char, x, y) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
  tempCtx.fillStyle = "red";
  tempCtx.textAlign = "left";
  tempCtx.fillText(char, x, y);

  const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const charDots = [];

  for (let y = 0; y < canvas.height; y += 4) {
    for (let x = 0; x < canvas.width; x += 4) {
      const index = (y * canvas.width + x) * 4;
      if (imageData[index + 3] > 128) {
        charDots.push({ x, y });
      }
    }
  }

  return charDots;
}

function generateAllTargetDots() {
  const tempCtx = document.createElement('canvas').getContext('2d');
  tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
  const lines = fullTextList[currentTextIndex];
  const startY = (canvas.height - lines.length * lineHeight) / 2;

  lines.forEach((line, lineIndex) => {
    const lineWidth = tempCtx.measureText(line).width;
    let xCursor = (canvas.width - lineWidth) / 2;
    const y = startY + lineIndex * lineHeight;

    for (let char of line) {
      if (char === " ") {
        xCursor += tempCtx.measureText(" ").width;
        targetDotsQueue.push([]);
        continue;
      }

      const charDots = generateCharDots(char, xCursor, y);
      targetDotsQueue.push(charDots);
      xCursor += tempCtx.measureText(char).width;
    }
  });
}

function shootDot() {
  if (animationDone) return;

  while (
    currentCharIndex < targetDotsQueue.length &&
    targetDotsQueue[currentCharIndex].length === 0
  ) {
    currentCharIndex++;
  }

  const targetDots = targetDotsQueue[currentCharIndex];
  if (!targetDots || targetDots.length === 0) return;

  const batch = 5;
  for (let i = 0; i < batch; i++) {
    const target = targetDots.shift();
    if (!target) return;
    const angle = Math.random() * Math.PI / 6 - Math.PI / 12;
    const speed = 3 + Math.random() * 2;
    dots.push({
      x: bearX + 40 + Math.random() * 20,
      y: bearY - 20 + Math.random() * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      targetX: target.x,
      targetY: target.y
    });
  }

  if (targetDots.length === 0 && currentCharIndex < targetDotsQueue.length - 1) {
    currentCharIndex++;
  }
}

function animate() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0a001f");
  gradient.addColorStop(1, "#1a0033");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars();
  drawShootingStars();

  dots.forEach(dot => {
    const dx = dot.targetX - dot.x;
    const dy = dot.targetY - dot.y;
    dot.vx += dx * 0.002;
    dot.vy += dy * 0.002;
    dot.vx *= 0.95;
    dot.vy *= 0.91;
    dot.x += dot.vx;
    dot.y += dot.vy;

    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❤️", dot.x, dot.y);
  });

  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life--;
    p.opacity -= 0.015;

    ctx.globalAlpha = Math.max(p.opacity, 0);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.life <= 0 || p.opacity <= 0) {
      explosions.splice(i, 1);
    }
  }

  // Khi chạy xong hết câu chúc, hiện hộp quà
  if (
    !animationDone &&
    currentCharIndex >= targetDotsQueue.length &&
    dots.every(dot => Math.abs(dot.targetX - dot.x) < 2 && Math.abs(dot.targetY - dot.y) < 2)
  ) {
    animationDone = true;
    const bear = document.getElementById("bear");
    if (bear.src !== "https://i.pinimg.com/originals/cf/e2/66/cfe2664925719a18a078c8c1b7552b9d.gif") {
      bear.src = "https://i.pinimg.com/originals/7e/f6/9c/7ef69cd0a6b0b78526c8ce983b3296fc.gif";
    }
    setTimeout(() => {
      if (currentTextIndex < fullTextList.length - 1) {
        currentTextIndex++;
        dots = [];
        targetDotsQueue = [];
        currentCharIndex = 0;
        animationDone = false;
        generateAllTargetDots();
        bear.src = "https://i.pinimg.com/originals/cf/e2/66/cfe2664925719a18a078c8c1b7552b9d.gif";
      } else {
        showGiftBox = true;
      }
    }, 50);
  }

  // Vẽ hộp quà ở giữa màn hình khi đã xong hết lời chúc
  if (showGiftBox) {
    const giftImg = document.getElementById('giftBoxImg');
    const boxW = 180;
    const boxH = 180;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(
      giftImg,
      canvas.width / 2 - boxW / 2,
      canvas.height / 2 - boxH / 2,
      boxW,
      boxH
    );
    ctx.restore();

    ctx.save();
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("Bấm vào hộp quà để mở!", canvas.width / 2, canvas.height / 2 + boxH / 2 + 40);
    ctx.restore();
  }

  requestAnimationFrame(animate);
}

canvas.addEventListener("click", (e) => {
  createExplosion(e.clientX, e.clientY);

  // Xử lý click vào hộp quà
  if (showGiftBox) {
    const boxW = 180;
    const boxH = 180;
    const boxX = canvas.width / 2 - boxW / 2;
    const boxY = canvas.height / 2 - boxH / 2;
    if (
      e.clientX >= boxX &&
      e.clientX <= boxX + boxW &&
      e.clientY >= boxY &&
      e.clientY <= boxY + boxH
    ) {
      window.location.href = "home.html "; // Đổi sang link bạn muốn
    }
  }
});

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  if (touch) {
    createExplosion(touch.clientX, touch.clientY);
    // Xử lý touch vào hộp quà
    if (showGiftBox) {
      const boxW = 180;
      const boxH = 180;
      const boxX = canvas.width / 2 - boxW / 2;
      const boxY = canvas.height / 2 - boxH / 2;
      if (
        touch.clientX >= boxX &&
        touch.clientX <= boxX + boxW &&
        touch.clientY >= boxY &&
        touch.clientY <= boxY + boxH
      ) {
        window.location.href = "home.html"; // Đổi sang link bạn muốn
      }
    }
  }
});

setInterval(shootDot, 5);
setInterval(createShootingStar, 1500);
animate();
