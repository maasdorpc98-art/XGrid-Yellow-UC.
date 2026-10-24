const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../assets/yellow.js'), 'utf8');
new vm.Script(source);
function section(a,b) {
  const start=source.indexOf(a), end=source.indexOf(b,start+1);
  assert(start>=0&&end>start, `Missing controller functions: ${a}`);
  return source.slice(start,end);
}
const comparison=section('function xsNativeSubjectScore(', '  function xsNativePrepareFindMore(');
const compare=vm.runInNewContext(comparison+'\nxsNativeCompare',{Math, Number, Array});
const signature=()=>({method:'native-subject-pose-flow-v3',geometry:Array(232).fill(0),motion:Array(12).fill(0),motionValid:false,subjects:[]});
let a=signature(), b=signature();
assert.equal(compare(a,b).score,1);
assert.equal(compare(a,{...b,method:'native-subject-pose-flow-v2'}),null);
b.geometry[30]=1;
let result=compare(a,b);
assert(result.geometry<1&&!result.motionValid&&result.score===result.geometry);
a.motionValid=b.motionValid=true;
result=compare(a,b);
assert(Math.abs(result.score-(.7*result.geometry+.3*result.motion))<1e-12);
const maps={xsNativeSignatures:new Map(),xsNativePending:new Map(),xsNativeFailed:new Map(),xsNativeKinds:new Map()};
let calls=[];
const capability='0123456789abcdef0123456789abcdef0123456789abcdef';
const context={...maps,Date,Math,Number,Array,performance:{now:()=>1234},window:{__xgridNativeSession:capability},
  xsNativeLikelyImage:()=>true,xsNativeLikelyGif:()=>true,
  xsNativeHost:()=>({analyzeVisual:(...args)=>{calls.push(args);return true}}),
  xsNativeRecordError:()=>{},xsNativeRequested:0,xsNativeSuccess:0,xsNativeErrors:0};
const request=vm.runInNewContext(section('  function xsNativeRequest(', '  function xsNativeRecordError(')+'\nxsNativeRequest',context);
assert(request('https://example.com/a.gif','https://example.com/a.jpg'));
assert.equal(calls.length,1);
assert.equal(calls[0].length,4);
assert.equal(calls[0][3],capability);
assert(request('https://example.com/a.gif','https://example.com/a.jpg'));
assert.equal(calls.length,1,'Pending requests are deduplicated');
let callback;
context.window.addEventListener=(name,fn)=>{assert.equal(name,'__xgridNativeAnalysis');callback=fn};
vm.runInNewContext(section("  window.addEventListener('__xgridNativeAnalysis'", '\n// Yellow accuracy'),context);
const url='https://example.com/a.gif', token=maps.xsNativePending.get(url).token;
callback({detail:{url,token:'wrong',ok:true,signature:signature()}});
assert(maps.xsNativePending.has(url));
callback({detail:{url,token,ok:true,signature:signature(),mode:'original-gif-motion'}});
assert(!maps.xsNativePending.has(url)&&maps.xsNativeSignatures.has(url));
const timerSource=section('  function scheduleScan(delay=50){','  function clearAll(){');
let now=1000, next=0;const timers=new Map();
const scheduler={performance:{now:()=>now},retrievalQuiet:false,enabled:true,scanTimer:0,gifScanDue:0,
  clearTimeout:id=>timers.delete(id),setTimeout:(fn,ms)=>{const id=++next;timers.set(id,{at:now+ms,fn});return id},scan(){}};
const schedule=vm.runInNewContext(timerSource+'\nscheduleScan',scheduler);
schedule(100);for(let i=0;i<30;i++){now+=2;schedule(100)}
assert.equal(timers.size,1);
assert.equal([...timers.values()][0].at,1100,'Page mutations must not postpone an existing GIF scan');
assert(!source.includes('window.mbrowser')&&!source.includes('window._XJSAPI_'));
for(const label of ['GIF ONLY','FIND MORE','FIND VARIATIONS','RE-SEARCH','__xgridUcOpenImageMenu'])assert(source.includes(label));
console.log('PASS: controller syntax, v3 native signatures, geometry-only ranking, 70/30 ranking, capability argument, request deduplication, stale callback rejection, accepted native callback, non-starving GIF scheduler, UC-only controller controls.');


const sampling = vm.runInNewContext(
  section('  function xsNativeSampleQueue(', '  function xsNativePrepareFindMore(')+'\nxsNativeSampleQueue',
  {xsNativeSignatures:new Map(),xsNativeLikelyImage:url=>typeof url==='string'&&url.startsWith('https://')}
);
const candidates=Array.from({length:120},(_,i)=>({
  url:'https://example.com/gif/'+i+'.gif',preview:'https://example.com/still/'+i+'.jpg'
}));
const anchorGif={url:'https://example.com/anchor.gif',preview:'https://example.com/anchor.jpg'};
const sampled=sampling(candidates,[anchorGif],40);
assert.equal(sampled.length,40,'Bounded native request budget');
assert.equal(sampled[0].url,anchorGif.url,'Selected image anchor is analyzed first');
assert.equal(new Set(sampled.map(x=>x.url)).size,40,'No duplicate native requests');
assert(sampled.some(x=>x.url.endsWith('/0.gif')),'Keep high-ranked grid results');
assert(sampled.some(x=>Number(x.url.match(/\/(\d+)\.gif$/)?.[1])>=110),
  'Sample deep grid results instead of only the first 40');
const cached=new Map([[candidates[0].url,{}]]);
const small=sampling(candidates.slice(0,3),[],12,cached);
assert.equal(small.length,2,'Cached results must not consume the request budget');
assert(small.every(x=>x.url!==candidates[0].url));
console.log('PASS: native visual analysis samples the full grid, prioritizes anchors, deduplicates, and respects cached signatures.');

const base = require('path').join(__dirname,'../native/src/main/java');
const engine = fs.readFileSync(require('path').join(base,'com/xgrid/yellownative/VisualEngine.java'),'utf8');
const bridge = fs.readFileSync(require('path').join(base,'com/xgrid/yellowuc/UCVisualBridge.java'),'utf8');
assert(engine.includes('checkOpenCvNative();') && engine.includes('checkPoseNative(p);'),
  'Both native engines must pass real self-tests, not just load their libraries');
assert(engine.includes('Video.calcOpticalFlowFarneback(') && engine.includes('detector.detect('));
assert(!engine.includes('if(!openCvReady) {'), 'No mock pixel-difference motion fallback');
assert(engine.includes('throw new IllegalStateException("OpenCV optical flow failed",error)'));
assert(engine.includes('throw new IllegalStateException("MediaPipe inference failed",error)'));
assert(bridge.includes('!candidate.poseReady || !candidate.openCvReady'),
  'A partial native engine may never be shared');
assert(bridge.includes('!current.poseReady||!current.openCvReady'),
  'Both engines are mandatory at every analyze request');
assert(bridge.includes('ensureEngineAsync()') && bridge.includes('INIT_RETRY_MS=5000'),
  'Failed native initialization must be retried asynchronously');
assert(source.includes("xsNativeLastOutcome='waiting-for-required-native'"));
assert(source.includes("xsNativeLastOutcome='required-native-unavailable'"));
assert(source.includes("xsToast('MediaPipe / OpenCV unavailable"),
  'Native unavailability must be visible to the user');
console.log('PASS: mandatory MediaPipe/OpenCV initialization, native JNI smoke tests, retry and explicit UI failure.');

const host=fs.readFileSync(require('path').join(base,'com/xgrid/yellowuc/UCHost.java'),'utf8');
assert(bridge.includes('if(!attached){') && bridge.includes('host.attachInterface(this,"xgridUCVision")'),
  'Do not detach/re-attach native JS object for each trusted search');
assert(bridge.includes('session=""') && bridge.includes('generation++'),
  'Keep session rotation and stale-analysis rejection');
assert(host.includes('verifyBridgeVisibility(pageUrl)'),
  'Google document callback must invoke native JS visibility probe');
assert(host.includes('reloadAttempts.containsKey(key)') &&
       host.includes('if(!imagesSearch(expectedUrl)') &&
       host.includes('reload.invoke(current())'),
  'Use at most one recovery reload, only on trusted Google Images searches');
assert(source.includes('UC native interface visibility probe:'),
  'Report bridge visibility to XSearch diagnostics');
console.log('PASS: trusted UC bridge persistence, secure session rotation, bounded recovery reload, diagnostics.');
