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
