const startScreen=document.getElementById('start-screen');
const introScreen=document.getElementById('intro-screen');
const gameScreen=document.getElementById('game-screen');
const startBtn=document.getElementById('start-btn');
const nextDialogueBtn=document.getElementById('next-dialogue-btn');
const introImage=document.getElementById('intro-image');
const speakerEl=document.getElementById('speaker');
const dialogueText=document.getElementById('dialogue-text');
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const stageDialogue=document.getElementById('stage-dialogue');
const stageSpeaker=document.getElementById('stage-speaker');
const stageDialogueText=document.getElementById('stage-dialogue-text');
const stageNextBtn=document.getElementById('stage-next-btn');

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
  nextDialogueBtn.textContent=introIndex===introSteps.length-1?'ไปต่อ ▶':'ถัดไป ▶';
}

const groundY=625;
const player={x:-170,y:groundY-205,w:150,h:205};
let walking=false;
let stageStarted=false;
let last=0;
let animTime=0;

const stageBg=new Image();
stageBg.src='stage1-farm.png';
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

const stageDialogues=[
  {speaker:'นักเรียน',text:'โอ๊ย... ที่นี่ที่ไหนเนี่ย?'},
  {speaker:'นักเรียน',text:'ทำไมทุกอย่างดูเหมือนสมัยก่อนเลย...'},
  {speaker:'นักเรียน',text:'ลองเดินไปถามคนแถวนี้ดีกว่า'}
];
let stageDialogueIndex=0;

function drawCoverImage(img){
  const scale=Math.max(canvas.width/img.naturalWidth,canvas.height/img.naturalHeight);
  const sw=canvas.width/scale;
  const sh=canvas.height/scale;
  const sx=(img.naturalWidth-sw)/2;
  const sy=(img.naturalHeight-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
}

function drawPlayer(){
  if(!(studentSheet.complete&&studentSheet.naturalWidth>0)) return;
  const frame=walking
    ? walkFrames[Math.floor(animTime*8)%walkFrames.length]
    : idleFrame;
  ctx.drawImage(studentSheet,frame.x,frame.y,frame.w,frame.h,player.x,player.y,player.w,player.h);
}

function updateStage(dt){
  animTime+=dt;
  if(walking){
    player.x+=95*dt;
    if(player.x>=250){
      player.x=250;
      walking=false;
      showStageDialogue(0);
    }
  }
}

function drawStage(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(stageBg.complete&&stageBg.naturalWidth>0){
    drawCoverImage(stageBg);
  }else{
    ctx.fillStyle='#8fd0ff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  drawPlayer();
}

function stageLoop(t){
  if(!stageStarted) return;
  const dt=Math.min((t-last)/1000||0,0.033);
  last=t;
  updateStage(dt);
  drawStage();
  requestAnimationFrame(stageLoop);
}

function showStageDialogue(index){
  const item=stageDialogues[index];
  stageSpeaker.textContent=item.speaker;
  stageDialogueText.textContent=item.text;
  stageDialogue.classList.remove('hidden');
  stageNextBtn.textContent=index===stageDialogues.length-1?'เดินต่อ ▶':'ถัดไป ▶';
}

function startStageOne(){
  introScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  player.x=-170;
  walking=true;
  stageStarted=true;
  stageDialogueIndex=0;
  stageDialogue.classList.add('hidden');
  last=performance.now();
  requestAnimationFrame(stageLoop);
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

stageNextBtn.addEventListener('click',()=>{
  if(stageDialogueIndex<stageDialogues.length-1){
    stageDialogueIndex+=1;
    showStageDialogue(stageDialogueIndex);
  }else{
    stageDialogue.classList.add('hidden');
    walking=true;
  }
});
