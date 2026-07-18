"use strict";

/* =========================================================
   CRE Lab Quest
   Main application controller
========================================================= */
let state = loadGuestState();
let active = null;
let scores = {
  accuracy: 100,
  sampleQuality: 100,
  safety: 100
};
let lastReason = "";
let saveTimer = null;

/*
 * 防止同一關因為重複觸發 complete()
 * 而出現兩次結算、重複加 XP 或重複解鎖。
 */
let missionFinished = false;

/* =========================================================
   DOM helpers
========================================================= */
const $ = selector => document.querySelector(selector);

const $$ = selector => document.querySelectorAll(selector);

/* =========================================================
   Level helpers
========================================================= */

function configFor(level) {
  return LEVELS.find(item => item.level === level);
}

function modeName(config) {
  if (!config) {
    return "";
  }

  if (config.type === "training") {
    const meta =
      typeof TRAINING_META !== "undefined"
        ? TRAINING_META
        : {};

    return (
      meta?.[config.mode]?.name ||
      config.mode ||
      "Training Mission"
    );
  }

  if (config.type === "future") {
    const meta =
      typeof FUTURE_META !== "undefined"
        ? FUTURE_META
        : {};

    return (
      meta?.[config.mode]?.name ||
      config.mode ||
      "Research Mission"
    );
  }

  if (config.type === "boss") {
    return "Boss Mission";
  }

  return config.mode || "Mission";
}
function completedCount() {
  return Object.keys(state.completed || {}).length;
}

/* =========================================================
   UI rendering
========================================================= */
function renderMetrics() {
  updateRank(state);
  const currentLevelMetric = $("#currentLevelMetric");
  const unlockMetric = $("#unlockMetric");
  const xpMetric = $("#xpMetric");
  const rankMetric = $("#rankMetric");

  if (currentLevelMetric) {
    currentLevelMetric.textContent = state.currentLevel;
  }
  if (unlockMetric) {
    unlockMetric.textContent = completedCount();
  }
  if (xpMetric) {
    xpMetric.textContent = state.xp;
  }
  if (rankMetric) {
    rankMetric.textContent = state.rank;
  }
}

function renderMap() {
  const map = $("#levelMap");

  if (!map) return;

  map.innerHTML = "";

  const visibleMax = state.developerMode
    ? 140
    : Math.min(140, state.unlockedLevel);

  LEVELS
    .filter(config => config.level <= visibleMax)
    .forEach(config => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "level-node";
      button.dataset.level = String(config.level);
      button.textContent = String(config.level);
      const canOpen =
        state.developerMode ||
        config.level <= state.unlockedLevel;

      if (canOpen) {
        button.classList.add("unlocked");
      } else {
        button.disabled = true;
      }
      if (state.completed?.[config.level]) {
        button.classList.add("completed");
      }
      if (config.level === state.currentLevel) {
        button.classList.add("current");
      }
      if (config.type === "boss") {
        button.classList.add("boss");
        const tag = document.createElement("small");
        tag.textContent = `${config.rounds}R`;
        button.appendChild(tag);
      }
      button.addEventListener("click", () => {
        startLevel(config.level);
      });
      map.appendChild(button);
    });
  if (
    !state.developerMode &&
    state.completed?.[140]
  ) {
    const comingSoon = document.createElement("div");
    comingSoon.className = "coming-soon-card";
    comingSoon.innerHTML = `
      <span>TO BE CONTINUED</span>
      <strong>COMING SOON</strong>
      <small>新的研究任務正在準備中</small>
    `;
    map.appendChild(comingSoon);
  }
}

function showView(selector) {
  $$(".view").forEach(view => {
    view.classList.remove("active");
  });
  const targetView = $(selector);
  if (targetView) {
    targetView.classList.add("active");
  }
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function returnToMap() {
  const modal = $("#modal");
  if (modal) {
    modal.classList.add("hidden");
  }
  active = null;
  renderMetrics();
  renderMap();
  showView("#homeView");
}

/* =========================================================
   Scoring
========================================================= */
function resetScores() {
  scores = {
    accuracy: 100,
    sampleQuality: 100,
    safety: 100
  };
  lastReason = "";
}

function penalize(stat, amount, reason) {
  if (!(stat in scores)) {
    console.warn(`Unknown score category: ${stat}`);
    return;
  }
  scores[stat] = Math.max(
    0,
    scores[stat] - amount
  );
  lastReason = reason;
  showFeedback(reason);
}

function showFeedback(text) {
  const gameStage = $("#gameStage");
  if (!gameStage) return;
  let note = $("#operationFeedback");
  if (!note) {
    note = document.createElement("div");
    note.id = "operationFeedback";
    note.className = "operation-feedback";
    gameStage.prepend(note);
  }
  note.textContent = text;
  note.classList.add("show");
  window.setTimeout(() => {
    note?.classList.remove("show");
  }, 1800);
}

function averageScore() {
  return Math.round(
    (
      scores.accuracy +
      scores.sampleQuality +
      scores.safety
    ) / 3
  );
}

function evaluation() {
  const average = averageScore();

  if (average >= 90) {
    return "S — Outstanding";
  }

  if (average >= 80) {
    return "A — Excellent";
  }

  if (average >= 70) {
    return "B — Competent";
  }

  if (average >= 60) {
    return "C — Passed";
  }

  return "D — Needs Improvement";
}

function complete() {
  /*
   * TrainingGames.mount() 會在所有回合完成後，
   * 才呼叫最外層的 complete()。
   *
   * 每個回合中的錯誤只會透過 penalize() 扣分，
   * 不會立刻中止整關。
   */
  if (missionFinished) {
    return;
  }

  missionFinished = true;

  const passingScore = 60;

  /*
   * 三個評分類別都必須達到 60 分才算通關。
   * 判定只在整關全部回合完成後進行。
   */
  const passed = [
    scores.accuracy,
    scores.sampleQuality,
    scores.safety
  ].every(score => score >= passingScore);

  finish(passed);
}

function failureText() {
  const messages = {
    pipette:
      "移液體積或 tip 操作錯誤，樣本濃度失準並可能交叉污染。",
    serological:
      "培養液轉移失敗，細胞缺乏養分或遭污染。",
    centrifuge:
      "離心機未平衡，設備與樣本受到影響。",
    equipment:
      "設備或培養條件錯誤，細胞未能成功培養。",

    plate:
      "加錯 well，control 與 treatment 可能混淆。",

    microscope:
      "影像失焦或過曝，未能辨識異常細胞。",
    boss:
      "綜合實驗失敗，Boss 必須從第一回合重新開始。"
  };

  const mode = active?.mode;
  const baseMessage =
    messages[mode] ||
    "實驗失敗，樣本無法繼續使用。";
  return `${baseMessage} ${lastReason || ""}`.trim();
}

/* =========================================================
   Saving
========================================================= */
async function persistState() {
  updateRank(state);
  if (AuthService.user) {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      AuthService
        .saveProgress(state)
        .catch(error => {
          console.error(
            "Failed to save cloud progress:",
            error
          );
        });
    }, 300);
    return;
  }
  saveGuestState(state);
}

/* =========================================================
   Mission result
========================================================= */
function finish(pass) {
  if (!active) {
    console.error(
      "finish() was called without an active level."
    );
    return;
  }
  const modalIcon = $("#modalIcon");
  const modalTitle = $("#modalTitle");
  const modalMessage = $("#modalMessage");
  const modalScores = $("#modalScores");
  const retryButton = $("#retryBtn");
  const nextButton = $("#nextBtn");
  const modal = $("#modal");
  const finalAverage = averageScore();
  if (modalIcon) {
    modalIcon.textContent = pass
      ? "🏆"
      : active.mode === "centrifuge"
        ? "💥"
        : "🧫";
  }
  if (modalTitle) {
    modalTitle.textContent = pass
      ? evaluation()
      : "MISSION FAILED";
  }
  if (modalMessage) {
    modalMessage.textContent = pass
      ? "三項評分皆達到通關標準。"
      : failureText();
  }

  if (modalScores) {
    modalScores.innerHTML = `
      <div>
        Accuracy
        <br>
        <strong>${Math.round(scores.accuracy)}</strong>
      </div>
      <div>
        Sample Quality
        <br>
        <strong>${Math.round(scores.sampleQuality)}</strong>
      </div>
      <div>
        Safety
        <br>
        <strong>${Math.round(scores.safety)}</strong>
      </div>
      <div class="overall-score">
        Overall
        <br>
        <strong>${averageScore()}</strong>
      </div>
    `;
  }
  if (nextButton) {
    nextButton.classList.toggle(
      "hidden",
      !pass
    );
  }
  if (retryButton) {
    retryButton.classList.remove("hidden");
    retryButton.textContent = pass
      ? "重新挑戰"
      : "再試一次";
  }
  if (pass) {
    const previousResult =
      state.completed?.[active.level];

    if (!state.completed) {
      state.completed = {};
    }

       /*
     * 若玩家重複挑戰同一關，
     * 只在新分數更高時更新紀錄。
     */
    const previousAverage =
      Number(previousResult?.average || 0);

    if (
      !previousResult ||
      finalAverage >= previousAverage
    ) {
      state.completed[active.level] = {
        accuracy:
          Math.round(scores.accuracy),

        sampleQuality:
          Math.round(scores.sampleQuality),

        safety:
          Math.round(scores.safety),

        average:
          finalAverage,

        evaluation:
          evaluation()
      };
    }

    state.unlockedLevel = Math.min(
      140,
      Math.max(
        state.unlockedLevel,
        active.level + 1
      )
    );
    state.currentLevel = Math.min(
      140,
      active.level + 1
    );
   /*
     * 第一次通關才增加 XP，
     * 重複挑戰不會重複獲得 XP。
     */
    if (!previousResult) {
      state.xp +=
        active.type === "boss"
          ? 100
          : 25;
    }
    recordUsage(state, "writes", 1);
    persistState();
  }
  if (modal) {
    modal.classList.remove("hidden");
  }
}

/* =========================================================
   Start mission
========================================================= */
function startLevel(level) {
  const numericLevel = Number(level);
  const config = configFor(numericLevel);
  if (!config) {
    console.error(`Level ${numericLevel} was not found.`);
    return;
  }
  /*
   * 每次開始或重新挑戰關卡時，
   * 都要解除上一關的結算鎖定。
   */
  missionFinished = false;
  active = config;
  state.currentLevel = numericLevel;

  resetScores();
  const gameModeName = $("#gameModeName");
  const gameLevelTitle = $("#gameLevelTitle");
  const bossTag = $("#bossTag");
  const gameStage = $("#gameStage");
  const modal = $("#modal");
  const drawer = $("#drawer");
    /*
   * 避免重新開始關卡時，
   * 上一次的結果視窗仍停留在畫面上。
   */
  modal?.classList.add("hidden");
  drawer?.classList.add("hidden");
  if (!gameStage) {
    console.error("#gameStage does not exist.");
    return;
  }
    /*
   * 先切換至遊戲頁面。
   * 即使遊戲引擎載入失敗，也能顯示錯誤訊息，
   * 不會看起來像按鈕完全沒有反應。
   */
  gameStage.innerHTML = "";

  showView("#gameView");

  if (gameModeName) {
    gameModeName.textContent = modeName(active);
  }
  if (gameLevelTitle) {
      gameLevelTitle.textContent =
        active.title ||
        active.name ||
        `Level ${active.level}`;
    }

    if (bossTag) {
      bossTag.classList.toggle(
        "hidden",
        active.type !== "boss"
      );
    }
   
  if (!gameStage) {
    console.error("#gameStage does not exist.");
    return;
  }
  /*
   * 清除上一關殘留的畫面與提示。
   */
  gameStage.innerHTML = "";
   
  showView("#gameView");
  const context = {
    config: active,
    stage: gameStage,
    complete,
    penalize
  };
    const context = {
      config: active,
      stage: gameStage,
      complete,
      penalize
    };
    if (active.type === "training") {
      if (
        typeof TrainingGames === "undefined" ||
        typeof TrainingGames.mount !== "function"
      ) {
        throw new Error(
          "TrainingGames.mount() 無法使用。請檢查 training-games.js 是否正確載入。"
        );
      }

      TrainingGames.mount(context);
    } else if (active.type === "future") {
      if (
        typeof FutureModes === "undefined" ||
        typeof FutureModes.mount !== "function"
      ) {
        throw new Error(
          "FutureModes.mount() 無法使用。請檢查 future-modes.js 是否正確載入。"
        );
      }

      FutureModes.mount(context);
    } else if (active.type === "boss") {
      if (
        typeof BossEngine === "undefined" ||
        typeof BossEngine.mount !== "function"
      ) {
        throw new Error(
          "BossEngine.mount() 無法使用。請檢查 boss-engine.js 是否正確載入。"
        );
      }

      BossEngine.mount(context);
    } else {
      throw new Error(
        `Unknown level type: ${active.type}`
      );
    }

    persistState();
  } catch (error) {
    console.error(
      `Failed to start level ${active.level}:`,
      error
    );

    gameStage.innerHTML = `
      <div class="game-shell">
        <div class="event-card">
          <span class="kicker">LEVEL ERROR</span>

          <h3>關卡無法載入</h3>

          <p>
            ${escapeHtml(
              error?.message ||
              "發生未知錯誤。"
            )}
          </p>

          <div class="controls">
            <button
              type="button"
              id="levelErrorBackBtn"
              class="btn btn-soft"
            >
              回到關卡地圖
            </button>
          </div>
        </div>
      </div>
    `;

    $("#levelErrorBackBtn")
      ?.addEventListener("click", returnToMap);
  }
}


/* =========================================================
   Drawer
========================================================= */
function openDrawer(html) {
  const drawerContent = $("#drawerContent");
  const drawer = $("#drawer");
  if (!drawerContent || !drawer) return;
  drawerContent.innerHTML = html;
  drawer.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  const drawer = $("#drawer");

  if (!drawer) return;

  drawer.classList.add("hidden");
  drawer.setAttribute("aria-hidden", "true");
}

/* =========================================================
   Account
========================================================= */
function accountPanel() {
  if (!AuthService.configured) {
    return `
      <span class="kicker">ACCOUNT</span>

      <h2>Firebase 尚未設定</h2>

      <p>
        目前使用遊客模式，進度保存在這台裝置。
      </p>

      <p>
        請確認
        <code>firebase/firebase-config.js</code>
        已正確設定。
      </p>
    `;
  }

  if (!AuthService.user) {
    return `
      <span class="kicker">GUEST MODE</span>
      <h2>遊客模式</h2>
      <p>
        進度只保存在這台裝置。
        登入 Google 帳號後，可跨裝置同步遊戲進度。
      </p>
      <button
        type="button"
        id="googleLoginAction"
        class="btn btn-primary"
      >
        使用 Google 登入
      </button>
    `;
  }

  const developerSection = AuthService.isAdmin
    ? `
      <div class="notice">
        <strong>開發者帳號</strong>

        <p>
          你可以顯示全部關卡並查看 Spark 用量。
        </p>

        <button
          type="button"
          id="developerToggle"
          class="btn btn-primary"
        >
          ${
            state.developerMode
              ? "關閉開發者模式"
              : "啟用開發者模式"
          }
        </button>
      </div>
    `
    : "";

  return `
    <span class="kicker">SIGNED IN</span>
    <h2>
      ${escapeHtml(
        AuthService.user.displayName ||
        "Researcher"
      )}
    </h2>
    <p>
      ${escapeHtml(
        AuthService.user.email || ""
      )}
    </p>
    <p>
      遊戲進度已同步至 Firebase。
    </p>

    ${developerSection}

    <button
      type="button"
      id="logoutAction"
      class="btn btn-soft"
    >
      登出
    </button>
  `;
}

function bindAccountActions() {
  const googleLoginAction =
    $("#googleLoginAction");
  const logoutAction =
    $("#logoutAction");
  const developerToggle =
    $("#developerToggle");

  googleLoginAction?.addEventListener(
    "click",
    async () => {
      try {
        await AuthService.signIn();
        window.location.reload();
      } catch (error) {
        openDrawer(`
          <h2>登入失敗</h2>
          <p>${escapeHtml(error.message)}</p>
        `);
      }
    }
  );

  logoutAction?.addEventListener(
    "click",
    async () => {
      try {
        await AuthService.signOut();
      } catch (error) {
        console.error(
          "Sign out failed:",
          error
        );
      }
      state = loadGuestState();
      /*
       * 防止管理員登出後，
       * 遊客狀態仍殘留 Developer Mode。
       */
      state.developerMode = false;
      state.guest = true;

      saveGuestState(state);

      window.location.reload();
    }
  );

  developerToggle?.addEventListener(
    "click",
    () => {
      if (!AuthService.isAdmin) {
        state.developerMode = false;
        updateAccountButton();
        closeDrawer();
        return;
      }
      state.developerMode =
        !state.developerMode;
      persistState();
      renderMap();
      renderMetrics();
      updateAccountButton();
      closeDrawer();
    }
  );
}

function updateAccountButton() {
  const loginButton = $("#loginBtn");
  const usageButton = $("#usageBtn");
  /*
   * Developer Mode 只能由管理員使用。
   * 若雲端資料或 localStorage 被改動，也在這裡強制關閉。
   */
  if (
    state.developerMode &&
    !AuthService.isAdmin
  ) {
    state.developerMode = false;
  }
  if (loginButton) {
    loginButton.textContent =
      state.developerMode &&
      AuthService.isAdmin
        ? "開發者模式"
        : AuthService.user
          ? "已登入"
          : "遊客模式";
  }
  if (usageButton) {
    const canViewUsage =
      Boolean(AuthService.isAdmin) &&
      Boolean(state.developerMode);
    usageButton.classList.toggle(
      "hidden",
      !canViewUsage
    );
  }
}

/* =========================================================
   Security helper for account text
========================================================= */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   Static button events
========================================================= */
function bindStaticEvents() {
  const continueButton = $("#continueBtn");
  const mapButton = $("#mapBtn");
  const resultMapButton = $("#resultMapBtn");
  const retryButton = $("#retryBtn");
  const nextButton = $("#nextBtn");
  const jumpCurrentButton = $("#jumpCurrentBtn");
  const usageButton = $("#usageBtn");
  const howButton = $("#howBtn");
  const loginButton = $("#loginBtn");
  const closeDrawerButton = $("#closeDrawerBtn");
  const drawer = $("#drawer");
  const brandHomeLink = $("#brandHomeLink");

  continueButton?.addEventListener(
    "click",
    () => {
      startLevel(state.currentLevel);
    }
  );

  mapButton?.addEventListener(
    "click",
    () => {
      active = null;

      renderMetrics();
      renderMap();
      showView("#homeView");
    }
  );

  /*
   * 結算畫面的「回到地圖」
   * 只綁定一次，不再使用 document 事件代理。
   */
  resultMapButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      returnToMap();
    }
  );

  retryButton?.addEventListener(
    "click",
    () => {
      if (!active) {
        returnToMap();
        return;
      }
      const currentLevel = active.level;
      $("#modal")?.classList.add("hidden");

      startLevel(currentLevel);
    }
  );

  nextButton?.addEventListener(
    "click",
    () => {
      if (!active) {
        returnToMap();
        return;
      }
      const completedLevel = active.level;
      $("#modal")?.classList.add("hidden");
      if (completedLevel < 140) {
        startLevel(completedLevel + 1);
        return;
      }
      active = null;
      renderMap();
      renderMetrics();
      showView("#homeView");
      openDrawer(`
        <span class="kicker">
          TO BE CONTINUED
        </span>
        <h2>COMING SOON</h2>
        <p>
          你已完成目前所有研究任務。
          新的關卡將於後續版本加入。
        </p>
      `);
    }
  );

  jumpCurrentButton?.addEventListener(
    "click",
    () => {
      document
        .querySelector(
          `[data-level="${state.currentLevel}"]`
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
    }
  );
  usageButton?.addEventListener(
    "click",
    () => {
      const canViewUsage =
        Boolean(AuthService.isAdmin) &&
        Boolean(state.developerMode);

      if (!canViewUsage) {
        return;
      }
      openDrawer(
        renderUsagePanel(state)
      );
    }
  );

  howButton?.addEventListener(
    "click",
    () => {
      openDrawer(`
        <span class="kicker">
          HOW TO PLAY
        </span>
        <h2>遊戲方式與通關條件</h2>
        <ul>
          <li>
            關卡地圖只顯示已完成關卡與下一個待挑戰關卡。
          </li>
          <li>
            儀器訓練每關包含 3–5 個回合，整關完成後才結算。
          </li>
          <li>
            系統會依 Accuracy、Sample Quality 及 Safety 評分。
          </li>
          <li>
            遊戲進行中不顯示分數；結果畫面才會公布。
          </li>
          <li>
            三項分數皆須達 60 才能通關。
          </li>
          <li>
            遊客進度保存在目前裝置；登入後可同步至雲端。
          </li>
        </ul>
      `);
    }
  );

  loginButton?.addEventListener(
    "click",
    () => {
      openDrawer(accountPanel());
      bindAccountActions();
    }
  );

  closeDrawerButton?.addEventListener(
    "click",
    () => {
      closeDrawer();
    }
  );
  drawer?.addEventListener(
    "click",
    event => {
      if (event.target === drawer) {
        closeDrawer();
      }
    }
  );

  brandHomeLink?.addEventListener(
    "click",
    event => {
      event.preventDefault();
      active = null;
      $("#modal")?.classList.add("hidden");
      renderMetrics();
      renderMap();
      showView("#homeView");
    }
  );
}

/* =========================================================
   Firebase initialization
========================================================= */
async function bootstrap() {
  try {
    const authResult =
      await AuthService.init();
    if (authResult.user) {
      const cloudProgress =
        await AuthService
          .loadProgress()
          .catch(error => {
            console.error(
              "Failed to load cloud progress:",
              error
            );
            return null;
          });
      state = mergeProgress(
        loadGuestState(),
        cloudProgress
      );
      state.guest = false;
      /*
       * 即使 Firestore 的進度中 developerMode 為 true，
       * 仍必須確認目前帳號確實是管理員。
       */
      if (!AuthService.isAdmin) {
        state.developerMode = false;
      }
      await AuthService
        .saveProgress(state)
        .catch(error => {
          console.error(
            "Failed to save merged progress:",
            error
          );
        });
    } else {
      state = loadGuestState();
      state.guest = true;
      state.developerMode = false;
      saveGuestState(state);
    }
  } catch (error) {
    console.error(
      "Firebase initialization failed:",
      error
    );
    state = loadGuestState();
    state.guest = true;
    state.developerMode = false;
  }
  updateAccountButton();
  renderMetrics();
  renderMap();
}

/* =========================================================
   Start application
========================================================= */
bindStaticEvents();
bootstrap();
