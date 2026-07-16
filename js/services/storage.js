
const SESSION_KEY="creLabQuestSessionV2";
const DEFAULT_STATE={unlockedLevel:1,currentLevel:1,completed:{},xp:0,rank:"Lab Visitor",guest:true,usage:{reads:0,writes:0,logins:0,lastReset:new Date().toISOString().slice(0,10)}};
function loadState(){try{const raw=sessionStorage.getItem(SESSION_KEY);return raw?{...DEFAULT_STATE,...JSON.parse(raw)}:structuredClone(DEFAULT_STATE)}catch{return structuredClone(DEFAULT_STATE)}}
function saveState(state){sessionStorage.setItem(SESSION_KEY,JSON.stringify(state))}
function clearState(){sessionStorage.removeItem(SESSION_KEY)}
function updateRank(state){
  const ranks=[[0,"Lab Visitor"],[200,"Intern"],[600,"Junior Researcher"],[1200,"Research Assistant"],[2200,"Senior Research Assistant"],[3500,"Scientist"],[5200,"Senior Scientist"],[7500,"Principal Investigator"]];
  state.rank=ranks.reduce((r,[xp,name])=>state.xp>=xp?name:r,"Lab Visitor");
}
