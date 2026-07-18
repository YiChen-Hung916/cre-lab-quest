let state=loadGuestState(),active=null,scores={accuracy:100,sampleQuality:100,safety:100},lastReason="",saveTimer=null;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
function configFor(level){return LEVELS.find(x=>x.level===level)}
function modeName(config){
  if(config.type==="training")return TRAINING_META[config.mode]?.name||config.mode;
  if(config.type==="future")return FUTURE_META[config.mode]?.name||config.mode;
  return "Boss Mission";
}
function completedCount(){return Object.keys(state.completed||{}).length}
function renderMetrics(){
  updateRank(state);
  $("#currentLevelMetric").textContent=state.currentLevel;
  $("#unlockMetric").textContent=completedCount();
  $("#xpMetric").textContent=state.xp;
  $("#rankMetric").textContent=state.rank;
}
function renderMap(){
  const map=$("#levelMap");map.innerHTML="";
  const visibleMax=state.developerMode?140:Math.min(140,state.unlockedLevel);
  LEVELS.filter(c=>c.level<=visibleMax).forEach(c=>{
    const b=document.createElement("button");b.className="level-node";b.dataset.level=c.level;b.textContent=c.level;
    const canOpen=state.developerMode||c.level<=state.unlockedLevel;
    if(canOpen)b.classList.add("unlocked");else b.disabled=true;
    if(state.completed[c.level])b.classList.add("completed");
    if(c.level===state.currentLevel)b.classList.add("current");
    if(c.type==="boss"){b.classList.add("boss");const tag=document.createElement("small");tag.textContent=`${c.rounds}R`;b.appendChild(tag)}
    b.onclick=()=>startLevel(c.level);map.appendChild(b);
  });
  if(!state.developerMode&&state.completed[140]){
    const coming=document.createElement("div");coming.className="coming-soon-card";
    coming.innerHTML="<span>TO BE CONTINUED</span><strong>COMING SOON</strong><small>新的研究任務正在準備中</small>";
    map.appendChild(coming);
  }
}
function showView(id){$$('.view').forEach(v=>v.classList.remove('active'));$(id).classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function resetScores(){scores={accuracy:100,sampleQuality:100,safety:100};lastReason=""}
function penalize(stat,amount,reason){scores[stat]=Math.max(0,scores[stat]-amount);lastReason=reason;showFeedback(reason)}
function showFeedback(text){
  let note=$("#operationFeedback");
  if(!note){note=document.createElement("div");note.id="operationFeedback";note.className="operation-feedback";$("#gameStage").prepend(note)}
  note.textContent=text;note.classList.add("show");setTimeout(()=>note?.classList.remove("show"),1800);
}
function averageScore(){return Math.round((scores.accuracy+scores.sampleQuality+scores.safety)/3)}
function evaluation(){const avg=averageScore();return avg>=90?"S — Outstanding":avg>=80?"A — Excellent":avg>=70?"B — Competent":"C — Passed"}
function complete(){finish(Object.values(scores).every(v=>v>=60))}
function failureText(){
 const map={pipette:"移液體積或tip操作錯誤，樣本濃度失準並可能交叉污染。",serological:"培養液轉移失敗，細胞缺乏養分或遭污染。",centrifuge:"離心機未平衡，設備與樣本受到影響。",equipment:"設備或培養條件錯誤，細胞未能成功培養。",plate:"加錯well，control與treatment可能混淆。",microscope:"影像失焦或過曝，未能辨識異常細胞。",boss:"綜合實驗失敗，Boss必須從第一回合重新開始。"};
 return `${map[active.mode]||"實驗失敗，樣本無法繼續使用。"} ${lastReason||""}`.trim();
}
async function persistState(){
  updateRank(state);
  if(AuthService.user){
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>AuthService.saveProgress(state).catch(console.error),300);
  }else saveGuestState(state);
}
function finish(pass){
  $("#modalIcon").textContent=pass?"🏆":active.mode==="centrifuge"?"💥":"🧫";
  $("#modalTitle").textContent=pass?evaluation():"MISSION FAILED";
  $("#modalMessage").textContent=pass?"三項評分皆達到通關標準。":failureText();
  $("#modalScores").innerHTML=`<div>Accuracy<br><strong>${Math.round(scores.accuracy)}</strong></div><div>Sample Quality<br><strong>${Math.round(scores.sampleQuality)}</strong></div><div>Safety<br><strong>${Math.round(scores.safety)}</strong></div><div class="overall-score">Overall<br><strong>${averageScore()}</strong></div>`;
  $("#nextBtn").classList.toggle("hidden",!pass);
  if(pass){
    const previous=state.completed[active.level];
    state.completed[active.level]={...scores,average:averageScore(),evaluation:evaluation()};
    state.unlockedLevel=Math.min(140,Math.max(state.unlockedLevel,active.level+1));
    state.currentLevel=Math.min(140,active.level+1);
    if(!previous)state.xp+=active.type==="boss"?100:25;
    recordUsage(state,"writes",1);persistState();
  }
  $("#modal").classList.remove("hidden");
}
function startLevel(level){
  active=configFor(level);if(!active)return;
  state.currentLevel=level;persistState();resetScores();
  $("#gameModeName").textContent=modeName(active);$("#gameLevelTitle").textContent=active.title;$("#bossTag").classList.toggle("hidden",active.type!=="boss");showView("#gameView");
  const ctx={config:active,stage:$("#gameStage"),complete,penalize};
  if(active.type==="training")TrainingGames.mount(ctx);else if(active.type==="future")FutureModes.mount(ctx);else BossEngine.mount(ctx);
}
function openDrawer(html){$("#drawerContent").innerHTML=html;$("#drawer").classList.remove("hidden")}
function accountPanel(){
  if(!AuthService.configured)return `<span class="kicker">ACCOUNT</span><h2>Firebase尚未設定</h2><p>目前使用遊客模式，進度保存在這台裝置。請依壓縮檔內的 <code>FIREBASE-SETUP.md</code> 完成免費Firebase設定。</p>`;
  if(!AuthService.user)return `<span class="kicker">GUEST MODE</span><h2>遊客模式</h2><p>進度只保存在這台裝置。登入Google帳號後，可跨裝置同步遊戲進度。</p><button id="googleLoginAction" class="btn btn-primary">使用Google登入</button>`;
  return `<span class="kicker">SIGNED IN</span><h2>${AuthService.user.displayName||"Researcher"}</h2><p>${AuthService.user.email||""}</p><p>遊戲進度已同步至Firebase。</p>${AuthService.isAdmin?`<div class="notice"><strong>開發者帳號</strong><p>你可以顯示全部關卡進行測試。</p><button id="developerToggle" class="btn btn-primary">${state.developerMode?"關閉開發者模式":"啟用開發者模式"}</button></div>`:""}<button id="logoutAction" class="btn btn-soft">登出</button>`;
}
function bindAccountActions(){
  $("#googleLoginAction")?.addEventListener("click",async()=>{try{await AuthService.signIn();location.reload()}catch(error){openDrawer(`<h2>登入失敗</h2><p>${error.message}</p>`)}});
  $("#logoutAction")?.addEventListener("click",async()=>{await AuthService.signOut();state=loadGuestState();location.reload()});
  $("#developerToggle")?.addEventListener("click",()=>{
  state.developerMode = !state.developerMode;
  renderMap();
  renderMetrics();
  updateAccountButton();
  $("#drawer").classList.add("hidden");
  });
}
function updateAccountButton(){
  $("#loginBtn").textContent =
    state.developerMode
      ? "開發者模式"
      : AuthService.user
        ? "已登入"
        : "遊客模式";
  // 只有管理員已啟用開發者模式時，才顯示 Spark 用量
  $("#usageBtn").classList.toggle(
    "hidden",
    !(AuthService.isAdmin && state.developerMode)
  );
}
async function bootstrap(){
  const auth=await AuthService.init();
  if(auth.user){
    const cloud=await AuthService.loadProgress().catch(()=>null);
    state=mergeProgress(loadGuestState(),cloud);state.guest=false;
    await AuthService.saveProgress(state).catch(console.error);
  }else{state=loadGuestState();state.guest=true}
  updateAccountButton();renderMetrics();renderMap();
}
$("#continueBtn").onclick=()=>startLevel(state.currentLevel);
$("#mapBtn").onclick=()=>{renderMetrics();renderMap();showView("#homeView")};
$("#resultMapBtn").onclick = () => {
  $("#modal").classList.add("hidden");
  active = null;
  renderMetrics();
  renderMap();
  showView("#homeView");
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};
$("#retryBtn").onclick=()=>{$("#modal").classList.add("hidden");startLevel(active.level)};
$("#nextBtn").onclick=()=>{$("#modal").classList.add("hidden");if(active.level<140)startLevel(active.level+1);else{renderMap();renderMetrics();showView("#homeView");openDrawer(`<span class="kicker">TO BE CONTINUED</span><h2>COMING SOON</h2><p>你已完成目前所有研究任務。新的關卡將於後續版本加入。</p>`)}};
$("#jumpCurrentBtn").onclick=()=>document.querySelector(`[data-level="${state.currentLevel}"]`)?.scrollIntoView({behavior:"smooth",block:"center"});
$("#usageBtn").onclick=()=>{
  if (!(AuthService.isAdmin && state.developerMode)) return;
  openDrawer(renderUsagePanel(state));
};
$("#howBtn").onclick=()=>openDrawer(`<span class="kicker">HOW TO PLAY</span><h2>遊戲方式與通關條件</h2><ul><li>關卡地圖只顯示已完成關卡與下一個待挑戰關卡。</li><li>儀器訓練每關包含3–5個回合，整關完成後才結算。</li><li>系統會依Accuracy、Sample Quality及Safety評分。</li><li>遊戲進行中不顯示分數；結果畫面才會公布。</li><li>三項分數皆須達60才能通關。</li><li>遊客進度保存在目前裝置；登入後可同步至雲端。</li></ul>`);
$("#loginBtn").onclick=()=>{openDrawer(accountPanel());bindAccountActions()};
$("#closeDrawerBtn").onclick=()=>$("#drawer").classList.add("hidden");
$("#drawer").onclick=e=>{if(e.target.id==="drawer")$("#drawer").classList.add("hidden")};
document.addEventListener("click", event => {
  const resultMapButton = event.target.closest("#resultMapBtn");
  if (!resultMapButton) return;
  event.preventDefault();
  event.stopPropagation();
  $("#modal").classList.add("hidden");
  renderMetrics();
  renderMap();
  showView("#homeView");
});
bootstrap();
