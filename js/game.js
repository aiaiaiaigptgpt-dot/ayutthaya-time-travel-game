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
let started=false,last=0,animationTime=0,coinFound=false,farmerTalked=false,quizActive=false,quizIndex=0,quizScore=0,quizShowingResult=false,quizRetrying=false,stage1Passed=false,farmIntroSeen=false;
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
 {id:'farm',bg:'stage1-farm.png',objective:'นี่คือที่ไหนกันนะ? เดินไปถามชาวนาดูสิ'},
 {id:'boat',bg:null,objective:'ด่านที่ ๒ : การเดินทางทางเรือเข้าสู่พระนคร'}
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
// แถบปุ่มสนทนา: ย้อนกลับชิดซ้าย และถัดไปชิดขวา
const dialogueNav=document.createElement('div');
dialogueNav.className='dialogue-nav';
const previousBtn=document.createElement('button');
previousBtn.type='button';
previousBtn.id='dialogue-prev-btn';
previousBtn.textContent='◀ ย้อนกลับ';
previousBtn.className=nextBtn.className;
previousBtn.disabled=true;
previousBtn.setAttribute('aria-label','ย้อนกลับไปอ่านข้อความก่อนหน้า');
const dialogueContent=nextBtn.parentNode;
dialogueContent.insertBefore(dialogueNav,nextBtn);
dialogueNav.append(previousBtn,nextBtn);

function showDialogueLine(){
 const d=dialogue[dialogueIndex];
 dialogueBox.classList.toggle('farmer-speaking',d.who==='farmer');
 dialogueBox.classList.toggle('boatman-speaking',d.who==='boatman');
 dialogueBox.classList.toggle('student-speaking',d.who==='student');
 speaker.textContent=d.who==='farmer'?'ชาวนา':d.who==='boatman'?'คนพายเรือ':playerName;
 dialogueText.textContent=typeof d.text==='function'?d.text():d.text;
 portrait.classList.remove('hidden');
 if(d.who==='farmer')portrait.src='farmer-'+d.emotion+'.png';
 else if(d.who==='boatman')portrait.src='boatman-'+(d.emotion==='smile'?'greeting':d.emotion)+'.png';
 else portrait.src='student-'+selectedGender+'-'+d.emotion+'.png';
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
 const done=dialogueDone;dialogueDone=null;
 if(done)done();
 else if(sceneIndex===4&&!stage2Passed)openBoatQuiz();
}
previousBtn.addEventListener('click',goBackDialogue);
nextBtn.addEventListener('click',advanceDialogue);
function startGame(){
 showScreen('game-screen');sceneIndex=0;coinFound=false;farmerTalked=false;quizActive=false;quizShowingResult=false;quizRetrying=false;stage1Passed=false;stage2Passed=false;farmIntroSeen=false;player.x=150;
 objective.textContent=scenes[0].objective;prompt.classList.add('hidden');
 if(!started){started=true;last=performance.now();requestAnimationFrame(frame);}
 openDialogue([
  student(()=>genderWord('วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า','วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า'),'normal'),
  student('วันนี้มีอะไรน่าสนใจระหว่างทางบ้างนะ?','curious')
 ]);
}
function goToScene(n,direction='forward'){
 sceneIndex=n;
 player.x=direction==='backward'?worldWidth-145:130;
 player.moving=false;
 if(n===4)scenes[n].bg=selectedGender==='girl'?'boat-ride-girl.png':'boat-ride-boy.png';
 objective.textContent=scenes[n].objective;
 prompt.classList.add('hidden');
 if(n===3&&!farmIntroSeen){
  farmIntroSeen=true;
  openDialogue([
   student('โอ๊ย... เกิดอะไรขึ้นกับฉันเนี่ย!?','surprised'),
   student('ที่นี่... ที่ไหนกัน? ทุกอย่างดูเหมือนสมัยก่อนเลย','worried'),
   student('ตรงนั้นมีชาวนาอยู่ ลองเดินไปถามดีกว่า','curious')
  ]);
 }
 if(n===4&&direction==='forward'){
  openDialogue(boatJourneyLines());
 }
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

// ===== บทสนทนาด่านที่ ๒: การเดินทางทางเรือ =====
function boatJourneyLines(){
 return [
  {who:'boatman',emotion:'normal',text:'ดีนะที่เอ็งมาทัน ไม่อย่างนั้นเรือเที่ยวนี้ข้าคงออกไปเสียก่อนแล้ว กว่าจะมีเรือเที่ยวต่อไป เอ็งคงต้องรออีกนานเลยล่ะ ฮ่า ๆ'},
  student(()=>genderWord('โชคดีจริง ๆ ครับ ถ้ามาช้ากว่านี้คงต้องรอนานแน่ ๆ แล้วเราจะใช้เวลาเดินทางนานไหมครับ?','โชคดีจริง ๆ ค่ะ ถ้ามาช้ากว่านี้คงต้องรอนานแน่ ๆ แล้วเราจะใช้เวลาเดินทางนานไหมคะ?'),'curious'),
  {who:'boatman',emotion:'explain',text:'ไม่นานดอก เดี๋ยวข้าจะพาเอ็งล่องเรือไปตามแม่น้ำ ประเดี๋ยวก็ถึงพระนครแล้ว'},
  student(()=>genderWord('ลุงครับ ผมสังเกตว่ามีเรืออยู่เต็มแม่น้ำเลย คนสมัยอยุธยาเดินทางด้วยเรือกันบ่อยหรือครับ?','ลุงคะ หนูสังเกตว่ามีเรืออยู่เต็มแม่น้ำเลย คนสมัยอยุธยาเดินทางด้วยเรือกันบ่อยหรือคะ?'),'curious'),
  {who:'boatman',emotion:'explain',text:'บ่อยสิเอ็ง! อยุธยามีแม่น้ำและคลองหลายสาย ผู้คนจึงนิยมใช้เรือเดินทางไปยังที่ต่าง ๆ'},
  student(()=>genderWord('อ๋อ! แบบนี้แม่น้ำก็คงสำคัญกับคนในสมัยอยุธยามากเลยสินะครับ','อ๋อ! แบบนี้แม่น้ำก็คงสำคัญกับคนในสมัยอยุธยามากเลยสินะคะ'),'curious'),
  {who:'boatman',emotion:'normal',text:'ถูกต้องแล้วเอ็ง ไม่ว่าจะไปตลาด ไปเยี่ยมญาติ หรือไปทำธุระ เรือก็เป็นพาหนะสำคัญของผู้คนในสมัยนี้'},
  student(()=>genderWord('ว้าว! ระหว่างทางมีเรือเต็มไปหมดเลยครับ บางลำก็มีของอยู่ในเรือด้วย','ว้าว! ระหว่างทางมีเรือเต็มไปหมดเลยค่ะ บางลำก็มีของอยู่ในเรือด้วย'),'surprised'),
  {who:'boatman',emotion:'point',text:'เอ็งลองมองดูสิ เรือแต่ละลำมีหน้าที่ต่างกัน บางลำใช้เดินทาง บางลำใช้ขนสินค้าไปขายตามตลาด'},
  student(()=>genderWord('แล้วเขาขนอะไรกันไปขายบ้างครับ?','แล้วเขาขนอะไรกันไปขายบ้างคะ?'),'curious'),
  {who:'boatman',emotion:'explain',text:'ก็มีข้าว ผลไม้ ปลา และสินค้าต่าง ๆ ที่ผู้คนนำมาซื้อขายกันจ้ะ'},
  student(()=>genderWord('แสดงว่าแม่น้ำไม่ได้มีไว้แค่เดินทาง แต่ยังช่วยให้ผู้คนค้าขายกันได้ด้วยสินะครับ','แสดงว่าแม่น้ำไม่ได้มีไว้แค่เดินทาง แต่ยังช่วยให้ผู้คนค้าขายกันได้ด้วยสินะคะ'),'normal'),
  {who:'boatman',emotion:'explain',text:'ใช่แล้วเอ็ง แม่น้ำช่วยให้ผู้คนขนสินค้าไปขายตามตลาด และติดต่อกับชุมชนอื่น ๆ ได้สะดวกขึ้น'},
  student(()=>genderWord('เข้าใจแล้วครับ ถ้าไม่มีแม่น้ำ การขนส่งสินค้าก็คงลำบากมากเลยนะครับ','เข้าใจแล้วค่ะ ถ้าไม่มีแม่น้ำ การขนส่งสินค้าก็คงลำบากมากเลยนะคะ'),'curious'),
  {who:'boatman',emotion:'normal',text:'นั่นสิเอ็ง แม่น้ำจึงมีความสำคัญต่อการค้าขายของกรุงศรีอยุธยามากทีเดียว'},
  student(()=>genderWord('ลุงครับ ทำไมบ้านหลายหลังถึงอยู่ใกล้แม่น้ำกันครับ?','ลุงคะ ทำไมบ้านหลายหลังถึงอยู่ใกล้แม่น้ำกันคะ?'),'curious'),
  {who:'boatman',emotion:'explain',text:'ก็เพราะแม่น้ำมีประโยชน์น่ะสิเอ็ง ผู้คนใช้น้ำในชีวิตประจำวัน ใช้เดินทาง และทำมาหากิน'},
  student(()=>genderWord('อ๋อ! ถ้าอยู่ใกล้แม่น้ำก็เดินทางและค้าขายได้สะดวกด้วยใช่ไหมครับ?','อ๋อ! ถ้าอยู่ใกล้แม่น้ำก็เดินทางและค้าขายได้สะดวกด้วยใช่ไหมคะ?'),'curious'),
  {who:'boatman',emotion:'explain',text:'ใช่แล้วเอ็ง ผู้คนบางส่วนยังประกอบอาชีพประมง จับปลาไปขายหรือทำอาหารอีกด้วย'},
  student(()=>genderWord('ฟังดูแล้วแม่น้ำมีประโยชน์กับผู้คนหลายอย่างเลยนะครับ','ฟังดูแล้วแม่น้ำมีประโยชน์กับผู้คนหลายอย่างเลยนะคะ'),'normal'),
  {who:'boatman',emotion:'normal',text:'แน่นอนสิเอ็ง แม่น้ำเป็นส่วนสำคัญของชีวิตผู้คนในสมัยอยุธยาเลยล่ะ'},
  student(()=>genderWord('ว้าว! นั่นใช่พระนครที่เรากำลังจะไปหรือเปล่าครับ?','ว้าว! นั่นใช่พระนครที่เรากำลังจะไปหรือเปล่าคะ?'),'surprised'),
  {who:'boatman',emotion:'point',text:'ใช่แล้วเอ็ง เรามาถึงท่าน้ำฝั่งพระนครแล้วล่ะ'},
  student(()=>genderWord('ขอบคุณลุงมากนะครับ วันนี้ผมได้เรียนรู้เรื่องการเดินทางและชีวิตของผู้คนในสมัยอยุธยาเยอะเลยครับ','ขอบคุณลุงมากนะคะ วันนี้หนูได้เรียนรู้เรื่องการเดินทางและชีวิตของผู้คนในสมัยอยุธยาเยอะเลยค่ะ'),'normal'),
  {who:'boatman',emotion:'greeting',text:'ฮ่า ๆ ไม่เป็นไรดอกเอ็ง เดินทางต่อไปก็ระวังตัวด้วยนะ ในพระนครยังมีเรื่องราวอีกมากมายรอให้เอ็งไปค้นหา'},
  student(()=>genderWord('ครับ! ผมจะลองเข้าไปสำรวจพระนครต่อไปครับ','ค่ะ! หนูจะลองเข้าไปสำรวจพระนครต่อไปค่ะ'),'normal')
 ];
}

// ===== แบบทดสอบด่านที่ ๒: การเดินทางทางเรือ =====
const boatQuiz=[
 {q:'เพราะเหตุใดผู้คนในสมัยอยุธยาจึงนิยมเดินทางทางเรือ?',options:['เพราะมีแม่น้ำและคลองหลายสาย','เพราะไม่มีพาหนะชนิดอื่น','เพราะทุกคนต้องเดินทางทางเรือเท่านั้น'],answer:0,explain:'อยุธยามีแม่น้ำและคลองหลายสาย ผู้คนจึงใช้เรือเดินทางได้สะดวก'},
 {q:'เรือในสมัยอยุธยามีประโยชน์อย่างไร?',options:['ใช้สำหรับตกแต่งบ้าน','ใช้เดินทางและขนส่งสินค้า','ใช้สำหรับจับสัตว์ป่าเท่านั้น'],answer:1,explain:'เรือใช้ทั้งเดินทางและขนส่งสินค้าไปยังตลาดและชุมชนต่าง ๆ'},
 {q:'ข้อใดเป็นสินค้าที่ผู้คนสามารถขนส่งทางเรือไปขายได้?',options:['โทรศัพท์และคอมพิวเตอร์','รถยนต์และจักรยาน','ข้าว ผลไม้ และปลา'],answer:2,explain:'ข้าว ผลไม้ และปลา เป็นตัวอย่างสินค้าที่ผู้คนขนส่งและนำไปซื้อขายกัน'},
 {q:'เพราะเหตุใดผู้คนจึงนิยมตั้งบ้านเรือนอยู่ใกล้แม่น้ำ?',options:['เพราะแม่น้ำมีประโยชน์ต่อการดำรงชีวิตและการเดินทาง','เพราะไม่ต้องประกอบอาชีพ','เพราะไม่มีพื้นที่อื่นให้อยู่อาศัย'],answer:0,explain:'ผู้คนใช้น้ำในชีวิตประจำวัน เดินทาง ทำมาหากิน และค้าขายได้สะดวก'},
 {q:'แม่น้ำและคลองมีส่วนช่วยให้กรุงศรีอยุธยาเจริญรุ่งเรืองอย่างไร?',options:['ทำให้ผู้คนไม่ต้องเดินทาง','ช่วยให้เดินทาง ขนส่งสินค้า และค้าขายได้สะดวก','ทำให้ผู้คนเลิกประกอบอาชีพค้าขาย'],answer:1,explain:'แม่น้ำและคลองเป็นเส้นทางสำคัญที่ช่วยเชื่อมผู้คน ชุมชน และตลาดเข้าด้วยกัน'}
];
let stage2Passed=false;
function openBoatQuiz(){
 quizIndex=0;quizScore=0;quizShowingResult=false;quizRetrying=false;quizActive=true;
 quizPanel.classList.remove('hidden');renderBoatQuizQuestion();
}
function renderBoatQuizQuestion(){
 const item=boatQuiz[quizIndex];
 quizHeading.textContent='ด่านที่ ๒ : การเดินทางทางเรือ';
 quizProgress.textContent='ข้อ '+(quizIndex+1)+' / '+boatQuiz.length;
 quizQuestion.textContent=item.q;quizAnswers.replaceChildren();quizFeedback.textContent='';
 quizNextBtn.classList.add('hidden');
 item.options.forEach((option,index)=>{
  const button=document.createElement('button');
  button.type='button';button.className='quiz-answer';button.textContent=['ก','ข','ค'][index]+'. '+option;
  button.addEventListener('click',()=>selectBoatQuizAnswer(index));
  quizAnswers.append(button);
 });
}
function selectBoatQuizAnswer(selected){
 const item=boatQuiz[quizIndex];
 const buttons=[...quizAnswers.querySelectorAll('button')];
 buttons.forEach((button,index)=>{
  button.disabled=true;
  if(index===selected&&selected===item.answer)button.classList.add('correct');
  if(index===selected&&selected!==item.answer)button.classList.add('incorrect');
 });
 if(selected===item.answer){quizScore++;quizFeedback.textContent='ถูกต้อง! '+item.explain;}
 else quizFeedback.textContent='ยังไม่ถูกต้องนะ ลองทบทวนบทสนทนาอีกครั้งได้ คำตอบที่ถูกคือ '+['ก','ข','ค'][item.answer]+'. '+item.options[item.answer]+'. '+item.explain;
 quizNextBtn.textContent=quizIndex===boatQuiz.length-1?'ดูผลการเรียนรู้ ▶':'ข้อต่อไป ▶';
 quizNextBtn.classList.remove('hidden');
}
function finishBoatQuiz(){
 quizShowingResult=true;stage2Passed=true;
 quizHeading.textContent='สรุปผลด่านที่ ๒';
 quizProgress.textContent='คะแนน '+quizScore+' / '+boatQuiz.length;
 quizQuestion.textContent='ทำแบบทดสอบครบแล้ว! ผ่านด่านการเดินทางทางเรือ';
 quizAnswers.replaceChildren();
 quizFeedback.textContent='เจ้าได้เรียนรู้เรื่องการเดินทางทางน้ำ การขนส่งสินค้า และวิถีชีวิตริมแม่น้ำแล้ว';
 quizNextBtn.textContent='จบด่านที่ ๒ ✓';quizNextBtn.classList.remove('hidden');
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
  quizRetrying=false;
  quizFeedback.textContent='คำตอบยังไม่ถูกต้องนะจ๊ะ คำใบ้: '+item.hint+' สามารถอ่านบทสนทนากับชาวนาอีกครั้งเพื่อทบทวนได้';
  quizNextBtn.textContent=quizIndex===farmerQuiz.length-1?'ดูผลการเรียนรู้ ▶':'ข้อต่อไป ▶';
 }
 quizNextBtn.classList.remove('hidden');
}
function openFarmerQuiz(){
 quizIndex=0;quizScore=0;quizShowingResult=false;quizRetrying=false;quizActive=true;
 quizPanel.classList.remove('hidden');renderQuizQuestion();
}
function finishFarmerQuiz(){
 quizShowingResult=true;
 // เมื่อทำครบทุกข้อ ถือว่าผ่านด่านและปลดล็อกพื้นที่ถัดไป คะแนนเก็บไว้เพื่อสะท้อนผลการเรียนรู้
 stage1Passed=true;
 quizHeading.textContent='สรุปผลด่านที่ ๑';
 quizProgress.textContent='คะแนน '+quizScore+' / '+farmerQuiz.length;
 quizQuestion.textContent='ทำแบบทดสอบครบแล้ว! ผ่านด่านวิถีชีวิตชาวนา';
 quizAnswers.replaceChildren();
 quizFeedback.textContent='ได้รับตราผ่านด่านที่ ๑ แล้ว สามารถเดินทางต่อหรือย้อนกลับมาทบทวนความรู้ได้ทุกเมื่อ';
 quizNextBtn.textContent='ไปต่อ ▶';
 quizNextBtn.classList.remove('hidden');
}
quizNextBtn.addEventListener('click',()=>{
 const isBoatQuiz=quizHeading.textContent.includes('ด่านที่ ๒')||quizHeading.textContent.includes('สรุปผลด่านที่ ๒');
 if(isBoatQuiz){
  if(quizShowingResult){
   quizPanel.classList.add('hidden');quizActive=false;
   objective.textContent='ด่านที่ ๒ สำเร็จแล้ว เดินทางต่อหรือย้อนกลับไปสำรวจได้';
   return;
  }
  if(quizIndex<boatQuiz.length-1){quizIndex++;renderBoatQuizQuestion();}
  else finishBoatQuiz();
  return;
 }
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
 if(quizIndex<farmerQuiz.length-1){quizIndex++;renderQuizQuestion();}
 else finishFarmerQuiz();
});
function interact(){
 if(quizActive)return;
 if(dialogue){advanceDialogue();return;}
 const s=scenes[sceneIndex].id;
 if(s==='boat'){
  if(stage2Passed){
   openDialogue([{who:'boatman',emotion:'normal',text:'เอ็งกลับมาอีกแล้วรึ หากอยากทบทวนเรื่องการเดินทางทางเรือ ข้าก็เล่าให้ฟังได้เสมอ'}]);
  }else openDialogue(boatJourneyLines());
  return;
 }
 if(s==='coin'&&Math.abs(player.x-770)<140){
  const firstDiscovery=!coinFound;
  coinFound=true;
  openDialogue(coinLines,()=>{if(firstDiscovery)goToScene(3);});
  return;
 }
 if(s==='farm'&&Math.abs(player.x-farmer.x)<260){
  farmerTalked=true;
  if(stage1Passed){
   // ผ่านด่านแล้วก็กลับมาคุยเพื่อทบทวนได้ โดยไม่เปิดแบบทดสอบซ้ำ
   openDialogue(farmerLines().slice(0,-1));
  }else{
   openDialogue(farmerLines(),openFarmerQuiz);
  }
  return;
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
 // เดินข้ามขอบฉากได้ทั้งสองทิศทาง เพื่อกลับไปสำรวจพื้นที่เดิม
 if(player.x>worldWidth-145&&(
  (sceneIndex<3&&(id==='school'||id==='road'||(id==='coin'&&coinFound)))||
  (id==='farm'&&stage1Passed)
 )){
  goToScene(sceneIndex+1,'forward');return;
 }
 if(player.x<75&&sceneIndex>0){
  goToScene(sceneIndex-1,'backward');return;
 }
 let message='';
 if(id==='coin'&&Math.abs(player.x-770)<140)message=coinFound?'กด E เพื่ออ่านเรื่องเงินพดด้วงอีกครั้ง':'กด E เพื่อตรวจดูเงินพดด้วง';
 if(id==='farm'&&Math.abs(player.x-farmer.x)<260)message=stage1Passed?'กด E เพื่อสนทนาและทบทวนกับชาวนา':'กด E เพื่อคุยกับชาวนา';
 if(id==='boat')message='กด E เพื่อฟังเรื่องราวระหว่างเดินทางอีกครั้ง';
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
 // ภาพฉากเรือมีนักเรียนและคนพายเรืออยู่ในภาพแล้ว จึงไม่วาดตัวละครซ้ำทับ
 if(id==='boat')return;
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
