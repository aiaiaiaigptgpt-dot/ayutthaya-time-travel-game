const startScreen=document.getElementById('start-screen');
const gameScreen=document.getElementById('game-screen');
const startBtn=document.getElementById('start-btn');
const jumpBtn=document.getElementById('jump-btn');
const scoreEl=document.getElementById('score');
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

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

// ตำแหน่งเฟรมโดยประมาณจาก Sprite Sheet นักเรียนชาย
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

  if(stageBg.complete && stageBg.naturalWidth>0){
    const scale=Math.max(canvas.width/stageBg.naturalWidth,canvas.height/stageBg.naturalHeight);
    const sw=canvas.width/scale;
    const sh=canvas.height/scale;
    const maxX=Math.max(0,stageBg.naturalWidth-sw);
    const sx=maxX===0?0:(worldX*0.45)%Math.max(1,maxX);
    const sy=Math.max(0,(stageBg.naturalHeight-sh)/2);
    ctx.drawImage(stageBg,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  }else{
    const sky=ctx.createLinearGradient(0,0,0,groundY);
    sky.addColorStop(0,'#58aef7');
    sky.addColorStop(1,'#d8f2ff');
    ctx.fillStyle=sky;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  ctx.fillStyle='rgba(0,0,0,0.08)';
  ctx.fillRect(0,groundY,canvas.width,canvas.height-groundY);
}

function drawPlayer(){
  if(studentSheet.complete && studentSheet.naturalWidth>0){
    let frame;
    if(player.onGround){
      const index=Math.floor(animTime*10)%runFrames.length;
      frame=runFrames[index];
    }else{
      frame=jumpFrame;
    }

    ctx.drawImage(
      studentSheet,
      frame.x,frame.y,frame.w,frame.h,
      player.x,player.y,player.w,player.h
    );
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

startBtn.addEventListener('click',()=>{
  resetGame();
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  running=true;
  last=performance.now();
  requestAnimationFrame(loop);
});

jumpBtn.addEventListener('click',jump);
window.addEventListener('keydown',e=>{
  if(e.code==='Space'||e.code==='ArrowUp'){
    e.preventDefault();
    jump();
  }
});
