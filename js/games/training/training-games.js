
const TRAINING_META={
  pipette:{name:"Micropipette Training",icon:"🧪"},
  serological:{name:"Serological Pipette",icon:"🧫"},
  centrifuge:{name:"Centrifuge Balance",icon:"⚙️"},
  equipment:{name:"Equipment & Incubator",icon:"🌡️"},
  plate:{name:"96-Well Plate",icon:"▦"},
  microscope:{name:"Microscope Focus",icon:"🔬"}
};
const TrainingGames={
  mount(ctx){
    const map={pipette:this.pipette,serological:this.serological,centrifuge:this.centrifuge,equipment:this.equipment,plate:this.plate,microscope:this.microscope};
    const game=map[ctx.config.mode]||this.pipette;
    const totalRounds=this.roundCount(ctx.config.level);
    let round=1;
    const launch=()=>{
      const roundCtx={
        ...ctx,
        config:{...ctx.config,roundIndex:round,totalRounds},
        complete:()=>{if(round>=totalRounds)ctx.complete();else{round++;launch()}}
      };
      game.call(this,roundCtx);
      this.addRoundHeader(ctx.stage,round,totalRounds);
    };
    launch();
  },
  roundCount(level){if(level<=8)return 3;if(level<=15)return 4;return 5},
  addRoundHeader(stage,current,total){
    const box=document.createElement("div");box.className="training-round-indicator";
    box.innerHTML=`<strong>Round ${current} / ${total}</strong><span>評分將於整關結束後公布</span>`;
    stage.prepend(box);
  },
  shell(title,text,inner){
    return `<div class="game-shell"><div class="game-instructions"><h3>${title}</h3><p>${text}</p></div>${inner}</div>`;
  },

pipette(ctx) {
  const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  /*
   * 每回合直接隨機產生 1–1000 μL 的整數，
   * 不是從固定數值清單抽選。
   */
  const target = randomInt(1, 1000);
  const correct =
    target <= 10
      ? "P10"
      : target <= 20
        ? "P20"
        : target <= 200
          ? "P200"
          : "P1000";
  let selected = null;
  let digits = [0, 0, 0, 0];
  let tipInstalled = false;
  let liquidLoaded = false;
  const stage = ctx.stage;
  stage.innerHTML = this.shell(
    "Micropipette 精準移液",
    `請選擇正確 pipette，設定 ${target} μL，並將液體移入 Tube B。`,
    `
      <div class="lab-bench">
        <!-- 左上：任務 -->
        <div class="bench-card task-card">
          <span class="kicker">任務</span>
          <strong>${target} μL → Tube B</strong>
          <small>建議量程：${correct}</small>
        </div>
        <!-- 右上：操作狀態 -->
        <div class="bench-card status-card">
          <span class="kicker">操作狀態</span>
          <strong id="pipetteStatus">尚未選擇 pipette</strong>
        </div>
        <!-- 上方／中間：四支 pipette -->
        <div class="pipette-rack">
          ${[
            {
              name: "P10",
              className: "p10",
              range: "0.5–10 μL"
            },
            {
              name: "P20",
              className: "p20",
              range: "2–20 μL"
            },
            {
              name: "P200",
              className: "p200",
              range: "20–200 μL"
            },
            {
              name: "P1000",
              className: "p1000",
              range: "100–1000 μL"
            }
          ].map(item => `
            <button
              type="button"
              class="pipette ${item.className}"
              data-p="${item.name}"
              aria-label="選擇 ${item.name}"
            >
              <label>${item.name}</label>
              <span class="range">${item.range}</span>
            </button>
          `).join("")}
        </div>
      </div>
      <!-- 下方控制區 -->
      <div class="controls">
        <!-- 數值設定 -->
        <div class="control-group">
          <span class="kicker">容量顯示窗</span>
          <div class="digit-controls">
            ${[0, 1, 2, 3].map(index => `
              <div class="digit">
                <button
                  type="button"
                  data-i="${index}"
                  data-dir="1"
                  aria-label="增加第 ${index + 1} 位數"
                >
                  ▲
                </button>
                <span id="digit${index}">0</span>
                <button
                  type="button"
                  data-i="${index}"
                  data-dir="-1"
                  aria-label="減少第 ${index + 1} 位數"
                >
                  ▼
                </button>
              </div>
            `).join("")}
          </div>
        </div>
        <!-- Tip 盒：與數值控制並列 -->
        <div class="control-group">
          <span class="kicker">TIP 盒</span>
          <div class="tip-box">
            ${Array.from({ length: 24 }, (_, index) => `
              <button
                type="button"
                class="tip-dot"
                data-tip="${index}"
                aria-label="安裝第 ${index + 1} 個 tip"
              ></button>
            `).join("")}
          </div>
          <small id="tipStatus">尚未安裝 tip</small>
        </div>
        <!-- 圓形吸液／排液按鈕 -->
        <div class="control-group pressure-pad">
          <span class="kicker">PLUNGER</span>
          <div class="tip-visual">
            <div id="tipFill" class="tip-fill"></div>
          </div>
          <button
            type="button"
            id="plungerBtn"
            class="plunger"
          >
            按壓吸液
          </button>
          <small>再按一次即可排入 Tube B</small>
        </div>
      </div>
    `
  );
  const status = stage.querySelector("#pipetteStatus");
  const tipStatus = stage.querySelector("#tipStatus");
  const plungerButton = stage.querySelector("#plungerBtn");
  const tipFill = stage.querySelector("#tipFill");
  function currentVolume() {
    return (
      digits[0] * 1000 +
      digits[1] * 100 +
      digits[2] * 10 +
      digits[3]
    );
  }

  /*
   * 選擇 pipette
   */
  stage.querySelectorAll(".pipette").forEach(button => {
    button.addEventListener("click", () => {
      stage.querySelectorAll(".pipette").forEach(item => {
        item.classList.remove("selected");
      });
      button.classList.add("selected");
      selected = button.dataset.p;
      status.textContent = `已選擇 ${selected}`;
      if (selected !== correct) {
        ctx.penalize(
          "accuracy",
          18,
          `此容量較適合使用 ${correct}。`
        );
      }
    });
  });
  /*
   * 調整四位數容量
   */
  stage.querySelectorAll(".digit button").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.i);
      const direction = Number(button.dataset.dir);
      digits[index] =
        (digits[index] + direction + 10) % 10;
      stage.querySelector(
        `#digit${index}`
      ).textContent = digits[index];
      updateVolumeDisplay();
    });
  });
  /*
   * 安裝 tip
   */
  stage.querySelectorAll(".tip-dot").forEach(button => {
    button.addEventListener("click", () => {
      if (button.classList.contains("used")) {
        return;
      }
      stage.querySelectorAll(".tip-dot").forEach(item => {
        item.classList.remove("selected");
      });
      button.classList.add("used", "selected");
      tipInstalled = true;
      tipStatus.textContent = "Tip 安裝完成";
      status.textContent = "Tip 安裝完成";
    });
  });
  /*
   * 吸液／排液
   */
  plungerButton.addEventListener("click", () => {
    const numeric = currentVolume();
    if (!selected) {
      ctx.penalize(
        "safety",
        18,
        "請先選擇 pipette。"
      );
      return;
    }
    if (!tipInstalled) {
      ctx.penalize(
        "safety",
        22,
        "請先安裝新的 tip。"
      );
      return;
    }
    if (selected !== correct) {
      ctx.penalize(
        "accuracy",
        22,
        `本題應使用 ${correct}。`
      );
      return;
    }
    if (numeric !== target) {
      ctx.penalize(
        "accuracy",
        22,
        `目前設定為 ${numeric} μL，任務要求 ${target} μL。`
      );
      return;
    }
    liquidLoaded = !liquidLoaded;
    tipFill.style.height =
      liquidLoaded ? "65%" : "0";
    plungerButton.classList.toggle(
      "active",
      liquidLoaded
    );
    if (liquidLoaded) {
      status.textContent =
        `已吸取 ${target} μL，請再按一次排入 Tube B`;
      plungerButton.textContent = "按壓排液";
      return;
    }
    status.textContent =
      `${target} μL 已排入 Tube B`;
    plungerButton.textContent = "排液完成";
    ctx.complete();
  });
},
  
  serological(ctx){
    let volume=0;
    const target=[5,10,15,20,25][(ctx.config.level+ctx.config.roundIndex-7)%5];
    ctx.stage.innerHTML=this.shell("Serological Pipette 培養液轉移",`將培養液吸至 ${target} mL 刻度並排入flask。`,
    `<div class="liquid-scene"><div class="tube"><div id="mediaLiquid" class="liquid" style="height:70%;background:linear-gradient(#f3b49f,#e38871)"></div></div>
    <div class="pressure-pad"><div class="tip-visual" style="height:220px;width:46px"><div id="seroFill" class="tip-fill"></div></div><p>目前：<strong id="seroValue">0.0</strong> mL</p>
    <button id="aspirateBtn" class="btn btn-primary">長按吸液</button><button id="dispenseBtn" class="btn btn-soft">排入flask</button></div></div>`);
    const fill=ctx.stage.querySelector("#seroFill"),value=ctx.stage.querySelector("#seroValue");
    let timer;
    const start=()=>{timer=setInterval(()=>{volume=Math.min(25,volume+.5);value.textContent=volume.toFixed(1);fill.style.height=`${Math.min(95,volume/25*100)}%`;if(volume>target+2)ctx.penalize("sampleQuality",12,"液體吸取超過指定刻度。")},90)};
    const stop=()=>clearInterval(timer);
    const btn=ctx.stage.querySelector("#aspirateBtn");["mousedown","touchstart"].forEach(e=>btn.addEventListener(e,start));["mouseup","mouseleave","touchend"].forEach(e=>btn.addEventListener(e,stop));
    ctx.stage.querySelector("#dispenseBtn").onclick=()=>{if(Math.abs(volume-target)<=1)ctx.complete();else ctx.penalize("accuracy",24,"吸取體積不正確。")};
  },
  centrifuge(ctx){
  const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const level = ctx.config.level;
  const round = ctx.config.roundIndex || 1;

  /*
   * Lv9：8孔
   * Lv10：12孔
   * Lv11：16孔
   * Lv12以上或較後回合：24孔
   */
  let holes = 8;
  if (level >= 12 || (level >= 11 && round >= 3)) {
    holes = 24;
  } else if (level >= 11) {
    holes = 16;
  } else if (level >= 10) {
    holes = 12;
  }
  const maximumPairs =
    holes === 8 ? 3 :
    holes === 12 ? 4 :
    holes === 16 ? 6 :
    8;
  const difficultyPairs = Math.min(
    maximumPairs,
    Math.max(1, Math.floor((level - 8 + round) / 2))
  );
  const pairCount = difficultyPairs;
  const tubeCount = pairCount * 2;
  // 可出現的離心條件
  const gOptions = [1000, 1500, 2000, 2500, 3000];
  const timeOptions = [3, 5, 7, 10];
  const targetG =
    gOptions[randomInt(0, gOptions.length - 1)];
  const targetTime =
    timeOptions[randomInt(0, timeOptions.length - 1)];
  /*
   * 每一對 tube 使用相同容量，但不同對之間可以不同。
   * 玩家必須把同容量的 tube 放到正對面。
   */
  const tubes = [];
  for (let pair = 0; pair < pairCount; pair++) {
    const volume = randomInt(1, 20) * 50;
    tubes.push({
      id: pair * 2 + 1,
      volume,
      pair
    });
    tubes.push({
      id: pair * 2 + 2,
      volume,
      pair
    });
  }

  // 洗牌，避免成對 tube 永遠排在一起
  for (let i = tubes.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [tubes[i], tubes[j]] = [tubes[j], tubes[i]];
  }
  let selectedTube = null;
  const placements = {};
  ctx.stage.innerHTML = this.shell(
    "Centrifuge 配平",
    `將 ${tubeCount} 支不同容量的 tube 正確配平，並設定指定離心條件。`,
    `
      <div class="centrifuge-instructions">
        <strong>任務條件</strong>
        <span>${targetG} ×g</span>
        <span>${targetTime} min</span>
        <small>
          正對面的 tube 必須具有相同體積。
        </small>
      </div>
      <div
        class="centrifuge-rotor rotor-${holes}"
        style="--rotor-holes:${holes}"
      >
        ${Array.from({length: holes}, (_, index) => {
          const angle = (360 / holes) * index;

          return `
            <button
              type="button"
              class="rotor-hole"
              data-hole="${index}"
              style="--hole-angle:${angle}deg"
              aria-label="Rotor position ${index + 1}"
            >
              <small>${index + 1}</small>
            </button>
          `;
        }).join("")}
      </div>
      <div class="tube-tray">
        ${tubes.map(tube => `
          <button
            type="button"
            class="tube-token"
            data-tube="${tube.id}"
            data-volume="${tube.volume}"
            data-pair="${tube.pair}"
          >
            <strong>${tube.id}</strong>
            <span>${tube.volume} μL</span>
          </button>
        `).join("")}
      </div>
      <div class="centrifuge-controls">
        <label>
          離心力：
          <strong><span id="gText">${targetG}</span> ×g</strong>

          <input
            id="gForce"
            type="range"
            min="500"
            max="3000"
            step="500"
            value="${targetG}"
          >
        </label>
        <label>
          時間：
          <strong><span id="timeText">${targetTime} min</span></strong>
          <input
            id="spinTime"
            type="range"
            min="1"
            max="10"
            step="1"
            value="${targetTime}"
          >
        </label>
      </div>
      <button type="button" id="spinBtn" class="btn btn-primary">
        啟動離心機
      </button>
    `
  );

  ctx.stage.querySelectorAll(".tube-token").forEach(button => {
    button.onclick = () => {
      if (button.disabled) return;
      ctx.stage.querySelectorAll(".tube-token").forEach(item => {
        item.classList.remove("selected");
      });
      button.classList.add("selected");
      selectedTube = button;
    };
  });

  ctx.stage.querySelectorAll(".rotor-hole").forEach(hole => {
    hole.onclick = () => {
      if (!selectedTube || hole.classList.contains("filled")) return;
      const tubeId = Number(selectedTube.dataset.tube);
      const volume = Number(selectedTube.dataset.volume);
      const pair = Number(selectedTube.dataset.pair);
      const position = Number(hole.dataset.hole);
      placements[position] = {
        tubeId,
        volume,
        pair
      };
      hole.classList.add("filled");
      // 放入 rotor 後只顯示清楚的 tube 編號
      hole.innerHTML = `<strong>${tubeId}</strong>`;
      hole.title = `Tube ${tubeId}：${volume} μL`;
      selectedTube.disabled = true;
      selectedTube.classList.remove("selected");
      selectedTube = null;
    };
  });
  const gForce = ctx.stage.querySelector("#gForce");
  const spinTime = ctx.stage.querySelector("#spinTime");
  gForce.oninput = () => {
    ctx.stage.querySelector("#gText").textContent = gForce.value;
  };
  spinTime.oninput = () => {
    ctx.stage.querySelector("#timeText").textContent =
      `${spinTime.value} min`;
  }
  ctx.stage.querySelector("#spinBtn").onclick = () => {
    const occupiedPositions =
      Object.keys(placements).map(Number);
    if (occupiedPositions.length !== tubeCount) {
      ctx.penalize(
        "safety",
        32,
        "尚有 tube 未放入 rotor。"
      );
      return;
    }
    /*
     * 每個位置的正對面：
     * position + holes / 2
     */
    const balanced = occupiedPositions.every(position => {
      const opposite =
        (position + holes / 2) % holes;
      const currentTube = placements[position];
      const oppositeTube = placements[opposite];
      return (
        oppositeTube &&
        currentTube.volume === oppositeTube.volume
      );
    });
    if (!balanced) {
      ctx.penalize(
        "safety",
        45,
        "Rotor 未正確配平：正對面的 tube 體積不同或缺少對應 tube。"
      );
      return;
    }
    if (
      Number(gForce.value) !== targetG ||
      Number(spinTime.value) !== targetTime
    ) {
      ctx.penalize(
        "sampleQuality",
        22,
        `離心條件錯誤。本回合需要 ${targetG} ×g、${targetTime} min。`
      );
      return;
    }
    ctx.complete();
  };
},
  equipment(ctx){
    const idx=ctx.config.level-13;
    const events=[
      {title:"Vortex混合",text:"Sample需充分混合，但不可產生大量氣泡。",opts:["混合1秒","混合5秒","持續混合30秒"],good:1,fail:"混合時間不正確，sample狀態不佳。"},
      {title:"Incubator設定",text:"請為哺乳類細胞設定培養條件。",opts:["25°C／0% CO₂","37°C／5% CO₂","42°C／10% CO₂"],good:1,fail:"培養條件錯誤，細胞逐漸死亡。"},
      {title:"設備工作站",text:"請選擇正確流程處理細胞樣本。",opts:["顯微鏡→Vortex→Incubator","Vortex→Centrifuge→Microscope","Centrifuge→烘箱→Freezer"],good:1,fail:"設備順序錯誤，樣本無法完成處理。"}
    ][(idx+ctx.config.roundIndex-1)%3];
    ctx.stage.innerHTML=this.shell(events.title,events.text,`<div class="event-card"><div class="event-options">${events.opts.map((o,i)=>`<button data-i="${i}">${o}</button>`).join("")}</div></div>`);
    ctx.stage.querySelectorAll(".event-options button").forEach(b=>b.onclick=()=>+b.dataset.i===events.good?ctx.complete():ctx.penalize("sampleQuality",45,events.fail));
  },
  plate(ctx){
    const targetCount=3+ctx.config.level-16, targets=[];
    while(targets.length<targetCount){const n=Math.floor(Math.random()*96);if(!targets.includes(n))targets.push(n)}
    let done=0;
    ctx.stage.innerHTML=this.shell("96-Well Plate 加樣",`請依照亮起的孔位完成 ${targetCount} 個well。`,
    `<div class="plate-wrap"><div></div><div><div class="plate-labels-x">${Array.from({length:12},(_,i)=>`<span class="plate-label">${i+1}</span>`).join("")}</div><div class="well-plate">${Array.from({length:96},(_,i)=>`<button class="well ${targets.includes(i)?"target":""}" data-i="${i}" aria-label="${String.fromCharCode(65+Math.floor(i/12))}${i%12+1}"></button>`).join("")}</div></div></div><p style="text-align:center">完成：<strong id="wellProgress">0</strong> / ${targetCount}</p>`);
    ctx.stage.querySelectorAll(".well").forEach(w=>w.onclick=()=>{
      if(w.classList.contains("filled"))return;
      if(targets.includes(+w.dataset.i)){w.classList.add("filled");done++;ctx.stage.querySelector("#wellProgress").textContent=done;if(done===targetCount)ctx.complete()}
      else{w.classList.add("wrong");ctx.penalize("accuracy",18,"加錯well，組別可能混淆。")}
    });
  },
  microscope(ctx){
    ctx.stage.innerHTML=this.shell("Microscope 對焦與影像確認","調整亮度、粗焦與細焦，使影像清晰且不過曝。",
    `<div class="microscope-stage"><div class="scope-view"><div id="cellField" class="cell-field"></div></div><div class="scope-controls">
      <label>亮度<input id="brightness" type="range" min="50" max="150" value="90"></label>
      <label>粗焦<input id="coarse" type="range" min="0" max="20" value="4"></label>
      <label>細焦<input id="fine" type="range" min="0" max="20" value="6"></label>
      <button id="captureBtn" class="btn btn-primary">拍攝影像</button>
    </div></div>`);
    const field=ctx.stage.querySelector("#cellField"),brightness=ctx.stage.querySelector("#brightness"),coarse=ctx.stage.querySelector("#coarse"),fine=ctx.stage.querySelector("#fine");
    const update=()=>{const blur=Math.abs(+coarse.value-13)*.7+Math.abs(+fine.value-15)*.22;field.style.filter=`blur(${blur}px) brightness(${brightness.value/100})`;};
    [brightness,coarse,fine].forEach(x=>x.oninput=update);update();
    ctx.stage.querySelector("#captureBtn").onclick=()=>{
      const blur=Math.abs(+coarse.value-13)*.7+Math.abs(+fine.value-15)*.22,b=+brightness.value;
      if(blur<=1.4&&b>=80&&b<=115)ctx.complete();
      else{if(blur>1.4)ctx.penalize("accuracy",24,"影像失焦，無法判讀細胞狀態。");if(b<80||b>115)ctx.penalize("sampleQuality",18,"影像過暗或過曝。")}
    };
  }
};
