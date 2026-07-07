const state = {
  selectedGift: null,
  noClickCount: 0,
  noMoveCount: 0,
  yesClicked: false,
  comment: "",
  submittedAt: null,
};

const collectorConfig = window.COLLECTOR_CONFIG || null;
const hasGoogleFormCollector =
  collectorConfig &&
  collectorConfig.provider === "google-form" &&
  collectorConfig.googleFormAction &&
  collectorConfig.fields;

const page1 = document.getElementById("page-1");
const page2 = document.getElementById("page-2");
const entryEnvelope = document.getElementById("entry-envelope");
const revealEnvelope = document.getElementById("reveal-envelope");
const tapMessageBlock = document.getElementById("tap-message-block");
const countdownText = document.getElementById("countdown-text");
const birthdayContent = document.getElementById("birthday-content");
const preGiftStage = document.getElementById("pre-gift-stage");
const candleStage = document.getElementById("candle-stage");
const tapCandleInstruction = document.getElementById("tap-candle-instruction");
const candleTrigger = document.getElementById("candle-trigger");
const postCandleSection = document.getElementById("post-candle-section");
const openGiftOverlayBtn = document.getElementById("open-gift-overlay-btn");
const giftOverlay = document.getElementById("gift-overlay");
const giftBoxes = [...document.querySelectorAll(".gift-box")];
const giftResult = document.getElementById("gift-result");
const giftNote = document.getElementById("gift-note");
const giftContinueBtn = document.getElementById("gift-continue-btn");
const expressionSection = document.getElementById("expression-section");
const expressionContinueBtn = document.getElementById("expression-continue-btn");
const codeWordLine = document.getElementById("code-word-line");
const finalQuestionSection = document.getElementById("final-question-section");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const noFeedback = document.getElementById("no-feedback");
const commentSection = document.getElementById("comment-section");
const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");
const closingSection = document.getElementById("closing-section");
const closeBtn = document.getElementById("close-btn");
const letterText = document.getElementById("letter-text");
const expressionText = document.getElementById("expression-text");
const staggerItems = [...document.querySelectorAll(".stagger-item")];
let hasTypedLetter = false;
let hasTypedExpression = false;
let introStarted = false;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
let themeSongAudio = null;
const expressionLines = expressionText
  ? expressionText.textContent
      .split("\n")
      .map((line) => line.trim())
  : [];

function saveResponse() {
  localStorage.setItem("sreya-birthday-response", JSON.stringify(state));
}

function show(el) {
  el.classList.remove("hidden");
  if (!prefersReducedMotion) {
    el.classList.remove("pop-in");
    requestAnimationFrame(() => {
      el.classList.add("pop-in");
    });
  }
}

function hide(el) {
  el.classList.add("hidden");
}

function addFallbackIfMissing(imageId, fallbackText, secondarySrc = "") {
  const img = document.getElementById(imageId);
  if (!img) {
    return;
  }
  let hasTriedSecondary = false;
  img.addEventListener("error", () => {
    if (secondarySrc && !hasTriedSecondary) {
      hasTriedSecondary = true;
      img.src = secondarySrc;
      return;
    }
    img.alt = fallbackText;
    img.src =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700">
          <rect width="100%" height="100%" fill="#ffeaf5"/>
          <text x="50%" y="50%" text-anchor="middle" font-size="36" fill="#8f4d73" font-family="Arial">
            ${fallbackText}
          </text>
        </svg>`,
      );
  });
}

async function submitResponseToRemoteStore() {
  if (!hasGoogleFormCollector) {
    return { skipped: true };
  }

  const fields = collectorConfig.fields;
  const formData = new URLSearchParams();

  if (fields.selectedGift) formData.append(fields.selectedGift, state.selectedGift || "");
  if (fields.noClickCount) formData.append(fields.noClickCount, String(state.noClickCount));
  if (fields.noMoveCount) formData.append(fields.noMoveCount, String(state.noMoveCount));
  if (fields.yesClicked) formData.append(fields.yesClicked, String(state.yesClicked));
  if (fields.comment) formData.append(fields.comment, state.comment || "");
  if (fields.submittedAt) formData.append(fields.submittedAt, state.submittedAt || "");
  if (fields.pageUrl) formData.append(fields.pageUrl, window.location.href);
  if (fields.userAgent) formData.append(fields.userAgent, navigator.userAgent);

  const response = await fetch(collectorConfig.googleFormAction, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: formData.toString(),
  });

  // no-cors returns opaque response in browser; reaching here means request dispatched.
  if (!response) {
    throw new Error("Google Form submit could not be triggered.");
  }

  return { saved: true };
}

function playBirthdayVoice() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const line = "Happy birthday madam";
  let spoken = false;

  const pickVoice = () => {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) {
      return null;
    }
    const exactGeetha = voices.find(
      (v) => (v.name || "").toLowerCase() === "geetha" && (v.lang || "").toLowerCase() === "te-in",
    );
    if (exactGeetha) {
      return exactGeetha;
    }
    const anyGeetha = voices.find((v) => (v.name || "").toLowerCase().includes("geetha"));
    if (anyGeetha) {
      return anyGeetha;
    }
    const teInVoice = voices.find((v) => (v.lang || "").toLowerCase() === "te-in");
    return teInVoice || voices[0];
  };

  const speakNow = () => {
    if (spoken) {
      return;
    }
    const voice = pickVoice();
    if (!voice) {
      return;
    }
    spoken = true;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.voice = voice;
    utterance.lang = voice.lang || "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 0.7;
    utterance.volume = 0.95;
    utterance.onend = () => {
      startThemeSong();
    };
    speechSynthesis.speak(utterance);
  };

  speakNow();
  if (!spoken) {
    const onVoices = () => {
      speakNow();
      if (spoken) {
        speechSynthesis.removeEventListener("voiceschanged", onVoices);
      }
    };
    speechSynthesis.addEventListener("voiceschanged", onVoices);
  }
}

function startThemeSong() {
  if (themeSongAudio && !themeSongAudio.paused) {
    return;
  }
  themeSongAudio = new Audio("assets/song.mp3");
  themeSongAudio.onerror = () => {
    themeSongAudio = new Audio("assets/birthday-theme-song.mp3");
    themeSongAudio.loop = true;
    themeSongAudio.volume = 0.2;
    themeSongAudio.play().catch(() => {});
  };
  themeSongAudio.loop = true;
  themeSongAudio.volume = 0.2;
  themeSongAudio.play().catch(() => {});
}

function burstHearts(total = 14) {
  if (prefersReducedMotion || isMobileViewport) {
    return;
  }
  const frag = document.createDocumentFragment();
  const originX = window.innerWidth * (0.25 + Math.random() * 0.5);
  const originY = window.innerHeight * (0.25 + Math.random() * 0.35);
  for (let i = 0; i < total; i += 1) {
    const spark = document.createElement("span");
    spark.className = "burst-spark";
    const spreadX = (Math.random() - 0.5) * 180;
    const spreadY = Math.random() * 70;
    spark.style.left = `${originX + spreadX}px`;
    spark.style.top = `${originY + spreadY}px`;
    spark.style.animationDelay = `${Math.random() * 0.12}s`;
    spark.style.width = `${5 + Math.random() * 8}px`;
    spark.style.height = spark.style.width;
    frag.appendChild(spark);
    setTimeout(() => spark.remove(), 1600);
  }
  document.body.appendChild(frag);
}

function createBackgroundParticles(total = 20) {
  if (prefersReducedMotion) {
    return;
  }
  const container = document.getElementById("bg-particles");
  if (!container) {
    return;
  }
  const particleCount = isMobileViewport ? Math.min(total, 8) : total;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < particleCount; i += 1) {
    const dot = document.createElement("span");
    dot.className = "particle";
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.animationDuration = `${8 + Math.random() * 7}s`;
    dot.style.animationDelay = `${Math.random() * 5}s`;
    dot.style.width = `${5 + Math.random() * 7}px`;
    dot.style.height = dot.style.width;
    frag.appendChild(dot);
  }
  container.appendChild(frag);
}

function revealBirthdayContentItems() {
  staggerItems.forEach((item, index) => {
    setTimeout(() => item.classList.add("visible"), 180 * index);
  });
}

function typeLetterText(speed = 32, onDone = () => {}) {
  if (!letterText) {
    onDone();
    return;
  }
  if (prefersReducedMotion) {
    onDone();
    return;
  }
  const full = letterText.textContent.trim();
  letterText.textContent = "";
  let i = 0;

  const ticker = setInterval(() => {
    letterText.textContent += full[i];
    i += 1;
    if (i >= full.length) {
      clearInterval(ticker);
      onDone();
    }
  }, speed);
}

function typeExpressionLineByLine(wordDelay = 170, onDone = () => {}) {
  if (!expressionText || !expressionLines.length) {
    onDone();
    return;
  }

  const fullText = expressionLines.join("\n");
  const parts = fullText.split(/(\s+)/).filter((p) => p.length > 0);
  expressionText.textContent = "";
  let index = 0;
  const renderNext = () => {
    if (index >= parts.length) {
      onDone();
      return;
    }
    const part = parts[index];
    expressionText.textContent += part;
    index += 1;
    const delay = /\s+/.test(part) ? 40 : wordDelay;
    setTimeout(renderNext, delay);
  };
  renderNext();
}

function moveNoButton() {
  const container = document.getElementById("question-actions");
  const bounds = container.getBoundingClientRect();
  const maxX = Math.max(8, bounds.width - noBtn.offsetWidth - 8);
  const maxY = Math.max(8, bounds.height - noBtn.offsetHeight - 8);
  const yesRect = yesBtn
    ? {
        x: yesBtn.offsetLeft,
        y: yesBtn.offsetTop,
        w: yesBtn.offsetWidth,
        h: yesBtn.offsetHeight,
      }
    : null;

  let randomX = 8;
  let randomY = 8;
  let attempts = 0;
  while (attempts < 24) {
    const candidateX = Math.floor(Math.random() * maxX);
    const candidateY = Math.floor(Math.random() * maxY);
    if (!yesRect) {
      randomX = candidateX;
      randomY = candidateY;
      break;
    }
    const overlapX = candidateX < yesRect.x + yesRect.w && candidateX + noBtn.offsetWidth > yesRect.x;
    const overlapY = candidateY < yesRect.y + yesRect.h && candidateY + noBtn.offsetHeight > yesRect.y;
    if (!(overlapX && overlapY)) {
      randomX = candidateX;
      randomY = candidateY;
      break;
    }
    attempts += 1;
  }

  noBtn.style.position = "absolute";
  noBtn.style.left = `${randomX}px`;
  noBtn.style.top = `${randomY}px`;

  state.noMoveCount += 1;
  if (state.noMoveCount >= 2) {
    show(noFeedback);
    noFeedback.textContent = "Nuvvu yes kotey varuku adhi anteyy tirigidhii";
  }
  saveResponse();
}

function startCountdownAndReveal() {
  if (!tapMessageBlock || !birthdayContent || introStarted) {
    return;
  }
  introStarted = true;

  let count = 5;
  if (countdownText) {
    countdownText.textContent = String(count);
  }

  const timer = setInterval(() => {
    count -= 1;
    if (countdownText) {
      countdownText.textContent = String(Math.max(0, count));
    }
    if (count <= 0) {
      clearInterval(timer);
      hide(tapMessageBlock);
      show(birthdayContent);
      if (tapCandleInstruction) {
        hide(tapCandleInstruction);
        setTimeout(() => {
          if (candleStage && !candleStage.classList.contains("hidden")) {
            show(tapCandleInstruction);
          }
        }, 3000);
      }
      playBirthdayVoice();
      burstHearts(8);
      revealBirthdayContentItems();
    }
  }, 1000);
}

if (entryEnvelope && page1 && page2) {
  entryEnvelope.addEventListener("click", () => {
    page1.classList.remove("active");
    page2.classList.add("active");
    startCountdownAndReveal();
  });
}

if (revealEnvelope && tapMessageBlock && birthdayContent) {
  revealEnvelope.addEventListener("click", () => {
    hide(tapMessageBlock);
    show(birthdayContent);
    playBirthdayVoice();
    burstHearts(8);
    revealBirthdayContentItems();
  });
}

if (candleTrigger && postCandleSection) {
  candleTrigger.addEventListener("click", () => {
    if (candleStage) {
      hide(candleStage);
    }
    show(postCandleSection);
    if (openGiftOverlayBtn) {
      hide(openGiftOverlayBtn);
    }
    if (!hasTypedLetter) {
      typeLetterText(32, () => {
        if (openGiftOverlayBtn) {
          show(openGiftOverlayBtn);
        }
      });
      hasTypedLetter = true;
    } else if (openGiftOverlayBtn) {
      show(openGiftOverlayBtn);
    }
    burstHearts(6);
  });
}

if (openGiftOverlayBtn && giftOverlay) {
  openGiftOverlayBtn.addEventListener("click", () => {
    if (themeSongAudio) {
      themeSongAudio.pause();
      themeSongAudio.currentTime = 0;
    }
    show(giftOverlay);
  });
}

giftBoxes.forEach((giftBtn) => {
  giftBtn.addEventListener("click", () => {
    state.selectedGift = giftBtn.dataset.gift;
    if (themeSongAudio) {
      themeSongAudio.pause();
      themeSongAudio.currentTime = 0;
    }
    giftBoxes.forEach((btn) => {
      btn.disabled = true;
      if (btn !== giftBtn) {
        hide(btn);
      }
    });
    show(giftResult);
    show(giftNote);
    show(giftContinueBtn);
    saveResponse();
  });
});

if (giftContinueBtn && giftOverlay && expressionSection && finalQuestionSection) {
  giftContinueBtn.addEventListener("click", () => {
    hide(giftOverlay);
    if (preGiftStage) {
      hide(preGiftStage);
    }
    show(expressionSection);
    hide(finalQuestionSection);
    if (expressionContinueBtn) {
      hide(expressionContinueBtn);
    }
    if (codeWordLine) {
      hide(codeWordLine);
    }
    if (!hasTypedExpression) {
      typeExpressionLineByLine(170, () => {
        if (codeWordLine) {
          show(codeWordLine);
        }
        if (expressionContinueBtn) {
          show(expressionContinueBtn);
        }
      });
      hasTypedExpression = true;
    } else {
      if (codeWordLine) {
        show(codeWordLine);
      }
      if (expressionContinueBtn) {
        show(expressionContinueBtn);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (expressionContinueBtn && finalQuestionSection) {
  expressionContinueBtn.addEventListener("click", () => {
    show(finalQuestionSection);
  });
}

if (noBtn && noFeedback) {
  noBtn.addEventListener("click", () => {
    state.noClickCount += 1;

    if (state.noClickCount === 1) {
      show(noFeedback);
      noFeedback.textContent = "Anteyyyy... leeee 🥹🥹";
    }

    saveResponse();
  });

  noBtn.addEventListener("pointerenter", () => {
    if (state.noClickCount >= 1 && !state.yesClicked) {
      moveNoButton();
    }
  });
}

if (yesBtn && noFeedback && commentSection && noBtn) {
  yesBtn.addEventListener("click", () => {
    state.yesClicked = true;
    hide(noFeedback);
    show(commentSection);
    yesBtn.disabled = true;
    noBtn.disabled = true;
    burstHearts(10);
    saveResponse();
  });
}

if (commentForm && commentInput && commentSection && closingSection) {
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = commentInput.value.trim();
    if (!value) {
      commentInput.focus();
      return;
    }
    state.comment = value;
    state.submittedAt = new Date().toISOString();
    saveResponse();

    try {
      await submitResponseToRemoteStore();
    } catch (error) {
      // Keep flow explicit: if remote save is configured and fails, stop progression.
      const message = error instanceof Error ? error.message : "Unknown remote save error";
      alert(message);
      return;
    }

    hide(commentSection);
    show(closingSection);
  });
}

if (closeBtn && birthdayContent) {
  closeBtn.addEventListener("click", () => {
    birthdayContent.innerHTML = `
      <div class="center">
        <h2>Closed with love 💖</h2>
        <p>You can reopen this link anytime.</p>
      </div>
    `;
  });
}

addFallbackIfMissing("cake-image", "Add cake_with_candles.png in assets/", "assets/cake-candles.jpg");
addFallbackIfMissing("ghibli-image", "Add cake_cutting.png in assets/", "assets/ghibli-girl.jpg");
createBackgroundParticles();
