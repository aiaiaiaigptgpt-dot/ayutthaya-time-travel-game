const startScreen=document.getElementById('start-screen');
const introScreen=document.getElementById('intro-screen');
const gameScreen=document.getElementById('game-screen');
const startBtn=document.getElementById('start-btn');
const nextDialogueBtn=document.getElementById('next-dialogue-btn');
const introImage=document.getElementById('intro-image');
const speakerEl=document.getElementById('speaker');
const dialogueText=document.getElementById('dialogue-text');
const jumpBtn=document.getElementById('jump-btn');
const scoreEl=document.getElementById('score');
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

const introSteps=[
  {image:'intro-school.png',speaker:'ผู้บรรยาย',text:'หลังเลิกเรียน นักเรียนกำลังเดินทางกลับบ้านตามปกติ...'},
  {image:'intro-school.png',speaker:'นักเรียน',text:'วันนี้เหนื่อยจัง... รีบกลับบ้านดีกว่า'},
  {image:'intro-road.png',speaker:'ผู้บรรยาย',text:'ระหว่างทาง นักเรียนเดินผ่านถนนใกล้โบราณสถานโดยไม่รู้เลยว่ากำลังจะเกิดเรื่องประหลาดขึ้น'},
  {image:'pod-duang.png',speaker:'นักเรียน',text:'เอ๊ะ... นั่นอะไรน่ะ?'},
  {image:'pod-duang.png',speaker:'นักเรียน',text:'เหมือนเหรียญ... แต่ทำไมรูปร่างแปลกจัง?'},
  {image:'pod-duang.png',speaker:'นักเรียน',text:'นี่มันเงินอะไรนะ...?'},
  {image:'pod-duang.png',speaker:'ผู้บรรยาย',text:'ทันใดนั้น เงินพดด้วงเริ่มเปล่งแสง และแสงรอบตัวก็สว่างขึ้นเรื่อย ๆ'},
  {image:'pod-duang.png',speaker:'นักเรียน',text:'เดี๋ยวนะ... ทำไมมันมีแสง!? เกิดอะไรขึ้นเนี่ย!?'},
  {image:'stage1-farm.png',speaker:'นักเรียน',text:'โอ๊ย... ที่นี่... ที่ไหน?'}
];
let introIndex=0;

function showIntroStep(){
  const step=introSteps[introIndex];
  introImage.src=step.image;
  speakerEl.textContent=step.speaker;
  dialogueText.textContent=step.text;
  nextDialogueBtn.textContent=introIndex===introSteps.length-1?'เริ่มด่าน 1 ▶':'ถัดไป ▶';
}

const groundY=600;
const player={x:180,y:groundY-125,w:92,h:125,vy:0,onGround:true};
let running=false;
let score=0;
let worldX=0;
let last=0;
let animTime=0;

const stageBg=new Image();
stageBg.src='stage1-farm.png';

const studentSheet=new Image();
studentSheet.src='Male student .png';

const runFrames=[
  {x:500,y:330,w:95,h:120},
  {x:600,y:330,w:95,h:120},
  {x:700,y:330,w:95,h:120},
  {x:800,y:330,w:95,h:120},
  {x:900,y:330,w:95,h:120},
  {x:1000,y:330,w:95,h:120}
];
const jumpFrame={x:430,y:500,w:105,h:125};

function resetGame(){
  player.y=groundY-player.h;
  player.vy=0;
  player.onGround=true;
  score=0;
  worldX=0;
  animTime=0;
  scoreEl.textContent='0';
}

function jump(){
  if(!running||!player.onGround)return;
  player.vy=-760;
  player.onGround=false;
}

function update(dt){
  worldX+=90*dt;
  animTime+=dt;
  score+=dt*10;
  scoreEl.textContent=Math.floor(score);
  player.vy+=1900*dt;
  player.y+=player.vy*dt;
  if(player.y+player.h>=groundY){
    player.y=groundY-player.h;
    player.vy=0;
    player.onGround=true;
  }
}

function drawBackground(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(stageBg.complete&&stageBg.naturalWidth>0){
    const scale=Math.max(canvas.width/stageBg.naturalWidth,canvas.height/stageBg.naturalHeight);
    const sw=canvas.width/scale;
    const sh=canvas.height/scale;
    const maxX=Math.max(0,stageBg.naturalWidth-sw);
    const sx=maxX===0?0:(worldX*0.45)%Math.max(1,maxX);
    const sy=Math.max(0,(stageBg.naturalHeight-sh)/2);
    ctx.drawImage(stageBg,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  }else{
    ctx.fillStyle='#58aef7';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  ctx.fillStyle='rgba(0,0,0,0.08)';
  ctx.fillRect(0,groundY,canvas.width,canvas.height-groundY);
}

function drawPlayer(){
  if(studentSheet.complete&&studentSheet.naturalWidth>0){
    const frame=player.onGround?runFrames[Math.floor(animTime*10)%runFrames.length]:jumpFrame;
    ctx.drawImage(studentSheet,frame.x,frame.y,frame.w,frame.h,player.x,player.y,player.w,player.h);
  }else{
    ctx.fillStyle='#fff';
    ctx.fillRect(player.x,player.y,player.w,player.h);
  }
}

function loop(t){
  if(!running)return;
  const dt=Math.min((t-last)/1000||0,0.033);
  last=t;
  update(dt);
  drawBackground();
  drawPlayer();
  requestAnimationFrame(loop);
}

function startStageOne(){
  introScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resetGame();
  running=true;
  last=performance.now();
  requestAnimationFrame(loop);
}

startBtn.addEventListener('click',()=>{
  startScreen.classList.add('hidden');
  introScreen.classList.remove('hidden');
  introIndex=0;
  showIntroStep();
});

nextDialogueBtn.addEventListener('click',()=>{
  if(introIndex<introSteps.length-1){
    introIndex+=1;
    showIntroStep();
  }else{
    startStageOne();
  }
});

jumpBtn.addEventListener('click',jump);
window.addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code==='ArrowUp'){
    e.preventDefault();
    jump();
  }
});
