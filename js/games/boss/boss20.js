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
   * Centrifuge Balance
   **************************************************************************/

  round3(ctx){

    const state=
      this.state;

    state.currentRound=3;


    /**********************************************************************
     * Round 2 未完成時，不允許進入離心步驟
     **********************************************************************/

    if(
      !state.transfer||
      !state.transfer.passed
    ){

      this.failMission(
        ctx,
        [
          "Round 2 的 Complete DMEM 分裝尚未正確完成。",
          "無法將未完成的離心管放入離心機。"
        ],
        {
          penalties:[]
        }
      );

      return;
    }


    /**********************************************************************
     * 建立／延續離心狀態
     **********************************************************************/

    if(!state.centrifuge){

      state.centrifuge={

        passed:false,

        rpm:
          this.randomInt(
            1000,
            1800
          ),

        time:
          this.randomInt(
            3,
            8
          ),

        selectedTubeId:null,

        placements:{},

        started:false
      };
    }

    const centrifuge=
      state.centrifuge;

    const tubes=
      [...state.transfer.tubes]
        .sort(
          (first,second)=>
            first.id-second.id
        );

    /*
     * 離心機共有 24 個孔位。
     *
     * 孔位編號：
     * 1～24
     *
     * 對向孔位：
     * 1 ↔ 13
     * 2 ↔ 14
     * ...
     * 12 ↔ 24
     */
    const holeCount=24;

    let selectedTubeId=
      centrifuge.selectedTubeId;

    let locked=false;


    /**********************************************************************
     * 對向孔位
     **********************************************************************/

    const oppositeHole=hole=>{

      return hole<=12
        ?hole+12
        :hole-12;
    };


    /**********************************************************************
     * 取得 Tube
     **********************************************************************/

    const getTube=tubeId=>{

      return tubes.find(
        tube=>tube.id===tubeId
      )||null;
    };


    /**********************************************************************
     * 取得某孔位內的 Tube ID
     **********************************************************************/

    const getTubeAtHole=hole=>{

      const entry=
        Object.entries(
          centrifuge.placements
        )
        .find(
          ([,placedHole])=>
            Number(placedHole)===hole
        );

      return entry
        ?Number(entry[0])
        :null;
    };


    /**********************************************************************
     * 取得 Tube 所在孔位
     **********************************************************************/

    const getHoleForTube=tubeId=>{

      const hole=
        centrifuge.placements[
          tubeId
        ];

      return hole===undefined
        ?null
        :Number(hole);
    };


    /**********************************************************************
     * 已放入離心機的 Tube 數量
     **********************************************************************/

    const placedTubeCount=()=>{

      return Object.keys(
        centrifuge.placements
      ).length;
    };


    /**********************************************************************
     * 所有 Tube 是否都已放入
     **********************************************************************/

    const allTubesPlaced=()=>{

      return tubes.every(
        tube=>
          getHoleForTube(
            tube.id
          )!==null
      );
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
          "#boss20CentrifugeMessage"
        );

      if(!box){
        return;
      }

      box.classList.remove(
        "success",
        "warning",
        "error"
      );

      if(type){
        box.classList.add(type);
      }

      box.innerHTML=message;
    };


    /**********************************************************************
     * 更新 Tube Rack
     **********************************************************************/

    const updateTubeRack=()=>{

      ctx.stage
        .querySelectorAll(
          "[data-boss20-centrifuge-tube]"
        )
        .forEach(
          button=>{

            const tubeId=
              Number(
                button.dataset
                  .boss20CentrifugeTube
              );

            const placed=
              getHoleForTube(
                tubeId
              )!==null;

            const selected=
              selectedTubeId===tubeId;

            button.classList.toggle(
              "selected",
              selected
            );

            button.classList.toggle(
              "placed",
              placed
            );

            button.disabled=
              locked||
              placed;
          }
        );
    };


    /**********************************************************************
     * 更新離心孔位
     **********************************************************************/

    const updateRotor=()=>{

      ctx.stage
        .querySelectorAll(
          "[data-boss20-rotor-hole]"
        )
        .forEach(
          button=>{

            const hole=
              Number(
                button.dataset
                  .boss20RotorHole
              );

            const tubeId=
              getTubeAtHole(
                hole
              );

            const tube=
              tubeId===null
                ?null
                :getTube(tubeId);

            button.classList.toggle(
              "occupied",
              tubeId!==null
            );

            button.disabled=
              locked;

            const tubeLabel=
              button.querySelector(
                ".boss20-rotor-tube-label"
              );

            const tubeVolume=
              button.querySelector(
                ".boss20-rotor-tube-volume"
              );

            if(tubeId===null){

              if(tubeLabel){
                tubeLabel.textContent="";
              }

              if(tubeVolume){
                tubeVolume.textContent="";
              }

              return;
            }

            if(tubeLabel){

              tubeLabel.textContent=
                `Tube ${tubeId}`;
            }

            if(tubeVolume&&tube){

              tubeVolume.textContent=
                `${this.displayNumber(
                  tube.volume
                )} mL`;
            }
          }
        );
    };


    /**********************************************************************
     * 更新已放入數量
     **********************************************************************/

    const updateProgress=()=>{

      const count=
        placedTubeCount();

      const progress=
        ctx.stage.querySelector(
          "#boss20CentrifugeProgress"
        );

      if(progress){

        progress.textContent=
          `${count} / ${tubes.length}`;
      }

      const fill=
        ctx.stage.querySelector(
          "#boss20CentrifugeProgressBar"
        );

      if(fill){

        fill.style.width=
          `${
            tubes.length===0
              ?0
              :count/
                tubes.length*
                100
          }%`;
      }
    };


    /**********************************************************************
     * 更新目前選擇
     **********************************************************************/

    const updateSelectionStatus=()=>{

      const status=
        ctx.stage.querySelector(
          "#boss20CentrifugeSelection"
        );

      if(!status){
        return;
      }

      if(selectedTubeId===null){

        status.innerHTML=`
          <strong>
            尚未選擇離心管
          </strong>

          <span>
            請先從 Tube Rack 選擇一支離心管。
          </span>
        `;

        return;
      }

      const tube=
        getTube(
          selectedTubeId
        );

      status.innerHTML=`
        <strong>
          已選擇 Tube ${selectedTubeId}
        </strong>

        <span>
          容量：
          ${
            tube
              ?this.displayNumber(
                  tube.volume
                )
              :"—"
          } mL
        </span>

        <span>
          請點擊一個空的離心孔位。
        </span>
      `;
    };


    /**********************************************************************
     * 更新全部畫面
     **********************************************************************/

    const updateAll=()=>{

      updateTubeRack();
      updateRotor();
      updateProgress();
      updateSelectionStatus();
    };


    /**********************************************************************
     * 移除 Tube
     **********************************************************************/

    const removeTubeFromHole=hole=>{

      const tubeId=
        getTubeAtHole(
          hole
        );

      if(tubeId===null){
        return;
      }

      delete centrifuge.placements[
        tubeId
      ];

      selectedTubeId=null;

      centrifuge.selectedTubeId=null;

      updateAll();

      setMessage(
        `
          <strong>
            Tube ${tubeId} 已移回 Tube Rack
          </strong>

          <span>
            請重新選擇適當孔位。
          </span>
        `,
        "warning"
      );
    };


    /**********************************************************************
     * 放置 Tube
     **********************************************************************/

    const placeTubeAtHole=hole=>{

      if(selectedTubeId===null){

        setMessage(
          `
            <strong>
              尚未選擇 Tube
            </strong>

            <span>
              請先從 Tube Rack 選擇離心管。
            </span>
          `,
          "warning"
        );

        return;
      }

      if(
        getTubeAtHole(
          hole
        )!==null
      ){

        setMessage(
          `
            <strong>
              孔位 ${hole} 已被使用
            </strong>

            <span>
              請選擇其他空孔位。
            </span>
          `,
          "warning"
        );

        return;
      }

      centrifuge.placements[
        selectedTubeId
      ]=
        hole;

      const placedTubeId=
        selectedTubeId;

      selectedTubeId=null;

      centrifuge.selectedTubeId=null;

      updateAll();

      setMessage(
        `
          <strong>
            Tube ${placedTubeId} 已放入孔位 ${hole}
          </strong>

          <span>
            對向孔位為
            ${oppositeHole(hole)}。
          </span>
        `,
        "success"
      );
    };


    /**********************************************************************
     * 檢查配平
     *
     * 規則：
     * 1. 每一支 Tube 都必須有對向 Tube。
     * 2. 對向 Tube 的容量必須相同。
     * 3. 所有 Tube 都必須放入。
     **********************************************************************/

    const validateBalance=()=>{

      const errors=[];

      if(!allTubesPlaced()){

        errors.push(
          `尚有 ${
            tubes.length-
            placedTubeCount()
          } 支離心管未放入離心機。`
        );
      }

      const checkedHoles=
        new Set();

      for(
        let hole=1;
        hole<=holeCount;
        hole++
      ){

        if(checkedHoles.has(hole)){
          continue;
        }

        const opposite=
          oppositeHole(hole);

        checkedHoles.add(hole);
        checkedHoles.add(opposite);

        const firstTubeId=
          getTubeAtHole(hole);

        const secondTubeId=
          getTubeAtHole(opposite);

        /*
         * 兩側都空，不需檢查。
         */
        if(
          firstTubeId===null&&
          secondTubeId===null
        ){
          continue;
        }

        /*
         * 只有單側有 Tube。
         */
        if(
          firstTubeId===null||
          secondTubeId===null
        ){

          const occupiedHole=
            firstTubeId!==null
              ?hole
              :opposite;

          const missingHole=
            firstTubeId!==null
              ?opposite
              :hole;

          const tubeId=
            firstTubeId!==null
              ?firstTubeId
              :secondTubeId;

          errors.push(
            `Tube ${tubeId} 位於孔位 ${occupiedHole}，但對向孔位 ${missingHole} 為空。`
          );

          continue;
        }

        const firstTube=
          getTube(firstTubeId);

        const secondTube=
          getTube(secondTubeId);

        if(
          !firstTube||
          !secondTube
        ){

          errors.push(
            `孔位 ${hole} 與 ${opposite} 的 Tube 資料異常。`
          );

          continue;
        }

        /*
         * 對向 Tube 的體積必須相同。
         */
        if(
          !this.approximatelyEqual(
            firstTube.volume,
            secondTube.volume,
            .1
          )
        ){

          errors.push(
            `孔位 ${hole} 的 Tube ${firstTubeId} 為 ${this.displayNumber(
              firstTube.volume
            )} mL，但對向孔位 ${opposite} 的 Tube ${secondTubeId} 為 ${this.displayNumber(
              secondTube.volume
            )} mL。`
          );
        }
      }

      return errors;
    };


    /**********************************************************************
     * 建立 Rotor 孔位
     **********************************************************************/

    const rotorHolesHtml=
      Array.from(
        {
          length:holeCount
        },
        (_,index)=>index+1
      )
      .map(
        hole=>{

          const angle=
            (
              hole-1
            )*
            (
              360/
              holeCount
            );

          const tubeId=
            getTubeAtHole(
              hole
            );

          const tube=
            tubeId===null
              ?null
              :getTube(tubeId);

          return `
            <button
              type="button"
              class="
                boss20-rotor-hole
                ${
                  tubeId!==null
                    ?"occupied"
                    :""
                }
              "
              data-boss20-rotor-hole="${hole}"
              style="
                --rotor-angle:${angle}deg;
              "
              aria-label="Rotor hole ${hole}"
            >

              <span class="boss20-hole-number">
                ${hole}
              </span>

              <span class="boss20-rotor-tube">

                <strong class="boss20-rotor-tube-label">
                  ${
                    tubeId!==null
                      ?`Tube ${tubeId}`
                      :""
                  }
                </strong>

                <small class="boss20-rotor-tube-volume">
                  ${
                    tube
                      ?`${this.displayNumber(
                          tube.volume
                        )} mL`
                      :""
                  }
                </small>

              </span>

            </button>
          `;
        }
      )
      .join("");


    /**********************************************************************
     * 建立 Tube Rack
     *
     * 顯示順序：
     *
     * Tube 1   Tube 2
     * Tube 3   Tube 4
     * Tube 5   Tube 6
     *
     * 奇數在左，偶數在右。
     **********************************************************************/

    const tubeRackHtml=
      tubes
        .map(
          tube=>{

            const placed=
              getHoleForTube(
                tube.id
              )!==null;

            return `
              <button
                type="button"
                class="
                  boss20-centrifuge-tube
                  ${placed?"placed":""}
                  ${
                    selectedTubeId===tube.id
                      ?"selected"
                      :""
                  }
                "
                data-boss20-centrifuge-tube="${tube.id}"
                ${placed?"disabled":""}
              >

                <span class="boss20-centrifuge-tube-visual">

                  <span class="boss20-tube-cap"></span>

                  <span class="boss20-tube-body">

                    <span
                      class="boss20-tube-liquid"
                      style="
                        height:${
                          Math.max(
                            15,
                            Math.min(
                              82,
                              tube.volume/
                              50*
                              82
                            )
                          )
                        }%;
                      "
                    ></span>

                  </span>

                </span>

                <span class="boss20-centrifuge-tube-info">

                  <strong>
                    Tube ${tube.id}
                  </strong>

                  <small>
                    ${this.displayNumber(
                      tube.volume
                    )} mL
                  </small>

                  <small>
                    ${
                      placed
                        ?`Hole ${
                            getHoleForTube(
                              tube.id
                            )
                          }`
                        :"Ready"
                    }
                  </small>

                </span>

              </button>
            `;
          }
        )
        .join("");


    /**********************************************************************
     * Round 3 主畫面
     **********************************************************************/

    ctx.stage.innerHTML=
      this.game.shell(
        "Centrifuge Balance",

        `
          將所有離心管放入 24 孔離心轉子。
          每一支離心管必須在正對面放置一支相同體積的離心管，
          再設定正確的 RPM 與離心時間。
        `,

        `
          <div class="boss20-round boss20-round3">

            <section class="boss20-centrifuge-summary">

              <div class="boss20-centrifuge-progress-card">

                <span class="kicker">
                  TUBES LOADED
                </span>

                <strong id="boss20CentrifugeProgress">
                  ${placedTubeCount()} / ${tubes.length}
                </strong>

                <div class="boss20-progress-track">

                  <div
                    id="boss20CentrifugeProgressBar"
                    class="boss20-progress-fill"
                    style="
                      width:${
                        tubes.length===0
                          ?0
                          :placedTubeCount()/
                            tubes.length*
                            100
                      }%;
                    "
                  ></div>

                </div>

              </div>


              <div
                id="boss20CentrifugeSelection"
                class="boss20-centrifuge-selection"
              ></div>


              <div class="boss20-centrifuge-target">

                <span class="kicker">
                  CENTRIFUGE SETTING
                </span>

                <strong>
                  ${centrifuge.rpm} RPM
                </strong>

                <span>
                  ${centrifuge.time} min
                </span>

              </div>

            </section>


            <div class="boss20-centrifuge-layout">

              <section class="boss20-centrifuge-rack-panel">

                <div class="boss20-section-heading">

                  <div>

                    <span class="kicker">
                      TUBE RACK
                    </span>

                    <strong>
                      選擇離心管
                    </strong>

                  </div>

                  <small>
                    奇數在左，偶數在右
                  </small>

                </div>

                <div class="boss20-centrifuge-tube-grid">
                  ${tubeRackHtml}
                </div>

              </section>


              <section class="boss20-rotor-panel">

                <div class="boss20-section-heading">

                  <div>

                    <span class="kicker">
                      24-HOLE ROTOR
                    </span>

                    <strong>
                      點擊孔位放入 Tube
                    </strong>

                  </div>

                  <small>
                    再次點擊已使用孔位可取出
                  </small>

                </div>

                <div class="boss20-rotor-shell">

                  <div class="boss20-rotor-center">

                    <span>
                      CENTRIFUGE
                    </span>

                    <strong>
                      24
                    </strong>

                    <small>
                      HOLES
                    </small>

                  </div>

                  <div class="boss20-rotor-disc">
                    ${rotorHolesHtml}
                  </div>

                </div>

              </section>

            </div>


            <section class="boss20-centrifuge-controls">

              <div class="boss20-section-heading">

                <div>

                  <span class="kicker">
                    MACHINE SETTINGS
                  </span>

                  <strong>
                    設定離心參數
                  </strong>

                </div>

                <small>
                  請依照上方指定條件設定
                </small>

              </div>


              <div class="boss20-setting-grid">

                <label class="boss20-setting-field">

                  <span>
                    RPM
                  </span>

                  <div class="boss20-number-input">

                    <input
                      type="number"
                      id="boss20CentrifugeRpm"
                      min="500"
                      max="5000"
                      step="100"
                      inputmode="numeric"
                      value=""
                      placeholder="輸入 RPM"
                    >

                    <span>
                      RPM
                    </span>

                  </div>

                </label>


                <label class="boss20-setting-field">

                  <span>
                    Time
                  </span>

                  <div class="boss20-number-input">

                    <input
                      type="number"
                      id="boss20CentrifugeTime"
                      min="1"
                      max="30"
                      step="1"
                      inputmode="numeric"
                      value=""
                      placeholder="輸入時間"
                    >

                    <span>
                      min
                    </span>

                  </div>

                </label>

              </div>

            </section>


            <div
              id="boss20CentrifugeMessage"
              class="notice"
              aria-live="polite"
            >
              請先選擇 Tube，再將 Tube 放入適當孔位。
            </div>


            <div class="controls">

              <button
                type="button"
                id="boss20StartCentrifuge"
                class="btn btn-primary btn-large"
              >
                關閉上蓋並開始離心
              </button>

            </div>

          </div>
        `
      );


    /**********************************************************************
     * 初始化畫面
     **********************************************************************/

    updateAll();


    /**********************************************************************
     * 選擇 Tube
     **********************************************************************/

    ctx.stage
      .querySelectorAll(
        "[data-boss20-centrifuge-tube]"
      )
      .forEach(
        button=>{

          button.addEventListener(
            "click",
            ()=>{

              if(
                locked||
                this.missionFailed
              ){
                return;
              }

              const tubeId=
                Number(
                  button.dataset
                    .boss20CentrifugeTube
                );

              if(
                getHoleForTube(
                  tubeId
                )!==null
              ){
                return;
              }

              /*
               * 再次點擊同一支 Tube，
               * 取消選取。
               */
              if(selectedTubeId===tubeId){

                selectedTubeId=null;

                centrifuge.selectedTubeId=
                  null;

                updateAll();

                setMessage(
                  "已取消選取離心管。",
                  "warning"
                );

                return;
              }

              selectedTubeId=
                tubeId;

              centrifuge.selectedTubeId=
                tubeId;

              updateAll();

              const tube=
                getTube(
                  tubeId
                );

              setMessage(
                `
                  <strong>
                    已選擇 Tube ${tubeId}
                  </strong>

                  <span>
                    容量為 ${
                      tube
                        ?this.displayNumber(
                            tube.volume
                          )
                        :"—"
                    } mL。
                    請選擇一個空孔位。
                  </span>
                `,
                "success"
              );
            }
          );
        }
      );


    /**********************************************************************
     * Rotor 孔位點擊
     **********************************************************************/

    ctx.stage
      .querySelectorAll(
        "[data-boss20-rotor-hole]"
      )
      .forEach(
        button=>{

          button.addEventListener(
            "click",
            ()=>{

              if(
                locked||
                this.missionFailed
              ){
                return;
              }

              const hole=
                Number(
                  button.dataset
                    .boss20RotorHole
                );

              /*
               * 點擊已有 Tube 的孔位：
               * 將該 Tube 移回 Rack。
               */
              if(
                getTubeAtHole(
                  hole
                )!==null
              ){

                removeTubeFromHole(
                  hole
                );

                return;
              }

              placeTubeAtHole(
                hole
              );
            }
          );
        }
      );


    /**********************************************************************
     * 開始離心
     **********************************************************************/

    const startButton=
      ctx.stage.querySelector(
        "#boss20StartCentrifuge"
      );

    startButton.addEventListener(
      "click",
      ()=>{

        if(
          locked||
          this.missionFailed
        ){
          return;
        }

        const enteredRpm=
          Number(
            ctx.stage.querySelector(
              "#boss20CentrifugeRpm"
            ).value
          );

        const enteredTime=
          Number(
            ctx.stage.querySelector(
              "#boss20CentrifugeTime"
            ).value
          );


        /******************************************************************
         * 欄位未填
         ******************************************************************/

        if(
          !Number.isFinite(
            enteredRpm
          )||
          enteredRpm<=0
        ){

          setMessage(
            `
              <strong>
                請輸入 RPM
              </strong>

              <span>
                必須先設定離心轉速。
              </span>
            `,
            "warning"
          );

          return;
        }

        if(
          !Number.isFinite(
            enteredTime
          )||
          enteredTime<=0
        ){

          setMessage(
            `
              <strong>
                請輸入離心時間
              </strong>

              <span>
                必須先設定離心時間。
              </span>
            `,
            "warning"
          );

          return;
        }


        /******************************************************************
         * 檢查配平
         ******************************************************************/

        const balanceErrors=
          validateBalance();

        if(balanceErrors.length>0){

          centrifuge.passed=false;

          this.failMission(
            ctx,
            [
              ...balanceErrors,
              "離心機未正確配平，啟動後可能劇烈震動或損壞。"
            ],
            {
              penalties:[
                {
                  metric:"accuracy",
                  amount:100,
                  message:
                    "離心管配置不正確。"
                },
                {
                  metric:"sampleQuality",
                  amount:100,
                  message:
                    "離心失衡可能造成樣本混濁、洩漏或損失。"
                },
                {
                  metric:"safety",
                  amount:100,
                  message:
                    "未配平離心機可能造成設備損壞或人員受傷。"
                }
              ]
            }
          );

          return;
        }


        /******************************************************************
         * RPM 錯誤
         ******************************************************************/

        if(
          enteredRpm!==
          centrifuge.rpm
        ){

          centrifuge.passed=false;

          this.failMission(
            ctx,
            [
              `指定轉速為 ${centrifuge.rpm} RPM。`,
              `實際設定為 ${enteredRpm} RPM。`
            ],
            {
              penalties:[
                {
                  metric:"accuracy",
                  amount:100,
                  message:
                    "離心機 RPM 設定錯誤。"
                },
                {
                  metric:"sampleQuality",
                  amount:100,
                  message:
                    "錯誤轉速可能造成離心效果不足或樣本受損。"
                }
              ]
            }
          );

          return;
        }


        /******************************************************************
         * 時間錯誤
         ******************************************************************/

        if(
          enteredTime!==
          centrifuge.time
        ){

          centrifuge.passed=false;

          this.failMission(
            ctx,
            [
              `指定離心時間為 ${centrifuge.time} 分鐘。`,
              `實際設定為 ${enteredTime} 分鐘。`
            ],
            {
              penalties:[
                {
                  metric:"accuracy",
                  amount:100,
                  message:
                    "離心時間設定錯誤。"
                },
                {
                  metric:"sampleQuality",
                  amount:100,
                  message:
                    "錯誤離心時間可能造成樣本處理不完整。"
                }
              ]
            }
          );

          return;
        }


        /******************************************************************
         * 正確啟動離心機
         ******************************************************************/

        locked=true;

        centrifuge.started=true;

        startButton.disabled=true;

        ctx.stage
          .querySelectorAll(
            "button,input"
          )
          .forEach(
            control=>{

              control.disabled=true;
            }
          );

        const rotor=
          ctx.stage.querySelector(
            ".boss20-rotor-disc"
          );

        if(rotor){

          rotor.classList.add(
            "spinning"
          );
        }

        setMessage(
          `
            <strong>
              離心機運轉中
            </strong>

            <span>
              ${centrifuge.rpm} RPM，
              ${centrifuge.time} 分鐘。
            </span>
          `,
          "success"
        );

        this.setTimer(
          ()=>{

            if(rotor){

              rotor.classList.remove(
                "spinning"
              );

              rotor.classList.add(
                "finished"
              );
            }

            centrifuge.passed=true;

            setMessage(
              `
                <strong>
                  離心完成
                </strong>

                <span>
                  所有離心管已正確配平，
                  並完成 ${centrifuge.rpm} RPM、
                  ${centrifuge.time} 分鐘離心。
                </span>
              `,
              "success"
            );

            this.completeRound(
              ctx,
              900
            );
          },
          1800
        );
      }
    );
  },

  
  /**************************************************************************
   * ROUND 4
   * Label Complete DMEM Bottle
   **************************************************************************/

  round4(ctx){

    const state=
      this.state;

    state.currentRound=4;


    /**********************************************************************
     * Round 3 未完成時，不允許進入標示步驟
     **********************************************************************/

    if(
      !state.centrifuge||
      !state.centrifuge.passed
    ){

      this.failMission(
        ctx,
        [
          "Round 3 的離心步驟尚未正確完成。",
          "無法進行 Complete DMEM 標籤製作。"
        ],
        {
          penalties:[]
        }
      );

      return;
    }


    /**********************************************************************
     * 建立／延續標籤狀態
     **********************************************************************/

    if(!state.labeling){

      state.labeling={
        selectedItems:[],
        passed:false
      };
    }

    if(!state.bottle.label){

      state.bottle.label={
        mediumName:"",
        totalVolume:"",
        fbs:"",
        penStrep:"",
        preparationDate:"",
        operatorInitials:"",
        storage:""
      };
    }

    const labeling=
      state.labeling;

    const label=
      state.bottle.label;

    let locked=false;


    /**********************************************************************
     * 正確標籤內容
     **********************************************************************/

    const correctLabel={

      mediumName:
        "Complete DMEM",

      totalVolume:
        `${this.displayNumber(
          state.totalVolume
        )} mL`,

      fbs:
        "10% FBS",

      penStrep:
        "1% Pen/Strep",

      storage:
        "4°C"
    };


    /**********************************************************************
     * 將 Date 轉成 YYYY-MM-DD
     **********************************************************************/

    const normalizeDate=value=>{

      if(!value){
        return "";
      }

      const date=
        new Date(
          `${value}T00:00:00`
        );

      if(
        Number.isNaN(
          date.getTime()
        )
      ){
        return "";
      }

      const year=
        date.getFullYear();

      const month=
        String(
          date.getMonth()+1
        ).padStart(
          2,
          "0"
        );

      const day=
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        );

      return `${year}-${month}-${day}`;
    };


    /**********************************************************************
     * 取得輸入值
     **********************************************************************/

    const readLabelValues=()=>{

      const getValue=id=>{

        const input=
          ctx.stage.querySelector(
            id
          );

        return input
          ?input.value.trim()
          :"";
      };

      return{

        mediumName:
          getValue(
            "#boss20LabelMediumName"
          ),

        totalVolume:
          getValue(
            "#boss20LabelTotalVolume"
          ),

        fbs:
          getValue(
            "#boss20LabelFbs"
          ),

        penStrep:
          getValue(
            "#boss20LabelPenStrep"
          ),

        preparationDate:
          getValue(
            "#boss20LabelDate"
          ),

        operatorInitials:
          getValue(
            "#boss20LabelInitials"
          ),

        storage:
          getValue(
            "#boss20LabelStorage"
          )
      };
    };


    /**********************************************************************
     * 保存輸入內容
     **********************************************************************/

    const saveLabelValues=()=>{

      const values=
        readLabelValues();

      Object.assign(
        label,
        values
      );

      labeling.selectedItems=
        Object.entries(values)
          .filter(
            ([,value])=>
              String(value).trim()!==""
          )
          .map(
            ([name])=>name
          );
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
          "#boss20LabelMessage"
        );

      if(!box){
        return;
      }

      box.classList.remove(
        "success",
        "warning",
        "error"
      );

      if(type){
        box.classList.add(type);
      }

      box.innerHTML=
        message;
    };


    /**********************************************************************
     * 更新標籤預覽
     **********************************************************************/

    const updatePreview=()=>{

      saveLabelValues();

      const preview=
        ctx.stage.querySelector(
          "#boss20LabelPreview"
        );

      if(!preview){
        return;
      }

      const previewLabel={

        mediumName:
          label.mediumName||
          "Medium name",

        totalVolume:
          label.totalVolume||
          "Total volume",

        fbs:
          label.fbs||
          "FBS concentration",

        penStrep:
          label.penStrep||
          "Pen/Strep concentration",

        preparationDate:
          normalizeDate(
            label.preparationDate
          ),

        operatorInitials:
          label.operatorInitials||
          "Operator",

        storage:
          label.storage||
          "Storage"
      };

      preview.innerHTML=
        this.bottleHtml({
          currentVolume:0,
          showLabel:true,
          label:previewLabel
        });
    };


    /**********************************************************************
     * 設定輸入欄位成功／錯誤樣式
     **********************************************************************/

    const markField=(
      id,
      valid
    )=>{

      const input=
        ctx.stage.querySelector(
          id
        );

      if(!input){
        return;
      }

      input.classList.remove(
        "boss20-field-valid",
        "boss20-field-invalid"
      );

      input.classList.add(
        valid
          ?"boss20-field-valid"
          :"boss20-field-invalid"
      );
    };


    /**********************************************************************
     * 清除欄位檢查樣式
     **********************************************************************/

    const clearFieldMarks=()=>{

      ctx.stage
        .querySelectorAll(
          ".boss20-label-form input"
        )
        .forEach(
          input=>{

            input.classList.remove(
              "boss20-field-valid",
              "boss20-field-invalid"
            );
          }
        );
    };


    /**********************************************************************
     * Round 4 主畫面
     **********************************************************************/

    ctx.stage.innerHTML=
      this.game.shell(
        "Label Complete DMEM",

        `
          為處理完成的 Complete DMEM 製作標籤。
          標籤必須包含培養基名稱、總體積、添加物濃度、
          製備日期、操作者縮寫與保存條件。
        `,

        `
          <div class="boss20-round boss20-round4">

            <section class="boss20-label-summary">

              <div class="boss20-label-requirement">

                <span class="kicker">
                  LABEL REQUIREMENTS
                </span>

                <strong>
                  Complete DMEM Bottle
                </strong>

                <ul>
                  <li>
                    培養基名稱
                  </li>

                  <li>
                    總體積
                  </li>

                  <li>
                    FBS 濃度
                  </li>

                  <li>
                    Pen/Strep 濃度
                  </li>

                  <li>
                    製備日期
                  </li>

                  <li>
                    操作者縮寫
                  </li>

                  <li>
                    保存條件
                  </li>
                </ul>

              </div>

              <div class="boss20-label-warning">

                <span class="kicker">
                  IMPORTANT
                </span>

                <strong>
                  標籤錯誤將造成樣本辨識風險
                </strong>

                <p>
                  確認標籤後若有任何資料錯誤，
                  Boss 任務將立即失敗。
                </p>

              </div>

            </section>


            <div class="boss20-label-layout">

              <section class="boss20-label-form-panel">

                <div class="boss20-section-heading">

                  <div>

                    <span class="kicker">
                      LABEL INFORMATION
                    </span>

                    <strong>
                      輸入標籤內容
                    </strong>

                  </div>

                  <small>
                    所有欄位皆為必填
                  </small>

                </div>


                <div class="boss20-label-form">

                  <label class="boss20-label-field">

                    <span>
                      Medium name
                    </span>

                    <input
                      type="text"
                      id="boss20LabelMediumName"
                      value="${this.escapeHtml(
                        label.mediumName
                      )}"
                      placeholder="例如：Complete DMEM"
                      autocomplete="off"
                    >

                  </label>


                  <label class="boss20-label-field">

                    <span>
                      Total volume
                    </span>

                    <input
                      type="text"
                      id="boss20LabelTotalVolume"
                      value="${this.escapeHtml(
                        label.totalVolume
                      )}"
                      placeholder="例如：500 mL"
                      autocomplete="off"
                    >

                  </label>


                  <label class="boss20-label-field">

                    <span>
                      FBS
                    </span>

                    <input
                      type="text"
                      id="boss20LabelFbs"
                      value="${this.escapeHtml(
                        label.fbs
                      )}"
                      placeholder="例如：10% FBS"
                      autocomplete="off"
                    >

                  </label>


                  <label class="boss20-label-field">

                    <span>
                      Pen/Strep
                    </span>

                    <input
                      type="text"
                      id="boss20LabelPenStrep"
                      value="${this.escapeHtml(
                        label.penStrep
                      )}"
                      placeholder="例如：1% Pen/Strep"
                      autocomplete="off"
                    >

                  </label>


                  <label class="boss20-label-field">

                    <span>
                      Preparation date
                    </span>

                    <input
                      type="date"
                      id="boss20LabelDate"
                      value="${this.escapeHtml(
                        label.preparationDate
                      )}"
                    >

                  </label>


                  <label class="boss20-label-field">

                    <span>
                      Operator initials
                    </span>

                    <input
                      type="text"
                      id="boss20LabelInitials"
                      value="${this.escapeHtml(
                        label.operatorInitials
                      )}"
                      maxlength="6"
                      placeholder="例如：YCH"
                      autocomplete="off"
                    >

                  </label>


                  <label class="boss20-label-field">

                    <span>
                      Storage
                    </span>

                    <input
                      type="text"
                      id="boss20LabelStorage"
                      value="${this.escapeHtml(
                        label.storage
                      )}"
                      placeholder="例如：4°C"
                      autocomplete="off"
                    >

                  </label>

                </div>

              </section>


              <section class="boss20-label-preview-panel">

                <div class="boss20-section-heading">

                  <div>

                    <span class="kicker">
                      LIVE PREVIEW
                    </span>

                    <strong>
                      Bottle Label Preview
                    </strong>

                  </div>

                  <small>
                    輸入時即時更新
                  </small>

                </div>

                <div
                  id="boss20LabelPreview"
                  class="boss20-label-preview"
                ></div>

              </section>

            </div>


            <div
              id="boss20LabelMessage"
              class="notice"
              aria-live="polite"
            >
              請依照本次 Complete DMEM 配方填寫完整標籤。
            </div>


            <div class="controls">

              <button
                type="button"
                id="boss20ConfirmLabel"
                class="btn btn-primary btn-large"
              >
                貼上標籤並確認
              </button>

            </div>

          </div>
        `
      );


    /**********************************************************************
     * 初始化標籤預覽
     **********************************************************************/

    updatePreview();


    /**********************************************************************
     * 所有輸入欄位即時更新
     **********************************************************************/

    ctx.stage
      .querySelectorAll(
        ".boss20-label-form input"
      )
      .forEach(
        input=>{

          input.addEventListener(
            "input",
            ()=>{

              if(
                locked||
                this.missionFailed
              ){
                return;
              }

              input.classList.remove(
                "boss20-field-valid",
                "boss20-field-invalid"
              );

              /*
               * 操作者縮寫統一轉為大寫，
               * 並移除空白。
               */
              if(
                input.id===
                "boss20LabelInitials"
              ){

                input.value=
                  input.value
                    .toUpperCase()
                    .replaceAll(
                      " ",
                      ""
                    );
              }

              updatePreview();
            }
          );

          input.addEventListener(
            "change",
            ()=>{

              if(
                locked||
                this.missionFailed
              ){
                return;
              }

              updatePreview();
            }
          );
        }
      );


    /**********************************************************************
     * 確認標籤
     **********************************************************************/

    const confirmButton=
      ctx.stage.querySelector(
        "#boss20ConfirmLabel"
      );

    confirmButton.addEventListener(
      "click",
      ()=>{

        if(
          locked||
          this.missionFailed
        ){
          return;
        }

        clearFieldMarks();
        saveLabelValues();

        const values=
          readLabelValues();

        const errors=[];


        /******************************************************************
         * Medium name
         ******************************************************************/

        const mediumNameValid=
          values.mediumName
            .trim()
            .toLowerCase()===
          correctLabel.mediumName
            .toLowerCase();

        markField(
          "#boss20LabelMediumName",
          mediumNameValid
        );

        if(!mediumNameValid){

          errors.push(
            `培養基名稱應為「${correctLabel.mediumName}」。`
          );
        }


        /******************************************************************
         * Total volume
         *
         * 接受：
         * 500 mL
         * 500ml
         * 500 ML
         ******************************************************************/

        const enteredVolumeMatch=
          values.totalVolume.match(
            /^(\d+(?:\.\d+)?)\s*ml$/i
          );

        const enteredVolume=
          enteredVolumeMatch
            ?Number(
                enteredVolumeMatch[1]
              )
            :NaN;

        const totalVolumeValid=
          Number.isFinite(
            enteredVolume
          )&&
          this.approximatelyEqual(
            enteredVolume,
            state.totalVolume,
            .1
          );

        markField(
          "#boss20LabelTotalVolume",
          totalVolumeValid
        );

        if(!totalVolumeValid){

          errors.push(
            `總體積應標示為 ${correctLabel.totalVolume}。`
          );
        }


        /******************************************************************
         * FBS
         ******************************************************************/

        const normalizedFbs=
          values.fbs
            .replaceAll(
              " ",
              ""
            )
            .toLowerCase();

        const fbsValid=
          normalizedFbs==="10%fbs";

        markField(
          "#boss20LabelFbs",
          fbsValid
        );

        if(!fbsValid){

          errors.push(
            "FBS 濃度應標示為 10% FBS。"
          );
        }


        /******************************************************************
         * Pen/Strep
         ******************************************************************/

        const normalizedPenStrep=
          values.penStrep
            .replaceAll(
              " ",
              ""
            )
            .toLowerCase();

        const penStrepValid=
          [
            "1%pen/strep",
            "1%penstrep",
            "1%p/s"
          ].includes(
            normalizedPenStrep
          );

        markField(
          "#boss20LabelPenStrep",
          penStrepValid
        );

        if(!penStrepValid){

          errors.push(
            "Pen/Strep 濃度應標示為 1% Pen/Strep。"
          );
        }


        /******************************************************************
         * Preparation date
         ******************************************************************/

        const normalizedPreparationDate=
          normalizeDate(
            values.preparationDate
          );

        const preparationDateValid=
          normalizedPreparationDate!=="";

        markField(
          "#boss20LabelDate",
          preparationDateValid
        );

        if(!preparationDateValid){

          errors.push(
            "必須填寫有效的製備日期。"
          );
        }


        /******************************************************************
         * Operator initials
         *
         * 允許 2–6 個英文字母。
         ******************************************************************/

        const initialsValid=
          /^[A-Za-z]{2,6}$/.test(
            values.operatorInitials
          );

        markField(
          "#boss20LabelInitials",
          initialsValid
        );

        if(!initialsValid){

          errors.push(
            "操作者縮寫必須為 2–6 個英文字母。"
          );
        }


        /******************************************************************
         * Storage
         *
         * 接受：
         * 4°C
         * 4 °C
         * 4C
         ******************************************************************/

        const normalizedStorage=
          values.storage
            .replaceAll(
              " ",
              ""
            )
            .replaceAll(
              "°",
              ""
            )
            .toUpperCase();

        const storageValid=
          normalizedStorage==="4C";

        markField(
          "#boss20LabelStorage",
          storageValid
        );

        if(!storageValid){

          errors.push(
            "保存條件應標示為 4°C。"
          );
        }


        /******************************************************************
         * 標籤錯誤：立即結束 Boss 任務
         ******************************************************************/

        if(errors.length>0){

          labeling.passed=false;

          this.failMission(
            ctx,
            [
              ...errors,
              "Complete DMEM 標籤資料不正確，可能造成樣本誤認或錯誤保存。"
            ],
            {
              penalties:[
                {
                  metric:"accuracy",
                  amount:100,
                  message:
                    "Complete DMEM 標籤內容錯誤。"
                },
                {
                  metric:"sampleQuality",
                  amount:100,
                  message:
                    "錯誤標籤可能造成培養基誤用或保存條件錯誤。"
                },
                {
                  metric:"safety",
                  amount:100,
                  message:
                    "實驗材料標示不完整可能造成操作與生物安全風險。"
                }
              ]
            }
          );

          return;
        }


        /******************************************************************
         * Round 4 成功
         ******************************************************************/

        locked=true;

        labeling.passed=true;

        label.mediumName=
          correctLabel.mediumName;

        label.totalVolume=
          correctLabel.totalVolume;

        label.fbs=
          correctLabel.fbs;

        label.penStrep=
          correctLabel.penStrep;

        label.preparationDate=
          normalizedPreparationDate;

        label.operatorInitials=
          values.operatorInitials
            .toUpperCase();

        label.storage=
          correctLabel.storage;

        labeling.selectedItems=[
          "mediumName",
          "totalVolume",
          "fbs",
          "penStrep",
          "preparationDate",
          "operatorInitials",
          "storage"
        ];

        confirmButton.disabled=true;

        ctx.stage
          .querySelectorAll(
            "button,input"
          )
          .forEach(
            control=>{

              control.disabled=true;
            }
          );

        updatePreview();

        setMessage(
          `
            <strong>
              Complete DMEM 標籤完成
            </strong>

            <span>
              ${this.escapeHtml(
                label.mediumName
              )} ／
              ${this.escapeHtml(
                label.totalVolume
              )} ／
              ${this.escapeHtml(
                label.fbs
              )} ／
              ${this.escapeHtml(
                label.penStrep
              )} ／
              ${this.escapeHtml(
                label.preparationDate
              )} ／
              ${this.escapeHtml(
                label.operatorInitials
              )} ／
              ${this.escapeHtml(
                label.storage
              )}
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
