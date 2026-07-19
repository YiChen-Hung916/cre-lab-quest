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
   * Round 1–5
   *
   * 後續 Part 會接在這裡。
   **************************************************************************/

  round1(ctx){
    this.renderTemporaryRound(
      ctx,
      1
    );
  },

  round2(ctx){
    this.renderTemporaryRound(
      ctx,
      2
    );
  },

  round3(ctx){
    this.renderTemporaryRound(
      ctx,
      3
    );
  },

  round4(ctx){
    this.renderTemporaryRound(
      ctx,
      4
    );
  },

  round5(ctx){
    this.renderTemporaryRound(
      ctx,
      5
    );
  },

  renderTemporaryRound(ctx,round){

    ctx.stage.innerHTML=
      this.game.shell(
        `Boss20 Round ${round}`,
        "此回合將於後續程式碼取代。",
        `
          <div class="notice">
            Boss20.js 尚未貼完。
          </div>
        `
      );
  }

};


/*
 * 讓傳統 script 載入方式可以由其他檔案存取。
 */
window.Boss20=Boss20;
