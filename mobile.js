(()=>{'use strict';
const game=document.getElementById('game');const hint=document.getElementById('rotateHint');
function fit(){const w=window.innerWidth,h=window.innerHeight;const scale=Math.min(w/1200,h/700);game.style.transform=`translate(${Math.max(0,(w-1200*scale)/2)}px,${Math.max(0,(h-700*scale)/2)}px) scale(${scale})`;}
window.addEventListener('resize',fit);window.addEventListener('orientationchange',()=>setTimeout(fit,150));
if(window.visualViewport)window.visualViewport.addEventListener('resize',fit);fit();
document.getElementById('rotateContinue').addEventListener('click',()=>hint.classList.add('dismissed'));
document.getElementById('fullscreen').addEventListener('click',async()=>{if(document.fullscreenElement){try{await document.exitFullscreen()}catch(_){}}else{await enterFullscreen()}fit()});
// Floating, fully transparent analog joystick. Its centre is wherever the
// player touches the left side of the game scene; no joystick artwork is shown.
// Physical touch buttons remain functional and are not intercepted.
const canvas=document.getElementById('world');
const level=document.getElementById('level');
const panel=document.getElementById('panel');
const currentStage=()=>Number((level.textContent.match(/\\d+/)||[])[0]||0);
const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
let stick=null, ticker=null, lastRaceDirection='', lastRaceStep=0;
function stopStick(e){
 if(e&&stick&&e.pointerId!==stick.id)return;
 stick=null;
 if(ticker!==null){clearInterval(ticker);ticker=null;}
}
function stickMove(e){
 if(!stick||stick.id!==e.pointerId)return;
 const dx=e.clientX-stick.x,dy=e.clientY-stick.y;
 const radius=55, deadzone=12;
 const len=Math.hypot(dx,dy);
 stick.nx=len>deadzone?Math.max(-1,Math.min(1,dx/Math.max(radius,len))):0;
 stick.ny=len>deadzone?Math.max(-1,Math.min(1,dy/Math.max(radius,len))):0;
 e.preventDefault();
}
function tickStick(){
 if(!stick||!panel.classList.contains('hidden'))return;
 const stage=currentStage(),nx=stick.nx;
 if(stage===2){
   const dir=nx>.3?'R':nx<-.3?'L':'';
   // Each deliberate change of direction is one footstep.
   if(dir&&dir!==lastRaceDirection&&performance.now()-lastRaceStep>110){
     key(dir==='L'?'ArrowLeft':'ArrowRight');
     lastRaceDirection=dir;lastRaceStep=performance.now();
   }
   if(!dir)lastRaceDirection='';
 }else if(stage===3||stage===4){
   if(nx>.24)key('ArrowRight');
   else if(nx<-.24)key('ArrowLeft');
 }
}
canvas.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'||![2,3,4].includes(currentStage()))return;
 // Reserve the left side as the analog zone. The right side stays free
 // for tapping scenery and on-screen action controls.
 const rect=canvas.getBoundingClientRect();
 if(e.clientX>rect.left+rect.width*.58)return;
 stopStick();
 stick={id:e.pointerId,x:e.clientX,y:e.clientY,nx:0,ny:0};
 lastRaceDirection='';
 try{canvas.setPointerCapture(e.pointerId)}catch(_){}
 ticker=setInterval(tickStick,75);
 e.preventDefault();
},{passive:false});
canvas.addEventListener('pointermove',stickMove,{passive:false});
canvas.addEventListener('pointerup',stopStick);
canvas.addEventListener('pointercancel',stopStick);
window.addEventListener('blur',()=>stopStick());
// Fullscreen is requested from an actual user tap; browsers that prohibit it
// (notably iPhone Safari) will retain the edge-to-edge viewport layout.
async function enterFullscreen(){
 try{
   if(!document.fullscreenElement&&document.documentElement.requestFullscreen)
     await document.documentElement.requestFullscreen({navigationUI:'hide'});
 }catch(_){}
 try{
   if(screen.orientation?.lock)await screen.orientation.lock('landscape');
 }catch(_){}
 fit();
}
document.getElementById('begin').addEventListener('click',()=>{enterFullscreen()});
// Bigger text in the first level on touch devices; CSS applies only to the first level.
const updateLevel=()=>{game.classList.toggle('mobile-level-one',currentStage()===1);};
new MutationObserver(updateLevel).observe(level,{childList:true,subtree:true});updateLevel();
document.addEventListener('touchmove',e=>{if(!e.target.closest('.panel'))e.preventDefault()},{passive:false});
})();