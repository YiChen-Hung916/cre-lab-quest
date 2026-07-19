const FUTURE_MODE_IDS=[
  "dnaBubble",
  "cellDefender",
  "cancerRunner",
  "boneDefense",
  "pdoMerge",
  "pdoTycoon",
  "microscopeHunt",
  "westernBlotDetective",
  "proteinRhythm",
  "arSequence",
  "immuneMaze",
  "drugPuzzle",
  "invasionMaze",
  "labCrisis"
];

function isBossLevel(level){
  if(level===20)return true;
  if(level<21)return false;
  return (level-20)%15===0;
}

function bossRounds(level){
  if(level<=80)return 3;
  if(level<=110)return 4;
  return 5;
}

function trainingMode(level){
  if(level<=4){
    return "pipette";
  }
  if(level<=7){
    return "serological";
  }
  if(level<=11){
    return "centrifuge";
  }
  /*
   * Question Bank
   * 12 Lab Knowledge
   * 13 Storage
   * 14 Solution Preparation
   */
  if(level<=14){
    return "equipment";
  }
  /*
   * Plate
   */
  if(level<=17){
    return "plate";
  }
  /*
   * Microscope
   */
  if(level<=19){
    return "microscope";
  }
  /*
  * Level 20 Boss
  */
  if(level===20){
  return "boss20";
  }
  return "boss";
}

function seededShuffle(array,seed){
  let a=[...array],x=seed*1103515245+12345;

  const rnd=()=>{
    x=(x*1664525+1013904223)%4294967296;
    return x/4294967296;
  };

  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }

  return a;
}

function buildLevels(){
  const out=[];
  const cycleOrders={};

  for(let level=1;level<=140;level++){
    if(level<=20){
      out.push({
        level,
        type:"training",
        mode:trainingMode(level),
        title:
        level===20
        ?"Boss Mission：Complete Medium"
        :
        level<=4
        ?"Micropipette Training"
        :
        level<=7
        ?"Serological Pipette"
        :
        level<=11
        ?"Centrifuge Training"
        :
        level===12
        ?"Lab Knowledge"
        :
        level===13
        ?"Reagent Storage"
        :
        level===14
        ?"Solution Preparation"
        :
        level<=17
        ?"96-Well Plate"
        :
        level<=19
        ?"Microscope Training"
        :
        `新人訓練 ${level}`,
        difficulty:Math.ceil(level/4),
        rounds:level===20?5:0
      });

      continue;
    }

    if(isBossLevel(level)){
      out.push({
        level,
        type:"boss",
        mode:"boss",
        title:`綜合Boss ${Math.ceil((level-20)/15)}`,
        difficulty:1+Math.floor((level-21)/15),
        rounds:bossRounds(level)
      });

      continue;
    }

    const cycle=Math.floor((level-21)/15);

    if(!cycleOrders[cycle]){
      cycleOrders[cycle]=seededShuffle(
        FUTURE_MODE_IDS,
        cycle+73
      );
    }

    const pos=(level-21)%15;

    out.push({
      level,
      type:"future",
      mode:cycleOrders[cycle][Math.min(pos,13)],
      title:`Level ${level}`,
      difficulty:1+cycle,
      rounds:0
    });
  }

  return out;
}

const LEVELS=buildLevels();
