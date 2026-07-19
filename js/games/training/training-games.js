const TRAINING_META={
  pipette:{name:"Micropipette Training",icon:"🧪"},
  serological:{name:"Serological Pipette",icon:"🧫"},
  centrifuge:{name:"Centrifuge Balance",icon:"⚙️"},
  equipment:{name:"Lab Knowledge",icon:"🧠"},
  plate:{name:"96-Well Plate",icon:"▦"},
  microscope:{name:"Microscope Focus",icon:"🔬"},
  labInspection:{name:"Lab Safety Inspection",icon:"⚠️"}
};

/******************************************************************************
 * QUESTION BANK
 *
 * Level12
 *   General Laboratory Knowledge
 *
 * Level13
 *   Storage
 *
 * Level14
 *   Solution Preparation
 ******************************************************************************/

const QUESTION_BANK={

12:[

{
title:"Incubator",
text:"哺乳類細胞最常使用的培養條件為？",
options:[
"25°C、0% CO₂",
"37°C、5% CO₂",
"42°C、10% CO₂",
"4°C"
],
answer:1
},

{
title:"Biosafety Cabinet",
text:"操作細胞時應在哪個設備內進行？",
options:[
"Chemical Hood",
"Biosafety Cabinet",
"Incubator",
"Oven"
],
answer:1
},

{
title:"Cell Confluence",
text:"一般貼附型細胞最常在多少 confluence 進行 passage？",
options:[
"10%",
"30%",
"70~90%",
"100%"
],
answer:2
},

{
title:"Mycoplasma",
text:"Mycoplasma contamination 最容易造成？",
options:[
"增加 CO₂",
"影響細胞實驗結果",
"培養基變成紅色",
"PBS結晶"
],
answer:1
},

{
title:"Vortex",
text:"使用 Vortex 的主要目的？",
options:[
"離心",
"混合",
"冷凍",
"滅菌"
],
answer:1
},

{
title:"Western Blot",
text:"Transfer 後通常先進行哪一步？",
options:[
"Primary antibody",
"Blocking",
"ECL",
"Exposure"
],
answer:1
},

{
title:"Primary Antibody",
text:"Primary antibody 的主要功能？",
options:[
"辨識目標蛋白",
"產生化學發光",
"增加蛋白濃度",
"染色細胞核"
],
answer:0
},

{
title:"Secondary Antibody",
text:"Secondary antibody 最主要用途？",
options:[
"辨識DNA",
"結合Primary antibody",
"固定蛋白",
"裂解細胞"
],
answer:1
},

{
title:"PVDF",
text:"Western blot 中 PVDF membrane 用於？",
options:[
"Protein Transfer",
"PCR",
"Cell Culture",
"DNA Extraction"
],
answer:0
},

{
title:"Protein Ladder",
text:"Protein ladder 的用途？",
options:[
"定量DNA",
"Protein Molecular Weight Marker",
"Cell counting",
"Protein extraction"
],
answer:1
},

{
title:"Trypsin",
text:"Trypsin 最常用於？",
options:[
"裂解蛋白",
"細胞脫附(passage)",
"Protein transfer",
"RNA extraction"
],
answer:1
},

{
title:"PBS",
text:"PBS 最主要用途？",
options:[
"裂解細胞",
"洗滌細胞",
"固定細胞",
"Protein transfer"
],
answer:1
},

{
title:"FBS",
text:"FBS 最主要功能？",
options:[
"提供細胞營養",
"提供DNA",
"Protein marker",
"Cell stain"
],
answer:0
},

{
title:"Microscope",
text:"使用顯微鏡時應先調整？",
options:[
"細焦",
"粗焦",
"曝光",
"相機"
],
answer:1
},

{
title:"Centrifuge",
text:"離心前最重要的是？",
options:[
"配平(Balance)",
"開蓋",
"提高速度",
"縮短時間"
],
answer:0
}

],

13:[

{
name:"DMEM",
answer:"4°C"
},

{
name:"RPMI-1640",
answer:"4°C"
},

{
name:"MEM",
answer:"4°C"
},

{
name:"PBS",
answer:"Room Temperature"
},

{
name:"HBSS",
answer:"4°C"
},

{
name:"Trypsin",
answer:"-20°C"
},

{
name:"FBS",
answer:"-20°C"
},

{
name:"Penicillin/Streptomycin",
answer:"-20°C"
},

{
name:"Glutamine",
answer:"-20°C"
},

{
name:"Protein Ladder",
answer:"-20°C"
},

{
name:"Primary Antibody",
answer:"-20°C"
},

{
name:"Secondary Antibody",
answer:"4°C"
},

{
name:"RIPA Buffer",
answer:"4°C"
},

{
name:"TBST",
answer:"Room Temperature"
},

{
name:"TBS",
answer:"Room Temperature"
},

{
name:"BSA Powder",
answer:"Room Temperature"
},

{
name:"BSA Solution",
answer:"4°C"
},

{
name:"Skim Milk Powder",
answer:"Room Temperature"
},

{
name:"PVDF Membrane",
answer:"Room Temperature"
},

{
name:"Nitrocellulose Membrane",
answer:"Room Temperature"
},

{
name:"TRIzol",
answer:"4°C"
},

{
name:"RNA Sample",
answer:"-80°C"
},

{
name:"DNA Sample",
answer:"-20°C"
},

{
name:"Protein Lysate",
answer:"-80°C"
},

{
name:"Cell Pellet",
answer:"-80°C"
},

{
name:"Cell Line",
answer:"Liquid Nitrogen"
},

{
name:"Organoid",
answer:"Liquid Nitrogen"
},

{
name:"Plasmid DNA",
answer:"-20°C"
},

{
name:"PCR Mix",
answer:"-20°C"
},

{
name:"Restriction Enzyme",
answer:"-20°C"
},

{
name:"Loading Dye",
answer:"-20°C"
},

{
name:"ECL Reagent",
answer:"4°C"
},

{
name:"Paraformaldehyde",
answer:"4°C"
},

{
name:"Methanol",
answer:"Room Temperature"
},

{
name:"DMSO",
answer:"Room Temperature"
}
]
};

const STORAGE_OPTIONS=[
"Room Temperature",
"4°C",
"-20°C",
"-80°C",
"Liquid Nitrogen"
];

function randomChoice(arr){
    return arr[
        Math.floor(
            Math.random()*arr.length
        )
    ];
}

function randomInt(min,max){
    return Math.floor(
        Math.random()*(max-min+1)
    )+min;
}

function generateSolutionQuestion(){

    const type=randomInt(1,5);

    switch(type){

        case 1:
            return generatePBSQuestion();

        case 2:
            return generateCompleteMediumQuestion();

        case 3:
            return generateDrugDilutionQuestion();

        case 4:
            return generatePowderQuestion();

        default:
            return generateStockQuestion();

    }

}

function generatePBSQuestion(){

    const stock=randomChoice([5,10,20,50]);

    const volume=randomChoice([
        50,
        100,
        250,
        500,
        1000
    ]);

    return{

        title:"PBS Dilution",

        text:`需要配製 ${volume} mL 1× PBS，目前只有 ${stock}× PBS。應加入多少 mL stock？`,

        answer:volume/stock,

        unit:"mL"

    };

}

function generateCompleteMediumQuestion(){

    const volume=randomChoice([
        100,
        250,
        500,
        1000
    ]);

    return{

        title:"Complete Medium",

        text:
`配製 ${volume} mL complete medium。

FBS 10%

Pen/Strep 1%

請問：

FBS=? mL

Pen/Strep=? mL

DMEM=? mL`,

        answer:{
            fbs:volume*.1,
            ps:volume*.01,
            dmem:volume*.89
        }

    };

}

function generatePowderQuestion(){

    const mass=randomChoice([
        50,
        100,
        200,
        500
    ]);

    const concentration=randomChoice([
        5,
        10,
        20,
        25,
        50
    ]);

    return{

        title:"Powder Solution",

        text:
`${mass} mg powder

配置成

${concentration} mg/mL

需加入多少 mL？`,

        answer:
            mass/concentration,

        unit:"mL"

    };

}

function generateDrugDilutionQuestion(){

    const stock=randomChoice([
        10,
        20,
        50,
        100
    ]);

    const target=randomChoice([
        5,
        10,
        20,
        50
    ]);

    const volume=randomChoice([
        5,
        10,
        20
    ]);

    return{

        title:"Drug Dilution",

        text:
`${stock} mM Stock

↓

${target} μM

↓

${volume} mL

需要加入多少 μL？`,

        answer:
            volume*
            target/
            stock,

        unit:"μL"

    };

}

function generateStockQuestion(){

    const stock=randomChoice([
        100,
        200,
        500,
        1000
    ]);

    const target=randomChoice([
        10,
        20,
        50
    ]);

    const volume=randomChoice([
        10,
        20,
        50
    ]);

    return{

        title:"Stock Solution",

        text:
`${stock} μM

↓

${target} μM

↓

${volume} mL

需要加入多少 mL Stock？`,

        answer:
            volume*
            target/
            stock,

        unit:"mL"

    };

}


const TrainingGames={
  mount(ctx){
    const map={
      pipette:this.pipette,
      serological:this.serological,
      centrifuge:this.centrifuge,
      equipment:this.equipment,
      plate:this.plate,
      microscope:this.microscope,
      labInspection:this.labInspection
    };

    const game=map[ctx.config.mode]||this.pipette;
    const totalRounds=this.roundCount(ctx.config.level);
    let round=1;

    const launch=()=>{
      const roundCtx={
        ...ctx,
        config:{
          ...ctx.config,
          roundIndex:round,
          totalRounds
        },
        complete:()=>{
          if(round>=totalRounds){
            ctx.complete();
          }else{
            round++;
            launch();
          }
        }
      };

      game.call(this,roundCtx);
      this.addRoundHeader(
        ctx.stage,
        round,
        totalRounds
      );
    };

    launch();
  },

  roundCount(level){

    level=Number(level);

    /*
     * Pipette
     */
    if(level<=7){
        return 3;
    }

    /*
     * Centrifuge
     */
    if(level<=11){
        return 4;
    }

    /*
     * Question Bank
     */
    if(level<=14){
        return 3;
    }

    /*
     * Plate
     */
    if(level<=17){
        return 5;
    }

    /*
     * Microscope
     */
    if(level<=19){
        return 3;
    }

    return 1;

},

  addRoundHeader(stage,current,total){
    const box=document.createElement("div");

    box.className="training-round-indicator";

    box.innerHTML=`
      <strong>Round ${current} / ${total}</strong>
      <span>評分將於整關結束後公布</span>
    `;

    stage.prepend(box);
  },

  shell(title,text,inner){
    return `
      <div class="game-shell">
        <div class="game-instructions">
          <h3>${title}</h3>
          <p>${text}</p>
        </div>

        ${inner}
      </div>
    `;
  },

  finishRound(ctx,messages=[]){
    ctx.complete();
  },

  pipette(ctx){
    const randomInt=(min,max)=>{
      return Math.floor(
        Math.random()*(max-min+1)
      )+min;
    };

    const roll=Math.random();

    const correct=
      roll<.20
        ?"P10"
        :roll<.40
          ?"P20"
          :roll<.70
            ?"P200"
            :"P1000";

    const ranges={
      P10:[1,10],
      P20:[2,20],
      P200:[20,200],
      P1000:[100,1000]
    };

    const target=randomInt(
      ...ranges[correct]
    );

    const showRecommendation=
      Number(ctx.config.level)<=3;

    const recommendation=
      showRecommendation
        ?`
          <small class="recommended-range">
            建議量程：${correct}
          </small>
        `
        :"";

    let selected=null;
    let digits=[0,0,0,0];
    let tipInstalled=false;
    let liquidLoaded=false;
    let aspirationChecked=false;

    const roundIssues=[];
    const stage=ctx.stage;

    stage.innerHTML=this.shell(
      "Micropipette 精準移液",
      `請選擇 pipette，設定 ${target} μL，並將液體移入 Tube B。`,
      `
        <div class="lab-bench">
          <div class="bench-card task-card">
            <span class="kicker">任務</span>

            <strong class="task-volume">
              <span>${target} μL</span>
              <span>to Tube B</span>
            </strong>

            ${recommendation}
          </div>

          <div class="bench-card status-card">
            <span class="kicker">操作狀態</span>
            <strong id="pipetteStatus">
              尚未選擇 pipette
            </strong>
          </div>

          <div class="pipette-rack">
            ${[
              {
                name:"P10",
                className:"p10",
                range:"0.5–10 μL"
              },
              {
                name:"P20",
                className:"p20",
                range:"2–20 μL"
              },
              {
                name:"P200",
                className:"p200",
                range:"20–200 μL"
              },
              {
                name:"P1000",
                className:"p1000",
                range:"100–1000 μL"
              }
            ].map(item=>`
              <button
                type="button"
                class="pipette ${item.className}"
                data-p="${item.name}"
                aria-label="選擇 ${item.name}"
              >
                <label>${item.name}</label>
                <span class="range">
                  ${item.range}
                </span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="controls">
          <div class="control-group">
            <span class="kicker">
              容量顯示窗
            </span>

            <div class="digit-controls">
              ${[0,1,2,3].map(index=>`
                <div class="digit">
                  <button
                    type="button"
                    data-i="${index}"
                    data-dir="1"
                    aria-label="增加第 ${index+1} 位數"
                  >
                    ▲
                  </button>

                  <span id="digit${index}">
                    0
                  </span>

                  <button
                    type="button"
                    data-i="${index}"
                    data-dir="-1"
                    aria-label="減少第 ${index+1} 位數"
                  >
                    ▼
                  </button>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="control-group">
            <span class="kicker">
              TIP 盒
            </span>

            <div class="tip-box">
              ${Array.from(
                {length:24},
                (_,index)=>`
                  <button
                    type="button"
                    class="tip-dot"
                    data-tip="${index}"
                    aria-label="安裝第 ${index+1} 個 tip"
                  ></button>
                `
              ).join("")}
            </div>

            <small id="tipStatus">
              尚未安裝 tip
            </small>
          </div>

          <div class="control-group pressure-pad">
            <span class="kicker">
              PLUNGER
            </span>

            <div class="tip-visual">
              <div
                id="tipFill"
                class="tip-fill"
              ></div>
            </div>

            <button
              type="button"
              id="plungerBtn"
              class="plunger"
            >
              按壓吸液
            </button>

            <small>
              再按一次即可排入 Tube B
            </small>
          </div>
        </div>
      `
    );

    const status=
      stage.querySelector(
        "#pipetteStatus"
      );

    const tipStatus=
      stage.querySelector(
        "#tipStatus"
      );

    const plungerButton=
      stage.querySelector(
        "#plungerBtn"
      );

    const tipFill=
      stage.querySelector(
        "#tipFill"
      );

    const currentVolume=()=>{
      return (
        digits[0]*1000+
        digits[1]*100+
        digits[2]*10+
        digits[3]
      );
    };

    stage
      .querySelectorAll(".pipette")
      .forEach(button=>{
        button.addEventListener(
          "click",
          ()=>{
            stage
              .querySelectorAll(".pipette")
              .forEach(item=>{
                item.classList.remove(
                  "selected"
                );
              });

            button.classList.add(
              "selected"
            );

            selected=
              button.dataset.p;

            status.textContent=
              `已選擇 ${selected}`;
          }
        );
      });

    stage
      .querySelectorAll(
        ".digit button"
      )
      .forEach(button=>{
        button.addEventListener(
          "click",
          ()=>{
            const index=
              Number(
                button.dataset.i
              );

            const direction=
              Number(
                button.dataset.dir
              );

            digits[index]=(
              digits[index]+
              direction+
              10
            )%10;

            stage.querySelector(
              `#digit${index}`
            ).textContent=
              digits[index];
          }
        );
      });

    stage
      .querySelectorAll(".tip-dot")
      .forEach(button=>{
        button.addEventListener(
          "click",
          ()=>{
            if(
              button.classList.contains(
                "used"
              )
            ){
              return;
            }

            stage
              .querySelectorAll(
                ".tip-dot"
              )
              .forEach(item=>{
                item.classList.remove(
                  "selected"
                );
              });

            button.classList.add(
              "used",
              "selected"
            );

            tipInstalled=true;

            tipStatus.textContent=
              "Tip 安裝完成";

            status.textContent=
              "Tip 安裝完成";
          }
        );
      });

    plungerButton.addEventListener(
      "click",
      ()=>{
        if(!selected){
          ctx.penalize(
            "safety",
            18,
            "請先選擇 pipette。"
          );
          return;
        }

        if(!tipInstalled){
          ctx.penalize(
            "safety",
            22,
            "請先安裝新的 tip。"
          );
          return;
        }

        if(!liquidLoaded){
          const numeric=
            currentVolume();

          if(!aspirationChecked){
            if(selected!==correct){
              ctx.penalize(
                "accuracy",
                18,
                `本題較適合使用 ${correct}。`
              );

              ctx.penalize(
                "sampleQuality",
                10,
                "使用不適當量程可能降低移液精準度。"
              );

              roundIssues.push(
                "Wrong pipette"
              );
            }

            if(numeric!==target){
              ctx.penalize(
                "accuracy",
                22,
                "吸取容量與任務不同。"
              );

              ctx.penalize(
                "sampleQuality",
                12,
                "錯誤容量可能影響樣本比例。"
              );

              roundIssues.push(
                "Wrong volume"
              );
            }

            aspirationChecked=true;
          }

          liquidLoaded=true;

          tipFill.style.height="65%";

          plungerButton.classList.add(
            "active"
          );

          status.textContent=
            `已吸取 ${numeric} μL，請再按一次排入 Tube B`;

          plungerButton.textContent=
            "按壓排液";

          return;
        }

        liquidLoaded=false;

        tipFill.style.height="0";

        plungerButton.classList.remove(
          "active"
        );

        status.textContent=
          "液體已排入 Tube B";

        plungerButton.textContent=
          "排液完成";

        plungerButton.disabled=true;

        this.finishRound(
          ctx,
          roundIssues
        );
      }
    );
  },

  serological(ctx){
    let volume=0;
    let overPenaltyApplied=false;

    const target=[
      5,
      10,
      15,
      20,
      25
    ][
      (
        ctx.config.level+
        ctx.config.roundIndex-
        5
      )%5
    ];

    const issues=[];

    ctx.stage.innerHTML=this.shell(
      "Serological Pipette 培養液轉移",
      `將培養液吸至 ${target} mL 刻度並排入 flask。`,
      `
        <div class="liquid-scene">
          <div class="tube">
            <div
              id="mediaLiquid"
              class="liquid"
              style="
                height:70%;
                background:
                  linear-gradient(
                    #f3b49f,
                    #e38871
                  );
              "
            ></div>
          </div>

          <div class="pressure-pad">
            <div
              class="tip-visual"
              style="
                height:220px;
                width:46px;
              "
            >
              <div
                id="seroFill"
                class="tip-fill"
              ></div>
            </div>

            <p>
              目前：
              <strong id="seroValue">
                0.0
              </strong>
              mL
            </p>

            <button
              id="aspirateBtn"
              class="btn btn-primary"
            >
              長按吸液
            </button>

            <button
              id="dispenseBtn"
              class="btn btn-soft"
            >
              排入 flask
            </button>
          </div>
        </div>
      `
    );

    const fill=
      ctx.stage.querySelector(
        "#seroFill"
      );

    const value=
      ctx.stage.querySelector(
        "#seroValue"
      );

    let timer;

    const start=()=>{
      timer=setInterval(
        ()=>{
          volume=Math.min(
            25,
            volume+.5
          );

          value.textContent=
            volume.toFixed(1);

          fill.style.height=
            `${
              Math.min(
                95,
                volume/25*100
              )
            }%`;

          if(
            volume>target+2&&
            !overPenaltyApplied
          ){
            ctx.penalize(
              "sampleQuality",
              12,
              "液體吸取超過指定刻度。"
            );

            issues.push(
              "Over-aspirated"
            );

            overPenaltyApplied=true;
          }
        },
        90
      );
    };

    const stop=()=>{
      clearInterval(timer);
    };

    const btn=
      ctx.stage.querySelector(
        "#aspirateBtn"
      );

    [
      "mousedown",
      "touchstart"
    ].forEach(eventName=>{
      btn.addEventListener(
        eventName,
        start
      );
    });

    [
      "mouseup",
      "mouseleave",
      "touchend"
    ].forEach(eventName=>{
      btn.addEventListener(
        eventName,
        stop
      );
    });

    ctx.stage.querySelector(
      "#dispenseBtn"
    ).onclick=()=>{
      stop();

      if(
        Math.abs(
          volume-target
        )>1
      ){
        ctx.penalize(
          "accuracy",
          24,
          "吸取體積不正確。"
        );

        issues.push(
          "Wrong volume"
        );
      }

      this.finishRound(
        ctx,
        issues
      );
    };
  },

  centrifuge(ctx){
  const randomInt=(min,max)=>{
    return Math.floor(
      Math.random()*(max-min+1)
    )+min;
  };

  const level=Number(
    ctx.config.level||8
  );

  const round=Number(
    ctx.config.roundIndex||1
  );

  /*
   * 不同關卡使用不同 rotor 孔數。
   */
  let holes=8;

  if(level>=11){
    holes=24;
  }else if(level>=10){
    holes=16;
  }else if(level>=9){
    holes=12;
  }

  /*
   * 控制每回合出現的離心管對數。
   */
  const maxPairs=
    holes===8
      ?3
      :holes===12
        ?4
        :holes===16
          ?6
          :8;

  const pairCount=Math.min(
    maxPairs,
    Math.max(
      1,
      round+
      Math.floor(
        (level-8)/2
      )
    )
  );

  const tubeCount=pairCount*2;

  const speedOptions=[
    1000,
    1500,
    2000,
    2500,
    3000
  ];

  const timeOptions=[
    3,
    5,
    7,
    10
  ];

  const targetSpeed=
    speedOptions[
      randomInt(
        0,
        speedOptions.length-1
      )
    ];

  const targetTime=
    timeOptions[
      randomInt(
        0,
        timeOptions.length-1
      )
    ];

  /*
   * 每兩支 tube 為一組，具有相同體積。
   *
   * Tube 1、2 為第一組
   * Tube 3、4 為第二組
   * Tube 5、6 為第三組
   */
  const tubes=[];

  for(
    let pair=0;
    pair<pairCount;
    pair++
  ){
    const volume=
      randomInt(
        1,
        20
      )*50;

    tubes.push(
      {
        id:pair*2+1,
        pair,
        volume
      },
      {
        id:pair*2+2,
        pair,
        volume
      }
    );
  }

  /*
   * 不再對 tubes 進行亂數洗牌。
   * 強制依照 Tube ID 由小到大排列。
   */
  const orderedTubes=[
    ...tubes
  ].sort(
    (a,b)=>a.id-b.id
  );

  let selectedTube=null;
  let spinning=false;

  const placements={};

  /*
   * 建立 rotor 孔位。
   * 第 1 孔從正上方開始，接著順時針排列。
   */
  const rotorHolesHtml=Array.from(
    {length:holes},
    (_,index)=>{
      const angle=
        Math.PI*
        2*
        index/
        holes-
        Math.PI/2;

      const radius=
        holes>=24
          ?43
          :holes>=16
            ?41
            :39;

      const left=
        50+
        Math.cos(angle)*
        radius;

      const top=
        50+
        Math.sin(angle)*
        radius;

      const rotation=
        360/
        holes*
        index+
        90;

      return `
        <button
          type="button"
          class="rotor-hole"
          data-hole="${index}"
          style="
            left:${left}%;
            top:${top}%;
            transform:
              translate(-50%,-50%)
              rotate(${rotation}deg);
          "
          aria-label="Rotor position ${index+1}"
        >
          <span
            style="
              transform:
                rotate(-${rotation}deg);
            "
          >
            ${index+1}
          </span>
        </button>
      `;
    }
  ).join("");

  /*
   * Tube 固定顯示為：
   * 1、2、3、4、5、6……
   */
  const tubeHtml=
    orderedTubes
      .map(tube=>`
        <button
          type="button"
          class="tube-token"
          data-tube="${tube.id}"
          data-pair="${tube.pair}"
          data-volume="${tube.volume}"
        >
          <strong>
            Tube ${tube.id}
          </strong>

          <span>
            ${tube.volume} μL
          </span>
        </button>
      `)
      .join("");

  ctx.stage.innerHTML=this.shell(
    "Centrifuge 配平",
    `將 ${tubeCount} 支 tube 全部放入 rotor，並設定本回合的離心條件。`,
    `
      <div class="centrifuge-wrap">
        <div>
          <div
            class="rotor rotor-${holes}"
            id="centrifugeRotor"
          >
            ${rotorHolesHtml}
          </div>
        </div>

        <div>
          <div
            class="bench-card"
            style="
              position:static;
              margin-bottom:12px;
            "
          >
            <span class="kicker">
              任務條件
            </span>

            <p>
              <strong>
                ${targetSpeed} ×g
              </strong>

              ／

              <strong>
                ${targetTime} min
              </strong>
            </p>

            <small>
              正對面的 tube 必須具有相同容量。
            </small>
          </div>

          <div
            class="tube-bank"
            style="
              display:flex;
              flex-direction:row;
              flex-wrap:wrap;
              direction:ltr;
            "
          >
            ${tubeHtml}
          </div>
        </div>
      </div>

      <div
        class="parameter-grid"
        style="margin-top:18px;"
      >
        <label>
          離心力

          <strong>
            <span id="gText">
              500
            </span>
            ×g
          </strong>

          <input
            id="gForce"
            type="range"
            min="500"
            max="3000"
            step="500"
            value="500"
          >
        </label>

        <label>
          時間

          <strong id="timeText">
            1 min
          </strong>

          <input
            id="spinTime"
            type="range"
            min="1"
            max="10"
            step="1"
            value="1"
          >
        </label>
      </div>

      <div class="controls">
        <button
          type="button"
          id="spinBtn"
          class="btn btn-primary btn-large"
        >
          啟動離心機
        </button>
      </div>
    `
  );

  const stage=ctx.stage;

  const rotor=
    stage.querySelector(
      "#centrifugeRotor"
    );

  const gForce=
    stage.querySelector(
      "#gForce"
    );

  const spinTime=
    stage.querySelector(
      "#spinTime"
    );

  const gText=
    stage.querySelector(
      "#gText"
    );

  const timeText=
    stage.querySelector(
      "#timeText"
    );

  const spinButton=
    stage.querySelector(
      "#spinBtn"
    );

  /*
   * 選擇離心管。
   */
  stage
    .querySelectorAll(
      ".tube-token"
    )
    .forEach(button=>{
      button.addEventListener(
        "click",
        ()=>{
          if(
            button.disabled||
            spinning
          ){
            return;
          }

          stage
            .querySelectorAll(
              ".tube-token"
            )
            .forEach(item=>{
              item.classList.remove(
                "selected"
              );
            });

          button.classList.add(
            "selected"
          );

          selectedTube=button;
        }
      );
    });

  /*
   * 將選取的離心管放進 rotor。
   */
  stage
    .querySelectorAll(
      ".rotor-hole"
    )
    .forEach(hole=>{
      hole.addEventListener(
        "click",
        ()=>{
          if(spinning){
            return;
          }

          if(!selectedTube){
            ctx.penalize(
              "safety",
              8,
              "請先選擇一支 tube。"
            );

            return;
          }

          if(
            hole.classList.contains(
              "filled"
            )
          ){
            return;
          }

          const position=
            Number(
              hole.dataset.hole
            );

          const tubeId=
            Number(
              selectedTube.dataset.tube
            );

          const pair=
            Number(
              selectedTube.dataset.pair
            );

          const volume=
            Number(
              selectedTube.dataset.volume
            );

          placements[position]={
            tubeId,
            pair,
            volume
          };

          hole.classList.add(
            "filled"
          );

          const rotation=
            360/
            holes*
            position+
            90;

          hole.innerHTML=`
            <strong
              style="
                transform:
                  rotate(-${rotation}deg);
              "
            >
              ${tubeId}
            </strong>
          `;

          hole.title=
            `Tube ${tubeId}：${volume} μL`;

          selectedTube.disabled=true;

          selectedTube.classList.remove(
            "selected"
          );

          selectedTube=null;
        }
      );
    });

  /*
   * 更新離心力文字。
   */
  gForce.addEventListener(
    "input",
    ()=>{
      gText.textContent=
        gForce.value;
    }
  );

  /*
   * 更新時間文字。
   */
  spinTime.addEventListener(
    "input",
    ()=>{
      timeText.textContent=
        `${spinTime.value} min`;
    }
  );

  /*
   * 啟動離心機並進行評分。
   */
  spinButton.addEventListener(
    "click",
    ()=>{
      if(spinning){
        return;
      }

      const positions=
        Object.keys(
          placements
        ).map(Number);

      /*
       * 所有 tube 都必須放進 rotor。
       * 未放完時不結束回合。
       */
      if(
        positions.length!==
        tubeCount
      ){
        ctx.penalize(
          "safety",
          12,
          "尚有 tube 未放入 rotor。"
        );

        return;
      }

      const issues=[];

      /*
       * 檢查每個位置的正對面是否存在
       * 相同容量的離心管。
       */
      const balanced=
        positions.every(
          position=>{
            const oppositePosition=
              (
                position+
                holes/2
              )%holes;

            const current=
              placements[position];

            const opposite=
              placements[
                oppositePosition
              ];

            return Boolean(
              opposite&&
              current.volume===
              opposite.volume
            );
          }
        );

      if(!balanced){
        ctx.penalize(
          "safety",
          45,
          "離心機未配平。"
        );

        issues.push(
          "Not balanced"
        );
      }

      if(
        Number(
          gForce.value
        )!==targetSpeed
      ){
        ctx.penalize(
          "sampleQuality",
          16,
          "離心速度設定錯誤。"
        );

        issues.push(
          "Wrong speed"
        );
      }

      if(
        Number(
          spinTime.value
        )!==targetTime
      ){
        ctx.penalize(
          "sampleQuality",
          16,
          "離心時間設定錯誤。"
        );

        issues.push(
          "Wrong time"
        );
      }

      spinning=true;
      spinButton.disabled=true;

      rotor.classList.add(
        "spinning"
      );

      setTimeout(
        ()=>{
          rotor.classList.remove(
            "spinning"
          );

          this.finishRound(
            ctx,
            issues
          );
        },
        1200
      );
    }
  );
},
  
  equipment(ctx){
    const events=[
      {
        title:"Vortex 混合",
        text:"Sample 需充分混合，但不可產生大量氣泡。",
        opts:[
          "混合 1 秒",
          "混合 5 秒",
          "持續混合 30 秒"
        ],
        good:1,
        fail:"Wrong mixing time"
      },
      {
        title:"Incubator 設定",
        text:"請為哺乳類細胞設定培養條件。",
        opts:[
          "25°C／0% CO₂",
          "37°C／5% CO₂",
          "42°C／10% CO₂"
        ],
        good:1,
        fail:"Wrong incubation condition"
      },
      {
        title:"設備工作站",
        text:"請選擇正確流程處理細胞樣本。",
        opts:[
          "顯微鏡 → Vortex → Incubator",
          "Vortex → Centrifuge → Microscope",
          "Centrifuge → 烘箱 → Freezer"
        ],
        good:1,
        fail:"Wrong equipment sequence"
      }
    ];

    const event=
      events[
        (
          ctx.config.roundIndex-1
        )%events.length
      ];

    ctx.stage.innerHTML=this.shell(
      event.title,
      event.text,
      `
        <div class="event-card">
          <div class="event-options">
            ${event.opts.map(
              (option,index)=>`
                <button
                  type="button"
                  data-i="${index}"
                >
                  ${option}
                </button>
              `
            ).join("")}
          </div>
        </div>
      `
    );

    const buttons=[
      ...ctx.stage.querySelectorAll(
        ".event-options button"
      )
    ];

    buttons.forEach(button=>{
      button.onclick=()=>{
        /*
         * 第一次作答後立即鎖定全部選項，
         * 不允許重複猜答案。
         */
        buttons.forEach(item=>{
          item.disabled=true;
        });

        const correct=
          Number(
            button.dataset.i
          )===event.good;

        button.classList.add(
          correct
            ?"answer-correct"
            :"answer-wrong"
        );

        if(!correct){
          const correctButton=
            buttons[event.good];

          if(correctButton){
            correctButton.classList.add(
              "answer-correct"
            );
          }

          ctx.penalize(
            "accuracy",
            35,
            "題目回答錯誤，已扣分並繼續下一回合。"
          );

          setTimeout(
            ()=>{
              this.finishRound(
                ctx,
                [event.fail]
              );
            },
            650
          );

          return;
        }

        setTimeout(
          ()=>{
            this.finishRound(
              ctx,
              []
            );
          },
          450
        );
      };
    });
  },

  plate(ctx){
    const targetCount=
      3+
      ctx.config.level-
      15;

    const targets=[];

    while(
      targets.length<
      targetCount
    ){
      const number=
        Math.floor(
          Math.random()*96
        );

      if(
        !targets.includes(
          number
        )
      ){
        targets.push(
          number
        );
      }
    }

    let done=0;

    ctx.stage.innerHTML=this.shell(
      "96-Well Plate 加樣",
      `請依照亮起的孔位完成 ${targetCount} 個 well。`,
      `
        <div class="plate-wrap">
          <div></div>

          <div>
            <div class="plate-labels-x">
              ${Array.from(
                {length:12},
                (_,index)=>`
                  <span class="plate-label">
                    ${index+1}
                  </span>
                `
              ).join("")}
            </div>

            <div class="well-plate">
              ${Array.from(
                {length:96},
                (_,index)=>`
                  <button
                    type="button"
                    class="well ${
                      targets.includes(index)
                        ?"target"
                        :""
                    }"
                    data-i="${index}"
                    aria-label="${
                      String.fromCharCode(
                        65+
                        Math.floor(
                          index/12
                        )
                      )
                    }${index%12+1}"
                  ></button>
                `
              ).join("")}
            </div>
          </div>
        </div>

        <p style="text-align:center">
          完成：
          <strong id="wellProgress">
            0
          </strong>
          /
          ${targetCount}
        </p>
      `
    );

    ctx.stage.querySelectorAll(".well").forEach(w=>w.onclick=()=>{
      if(w.classList.contains("filled"))return;
      if(targets.includes(+w.dataset.i)){w.classList.add("filled");done++;ctx.stage.querySelector("#wellProgress").textContent=done;if(done===targetCount)ctx.complete()}
      else{w.classList.add("wrong");ctx.penalize("accuracy",18,"加錯well，組別可能混淆。")}
    });
  },
  microscope(ctx){
    const issues=[];
    let coarseMoved=false;
    let fineMoved=false;
    let orderError=false;
    ctx.stage.innerHTML=this.shell(
      "Microscope 對焦與影像確認",
      "請先調整粗焦，再調整細焦，最後調整亮度並拍攝影像。",
      `<div class="microscope-stage"><div class="scope-view"><div id="cellField" class="cell-field"></div></div><div class="scope-controls">
        <label>亮度<input id="brightness" type="range" min="50" max="150" value="90"></label>
        <label>粗焦<input id="coarse" type="range" min="0" max="20" value="4"></label>
        <label>細焦<input id="fine" type="range" min="0" max="20" value="6"></label>
        <div id="focusOrder" class="notice">請先調整粗焦。</div>
        <button id="captureBtn" class="btn btn-primary">拍攝影像</button>
      </div></div>`
    );
    const field=ctx.stage.querySelector("#cellField");
    const brightness=ctx.stage.querySelector("#brightness");
    const coarse=ctx.stage.querySelector("#coarse");
    const fine=ctx.stage.querySelector("#fine");
    const focusOrder=ctx.stage.querySelector("#focusOrder");
    const update=()=>{
      const blur=Math.abs(+coarse.value-13)*.7+Math.abs(+fine.value-15)*.22;
      field.style.filter=`blur(${blur}px) brightness(${brightness.value/100})`;
    };
    coarse.oninput=()=>{
      coarseMoved=true;
      focusOrder.textContent="粗焦已調整，現在可進行細焦。";
      update();
    };
    fine.oninput=()=>{
      if(!coarseMoved&&!orderError){
        orderError=true;
        ctx.penalize("safety",18,"應先調整粗焦，再調整細焦。");
        issues.push("Wrong focus order");
      }
      fineMoved=true;
      focusOrder.textContent=coarseMoved?"正在調整細焦。":"Wrong focus order";
      update();
    };
    brightness.oninput=update;
    update();
    ctx.stage.querySelector("#captureBtn").onclick=()=>{
      const blur=Math.abs(+coarse.value-13)*.7+Math.abs(+fine.value-15)*.22;
      const b=+brightness.value;
      if(!coarseMoved){
        ctx.penalize("safety",16,"未調整粗焦。");
        issues.push("Coarse focus not adjusted");
      }
      if(!fineMoved){
        ctx.penalize("accuracy",16,"未調整細焦。");
        issues.push("Fine focus not adjusted");
      }
      if(blur>1.4){
        ctx.penalize("accuracy",24,"影像失焦，無法判讀細胞狀態。");
        issues.push("Image out of focus");
      }
      if(b<80||b>115){
        ctx.penalize("sampleQuality",18,"影像過暗或過曝。");
        issues.push("Wrong brightness");
      }
      this.finishRound(ctx,issues);
    };
  },

  labInspection(ctx){
    const level=Number(ctx.config.level);
    const scenes={
      18:{
        title:"實驗室安全巡查 I",
        description:"請點選所有不符合實驗室安全或設備使用規範的地方。",
        errors:{
          pipette:"Pipette placed horizontally",
          uv:"UV light left on",
          incubator:"Incubator door not closed",
          usedTip:"Used tip left on pipette",
          unlabeledTube:"Unlabeled tube"
        }
      },
      19:{
        title:"實驗室安全巡查 II",
        description:"請找出所有需要立即修正的實驗室錯誤。",
        errors:{
          centrifuge:"Centrifuge not balanced",
          waste:"Biohazard waste is full",
          hoodClutter:"Hood is cluttered",
          ethanol:"Ethanol bottle left open",
          reagent:"Cold reagent left on bench"
        }
      }
    };
    const scene=scenes[level]||scenes[18];
    const found=new Set();
    const required=Object.keys(scene.errors);
    const object=(id,label,error)=>`
      <button type="button" class="lab-object" data-error="${error?id:""}">
        <span>${label}</span>
      </button>`;

    ctx.stage.innerHTML=this.shell(scene.title,scene.description,`
      <div class="inspection-scene">
        <section class="inspection-zone">
          <strong>Biosafety Cabinet</strong>
          ${object("uv","UV Lamp",level===18)}
          ${object("hoodClutter","Supplies",level===19)}
          ${object("culture","Culture Dish",false)}
        </section>
        <section class="inspection-zone">
          <strong>Laboratory Bench</strong>
          ${object("pipette","Micropipette",level===18)}
          ${object("usedTip","Used Tip",level===18)}
          ${object("unlabeledTube","Sample Tube",level===18)}
          ${object("ethanol","Ethanol",level===19)}
          ${object("reagent","Cold Reagent",level===19)}
          ${object("rack","Tube Rack",false)}
        </section>
        <section class="inspection-zone">
          <strong>Equipment Area</strong>
          ${object("incubator","Incubator",level===18)}
          ${object("centrifuge","Centrifuge",level===19)}
          ${object("waste","Biohazard Waste",level===19)}
          ${object("freezer","Freezer",false)}
        </section>
      </div>
      <div class="inspection-footer">
        <strong>Found <span id="inspectionCount">0</span> / ${required.length}</strong>
        <button type="button" id="finishInspection" class="btn btn-primary btn-large">完成巡查</button>
      </div>
    `);

    ctx.stage.querySelectorAll(".lab-object").forEach(button=>{
      button.onclick=()=>{
        const id=button.dataset.error;
        if(!id){
          if(!button.classList.contains("wrong-selected")){
            button.classList.add("wrong-selected");
            ctx.penalize("accuracy",6,"此設備沒有明顯錯誤。");
          }
          return;
        }
        if(found.has(id))return;
        found.add(id);
        button.classList.add("found");
        ctx.stage.querySelector("#inspectionCount").textContent=found.size;
      };
    });

    ctx.stage.querySelector("#finishInspection").onclick=()=>{
      const missing=required.filter(id=>!found.has(id));
      if(missing.length){
        ctx.penalize("safety",Math.min(40,missing.length*8),"仍有實驗室錯誤未被發現。");
      }
      this.finishRound(ctx,missing.map(id=>scene.errors[id]));
    };
  }

};
