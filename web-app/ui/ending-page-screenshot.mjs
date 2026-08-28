const SCREEN_CAPTURE_TIMEOUT_MS = 12000;
const SCREEN_VIDEO_TIMEOUT_MS = 5000;
const SCREEN_FRAME_TIMEOUT_MS = 3000;
const CANVAS_BLOB_TIMEOUT_MS = 5000;
const POSTER_IMAGE_TIMEOUT_MS = 7000;
const POSTER_FONT_TIMEOUT_MS = 1500;
const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1920;
const POSTER_FONT_FAMILY = "\"Aa Pixel SC\", \"Microsoft YaHei\", \"PingFang SC\", sans-serif";
const POSTER_MONO_FONT_FAMILY = "\"Aa Pixel SC\", \"Microsoft YaHei\", monospace";

export async function captureEndingPageScreenshotBlob(shell = document.querySelector(".ending-shell")) {
  let nativeError = null;
  if (canUseNativeScreenCapture()) {
    try {
      return await captureNativeScreenScreenshotBlob();
    } catch (error) {
      nativeError = error;
    }
  }

  if (!shell) {
    if (nativeError) throw nativeError;
    throw new Error("结局页面尚未准备好。");
  }
  return captureEndingPosterBlob(shell);
}

async function captureNativeScreenScreenshotBlob() {
  const stream = await requestNativeScreenCaptureWithTimeout();
  const video = document.createElement("video");

  try {
    await withTimeout(startScreenVideo(video, stream), SCREEN_VIDEO_TIMEOUT_MS, "截图画面打开超时。");
    await withTimeout(waitForCapturedFrame(video), SCREEN_FRAME_TIMEOUT_MS, "截图画面读取超时。");
    return await withTimeout(capturedFrameToPngBlob(video), CANVAS_BLOB_TIMEOUT_MS, "截图图片导出超时。");
  } finally {
    stopScreenCapture(stream);
  }
}

async function captureEndingPosterBlob(shell) {
  const poster = extractEndingPosterData(shell);
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("截图导出画布不可用。");

  await waitForPosterFonts();
  const [illustration, icon] = await Promise.all([
    loadPosterImage(poster.illustrationSrc),
    loadPosterImage(poster.iconSrc),
  ]);

  drawPosterBackground(context);
  drawPosterHeader(context);
  drawPosterTitle(context, poster, icon);
  drawPosterIllustration(context, illustration);
  drawPosterBody(context, poster.body);
  drawPosterStats(context, poster.stats);
  drawPosterFooter(context);

  return withTimeout(canvasToPngBlob(canvas), CANVAS_BLOB_TIMEOUT_MS, "结局图片导出超时。");
}

function extractEndingPosterData(shell) {
  const text = (selector) => normalizedText(shell.querySelector(selector)?.textContent);
  const imageSrc = (selector) => {
    const image = shell.querySelector(selector);
    return image?.currentSrc || image?.src || image?.getAttribute("src") || "";
  };

  return {
    titleMain: text(".ending-title-main") || text("#ending-title") || "人生结局",
    titleDetail: text(".ending-title-detail"),
    body: text(".ending-copy p"),
    illustrationSrc: imageSrc(".ending-illustration img"),
    iconSrc: imageSrc(".ending-title-icon img"),
    stats: [...shell.querySelectorAll(".ending-insight-panel .ending-stat-list div")]
      .map((row) => ({
        label: normalizedText(row.querySelector("dt")?.textContent).replace(/[：:]\s*$/u, ""),
        value: normalizedText(row.querySelector("dd")?.textContent),
      }))
      .filter((row) => row.label || row.value),
  };
}

function drawPosterBackground(context) {
  context.fillStyle = "#08090d";
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const gradient = context.createLinearGradient(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  gradient.addColorStop(0, "rgba(38, 76, 132, 0.42)");
  gradient.addColorStop(0.44, "rgba(14, 18, 28, 0.14)");
  gradient.addColorStop(1, "rgba(122, 38, 32, 0.28)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.055)";
  context.lineWidth = 1;
  for (let x = 0; x <= POSTER_WIDTH; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, POSTER_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= POSTER_HEIGHT; y += 54) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(POSTER_WIDTH, y);
    context.stroke();
  }
  context.restore();

  drawFrame(context, 46, 46, POSTER_WIDTH - 92, POSTER_HEIGHT - 92, 18, "rgba(255,255,255,0.22)", "rgba(255,255,255,0.035)");
}

function drawPosterHeader(context) {
  context.save();
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.font = `28px ${POSTER_MONO_FONT_FAMILY}`;
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText("ENDING / SHARE / IMAGE", 82, 86);
  context.textAlign = "right";
  context.fillText("第二十五小时", POSTER_WIDTH - 82, 86);
  context.restore();
}

function drawPosterTitle(context, poster, icon) {
  const titleX = 82;
  const titleY = 154;
  const iconSize = 156;
  if (icon) {
    drawFrame(context, titleX, titleY, iconSize, iconSize, 12, "rgba(255,255,255,0.34)", "rgba(255,255,255,0.07)");
    drawImageContain(context, icon, titleX + 12, titleY + 12, iconSize - 24, iconSize - 24);
  }

  const textX = icon ? titleX + iconSize + 34 : titleX;
  const maxWidth = POSTER_WIDTH - textX - 82;
  context.save();
  context.textBaseline = "top";
  context.fillStyle = "#fff7f0";
  drawFitText(context, poster.titleMain, textX, titleY + 4, maxWidth, 78, 48, "bold");
  if (poster.titleDetail) {
    context.fillStyle = "#ff8f75";
    drawFitText(context, poster.titleDetail, textX, titleY + 94, maxWidth, 48, 32, "bold");
  }
  context.restore();
}

function drawPosterIllustration(context, image) {
  const x = 82;
  const y = 365;
  const width = POSTER_WIDTH - 164;
  const height = 720;
  drawFrame(context, x, y, width, height, 18, "rgba(255,255,255,0.28)", "rgba(255,255,255,0.06)");
  if (image) {
    drawImageContain(context, image, x + 24, y + 24, width - 48, height - 48);
    return;
  }

  context.save();
  context.fillStyle = "rgba(255, 255, 255, 0.58)";
  context.font = `36px ${POSTER_FONT_FAMILY}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("结局插画加载中", x + width / 2, y + height / 2);
  context.restore();
}

function drawPosterBody(context, body) {
  const x = 92;
  const y = 1152;
  const width = POSTER_WIDTH - 184;
  drawFrame(context, 82, 1122, POSTER_WIDTH - 164, 300, 16, "rgba(255,255,255,0.20)", "rgba(10, 12, 18, 0.54)");
  context.save();
  context.fillStyle = "#fff7f0";
  context.textBaseline = "top";
  drawWrappedText(context, body || "这是一段属于你的五年建筑生涯。", x + 24, y, width - 48, {
    fontSize: 40,
    lineHeight: 64,
    maxLines: 4,
  });
  context.restore();
}

function drawPosterStats(context, stats) {
  const visibleStats = stats.length ? stats.slice(0, 4) : [
    { label: "GPA", value: "未知" },
    { label: "雅思成绩", value: "未参加" },
    { label: "竞赛获奖", value: "0次" },
    { label: "累计实习价值", value: "0" },
  ];
  const startX = 82;
  const startY = 1482;
  const gap = 22;
  const cardWidth = (POSTER_WIDTH - 164 - gap) / 2;
  const cardHeight = 128;

  visibleStats.forEach((stat, index) => {
    const x = startX + (index % 2) * (cardWidth + gap);
    const y = startY + Math.floor(index / 2) * (cardHeight + gap);
    drawFrame(context, x, y, cardWidth, cardHeight, 14, "rgba(255,255,255,0.22)", "rgba(255,255,255,0.07)");
    context.save();
    context.textBaseline = "top";
    context.fillStyle = "rgba(255, 255, 255, 0.66)";
    context.font = `28px ${POSTER_FONT_FAMILY}`;
    context.fillText(stat.label || "记录", x + 28, y + 24);
    context.fillStyle = "#ffffff";
    drawFitText(context, stat.value || "-", x + 28, y + 66, cardWidth - 56, 38, 26, "bold");
    context.restore();
  });
}

function drawPosterFooter(context) {
  context.save();
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.font = `30px ${POSTER_FONT_FAMILY}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("长按图片保存，发给还在画图的同学看看。", POSTER_WIDTH / 2, POSTER_HEIGHT - 108);
  context.restore();
}

function drawFrame(context, x, y, width, height, radius, strokeStyle, fillStyle) {
  context.save();
  roundedRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = strokeStyle;
  context.stroke();
  context.restore();
}

function drawImageContain(context, image, x, y, width, height) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawFitText(context, text, x, y, maxWidth, maxFontSize, minFontSize, weight = "400") {
  const value = normalizedText(text);
  let fontSize = maxFontSize;
  while (fontSize > minFontSize) {
    context.font = `${weight} ${fontSize}px ${POSTER_FONT_FAMILY}`;
    if (context.measureText(value).width <= maxWidth) break;
    fontSize -= 2;
  }
  context.font = `${weight} ${fontSize}px ${POSTER_FONT_FAMILY}`;
  context.fillText(value, x, y);
}

function drawWrappedText(context, text, x, y, maxWidth, { fontSize, lineHeight, maxLines }) {
  context.font = `${fontSize}px ${POSTER_FONT_FAMILY}`;
  const lines = wrapText(context, normalizedText(text), maxWidth, maxLines);
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function wrapText(context, text, maxWidth, maxLines) {
  const lines = [];
  let line = "";
  for (const character of Array.from(text)) {
    const nextLine = `${line}${character}`;
    if (line && context.measureText(nextLine).width > maxWidth) {
      lines.push(line);
      line = character.trimStart();
      if (lines.length === maxLines) break;
    } else {
      line = nextLine;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && context.measureText(lines[maxLines - 1]).width > maxWidth) {
    lines[maxLines - 1] = trimTextToWidth(context, lines[maxLines - 1], maxWidth);
  }
  return lines;
}

function trimTextToWidth(context, text, maxWidth) {
  const ellipsis = "…";
  let value = text;
  while (value && context.measureText(`${value}${ellipsis}`).width > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}${ellipsis}`;
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

async function loadPosterImage(source) {
  if (!source) return null;
  return withTimeout(new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  }), POSTER_IMAGE_TIMEOUT_MS, "结局图片素材加载超时。").catch(() => null);
}

async function waitForPosterFonts() {
  if (!document.fonts?.ready) return;
  await withTimeout(document.fonts.ready, POSTER_FONT_TIMEOUT_MS, "结局图片字体加载超时。").catch(() => {});
}

function normalizedText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function requestNativeScreenCaptureWithTimeout() {
  let streamSettled = false;
  const streamRequest = Promise.resolve()
    .then(requestNativeScreenCapture)
    .then((stream) => {
      streamSettled = true;
      return stream;
    }, (error) => {
      streamSettled = true;
      throw error;
    });

  return withTimeout(streamRequest, SCREEN_CAPTURE_TIMEOUT_MS, "截图授权等待超时，请重新点击并选择当前标签页。")
    .catch((error) => {
      if (!streamSettled) {
        streamRequest.then(stopScreenCapture).catch(() => {});
      }
      throw error;
    });
}

function canUseNativeScreenCapture() {
  return Boolean(navigator.mediaDevices?.getDisplayMedia);
}

function requestNativeScreenCapture() {
  if (!canUseNativeScreenCapture()) {
    throw new Error("当前浏览器不支持原生屏幕捕获。");
  }

  return navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor: "never",
      displaySurface: "browser",
    },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    surfaceSwitching: "exclude",
  });
}

async function startScreenVideo(video, stream) {
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("原生截图画面读取失败。"));
  });
  await video.play();
}

async function waitForCapturedFrame(video) {
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (typeof video.requestVideoFrameCallback === "function") {
    await new Promise((resolve) => video.requestVideoFrameCallback(resolve));
  }
}

function capturedFrameToPngBlob(video) {
  const width = Math.round(video.videoWidth);
  const height = Math.round(video.videoHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("原生截图尺寸不可用。");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("截图导出画布不可用。");
  context.drawImage(video, 0, 0, width, height);

  return canvasToPngBlob(canvas);
}

function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("结局页面截图导出失败。"));
        }
      }, "image/png");
    } catch (error) {
      reject(error);
    }
  });
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId = null;
  return new Promise((resolve, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
    Promise.resolve(promise).then(resolve, reject).finally(() => {
      window.clearTimeout(timeoutId);
    });
  });
}

function stopScreenCapture(stream) {
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
