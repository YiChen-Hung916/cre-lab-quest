
const BossEngine={
  mount(ctx){
    const count=ctx.config.rounds;
    const trainingPool=["pipette","centrifuge","plate","microscope"];
    const futurePool=seededShuffle(FUTURE_MODE_IDS,ctx.config.level+Date.now());
    const modes=[];
    if(ctx.config.level===20)modes.push("pipette","centrifuge","microscope");
    else{
      modes.push(trainingPool[ctx.config.level%trainingPool.length]);
      if(count>=4)modes.push(trainingPool[(ctx.config.level+1)%trainingPool.length]);
      modes.push(...futurePool.slice(0,count-modes.length));
    }
    let round=0;
    const render=()=>{
      if(round>=count){ctx.complete();return}
      ctx.stage.innerHTML=`<div class="game-shell"><div class="game-instructions"><span class="kicker">BOSS ROUND ${round+1}/${count}</span><h3>${modes[round]}</h3><p>Boss無檢查點。完成所有回合才可過關。</p></div>
      <div class="controls">${Array.from({length:count},(_,i)=>`<span class="boss-tag" style="background:${i<round?"#2f8f83":i===round?"#e6aa42":"#c8d6dc"}">${i+1}</span>`).join("")}</div>
      <div class="event-card"><p>此骨架先驗證回合流程；正式版會直接掛載對應遊戲。</p><div class="controls"><button id="bossPass" class="btn btn-primary">完成本回合</button><button id="bossFail" class="btn btn-soft">模擬重大事故</button></div></div></div>`;
      ctx.stage.querySelector("#bossPass").onclick=()=>{round++;render()};
      ctx.stage.querySelector("#bossFail").onclick=()=>ctx.penalize("safety",45,"Boss回合發生重大事故，必須從第一回合重新開始。");
    };
    render();
  }
};
