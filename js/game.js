const startScreen=document.getElementById('start-screen');
const gameScreen=document.getElementById('game-screen');
const startBtn=document.getElementById('start-btn');
const jumpBtn=document.getElementById('jump-btn');
const scoreEl=document.getElementById('score');
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');

const groundY=560;
const player={x:180,y:groundY-90,w:58,h:90,vy:0,onGround:true};
let running=false;
let score=0;
let worldX=0;
let last=0;

function resetGame(){
  player.y=groundY-player.h;
  player.vy=0;
  player.onGround=true;
  score=0;
  worldX=0;
  scoreEl.textContent='0';
}

function jump(){
  if(!running||!player.onGround)return;
  player.vy=-760;
  player.onGround=false;
}

function update(dt){
  worldX+=220*dt;
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
  const sky=ctx.createLinearGradient(0,0,0,groundY);
  sky.addColorStop(0,'#58aef7');
  sky.addColorStop(1,'#d8f2ff');
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,canvas.width,groundY);

  ctx.fillStyle='#2d9144';
  ctx.fillRect(0,groundY,canvas.width,canvas.height-groundY);

  ctx.fillStyle='#8b5a2b';
  const offset=-(worldX%180);
  for(let x=offset;x<canvas.width+180;x+=180){
    ctx.fillRect(x,groundY-45,110,45);
  }
}

function drawPlayer(){
  ctx.fillStyle='#ffffff';
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.fillStyle='#264c9b';
  ctx.fillRect(player.x,player.y+48,player.w,42);
  ctx.fillStyle='#222';
  ctx.fillRect(player.x+10,player.y+20,8,8);
  ctx.fillRect(player.x+38,player.y+20,8,8);
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
