
let state=loadState(),active=null,scores={accuracy:100,sampleQuality:100,safety:100},lastReason="";
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
function configFor(level){return LEVELS.find(x=>x.level===level)}
function modeName(config){
  if(config.type==="training")return TRAINING_META[config.mode]?.name||config.mode;
  if(config.type==="future")return FUTURE_META[config.mode]?.name||config.mode;
  return "Boss Mission";
}
function renderMetrics(){updateRank(state);$("#currentLevelMetric").textContent=state.currentLevel;$("#unlockMetric").textContent=`${state.unlockedLevel} / 140`;$("#xpMetric").textContent=state.xp;$("#rankMetric").textContent=state.rank}
function renderMap(){
  const map=$("#levelMap");map.innerHTML="";
  LEVELS.forEach(c=>{const b=document.createElement("button");b.className="level-node";b.dataset.level=c.level;b.textContent=c.level;
    if(c.level<=state.unlockedLevel)b.classList.add("unlocked");else b.disabled=true;
    if(state.completed[c.level])b.classList.add("completed");if(c.level===state.currentLevel)b.classList.add("current");if(c.type==="boss"){b.classList.add("boss");const s=document.createElement("small");s.textContent=`${c.rounds}R`;b.appendChild(s)}
    b.onclick=()=>startLevel(c.level);map.appendChild(b);
  });
}
function showView(id){$$(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"})}
function resetScores(){scores={accuracy:100,sampleQuality:100,safety:100};lastReason="";updateScores()}
function updateScores(){[["accuracy","#accuracyMeter","#accuracyScore"],["sampleQuality","#qualityMeter","#qualityScore"],["safety","#safetyMeter","#safetyScore"]].forEach(([k,m,v])=>{const n=Math.round(scores[k]);$(m).style.width=`${n}%`;$(m).style.background=n>=75?"#2f8f83":n>=60?"#e6aa42":"#d86459";$(v).textContent=n})}
function penalize(stat,amount,reason){scores[stat]=Math.max(0,scores[stat]-amount);lastReason=reason;updateScores();if(Object.values(scores).some(v=>v<60))finish(false)}
function evaluation(){const min=Math.min(...Object.values(scores));return min>=95?"Perfect":min>=90?"Excellent":min>=75?"Good":"Pass"}
function complete(){finish(Object.values(scores).every(v=>v>=60))}
function failureText(){
 const map={pipette:"移液體積或tip操作錯誤，樣本濃度失準並可能交叉污染。",serological:"培養液轉移失敗，細胞缺乏養分或遭污染。",centrifuge:"離心機未平衡，設備劇烈震動並以卡通效果炸掉實驗室。",equipment:"設備或培養條件錯誤，細胞未能成功培養。",plate:"加錯well，control與treatment混淆，整盤資料報廢。",microscope:"影像失焦或過曝，未能辨識異常細胞。",boss:"綜合實驗失敗，Boss必須從第一回合重新開始。"};
 return `${map[active.mode]||"實驗失敗，樣本無法繼續使用。"} ${lastReason||""}`.trim();
}
function finish(pass){
 $("#modalIcon").textContent=pass?"🏆":active.mode==="centrifuge"?"💥":"🧫";$("#modalTitle").textContent=pass?evaluation():"實驗失敗";$("#modalMessage").textContent=pass?"Accuracy、Sample Quality、Safety皆達60，成功過關。":failureText();
 $("#modalScores").innerHTML=`<div>Accuracy<br><strong>${Math.round(scores.accuracy)}</strong></div><div>Quality<br><strong>${Math.round(scores.sampleQuality)}</strong></div><div>Safety<br><strong>${Math.round(scores.safety)}</strong></div>`;
 $("#nextBtn").classList.toggle("hidden",!pass);
 if(pass){state.completed[active.level]={...scores,evaluation:evaluation()};state.unlockedLevel=Math.min(140,Math.max(state.unlockedLevel,active.level+1));state.currentLevel=Math.min(140,active.level+1);state.xp+=active.type==="boss"?100:25;recordUsage(state,"writes",1);saveState(state)}
 $("#modal").classList.remove("hidden");
}
function startLevel(level){
 active=configFor(level);state.currentLevel=level;saveState(state);resetScores();
 $("#gameModeName").textContent=modeName(active);$("#gameLevelTitle").textContent=active.title;$("#bossTag").classList.toggle("hidden",active.type!=="boss");showView("#gameView");
 const ctx={config:active,stage:$("#gameStage"),complete,penalize};
 if(active.type==="training")TrainingGames.mount(ctx);else if(active.type==="future")FutureModes.mount(ctx);else BossEngine.mount(ctx);
}
function openDrawer(html){$("#drawerContent").innerHTML=html;$("#drawer").classList.remove("hidden")}
$("#continueBtn").onclick=()=>startLevel(state.currentLevel);
$("#mapBtn").onclick=()=>{renderMetrics();renderMap();showView("#homeView")};
$("#retryBtn").onclick=()=>{$("#modal").classList.add("hidden");startLevel(active.level)};
$("#nextBtn").onclick=()=>{$("#modal").classList.add("hidden");active.level<140?startLevel(active.level+1):(renderMap(),showView("#homeView"))};
$("#jumpCurrentBtn").onclick=()=>document.querySelector(`[data-level="${state.currentLevel}"]`)?.scrollIntoView({behavior:"smooth",block:"center"});
$("#usageBtn").onclick=()=>openDrawer(renderUsagePanel(state));
$("#howBtn").onclick=()=>openDrawer(`<span class="kicker">HOW TO PLAY</span><h2>遊戲架構</h2><ul><li>前20關：精緻儀器新人訓練。</li><li>第21關後：14種互動模式輪替。</li><li>每14關後一個Boss。</li><li>Accuracy、Sample Quality、Safety三項皆須達60。</li><li>遊客進度只存在目前瀏覽器工作階段。</li></ul>`);
$("#loginBtn").onclick=()=>openDrawer(`<span class="kicker">GOOGLE LOGIN</span><h2>Firebase尚未啟用</h2><p>此版本已保留登入按鈕與資料結構。建立Firebase專案後，把設定填入 <code>src/firebase-config.example.js</code> 即可進入下一步。</p>`);
$("#closeDrawerBtn").onclick=()=>$("#drawer").classList.add("hidden");
$("#drawer").onclick=e=>{if(e.target.id==="drawer")$("#drawer").classList.add("hidden")};
renderMetrics();renderMap();
