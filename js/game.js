"use strict";
const $=id=>document.getElementById(id);
const screens=['cover-screen','select-screen','name-screen','game-screen'];
const canvas=$('game'),ctx=canvas.getContext('2d');
const objective=$('objective'),prompt=$('interaction-prompt');
const dialogueBox=$('dialogue-box'),portrait=$('dialogue-portrait');
const speaker=$('speaker'),dialogueText=$('dialogue-text'),nextBtn=$('dialogue-next-btn');
const keys={left:false,right:false};
let selectedGender=null,playerName='นักเดินทาง',sceneIndex=0,dialogue=null,dialogueIndex=0,dialogueDone=null;
let started=false,last=0,animationTime=0,coinFound=false,farmerTalked=false;
const worldWidth=1280;
const player={x:150,w:118,h:215,speed:320,facing:1,moving:false};
const farmer={x:895,w:153,h:225};
const images={};
function image(path){if(!images[path]){const img=new Image();img.src=path;images[path]=img;}return images[path];}
['intro-school.png','intro-road.png','pod-duang.png','stage1-farm.png','farmer-normal.png','farmer-smile.png','farmer-explain.png',
'student-boy-normal.png','student-girl-normal.png','student-boy-walk.png','student-girl-walk.png','farmer-idle.png'].forEach(image);
const scenes=[
 {id:'school',bg:'intro-school.png',objective:'เดินไปทางขวาเพื่อกลับบ้าน'},
 {id:'road',bg:'intro-road.png',objective:'เดินต่อไปตามทางกลับบ้าน'},
 {id:'coin',bg:'pod-duang.png',objective:'มีบางอย่างแปลก ๆ อยู่บนพื้น ลองเดินไปสำรวจ'},
 {id:'farm',bg:'stage1-farm.png',objective:'นี่คือที่ไหนกันนะ? เดินไปถามชาวนาดูสิ'}
];
function showScreen(id){for(const s of screens)$(s).classList.toggle('hidden',s!==id);$('controls').classList.toggle('hidden',id!=='game-screen');}
$('start-btn').addEventListener('click',()=>showScreen('select-screen'));
function choose(gender){
 selectedGender=gender;
 $('choose-boy').classList.toggle('selected',gender==='boy');
 $('choose-girl').classList.toggle('selected',gender==='girl');
 $('selection-label').textContent=gender==='boy'?'เลือกนักเรียนชายแล้ว':'เลือกนักเรียนหญิงแล้ว';
 $('select-next').disabled=false;
}
$('choose-boy').addEventListener('click',()=>choose('boy'));
$('choose-girl').addEventListener('click',()=>choose('girl'));
$('select-next').addEventListener('click',()=>{if(selectedGender)showScreen('name-screen');});
$('name-form').addEventListener('submit',e=>{
 e.preventDefault();const name=$('player-name').value.trim();if(!name){$('player-name').focus();return;}
 playerName=name;startGame();
});
function genderWord(boy,girl){return selectedGender==='girl'?girl:boy;}
function student(text,emotion='normal'){return{who:'student',emotion,text};}
function npc(text,emotion='normal'){return{who:'farmer',emotion,text};}
function showDialogueLine(){
 const d=dialogue[dialogueIndex];
 speaker.textContent=d.who==='farmer'?'ชาวนา':playerName;
 dialogueText.textContent=typeof d.text==='function'?d.text():d.text;
 portrait.src=d.who==='farmer'?'farmer-'+d.emotion+'.png':'student-'+selectedGender+'-'+d.emotion+'.png';
 portrait.alt=speaker.textContent;
 nextBtn.textContent=dialogueIndex===dialogue.length-1?'ปิดบทสนทนา ▶':'ถัดไป ▶';
}
function openDialogue(lines,done){
 keys.left=keys.right=false;player.moving=false;
 dialogue=lines;dialogueIndex=0;dialogueDone=done||null;showDialogueLine();
 dialogueBox.classList.remove('hidden');prompt.classList.add('hidden');
}
function advanceDialogue(){
 if(!dialogue)return;
 if(dialogueIndex<dialogue.length-1){dialogueIndex++;showDialogueLine();return;}
 dialogue=null;dialogueBox.classList.add('hidden');
 const done=dialogueDone;dialogueDone=null;if(done)done();
}
nextBtn.addEventListener('click',advanceDialogue);
function startGame(){
 showScreen('game-screen');sceneIndex=0;coinFound=false;farmerTalked=false;player.x=150;
 objective.textContent=scenes[0].objective;prompt.classList.add('hidden');
 if(!started){started=true;last=performance.now();requestAnimationFrame(frame);}
 openDialogue([
  student(()=>genderWord('วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า','วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า'),'normal'),
  student('วันนี้มีอะไรน่าสนใจระหว่างทางบ้างนะ?','curious')
 ]);
}
function goToScene(n){
 sceneIndex=n;player.x=130;player.moving=false;
 objective.textContent=scenes[n].objective;prompt.classList.add('hidden');
 if(n===3)openDialogue([
  student('โอ๊ย... เกิดอะไรขึ้นกับฉันเนี่ย!?','surprised'),
  student('ที่นี่... ที่ไหนกัน? ทุกอย่างดูเหมือนสมัยก่อนเลย','worried'),
  student('ตรงนั้นมีชาวนาอยู่ ลองเดินไปถามดีกว่า','curious')
 ]);
}
const coinLines=[
 student('เอ๊ะ... นั่นอะไรน่ะ?','curious'),
 student('เหมือนเหรียญ... แต่ทำไมรูปร่างแปลกจัง?','curious'),
 student('นี่มันเงินพดด้วงหรือเปล่านะ?','normal'),
 student('เดี๋ยวนะ... ทำไมมันมีแสง!?','surprised'),
 student('เกิดอะไรขึ้นเนี่ย!?','worried')
];
function farmerLines(){
 return [
  student(()=>genderWord('ขอโทษนะครับ ที่นี่ที่ไหนเหรอครับ?','ขอโทษนะคะ ที่นี่ที่ไหนเหรอคะ?'),'worried'),
  npc('เจ้าถามแปลกนัก ที่นี่ก็คือกรุงศรีอยุธยาอย่างไรเล่า','normal'),
  student('กรุงศรีอยุธยา!? จริงเหรอ!?','surprised'),
  npc('จริงสิ เจ้ามาจากที่ใด ถึงได้แต่งกายแปลกตาเช่นนี้?','smile'),
  student(()=>genderWord('ผมชื่อ '+playerName+' ครับ เมื่อครู่ยังเดินกลับบ้านอยู่เลย','หนูชื่อ '+playerName+' ค่ะ เมื่อครู่ยังเดินกลับบ้านอยู่เลย'),'worried'),
  npc('ยินดีที่ได้รู้จักนะ '+playerName+' ข้ากำลังทำนาอยู่พอดี','smile'),
  npc('ผู้คนจำนวนมากในกรุงศรีอยุธยาทำนา เพราะพื้นที่ราบลุ่มและแม่น้ำเอื้ออำนวยต่อการเพาะปลูก','explain'),
  npc('ข้าวเป็นอาหารสำคัญ และแม่น้ำยังช่วยให้ผู้คนเดินทางค้าขายได้ด้วย','explain'),
  student('เข้าใจแล้ว ขอบคุณที่เล่าให้ฟังนะ!','normal'),
  npc('หากอยากรู้เรื่องเมืองนี้มากขึ้น เจ้าลองเดินสำรวจต่อไปเถิด','smile')
 ];
}
function interact(){
 if(dialogue){advanceDialogue();return;}
 const s=scenes[sceneIndex].id;
 if(s==='coin'&&!coinFound&&Math.abs(player.x-770)<140){
  coinFound=true;openDialogue(coinLines,()=>{goToScene(3);});return;
 }
 if(s==='farm'&&Math.abs(player.x-farmer.x)<170){
  farmerTalked=true;openDialogue(farmerLines(),()=>{objective.textContent='เรียนรู้วิถีชีวิตชาวนาแล้ว! สำรวจฉากต่อได้';});return;
 }
}
$('interact-btn').addEventListener('click',interact);
window.addEventListener('keydown',e=>{
 if(document.activeElement===$('player-name'))return;
 if(['ArrowLeft','ArrowRight','Space','Enter','KeyE','KeyA','KeyD'].includes(e.code))e.preventDefault();
 if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=true;
 if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=true;
 if((e.code==='KeyE'||e.code==='Space'||e.code==='Enter')&&!e.repeat&&!$('game-screen').classList.contains('hidden'))interact();
});
window.addEventListener('keyup',e=>{
 if(e.code==='ArrowLeft'||e.code==='KeyA')keys.left=false;
 if(e.code==='ArrowRight'||e.code==='KeyD')keys.right=false;
});
window.addEventListener('blur',()=>{keys.left=keys.right=false;});
function hold(id,key){
 const btn=$(id);
 btn.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;btn.setPointerCapture(e.pointerId);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,()=>keys[key]=false);
}
hold('left-btn','left');hold('right-btn','right');
function update(dt){
 animationTime+=dt;
 if(dialogue||$('game-screen').classList.contains('hidden')){player.moving=false;return;}
 const dir=Number(keys.right)-Number(keys.left);
 player.moving=dir!==0;
 if(dir){player.facing=dir;player.x=Math.max(45,Math.min(worldWidth-80,player.x+dir*player.speed*dt));}
 const id=scenes[sceneIndex].id;
 if((id==='school'||id==='road')&&player.x>worldWidth-145){goToScene(sceneIndex+1);return;}
 let message='';
 if(id==='coin'&&!coinFound&&Math.abs(player.x-770)<140)message='กด E เพื่อตรวจดูเงินพดด้วง';
 if(id==='farm'&&Math.abs(player.x-farmer.x)<170)message='กด E เพื่อคุยกับชาวนา';
 prompt.textContent=message;prompt.classList.toggle('hidden',!message);
}
function drawBackground(){
 const path=scenes[sceneIndex].bg,img=image(path);
 if(!img.complete||!img.naturalWidth){ctx.fillStyle='#80b6d8';ctx.fillRect(0,0,1280,720);return;}
 // Keep the complete 16:9 artwork visible without artificially stretching its width.
 ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,0,0,1280,720);
 return 0;
}
function drawWalkSprite(img,frameIndex,x,ground,width,height,facing){
 if(!img.complete||!img.naturalWidth)return false;
 // Six equally spaced animation cells in a single transparent PNG.
 const count=6,cell=img.naturalWidth/count;
 const sx=Math.floor(frameIndex*cell),ex=Math.floor((frameIndex+1)*cell);
 ctx.save();
 ctx.translate(Math.round(x),Math.round(ground));
 if(facing<0)ctx.scale(-1,1);
 // A slightly narrower drawing box retains the original pixel-art proportions.
 ctx.drawImage(img,sx,0,ex-sx,img.naturalHeight,-width/2,-height,width,height);
 ctx.restore();
 return true;
}
function drawFarmer(x,ground){
 const img=image('farmer-idle.png');
 if(!img.complete||!img.naturalWidth)return;
 const w=farmer.w,h=farmer.h;
 // Preserve source aspect ratio: the farmer image is naturally portrait-oriented.
 ctx.drawImage(img,Math.round(x-w/2),Math.round(ground-h),w,h);
}
function draw(){
 ctx.clearRect(0,0,1280,720);
 drawBackground();
 const id=scenes[sceneIndex].id;
 const ground=620;
 if(id==='farm'){
  drawFarmer(farmer.x,ground);
  if(Math.abs(player.x-farmer.x)<175){
   ctx.font='bold 21px system-ui';
   ctx.fillStyle='#fff6db';ctx.textAlign='center';
   ctx.fillText('ชาวนา',farmer.x,ground-farmer.h-9);
  }
 }
 const img=image('student-'+(selectedGender||'boy')+'-walk.png');
 // Standing uses a near-neutral passing pose; moving cycles through all six frames.
 const index=player.moving?Math.floor(animationTime*8)%6:2;
 drawWalkSprite(img,index,player.x,ground,player.w,player.h,player.facing);
}
function frame(t){const dt=Math.min((t-last)/1000||0,0.04);last=t;update(dt);draw();requestAnimationFrame(frame);}
showScreen('cover-screen');