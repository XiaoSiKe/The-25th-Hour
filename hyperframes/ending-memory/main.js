(function () {
  const data = window.ENDING_MEMORY_DATA;
  if (!data || !Array.isArray(data.scenes)) {
    throw new Error("ENDING_MEMORY_DATA is missing. Run tools/build-ending-memory-manifest.mjs first.");
  }

  const searchParams = new URLSearchParams(window.location.search);
  const embeddedMode = searchParams.has("embedded");
  const composition = document.querySelector('[data-composition-id="ending-memory"]');
  const previewFrame = document.querySelector(".ending-memory-preview-frame");
  const sceneHost = document.querySelector("#scene-host");
  const caption = document.querySelector("#caption");
  const captionText = caption.querySelector("span");
  const curtain = document.querySelector("#ending-curtain");
  const endingStamp = document.querySelector("#ending-stamp");
  const endingAudio = document.querySelector("#ending-audio");
  const finalGoodbye = document.querySelector("#final-goodbye");
  const finalGoodbyeLines = finalGoodbye ? Array.from(finalGoodbye.querySelectorAll(".final-goodbye-line")) : [];
  if (embeddedMode) {
    document.documentElement.dataset.endingMemoryMode = "embedded";
    composition.dataset.embedded = "true";
  }

  const FINAL_BLACK_DURATION = 9.8;
  const COMPLETE_BUTTON_LEAD_SECONDS = 3.5;
  const FINAL_GOODBYE_START_OFFSET = 0.32;
  const FINAL_GOODBYE_FADE_DURATION = 1.65;
  const LETTERBOX_FADE_DURATION = 1.54;
  const LETTERBOX_DARK = "#101210";
  const LETTERBOX_CLEAR = "rgba(16, 18, 16, 0)";
  const LETTERBOX_BLACK = "#000000";
  const FINAL_GOODBYE_LINE_TIMINGS = [
    { start: 1.05, enter: 1.15 },
    { start: 2.16, enter: 1.18 },
    { start: 3.78, enter: 1.15 },
    { start: 4.92, enter: 1.26 },
  ];
  const STAGE_WIDTH = 2500;
  const STAGE_HEIGHT = 1275;
  const SCREEN_SAFE_PADDING = 24;
  const FRAME_VERTICAL_OFFSET_PX = 40;
  const FRAME_VERTICAL_OFFSET_PERCENT = (FRAME_VERTICAL_OFFSET_PX / STAGE_HEIGHT) * 100;
  const DEFAULT_FRAME_TOP = 45.5 + FRAME_VERTICAL_OFFSET_PERCENT;
  const QUICK_FRAME_TOP = 50 + FRAME_VERTICAL_OFFSET_PERCENT;
  const DEFAULT_FRAME_PADDING = 14;
  const QUICK_FRAME_PADDING = 12;
  const QUICK_VISIBLE_DEPTH = 8;
  const IMAGE_DECODE_BATCH_SIZE = 8;
  const IMAGE_READY_TIMEOUT = 12000;
  const EAGER_IMAGE_COUNT = 24;
  const HIGH_PRIORITY_IMAGE_COUNT = 16;
  const INITIAL_PLAYBACK_IMAGE_COUNT = EAGER_IMAGE_COUNT;
  const INITIAL_PLAYBACK_READY_TIMEOUT = 1400;
  const PLAYBACK_START_DELAY_MS = 1000;
  const IMAGE_RETRY_LIMIT = 1;
  const IMAGE_RETRY_DELAY_MS = 260;
  const R2_ASSET_BASE_URL = "https://assets-apac.25thgame.vip/assets/v1";
  const DOMESTIC_ASSET_BASE_URL = "https://assets-cn.25thgame.vip/assets/v1";
  const ASSET_PATH_PREFIX = "/assets/v1";
  const R2_ASSET_ORIGIN = new URL(R2_ASSET_BASE_URL).origin;
  const DOMESTIC_ASSET_ORIGIN = new URL(DOMESTIC_ASSET_BASE_URL).origin;
  const DOMESTIC_STARTUP_STORY_EVENT_IMAGE_PATHS = new Set([
    "/optimized/assets/story-events/入学讲座.1b3528ea3b6d.webp",
    "/optimized/assets/story-events/军训2.b92fa54f3f49.webp",
    "/optimized/assets/story-events/专教生活.d8bd9e988386.webp",
  ]);
  const PHOTO_CAPTION_EXIT_DURATION = 0.18;
  const MEMORY_CAPTION_EXIT_DURATION = 0.22;
  const MOTION = {
    entranceEase: "power4.out",
    stackEase: "power4.out",
    captionEase: "power3.out",
    fadeEase: "sine.inOut",
  };
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const QUICK_COLLAGE_SLOTS = [
    { x: -100, y: -40, scale: 0.94, rotation: -1.25 },
    { x: 100, y: -38, scale: 0.94, rotation: 1.18 },
    { x: -108, y: 28, scale: 0.928, rotation: 1.04 },
    { x: 108, y: 30, scale: 0.928, rotation: -1.08 },
    { x: -34, y: -8, scale: 0.948, rotation: -0.24 },
    { x: 34, y: 36, scale: 0.922, rotation: 0.68 },
    { x: -70, y: 10, scale: 0.932, rotation: -0.82 },
    { x: 70, y: 12, scale: 0.932, rotation: 0.8 },
  ];

  let cursor = 0;
  let quickRunPosition = -1;
  const scenes = data.scenes.map((scene, index) => {
    const flags = readSceneFlags(scene);
    quickRunPosition = flags.quick ? quickRunPosition + 1 : -1;
    const duration = Number(scene.rawDurationSeconds.toFixed(3));
    const runtimeScene = {
      ...scene,
      index,
      quickRunPosition: flags.quick ? quickRunPosition : -1,
      id: `memory-scene-${String(index).padStart(3, "0")}`,
      start: Number(cursor.toFixed(3)),
      duration,
    };
    cursor += duration;
    return runtimeScene;
  });

  const compositionDuration = Number(cursor.toFixed(3));
  const totalDuration = Number((compositionDuration + FINAL_BLACK_DURATION).toFixed(3));
  const playbackStartSeconds = searchParams.get("start") === "last10" ? Math.max(0, totalDuration - 10) : 0;
  composition.dataset.duration = String(totalDuration);

  const stageFlags = new Map();
  for (const scene of scenes) {
    stageFlags.set(scene.id, readSceneFlags(scene));
  }

  for (const scene of scenes) {
    const sceneElement = createSceneElement(scene, stageFlags.get(scene.id));
    scene.element = sceneElement;
    scene.wrapElement = sceneElement.querySelector(".photo-wrap");
    scene.photoCaptionElement = sceneElement.querySelector(".photo-caption");
    sceneHost.appendChild(sceneElement);
  }
  const sceneElements = scenes.map((scene) => scene.element).filter(Boolean);

  const tl = gsap.timeline({ paused: true, defaults: { overwrite: false } });
  const timelineHiddenSceneIndexes = new Set();
  gsap.set([caption, curtain, endingStamp], { opacity: 0 });
  if (finalGoodbye) gsap.set(finalGoodbye, { opacity: 0, pointerEvents: "none" });
  gsap.set(finalGoodbyeLines, { opacity: 0, y: 16 });
  gsap.set(sceneElements, { opacity: 0, visibility: "hidden" });
  if (scenes[0]) {
    gsap.set(scenes[0].element, { opacity: 1, visibility: "visible", zIndex: 2000 });
  }
  scenes.forEach((scene, index) => {
    addScene(tl, scene, scenes[index - 1], stageFlags.get(scene.id));
  });

  const curtainStart = Math.max(0, compositionDuration - 1.68);
  const stageEdgeTargets = [previewFrame, composition].filter(Boolean);
  tl.fromTo(
    stageEdgeTargets,
    { backgroundColor: LETTERBOX_DARK },
    { backgroundColor: LETTERBOX_CLEAR, duration: LETTERBOX_FADE_DURATION, ease: "sine.inOut" },
    curtainStart,
  );
  tl.fromTo(curtain, { opacity: 0 }, { opacity: 0.9, duration: LETTERBOX_FADE_DURATION, ease: "sine.inOut" }, curtainStart);
  tl.fromTo(
    endingStamp,
    { opacity: 0, y: 14, scale: 0.98 },
    { opacity: 1, y: 0, scale: 1, duration: 0.44, ease: "steps(6)", immediateRender: false },
    Math.max(0, compositionDuration - 0.54),
  );
  if (finalGoodbye) {
    const finalStart = compositionDuration + FINAL_GOODBYE_START_OFFSET;
    tl.set(
      [document.documentElement, document.body, previewFrame, composition].filter(Boolean),
      { backgroundColor: LETTERBOX_BLACK },
      finalStart,
    );
    tl.fromTo(
      finalGoodbye,
      { opacity: 0 },
      { opacity: 1, duration: FINAL_GOODBYE_FADE_DURATION, ease: "sine.inOut" },
      finalStart,
    );
    tl.set(finalGoodbye, { pointerEvents: "auto" }, finalStart + 0.2);
    FINAL_GOODBYE_LINE_TIMINGS.forEach((timing, index) => {
      const line = finalGoodbyeLines[index];
      if (!line) return;
      tl.fromTo(
        line,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: prefersReducedMotion ? 0.12 : timing.enter, ease: MOTION.captionEase },
        finalStart + timing.start,
      );
    });
    tl.set(finalGoodbye, { opacity: 1 }, totalDuration);
  }
  if (embeddedMode) {
    tl.call(notifyComplete, null, Math.max(0, totalDuration - COMPLETE_BUTTON_LEAD_SECONDS));
  }

  window.__timelines = window.__timelines || {};
  window.__timelines["ending-memory"] = tl;
  window.ENDING_MEMORY_TIMING = {
    rawDurationSeconds: data.rawDurationSeconds,
    targetDurationSeconds: data.targetDurationSeconds,
    compositionDurationSeconds: totalDuration,
    memoryDurationSeconds: compositionDuration,
    playbackStartSeconds,
    finalBlackDurationSeconds: FINAL_BLACK_DURATION,
    completeButtonLeadSeconds: COMPLETE_BUTTON_LEAD_SECONDS,
    finalGoodbyeTiming: {
      startOffsetSeconds: FINAL_GOODBYE_START_OFFSET,
      fadeDurationSeconds: FINAL_GOODBYE_FADE_DURATION,
      lineTimings: FINAL_GOODBYE_LINE_TIMINGS,
    },
    durationMode: "exact-source",
    sceneCount: scenes.length,
  };

  const imagesReady = waitForImages();
  let hasStarted = false;
  imagesReady.playbackReady.then(() => wait(PLAYBACK_START_DELAY_MS)).then(startPlayback);
  imagesReady.allReady.catch(() => null);

  function createSceneElement(scene, flags) {
    const sceneEl = document.createElement("section");
    sceneEl.id = scene.id;
    sceneEl.className = "memory-scene";
    sceneEl.dataset.order = String(scene.order);
    sceneEl.dataset.level = scene.level;
    sceneEl.dataset.event = scene.event;

    const wrap = document.createElement("div");
    wrap.className = `photo-wrap ${flags.quick ? "quick-photo" : "memory-photo"} ${flags.key ? "key-photo" : ""}`;
    const frame = fitFrame(scene.width, scene.height, flags, scene);
    wrap.style.setProperty("--frame-width", `${frame.width}px`);
    wrap.style.setProperty("--frame-height", `${frame.height}px`);
    wrap.style.setProperty("--frame-padding", `${flags.quick ? QUICK_FRAME_PADDING / 2 : DEFAULT_FRAME_PADDING / 2}px`);
    wrap.style.setProperty("--frame-top", `${flags.quick ? QUICK_FRAME_TOP : DEFAULT_FRAME_TOP}%`);

    const img = document.createElement("img");
    const imageUrl = endingMemoryImageUrl(scene.imageUrl);
    img.src = imageUrl;
    img.alt = scene.event;
    img.width = scene.width;
    img.height = scene.height;
    img.decoding = "async";
    img.loading = scene.index < EAGER_IMAGE_COUNT ? "eager" : "lazy";
    img.fetchPriority = scene.index < HIGH_PRIORITY_IMAGE_COUNT ? "high" : "auto";
    img.addEventListener("load", () => {
      sceneEl.dataset.imageStatus = "loaded";
    });
    img.addEventListener("error", () => {
      const retryCount = Number(img.dataset.retryCount || 0);
      if (retryCount < IMAGE_RETRY_LIMIT) {
        img.dataset.retryCount = String(retryCount + 1);
        window.setTimeout(() => {
          img.src = retryImageUrl(imageUrl, retryCount + 1);
        }, IMAGE_RETRY_DELAY_MS * (retryCount + 1));
        return;
      }
      sceneEl.dataset.imageStatus = "error";
    });

    wrap.appendChild(img);
    if (usesPhotoCaption(scene, flags)) {
      wrap.dataset.captionPlacement = getPhotoCaptionPlacement(scene, flags);
      const photoCaption = document.createElement("span");
      photoCaption.className = "photo-caption";
      photoCaption.textContent = formatCaptionText(scene.caption.text);
      wrap.appendChild(photoCaption);
    }
    sceneEl.appendChild(wrap);
    return sceneEl;
  }

  function addScene(timeline, scene, previousScene, flags) {
    const at = scene.start;
    const sceneEl = scene.element;
    const wrap = scene.wrapElement;

    setSceneVisible(timeline, scene, { zIndex: 2000 + scene.index }, at);
    timeline.set(wrap, { opacity: scene.index === 0 ? 1 : 0 }, at);
    arrangePhotoStack(timeline, scene, at);
    if (scene.index !== 0) addEntrance(timeline, scene, wrap, at, flags);
    addPhotoCaption(timeline, scene, at, flags);
    addCaption(timeline, scene, at, flags);
  }

  function addEntrance(timeline, scene, target, at, flags) {
    if (prefersReducedMotion) {
      timeline.fromTo(target, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: MOTION.fadeEase, immediateRender: false }, at);
      return;
    }

    const entranceDuration = flags.quick
      ? clamp(scene.duration * 0.56, 0.36, 0.54)
      : clamp(scene.duration * 0.58, 0.72, flags.key ? 1.42 : 1.16);
    const delay = flags.quick ? 0.015 : Math.min(0.12, scene.duration * 0.1);
    const side = flags.quick ? alternating(scene.quickRunPosition) : alternating(scene.index);
    const finalRotation = cardTilt(scene.index);
    const quickSlot = flags.quick ? getQuickCollageSlot(scene.quickRunPosition) : null;
    const end = flags.quick
      ? { x: quickSlot.x, y: quickSlot.y, scale: quickSlot.scale, rotation: quickSlot.rotation }
      : { x: 0, y: 0, scale: 1, rotation: finalRotation };
    const start = flags.quick
        ? {
          x: quickSlot.x + 10 * side,
          y: quickSlot.y + 8,
          opacity: 0,
          scale: quickSlot.scale * 0.985,
          rotation: quickSlot.rotation + 0.36 * side,
        }
      : { x: 14 * side, y: 18, opacity: 0, scale: 0.988, rotation: finalRotation + 0.42 * side };
    timeline.set(target, { willChange: "transform, opacity" }, at + Math.max(0, delay - 0.03));
    timeline.fromTo(
      target,
      start,
      {
        x: end.x,
        y: end.y,
        opacity: 1,
        scale: end.scale,
        rotation: end.rotation,
        duration: entranceDuration,
        ease: MOTION.entranceEase,
        force3D: true,
        immediateRender: false,
      },
      at + delay,
    );
    timeline.set(target, { willChange: "auto" }, at + delay + entranceDuration + 0.08);
  }

  function arrangePhotoStack(timeline, currentScene, at) {
    const flags = stageFlags.get(currentScene.id);
    if (flags.quick) {
      arrangeQuickPhotoStack(timeline, currentScene, at);
      return;
    }

    const visibleDepth = flags.quick ? 8 : flags.key ? 2 : 3;
    const firstHiddenIndex = currentScene.index - visibleDepth - 1;
    hideScenesThrough(timeline, firstHiddenIndex, at);

    for (let depth = 1; depth <= visibleDepth; depth++) {
      const previous = scenes[currentScene.index - depth];
      if (!previous) continue;
      const slot = getStackSlot(depth, previous.index, flags.quick);
      setSceneVisible(timeline, previous, { zIndex: 2000 + currentScene.index - depth }, at);
      timeline.to(
        previous.wrapElement,
        {
          x: slot.x,
          y: slot.y,
          opacity: slot.opacity,
          scale: slot.scale,
          rotation: slot.rotation,
          duration: prefersReducedMotion ? 0.01 : 0.82,
          ease: MOTION.stackEase,
          force3D: true,
        },
        at,
      );
    }
  }

  function arrangeQuickPhotoStack(timeline, currentScene, at) {
    const runStartIndex = currentScene.index - currentScene.quickRunPosition;
    const keepFromIndex = Math.max(runStartIndex, currentScene.index - QUICK_VISIBLE_DEPTH);

    hideScenesThrough(timeline, keepFromIndex - 1, at);
    arrangeQuickBridgeStack(timeline, currentScene, runStartIndex, at);

    for (let index = keepFromIndex; index < currentScene.index; index++) {
      const previous = scenes[index];
      if (!previous || previous.quickRunPosition < 0) continue;
      const slot = getQuickCollageSlot(previous.quickRunPosition);
      setSceneVisible(timeline, previous, { zIndex: 2000 + index }, at);
      timeline.to(
        previous.wrapElement,
        {
          x: slot.x,
          y: slot.y,
          opacity: 0.86,
          scale: slot.scale,
          rotation: slot.rotation,
          duration: prefersReducedMotion ? 0.01 : 0.46,
          ease: MOTION.stackEase,
          force3D: true,
        },
        at,
      );
    }
  }

  function hideScenesThrough(timeline, targetIndex, at) {
    const cappedIndex = Math.min(targetIndex, scenes.length - 1);
    for (let index = 0; index <= cappedIndex; index++) {
      if (timelineHiddenSceneIndexes.has(index)) continue;
      timeline.set(scenes[index].element, { opacity: 0, visibility: "hidden" }, at);
      timelineHiddenSceneIndexes.add(index);
    }
  }

  function arrangeQuickBridgeStack(timeline, currentScene, runStartIndex, at) {
    const bridgeDepth = currentScene.quickRunPosition === 0 ? 2 : 1;
    for (let depth = 1; depth <= bridgeDepth; depth++) {
      const previous = scenes[runStartIndex - depth];
      if (!previous) continue;
      const slot = getStackSlot(depth, previous.index, false);
      setSceneVisible(timeline, previous, { zIndex: 1900 + previous.index }, at);
      timeline.to(
        previous.wrapElement,
        {
          x: slot.x,
          y: slot.y + 12,
          opacity: Math.min(slot.opacity, depth === 1 ? 0.26 : 0.14),
          scale: slot.scale * 0.985,
          rotation: slot.rotation,
          duration: prefersReducedMotion ? 0.01 : 0.56,
          ease: MOTION.stackEase,
          force3D: true,
        },
        at,
      );
    }
  }

  function setSceneVisible(timeline, scene, vars, at) {
    timelineHiddenSceneIndexes.delete(scene.index);
    timeline.set(scene.element, { opacity: 1, visibility: "visible", ...vars }, at);
  }

  function addPhotoCaption(timeline, scene, at, flags) {
    if (!usesPhotoCaption(scene, flags)) return;

    const target = scene.photoCaptionElement;
    if (!target) return;
    const captionStart = flags.quick ? at + 0.1 : at + Math.min(0.24, scene.duration * 0.2);
    const enterDuration = prefersReducedMotion ? 0.08 : flags.quick ? 0.26 : 0.34;
    const { captionEnd, exitStart } = getCaptionTiming(
      scene,
      at,
      captionStart,
      enterDuration,
      PHOTO_CAPTION_EXIT_DURATION,
    );
    timeline.set(target, { opacity: 0, y: flags.quick ? 16 : 10, scale: flags.quick ? 0.86 : 0.98 }, at);
    timeline.to(
      target,
      { opacity: 1, y: 0, scale: 1, duration: enterDuration, ease: flags.quick ? "steps(6)" : MOTION.captionEase },
      captionStart,
    );
    timeline.to(target, { opacity: 0, y: -6, duration: PHOTO_CAPTION_EXIT_DURATION, ease: MOTION.fadeEase }, exitStart);
    timeline.set(target, { opacity: 0, y: 0 }, captionEnd);
  }

  function addCaption(timeline, scene, at, flags) {
    if (flags.quick) return;
    if (usesPhotoCaption(scene, flags)) return;
    if (!scene.caption || !scene.caption.text) return;

    const enterDuration = prefersReducedMotion ? 0.08 : clamp(scene.duration * 0.18, 0.14, 0.32);
    const captionStart = at + Math.min(0.18, scene.duration * 0.18);
    const { captionEnd, exitStart } = getCaptionTiming(
      scene,
      at,
      captionStart,
      enterDuration,
      MEMORY_CAPTION_EXIT_DURATION,
    );

    timeline.set(caption, { opacity: 0, y: 10 }, at);
    timeline.call(() => {
      caption.dataset.captionOrder = String(scene.order);
    }, null, captionStart);
    timeline.set(captionText, { textContent: formatCaptionText(scene.caption.text, { maxLineChars: 38 }) }, captionStart);
    timeline.fromTo(
      caption,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: enterDuration, ease: MOTION.captionEase },
      captionStart,
    );
    timeline.to(caption, { opacity: 0, y: -8, duration: MEMORY_CAPTION_EXIT_DURATION, ease: MOTION.fadeEase }, exitStart);
    timeline.call(() => {
      if (caption.dataset.captionOrder === String(scene.order)) delete caption.dataset.captionOrder;
    }, null, captionEnd);
    timeline.set(caption, { opacity: 0, y: 0 }, captionEnd);
  }

  function getCaptionTiming(scene, at, captionStart, enterDuration, exitDuration) {
    const sceneEnd = at + scene.duration;
    const requestedHold = Number(scene.caption && scene.caption.holdSeconds);
    const availableHold = Math.max(0, sceneEnd - captionStart);
    const hold = Number.isFinite(requestedHold) && requestedHold > 0
      ? Math.min(requestedHold, availableHold)
      : availableHold;
    const captionEnd = Number((captionStart + hold).toFixed(3));
    const minStableTime = Math.min(0.2, hold * 0.24);
    const exitStart = Math.min(
      captionEnd,
      Math.max(captionStart + enterDuration + minStableTime, captionEnd - exitDuration),
    );

    return { captionEnd, exitStart: Number(exitStart.toFixed(3)) };
  }

  function usesPhotoCaption(scene, flags) {
    if (!scene.caption || !scene.caption.text) return false;
    return flags.quick || getLocalCaptionPlacement(scene) !== "";
  }

  function getPhotoCaptionPlacement(scene, flags) {
    if (!flags.quick) return getLocalCaptionPlacement(scene);
    const quickSlot = getQuickCollageSlot(scene.quickRunPosition);
    return quickSlot.y >= 24 ? "top" : "bottom";
  }

  function getLocalCaptionPlacement(scene) {
    switch (stripImageExtension(scene.image)) {
      case "录取通知书":
        return "notice-body";
      case "车站送别":
        return "station-body";
      case "学长帮忙搬行李":
        return "helper-body";
      case "毕业答辩":
        return "defense-body";
      default:
        return "";
    }
  }

  function stripImageExtension(imageName) {
    return String(imageName || "").replace(/\.[^.]+$/u, "");
  }

  function formatCaptionText(text, options = {}) {
    const normalized = String(text || "")
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n");
    if (!options.maxLineChars) return normalized;

    return normalized
      .split("\n")
      .flatMap((line) => wrapCaptionLine(line, options.maxLineChars))
      .join("\n");
  }

  function wrapCaptionLine(line, maxLineChars) {
    if (line.length <= maxLineChars) return [line];

    const lines = [];
    let remaining = line;
    while (remaining.length > maxLineChars) {
      const breakpoint = findCaptionBreakpoint(remaining, maxLineChars);
      lines.push(remaining.slice(0, breakpoint).trim());
      remaining = remaining.slice(breakpoint).trim();
    }
    if (remaining) lines.push(remaining);
    return lines;
  }

  function findCaptionBreakpoint(text, maxLineChars) {
    const minBreak = Math.floor(maxLineChars * 0.55);
    const punctuation = "，。！？；：、,.!?;:";
    for (let index = Math.min(maxLineChars, text.length - 1); index >= minBreak; index--) {
      if (punctuation.includes(text[index])) return index + 1;
    }
    return Math.min(maxLineChars, text.length);
  }

  function fitFrame(width, height, flags, scene) {
    const padding = flags.quick ? QUICK_FRAME_PADDING : DEFAULT_FRAME_PADDING;
    const maxInnerWidth = flags.quick ? 2060 : flags.key ? 2420 : 2280;
    const maxInnerHeight = flags.quick ? 1070 : flags.key ? 1120 : 1100;
    const ratio = width && height ? width / height : 16 / 9;
    let innerWidth = maxInnerWidth;
    let innerHeight = innerWidth / ratio;
    if (innerHeight > maxInnerHeight) {
      innerHeight = maxInnerHeight;
      innerWidth = innerHeight * ratio;
    }
    const fitted = fitWithinStage(innerWidth, innerHeight, padding, getFrameMotionStates(scene, flags));
    return {
      width: Math.floor(fitted.innerWidth + padding),
      height: Math.floor(fitted.innerHeight + padding),
    };
  }

  function fitWithinStage(innerWidth, innerHeight, padding, states) {
    if (frameFitsStage(innerWidth, innerHeight, padding, states)) {
      return { innerWidth, innerHeight };
    }

    let low = 0.25;
    let high = 1;
    for (let step = 0; step < 24; step++) {
      const scale = (low + high) / 2;
      if (frameFitsStage(innerWidth * scale, innerHeight * scale, padding, states)) {
        low = scale;
      } else {
        high = scale;
      }
    }

    return {
      innerWidth: innerWidth * low,
      innerHeight: innerHeight * low,
    };
  }

  function frameFitsStage(innerWidth, innerHeight, padding, states) {
    const totalWidth = innerWidth + padding;
    const totalHeight = innerHeight + padding;
    return states.every((state) => {
      const radians = (Math.abs(state.rotation) * Math.PI) / 180;
      const boundsWidth = state.scale * (Math.abs(totalWidth * Math.cos(radians)) + Math.abs(totalHeight * Math.sin(radians)));
      const boundsHeight = state.scale * (Math.abs(totalWidth * Math.sin(radians)) + Math.abs(totalHeight * Math.cos(radians)));
      const centerX = STAGE_WIDTH / 2 + state.x;
      const centerY = (STAGE_HEIGHT * state.top) / 100 + state.y;
      const maxWidth = 2 * (Math.min(centerX, STAGE_WIDTH - centerX) - SCREEN_SAFE_PADDING);
      const maxHeight = 2 * (Math.min(centerY, STAGE_HEIGHT - centerY) - SCREEN_SAFE_PADDING);
      return boundsWidth <= maxWidth && boundsHeight <= maxHeight;
    });
  }

  function getFrameMotionStates(scene, flags) {
    const top = flags.quick ? QUICK_FRAME_TOP : DEFAULT_FRAME_TOP;
    const side = flags.quick ? alternating(scene.quickRunPosition) : alternating(scene.index);
    const states = [];

    if (flags.quick) {
      const slot = getQuickCollageSlot(scene.quickRunPosition);
      states.push(
        { top, x: slot.x, y: slot.y, scale: slot.scale, rotation: slot.rotation },
        { top, x: slot.x + 10 * side, y: slot.y + 8, scale: slot.scale * 0.985, rotation: slot.rotation + 0.36 * side },
      );
    } else {
      const rotation = cardTilt(scene.index);
      states.push(
        { top, x: 0, y: 0, scale: 1, rotation },
        { top, x: 14 * side, y: 18, scale: 0.988, rotation: rotation + 0.42 * side },
      );
    }

    for (let depth = 1; depth <= 3; depth++) {
      const slot = getStackSlot(depth, scene.index, false);
      states.push({ top, x: slot.x, y: slot.y, scale: slot.scale, rotation: slot.rotation });
    }

    return states;
  }

  function getStackSlot(depth, index, quickMode) {
    const slots = quickMode
      ? [
          { x: -34, y: 24, scale: 0.97, opacity: 0.9 },
          { x: 38, y: 40, scale: 0.945, opacity: 0.74 },
          { x: -52, y: 56, scale: 0.92, opacity: 0.58 },
          { x: 60, y: 72, scale: 0.895, opacity: 0.44 },
          { x: -72, y: 88, scale: 0.872, opacity: 0.32 },
          { x: 82, y: 104, scale: 0.85, opacity: 0.22 },
          { x: -92, y: 120, scale: 0.828, opacity: 0.14 },
          { x: 100, y: 136, scale: 0.808, opacity: 0.08 },
        ]
      : [
          { x: -20, y: 18, scale: 0.982, opacity: 0.34 },
          { x: 24, y: 32, scale: 0.964, opacity: 0.18 },
          { x: -30, y: 46, scale: 0.946, opacity: 0.1 },
        ];
    const slot = slots[Math.min(depth - 1, slots.length - 1)];
    const direction = alternating(index + depth);
    return {
      ...slot,
      x: Math.abs(slot.x) * direction,
      rotation: cardTilt(index) + depth * 1.2 * direction,
    };
  }

  function getQuickCollageSlot(position) {
    const slot = QUICK_COLLAGE_SLOTS[position % QUICK_COLLAGE_SLOTS.length];
    const lap = Math.floor(position / QUICK_COLLAGE_SLOTS.length);
    if (!lap) return slot;

    const direction = alternating(lap);
    return {
      ...slot,
      x: slot.x + 12 * lap * direction,
      y: slot.y + 8 * Math.min(lap, 2),
      rotation: slot.rotation + 0.6 * lap * direction,
    };
  }

  function waitForImages() {
    const images = Array.from(document.images);
    const initialImages = images.slice(0, INITIAL_PLAYBACK_IMAGE_COUNT);
    const remainingImages = images.slice(INITIAL_PLAYBACK_IMAGE_COUNT);
    const initialDecoded = decodeImagesInBatches(initialImages, IMAGE_DECODE_BATCH_SIZE);
    const playbackReady = Promise.race([initialDecoded, wait(INITIAL_PLAYBACK_READY_TIMEOUT)]);
    const allReady = playbackReady
      .then(() => {
        promoteImagesForPreload(remainingImages);
        return decodeImagesInBatches(remainingImages, IMAGE_DECODE_BATCH_SIZE);
      })
      .then(() => undefined);
    return {
      playbackReady,
      allReady: Promise.race([allReady, wait(IMAGE_READY_TIMEOUT)]),
    };
  }

  async function decodeImagesInBatches(images, batchSize) {
    for (let index = 0; index < images.length; index += batchSize) {
      const batch = images.slice(index, index + batchSize);
      await Promise.all(batch.map(decodeImage));
      await nextFrame();
    }
  }

  function promoteImagesForPreload(images) {
    for (const img of images) {
      img.loading = "eager";
      if ("fetchPriority" in img && img.fetchPriority !== "high") {
        img.fetchPriority = "auto";
      }
    }
  }

  function decodeImage(img) {
    if (img.complete && img.naturalWidth > 0) {
      return img.decode ? img.decode().catch(() => null) : Promise.resolve();
    }

    return new Promise((resolve) => {
      const done = () => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
        if (img.decode) {
          img.decode().catch(() => null).finally(resolve);
        } else {
          resolve();
        }
      };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }

  function nextFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function endingMemoryImageUrl(source) {
    if (!source || typeof source !== "string") return "";
    const logicalPath = logicalOptimizedPath(source);
    if (!logicalPath) return source;
    if (isLocalRuntime()) return encodePublicUrl(logicalPath);
    if (shouldUseDomesticStartupAssets() && DOMESTIC_STARTUP_STORY_EVENT_IMAGE_PATHS.has(logicalPath)) {
      return encodePublicUrl(`${DOMESTIC_ASSET_BASE_URL}${logicalPath}`);
    }
    return encodePublicUrl(`${R2_ASSET_BASE_URL}${logicalPath}`);
  }

  function logicalOptimizedPath(source) {
    try {
      const url = new URL(source, window.location.href);
      if (url.origin === R2_ASSET_ORIGIN || url.origin === DOMESTIC_ASSET_ORIGIN) {
        return decodePublicPath(url.pathname.startsWith(ASSET_PATH_PREFIX) ? url.pathname.slice(ASSET_PATH_PREFIX.length) : url.pathname);
      }
      if (url.origin === window.location.origin) return decodePublicPath(url.pathname);
      return "";
    } catch {
      return decodePublicPath(source.split(/[?#]/u)[0]);
    }
  }

  function shouldUseDomesticStartupAssets() {
    return window.location.hostname === "arch.25thgame.vip";
  }

  function isLocalRuntime() {
    return new Set(["localhost", "127.0.0.1", "::1"]).has(window.location.hostname);
  }

  function decodePublicPath(source) {
    try {
      const decoded = decodeURI(source);
      return decoded.startsWith("/optimized/") ? decoded : "";
    } catch {
      return source.startsWith("/optimized/") ? source : "";
    }
  }

  function encodePublicUrl(source) {
    try {
      return encodeURI(decodeURI(source));
    } catch {
      return encodeURI(source);
    }
  }

  function retryImageUrl(source, retryCount) {
    try {
      const url = new URL(source, window.location.href);
      url.searchParams.set("retry", String(retryCount));
      return url.href;
    } catch {
      const separator = source.includes("?") ? "&" : "?";
      return `${source}${separator}retry=${retryCount}`;
    }
  }

  function includesAny(value, needles) {
    return needles.some((needle) => value.includes(needle));
  }

  function readSceneFlags(scene) {
    const text = `${scene.effect} ${scene.event} ${scene.image}`;
    return {
      slowOut: includesAny(text, ["slow_push_out", "推远", "告别", "离开"]),
      quick: scene.level === "快闪",
      key: scene.level === "重点",
    };
  }

  function startPlayback() {
    if (hasStarted) return;
    hasStarted = true;
    tl.play(playbackStartSeconds);
    playEndingAudio(playbackStartSeconds);
  }

  function playEndingAudio(startAtSeconds = 0) {
    if (embeddedMode) return;
    if (!endingAudio) return;
    ensureEndingAudioSource();
    endingAudio.volume = 0.72;
    seekEndingAudio(Math.max(0, startAtSeconds));
    const playback = endingAudio.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => null);
    }
  }

  function ensureEndingAudioSource() {
    const source = endingAudio.dataset.src || endingAudio.getAttribute("src") || "";
    const audioUrl = endingMemoryImageUrl(source);
    if (!audioUrl || endingAudio.getAttribute("src") === audioUrl) return;
    endingAudio.src = audioUrl;
    endingAudio.preload = "auto";
    endingAudio.load();
  }

  function seekEndingAudio(targetTime) {
    try {
      endingAudio.currentTime = targetTime;
      return;
    } catch {}
    const seekWhenReady = () => {
      try {
        endingAudio.currentTime = targetTime;
      } catch {}
    };
    endingAudio.addEventListener("loadedmetadata", seekWhenReady, { once: true });
    endingAudio.addEventListener("canplay", seekWhenReady, { once: true });
  }

  let completionNotified = false;
  function notifyComplete() {
    if (completionNotified) return;
    completionNotified = true;
    window.dispatchEvent(new CustomEvent("ending-memory:complete"));
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "ending-memory:complete" }, window.location.origin);
    }
  }

  function alternating(index) {
    return index % 2 === 0 ? 1 : -1;
  }

  function cardTilt(index) {
    return ((index % 5) - 2) * 0.6;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
