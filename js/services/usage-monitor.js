
const SPARK_LIMITS={reads:50000,writes:20000,deletes:20000,storageMB:1024};
function resetUsageIfNeeded(state){
  const today=new Date().toISOString().slice(0,10);
  if(state.usage.lastReset!==today)state.usage={reads:0,writes:0,logins:0,lastReset:today};
}
function recordUsage(state,type,count=1){
  resetUsageIfNeeded(state);
  if(type in state.usage)state.usage[type]+=count;
}
function usagePercent(value,limit){return Math.min(100,Math.round(value/limit*1000)/10)}
function renderUsagePanel(state){
  resetUsageIfNeeded(state);
  const r=usagePercent(state.usage.reads,SPARK_LIMITS.reads),w=usagePercent(state.usage.writes,SPARK_LIMITS.writes);
  return `<span class="kicker">SPARK SAFETY</span><h2>Firebase免費額度保險面板</h2>
  <p>目前為本機估算值。正式串接Firebase後，每次登入、讀檔與存檔都由程式同步累計。</p>
  <div class="usage-grid">
    <div class="usage-box"><strong>估算讀取</strong><p>${state.usage.reads.toLocaleString()} / ${SPARK_LIMITS.reads.toLocaleString()} 次／日</p><div class="usage-track"><i style="width:${r}%"></i></div><small>${r}%</small></div>
    <div class="usage-box"><strong>估算寫入</strong><p>${state.usage.writes.toLocaleString()} / ${SPARK_LIMITS.writes.toLocaleString()} 次／日</p><div class="usage-track"><i style="width:${w}%"></i></div><small>${w}%</small></div>
  </div>
  <div class="notice"><strong>硬性保險：</strong>維持Firebase Spark方案、不綁Billing Account，超過免費額度時服務會受限，但不會自動扣款。</div>
  <h3>程式節流原則</h3><ul><li>登入時只讀取一次玩家資料。</li><li>只在過關、抽獎或設定變更時寫入。</li><li>遊戲中的每次點擊、拖曳與即時分數不寫入Firestore。</li><li>圖片、關卡內容、Labpedia全部放GitHub Pages。</li></ul>`;
}
