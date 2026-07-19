/******************************************************************************
 * BOSS 20
 *
 * 檔案位置：
 * js/games/boss/boss20.js
 *
 * 載入順序：
 * 1. boss20.js
 * 2. training-games.js
 *
 * training-games.js 之後只需要呼叫：
 *
 * boss20(ctx){
 *   Boss20.mount(ctx,this);
 * }
 ******************************************************************************/

const Boss20={

  /*
   * TrainingGames 物件。
   *
   * 用來沿用既有的：
   * - shell()
   * - finishRound()
   */
  game:null,

  /*
   * Level 20 五回合共用資料。
   */
  state:null,

  /*
   * 避免同一次任務重複觸發失敗。
   */
  missionFailed:false,

  /*
   * 執行中的 timeout。
   *
   * 任務失敗時會清除，避免失敗畫面出現後，
   * 舊回合的動畫又呼叫 ctx.complete()。
   */
  timers:new Set(),


  /**************************************************************************
   * Boss 入口
   **************************************************************************/

  mount(ctx,game){

    this.game=game;

    const round=
      Number(
        ctx.config.roundIndex||1
      );

    /*
     * Round 1 表示新任務開始。
     */
    if(
      round===1||
      !this.state
    ){
      this.resetMission();
    }

    /*
     * 若前一回合已經失敗，
     * 不應再載入後續回合。
     */
    if(this.missionFailed){
      this.renderFailedState(
        ctx,
        this.state?.failureReasons||[
          "Boss mission has already failed."
        ]
      );

      return;
    }

    /*
     * 讓各回合可以從 ctx 取得共用 state。
     */
    ctx.boss20State=
      this.state;

    ctx.boss20Round=
      round;

    const roundMap={
      1:this.round1,
      2:this.round2,
      3:this.round3,
      4:this.round4,
      5:this.round5
    };

    const roundGame=
      roundMap[round]||
      this.round1;

    roundGame.call(
      this,
      ctx
    );
  },


  /**************************************************************************
   * 重設任務
   **************************************************************************/

  resetMission(){

    this.clearTimers();

    this.missionFailed=false;

    this.state=
      this.createState();
  },


  /**************************************************************************
   * 建立五回合共用資料
   **************************************************************************/

  createState(){

    /*
     * 為了讓每兩支 tube 容量相同，
     * 最終容量使用偶數。
     *
     * 範圍仍為 100–1000 mL。
     */
    const totalVolume=
      this.randomEvenInt(
        100,
        1000
      );

    const formula={

      DMEM:
        this.roundOneDecimal(
          totalVolume*.89
        ),

      FBS:
        this.roundOneDecimal(
          totalVolume*.10
        ),

      "Pen/Strep":
        this.roundOneDecimal(
          totalVolume*.01
        ),

      PBS:0,

      Trypsin:0
    };

    /*
     * Round 2 與 Round 3 使用同一批 tubes。
     */
    const tubes=
      this.createTubePairs(
        totalVolume
      );

    return{

      totalVolume,

      formula,

      /*
       * 同一瓶 Complete DMEM。
       */
      bottle:{
        id:"boss20-complete-dmem",
        name:"Complete DMEM",

        /*
         * Round 1 完成前液體由加入試劑的量決定。
         */
        currentVolume:0,

        /*
         * Round 1 成功後會變成 totalVolume。
         */
        prepared:false,

        /*
         * Round 4 完成後寫入。
         */
        label:{
          mediumName:"",
          totalVolume:"",
          fbs:"",
          penStrep:"",
          preparationDate:"",
          operatorInitials:"",
          storage:""
        }
      },

      /*
       * Round 1
       */
      preparation:{
        selectedReagents:[],
        enteredVolumes:{
          DMEM:"",
          FBS:"",
          "Pen/Strep":"",
          PBS:"",
          Trypsin:""
        },
        passed:false
      },

      /*
       * Round 2
       */
      transfer:{
        tubes,
        selectedTubeId:null,
        selectedPipette:null,
        setVolume:0,
        passed:false
      },

      /*
       * Round 3
       */
      centrifuge:{
        placements:{},
        force:500,
        time:1,
        targetForce:1500,
        targetTime:5,
        passed:false
      },

      /*
       * Round 4
       */
      labeling:{
        selectedItems:[],
        passed:false
      },

      /*
       * Round 5 暫時保留。
       */
      inspection:{
        postponed:true,
        passed:false
      },

      currentRound:1,

      failureRound:null,

      failureReasons:[]
    };
  },


  /**************************************************************************
   * 建立 Round 2 / Round 3 共用離心管
   *
   * 規則：
   * - 每支 tube 容量 1–50 mL
   * - 每兩支 tube 具有相同容量
   * - 所有 tube 容量總和等於 totalVolume
   * - Tube 1 / 2 為一組
   * - Tube 3 / 4 為一組
   **************************************************************************/

  createTubePairs(totalVolume){

    /*
     * 一對 tube 會消耗：
     *
     * pairVolume × 2
     *
     * 因此只需要把總容量的一半拆分。
     */
    const halfVolume=
      totalVolume/2;

    /*
     * 每個 pairVolume 最大 50 mL。
     */
    const minimumPairCount=
      Math.ceil(
        halfVolume/50
      );

    /*
     * 最多增加兩組，使容量組合更隨機。
     *
     * 但每組至少必須有 1 mL。
     */
    const maximumPairCount=
      Math.min(
        Math.floor(halfVolume),
        minimumPairCount+2,
        12
      );

    const pairCount=
      this.randomInt(
        minimumPairCount,
        maximumPairCount
      );

    const pairVolumes=
      this.partitionVolume(
        halfVolume,
        pairCount,
        1,
        50
      );

    const tubes=[];

    pairVolumes.forEach(
      (volume,pairIndex)=>{

        const firstTubeId=
          pairIndex*2+1;

        tubes.push(
          {
            id:firstTubeId,
            pairId:pairIndex+1,
            volume,
            filled:false,
            transferredVolume:0,
            centrifuged:false,
            rotorPosition:null
          },
          {
            id:firstTubeId+1,
            pairId:pairIndex+1,
            volume,
            filled:false,
            transferredVolume:0,
            centrifuged:false,
            rotorPosition:null
          }
        );
      }
    );

    return tubes;
  },


  /**************************************************************************
   * 將 total 拆成 count 份
   *
   * 每份：
   * min ≤ value ≤ max
   **************************************************************************/

  partitionVolume(
    total,
    count,
    min,
    max
  ){

    const values=[];

    let remaining=
      total;

    for(
      let index=0;
      index<count;
      index++
    ){

      const itemsLeft=
        count-index;

      /*
       * 最後一份直接使用剩餘容量。
       */
      if(itemsLeft===1){

        values.push(
          this.roundOneDecimal(
            remaining
          )
        );

        break;
      }

      /*
       * 目前這一份可以使用的最小值。
       *
       * 必須確保剩下的容量不會超過：
       * 剩餘份數 × max。
       */
      const currentMinimum=
        Math.max(
          min,
          remaining-
          (
            itemsLeft-1
          )*max
        );

      /*
       * 目前這一份可以使用的最大值。
       *
       * 必須保留：
       * 剩餘份數 × min。
       */
      const currentMaximum=
        Math.min(
          max,
          remaining-
          (
            itemsLeft-1
          )*min
        );

      const value=
        this.randomInt(
          Math.ceil(currentMinimum),
          Math.floor(currentMaximum)
        );

      values.push(value);

      remaining=
        this.roundOneDecimal(
          remaining-value
        );
    }

    /*
     * 打亂容量組合，
     * 避免大容量永遠出現在前面。
     */
    return this.shuffle(
      values
    );
  },


  /**************************************************************************
   * Boss 任務立即失敗
   *
   * 不呼叫一般的 finishRound()，
   * 因為一般 finishRound() 會直接進入下一回合。
   **************************************************************************/

  failMission(
    ctx,
    reasons,
    options={}
  ){

    if(this.missionFailed){
      return;
    }

    const normalizedReasons=
      Array.isArray(reasons)
        ?reasons
        :[reasons];

    this.missionFailed=true;

    this.state.failureRound=
      Number(
        ctx.config.roundIndex||1
      );

    this.state.failureReasons=
      normalizedReasons.filter(Boolean);

    this.clearTimers();

    /*
     * options.penalties 可指定失敗扣分。
     *
     * 例如錯誤試劑：
     * - accuracy 100
     * - sampleQuality 100
     * - safety 不扣分
     */
    const penalties=
      Array.isArray(options.penalties)
        ?options.penalties
        :[];

    penalties.forEach(
      penalty=>{

        if(
          !penalty||
          !penalty.metric||
          !penalty.amount
        ){
          return;
        }

        ctx.penalize(
          penalty.metric,
          penalty.amount,
          penalty.message||
          normalizedReasons[0]||
          "Boss mission failed."
        );
      }
    );

    this.renderFailedState(
      ctx,
      this.state.failureReasons
    );
  },


  /**************************************************************************
   * Mission Failed 畫面
   **************************************************************************/

  renderFailedState(
    ctx,
    reasons=[]
  ){

    const round=
      this.state?.failureRound||
      Number(
        ctx.config.roundIndex||1
      );

    ctx.stage.innerHTML=
      this.game.shell(
        "Boss Mission Failed",
        `Round ${round} 操作失敗，實驗流程已立即終止。`,
        `
          <div class="boss20-failure-screen">

            <div class="boss20-failure-icon">
              ✕
            </div>

            <h3>
              Mission Failed
            </h3>

            <p>
              本次 Complete DMEM 任務無法繼續。
            </p>

            <div class="boss20-failure-reasons">

              <strong>
                Failure reason
              </strong>

              <ul>
                ${
                  reasons
                    .map(
                      reason=>`
                        <li>
                          ${this.escapeHtml(reason)}
                        </li>
                      `
                    )
                    .join("")
                }
              </ul>

            </div>

            <div class="controls">

              <button
                type="button"
                id="boss20RestartMission"
                class="btn btn-primary btn-large"
              >
                重新挑戰
              </button>

              <button
                type="button"
                id="boss20ReturnMap"
                class="btn btn-soft btn-large"
              >
                回到地圖
              </button>

            </div>

          </div>
        `
      );

    const restartButton=
      ctx.stage.querySelector(
        "#boss20RestartMission"
      );

    const returnButton=
      ctx.stage.querySelector(
        "#boss20ReturnMap"
      );

    /*
     * training-games.js 後續會加入 abortBoss()。
     */
    restartButton.onclick=()=>{

      this.resetMission();

      if(
        typeof ctx.abortBoss===
        "function"
      ){
        ctx.abortBoss({
          action:"restart",
          reasons
        });

        return;
      }

      /*
       * 尚未修改 training-games.js 時的備援。
       */
      window.location.reload();
    };

    returnButton.onclick=()=>{

      if(
        typeof ctx.abortBoss===
        "function"
      ){
        ctx.abortBoss({
          action:"map",
          reasons
        });

        return;
      }

      /*
       * 嘗試使用專案可能已有的返回按鈕。
       */
      const existingBackButton=
        document.querySelector(
          [
            "#backToMap",
            "#returnToMap",
            "[data-action='map']",
            ".back-to-map"
          ].join(",")
        );

      if(existingBackButton){
        existingBackButton.click();
        return;
      }

      window.history.back();
    };
  },


  /**************************************************************************
   * 正常完成一個 Round
   **************************************************************************/

  completeRound(
    ctx,
    delay=350
  ){

    if(this.missionFailed){
      return;
    }

    this.setTimer(
      ()=>{

        if(this.missionFailed){
          return;
        }

        this.game.finishRound(
          ctx,
          []
        );
      },
      delay
    );
  },


  /**************************************************************************
   * 共用培養基瓶 HTML
   **************************************************************************/

  bottleHtml(options={}){

    const state=
      this.state;

    const totalVolume=
      Number(
        state.totalVolume
      )||1;

    const currentVolume=
      Math.max(
        0,
        Number(
          options.currentVolume ??
          state.bottle.currentVolume ??
          0
        )
      );

    const fillPercent=
      Math.max(
        0,
        Math.min(
          100,
          currentVolume/
          totalVolume*
          100
        )
      );

    const showLabel=
      Boolean(
        options.showLabel
      );

    const label=
      options.label||
      state.bottle.label;

    const labelHtml=
      showLabel
        ?`
            <div class="boss20-bottle-label">

              <strong>
                ${
                  this.escapeHtml(
                    label.mediumName||
                    "Complete DMEM"
                  )
                }
              </strong>

              <span>
                ${
                  this.escapeHtml(
                    label.totalVolume||
                    `${totalVolume} mL`
                  )
                }
              </span>

              <span>
                ${
                  this.escapeHtml(
                    label.fbs||
                    "10% FBS"
                  )
                }
              </span>

              <span>
                ${
                  this.escapeHtml(
                    label.penStrep||
                    "1% Pen/Strep"
                  )
                }
              </span>

              ${
                label.preparationDate
                  ?`
                      <span>
                        Date：
                        ${
                          this.escapeHtml(
                            label.preparationDate
                          )
                        }
                      </span>
                    `
                  :""
              }

              ${
                label.operatorInitials
                  ?`
                      <span>
                        Operator：
                        ${
                          this.escapeHtml(
                            label.operatorInitials
                          )
                        }
                      </span>
                    `
                  :""
              }

              <span>
                ${
                  this.escapeHtml(
                    label.storage||
                    "4°C"
                  )
                }
              </span>

            </div>
          `
        :"";

    return`
      <div class="boss20-real-bottle">

        <div class="boss20-bottle-cap"></div>

        <div class="boss20-bottle-neck"></div>

        <div class="boss20-bottle-body">

          <div
            class="boss20-bottle-liquid"
            style="height:${fillPercent}%"
          ></div>

          ${labelHtml}

          <div class="boss20-bottle-volume">

            <strong>
              ${this.displayNumber(currentVolume)} mL
            </strong>

            <small>
              of ${this.displayNumber(totalVolume)} mL
            </small>

          </div>

        </div>

      </div>
    `;
  },


  /**************************************************************************
   * 共用 Tube HTML
   **************************************************************************/

  tubeHtml(
    tube,
    options={}
  ){

    const maximumVolume=
      Number(
        options.maximumVolume||50
      );

    const currentVolume=
      Number(
        options.currentVolume ??
        tube.transferredVolume ??
        0
      );

    const fillPercent=
      Math.max(
        0,
        Math.min(
          82,
          currentVolume/
          maximumVolume*
          82
        )
      );

    const selected=
      Boolean(
        options.selected
      );

    const disabled=
      Boolean(
        options.disabled
      );

    return`
      <button
        type="button"
        class="
          boss20-transfer-tube
          ${tube.filled?"filled":""}
          ${selected?"selected":""}
        "
        data-tube-id="${tube.id}"
        ${disabled?"disabled":""}
      >

        <span class="boss20-tube-cap"></span>

        <span class="boss20-tube-body">

          <span
            class="boss20-tube-liquid"
            style="height:${fillPercent}%"
          ></span>

          <strong>
            Tube ${tube.id}
          </strong>

          <small>
            Target：
            ${this.displayNumber(tube.volume)} mL
          </small>

          <small class="boss20-tube-current">
            Current：
            ${this.displayNumber(currentVolume)} mL
          </small>

        </span>

      </button>
    `;
  },


  /**************************************************************************
   * Timer 管理
   **************************************************************************/

  setTimer(callback,delay){

    const timer=
      window.setTimeout(
        ()=>{

          this.timers.delete(
            timer
          );

          callback();
        },
        delay
      );

    this.timers.add(
      timer
    );

    return timer;
  },

  clearTimers(){

    this.timers.forEach(
      timer=>{
        window.clearTimeout(
          timer
        );
      }
    );

    this.timers.clear();
  },


  /**************************************************************************
   * 數字工具
   **************************************************************************/

  randomInt(min,max){

    return Math.floor(
      Math.random()*
      (
        max-min+1
      )
    )+min;
  },

  randomEvenInt(min,max){

    const minimumEven=
      min%2===0
        ?min
        :min+1;

    const maximumEven=
      max%2===0
        ?max
        :max-1;

    const numberOfValues=
      (
        maximumEven-
        minimumEven
      )/2;

    return minimumEven+
      this.randomInt(
        0,
        numberOfValues
      )*2;
  },

  roundOneDecimal(value){

    return Number(
      Number(value).toFixed(1)
    );
  },

  displayNumber(value){

    const number=
      Number(value);

    if(!Number.isFinite(number)){
      return "0";
    }

    if(Number.isInteger(number)){
      return String(number);
    }

    return String(
      Number(
        number.toFixed(1)
      )
    );
  },

  approximatelyEqual(
    first,
    second,
    tolerance=.1
  ){

    return Math.abs(
      Number(first)-
      Number(second)
    )<=tolerance;
  },


  /**************************************************************************
   * Array 工具
   **************************************************************************/

  shuffle(array){

    const copiedArray=[
      ...array
    ];

    for(
      let index=
        copiedArray.length-1;
      index>0;
      index--
    ){

      const randomIndex=
        Math.floor(
          Math.random()*
          (
            index+1
          )
        );

      [
        copiedArray[index],
        copiedArray[randomIndex]
      ]=[
        copiedArray[randomIndex],
        copiedArray[index]
      ];
    }

    return copiedArray;
  },


  /**************************************************************************
   * HTML 安全處理
   **************************************************************************/

  escapeHtml(value){

    return String(
      value??""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        "\"",
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  },


  /**************************************************************************
   * ROUND 1
   * Prepare Complete DMEM
   **************************************************************************/

  round1(ctx){

    const state=
      this.state;

    state.currentRound=1;

    const preparation=
      state.preparation;

    const reagentNames=[
      "DMEM",
      "FBS",
      "Pen/Strep",
      "PBS",
      "Trypsin"
    ];

    const requiredReagents=[
      "DMEM",
      "FBS",
      "Pen/Strep"
    ];

    const wrongReagents=[
      "PBS",
      "Trypsin"
    ];

    /*
     * 延續同一回合中已經點選的狀態。
     */
    const selectedReagents=
      new Set(
        preparation.selectedReagents||[]
      );

    const reagentDescriptions={

      DMEM:
        "Basal medium",

      FBS:
        "Serum supplement",

      "Pen/Strep":
        "Antibiotic supplement",

      PBS:
        "Wash buffer",

      Trypsin:
        "Cell dissociation reagent"
    };

    const reagentIcons={

      DMEM:"🧴",

      FBS:"🩸",

      "Pen/Strep":"💧",

      PBS:"🧪",

      Trypsin:"⚗️"
    };


    /**********************************************************************
     * 讀取五個輸入欄位
     **********************************************************************/

    const readEnteredVolumes=()=>{

      const values={};

      reagentNames.forEach(
        name=>{

          const input=
            ctx.stage.querySelector(
              `[data-boss20-volume="${name}"]`
            );

          const rawValue=
            input
              ?input.value.trim()
              :"";

          values[name]={
            raw:rawValue,
            number:
              rawValue===""
                ?null
                :Number(rawValue)
          };
        }
      );

      return values;
    };


    /**********************************************************************
     * 保存輸入內容
     **********************************************************************/

    const saveEnteredVolumes=()=>{

      const values=
        readEnteredVolumes();

      reagentNames.forEach(
        name=>{

          preparation.enteredVolumes[name]=
            values[name].raw;
        }
      );
    };


    /**********************************************************************
     * 依照已加入試劑計算瓶內視覺容量
     **********************************************************************/

    const calculateVisualVolume=()=>{

      const values=
        readEnteredVolumes();

      let visualVolume=0;

      selectedReagents.forEach(
        name=>{

          const entered=
            values[name].number;

          /*
           * 已點選但尚未輸入容量時，
           * 先顯示少量液體，讓操作有視覺回饋。
           */
          if(
            entered===null||
            !Number.isFinite(entered)||
            entered<=0
          ){
            visualVolume+=
              state.totalVolume*.04;

            return;
          }

          visualVolume+=entered;
        }
      );

      return Math.max(
        0,
        Math.min(
          state.totalVolume,
          this.roundOneDecimal(
            visualVolume
          )
        )
      );
    };


    /**********************************************************************
     * 更新瓶子液面
     **********************************************************************/

    const updateBottle=()=>{

      const bottleHost=
        ctx.stage.querySelector(
          "#boss20PreparationBottle"
        );

      if(!bottleHost){
        return;
      }

      state.bottle.currentVolume=
        calculateVisualVolume();

      bottleHost.innerHTML=
        this.bottleHtml({
          currentVolume:
            state.bottle.currentVolume
        });
    };


    /**********************************************************************
     * 更新已選試劑清單
     **********************************************************************/

    const updateSelectedList=()=>{

      const list=
        ctx.stage.querySelector(
          "#boss20SelectedReagents"
        );

      if(!list){
        return;
      }

      if(selectedReagents.size===0){

        list.innerHTML=`
          <span class="boss20-empty-selection">
            尚未加入任何試劑
          </span>
        `;

        return;
      }

      list.innerHTML=
        [...selectedReagents]
          .map(
            name=>`
              <button
                type="button"
                class="boss20-selected-reagent-tag"
                data-remove-reagent="${name}"
                title="點擊移除 ${name}"
              >
                <span>
                  ${reagentIcons[name]||"🧪"}
                </span>

                <strong>
                  ${name}
                </strong>

                <span aria-hidden="true">
                  ×
                </span>
              </button>
            `
          )
          .join("");

      list
        .querySelectorAll(
          "[data-remove-reagent]"
        )
        .forEach(
          button=>{

            button.addEventListener(
              "click",
              ()=>{

                const name=
                  button.dataset.removeReagent;

                removeReagent(name);
              }
            );
          }
        );
    };


    /**********************************************************************
     * 更新試劑按鈕樣式
     **********************************************************************/

    const updateReagentButtons=()=>{

      ctx.stage
        .querySelectorAll(
          "[data-boss20-reagent]"
        )
        .forEach(
          button=>{

            const name=
              button.dataset.boss20Reagent;

            button.classList.toggle(
              "selected",
              selectedReagents.has(name)
            );

            button.setAttribute(
              "aria-pressed",
              selectedReagents.has(name)
                ?"true"
                :"false"
            );
          }
        );
    };


    /**********************************************************************
     * 更新狀態文字
     **********************************************************************/

    const setMessage=(
      message,
      type=""
    )=>{

      const box=
        ctx.stage.querySelector(
          "#boss20PreparationMessage"
        );

      if(!box){
        return;
      }

      box.classList.remove(
        "success",
        "error",
        "warning"
      );

      if(type){
        box.classList.add(type);
      }

      box.innerHTML=message;
    };


    /**********************************************************************
     * 加入試劑
     **********************************************************************/

    const addReagent=name=>{

      if(
        this.missionFailed||
        selectedReagents.has(name)
      ){
        return;
      }

      /*
       * 錯誤試劑一旦加入，
       * 立即結束整個 Boss 任務。
       *
       * 不扣 safety。
       */
      if(wrongReagents.includes(name)){

        selectedReagents.add(name);

        preparation.selectedReagents=
          [...selectedReagents];

        saveEnteredVolumes();

        updateReagentButtons();
        updateSelectedList();
        updateBottle();

        preparation.passed=false;

        this.failMission(
          ctx,
          [
            `將錯誤試劑 ${name} 加入 Complete DMEM。`,
            "培養基配方已受到污染，無法繼續後續實驗。"
          ],
          {
            penalties:[
              {
                metric:"accuracy",
                amount:100,
                message:
                  `錯誤試劑 ${name} 已加入培養基。`
              },
              {
                metric:"sampleQuality",
                amount:100,
                message:
                  "Complete DMEM 配方錯誤，樣本無法使用。"
              }
            ]
          }
        );

        return;
      }

      selectedReagents.add(name);

      preparation.selectedReagents=
        [...selectedReagents];

      updateReagentButtons();
      updateSelectedList();
      updateBottle();

      setMessage(
        `
          <strong>
            ${name} 已加入瓶中
          </strong>

          <span>
            請確認 ${name} 的輸入體積是否正確。
          </span>
        `,
        "success"
      );
    };


    /**********************************************************************
     * 移除試劑
     **********************************************************************/

    const removeReagent=name=>{

      if(this.missionFailed){
        return;
      }

      if(!selectedReagents.has(name)){
        return;
      }

      selectedReagents.delete(name);

      preparation.selectedReagents=
        [...selectedReagents];

      updateReagentButtons();
      updateSelectedList();
      updateBottle();

      setMessage(
        `
          <strong>
            ${name} 已從瓶中移除
          </strong>

          <span>
            你可以重新確認配方後再加入。
          </span>
        `,
        "warning"
      );
    };


    /**********************************************************************
     * Round 1 主畫面
     **********************************************************************/

    ctx.stage.innerHTML=
      this.game.shell(
        "Boss Mission：Prepare Complete DMEM",

        `
          請配製 ${this.displayNumber(
            state.totalVolume
          )} mL Complete DMEM。
          點擊試劑加入或移除，並輸入五種試劑的體積。
          若計算結果有小數，請四捨五入至小數點後一位。
        `,

        `
          <div class="boss20-round boss20-round1">

            <section class="boss20-task-summary">

              <span class="kicker">
                TARGET FORMULA
              </span>

              <div class="boss20-formula-grid">

                <div>
                  <small>
                    Final volume
                  </small>

                  <strong>
                    ${this.displayNumber(
                      state.totalVolume
                    )} mL
                  </strong>
                </div>

                <div>
                  <small>
                    DMEM
                  </small>

                  <strong>
                    89%
                  </strong>
                </div>

                <div>
                  <small>
                    FBS
                  </small>

                  <strong>
                    10%
                  </strong>
                </div>

                <div>
                  <small>
                    Pen/Strep
                  </small>

                  <strong>
                    1%
                  </strong>
                </div>

              </div>

              <div class="notice boss20-rounding-notice">
                If decimal occurs, round to one decimal place.
              </div>

            </section>


            <div class="boss20-preparation-layout">

              <section class="boss20-reagent-panel">

                <div class="boss20-section-heading">

                  <div>
                    <span class="kicker">
                      REAGENT BANK
                    </span>

                    <strong>
                      點擊試劑加入瓶中
                    </strong>
                  </div>

                  <small>
                    再次點擊可移除
                  </small>

                </div>

                <div class="boss-reagent-bank">

                  ${
                    reagentNames
                      .map(
                        name=>`
                          <button
                            type="button"
                            class="
                              boss-reagent
                              ${
                                selectedReagents.has(name)
                                  ?"selected"
                                  :""
                              }
                            "
                            data-boss20-reagent="${name}"
                            aria-pressed="${
                              selectedReagents.has(name)
                                ?"true"
                                :"false"
                            }"
                          >

                            <span
                              class="boss20-reagent-icon"
                              aria-hidden="true"
                            >
                              ${reagentIcons[name]}
                            </span>

                            <strong>
                              ${name}
                            </strong>

                            <small>
                              ${reagentDescriptions[name]}
                            </small>

                          </button>
                        `
                      )
                      .join("")
                  }

                </div>

              </section>


              <section class="boss20-bottle-panel">

                <span class="kicker">
                  COMPLETE DMEM BOTTLE
                </span>

                <div
                  id="boss20PreparationBottle"
                  class="boss20-preparation-bottle"
                >
                  ${this.bottleHtml({
                    currentVolume:
                      state.bottle.currentVolume
                  })}
                </div>

                <div
                  id="boss20SelectedReagents"
                  class="boss20-selected-reagents"
                ></div>

              </section>

            </div>


            <section class="boss20-volume-entry">

              <div class="boss20-section-heading">

                <div>
                  <span class="kicker">
                    VOLUME CALCULATION
                  </span>

                  <strong>
                    輸入各試劑體積
                  </strong>
                </div>

                <small>
                  不需要加入的試劑必須輸入 0
                </small>

              </div>

              <div class="boss-volume-grid boss-volume-grid-five">

                ${
                  reagentNames
                    .map(
                      name=>`
                        <label
                          class="boss20-volume-field"
                        >

                          <span>
                            ${name}
                          </span>

                          <div class="boss20-number-input">

                            <input
                              type="number"
                              min="0"
                              max="${
                                state.totalVolume
                              }"
                              step="0.1"
                              inputmode="decimal"
                              value="${
                                this.escapeHtml(
                                  preparation
                                    .enteredVolumes[
                                      name
                                    ]??""
                                )
                              }"
                              data-boss20-volume="${name}"
                              aria-label="${name} volume"
                            >

                            <span>
                              mL
                            </span>

                          </div>

                        </label>
                      `
                    )
                    .join("")
                }

              </div>

            </section>


            <div
              id="boss20PreparationMessage"
              class="notice"
              aria-live="polite"
            >
              請先計算五種試劑體積，再點擊需要加入的試劑。
            </div>


            <div class="controls">

              <button
                type="button"
                id="boss20CheckPreparation"
                class="btn btn-primary btn-large"
              >
                確認 Complete DMEM 配方
              </button>

            </div>

          </div>
        `
      );


    /**********************************************************************
     * 初始化畫面
     **********************************************************************/

    updateSelectedList();
    updateBottle();


    /**********************************************************************
     * 試劑點擊事件
     **********************************************************************/

    ctx.stage
      .querySelectorAll(
        "[data-boss20-reagent]"
      )
      .forEach(
        button=>{

          button.addEventListener(
            "click",
            ()=>{

              const name=
                button.dataset.boss20Reagent;

              if(selectedReagents.has(name)){
                removeReagent(name);
              }else{
                addReagent(name);
              }
            }
          );
        }
      );


    /**********************************************************************
     * 輸入欄位事件
     **********************************************************************/

    ctx.stage
      .querySelectorAll(
        "[data-boss20-volume]"
      )
      .forEach(
        input=>{

          input.addEventListener(
            "input",
            ()=>{

              /*
               * 不允許負值。
               */
              if(
                input.value!==""&&
                Number(input.value)<0
              ){
                input.value="0";
              }

              preparation.enteredVolumes[
                input.dataset.boss20Volume
              ]=
                input.value;

              updateBottle();
            }
          );

          input.addEventListener(
            "blur",
            ()=>{

              if(input.value===""){
                return;
              }

              const number=
                Number(input.value);

              if(!Number.isFinite(number)){
                input.value="";
                return;
              }

              /*
               * 統一顯示到小數點後一位，
               * 但整數仍保留一般數字形式。
               */
              input.value=
                this.displayNumber(
                  this.roundOneDecimal(
                    number
                  )
                );

              preparation.enteredVolumes[
                input.dataset.boss20Volume
              ]=
                input.value;

              updateBottle();
            }
          );
        }
      );


    /**********************************************************************
     * 確認配方
     **********************************************************************/

    const confirmButton=
      ctx.stage.querySelector(
        "#boss20CheckPreparation"
      );

    confirmButton.addEventListener(
      "click",
      ()=>{

        if(this.missionFailed){
          return;
        }

        saveEnteredVolumes();

        const entered=
          readEnteredVolumes();

        const errors=[];


        /******************************************************************
         * 所有五個欄位都必須填寫
         ******************************************************************/

        reagentNames.forEach(
          name=>{

            if(entered[name].raw===""){

              errors.push(
                `${name} 欄位不可留白；不需要加入時請輸入 0。`
              );

              return;
            }

            if(
              !Number.isFinite(
                entered[name].number
              )
            ){

              errors.push(
                `${name} 必須輸入有效數字。`
              );

              return;
            }

            if(entered[name].number<0){

              errors.push(
                `${name} 不可輸入負數。`
              );
            }
          }
        );


        /******************************************************************
         * 必須加入全部三種正確試劑
         ******************************************************************/

        requiredReagents.forEach(
          name=>{

            if(!selectedReagents.has(name)){

              errors.push(
                `尚未將 ${name} 加入培養基瓶。`
              );
            }
          }
        );


        /******************************************************************
         * 防止錯誤試劑透過狀態異常留在瓶中
         ******************************************************************/

        const selectedWrongReagents=
          wrongReagents.filter(
            name=>
              selectedReagents.has(name)
          );

        if(selectedWrongReagents.length>0){

          preparation.passed=false;

          this.failMission(
            ctx,
            [
              `培養基中含有錯誤試劑：${selectedWrongReagents.join(
                "、"
              )}。`,
              "Complete DMEM 已無法使用。"
            ],
            {
              penalties:[
                {
                  metric:"accuracy",
                  amount:100,
                  message:
                    "Complete DMEM 加入錯誤試劑。"
                },
                {
                  metric:"sampleQuality",
                  amount:100,
                  message:
                    "培養基受到錯誤試劑污染。"
                }
              ]
            }
          );

          return;
        }


        /******************************************************************
         * 比對正確容量
         *
         * 容許誤差 ±0.1 mL。
         ******************************************************************/

        reagentNames.forEach(
          name=>{

            if(
              entered[name].raw===""||
              !Number.isFinite(
                entered[name].number
              )
            ){
              return;
            }

            const correctVolume=
              state.formula[name];

            if(
              !this.approximatelyEqual(
                entered[name].number,
                correctVolume,
                .1
              )
            ){

              errors.push(
                `${name} 體積不正確。`
              );
            }
          }
        );


        /******************************************************************
         * 檢查輸入總量
         ******************************************************************/

        const enteredTotal=
          reagentNames.reduce(
            (sum,name)=>{

              const value=
                entered[name].number;

              return sum+
                (
                  Number.isFinite(value)
                    ?value
                    :0
                );
            },
            0
          );

        if(
          !this.approximatelyEqual(
            enteredTotal,
            state.totalVolume,
            .1
          )
        ){

          errors.push(
            `五個欄位合計為 ${this.displayNumber(
              enteredTotal
            )} mL，應為 ${this.displayNumber(
              state.totalVolume
            )} mL。`
          );
        }


        /******************************************************************
         * 有錯誤：立即結束整個 Boss 任務
         ******************************************************************/

        if(errors.length>0){

          preparation.passed=false;

          /*
           * Round 1 一般計算錯誤：
           * accuracy 與 sampleQuality 失敗，
           * safety 不扣分。
           */
          this.failMission(
            ctx,
            errors,
            {
              penalties:[
                {
                  metric:"accuracy",
                  amount:100,
                  message:
                    "Complete DMEM 配方或體積計算錯誤。"
                },
                {
                  metric:"sampleQuality",
                  amount:100,
                  message:
                    "錯誤配方會影響後續細胞培養品質。"
                }
              ]
            }
          );

          return;
        }


        /******************************************************************
         * Round 1 成功
         ******************************************************************/

        preparation.passed=true;

        preparation.selectedReagents=
          [...selectedReagents];

        state.bottle.prepared=true;

        state.bottle.currentVolume=
          state.totalVolume;

        /*
         * Round 2 必須使用同一瓶培養基。
         */
        state.bottleRemaining=
          state.totalVolume;

        confirmButton.disabled=true;

        ctx.stage
          .querySelectorAll(
            "button,input"
          )
          .forEach(
            control=>{

              if(
                control.id!==
                "boss20CheckPreparation"
              ){
                control.disabled=true;
              }
            }
          );

        updateBottle();

        setMessage(
          `
            <strong>
              Complete DMEM 配製完成
            </strong>

            <span>
              DMEM：
              ${this.displayNumber(
                state.formula.DMEM
              )} mL
              ／ FBS：
              ${this.displayNumber(
                state.formula.FBS
              )} mL
              ／ Pen/Strep：
              ${this.displayNumber(
                state.formula[
                  "Pen/Strep"
                ]
              )} mL
            </span>
          `,
          "success"
        );

        this.completeRound(
          ctx,
          900
        );
      }
    );
  },


  /**************************************************************************
   * ROUND 2
   * 將 Complete DMEM 加入離心管
   **************************************************************************/

  round2(ctx){

    const state=
      this.state;

    state.currentRound=2;

    /*
     * Round 1 未成功時，不允許進入 Round 2。
     */
    if(
      !state.preparation.passed||
      !state.bottle.prepared
    ){

      this.failMission(
        ctx,
        [
          "Round 1 的 Complete DMEM 尚未正確配製。",
          "無法進行培養基分裝。"
        ],
        {
          penalties:[]
        }
      );

      return;
    }

    const transfer=
      state.transfer;

    /*
     * 固定按照 Tube 1、Tube 2、Tube 3……
     * 顯示，不打亂順序。
     */
    const tubes=
      [...transfer.tubes]
        .sort(
          (first,second)=>
            first.id-second.id
        );

    const pipetteSizes=[
      1,
      5,
      10,
      25,
      50
    ];

    let selectedTubeId=
      transfer.selectedTubeId;

    let selectedPipette=
      transfer.selectedPipette;

    let dialVolume=
      Number(
        transfer.setVolume||0
      );

    /*
     * plunger 階段：
     *
     * ready       尚未吸液
     * aspirated   已從培養基瓶吸液
     */
    let plungerState=
      "ready";

    let locked=false;


    /**********************************************************************
     * 依照目標容量選擇正確 Serological Pipette
     *
     * 規則：
     * 使用可以容納目標體積的最小規格。
     *
     * 例如：
     * 3 mL  → 5 mL pipette
     * 10 mL → 10 mL pipette
     * 30 mL → 50 mL pipette
     **********************************************************************/

    const getCorrectPipette=volume=>{

      return pipetteSizes.find(
        size=>size>=volume
      )||50;
    };


    /**********************************************************************
     * 取得目前選取的 Tube
     **********************************************************************/

    const getSelectedTube=()=>{

      if(selectedTubeId===null){
        return null;
      }

      return tubes.find(
        tube=>
          tube.id===selectedTubeId
      )||null;
    };


    /**********************************************************************
     * 顯示訊息
     **********************************************************************/

    const setMessage=(
      message,
      type=""
    )=>{

      const box=
        ctx.stage.querySelector(
          "#boss20TransferMessage"
        );

      if(!box){
        return;
      }

      box.classList.remove(
        "success",
        "error",
        "warning"
      );

      if(type){
        box.classList.add(type);
      }

      box.innerHTML=message;
    };


    /**********************************************************************
     * 更新操作狀態
     **********************************************************************/

    const updateStatus=()=>{

      const status=
        ctx.stage.querySelector(
          "#boss20TransferStatus"
        );

      if(!status){
        return;
      }

      const tube=
        getSelectedTube();

      if(!tube){

        status.innerHTML=`
          <strong>
            尚未選擇離心管
          </strong>

          <span>
            請先選擇一支尚未完成的 Tube。
          </span>
        `;

        return;
      }

      const correctPipette=
        getCorrectPipette(
          tube.volume
        );

      status.innerHTML=`
        <strong>
          Tube ${tube.id}
        </strong>

        <span>
          目標體積：
          ${this.displayNumber(
            tube.volume
          )} mL
        </span>

        <span>
          建議選擇：
          ${correctPipette} mL pipette
        </span>
      `;
    };


    /**********************************************************************
     * 更新 Pipette 按鈕
     **********************************************************************/

    const updatePipetteButtons=()=>{

      ctx.stage
        .querySelectorAll(
          "[data-boss20-pipette]"
        )
        .forEach(
          button=>{

            const size=
              Number(
                button.dataset.boss20Pipette
              );

            const isSelected=
              selectedPipette===size;

            button.classList.toggle(
              "selected",
              isSelected
            );

            button.setAttribute(
              "aria-pressed",
              isSelected
                ?"true"
                :"false"
            );
          }
        );
    };


    /**********************************************************************
     * 更新 Tube 選取狀態
     **********************************************************************/

    const updateTubeButtons=()=>{

      ctx.stage
        .querySelectorAll(
          "[data-boss20-transfer-tube]"
        )
        .forEach(
          button=>{

            const tubeId=
              Number(
                button.dataset
                  .boss20TransferTube
              );

            button.classList.toggle(
              "selected",
              tubeId===selectedTubeId
            );
          }
        );
    };


    /**********************************************************************
     * 更新容量旋鈕
     **********************************************************************/

    const updateDial=()=>{

      const dialInput=
        ctx.stage.querySelector(
          "#boss20TransferDial"
        );

      const dialText=
        ctx.stage.querySelector(
          "#boss20TransferDialText"
        );

      if(dialInput){

        const maximum=
          selectedPipette||50;

        dialInput.max=
          String(maximum);

        /*
         * 更換較小的 pipette 時，
         * 不允許設定值超過其容量。
         */
        if(dialVolume>maximum){
          dialVolume=maximum;
        }

        dialInput.value=
          String(dialVolume);
      }

      if(dialText){

        dialText.textContent=
          this.displayNumber(
            dialVolume
          );
      }

      transfer.setVolume=
        dialVolume;
    };


    /**********************************************************************
     * 更新 Plunger
     **********************************************************************/

    const updatePlunger=()=>{

      const button=
        ctx.stage.querySelector(
          "#boss20TransferPlunger"
        );

      const pipetteLiquid=
        ctx.stage.querySelector(
          "#boss20TransferPipetteLiquid"
        );

      if(!button){
        return;
      }

      if(plungerState==="aspirated"){

        button.textContent=
          "按壓排入離心管";

        button.classList.add(
          "active"
        );

        if(pipetteLiquid){

          const maximum=
            selectedPipette||50;

          const percent=
            Math.max(
              5,
              Math.min(
                95,
                dialVolume/
                maximum*
                95
              )
            );

          pipetteLiquid.style.height=
            `${percent}%`;
        }

        return;
      }

      button.textContent=
        "按壓吸取培養基";

      button.classList.remove(
        "active"
      );

      if(pipetteLiquid){
        pipetteLiquid.style.height="0%";
      }
    };


    /**********************************************************************
     * 更新母瓶液面與數字
     **********************************************************************/

    const updateBottle=()=>{

      const bottleHost=
        ctx.stage.querySelector(
          "#boss20TransferBottle"
        );

      if(!bottleHost){
        return;
      }

      state.bottle.currentVolume=
        state.bottleRemaining;

      bottleHost.innerHTML=
        this.bottleHtml({
          currentVolume:
            state.bottleRemaining
        });
    };


    /**********************************************************************
     * 更新進度
     **********************************************************************/

    const updateProgress=()=>{

      const completed=
        tubes.filter(
          tube=>tube.filled
        ).length;

      const progressText=
        ctx.stage.querySelector(
          "#boss20TransferProgress"
        );

      if(progressText){

        progressText.textContent=
          `${completed} / ${tubes.length}`;
      }

      const progressBar=
        ctx.stage.querySelector(
          "#boss20TransferProgressBar"
        );

      if(progressBar){

        const percent=
          tubes.length===0
            ?0
            :completed/
              tubes.length*
              100;

        progressBar.style.width=
          `${percent}%`;
      }
    };


    /**********************************************************************
     * 更新單一 Tube 液面與內容
     **********************************************************************/

    const updateTube=Tube=>{

      const button=
        ctx.stage.querySelector(
          `[data-boss20-transfer-tube="${Tube.id}"]`
        );

      if(!button){
        return;
      }

      const liquid=
        button.querySelector(
          ".boss20-tube-liquid"
        );

      const currentText=
        button.querySelector(
          ".boss20-tube-current"
        );

      const fillPercent=
        Math.max(
          0,
          Math.min(
            82,
            Tube.transferredVolume/
            50*
            82
          )
        );

      if(liquid){

        liquid.style.height=
          `${fillPercent}%`;
      }

      if(currentText){

        currentText.textContent=
          `Current：${this.displayNumber(
            Tube.transferredVolume
          )} mL`;
      }

      if(Tube.filled){

        button.disabled=true;

        button.classList.add(
          "filled"
        );

        button.classList.remove(
          "selected"
        );
      }
    };


    /**********************************************************************
     * 重設本次吸液操作
     **********************************************************************/

    const resetTransferControls=()=>{

      selectedTubeId=null;

      transfer.selectedTubeId=null;

      selectedPipette=null;

      transfer.selectedPipette=null;

      dialVolume=0;

      transfer.setVolume=0;

      plungerState="ready";

      updateTubeButtons();
      updatePipetteButtons();
      updateDial();
      updatePlunger();
      updateStatus();
    };


    /**********************************************************************
     * 建立 Tube Rack
     *
     * 排列：
     *
     * Tube 1   Tube 2
     * Tube 3   Tube 4
     * Tube 5   Tube 6
     **********************************************************************/

    const tubeRackHtml=
      tubes
        .map(
          tube=>`
            <button
              type="button"
              class="
                boss20-transfer-tube
                ${tube.filled?"filled":""}
                ${
                  selectedTubeId===tube.id
                    ?"selected"
                    :""
                }
              "
              data-boss20-transfer-tube="${tube.id}"
              ${tube.filled?"disabled":""}
            >

              <span class="boss20-tube-cap"></span>

              <span class="boss20-tube-body">

                <span
                  class="boss20-tube-liquid"
                  style="
                    height:${
                      Math.max(
                        0,
                        Math.min(
                          82,
                          tube.transferredVolume/
                          50*
                          82
                        )
                      )
                    }%;
                  "
                ></span>

                <strong>
                  Tube ${tube.id}
                </strong>

                <small>
                  Target：
                  ${this.displayNumber(
                    tube.volume
                  )} mL
                </small>

                <small class="boss20-tube-current">
                  Current：
                  ${this.displayNumber(
                    tube.transferredVolume
                  )} mL
                </small>

              </span>

            </button>
          `
        )
        .join("");


    /**********************************************************************
     * Round 2 主畫面
     **********************************************************************/

    ctx.stage.innerHTML=
      this.game.shell(
        "將 DMEM 加入細胞／離心管",

        `
          使用適當容量的 Serological Pipette，
          將 Complete DMEM 分裝至所有離心管。
          請選擇 Tube、選擇 pipette、設定容量，
          再使用 plunger 完成吸液與排液。
        `,

        `
          <div class="boss20-round boss20-round2">

            <section class="boss20-transfer-header">

              <div class="boss20-transfer-progress-card">

                <span class="kicker">
                  ALIQUOT PROGRESS
                </span>

                <strong id="boss20TransferProgress">
                  ${
                    tubes.filter(
                      tube=>tube.filled
                    ).length
                  }
                  /
                  ${tubes.length}
                </strong>

                <div class="boss20-progress-track">

                  <div
                    id="boss20TransferProgressBar"
                    class="boss20-progress-fill"
                    style="
                      width:${
                        tubes.length===0
                          ?0
                          :tubes.filter(
                              tube=>tube.filled
                            ).length/
                            tubes.length*
                            100
                      }%;
                    "
                  ></div>

                </div>

              </div>

              <div
                id="boss20TransferStatus"
                class="boss20-transfer-status"
              ></div>

            </section>


            <div class="boss20-transfer-layout">

              <section class="boss20-transfer-source">

                <span class="kicker">
                  COMPLETE DMEM
                </span>

                <div
                  id="boss20TransferBottle"
                  class="boss20-transfer-bottle"
                >
                  ${this.bottleHtml({
                    currentVolume:
                      state.bottleRemaining
                  })}
                </div>

                <div class="boss20-bottle-remaining">

                  <span>
                    Remaining
                  </span>

                  <strong>
                    ${this.displayNumber(
                      state.bottleRemaining
                    )} mL
                  </strong>

                </div>

              </section>


              <section class="boss20-transfer-tubes">

                <div class="boss20-section-heading">

                  <div>
                    <span class="kicker">
                      TUBE RACK
                    </span>

                    <strong>
                      選擇一支離心管
                    </strong>
                  </div>

                  <small>
                    Tube 依編號由左至右排列
                  </small>

                </div>

                <div class="boss20-tube-rack-grid">
                  ${tubeRackHtml}
                </div>

              </section>

            </div>


            <section class="boss20-pipette-workstation">

              <div class="boss20-section-heading">

                <div>
                  <span class="kicker">
                    SEROLOGICAL PIPETTE
                  </span>

                  <strong>
                    選擇適當的 Pipette
                  </strong>
                </div>

                <small>
                  使用能容納目標體積的最小規格
                </small>

              </div>

              <div class="boss20-pipette-options">

                ${
                  pipetteSizes
                    .map(
                      size=>`
                        <button
                          type="button"
                          class="
                            boss20-serological-pipette
                            ${
                              selectedPipette===size
                                ?"selected"
                                :""
                            }
                          "
                          data-boss20-pipette="${size}"
                          aria-pressed="${
                            selectedPipette===size
                              ?"true"
                              :"false"
                          }"
                        >

                          <span class="boss20-serological-icon">

                            <span
                              class="boss20-serological-scale"
                            ></span>

                            <span
                              class="boss20-serological-liquid"
                            ></span>

                          </span>

                          <strong>
                            ${size} mL
                          </strong>

                          <small>
                            Pipette
                          </small>

                        </button>
                      `
                    )
                    .join("")
                }

              </div>


              <div class="boss20-transfer-controls">

                <label class="boss20-transfer-dial">

                  <span class="kicker">
                    VOLUME SETTING
                  </span>

                  <strong>
                    <span id="boss20TransferDialText">
                      ${this.displayNumber(
                        dialVolume
                      )}
                    </span>
                    mL
                  </strong>

                  <input
                    type="range"
                    id="boss20TransferDial"
                    min="0"
                    max="${selectedPipette||50}"
                    step="1"
                    value="${dialVolume}"
                  >

                  <div class="boss20-dial-buttons">

                    <button
                      type="button"
                      id="boss20DialMinus"
                      class="btn btn-soft"
                      aria-label="減少容量"
                    >
                      −1
                    </button>

                    <button
                      type="button"
                      id="boss20DialPlus"
                      class="btn btn-soft"
                      aria-label="增加容量"
                    >
                      +1
                    </button>

                  </div>

                </label>


                <div class="boss20-plunger-workstation">

                  <span class="kicker">
                    PLUNGER
                  </span>

                  <div class="boss20-serological-visual">

                    <div
                      id="boss20TransferPipetteLiquid"
                      class="boss20-serological-fill"
                    ></div>

                  </div>

                  <button
                    type="button"
                    id="boss20TransferPlunger"
                    class="plunger"
                  >
                    按壓吸取培養基
                  </button>

                  <small>
                    第一次按壓吸液，第二次按壓排液
                  </small>

                </div>

              </div>

            </section>


            <div
              id="boss20TransferMessage"
              class="notice"
              aria-live="polite"
            >
              請先選擇一支尚未完成的離心管。
            </div>

          </div>
        `
      );


    /**********************************************************************
     * 初始化狀態
     **********************************************************************/

    updateStatus();
    updatePipetteButtons();
    updateTubeButtons();
    updateDial();
    updatePlunger();
    updateProgress();


    /**********************************************************************
     * 選擇 Tube
     **********************************************************************/

    ctx.stage
      .querySelectorAll(
        "[data-boss20-transfer-tube]"
      )
      .forEach(
        button=>{

          button.addEventListener(
            "click",
            ()=>{

              if(
                locked||
                plungerState==="aspirated"
              ){
                return;
              }

              const tubeId=
                Number(
                  button.dataset
                    .boss20TransferTube
                );

              const tube=
                tubes.find(
                  item=>item.id===tubeId
                );

              if(
                !tube||
                tube.filled
              ){
                return;
              }

              selectedTubeId=
                tubeId;

              transfer.selectedTubeId=
                tubeId;

              /*
               * 切換 tube 時重設容量，
               * 避免沿用上一支 tube 的設定。
               */
              dialVolume=0;

              transfer.setVolume=0;

              updateTubeButtons();
              updateStatus();
              updateDial();

              setMessage(
                `
                  <strong>
                    已選擇 Tube ${tube.id}
                  </strong>

                  <span>
                    請分裝
                    ${this.displayNumber(
                      tube.volume
                    )} mL Complete DMEM。
                  </span>
                `,
                "success"
              );
            }
          );
        }
      );


    /**********************************************************************
     * 選擇 Pipette
     **********************************************************************/

    ctx.stage
      .querySelectorAll(
        "[data-boss20-pipette]"
      )
      .forEach(
        button=>{

          button.addEventListener(
            "click",
            ()=>{

              if(
                locked||
                plungerState==="aspirated"
              ){
                return;
              }

              selectedPipette=
                Number(
                  button.dataset
                    .boss20Pipette
                );

              transfer.selectedPipette=
                selectedPipette;

              if(dialVolume>selectedPipette){

                dialVolume=
                  selectedPipette;

                transfer.setVolume=
                  dialVolume;
              }

              updatePipetteButtons();
              updateDial();

              setMessage(
                `
                  <strong>
                    已選擇 ${selectedPipette} mL pipette
                  </strong>

                  <span>
                    請調整吸取容量。
                  </span>
                `,
                "success"
              );
            }
          );
        }
      );


    /**********************************************************************
     * 容量 Range
     **********************************************************************/

    const dialInput=
      ctx.stage.querySelector(
        "#boss20TransferDial"
      );

    dialInput.addEventListener(
      "input",
      ()=>{

        if(
          locked||
          plungerState==="aspirated"
        ){
          return;
        }

        dialVolume=
          Number(
            dialInput.value
          );

        transfer.setVolume=
          dialVolume;

        updateDial();
      }
    );


    /**********************************************************************
     * 容量 ±1
     **********************************************************************/

    ctx.stage.querySelector(
      "#boss20DialMinus"
    ).addEventListener(
      "click",
      ()=>{

        if(
          locked||
          plungerState==="aspirated"
        ){
          return;
        }

        dialVolume=
          Math.max(
            0,
            dialVolume-1
          );

        transfer.setVolume=
          dialVolume;

        updateDial();
      }
    );


    ctx.stage.querySelector(
      "#boss20DialPlus"
    ).addEventListener(
      "click",
      ()=>{

        if(
          locked||
          plungerState==="aspirated"
        ){
          return;
        }

        const maximum=
          selectedPipette||50;

        dialVolume=
          Math.min(
            maximum,
            dialVolume+1
          );

        transfer.setVolume=
          dialVolume;

        updateDial();
      }
    );


    /**********************************************************************
     * Plunger 操作
     **********************************************************************/

    const plungerButton=
      ctx.stage.querySelector(
        "#boss20TransferPlunger"
      );

    plungerButton.addEventListener(
      "click",
      ()=>{

        if(
          locked||
          this.missionFailed
        ){
          return;
        }

        const tube=
          getSelectedTube();

        /*
         * 吸液前檢查。
         */
        if(plungerState==="ready"){

          if(!tube){

            setMessage(
              `
                <strong>
                  尚未選擇 Tube
                </strong>

                <span>
                  請先選擇要分裝的離心管。
                </span>
              `,
              "warning"
            );

            return;
          }

          if(selectedPipette===null){

            setMessage(
              `
                <strong>
                  尚未選擇 Pipette
                </strong>

                <span>
                  請先選擇適當容量的 Serological Pipette。
                </span>
              `,
              "warning"
            );

            return;
          }

          if(dialVolume<=0){

            setMessage(
              `
                <strong>
                  尚未設定容量
                </strong>

                <span>
                  請調整 Volume Setting。
                </span>
              `,
              "warning"
            );

            return;
          }

          const correctPipette=
            getCorrectPipette(
              tube.volume
            );

          /*
           * Pipette 選錯，立即任務失敗。
           */
          if(
            selectedPipette!==
            correctPipette
          ){

            transfer.passed=false;

            this.failMission(
              ctx,
              [
                `Tube ${tube.id} 應使用 ${correctPipette} mL pipette。`,
                `實際選擇了 ${selectedPipette} mL pipette。`
              ],
              {
                penalties:[
                  {
                    metric:"accuracy",
                    amount:100,
                    message:
                      "Serological Pipette 規格選擇錯誤。"
                  },
                  {
                    metric:"sampleQuality",
                    amount:100,
                    message:
                      "不適當的 pipette 規格會降低分裝準確度。"
                  }
                ]
              }
            );

            return;
          }

          /*
           * 設定容量錯誤，立即任務失敗。
           */
          if(
            !this.approximatelyEqual(
              dialVolume,
              tube.volume,
              .1
            )
          ){

            transfer.passed=false;

            this.failMission(
              ctx,
              [
                `Tube ${tube.id} 需要 ${this.displayNumber(
                  tube.volume
                )} mL。`,
                `實際設定為 ${this.displayNumber(
                  dialVolume
                )} mL。`
              ],
              {
                penalties:[
                  {
                    metric:"accuracy",
                    amount:100,
                    message:
                      "Serological Pipette 容量設定錯誤。"
                  },
                  {
                    metric:"sampleQuality",
                    amount:100,
                    message:
                      "離心管培養基體積不正確。"
                  }
                ]
              }
            );

            return;
          }

          if(
            state.bottleRemaining<
            dialVolume
          ){

            transfer.passed=false;

            this.failMission(
              ctx,
              [
                "培養基瓶剩餘容量不足。",
                "無法完成指定分裝量。"
              ],
              {
                penalties:[
                  {
                    metric:"accuracy",
                    amount:100,
                    message:
                      "培養基分裝總量錯誤。"
                  },
                  {
                    metric:"sampleQuality",
                    amount:100,
                    message:
                      "Complete DMEM 不足以完成分裝。"
                  }
                ]
              }
            );

            return;
          }

          /*
           * 正確吸液。
           */
          plungerState=
            "aspirated";

          updatePlunger();

          setMessage(
            `
              <strong>
                已吸取 ${this.displayNumber(
                  dialVolume
                )} mL
              </strong>

              <span>
                請再次按壓 plunger，
                將培養基排入 Tube ${tube.id}。
              </span>
            `,
            "success"
          );

          return;
        }


        /******************************************************************
         * 第二次按壓：排入 Tube
         ******************************************************************/

        if(plungerState==="aspirated"){

          if(!tube){
            return;
          }

          locked=true;

          plungerButton.disabled=true;

          /*
           * 扣除母瓶容量。
           */
          state.bottleRemaining=
            this.roundOneDecimal(
              state.bottleRemaining-
              dialVolume
            );

          state.bottle.currentVolume=
            state.bottleRemaining;

          /*
           * 更新 Tube。
           */
          tube.transferredVolume=
            this.roundOneDecimal(
              tube.transferredVolume+
              dialVolume
            );

          tube.filled=
            this.approximatelyEqual(
              tube.transferredVolume,
              tube.volume,
              .1
            );

          updateBottle();
          updateTube(tube);
          updateProgress();

          setMessage(
            `
              <strong>
                正在將 ${this.displayNumber(
                  dialVolume
                )} mL 排入 Tube ${tube.id}
              </strong>

              <span>
                Complete DMEM 分裝中……
              </span>
            `,
            "success"
          );

          this.setTimer(
            ()=>{

              const allFilled=
                tubes.every(
                  item=>item.filled
                );

              /*
               * 所有 Tube 完成。
               */
              if(allFilled){

                const transferredTotal=
                  tubes.reduce(
                    (sum,item)=>
                      sum+
                      item.transferredVolume,
                    0
                  );

                /*
                 * 檢查所有分裝體積總和。
                 */
                if(
                  !this.approximatelyEqual(
                    transferredTotal,
                    state.totalVolume,
                    .1
                  )||
                  !this.approximatelyEqual(
                    state.bottleRemaining,
                    0,
                    .1
                  )
                ){

                  transfer.passed=false;

                  this.failMission(
                    ctx,
                    [
                      `分裝總量為 ${this.displayNumber(
                        transferredTotal
                      )} mL。`,
                      `培養基瓶剩餘 ${this.displayNumber(
                        state.bottleRemaining
                      )} mL。`,
                      `正確總量應為 ${this.displayNumber(
                        state.totalVolume
                      )} mL。`
                    ],
                    {
                      penalties:[
                        {
                          metric:"accuracy",
                          amount:100,
                          message:
                            "Complete DMEM 分裝總量不一致。"
                        },
                        {
                          metric:"sampleQuality",
                          amount:100,
                          message:
                            "離心管內培養基容量不正確。"
                        }
                      ]
                    }
                  );

                  return;
                }

                transfer.passed=true;

                state.bottleRemaining=0;

                state.bottle.currentVolume=0;

                updateBottle();

                setMessage(
                  `
                    <strong>
                      Complete DMEM 分裝完成
                    </strong>

                    <span>
                      已完成 ${tubes.length} 支離心管，
                      共 ${this.displayNumber(
                        transferredTotal
                      )} mL。
                    </span>
                  `,
                  "success"
                );

                this.completeRound(
                  ctx,
                  900
                );

                return;
              }

              /*
               * 尚有 Tube，重設操作台。
               */
              locked=false;

              plungerButton.disabled=false;

              resetTransferControls();

              setMessage(
                `
                  <strong>
                    Tube ${tube.id} 分裝完成
                  </strong>

                  <span>
                    請選擇下一支離心管。
                  </span>
                `,
                "success"
              );
            },
            700
          );
        }
      }
    );
  },

  
  /**************************************************************************
   * ROUND 3
   *
   * Part 4 會取代此暫存函式。
   **************************************************************************/

  round3(ctx){

    ctx.stage.innerHTML=
      this.game.shell(
        "Boss20 Round 3",
        "Round 3 尚未貼入。",
        `
          <div class="notice">
            請接續貼上 boss20.js Part 4。
          </div>
        `
      );
  },


  /**************************************************************************
   * ROUND 4
   *
   * Part 5 會取代此暫存函式。
   **************************************************************************/

  round4(ctx){

    ctx.stage.innerHTML=
      this.game.shell(
        "Boss20 Round 4",
        "Round 4 尚未貼入。",
        `
          <div class="notice">
            請接續貼上 boss20.js Part 5。
          </div>
        `
      );
  },


  /**************************************************************************
   * ROUND 5
   *
   * Part 6 會取代此暫存函式。
   **************************************************************************/

  round5(ctx){

    ctx.stage.innerHTML=
      this.game.shell(
        "Boss20 Round 5",
        "Lab Inspection 暫時延後。",
        `
          <div class="notice">
            Round 5 inspection 尚未啟用。
          </div>
        `
      );
  }


/*
 * 讓傳統 script 載入方式可以由其他檔案存取。
 */
window.Boss20=Boss20;
