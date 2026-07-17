
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
  pipette(ctx){
    const targets=[5,10,18,20,50,75,100,150,200,500,800], target=targets[(ctx.config.level+ctx.config.roundIndex*2-3)%targets.length];
    const correct=target<=10?"P10":target<=20?"P20":target<=200?"P200":"P1000";
    let selected=null,digits=[0,0,0],tip=false,liquid=false;
    const stage=ctx.stage;
    stage.innerHTML=this.shell("Micropipette 精準移液",`請選擇正確pipette並吸取 ${target} μL。`,
    `<div class="lab-bench">
      <div class="bench-card task-card"><strong>任務</strong><p>${target} μL → Tube B</p><small>建議量程：${correct}</small></div>
      <div class="bench-card status-card"><strong>操作狀態</strong><p id="pipetteStatus">尚未選擇pipette</p></div>
      <div class="pipette-rack">
        ${["P10","P20","P200","P1000"].map(p=>`<button class="pipette ${p.toLowerCase()}" data-p="${p}"><label>${p}</label><span class="range">${p==="P10"?"0.5–10":p==="P20"?"2–20":p==="P200"?"20–200":"100–1000"} μL</span></button>`).join("")}
      </div>
    </div>
    <div class="controls">
      <div class="control-group"><strong>容量顯示窗</strong><div class="digit-controls">
        ${[0,1,2].map(i=>`<div class="digit"><button data-dir="1" data-i="${i}">▲</button><span id="digit${i}">0</span><button data-dir="-1" data-i="${i}">▼</button></div>`).join("")}
      </div></div>
      <div class="control-group"><strong>Tip盒</strong><div class="tip-box">${Array.from({length:24},(_,i)=>`<button class="tip-dot" data-tip="${i}"></button>`).join("")}</div></div>
    </div>
    <div class="liquid-scene">
      <div><div class="tip-visual"><div id="tipFill" class="tip-fill"></div></div><p style="text-align:center">Tip內液體</p></div>
      <div class="pressure-pad"><button id="plungerBtn" class="plunger">按壓吸液／排液</button><small>選對pipette、容量與tip後操作</small></div>
    </div>`);
    const status=stage.querySelector("#pipetteStatus");
    stage.querySelectorAll(".pipette").forEach(btn=>btn.onclick=()=>{
      stage.querySelectorAll(".pipette").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected");selected=btn.dataset.p;
      status.textContent=`已選擇 ${selected}`;
      if(selected!==correct)ctx.penalize("accuracy",18,"選擇了不適合的量程。");
    });
    stage.querySelectorAll(".digit button").forEach(btn=>btn.onclick=()=>{
      const i=+btn.dataset.i,dir=+btn.dataset.dir;digits[i]=(digits[i]+dir+10)%10;stage.querySelector(`#digit${i}`).textContent=digits[i];
    });
    stage.querySelectorAll(".tip-dot").forEach(btn=>btn.onclick=()=>{
      if(btn.classList.contains("used"))return;stage.querySelectorAll(".tip-dot").forEach(x=>x.classList.remove("selected"));btn.classList.add("used");tip=true;status.textContent="Tip安裝完成";
    });
    stage.querySelector("#plungerBtn").onclick=()=>{
      const numeric=digits[0]*100+digits[1]*10+digits[2];
      const expected=target;
      if(!selected||!tip){ctx.penalize("safety",22,"未正確安裝pipette或tip。");return}
      const tolerance=selected==="P1000"?10:2;
      if(Math.abs(numeric-expected)>tolerance){ctx.penalize("accuracy",22,"容量設定與任務不符。");return}
      liquid=!liquid;
      stage.querySelector("#tipFill").style.height=liquid?"65%":"0";
      status.textContent=liquid?"已吸取液體，再按一次排入Tube B":"排液完成";
      if(!liquid)ctx.complete();
    };
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
    const count=Math.min(8,2+Math.floor((ctx.config.level-9)*2));
    let selectedTube=null,placements={};
    const holes=8;
    ctx.stage.innerHTML=this.shell("Centrifuge 配平",`將 ${count} 支tube放入可平衡的位置，再啟動離心機。`,
    `<div class="centrifuge-wrap"><div id="rotor" class="rotor">${Array.from({length:holes},(_,i)=>`<button class="rotor-hole" data-hole="${i}" style="left:${50+38*Math.cos((i/holes)*Math.PI*2-Math.PI/2)}%;top:${50+38*Math.sin((i/holes)*Math.PI*2-Math.PI/2)}%;transform:translate(-50%,-50%) rotate(${i/holes*360}deg)">${i+1}</button>`).join("")}</div>
    <div><div class="tube-bank">${Array.from({length:count},(_,i)=>`<button class="tube-token" data-tube="${i}">Tube ${i+1}<br><small>${i%2?500:500} μL</small></button>`).join("")}</div>
    <div class="parameter-grid" style="margin-top:14px"><label>×g<input id="gForce" type="range" min="500" max="3000" step="100" value="1500"><span id="gText">1500</span></label><label>時間<input id="spinTime" type="range" min="1" max="10" value="5"><span id="timeText">5 min</span></label></div>
    <button id="spinBtn" class="btn btn-primary" style="width:100%;margin-top:12px">啟動離心機</button></div></div>`);
    ctx.stage.querySelectorAll(".tube-token").forEach(b=>b.onclick=()=>{ctx.stage.querySelectorAll(".tube-token").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");selectedTube=b});
    ctx.stage.querySelectorAll(".rotor-hole").forEach(h=>h.onclick=()=>{if(!selectedTube||h.classList.contains("filled"))return;h.classList.add("filled");h.textContent="Tube";placements[h.dataset.hole]=selectedTube.dataset.tube;selectedTube.disabled=true;selectedTube.classList.remove("selected");selectedTube=null});
    const g=ctx.stage.querySelector("#gForce"),t=ctx.stage.querySelector("#spinTime");g.oninput=()=>ctx.stage.querySelector("#gText").textContent=g.value;t.oninput=()=>ctx.stage.querySelector("#timeText").textContent=`${t.value} min`;
    ctx.stage.querySelector("#spinBtn").onclick=()=>{
      const positions=Object.keys(placements).map(Number);
      if(positions.length!==count){ctx.penalize("safety",32,"尚有tube未放入rotor。");return}
      const balanced=positions.every(p=>positions.includes((p+holes/2)%holes));
      if(!balanced){ctx.penalize("safety",45,"離心機未配平，設備劇烈震動。");return}
      if(+g.value<1000||+t.value<3){ctx.penalize("sampleQuality",22,"離心條件不足，pellet未形成。");return}
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
