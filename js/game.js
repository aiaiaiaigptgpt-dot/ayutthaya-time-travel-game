const startScreen=document.getElementById('start-screen');
const gameScreen=document.getElementById('game-screen');
const startBtn=document.getElementById('start-btn');
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const objective=document.getElementById('objective');
const interactionPrompt=document.getElementById('interaction-prompt');
const dialogueBox=document.getElementById('dialogue-box');
const speakerEl=document.getElementById('speaker');
const dialogueText=document.getElementById('dialogue-text');
const dialogueNextBtn=document.getElementById('dialogue-next-btn');
const leftBtn=document.getElementById('left-btn');
const rightBtn=document.getElementById('right-btn');
const interactBtn=document.getElementById('interact-btn');

const backgrounds={
  school:new Image(),
  road:new Image(),
  coin:new Image(),
  farm:new Image()
};
backgrounds.school.src='intro-school.png';
backgrounds.road.src='intro-road.png';
backgrounds.coin.src='pod-duang.png';
backgrounds.farm.src='stage1-farm.png';

const studentSheet=new Image();
studentSheet.src='Male student .png';

const walkFrames=[
  {x:500,y:330,w:95,h:120},
  {x:600,y:330,w:95,h:120},
  {x:700,y:330,w:95,h:120},
  {x:800,y:330,w:95,h:120},
  {x:900,y:330,w:95,h:120},
  {x:1000,y:330,w:95,h:120}
];
const idleFrame={x:330,y:170,w:95,h:120};

const scenes=[
  {id:'school',bg:backgrounds.school,objective:'เดินไปทางขวาเพื่อกลับบ้าน',groundY:610,exitAt:1120},
  {id:'road',bg:backgrounds.road,objective:'เดินต่อไปตามทาง',groundY:610,exitAt:1120},
  {id:'coin',bg:backgrounds.coin,objective:'สำรวจสิ่งผิดปกติบนพื้น',groundY:610,interactionX:760},
  {id:'farm',bg:backgrounds.farm,objective:'ลองเดินสำรวจพื้นที่รอบ ๆ',groundY:610}
];

let sceneIndex=0;
let last=0;
let animTime=0;
let dialogueIndex=0;
let dialogueOpen=false;
let coinTriggered=false;
const keys={left:false,right:false};
const player={x:150,y:0,w:145,h:195,speed:220,facing:1,moving:false};

const coinDialogue=[
  {speaker:'นักเรียน',text:'เอ๊ะ... นั่นอะไรนะ?'},
  {speaker:'นักเรียน',text:'เหมือนเงินโบราณเลย... ลองดูใกล้ ๆ ดีกว่า'},
  {speaker:'นักเรียน',text:'นี่มันเงินพดด้วงหรือเปล่านะ?'},
  {speaker:'นักเรียน',text:'เดี๋ยวนะ... ทำไมมันมีแสง!?'},
  {speaker:'นักเรียน',text:'เกิดอะไรขึ้นเนี่ย!?'}
];

function currentScene(){return scenes[sceneIndex];}

function resetPlayerForScene(){
  player.x=150;
  player.y=currentScene().groundY-player.h;
  interactionPrompt.classList.add('hidden');
  objective.textContent=currentScene().objective;
}

function drawCover(img){
  if(!(img.complete&&img.naturalWidth>0)){
    ctx.fillStyle='#77bff3';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    return;
  }
  const scale=Math.max(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight);
  const sw=canvas.width/scale;
  const sh=canvas.height/scale;
  const sx=(img.naturalWidth-sw)/2;
  const sy=(img.naturalHeight-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
}

function drawPlayer(){
  if(!(studentSheet.complete&&studentSheet.naturalWidth>0)) return;
  const frame=player.moving?walkFrames[Math.floor(animTime*9)%walkFrames.length]:idleFrame;
  ctx.save();
  if(player.facing<0){
    ctx.translate(player.x+player.w,0);
    ctx.scale(-1,1);
    ctx.drawImage(studentSheet,frame.x,frame.y,frame.w,frame.h,0,player.y,player.w,player.h);
  }else{
    ctx.drawImage(studentSheet,frame.x,frame.y,frame.w,frame.h,player.x,player.y,player.w,player.h);
  }
  ctx.restore();
}

function update(dt){
  animTime+=dt;
  if(dialogueOpen){player.moving=false;return;}

  let dir=0;
  if(keys.left) dir-=1;
  if(keys.right) dir+=1;
  player.moving=dir!==0;

  if(dir!==0){
    player.facing=dir;
    player.x+=dir*player.speed*dt;
    player.x=Math.max(20,Math.min(canvas.width-player.w-20,player.x));
  }

  const scene=currentScene();

  if(scene.id==='school'||scene.id==='road'){
    if(player.x>=scene.exitAt){
      sceneIndex+=1;
      resetPlayerForScene();
    }
  }

  if(scene.id==='coin'){
    const nearCoin=Math.abs((player.x+player.w/2)-scene.interactionX)<140;
    if(nearCoin&&!coinTriggered){
      interactionPrompt.textContent='กด E หรือ “คุย / ตรวจดู” เพื่อตรวจดู';
      interactionPrompt.classList.remove('hidden');
    }else{
      interactionPrompt.classList.add('hidden');
    }
  }
}

function draw(){
  const scene=currentScene();
  drawCover(scene.bg);
  drawPlayer();
}

function loop(t){
  const dt=Math.min((t-last)/1000||0,0.033);
  last=t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function openDialogue(items,index=0){
  dialogueOpen=true;
  dialogueIndex=index;
  const item=items[dialogueIndex];
  speakerEl.textContent=item.speaker;
  dialogueText.textContent=item.text;
  dialogueBox.classList.remove('hidden');
  dialogueNextBtn.textContent=dialogueIndex===items.length-1?'ไปต่อ ▶':'ถัดไป ▶';
  dialogueNextBtn.onclick=()=>{
    if(dialogueIndex<items.length-1){
      dialogueIndex+=1;
      const next=items[dialogueIndex];
      speakerEl.textContent=next.speaker;
      dialogueText.textContent=next.text;
      dialogueNextBtn.textContent=dialogueIndex===items.length-1?'ไปต่อ ▶':'ถัดไป ▶';
    }else{
      dialogueBox.classList.add('hidden');
      dialogueOpen=false;
      if(currentScene().id==='coin'){
        coinTriggered=true;
        sceneIndex=3;
        resetPlayerForScene();
        objective.textContent='เกิดอะไรขึ้น...? ลองเดินสำรวจดู';
      }
    }
  };
}

function interact(){
  if(dialogueOpen){dialogueNextBtn.click();return;}
  const scene=currentScene();
  if(scene.id==='coin'&&!coinTriggered){
    const nearCoin=Math.abs((player.x+player.w/2)-scene.interactionX)<140;
    if(nearCoin) openDialogue(coinDialogue);
  }
}

function setHeld(key,value){keys[key]=value;}

window.addEventListener('keydown',e=>{
  if(e.code==='ArrowLeft'||e.code==='KeyA'){e.preventDefault();setHeld('left',true);}
  if(e.code==='ArrowRight'||e.code==='KeyD'){e.preventDefault();setHeld('right',true);}
  if(e.code==='KeyE'||e.code==='Space'||e.code==='Enter'){e.preventDefault();interact();}
});
window.addEventListener('keyup',e=>{
  if(e.code==='ArrowLeft'||e.code==='KeyA') setHeld('left',false);
  if(e.code==='ArrowRight'||e.code==='KeyD') setHeld('right',false);
});

function bindHoldButton(button,key){
  ['pointerdown','touchstart'].forEach(type=>button.addEventListener(type,e=>{e.preventDefault();setHeld(key,true);}));
  ['pointerup','pointercancel','pointerleave','touchend'].forEach(type=>button.addEventListener(type,e=>{e.preventDefault();setHeld(key,false);}));
}
bindHoldButton(leftBtn,'left');
bindHoldButton(rightBtn,'right');
interactBtn.addEventListener('click',interact);

startBtn.addEventListener('click',()=>{
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  sceneIndex=0;
  coinTriggered=false;
  resetPlayerForScene();
  last=performance.now();
  requestAnimationFrame(loop);
});
