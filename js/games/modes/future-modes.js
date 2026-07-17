
const FUTURE_META={
 dnaBubble:{name:"AR-DNA Bubble Shooter",icon:"🧬"},
 cellDefender:{name:"Prostate Cell Defender",icon:"🛡️"},
 cancerRunner:{name:"Cancer Runner",icon:"🏃"},
 boneDefense:{name:"Bone Metastasis Defense",icon:"🦴"},
 pdoMerge:{name:"Prostate PDO Merge",icon:"🧫"},
 pdoTycoon:{name:"Prostate PDO Lab Tycoon",icon:"🏭"},
 microscopeHunt:{name:"Prostate Cell Microscope Hunt",icon:"🔬"},
 westernBlotDetective:{name:"Cancer Western Blot Detective",icon:"🧪"},
 proteinRhythm:{name:"Cancer Protein Rhythm",icon:"🎵"},
 arSequence:{name:"AR Sequence Conveyor",icon:"🧬"},
 immuneMaze:{name:"Immune Cell Infiltration Maze",icon:"🧠"},
 drugPuzzle:{name:"Personalized Drug Combination",icon:"💊"},
 invasionMaze:{name:"Prostate Cancer Invasion Maze",icon:"🧩"},
 labCrisis:{name:"Prostate Lab Escape & Crisis",icon:"🚨"}
};
const FutureModes={
  mount(ctx){
    const meta=FUTURE_META[ctx.config.mode];
    ctx.stage.innerHTML=`<div class="game-shell"><div class="game-instructions"><div style="font-size:3rem">${meta.icon}</div><h3>${meta.name}</h3><p>此模式的正式核心玩法將在下一階段加入；目前已完成關卡、數值與Boss掛載接口。</p></div>
      <div class="event-card"><strong>模式接口測試</strong><p>按下完成可驗證過關、解鎖與存檔流程。</p><div class="controls"><button id="futurePass" class="btn btn-primary">完成模式測試</button><button id="futureFail" class="btn btn-soft">模擬失誤</button></div></div></div>`;
    ctx.stage.querySelector("#futurePass").onclick=ctx.complete;
    ctx.stage.querySelector("#futureFail").onclick=()=>ctx.penalize("accuracy",45,"模式測試發生錯誤。");
  }
};
