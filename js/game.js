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
let started=false,last=0,animationTime=0,coinFound=false,farmerTalked=false,quizActive=false,quizIndex=0,quizScore=0,quizShowingResult=false,quizRetrying=false,stage1Passed=false,farmIntroSeen=false,stage3Passed=false,stage4Passed=false,portIntroSeen=false,stage5Passed=false,stage6Passed=false;
const worldWidth=1280;
const player={x:150,w:150,h:270,speed:320,facing:1,moving:false};
const farmer={x:1000,w:225,h:330};
const merchant={x:1040,w:236,h:335};
// Stage 4: student enters at the left marker; the port officer stands at the right marker.
const portOfficer={x:1120,w:220,h:340};
const chineseMerchant={x:1035,w:250,h:365};
const foreignExplorer={x:1035,w:250,h:365};
const images={};
function image(path){if(!images[path]){const img=new Image();img.decoding='async';img.loading='eager';img.src=path;images[path]=img;}return images[path];}
// เตรียมภาพฉากถัดไปล่วงหน้า เพื่อลดเวลารอเมื่อผู้เล่นเดินทางเปลี่ยนด่าน
function preloadScene(index){const scene=scenes[index];if(scene&&scene.bg)image(scene.bg);}
// โหลดภาพใบหน้าตัวละครทุกอารมณ์ไว้ก่อนเริ่มบทสนทนา ลดอาการสะดุดตอนกด “ถัดไป”
function preloadDialoguePortraits(){
 const emotions=['normal','curious','surprised','worried','explain','smile','point'];
 const files=[];
 for(const gender of ['boy','girl'])for(const emotion of emotions)files.push(`student-${gender}-${emotion}.webp`);
 for(const emotion of ['normal','explain','smile','point'])files.push(`farmer-${emotion}.webp`);
 for(const emotion of ['normal','explain','point','greeting'])files.push(`boatman-${emotion}.webp`);
 for(const emotion of ['smile','explain','point'])files.push(`merchant-${emotion}.webp`);
 files.push('chinese_merchant_happy.png','chinese_merchant_explain.png','chinese_merchant_point_left.png','chinese_merchant_surprised.png','chinese_merchant_present_gold.png');
 files.push('foreign_explorer_friendly.png','foreign_explorer_explaining.png','foreign_explorer_pointing.png','foreign_explorer_surprised.png','foreign_explorer_laughing..png','foreign_explorer_welcoming.png');
 files.forEach(path=>{const img=image(path);if(typeof img.decode==='function')img.decode().catch(()=>{});});
}
// ภาพตัวละครและฉากอื่น ๆ จะถูกโหลดเมื่อจำเป็น
const scenes=[
 {id:'school',bg:'intro-school.webp',objective:'เดินไปทางขวาเพื่อกลับบ้าน'},
 {id:'road',bg:'intro-road.webp',objective:'เดินต่อไปตามทางกลับบ้าน'},
 {id:'coin',bg:'pod-duang.webp',objective:'มีบางอย่างแปลก ๆ อยู่บนพื้น ลองเดินไปสำรวจ'},
 {id:'farm',bg:'stage1-farm.webp',objective:'นี่คือที่ไหนกันนะ? เดินไปถามชาวนาดูสิ'},
 {id:'boat',bg:null,objective:'ด่านที่ ๒ : การเดินทางทางเรือเข้าสู่พระนคร'},
 {id:'market',bg:'marketplace-bg.jpg',objective:'ด่านที่ ๓ : สำรวจตลาดในกรุงศรีอยุธยา'},
 {id:'port',bg:'stage4-port.webp',objective:'ด่านที่ ๔ : เดินไปทางขวาเพื่อสำรวจท่ารับสินค้าจากหัวเมือง'},
 {id:'foreignTrade',bg:'foreign_trade_district_bg.png',objective:'ด่านที่ ๕ : เดินไปพูดคุยกับพ่อค้าชาวจีนในย่านการค้าต่างชาติ'},
 {id:'internationalPort',bg:'international_trade_port.png',objective:'ด่านที่ ๖ : เดินไปพูดคุยกับกัปตันฌองที่ท่าเรือการค้าต่างประเทศ'}
];
// Display a clear loading state while the current scene's actual image is downloading.
let loadingRequest=0;
function waitForVisual(path){
 const request=++loadingRequest;
 const overlay=$('loading-overlay');
 overlay.classList.remove('hidden');
 const img=image(path);
 const finish=()=>{
  if(request!==loadingRequest)return;
  overlay.classList.add('hidden');
 };
 if(img.complete){finish();return;}
 img.addEventListener('load',finish,{once:true});
 img.addEventListener('error',finish,{once:true});
}
function showScreen(id){
 for(const s of screens)$(s).classList.toggle('hidden',s!==id);
 $('controls').classList.toggle('hidden',id!=='game-screen');
 const screen=$(id);
 const bg=screen.dataset.bg;
 if(bg){
  screen.style.backgroundImage='url("'+bg+'")';
  waitForVisual(bg);
 }else if(id==='game-screen')waitForVisual(scenes[sceneIndex].bg);
 else {loadingRequest++;$('loading-overlay').classList.add('hidden');}
}
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

let portraitRequestId=0;
function showDialogueLine(){
 const d=dialogue[dialogueIndex];
 dialogueBox.classList.toggle('farmer-speaking',d.who==='farmer');
 dialogueBox.classList.toggle('boatman-speaking',d.who==='boatman');
 dialogueBox.classList.toggle('merchant-speaking',d.who==='merchant');
 dialogueBox.classList.toggle('student-speaking',d.who==='student');
 // ด่านตลาด (ด่าน 3): นักเรียนอยู่ซ้ายหันขวา ส่วนแม่ค้าอยู่ขวาหันซ้าย
 // ด่านเรือเท่านั้นที่ใช้ภาพนักเรียนด้านขวาของกล่องสนทนา
 dialogueBox.classList.toggle('student-left',d.who==='student'&&sceneIndex!==4);
 dialogueBox.classList.toggle('student-right',d.who==='student'&&sceneIndex===4);
 // Market scene has its own fixed portrait side and facing direction.
 dialogueBox.classList.toggle('market-student',sceneIndex===5&&d.who==='student');
 dialogueBox.classList.toggle('market-merchant',sceneIndex===5&&d.who==='merchant');
 dialogueBox.classList.toggle('port-student',sceneIndex===6&&d.who==='student');
 dialogueBox.classList.toggle('port-officer',sceneIndex===6&&d.who==='portOfficer');
 // Port officer point artwork is already facing left; other expressions need mirroring.
 dialogueBox.classList.toggle('port-officer-point',sceneIndex===6&&d.who==='portOfficer'&&d.emotion==='point');
  dialogueBox.classList.toggle('foreign-student',sceneIndex===7&&d.who==='student');
  dialogueBox.classList.toggle('foreign-merchant',sceneIndex===7&&d.who==='chineseMerchant');
 dialogueBox.classList.toggle('explorer-student',sceneIndex===8&&d.who==='student');
 dialogueBox.classList.toggle('explorer-speaking',sceneIndex===8&&d.who==='foreignExplorer');
 speaker.textContent=d.who==='farmer'?'ชาวนา':d.who==='boatman'?'คนพายเรือ':d.who==='merchant'?'แม่ค้า':d.who==='portOfficer'?'นายท่ารับสินค้า':d.who==='chineseMerchant'?'พ่อค้าชาวจีน':d.who==='foreignExplorer'?'กัปตันฌอง':playerName;
 dialogueText.textContent=typeof d.text==='function'?d.text():d.text;
 portrait.classList.remove('hidden');
 let portraitPath;
 if(d.who==='farmer')portraitPath='farmer-'+d.emotion+'.webp';
 else if(d.who==='boatman')portraitPath='boatman-'+(d.emotion==='smile'?'greeting':d.emotion)+'.webp';
 else if(d.who==='merchant')portraitPath='merchant-'+d.emotion+'.webp';
 else if(d.who==='portOfficer')portraitPath='port-officer-'+d.emotion+'.webp';
  else if(d.who==='chineseMerchant')portraitPath=({normal:'chinese_merchant_happy.png',smile:'chinese_merchant_happy.png',explain:'chinese_merchant_explain.png',point:'chinese_merchant_point_left.png',surprised:'chinese_merchant_surprised.png',proud:'chinese_merchant_present_gold.png'})[d.emotion]||'chinese_merchant_happy.png';
 else if(d.who==='foreignExplorer')portraitPath=({normal:'foreign_explorer_friendly.png',smile:'foreign_explorer_welcoming.png',explain:'foreign_explorer_explaining.png',point:'foreign_explorer_pointing.png',surprised:'foreign_explorer_surprised.png',laugh:'foreign_explorer_laughing..png',proud:'foreign_explorer_welcoming.png'})[d.emotion]||'foreign_explorer_friendly.png';
 else portraitPath='student-'+selectedGender+'-'+d.emotion+'.webp';
 const portraitAsset=image(portraitPath);
 // Do not display the previous speaker while a new portrait is downloading.
 // Each line keeps its own request ID so late network responses cannot overwrite it.
 const portraitRequest=++portraitRequestId;
 portrait.style.visibility='hidden';
 portrait.removeAttribute('src');
 portrait.alt=speaker.textContent;
 const applyPortrait=()=>{
  if(portraitRequest!==portraitRequestId||!dialogue||dialogue[dialogueIndex]!==d)return;
  if(portraitAsset.naturalWidth){portrait.src=portraitAsset.src;portrait.style.visibility='visible';}
 };
 if(portraitAsset.complete)applyPortrait();
 else {
  portraitAsset.addEventListener('load',applyPortrait,{once:true});
  portraitAsset.addEventListener('error',()=>{if(portraitRequest===portraitRequestId)portrait.alt='ไม่สามารถโหลดภาพผู้พูด';},{once:true});
 }
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
 showScreen('game-screen');sceneIndex=0;coinFound=false;farmerTalked=false;quizActive=false;quizShowingResult=false;quizRetrying=false;stage1Passed=false;stage2Passed=false;stage3Passed=false;stage4Passed=false;portIntroSeen=false;stage5Passed=false;stage6Passed=false;farmIntroSeen=false;player.x=150;
 objective.textContent=scenes[0].objective;prompt.classList.add('hidden');
  preloadScene(0);preloadScene(1);
 if(!started){started=true;last=performance.now();requestAnimationFrame(frame);}
 openDialogue([
  student(()=>genderWord('วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า','วันนี้เลิกเรียนแล้ว รีบกลับบ้านดีกว่า'),'normal'),
  student('วันนี้มีอะไรน่าสนใจระหว่างทางบ้างนะ?','curious')
 ]);
}
function goToScene(n,direction='forward'){
 sceneIndex=n;
 player.x=n===6?155:(direction==='backward'?worldWidth-145:130);
 player.facing=n===6?1:direction==='backward'?-1:1;
 player.moving=false;
 if(n===4)scenes[n].bg=selectedGender==='girl'?'boat-ride-girl.webp':'boat-ride-boy.webp';
 preloadScene(n);preloadScene(n+1);
 waitForVisual(scenes[n].bg);
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

// ===== บทสนทนาด่านที่ ๓: ตลาดในกรุงศรีอยุธยา =====
function merchantLines(){
 return [
  {who:'student',emotion:'normal',text:genderWord('เฮ้อ... ในที่สุดก็มาถึงสักที! ตลาดที่นี่ใหญ่โตมากเลยนะ มีร้านค้าและสินค้ามากมายเต็มไปหมด ลองเดินเข้าไปสำรวจดูหน่อยดีกว่า!','เฮ้อ... ในที่สุดก็มาถึงสักที! ตลาดที่นี่ใหญ่โตมากเลยนะ มีร้านค้าและสินค้ามากมายเต็มไปหมด ลองเดินเข้าไปสำรวจดูหน่อยดีกว่า!')},
  {who:'merchant',emotion:'smile',text:genderWord('อ้าว! พ่อหนุ่ม มาจากไหนกันจ๊ะ ดูท่าทางไม่คุ้นหน้าคุ้นตา สนใจแวะชมสินค้าของข้าก่อนไหมจ๊ะ?','อ้าว! แม่หนู มาจากไหนกันจ๊ะ ดูท่าทางไม่คุ้นหน้าคุ้นตา สนใจแวะชมสินค้าของข้าก่อนไหมจ๊ะ?')},
  student(()=>genderWord('สวัสดีครับ ที่นี่คือตลาดอะไรหรือครับ? ผมเห็นมีร้านค้าเยอะแยะเต็มไปหมดเลย','สวัสดีค่ะ ที่นี่คือตลาดอะไรหรือคะ? หนูเห็นมีร้านค้าเยอะแยะเต็มไปหมดเลย'),'curious'),
  {who:'merchant',emotion:'explain',text:'ที่นี่เรียกว่าตลาดหน้าคุกจ้ะ เป็นตลาดที่ผู้คนนำสินค้ามาซื้อขายแลกเปลี่ยนกัน มีทั้งของกิน ของใช้ ผัก ผลไม้ และสินค้าอีกมากมาย'},
  student(()=>genderWord('แล้วสินค้าที่นำมาขายที่นี่มาจากที่ไหนบ้างครับ?','แล้วสินค้าที่นำมาขายที่นี่มาจากที่ไหนบ้างคะ?'),'curious'),
  {who:'merchant',emotion:'point',text:'สินค้าไม่ได้มาจากในกรุงศรีอยุธยาเท่านั้นดอกจ้ะ ชาวบ้านจากชุมชนและหัวเมืองต่าง ๆ ก็นำผลผลิตของตนมาขายที่นี่ด้วย บางคนเดินทางมาจากเมืองละโว้ บางคนก็มาจากพิษณุโลก'},
  student(()=>genderWord('แสดงว่าผู้คนจากเมืองอื่นก็เดินทางมาค้าขายที่นี่ด้วยหรือครับ?','แสดงว่าผู้คนจากเมืองอื่นก็เดินทางมาค้าขายที่นี่ด้วยหรือคะ?'),'surprised'),
  {who:'merchant',emotion:'smile',text:'ใช่แล้วจ้ะ ต่างก็นำสินค้าจากบ้านเมืองของตนมาซื้อขายแลกเปลี่ยนกัน ทำให้ตลาดมีสินค้าหลากหลายขึ้น'},
  student(()=>genderWord('แล้วพวกเขาขนสินค้ามาที่ตลาดกันอย่างไรครับ?','แล้วพวกเขาขนสินค้ามาที่ตลาดกันอย่างไรคะ?'),'curious'),
  {who:'merchant',emotion:'explain',text:'มีหลายวิธีจ้ะ บางคนบรรทุกสินค้ามาทางเรือ บางคนก็นำเกวียนเทียมวัวหรือควาย ขนผลผลิตจากบ้านเมืองของตนมาขาย'},
  student(()=>genderWord('ว้าว! แสดงว่ามีทั้งคนที่เดินทางมาทางน้ำและทางบกเลยนะครับ','ว้าว! แสดงว่ามีทั้งคนที่เดินทางมาทางน้ำและทางบกเลยนะคะ'),'surprised'),
  {who:'merchant',emotion:'explain',text:'ถูกต้องจ้ะ กรุงศรีอยุธยามีแม่น้ำและคลองหลายสาย การเดินทางทางน้ำจึงสำคัญต่อการขนส่ง ส่วนทางบกก็ใช้เกวียนและสัตว์เป็นพาหนะได้เช่นกัน'},
  student(()=>genderWord('ตลาดแห่งนี้คงสำคัญมากเลยนะครับ เพราะผู้คนจากหลายเมืองมาพบปะและค้าขายกัน','ตลาดแห่งนี้คงสำคัญมากเลยนะคะ เพราะผู้คนจากหลายเมืองมาพบปะและค้าขายกัน'),'normal'),
  {who:'merchant',emotion:'smile',text:'ใช่แล้วจ้ะ ตลาดเป็นแหล่งซื้อขาย แลกเปลี่ยนสินค้า และเป็นที่พบปะของผู้คนด้วย'},
  student(()=>genderWord('ผมเห็นมีร้านค้าอยู่ทางโน้นอีกด้วย ที่นั่นขายอะไรหรือครับ?','หนูเห็นมีร้านค้าอยู่ทางโน้นอีกด้วย ที่นั่นขายอะไรหรือคะ?'),'curious'),
  {who:'merchant',emotion:'point',text:'ทางโน้นมีพ่อค้าชาวต่างชาตินำสินค้าจากบ้านเมืองของตนมาขายด้วยนะจ๊ะ ทั้งเครื่องถ้วย เครื่องแก้ว ผ้า และของแปลกตาอีกหลายอย่าง'},
  student(()=>genderWord('พ่อค้าชาวต่างชาติด้วยหรือครับ? น่าสนใจมากเลย ผมอยากไปดูเสียแล้ว','พ่อค้าชาวต่างชาติด้วยหรือคะ? น่าสนใจมากเลย หนูอยากไปดูเสียแล้ว'),'surprised'),
  {who:'merchant',emotion:'smile',text:'ถ้าเช่นนั้นก็ลองเดินไปทางโน้นสิจ๊ะ มีพ่อค้าชาวฝรั่งและชาวต่างชาติอยู่ เจ้าอาจได้พบเห็นสินค้าแปลกใหม่ที่ไม่เคยเห็นมาก่อนก็ได้นะ'}
 ];
}

function handleStageQuizAnswer(selected,items,letters,hint){
 const item=items[quizIndex];
 const buttons=[...quizAnswers.querySelectorAll('button')];
 if(selected!==item.answer){
  buttons[selected].disabled=true;
  buttons[selected].classList.add('incorrect');
  quizFeedback.textContent=hint||'ยังไม่ถูกต้อง ลองคิดอีกครั้งนะ อ่านคำถามและทบทวนความรู้ แล้วเลือกคำตอบใหม่ได้เลย';
  quizNextBtn.classList.add('hidden');
  return;
 }
 buttons.forEach((button,index)=>{
  button.disabled=true;
  if(index===selected)button.classList.add('correct');
 });
 quizScore++;
 quizFeedback.textContent='ถูกต้อง! '+item.explain;
 quizNextBtn.textContent=quizIndex===items.length-1?'ดูผลการเรียนรู้ ▶':'ข้อต่อไป ▶';
 quizNextBtn.classList.remove('hidden');
}


// ===== ด่านที่ ๔ : ท่ารับสินค้าจากหัวเมือง — นายท่า =====
function portOfficerLine(text,emotion='normal'){return {who:'portOfficer',emotion,text};}
function portDialogueLines(){
 return [
  student('เมื่อกี้แม่ค้าบอกให้ลองเดินมาทางนี้นี่นา... โอ้โห! มีเรือเต็มไปหมดเลย แถมยังมีคนกำลังขนสินค้าอยู่ด้วย ที่นี่คือที่ไหนกันนะ?','curious'),
  portOfficerLine('เฮ้! เจ้าน่ะ! หยุดก่อน! จะไปแห่งใดกัน? มีสินค้ามาขาย หรือคิดจะมาซื้อของอย่างนั้นรึ?','point'),
  student(()=>genderWord('อ๊ะ! ผมเหรอครับ? ผมไม่ได้เอาของมาขายครับ แค่อยากเดินเข้าไปดูข้างในเท่านั้นเอง','อ๊ะ! หนูเหรอคะ? หนูไม่ได้เอาของมาขายค่ะ แค่อยากเดินเข้าไปดูข้างในเท่านั้นเอง'),'surprised'),
  portOfficerLine('อย่างนั้นรึ? ที่นี่มิใช่ที่ให้เดินเข้าออกตามใจนะเจ้า ข้ากำลังดูแลการขนถ่ายสินค้าจากหัวเมืองอยู่ ผู้ใดจะผ่านไปก็ควรแจ้งให้ข้าทราบก่อน','normal'),
  student(()=>genderWord('ขอโทษครับ แล้วคุณลุงเป็นใครหรือครับ? ทำไมถึงต้องตรวจสินค้าที่นี่ด้วย?','ขอโทษค่ะ แล้วคุณลุงเป็นใครหรือคะ? ทำไมถึงต้องตรวจสินค้าที่นี่ด้วย?'),'curious'),
  portOfficerLine('ข้าเป็นเจ้าพนักงานประจำท่ารับสินค้า มีหน้าที่ดูแลความเรียบร้อยและจดบันทึกสินค้าที่เรือนำเข้ามา เจ้าลองมองดูรอบ ๆ สิ มีเรือเข้ามาเทียบท่าไม่ขาดสายเลย','explain'),
  student(()=>genderWord('แล้วสินค้าที่อยู่บนเรือเหล่านั้นมาจากไหนกันครับ?','แล้วสินค้าที่อยู่บนเรือเหล่านั้นมาจากไหนกันคะ?'),'curious'),
  portOfficerLine('มาจากหัวเมืองต่าง ๆ นั่นเอง หัวเมืองก็คือเมืองที่อยู่ในเขตการปกครองหรือมีความสัมพันธ์กับกรุงศรีอยุธยา แต่ละแห่งมีสินค้าของตนเอง แล้วส่งมาค้าขายยังพระนคร','explain'),
  student(()=>genderWord('แล้วมีสินค้าอะไรบ้างครับ? ผมเห็นทั้งกระสอบ ตะกร้าผลไม้ แล้วก็ลังไม้เต็มไปหมดเลย','แล้วมีสินค้าอะไรบ้างคะ? หนูเห็นทั้งกระสอบ ตะกร้าผลไม้ แล้วก็ลังไม้เต็มไปหมดเลย'),'curious'),
  portOfficerLine('มีทั้งข้าว ผลไม้ ปลาแห้ง ไม้ และของป่าหลายชนิด บางอย่างนำไปขายในตลาด บางอย่างก็ส่งต่อให้ผู้ที่ต้องการใช้ประโยชน์','point'),
  student(()=>genderWord('แล้วทำไมถึงใช้เรือขนสินค้ากันเยอะจังครับ? ไม่ใช้เกวียนขนมาทั้งหมดเหรอครับ?','แล้วทำไมถึงใช้เรือขนสินค้ากันเยอะจังคะ? ไม่ใช้เกวียนขนมาทั้งหมดเหรอคะ?'),'curious'),
  portOfficerLine('อยุธยามีแม่น้ำลำคลองเชื่อมต่อกันหลายสาย เรือจึงบรรทุกสินค้าได้มากและเดินทางได้สะดวก ส่วนเกวียนก็ยังใช้ขนส่งทางบกอยู่เช่นกัน','explain'),
  student('เข้าใจแล้ว! ที่นี่ก็เหมือนจุดรับสินค้าจากเมืองต่าง ๆ ก่อนส่งต่อไปขายหรือใช้งานในพระนครสินะ','normal'),
  portOfficerLine('ถูกต้อง! เจ้าช่างเข้าใจได้รวดเร็ว ท่ารับสินค้าแห่งนี้ช่วยให้สินค้าเดินทางมาถึงผู้คนในกรุงศรีอยุธยา และทำให้การค้าขายคึกคักยิ่งขึ้น','smile'),
  student(()=>genderWord('คุณลุงครับ แล้วถ้าผมอยากไปดูสินค้าจากต่างประเทศบ้าง ต้องไปทางไหนครับ?','คุณลุงคะ แล้วถ้าหนูอยากไปดูสินค้าจากต่างประเทศบ้าง ต้องไปทางไหนคะ?'),'curious'),
  portOfficerLine('อ้อ! เจ้าอยากไปย่านการค้าต่างชาติอย่างนั้นรึ? ที่นั่นมีพ่อค้าจากแดนไกลเข้ามาค้าขายอยู่มาก ทั้งชาวจีนและชาวตะวันตก','point'),
  student('จริงเหรอ! อยากเห็นจังเลยว่าพวกเขานำสินค้าอะไรมาขายกันบ้าง!','surprised'),
  portOfficerLine('ใจเย็นก่อนเจ้า! ก่อนจะเดินทางต่อ ข้าอยากรู้ว่าเจ้าเข้าใจเรื่องท่ารับสินค้าแห่งนี้ดีเพียงใด','normal'),
  student(()=>genderWord('หมายความว่าผมต้องตอบคำถามก่อนใช่ไหมครับ?','หมายความว่าหนูต้องตอบคำถามก่อนใช่ไหมคะ?'),'curious'),
  portOfficerLine('ถูกแล้ว! หากเจ้าตอบคำถามของข้าครบทั้งห้าข้อ ข้าจะอนุญาตให้เจ้าเดินทางต่อไปยังย่านการค้าต่างชาติ!','smile'),
  student('ตกลง! พร้อมแล้ว!','normal')
 ];
}
const portQuiz=[
 {q:'นายท่ารับสินค้ามีหน้าที่สำคัญอย่างไร?',options:['ดูแลความเรียบร้อยและจดบันทึกสินค้าที่เข้ามา','ขายสินค้าให้ชาวต่างชาติเพียงอย่างเดียว','ควบคุมการเพาะปลูกของชาวนา','สร้างเรือสำหรับเดินทางไปต่างประเทศ'],answer:0,explain:'นายท่าดูแลความเรียบร้อยและจดบันทึกสินค้าที่เรือขนเข้ามา',hint:'ลองนึกถึงตอนที่นายท่าแนะนำหน้าที่ของตนเอง'},
 {q:'สินค้าที่นำเข้ามายังท่ารับสินค้าส่วนหนึ่งมาจากที่ใด?',options:['พระราชวังเพียงแห่งเดียว','หัวเมืองต่าง ๆ ที่ติดต่อกับกรุงศรีอยุธยา','ย่านการค้าต่างชาติเท่านั้น','เรือจากต่างประเทศทั้งหมด'],answer:1,explain:'สินค้าจากหัวเมืองต่าง ๆ ถูกส่งมาค้าขายในพระนคร',hint:'นายท่าอธิบายถึงเมืองต่าง ๆ ที่ส่งสินค้ามาค้าขายในพระนคร'},
 {q:'ข้อใดเป็นกลุ่มสินค้าที่นายท่ากล่าวถึงในบทสนทนา?',options:['รถยนต์ เครื่องบิน และโทรศัพท์','ทองคำเพียงชนิดเดียว','ข้าว ผลไม้ ปลาแห้ง ไม้ และของป่า','เครื่องใช้ไฟฟ้าและเครื่องจักร'],answer:2,explain:'นายท่ากล่าวถึงข้าว ผลไม้ ปลาแห้ง ไม้ และของป่าหลายชนิด',hint:'ลองนึกถึงสิ่งของที่วางอยู่ตามท่าน้ำและบนเรือ'},
 {q:'เหตุใดเรือจึงเป็นพาหนะสำคัญในการขนส่งสินค้าในสมัยอยุธยา?',options:['เพราะไม่สามารถใช้เกวียนได้เลย','เพราะทุกหัวเมืองตั้งอยู่กลางทะเล','เพราะเรือใช้เดินทางบนบกได้','เพราะมีแม่น้ำลำคลองเชื่อมต่อกัน และเรือบรรทุกสินค้าได้มาก'],answer:3,explain:'แม่น้ำลำคลองช่วยให้เรือขนส่งสินค้าปริมาณมากได้สะดวก',hint:'นายท่าพูดถึงแม่น้ำลำคลองและความสามารถในการบรรทุกของของเรือ'},
 {q:'ท่ารับสินค้าจากหัวเมืองมีความสำคัญต่อเศรษฐกิจของกรุงศรีอยุธยาอย่างไร?',options:['ทำให้สินค้าจากหลายพื้นที่เข้าสู่พระนครและส่งต่อไปค้าขายได้','ทำให้ทุกหัวเมืองเลิกค้าขายกัน','ทำให้ประชาชนไม่ต้องใช้สินค้าอีกต่อไป','ทำให้การขนส่งทางน้ำหยุดลง'],answer:0,explain:'ท่าน้ำช่วยรับและส่งต่อสินค้าจากหลายพื้นที่เพื่อให้ผู้คนในพระนครซื้อขายและใช้ประโยชน์',hint:'ลองคิดว่าสินค้าจากหัวเมืองเดินทางผ่านท่าน้ำไปถึงผู้ซื้อได้อย่างไร'}
];
function openPortQuiz(){
 quizIndex=0;quizScore=0;quizShowingResult=false;quizRetrying=false;quizActive=true;
 quizPanel.classList.remove('hidden');renderPortQuizQuestion();
}
function renderPortQuizQuestion(){
 const item=portQuiz[quizIndex];
 quizHeading.textContent='ด่านที่ ๔ : ท่ารับสินค้าจากหัวเมือง';
 quizProgress.textContent='ข้อ '+(quizIndex+1)+' / '+portQuiz.length;
 quizQuestion.textContent=item.q;quizAnswers.replaceChildren();quizFeedback.textContent='';
 quizNextBtn.classList.add('hidden');
 item.options.forEach((option,index)=>{
  const button=document.createElement('button');
  button.type='button';button.className='quiz-answer';button.textContent=['ก','ข','ค','ง'][index]+'. '+option;
  button.addEventListener('click',()=>selectPortQuizAnswer(index));
  quizAnswers.append(button);
 });
}
function selectPortQuizAnswer(selected){
 const item=portQuiz[quizIndex];
 handleStageQuizAnswer(selected,portQuiz,['ก','ข','ค','ง'],'คำตอบยังไม่ถูกต้องนะ คำใบ้: '+item.hint+' ลองเลือกอีกครั้ง');
}
function finishPortQuiz(){
 quizShowingResult=true;stage4Passed=true;
 quizHeading.textContent='สรุปผลด่านที่ ๔';
 quizProgress.textContent='คะแนน '+quizScore+' / '+portQuiz.length;
 quizQuestion.textContent='ตอบถูกครบทั้ง ๕ ข้อ! ผ่านด่านท่ารับสินค้าจากหัวเมือง';
 quizAnswers.replaceChildren();
 quizFeedback.textContent='นายท่าอนุญาตให้เดินทางต่อไปยังย่านการค้าต่างชาติแล้ว (ด่านที่ ๕ จะเปิดเมื่อเตรียมฉากเสร็จ)';
 quizNextBtn.textContent='กลับไปสำรวจท่าเรือ ▶';
 quizNextBtn.classList.remove('hidden');
}


// ===== Stage 5: foreign trade district =====
function chineseMerchantLine(text,emotion='normal'){return {who:'chineseMerchant',emotion,text};}
function foreignTradeDialogueLines(){return [
 student('โห! ที่นี่มีร้านค้าเยอะแยะเลย แถมยังมีผู้คนแต่งตัวแตกต่างกันเต็มไปหมด ที่นี่คงเป็นย่านการค้าต่างชาติที่นายท่าพูดถึงแน่ ๆ','curious'),
 student('ลองเข้าไปดูสินค้ากันหน่อยดีกว่า!','normal'),
 chineseMerchantLine('ยินดีต้อนรับพ่อหนุ่มน้อย! หรือแม่หนูน้อย! สนใจชมสินค้าจากแดนไกลของข้าบ้างหรือไม่?','smile'),
 student(()=>genderWord('เอ๊ะ! คุณลุงเป็นพ่อค้าจากเมืองจีนหรือครับ?','เอ๊ะ! คุณลุงเป็นพ่อค้าจากเมืองจีนหรือคะ?'),'surprised'),
 chineseMerchantLine('ถูกต้องแล้ว! ข้าเป็นพ่อค้าชาวจีน เดินทางมาค้าขายที่กรุงศรีอยุธยา ที่นี่มีพ่อค้าจากหลายบ้านหลายเมืองเดินทางเข้ามาติดต่อค้าขายกัน','normal'),
 student(()=>genderWord('คุณลุงนำสินค้าอะไรจากเมืองจีนมาขายบ้างครับ?','คุณลุงนำสินค้าอะไรจากเมืองจีนมาขายบ้างคะ?'),'curious'),
 chineseMerchantLine('สินค้าที่ข้านำมาขายมีหลายอย่างเลย! ทั้งเครื่องเคลือบ ผ้าไหม ผ้าแพร และกระทะเหล็ก ลองดูสินค้ารอบ ๆ ร้านข้าสิ','point'),
 student(()=>genderWord('ว้าว! มีของหลายอย่างเลยนะครับ แล้วสินค้าเหล่านี้เดินทางมาถึงอยุธยาได้อย่างไรครับ?','ว้าว! มีของหลายอย่างเลยนะคะ แล้วสินค้าเหล่านี้เดินทางมาถึงอยุธยาได้อย่างไรคะ?'),'curious'),
 chineseMerchantLine('พวกเราขนสินค้าลงเรือสำเภา เดินทางข้ามทะเลมายังกรุงศรีอยุธยา เรือสำเภาสามารถบรรทุกสินค้าได้มาก เหมาะกับการเดินทางค้าขายทางทะเล','explain'),
 student(()=>genderWord('แสดงว่ามีพ่อค้าจากหลายประเทศเดินทางมาค้าขายที่นี่ด้วยใช่ไหมครับ?','แสดงว่ามีพ่อค้าจากหลายประเทศเดินทางมาค้าขายที่นี่ด้วยใช่ไหมคะ?'),'curious'),
 chineseMerchantLine('ใช่แล้ว! นอกจากพ่อค้าชาวจีน ยังมีพ่อค้าจากชาติต่าง ๆ เช่น โปรตุเกส ฮอลันดา อังกฤษ และฝรั่งเศส เดินทางเข้ามาติดต่อค้าขายกับกรุงศรีอยุธยา','explain'),
 student(()=>genderWord('การค้ากับชาวต่างชาติมีประโยชน์ต่อกรุงศรีอยุธยาอย่างไรครับ?','การค้ากับชาวต่างชาติมีประโยชน์ต่อกรุงศรีอยุธยาอย่างไรคะ?'),'curious'),
 chineseMerchantLine('การค้าทำให้ผู้คนได้ซื้อขายแลกเปลี่ยนสินค้า เกิดรายได้แก่บ้านเมือง และยังทำให้เกิดการแลกเปลี่ยนวัฒนธรรมระหว่างผู้คนต่างถิ่นอีกด้วย','explain'),
 student(()=>genderWord('เข้าใจแล้วครับ! อยุธยาไม่ได้เป็นเพียงเมืองที่รับสินค้าจากต่างแดน แต่ยังเป็นเมืองที่ผู้คนจากหลายชาติมาพบปะค้าขายกันด้วย','เข้าใจแล้วค่ะ! อยุธยาไม่ได้เป็นเพียงเมืองที่รับสินค้าจากต่างแดน แต่ยังเป็นเมืองที่ผู้คนจากหลายชาติมาพบปะค้าขายกันด้วย'),'normal'),
 chineseMerchantLine('ถูกต้องแล้ว! การค้ากับต่างชาติเป็นส่วนหนึ่งที่ทำให้กรุงศรีอยุธยามีความสำคัญในฐานะเมืองการค้า เอาล่ะ ข้ามีคำถามสามข้อให้เจ้าลองตอบ หากตอบถูกครบทุกข้อ เจ้าก็จะผ่านด่านนี้!','proud'),
 student(()=>genderWord('ตกลงครับ! พร้อมแล้ว!','ตกลงค่ะ! พร้อมแล้ว!'),'normal')
];}
const foreignTradeQuiz=[
 {q:'พ่อค้าชาวจีนในบทสนทนานำสินค้าใดเข้ามาขายในกรุงศรีอยุธยา?',options:['เครื่องเคลือบ ผ้าไหม ผ้าแพร และกระทะเหล็ก','ข้าว ปลาแห้ง และผลไม้','ไม้และของป่า','เครื่องจักรและเครื่องใช้ไฟฟ้า'],answer:0,explain:'พ่อค้าชาวจีนบอกว่านำเครื่องเคลือบ ผ้าไหม ผ้าแพร และกระทะเหล็กมาขาย',hint:'ทบทวนตอนที่พ่อค้าชี้แนะนำสินค้าภายในร้าน'},
 {q:'พ่อค้าชาวจีนใช้พาหนะใดขนส่งสินค้าข้ามทะเลมายังกรุงศรีอยุธยา?',options:['เกวียน','เรือสำเภา','ช้าง','รถม้า'],answer:1,explain:'พ่อค้าขนสินค้าลงเรือสำเภาเพื่อเดินทางค้าขายทางทะเล',hint:'พ่อค้าเล่าว่าตนขนสินค้าลงพาหนะที่เดินทางข้ามทะเลได้'},
 {q:'การค้ากับชาวต่างชาติส่งผลดีต่อกรุงศรีอยุธยาอย่างไร?',options:['ทำให้ผู้คนเลิกค้าขาย','ทำให้ไม่มีการแลกเปลี่ยนสินค้า','ช่วยสร้างรายได้และเกิดการแลกเปลี่ยนวัฒนธรรม','ทำให้การค้าภายในเมืองหยุดลง'],answer:2,explain:'การค้าช่วยให้เกิดรายได้และการแลกเปลี่ยนวัฒนธรรมระหว่างผู้คนต่างถิ่น',hint:'ลองนึกถึงสิ่งที่พ่อค้าอธิบายเกี่ยวกับประโยชน์ของการค้ากับต่างชาติ'}
];
function openForeignTradeQuiz(){quizIndex=0;quizScore=0;quizShowingResult=false;quizRetrying=false;quizActive=true;quizPanel.classList.remove('hidden');renderForeignTradeQuizQuestion();}
function renderForeignTradeQuizQuestion(){const item=foreignTradeQuiz[quizIndex];quizHeading.textContent='ด่านที่ ๕ : ย่านการค้าต่างชาติ';quizProgress.textContent='ข้อ '+(quizIndex+1)+' / '+foreignTradeQuiz.length;quizQuestion.textContent=item.q;quizAnswers.replaceChildren();quizFeedback.textContent='';quizNextBtn.classList.add('hidden');item.options.forEach((option,index)=>{const button=document.createElement('button');button.type='button';button.className='quiz-answer';button.textContent=['ก','ข','ค','ง'][index]+'. '+option;button.addEventListener('click',()=>handleStageQuizAnswer(index,foreignTradeQuiz,['ก','ข','ค','ง'],'คำตอบยังไม่ถูกต้องนะ คำใบ้: '+item.hint+' ลองเลือกอีกครั้ง'));quizAnswers.append(button);});}
function finishForeignTradeQuiz(){quizShowingResult=true;stage5Passed=true;quizHeading.textContent='สรุปผลด่านที่ ๕';quizProgress.textContent='คะแนน '+quizScore+' / '+foreignTradeQuiz.length;quizQuestion.textContent='ตอบถูกครบทั้ง ๓ ข้อ! ผ่านด่านย่านการค้าต่างชาติ';quizAnswers.replaceChildren();quizFeedback.textContent='เจ้าได้เรียนรู้เรื่องสินค้านำเข้าจากจีน การขนส่งทางเรือสำเภา และความสำคัญของการค้ากับชาวต่างชาติแล้ว';quizNextBtn.textContent='จบด่านที่ ๕ ✓';quizNextBtn.classList.remove('hidden');}


function foreignExplorerLine(text,emotion='normal'){return {who:'foreignExplorer',emotion,text};}
function internationalPortDialogueLines(){return [
 student(()=>genderWord('ว้าว! ที่นี่มีเรือจากหลายประเทศจอดอยู่เต็มไปหมดเลยครับ','ว้าว! ที่นี่มีเรือจากหลายประเทศจอดอยู่เต็มไปหมดเลยค่ะ'),'curious'),
 foreignExplorerLine('Bonjour! บงชูร์! ยินดีต้อนรับสู่ท่าเรือแห่งกรุงศรีอยุธยา! ข้าชื่อฌอง เป็นนักเดินเรือชาวฝรั่งเศส','welcoming'),
 student(()=>genderWord('สวัสดีครับกัปตันฌอง เรือเหล่านี้เดินทางมาจากประเทศไหนบ้างครับ?','สวัสดีค่ะกัปตันฌอง เรือเหล่านี้เดินทางมาจากประเทศไหนบ้างคะ?'),'curious'),
 foreignExplorerLine('พ่อค้าจากหลายดินแดนเดินทางมาค้าขายที่นี่ ทั้งจีน ญี่ปุ่น อินเดีย และประเทศในยุโรป แต่ละแห่งก็นำสินค้าที่แตกต่างกันมาแลกเปลี่ยน','explaining'),
 student(()=>genderWord('แล้วแต่ละประเทศนำสินค้าอะไรมาขายบ้างครับ?','แล้วแต่ละประเทศนำสินค้าอะไรมาขายบ้างคะ?'),'curious'),
 foreignExplorerLine('สินค้าจากจีนมีเครื่องเคลือบ ผ้าไหม ผ้าแพร และกระทะเหล็ก ส่วนญี่ปุ่นมีทองแดง เหรียญเงิน และกล่องลงรัก','explaining'),
 foreignExplorerLine('ส่วนอินเดียนำผ้าชนิดต่าง ๆ อัญมณี และเครื่องเทศมา และพ่อค้าจากยุโรปก็นำผ้าและเครื่องประดับมาขายด้วย','explaining'),
 student(()=>genderWord('แล้วกัปตันฌองนำสินค้าจากฝรั่งเศสมาขายอะไรบ้างครับ?','แล้วกัปตันฌองนำสินค้าจากฝรั่งเศสมาขายอะไรบ้างคะ?'),'curious'),
 foreignExplorerLine('โอ้! ข้าก็นำสินค้ามาหลายอย่างเช่นกัน! นี่คือแป้งสาลี อาวุธยุทโธปกรณ์ และสินค้าหัตถกรรมจากฝรั่งเศส ลองชมดูสิ มงามี! (Mon ami!)','point'),
 student(()=>genderWord('น่าสนใจมากเลยครับ การค้าขายกับต่างประเทศมีประโยชน์อย่างไรครับ?','น่าสนใจมากเลยค่ะ การค้าขายกับต่างประเทศมีประโยชน์อย่างไรคะ?'),'curious'),
 foreignExplorerLine('การค้าทำให้ผู้คนได้แลกเปลี่ยนสินค้าและวัฒนธรรม อีกทั้งยังช่วยสร้างรายได้ให้แก่กรุงศรีอยุธยา เมืองนี้จึงเป็นศูนย์กลางการค้าที่สำคัญแห่งหนึ่ง','explaining'),
 student(()=>genderWord('วันนี้ผมได้เรียนรู้เรื่องสินค้าจากหลายประเทศมากเลยครับ!','วันนี้หนูได้เรียนรู้เรื่องสินค้าจากหลายประเทศมากเลยค่ะ!'),'normal'),
 foreignExplorerLine('Merci! เมอร์ซี! ดีใจที่เจ้าได้ความรู้ ก่อนที่สินค้าจะเข้าสู่เมือง ยังต้องผ่านการตรวจสอบและจัดเก็บภาษีอากรด้วย ลองเดินทางไปเรียนรู้ที่ด่านขนอนดูนะ!','welcoming'),
 student(()=>genderWord('ได้เลยครับ! ผมจะไปเรียนรู้ต่อที่ด่านขนอนครับ!','ได้เลยค่ะ! หนูจะไปเรียนรู้ต่อที่ด่านขนอนค่ะ!'),'normal')
];}
const internationalPortQuiz=[
 {q:'สินค้าจากประเทศญี่ปุ่นที่กัปตันฌองกล่าวถึงมีอะไรบ้าง?',options:['เครื่องเคลือบ ผ้าไหม ผ้าแพร และกระทะเหล็ก','ทองแดง เหรียญเงิน และกล่องลงรัก','ผ้าชนิดต่าง ๆ อัญมณี และเครื่องเทศ','ผ้าและเครื่องประดับ'],answer:1,explain:'สินค้าจากญี่ปุ่น ได้แก่ ทองแดง เหรียญเงิน และกล่องลงรัก',hint:'นึกถึงสินค้าสามอย่างที่กัปตันกล่าวถึงหลังจากเล่าสินค้าจากจีน'},
 {q:'กัปตันฌองนำสินค้าใดจากประเทศฝรั่งเศสมาขาย?',options:['แป้งสาลี อาวุธยุทโธปกรณ์ และสินค้าหัตถกรรม','ทองแดง เหรียญเงิน และกล่องลงรัก','เครื่องเคลือบ ผ้าไหม และกระทะเหล็ก','ผ้าชนิดต่าง ๆ อัญมณี และเครื่องเทศ'],answer:0,explain:'กัปตันฌองนำแป้งสาลี อาวุธยุทโธปกรณ์ และสินค้าหัตถกรรมจากฝรั่งเศสมาขาย',hint:'ทบทวนช่วงที่กัปตันฌองนำเสนอสินค้าจากบ้านเกิดของตน'},
 {q:'การค้ากับต่างประเทศมีประโยชน์อย่างไรต่อกรุงศรีอยุธยา?',options:['ทำให้ผู้คนหยุดแลกเปลี่ยนสินค้า','ทำให้การค้าภายในเมืองหมดไป','ช่วยให้เกิดการแลกเปลี่ยนสินค้าและวัฒนธรรม รวมทั้งสร้างรายได้','ทำให้ไม่มีพ่อค้าจากต่างแดนเดินทางมา'],answer:2,explain:'การค้าช่วยให้เกิดการแลกเปลี่ยนสินค้าและวัฒนธรรม อีกทั้งสร้างรายได้ให้กรุงศรีอยุธยา',hint:'นึกถึงสิ่งที่กัปตันฌองอธิบายเกี่ยวกับประโยชน์ของการค้าระหว่างประเทศ'}
];
function openInternationalPortQuiz(){quizIndex=0;quizScore=0;quizShowingResult=false;quizRetrying=false;quizActive=true;quizPanel.classList.remove('hidden');renderInternationalPortQuizQuestion();}
function renderInternationalPortQuizQuestion(){const item=internationalPortQuiz[quizIndex];quizHeading.textContent='ด่านที่ ๖ : ท่าเรือการค้าต่างประเทศ';quizProgress.textContent='ข้อ '+(quizIndex+1)+' / '+internationalPortQuiz.length;quizQuestion.textContent=item.q;quizAnswers.replaceChildren();quizFeedback.textContent='';quizNextBtn.classList.add('hidden');item.options.forEach((option,index)=>{const button=document.createElement('button');button.type='button';button.className='quiz-answer';button.textContent=['ก','ข','ค','ง'][index]+'. '+option;button.addEventListener('click',()=>handleStageQuizAnswer(index,internationalPortQuiz,['ก','ข','ค','ง'],'คำตอบยังไม่ถูกต้องนะ คำใบ้: '+item.hint+' ลองเลือกอีกครั้ง'));quizAnswers.append(button);});}
function finishInternationalPortQuiz(){quizShowingResult=true;stage6Passed=true;quizHeading.textContent='สรุปผลด่านที่ ๖';quizProgress.textContent='คะแนน '+quizScore+' / '+internationalPortQuiz.length;quizQuestion.textContent='ตอบถูกครบทั้ง ๓ ข้อ! ผ่านด่านท่าเรือการค้าต่างประเทศ';quizAnswers.replaceChildren();quizFeedback.textContent='เจ้าได้เรียนรู้สินค้าจากจีน ญี่ปุ่น อินเดีย ยุโรป และสินค้าจากฝรั่งเศส รวมถึงความสำคัญของการค้าระหว่างประเทศแล้ว';quizNextBtn.textContent='จบด่านที่ ๖ ✓';quizNextBtn.classList.remove('hidden');}

// ===== แบบทดสอบด่านที่ ๓: ตลาดในกรุงศรีอยุธยา =====
const marketQuiz=[
 {q:'ตลาดหน้าคุกเป็นสถานที่สำหรับทำอะไร?',options:['เป็นสถานที่ฝึกทหาร','เป็นสถานที่ซื้อขายและแลกเปลี่ยนสินค้า','เป็นสถานที่ประกอบพิธีกรรม'],answer:1,explain:'ตลาดเป็นแหล่งที่ผู้คนนำสินค้ามาซื้อขายและแลกเปลี่ยนกัน'},
 {q:'สินค้าที่นำมาขายในตลาดอยุธยามาจากที่ใดบ้าง?',options:['เฉพาะในกรุงศรีอยุธยา','เฉพาะจากต่างประเทศ','จากชาวบ้าน หัวเมืองต่าง ๆ และพ่อค้าต่างชาติ'],answer:2,explain:'ผู้คนนำสินค้าจากหลายพื้นที่ รวมถึงหัวเมืองและต่างแดนมาค้าขาย'},
 {q:'ข้อใดเป็นตัวอย่างหัวเมืองที่กล่าวถึงในบทสนทนา?',options:['ละโว้และพิษณุโลก','เชียงใหม่และภูเก็ต','ธนบุรีและเพชรบุรี'],answer:0,explain:'แม่ค้ากล่าวถึงเมืองละโว้และพิษณุโลกเป็นตัวอย่างหัวเมืองที่ผู้คนนำสินค้ามาค้าขาย'},
 {q:'ผู้คนในสมัยอยุธยาใช้สิ่งใดในการขนส่งสินค้า?',options:['รถไฟและเครื่องบิน','เรือและเกวียน','รถยนต์และรถจักรยานยนต์'],answer:1,explain:'ผู้คนใช้เรือในการขนส่งทางน้ำ และใช้เกวียนเทียมสัตว์ในการขนส่งทางบก'},
 {q:'เพราะเหตุใดตลาดในสมัยอยุธยาจึงมีสินค้าหลากหลาย?',options:['เพราะมีเพียงชาวอยุธยาที่ผลิตสินค้า','เพราะตลาดขายเฉพาะสินค้าจากต่างประเทศ','เพราะผู้คนนำสินค้าจากหลายพื้นที่มาซื้อขายแลกเปลี่ยนกัน'],answer:2,explain:'ผู้คนจากชุมชน หัวเมือง และพ่อค้าต่างชาตินำสินค้าหลากหลายมาค้าขาย'}
];

function openMarketQuiz(){
 quizIndex=0;quizScore=0;quizShowingResult=false;quizRetrying=false;quizActive=true;
 quizPanel.classList.remove('hidden');renderMarketQuizQuestion();
}
function renderMarketQuizQuestion(){
 const item=marketQuiz[quizIndex];
 quizHeading.textContent='ด่านที่ ๓ : ตลาดในกรุงศรีอยุธยา';
 quizProgress.textContent='ข้อ '+(quizIndex+1)+' / '+marketQuiz.length;
 quizQuestion.textContent=item.q;quizAnswers.replaceChildren();quizFeedback.textContent='';
 quizNextBtn.classList.add('hidden');
 item.options.forEach((option,index)=>{
  const button=document.createElement('button');
  button.type='button';button.className='quiz-answer';button.textContent=['ก','ข','ค'][index]+'. '+option;
  button.addEventListener('click',()=>selectMarketQuizAnswer(index));
  quizAnswers.append(button);
 });
}
function selectMarketQuizAnswer(selected){
 handleStageQuizAnswer(selected,marketQuiz,['ก','ข','ค'],'ยังไม่ถูกต้องนะ ลองทบทวนบทสนทนากับแม่ค้าอีกครั้ง แล้วเลือกคำตอบใหม่ได้เลย');
}

function finishMarketQuiz(){
 quizShowingResult=true;stage3Passed=true;
 quizHeading.textContent='สรุปผลด่านที่ ๓';
 quizProgress.textContent='คะแนน '+quizScore+' / '+marketQuiz.length;
 quizQuestion.textContent='ทำแบบทดสอบครบแล้ว! ผ่านด่านตลาดในกรุงศรีอยุธยา';
 quizAnswers.replaceChildren();
 quizFeedback.textContent='เจ้าได้เรียนรู้เรื่องสินค้าที่ซื้อขาย แหล่งที่มาของสินค้า และความสำคัญของตลาดริมน้ำแล้ว';
 quizNextBtn.textContent='กลับไปสำรวจตลาด ▶';quizNextBtn.classList.remove('hidden');
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
 handleStageQuizAnswer(selected,boatQuiz,['ก','ข','ค'],'ยังไม่ถูกต้องนะ ลองทบทวนเรื่องการเดินทางทางเรือ แล้วเลือกคำตอบใหม่ได้เลย');
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
 handleStageQuizAnswer(selected,farmerQuiz,['ก','ข','ค','ง'],'คำตอบยังไม่ถูกต้องนะจ๊ะ คำใบ้: '+item.hint+' ลองเลือกคำตอบใหม่อีกครั้ง');
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
 const isInternationalPortQuiz=quizHeading.textContent.includes('ด่านที่ ๖')||quizHeading.textContent.includes('สรุปผลด่านที่ ๖');if(isInternationalPortQuiz){if(quizShowingResult){quizPanel.classList.add('hidden');quizActive=false;objective.textContent='ผ่านด่านที่ ๖ แล้ว! เดินทางต่อไปยังด่านขนอนได้';return;}if(quizIndex<internationalPortQuiz.length-1){quizIndex++;renderInternationalPortQuizQuestion();}else finishInternationalPortQuiz();return;}
 const isForeignTradeQuiz=quizHeading.textContent.includes('ด่านที่ ๕')||quizHeading.textContent.includes('สรุปผลด่านที่ ๕');if(isForeignTradeQuiz){if(quizShowingResult){quizPanel.classList.add('hidden');quizActive=false;objective.textContent='ผ่านด่านที่ ๕ แล้ว! สำรวจย่านการค้าต่างชาติได้ตามสบาย';return;}if(quizIndex<foreignTradeQuiz.length-1){quizIndex++;renderForeignTradeQuizQuestion();}else finishForeignTradeQuiz();return;}
  const isPortQuiz=quizHeading.textContent.includes('ด่านที่ ๔')||quizHeading.textContent.includes('สรุปผลด่านที่ ๔');
 if(isPortQuiz){
  if(quizShowingResult){
   quizPanel.classList.add('hidden');quizActive=false;
   objective.textContent='ผ่านด่านที่ ๔ แล้ว! ปลดล็อกย่านการค้าต่างชาติ (รอเตรียมฉากด่านที่ ๕)';
   return;
  }
  if(quizIndex<portQuiz.length-1){quizIndex++;renderPortQuizQuestion();}
  else finishPortQuiz();
  return;
 }
 const isMarketQuiz=quizHeading.textContent.includes('ด่านที่ ๓')||quizHeading.textContent.includes('สรุปผลด่านที่ ๓');
 if(isMarketQuiz){
  if(quizShowingResult){
   quizPanel.classList.add('hidden');quizActive=false;
   objective.textContent='ด่านที่ ๓ ผ่านแล้ว: เดินสำรวจตลาดในกรุงศรีอยุธยาได้ตามสบาย';
   return;
  }
  if(quizIndex<marketQuiz.length-1){quizIndex++;renderMarketQuizQuestion();}
  else finishMarketQuiz();
  return;
 }
 const isBoatQuiz=quizHeading.textContent.includes('ด่านที่ ๒')||quizHeading.textContent.includes('สรุปผลด่านที่ ๒');
 if(isBoatQuiz){
  if(quizShowingResult){
   quizPanel.classList.add('hidden');quizActive=false;
   goToScene(5,'forward');
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
 if(s==='internationalPort'&&Math.abs(player.x-foreignExplorer.x)<350){if(stage6Passed)openDialogue(internationalPortDialogueLines());else openDialogue(internationalPortDialogueLines(),openInternationalPortQuiz);return;}
 if(s==='foreignTrade'&&Math.abs(player.x-chineseMerchant.x)<330){if(stage5Passed)openDialogue(foreignTradeDialogueLines());else openDialogue(foreignTradeDialogueLines(),openForeignTradeQuiz);return;}
  if(s==='port'&&Math.abs(player.x-portOfficer.x)<390){
  portIntroSeen=true;
  if(stage4Passed)openDialogue(portDialogueLines());
  else openDialogue(portDialogueLines(),openPortQuiz);
  return;
 }
 if(s==='boat'){
  // เปิดบทสนทนาฉบับเต็มซ้ำได้ทุกครั้งที่กลับมาสำรวจ แต่ไม่เปิดแบบทดสอบซ้ำเมื่อผ่านแล้ว
  openDialogue(boatJourneyLines());
  return;
 }
 if(s==='market'&&Math.abs(player.x-merchant.x)<270){
  if(stage3Passed)openDialogue(merchantLines());
  else openDialogue(merchantLines(),openMarketQuiz);
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
 // นายท่าตะโกนเรียกครั้งแรกเมื่อนักเรียนเดินเข้ามาใกล้ท่ารับสินค้า
 if(id==='port'&&!portIntroSeen&&player.x>=745){
  portIntroSeen=true;
  openDialogue(portDialogueLines(),openPortQuiz);
  return;
 }
 // เดินข้ามขอบฉากได้ทั้งสองทิศทาง เพื่อกลับไปสำรวจพื้นที่เดิม
 if(player.x>worldWidth-145&&(
  (sceneIndex<3&&(id==='school'||id==='road'||(id==='coin'&&coinFound)))||
  (id==='farm'&&stage1Passed)||
  (id==='boat'&&stage2Passed)||
  (id==='market'&&stage3Passed)||
  (id==='port'&&stage4Passed)||
  (id==='foreignTrade'&&stage5Passed)
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
 if(id==='market'&&Math.abs(player.x-merchant.x)<270)message='กด E เพื่อพูดคุยกับแม่ค้า';
 if(id==='port'&&Math.abs(player.x-portOfficer.x)<390)message=stage4Passed?'กด E เพื่อทบทวนบทสนทนากับนายท่า':'กด E เพื่อพูดคุยกับนายท่า';
 if(id==='foreignTrade'&&Math.abs(player.x-chineseMerchant.x)<330)message=stage5Passed?'กด E เพื่อทบทวนบทสนทนากับพ่อค้าชาวจีน':'กด E เพื่อพูดคุยกับพ่อค้าชาวจีน';
 if(id==='internationalPort'&&Math.abs(player.x-foreignExplorer.x)<350)message=stage6Passed?'กด E เพื่อทบทวนบทสนทนากับกัปตันฌอง':'กด E เพื่อพูดคุยกับกัปตันฌอง';
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
 const img=image('farmer-idle.webp');
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
 const ground=id==='farm'?590:id==='port'?595:632;
 if(id==='farm'){
  drawFarmer(farmer.x,ground);
  if(Math.abs(player.x-farmer.x)<175){
   ctx.font='bold 21px system-ui';
   ctx.fillStyle='#fff6db';ctx.textAlign='center';
   ctx.fillText('ชาวนา',farmer.x,ground-farmer.h-9);
  }
 }
 if(id==='port'){
  const officerImg=image('port-officer-idle.webp');
  if(officerImg.complete&&officerImg.naturalWidth){
   const w=portOfficer.w,h=portOfficer.h;
   // This sprite faces right in the source; mirror it to look toward the student on the left.
   ctx.save();ctx.translate(Math.round(portOfficer.x),0);ctx.scale(-1,1);
   ctx.drawImage(officerImg,-w/2,Math.round(ground-h),w,h);ctx.restore();
   if(Math.abs(player.x-portOfficer.x)<225){
    ctx.font='bold 19px system-ui';ctx.fillStyle='#fff6db';ctx.textAlign='center';
    ctx.fillText('เจ้าพนักงานท่ารับสินค้า',portOfficer.x,ground-h-10);
   }
  }
 }
 if(id==='internationalPort'){
  const img=image('foreign_explorer_full.png');if(img.complete&&img.naturalWidth){const w=foreignExplorer.w,h=foreignExplorer.h;ctx.drawImage(img,Math.round(foreignExplorer.x-w/2),Math.round(ground-h),w,h);if(Math.abs(player.x-foreignExplorer.x)<260){ctx.font='bold 20px system-ui';ctx.fillStyle='#fff6db';ctx.textAlign='center';ctx.fillText('กัปตันฌอง',foreignExplorer.x,ground-h-9);}}
 }
 if(id==='foreignTrade'){
  const img=image('chinese_merchant_full.png');if(img.complete&&img.naturalWidth){const w=chineseMerchant.w,h=chineseMerchant.h;ctx.drawImage(img,Math.round(chineseMerchant.x-w/2),Math.round(ground-h),w,h);if(Math.abs(player.x-chineseMerchant.x)<260){ctx.font='bold 20px system-ui';ctx.fillStyle='#fff6db';ctx.textAlign='center';ctx.fillText('พ่อค้าชาวจีน',chineseMerchant.x,ground-h-9);}}
 }
 if(id==='market'){
  const merchantImg=image('merchant-idle.webp');
  if(merchantImg.complete&&merchantImg.naturalWidth){
   const w=merchant.w,h=merchant.h;
   ctx.save();ctx.translate(Math.round(merchant.x),0);ctx.scale(-1,1);
   ctx.drawImage(merchantImg,-w/2,Math.round(ground-h),w,h);ctx.restore();
   if(Math.abs(player.x-merchant.x)<220){ctx.font='bold 21px system-ui';ctx.fillStyle='#fff6db';ctx.textAlign='center';ctx.fillText('แม่ค้า',merchant.x,ground-h-9);}
  }
 }
 const img=image('student-'+(selectedGender||'boy')+'-walk.webp');
 // Standing uses a near-neutral passing pose; moving cycles through all six frames.
 const index=player.moving?Math.floor(animationTime*8)%6:2;
 drawWalkSprite(img,index,player.x,ground,player.w,player.h,player.facing);
}
function frame(t){const dt=Math.min((t-last)/1000||0,0.04);last=t;update(dt);draw();requestAnimationFrame(frame);}
showScreen('cover-screen');
