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
let started=false,last=0,animationTime=0,coinFound=false,farmerTalked=false,quizActive=false,quizIndex=0,quizScore=0,quizShowingResult=false,quizRetrying=false,stage1Passed=false;
const worldWidth=1280;
const player={x:150,w:150,h:270,speed:320,facing:1,moving:false};
const farmer={x:1000,w:168,h:247};
const images={};
function image(path){if(!images[path]){const img=new Image();img.src=path;images[path]=img;}return images[path];}
// โหลดภาพแบบ Lazy Loading: โหลดเมื่อฉากหรือบทสนทนาต้องใช้จริงเท่านั้น
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
// เพิ่มปุ่มย้อนกลับ โดยคงปุ่มถัดไปเดิมไว้เพียงสองปุ่ม
const previousBtn=document.createElement('button');
previousBtn.type='button';
previousBtn.id='dialogue-prev-btn';
previousBtn.textContent='◀ ย้อนกลับ';
previousBtn.className=nextBtn.className;
previousBtn.disabled=true;
previousBtn.setAttribute('aria-label','ย้อนกลับไปอ่านข้อความก่อนหน้า');
nextBtn.parentNode.insertBefore(previousBtn,nextBtn);

function showDialogueLine(){
 const d=dialogue[dialogueIndex];
 dialogueBox.classList.toggle('farmer-speaking',d.who==='farmer');
 speaker.textContent=d.who==='farmer'?'ชาวนา':playerName;
 dialogueText.textContent=typeof d.text==='function'?d.text():d.text;
 portrait.src=d.who==='farmer'?'farmer-'+d.emotion+'.png':'student-'+selectedGender+'-'+d.emotion+'.png';
 portrait.alt=speaker.textContent;
 previousBtn.disabled=dialogueIndex===0;
 previousBtn.classList.toggle('hidden',dialogueIndex===0);
 nextBtn.textContent=dialogueIndex===dialogue.length-1?'ปิดบทสนทนา ▶':'ถัดไป ▶';
}
function goBackDialogue(){
 if(!dialogue||dialogueIndex===0)return;
 dialogueIndex--;
 showDialogueLine();
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
previousBtn.addEventListener('click',goBackDialogue);
nextBtn.addEventListener('click',advanceDialogue);
function startGame(){
 showScreen('game-screen');sceneIndex=0;coinFound=false;farmerTalked=false;quizActive=false;quizShowingResult=false;quizRetrying=false;stage1Passed=false;player.x=150;
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
  student(()=>genderWord('เอ่อ... ขอโทษนะครับ ที่นี่ที่ไหนเหรอครับ?','เอ่อ... ขอโทษนะคะ ที่นี่ที่ไหนเหรอคะ?'),'worried'),
  npc('อ้าว! เจ้ามาจากที่ใดกันหรือ? ที่นี่คือกรุงศรีอยุธยา เมืองอันรุ่งเรืองของเรานี่เอง','normal'),
  student(()=>genderWord('กรุงศรีอยุธยามีทุ่งนากว้างใหญ่แบบนี้ด้วยหรือครับ?','กรุงศรีอยุธยามีทุ่งนากว้างใหญ่แบบนี้ด้วยหรือคะ?'),'curious'),
  npc('ใช่แล้วล่ะ เมืองของเราตั้งอยู่บริเวณที่ราบลุ่มแม่น้ำเจ้าพระยาตอนล่าง มีแม่น้ำหลายสายไหลผ่าน ทั้งยังมีดินอุดมสมบูรณ์ จึงเหมาะแก่การเพาะปลูกเป็นอย่างยิ่ง','explain'),
  student(()=>genderWord('แล้วผู้คนที่นี่ปลูกพืชชนิดใดกันบ้างครับ?','แล้วผู้คนที่นี่ปลูกพืชชนิดใดกันบ้างคะ?'),'curious'),
  npc('พืชสำคัญของเราก็คือข้าวจ้ะ นอกจากนั้นยังมีพริกไทย หมาก อ้อย มะพร้าว และผลไม้อีกหลายชนิด','explain'),
  student(()=>genderWord('แล้วข้าวมีความสำคัญต่อผู้คนอย่างไรหรือครับ?','แล้วข้าวมีความสำคัญต่อผู้คนอย่างไรหรือคะ?'),'curious'),
  npc('ข้าวเป็นอาหารหลักของผู้คนในบ้านเมืองเรา นอกจากเก็บไว้กินแล้ว ยังนำผลผลิตไปขายหรือแลกเปลี่ยนเป็นสิ่งของอื่นได้อีกด้วย','explain'),
  student(()=>genderWord('เข้าใจแล้วครับ ข้าวจึงเป็นสิ่งสำคัญต่อชีวิตของผู้คนในอยุธยาสินะ','เข้าใจแล้วค่ะ ข้าวจึงเป็นสิ่งสำคัญต่อชีวิตของผู้คนในอยุธยาสินะ'),'normal'),
  npc('ถูกต้องแล้วจ้ะ เอาล่ะ! ไหนลองตอบคำถามจากเรื่องที่ข้าเล่าให้ฟังดูเถิด หากตอบถูกครบทั้ง ๕ ข้อ เจ้าก็จะผ่านด่านนี้ไปได้','smile')
 ];
}

 
// ===== บทสนทนาหลังผ่านด่านที่ ๑: ขอเส้นทางไปท่าน้ำ =====
function farmerDepartureLines(){
 return [
  student(()=>genderWord(
   'ขอบคุณลุงมากครับ ที่เล่าเรื่องราวให้ผมฟัง ผมได้ความรู้มากมายเลยครับ',
   'ขอบคุณลุงมากค่ะ ที่เล่าเรื่องราวให้หนูฟัง หนูได้ความรู้มากมายเลยค่ะ'
  ),'normal'),
  student(()=>genderWord(
   'ผมอยากเดินทางเข้าไปในตัวเมืองกรุงศรีอยุธยา ต้องไปทางไหนหรือครับ?',
   'หนูอยากเดินทางเข้าไปในตัวเมืองกรุงศรีอยุธยา ต้องไปทางไหนหรือคะ?'
  ),'curious'),
  npc('ถ้าอยากเข้าไปในพระนครล่ะก็ เดินไปตามทางนี้จนถึงท่าน้ำริมแม่น้ำเถิด ที่นั่นมีเรือรับส่งผู้คนเข้าออกเมืองอยู่','explain'),
  student(()=>genderWord(
   'แล้วผมจะขึ้นเรือลำนั้นเพื่อเข้าไปในเมืองได้ใช่ไหมครับ?',
   'แล้วหนูจะขึ้นเรือลำนั้นเพื่อเข้าไปในเมืองได้ใช่ไหมคะ?'
  ),'curious'),
  npc('ใช่แล้วจ้ะ คนพายเรือจะพาเจ้าไปส่งที่ท่าน้ำฝั่งพระนคร ระหว่างทางลองสังเกตแม่น้ำและเรือที่สัญจรไปมาด้วยนะ','point'),
  student(()=>genderWord(
   'เข้าใจแล้วครับ ถ้าอย่างนั้นผมขอตัวไปที่ท่าน้ำก่อนนะครับ',
   'เข้าใจแล้วค่ะ ถ้าอย่างนั้นหนูขอตัวไปที่ท่าน้ำก่อนนะคะ'
  ),'normal'),
  npc(()=>genderWord('เดินทางดี ๆ นะพ่อหนุ่ม ขอให้เจ้าไปถึงเมืองโดยปลอดภัย','เดินทางดี ๆ นะแม่หนู ขอให้เจ้าไปถึงเมืองโดยปลอดภัย'),'smile')
 ];
}

// ===== แบบทดสอบด่านที่ ๑: แก้ไขคำถาม ตัวเลือก และคำอธิบายได้ตรงนี้ =====
const farmerQuiz=[
 {q:'เหตุใดบริเวณกรุงศรีอยุธยาจึงเหมาะแก่การทำนา?',options:['เพราะเป็นที่ราบลุ่ม มีแม่น้ำและดินอุดมสมบูรณ์','เพราะมีภูเขาสูงและอากาศหนาว','เพราะเป็นทะเลทราย','เพราะมีหิมะตกตลอดปี'],answer:0,explain:'ที่ราบลุ่ม มีแม่น้ำ และดินอุดมสมบูรณ์ ทำให้มีสภาพเหมาะแก่การทำนา',hint:'ลองนึกถึงสิ่งที่ชาวนาเล่าเกี่ยวกับลักษณะพื้นที่และแหล่งน้ำ'},
 {q:'กรุงศรีอยุธยาตั้งอยู่บริเวณใด?',options:['ที่ราบสูงภาคเหนือ','ที่ราบลุ่มแม่น้ำเจ้าพระยาตอนล่าง','บริเวณภูเขาสูง','บริเวณชายฝั่งทะเลอันดามัน'],answer:1,explain:'กรุงศรีอยุธยาตั้งอยู่บริเวณที่ราบลุ่มแม่น้ำเจ้าพระยาตอนล่าง',hint:'ชาวนาบอกชื่อแม่น้ำสายสำคัญและตำแหน่งของพื้นที่ไว้ในบทสนทนา'},
 {q:'พืชชนิดใดเป็นพืชสำคัญที่ผู้คนในสมัยอยุธยาปลูก?',options:['ข้าว','ยางพารา','กาแฟ','ชา'],answer:0,explain:'ข้าวเป็นพืชสำคัญของอยุธยา และเป็นอาหารหลักของผู้คน',hint:'ชาวนาเน้นย้ำว่าพืชชนิดใดเป็นอาหารหลักของผู้คน'},
 {q:'ข้อใดเป็นพืชที่ผู้คนในสมัยอยุธยาปลูกนอกเหนือจากข้าว?',options:['พริกไทย','อ้อย','มะพร้าว','ถูกทุกข้อ'],answer:3,explain:'ผู้คนปลูกพืชหลายชนิด เช่น พริกไทย อ้อย มะพร้าว หมาก และผลไม้ต่าง ๆ',hint:'ลองทบทวนรายชื่อพืชที่ชาวนาพูดถึง นอกเหนือจากข้าว'},
 {q:'ข้าวมีความสำคัญต่อผู้คนในสมัยอยุธยาอย่างไร?',options:['ใช้สำหรับตกแต่งบ้าน','เป็นอาหารหลักของผู้คน และสามารถนำผลผลิตไปขายหรือแลกเปลี่ยนได้','ใช้สำหรับสร้างบ้านเรือน','ใช้สำหรับทำเครื่องมือการเกษตรเท่านั้น'],answer:1,explain:'ข้าวเป็นอาหารหลักของผู้คน และผลผลิตยังนำไปขายหรือแลกเปลี่ยนเป็นสิ่งของอื่นได้',hint:'ชาวนาเล่าว่าข้าวนำไปใช้ประโยชน์ได้ทั้งกิน ขาย และแลกเปลี่ยน'}
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
  if(index===selected&&selected===item.answer)button.classList.add('correct');
  if(index===selected&&selected!==item.answer)button.classList.add('incorrect');
 });
 if(selected===item.answer){
  quizScore++;
  quizRetrying=false;
  quizFeedback.textContent='ถูกต้อง! '+item.explain;
  quizNextBtn.textContent=quizIndex===farmerQuiz.length-1?'ดูผลการเรียนรู้ ▶':'ข้อต่อไป ▶';
 }else{
  quizRetrying=true;
  quizFeedback.textContent='ยังไม่ถูกต้อง ลองนึกถึงสิ่งที่ชาวนาเล่าอีกครั้งนะจ๊ะ คำใบ้: '+item.hint;
  quizNextBtn.textContent='ลองตอบอีกครั้ง ↻';
 }
 quizNextBtn.classList.remove('hidden');
}
function openFarmerQuiz(){
 quizIndex=0;quizScore=0;quizShowingResult=false;quizRetrying=false;quizActive=true;
 quizPanel.classList.remove('hidden');renderQuizQuestion();
}
function finishFarmerQuiz(){
 quizShowingResult=true;
 stage1Passed=quizScore===farmerQuiz.length;
 quizHeading.textContent='สรุปผลด่านที่ ๑';
 quizProgress.textContent='คะแนน '+quizScore+' / '+farmerQuiz.length;
 quizQuestion.textContent=stage1Passed?'ยอดเยี่ยม! เจ้าผ่านด่านวิถีชีวิตชาวนาแล้ว':'ยังตอบไม่ครบทุกข้อ';
 quizAnswers.replaceChildren();
 quizFeedback.textContent=stage1Passed?'ตอบถูกครบทั้ง ๕ ข้อ ได้รับตราผ่านด่านที่ ๑ และปลดล็อกเงื่อนไขสำหรับด่านถัดไปแล้ว':'ต้องตอบคำถามให้ถูกครบทั้ง ๕ ข้อจึงจะผ่านด่านได้';
 quizNextBtn.textContent='รับตราผ่านด่าน ▶';
 quizNextBtn.classList.remove('hidden');
}
quizNextBtn.addEventListener('click',()=>{
 if(quizShowingResult){
  quizPanel.classList.add('hidden');quizActive=false;
  if(stage1Passed){
   openDialogue(farmerDepartureLines(),()=>{
    objective.textContent='ไปที่ท่าน้ำเพื่อขึ้นเรือเข้าสู่พระนคร';
   });
  }else{
   objective.textContent='กลับไปทบทวนบทเรียนอีกครั้ง';
  }
  return;
 }
 if(quizRetrying){quizRetrying=false;renderQuizQuestion();return;}
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
  if(stage1Passed)return;
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
