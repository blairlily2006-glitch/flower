const flower=document.querySelector('#flower'),camera=document.querySelector('#camera'),cameraButton=document.querySelector('#cameraButton'),progress=document.querySelector('#progress'),topStatus=document.querySelector('#topStatus'),statusDot=document.querySelector('#statusDot'),cameraCard=document.querySelector('#cameraCard'),gestureValue=document.querySelector('#gestureValue'),cameraLabel=document.querySelector('#cameraLabel'),toast=document.querySelector('#toast');
let tracker,stream,target=0,smoothed=0,lastSeen=0,lastDetect=0,lastVideoUpdate=0,fistState=false,fistInFrames=0,fistOutFrames=0,seekingByUser=false,toastTimer,detectFrame=0,previousFrame=0;
const setStatus=(text,live=false)=>{topStatus.textContent=text;statusDot.classList.toggle('live',live)};
const showToast=(text,error=false)=>{toast.textContent=text;toast.classList.toggle('error',error);toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),4200)};
const updateProgress=value=>{const p=Math.max(0,Math.min(1,value));progress.value=String(p);progress.style.setProperty('--progress',`${p*100}%`)};
const videoReady=()=>Number.isFinite(flower.duration)&&flower.duration>0;
flower.addEventListener('loadedmetadata',()=>{flower.pause();flower.currentTime=0;updateProgress(0)});
flower.addEventListener('error',()=>showToast('花朵视频读取失败，请确认 lily-bloom.mp4 文件仍在项目文件夹中。',true));
flower.addEventListener('timeupdate',()=>{if(!seekingByUser&&videoReady())updateProgress(flower.currentTime/flower.duration)});
function applyPosition(value,now=performance.now()){if(!videoReady())return;const p=Math.max(0,Math.min(1,value));if(Math.abs(flower.currentTime/flower.duration-p)>.002&&now-lastVideoUpdate>65){flower.currentTime=p*flower.duration;lastVideoUpdate=now}updateProgress(p)}
progress.addEventListener('pointerdown',()=>{seekingByUser=true});
progress.addEventListener('input',()=>{const p=Number(progress.value);target=smoothed=p;applyPosition(p);gestureValue.textContent=p<.08?'花苞':p>.92?'盛放':'半开'});
for(const event of ['pointerup','change','pointercancel'])progress.addEventListener(event,()=>{seekingByUser=false});
function smoothLoop(now){const dt=Math.min(50,now-(previousFrame||now));previousFrame=now;if(tracker&&now-lastSeen>900){setStatus(now-lastSeen>2600?'未检测到手部':'请将手放入画面',true);gestureValue.textContent='等待手势';cameraLabel.textContent='寻找手部…'}smoothed+=(target-smoothed)*(1-Math.exp(-dt/900));if(!seekingByUser)applyPosition(smoothed,now);requestAnimationFrame(smoothLoop)}
requestAnimationFrame(smoothLoop);
function handleLandmarks(landmarks){
 const hand=landmarks?.[0];
 if(!hand){lastSeen=0;return}
 lastSeen=performance.now();
 const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),wrist=hand[0];
 const curled=[[8,6],[12,10],[16,14],[20,18]].filter(([tip,pip])=>d(hand[tip],wrist)<d(hand[pip],wrist)*.9).length;
 if(curled>=3){fistInFrames++;fistOutFrames=0;if(fistInFrames>=3)fistState=true}
 else{fistOutFrames++;fistInFrames=0;if(fistOutFrames>=5)fistState=false}
 const palm=d(hand[5],hand[17]),ratio=palm?d(hand[4],hand[8])/palm:0;
 const raw=fistState?0:Math.max(0,Math.min(1,(ratio-.28)/(.92-.28)));
 target=raw<.035?0:raw>.975?1:raw;
 setStatus('正在识别手势',true);
 cameraLabel.textContent=fistState?'握拳 · 收拢':'拇指 ↔ 食指';
 gestureValue.textContent=fistState||target<.08?'花苞':target>.92?'盛放':'半开';
}
cameraButton.addEventListener('click',async()=>{
 if(tracker){cancelAnimationFrame(detectFrame);tracker.close();tracker=null;stream?.getTracks().forEach(t=>t.stop());stream=null;camera.srcObject=null;cameraCard.classList.remove('visible');cameraButton.querySelector('span').textContent='开启摄像头';cameraButton.setAttribute('aria-label','开启摄像头手势识别');gestureValue.textContent='用进度条体验';fistState=false;setStatus('手势互动已就绪');return}
 cameraButton.disabled=true;cameraButton.querySelector('span').textContent='正在开启…';
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('请使用 localhost 地址打开网页，浏览器才允许调用摄像头。');
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});camera.srcObject=stream;await camera.play();cameraCard.classList.add('visible');setStatus('正在载入手势识别…',true);
  const vision=await import(new URL('./vendor/mediapipe/vision_bundle.mjs',import.meta.url));
  const wasmRoot=new URL('./vendor/mediapipe/wasm/',import.meta.url).href;
  const modelUrl=new URL('./vendor/mediapipe/hand_landmarker.task',import.meta.url).href;
  const files=await vision.FilesetResolver.forVisionTasks(wasmRoot);
  const options={baseOptions:{modelAssetPath:modelUrl,delegate:'GPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.55,minHandPresenceConfidence:.5,minTrackingConfidence:.5};
  try{tracker=await vision.HandLandmarker.createFromOptions(files,options)}catch{options.baseOptions.delegate='CPU';tracker=await vision.HandLandmarker.createFromOptions(files,options)}
  cameraButton.querySelector('span').textContent='关闭摄像头';cameraButton.setAttribute('aria-label','关闭摄像头手势识别');gestureValue.textContent='等待手势';fistState=false;fistInFrames=0;fistOutFrames=0;lastSeen=performance.now();
  const detect=now=>{detectFrame=requestAnimationFrame(detect);if(!tracker||camera.readyState<2||now-lastDetect<40)return;lastDetect=now;handleLandmarks(tracker.detectForVideo(camera,now).landmarks)};detectFrame=requestAnimationFrame(detect);showToast('识别已开启：捏合或握拳让花朵合拢，逐渐分开拇指与食指让花朵盛开。');
 }catch(error){console.error(error);tracker?.close();tracker=null;stream?.getTracks().forEach(t=>t.stop());stream=null;camera.srcObject=null;cameraCard.classList.remove('visible');setStatus('摄像头暂不可用');gestureValue.textContent='用进度条体验';cameraButton.querySelector('span').textContent='重试摄像头';const msg=error.name==='NotAllowedError'?'浏览器没有摄像头权限，请在地址栏权限设置中允许后重试。':error.name==='NotFoundError'?'没有找到摄像头。':`手势识别启动失败：${error.message||'请重试。'}`;showToast(`${msg} 你仍可用进度条控制花朵。`,true)}finally{cameraButton.disabled=false}
});
