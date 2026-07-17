const AuthService=(()=>{
  let app=null,auth=null,db=null,user=null,isAdmin=false,ready=false;
  const configured=()=>typeof firebaseConfig!=="undefined"&&firebaseConfig.apiKey&&!String(firebaseConfig.apiKey).startsWith("YOUR_");
  function init(){
    if(!configured()||typeof firebase==="undefined"){
      ready=true;
      return Promise.resolve({user:null,isAdmin:false,configured:false});
    }
    try{
      app=firebase.apps.length?firebase.app():firebase.initializeApp(firebaseConfig);
      auth=firebase.auth();db=firebase.firestore();
      return new Promise(resolve=>auth.onAuthStateChanged(async current=>{
        user=current;isAdmin=false;
        if(user){
          try{isAdmin=(await db.collection("admins").doc(user.uid).get()).exists}catch(error){console.warn("Admin check failed",error)}
        }
        ready=true;resolve({user,isAdmin,configured:true});
      }));
    }catch(error){console.error("Firebase initialization failed",error);ready=true;return Promise.resolve({user:null,isAdmin:false,configured:false,error})}
  }
  async function signIn(){
    if(!auth)throw new Error("Firebase尚未完成設定");
    const provider=new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    return auth.signInWithPopup(provider);
  }
  async function signOut(){if(auth)await auth.signOut();user=null;isAdmin=false}
  async function loadProgress(){
    if(!user||!db)return null;
    const snap=await db.collection("users").doc(user.uid).get();
    return snap.exists?snap.data():null;
  }
  async function saveProgress(state){
    if(!user||!db)return;
    const payload={
      unlockedLevel:state.unlockedLevel,currentLevel:state.currentLevel,completed:state.completed,
      xp:state.xp,rank:state.rank,settings:state.settings||{},dailyReward:state.dailyReward||null,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("users").doc(user.uid).set(payload,{merge:true});
  }
  return {init,signIn,signOut,loadProgress,saveProgress,get user(){return user},get isAdmin(){return isAdmin},get configured(){return configured()},get ready(){return ready}};
})();
