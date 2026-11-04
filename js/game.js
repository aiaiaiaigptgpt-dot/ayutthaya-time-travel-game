"use strict";
const $=id=>document.getElementById(id);
const screens=['cover-screen','select-screen','name-screen','game-screen'];
const canvas=$('game'),ctx=canvas.getContext('2d');
const objective=$('objective'),prompt=$('interaction-prompt');
const dialogueBox=$('dialogue-box'),portrait=$('dialogue-portrait');
const speaker=$('speaker'),dialogueText=$('dialogue-text'),nextBtn=$('dialogue-next-btn');
const quizPanel=$('quiz-panel'),quizHeading=$('quiz-heading'),quizProgress=$('quiz-progress');
const quizQuestion=$('quiz-question'),quizAnswers=$('quiz-answers'),quizFeedback=$('quiz-feedback');
const quizNextBtn=$('quiz-next-btn');
const keys={left:false,right:false};
let selectedGender=null,playerName='นักเดินทาง',sceneIndex=0,dialogue=null,dialogueIndex=0,dialogueDone=null;
let started=false,last=0,animationTime=0,coinFound=false,farmerTalked=false,quizActive=false,quizIndex=0,quizScore=0,quizShowingResult=false;
const worldWidth=1280;
const player={x:150,w:150,h:270,speed:320,facing:1,moving:false};
const farmer={x:1000,w:168,h:247};
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
 dialogueBox.classList.toggle('farmer-speaking',d.who==='farmer');
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
 showScreen('game-screen');sceneIndex=0;coinFound=false;farmerTalked=false;quizActive=false;quizShowingResult=false;player.x=150;
 objective.textContent=scenes[0].objective;prompt.classList.add('hidden');
 if(!started){started=true;last=performance.now();requestAnimationFrame(frame);}
 openDialogue([
  student(()=>genderWord('วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า','วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า'),'normal'),
  student('วันนี้มีอะไรน่าสนใจระหว่างทางบ้างนะ?','curious')
 ]);
}
function goToScene(n){
 sceneIndex=n;player.x=130;player.moving=false;
 objective.textContent=n===3?'ด่านที่ ๑ : วิถีชีวิตชาวนาในสมัยอยุธยา':scenes[n].objective;prompt.classList.add('hidden');
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
// ===== ส่วนแก้ไขบทสนทนาชาวนา: ปรับข้อความใน npc(...) และ student(...) ได้ตรงนี้ =====
function farmerLines(){
 return [
  student(()=>genderWord('ขอโทษนะครับ ที่นี่ที่ไหนเหรอครับ?','ขอโทษนะคะ ที่นี่ที่ไหนเหรอคะ?'),'worried'),
  npc('เจ้ามาถึงกรุงศรีอยุธยาแล้วล่ะ ที่นี่เป็นเมืองใหญ่ที่มีผู้คนอาศัยอยู่มากมาย','normal'),
  student(()=>genderWord('ทำไมบริเวณนี้จึงมีทุ่งนาเยอะจังครับ?','ทำไมบริเวณนี้จึงมีทุ่งนาเยอะจังคะ?'),'curious'),
  npc('เพราะกรุงศรีอยุธยาตั้งอยู่ในบริเวณที่ราบลุ่ม มีแม่น้ำหลายสายไหลผ่าน จึงมีน้ำใช้ในการเพาะปลูก และดินก็ค่อนข้างอุดมสมบูรณ์','explain'),
  npc('ชาวนาอย่างข้าจะเริ่มจากเตรียมดินและไถนาให้พร้อม จากนั้นจึงนำต้นกล้าข้าวมาปลูกในนา','explain'),
  npc('เมื่อปลูกแล้วก็ต้องคอยดูแลระดับน้ำ กำจัดวัชพืช และเฝ้าดูต้นข้าวให้เติบโตแข็งแรง','explain'),
  student(()=>genderWord('แล้วข้าวมีความสำคัญกับผู้คนในสมัยอยุธยาอย่างไรครับ?','แล้วข้าวมีความสำคัญกับผู้คนในสมัยอยุธยาอย่างไรคะ?'),'curious'),
  npc('ข้าวเป็นอาหารหลักของผู้คน ทุกบ้านต้องกินข้าว และข้าวยังเป็นผลผลิตสำคัญที่นำไปแลกเปลี่ยนหรือค้าขายได้ด้วย','explain'),
  npc('นอกจากนั้น แม่น้ำและคลองยังเป็นเส้นทางสำคัญ ผู้คนใช้เดินทางและขนส่งสินค้าไปยังชุมชนต่าง ๆ','explain'),
  student(()=>genderWord('เข้าใจแล้วครับ ทั้งดิน น้ำ และแม่น้ำจึงสำคัญต่อการทำนาและชีวิตของผู้คน','เข้าใจแล้วค่ะ ทั้งดิน น้ำ และแม่น้ำจึงสำคัญต่อการทำนาและชีวิตของผู้คน'),'normal'),
  npc('ถูกต้องแล้วล่ะ หากเจ้าเข้าใจเรื่องที่ข้าเล่าแล้ว ลองตอบคำถามทบทวนความรู้ทั้ง ๕ ข้อดูนะ','smile')
 ];
}

// ===== แบบทดสอบด่านที่ ๑: แก้ไขคำถาม ตัวเลือก และคำอธิบายได้ตรงนี้ =====
const farmerQuiz=[
 {q:'เหตุใดบริเวณกรุงศรีอยุธยาจึงเหมาะแก่การทำนา?',options:['เพราะเป็นที่ราบลุ่ม มีแม่น้ำและดินอุดมสมบูรณ์','เพราะมีภูเขาสูงและอากาศหนาว','เพราะเป็นทะเลทราย','เพราะมีหิมะตกตลอดปี'],answer:0,explain:'ที่ราบลุ่ม มีน้ำจากแม่น้ำ และดินอุดมสมบูรณ์ ช่วยให้เพาะปลูกข้าวได้ดี'},
 {q:'ชาวนาเตรียมพื้นที่ก่อนปลูกข้าวอย่างไร?',options:['สร้างบ้านกลางทุ่งนา','เตรียมดินและไถนา','ขุดเหมืองแร่','สร้างกำแพงเมือง'],answer:1,explain:'ชาวนาต้องเตรียมดินและไถนาให้พร้อมก่อนนำต้นกล้าข้าวมาปลูก'},
 {q:'หลังจากปลูกต้นกล้าข้าวแล้ว ชาวนาควรทำสิ่งใด?',options:['ปล่อยทิ้งไว้โดยไม่ดูแล','ตัดต้นข้าวทิ้งทันที','ดูแลน้ำและกำจัดวัชพืช','ย้ายต้นข้าวไปปลูกบนภูเขา'],answer:2,explain:'ต้นข้าวต้องได้รับการดูแล เช่น ดูแลระดับน้ำและกำจัดวัชพืช'},
 {q:'ข้าวมีความสำคัญต่อผู้คนในสมัยอยุธยาอย่างไร?',options:['ใช้ตกแต่งบ้านเท่านั้น','เป็นอาหารหลักของผู้คน','ใช้สร้างเรือ','ใช้ทำเครื่องมือเหล็ก'],answer:1,explain:'ข้าวเป็นอาหารหลักที่ผู้คนกินในชีวิตประจำวัน และยังเป็นผลผลิตที่นำไปแลกเปลี่ยนค้าขายได้'},
 {q:'ผู้คนใช้แม่น้ำและคลองในสมัยอยุธยาเพื่อประโยชน์ใด?',options:['ใช้เดินทางและขนส่งสินค้า','ใช้เป็นถนนสำหรับรถยนต์','ใช้ปลูกป่าบนผิวน้ำ','ใช้กั้นไม่ให้ผู้คนติดต่อกัน'],answer:0,explain:'แม่น้ำและคลองเป็นเส้นทางสำคัญสำหรับเดินทางและขนส่งสินค้า'}
];
function renderQuizQuestion(){
 const item=farmerQuiz[quizIndex];
 quizHeading.textContent='ด่านที่ ๑ : วิถีชีวิตชาวนา';
 quizProgress.textContent='ข้อ '+(quizIndex+1)+' / '+farmerQuiz.length;
 quizQuestion.textContent=item.q;
 quizAnswers.replaceChildren();
 quizFeedback.textContent='';
 quizNextBtn.classList.add('hidden');
 item.options.forEach((option,index)=>{
  const button=document.createElement('button');
  button.type='button';button.className='quiz-answer';button.textContent=['ก','ข','ค','ง'][index]+'. '+option;
  button.addEventListener('click',()=>selectQuizAnswer(index));
  quizAnswers.append(button);
 });
}
function selectQuizAnswer(selected){
 const item=farmerQuiz[quizIndex];
 const buttons=[...quizAnswers.querySelectorAll('button')];
 buttons.forEach((button,index)=>{
  button.disabled=true;
  if(index===item.answer)button.classList.add('correct');
  if(index===selected&&selected!==item.answer)button.classList.add('incorrect');
 });
 if(selected===item.answer){quizScore++;quizFeedback.textContent='ถูกต้อง! '+item.explain;}
 else{quizFeedback.textContent='ยังไม่ถูกนะ คำตอบที่ถูกคือ '+item.options[item.answer]+' — '+item.explain;}
 quizNextBtn.textContent=quizIndex===farmerQuiz.length-1?'ดูผลคะแนน ▶':'ข้อต่อไป ▶';
 quizNextBtn.classList.remove('hidden');
}
function openFarmerQuiz(){
 quizIndex=0;quizScore=0;quizShowingResult=false;quizActive=true;
 quizPanel.classList.remove('hidden');renderQuizQuestion();
}
function finishFarmerQuiz(){
 quizShowingResult=true;
 quizHeading.textContent='สรุปผลด่านที่ ๑';
 quizProgress.textContent='คะแนน '+quizScore+' / '+farmerQuiz.length;
 quizQuestion.textContent='ทำแบบทดสอบครบทั้ง ๕ ข้อแล้ว!';
 quizAnswers.replaceChildren();
 quizFeedback.textContent='ตอบถูก '+quizScore+' จาก '+farmerQuiz.length+' ข้อ ด่านที่ ๑ เสร็จสมบูรณ์แล้ว';
 quizNextBtn.textContent='กลับไปสำรวจฉาก ▶';
 quizNextBtn.classList.remove('hidden');
}
quizNextBtn.addEventListener('click',()=>{
 if(quizShowingResult){
  quizPanel.classList.add('hidden');quizActive=false;
  objective.textContent='ผ่านด่านที่ ๑ แล้ว! วิถีชีวิตชาวนาในสมัยอยุธยา';
  return;
 }
 if(quizIndex<farmerQuiz.length-1){quizIndex++;renderQuizQuestion();}
 else finishFarmerQuiz();
});
function interact(){
 if(quizActive)return;
 if(dialogue){advanceDialogue();return;}
 const s=scenes[sceneIndex].id;
 if(s==='coin'&&!coinFound&&Math.abs(player.x-770)<140){
  coinFound=true;openDialogue(coinLines,()=>{goToScene(3);});return;
 }
 if(s==='farm'&&Math.abs(player.x-farmer.x)<260){
  farmerTalked=true;openDialogue(farmerLines(),openFarmerQuiz);return;
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
 if(dialogue||quizActive||$('game-screen').classList.contains('hidden')){player.moving=false;return;}
 const dir=Number(keys.right)-Number(keys.left);
 player.moving=dir!==0;
 if(dir){player.facing=dir;player.x=Math.max(45,Math.min(worldWidth-80,player.x+dir*player.speed*dt));}
 const id=scenes[sceneIndex].id;
 if((id==='school'||id==='road')&&player.x>worldWidth-145){goToScene(sceneIndex+1);return;}
 let message='';
 if(id==='coin'&&!coinFound&&Math.abs(player.x-770)<140)message='กด E เพื่อตรวจดูเงินพดด้วง';
 if(id==='farm'&&Math.abs(player.x-farmer.x)<260)message='กด E เพื่อคุยกับชาวนา';
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
 // Per-frame source foot lines measured from the six-frame transparent sprite sheets.
 const bottoms=selectedGender==='girl'
  ?[661,667,670,660,662,661]
  :[654,658,664,662,652,656];
 const count=6,w=img.naturalWidth,h=img.naturalHeight;
 const sx=Math.round(frameIndex*w/count),ex=Math.round((frameIndex+1)*w/count);
 const sourceBottom=bottoms[frameIndex]||h;
 const alignedTop=-(sourceBottom/h)*height;
 ctx.save();
 ctx.translate(Math.round(x),Math.round(ground));
 if(facing<0)ctx.scale(-1,1);
 // Align the visible foot line instead of the transparent image canvas edge.
 ctx.drawImage(img,sx,0,ex-sx,h,-width/2,alignedTop,width,height);
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
 // Raise both characters only in the farm scene so they stand safely inside the grassy path.
 const ground=id==='farm'?590:632;
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