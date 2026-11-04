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
const worldWidth=2200;
const player={x:150,w:90,h:153,speed:320,facing:1,moving:false};
const farmer={x:1550,w:105,h:165};
const images={};
function image(path){if(!images[path]){const img=new Image();img.src=path;images[path]=img;}return images[path];}
['intro-school.png','intro-road.png','pod-duang.png','stage1-farm.png','farmer-normal.png','farmer-smile.png','farmer-explain.png',
'student-boy-normal.png','student-girl-normal.png'].forEach(image);
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
 if(s==='coin'&&!coinFound&&Math.abs(player.x-1330)<170){
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
 if((id==='school'||id==='road')&&player.x>worldWidth-115){goToScene(sceneIndex+1);return;}
 let message='';
 if(id==='coin'&&!coinFound&&Math.abs(player.x-1330)<170)message='กด E เพื่อตรวจดูเงินพดด้วง';
 if(id==='farm'&&Math.abs(player.x-farmer.x)<170)message='กด E เพื่อคุยกับชาวนา';
 prompt.textContent=message;prompt.classList.toggle('hidden',!message);
}
function drawBackground(){
 const path=scenes[sceneIndex].bg,img=image(path);
 if(!img.complete||!img.naturalWidth){ctx.fillStyle='#80b6d8';ctx.fillRect(0,0,1280,720);return;}
 const camera=Math.max(0,Math.min(worldWidth-1280,player.x-520));
 ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,-camera,0,worldWidth,720);
 return camera;
}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function drawPixelPerson(x,ground,gender,facing,moving,scale=1,farmerMode=false){
 const bob=moving?Math.round(Math.sin(animationTime*14)*3):0;
 const step=moving?Math.round(Math.sin(animationTime*14)*8):0;
 ctx.save();ctx.translate(Math.round(x),Math.round(ground+bob));ctx.scale(scale*(facing<0?-1:1),scale);
 const skin=farmerMode?'#bc845a':'#e2a67b';
 // Boots and stepping legs.
 rect(-19,-36,14,33+step,farmerMode?'#775b3d':'#253d69');
 rect(5,-36,14,33-step,farmerMode?'#775b3d':'#253d69');
 rect(-24,-7+step,20,8,'#38293d');rect(4,-7-step,20,8,'#38293d');
 rect(-28,-94,56,62,farmerMode?'#9d6d43':'#f7f6e7');
 rect(-28,-94,56,7,farmerMode?'#a98055':'#32497a');
 rect(-37,-86,10,47,skin);rect(27,-86,10,47,skin);
 rect(-24,-153,48,51,skin);
 rect(-26,-156,53,18,farmerMode?'#d7d2bf':'#563a32');
 if(farmerMode){rect(-41,-164,82,9,'#b89050');rect(-28,-180,56,17,'#caa96c');rect(-15,-103,30,8,'#d6d3ca');}
 else {
  rect(-17,-159,38,12,'#4b302d');
  if(gender==='girl'){rect(-39,-144,12,46,'#50302b');rect(27,-144,12,46,'#50302b');rect(-41,-137,14,7,'#3b70ab');rect(27,-137,14,7,'#3b70ab');rect(-34,-44,68,14,'#263d66');}
  else rect(-25,-39,50,8,'#253d69');
  rect(21,-88,13,40,'#344a6e');
 }
 rect(5,-131,6,5,'#302329');rect(-16,-131,6,5,'#302329');
 ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,1280,720);
 const camera=drawBackground()||0,id=scenes[sceneIndex].id;
 const ground=620;
 if(id==='farm'){
  const fx=farmer.x-camera;
  drawPixelPerson(fx,ground,'boy',-1,false,1.12,true);
  if(Math.abs(player.x-farmer.x)<175){ctx.fillStyle='#fff6d6';ctx.font='bold 21px system-ui';ctx.textAlign='center';ctx.fillText('ชาวนา',fx,ground-203);}
 }
 drawPixelPerson(player.x-camera,ground,selectedGender,player.facing,player.moving,1,false);
 // Interaction coordinates are approximate because the coin already appears in the background image.
}
function frame(t){const dt=Math.min((t-last)/1000||0,0.04);last=t;update(dt);draw();requestAnimationFrame(frame);}
showScreen('cover-screen');