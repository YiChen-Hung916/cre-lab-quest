const GUEST_STATE_KEY="creLabQuestGuestStateV3";
const DEFAULT_STATE={
  unlockedLevel:1,currentLevel:1,completed:{},xp:0,rank:"Lab Visitor",
  guest:true,developerMode:false,
  usage:{reads:0,writes:0,logins:0,lastReset:new Date().toISOString().slice(0,10)}
};
function cloneDefault(){return JSON.parse(JSON.stringify(DEFAULT_STATE))}
function normalizeState(value={}){
  const merged={...cloneDefault(),...value};
  merged.completed=value.completed&&typeof value.completed==="object"?value.completed:{};
  merged.usage={...cloneDefault().usage,...(value.usage||{})};
  merged.unlockedLevel=Math.max(1,Math.min(140,Number(merged.unlockedLevel)||1));
  merged.currentLevel=Math.max(1,Math.min(140,Number(merged.currentLevel)||1));
  merged.developerMode=false;
  return merged;
}
function loadGuestState(){
  try{
    const saved=localStorage.getItem(GUEST_STATE_KEY);
    if(saved)return normalizeState(JSON.parse(saved));
    const legacy=sessionStorage.getItem("creLabQuestSessionV2");
    if(legacy){const migrated=normalizeState(JSON.parse(legacy));saveGuestState(migrated);return migrated}
    return cloneDefault();
  }catch{return cloneDefault()}
}
function saveGuestState(state){
  const safe=normalizeState({...state,guest:true});
  localStorage.setItem(GUEST_STATE_KEY,JSON.stringify(safe));
}
function mergeProgress(localState,cloudState){
  const a=normalizeState(localState),b=normalizeState(cloudState||{});
  const completed={...a.completed,...b.completed};
  for(const [level,result] of Object.entries(a.completed||{})){
    const cloudResult=b.completed?.[level];
    if(!cloudResult||Number(result.average||0)>Number(cloudResult.average||0))completed[level]=result;
  }
  return normalizeState({
    ...b,
    completed,
    unlockedLevel:Math.max(a.unlockedLevel,b.unlockedLevel),
    currentLevel:Math.max(a.currentLevel,b.currentLevel),
    xp:Math.max(a.xp,b.xp),
    guest:false
  });
}
function updateRank(state){
  const ranks=[[0,"Lab Visitor"],[200,"Intern"],[600,"Junior Researcher"],[1200,"Research Assistant"],[2200,"Senior Research Assistant"],[3500,"Scientist"],[5200,"Senior Scientist"],[7500,"Principal Investigator"]];
  state.rank=ranks.reduce((r,[xp,name])=>state.xp>=xp?name:r,"Lab Visitor");
}
