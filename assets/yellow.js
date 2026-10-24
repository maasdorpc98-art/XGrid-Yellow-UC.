(function(){function install(){
/* XGrid Yellow UC v29.4.3 : UC browser foundation + Yellow v28.3.8 XSearch and GIF FastPath.
   UC host adapter connects the real MediaPipe / OpenCV worker.
   Native visual scoring is disabled unless a real xgridUCVision/yellowVision bridge is installed. */
;(function XGridUcDocumentAdapter(){
 'use strict';
 try{
   if(window.top!==window)return;
   if(!/(^|\.)google\.[a-z.]+$/i.test(String(location.hostname||'')))return;
   if(window.__xgridUcFastPathInstalled)return;
   Object.defineProperty(window,'__xgridUcFastPathInstalled',{value:true,configurable:false,enumerable:false,writable:false});
 }catch(_){return}
 window.__xgridUcPlatform='XGrid Yellow UC v29.4.3';
 window.__xgridUcMigration={version:'29.4.3',origin:'Yellow v28.3.8',browser:'UC',nativeVision:'uc-host-connected-device-test-pending',gifOnly:true};
;(() => {
  'use strict';

  /* XGridPro direct grid controller.
     This replaces the old page-scale/zoom slider. It only changes gallery columns;
     it never transforms the page, changes viewport scale, or intercepts pinch gestures. */
  const ID='__xgridpro_grid_control__';
  const STYLE=ID+'_style';
  const COL_KEY='__xgridpro_grid_cols_v2__';
  const GIF_KEY='__xgridpro_gif_enabled_v2__';
  const MIN_COLS=1, MAX_COLS=6;
  const WALL='__xbg_masonry';
  const PATH='__xbg_wall_path';
  const HIDE='__xbg_wall_hide';
  const IMAGE_ONLY='__xbg_imageonly';
  const SKIP='__xbg_wall_skip';
  const GHOST='__xbg_ghostwall';
  const clampCols=v=>Math.max(MIN_COLS,Math.min(MAX_COLS,Math.round(Number(v)||3)));
  const idle=fn=>('requestIdleCallback' in window?requestIdleCallback(fn,{timeout:450}):setTimeout(fn,90));
  const nextPaint=fn=>requestAnimationFrame(()=>fn());
  let currentCols=readCols(), galleryQueued=false, observer=null, initialScanQueued=false, globalResizeFrame=0;
  const pendingGalleryNodes=new Set();

  function readCols(){
    try{const n=Number(localStorage.getItem(COL_KEY));return n>=MIN_COLS&&n<=MAX_COLS?clampCols(n):3}catch(_){return 3}
  }
  function saveCols(v){try{localStorage.setItem(COL_KEY,String(v))}catch(_){} }
  function isGoogleImages(){try{const u=new URL(location.href);return /(^|\.)google\.[a-z.]+$/i.test(u.hostname)&&(u.searchParams.get('udm')==='2'||/\/search\b/.test(u.pathname)&&document.querySelector('a[href*="udm=2"],[aria-current]')!=null)}catch(_){return false}}
  function googleGifFilterActive(){
    if(!isGoogleImages())return false;try{const u=new URL(location.href),tbs=u.searchParams.get('tbs')||'';return /(?:^|,)itp:animated(?:,|$)/i.test(tbs)}catch(_){return false}
  }
  function gifEnabled(){
    if(isGoogleImages())return true;
    try{if(typeof window.__xgridGetGifEnabled==='function')return !!window.__xgridGetGifEnabled();const v=localStorage.getItem(GIF_KEY);return v==='1'}catch(_){return false}
  }
  function setGoogleGifFilter(on){
    let u;try{u=new URL(location.href)}catch(_){return false}
    let parts=(u.searchParams.get('tbs')||'').split(',').map(x=>x.trim()).filter(Boolean).filter(x=>!/^itp:/i.test(x));
    if(on)parts.push('itp:animated');if(parts.length)u.searchParams.set('tbs',parts.join(','));else u.searchParams.delete('tbs');
    if(!u.searchParams.get('udm'))u.searchParams.set('udm','2');
    try{localStorage.setItem(GIF_KEY,on?'1':'0')}catch(_){}
    location.assign(u.toString());return true
  }
  function gapFor(cols){return 0}

  function styles(){
    if(document.getElementById(STYLE))return;
    const e=document.createElement('style');e.id=STYLE;e.textContent=`
      .${WALL}{column-count:initial!important;column-gap:0!important;display:block!important;contain:none!important;line-height:0!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:auto;min-height:0!important;max-height:none!important;position:relative!important;left:auto!important;right:auto!important;top:auto!important;transform:none!important;overflow:visible!important;white-space:normal!important;margin:0!important;padding:0!important;border:0!important}
      .${WALL}>.${IMAGE_ONLY}{break-inside:auto!important;-webkit-column-break-inside:auto!important;display:block!important;width:auto;max-width:none;min-width:0!important;height:auto;min-height:0!important;max-height:none;margin:0!important;padding:0!important;border:0!important;vertical-align:top!important;box-sizing:border-box!important;line-height:0!important;position:absolute;left:0;right:auto!important;top:0;bottom:auto!important;transform:none!important;float:none!important;clear:none!important}
      .${WALL}>.${SKIP}{display:none!important;width:0!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important}
      .${GHOST}{display:none!important;width:0!important;min-width:0!important;max-width:0!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}
      .${WALL} .${IMAGE_ONLY}{overflow:hidden!important;min-height:0!important;max-height:none!important;border-radius:0!important;background:transparent!important}
      .${WALL} .${PATH}{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;line-height:0!important;font-size:0!important;background:transparent!important}
      .${WALL} .${HIDE}{display:none!important;visibility:hidden!important;width:0!important;height:0!important;min-width:0!important;min-height:0!important;max-width:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}
      .${WALL} .${IMAGE_ONLY} img,.${WALL} .${IMAGE_ONLY} .xbg_ratio{display:block!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;object-fit:contain!important;object-position:center!important;image-rendering:auto!important;filter:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;vertical-align:top!important}
      .${WALL} .${IMAGE_ONLY} video{display:block!important;width:100%!important;max-width:100%!important;height:auto!important;object-fit:contain!important;margin:0!important;padding:0!important;border-radius:0!important}
      #${ID}{all:initial;position:fixed;z-index:2147483647;bottom:8px;left:50%;transform:translateX(-50%);height:48px;display:flex;align-items:center;color:#fff;font:13px sans-serif;direction:ltr;user-select:none;-webkit-user-select:none;white-space:nowrap;pointer-events:auto}
      #${ID} .xgc-dock{all:initial;height:44px;display:flex;align-items:center;background:rgba(25,25,28,.94);border:1px solid rgba(255,255,255,.10);border-radius:23px;padding:0 4px;box-shadow:0 3px 12px rgba(0,0,0,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      #${ID} button{all:initial;box-sizing:border-box;color:#fff;text-align:center;font-family:sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
      #${ID} .xgc-step{width:40px;height:40px;border-radius:20px;font:700 25px/40px sans-serif}
      #${ID} .xgc-step:active,#${ID} [data-xgrid-gif]:active{background:rgba(255,255,255,.12)}
      #${ID} [data-xgrid-col-value]{all:initial;color:#fff;font:700 14px/40px sans-serif;min-width:34px;text-align:center}
      #${ID} [data-xgrid-gif]{height:34px;min-width:66px;margin:0 4px;padding:0 10px;border-radius:17px;background:rgba(67,67,72,.96);font:700 12px/34px sans-serif;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
      #${ID} [data-xgrid-gif][data-active="1"]{background:#166534;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
      #${ID} [data-xgrid-search]{height:34px;min-width:64px;margin:0 2px;padding:0 9px;border-radius:17px;background:rgba(67,67,72,.96);font:700 11px/34px sans-serif;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
      #${ID} [data-xgrid-search]:active{background:rgba(255,255,255,.12)}
      #${ID} [data-xgrid-search][data-active="1"]{background:#3730a3;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15)}
      #__xgrid_xsearch_overlay__{all:initial;position:fixed;z-index:2147483647;inset:0;background:rgba(0,0,0,.035);box-sizing:border-box;font-family:Arial,sans-serif;direction:ltr;color:#fff;pointer-events:none}
      #__xgrid_xsearch_overlay__ *{box-sizing:border-box}
      #__xgrid_xsearch_overlay__ .xrf-sheet{pointer-events:auto;position:absolute;bottom:calc(62px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);width:min(calc(100vw - 16px),620px);min-height:0;max-height:78vh;overflow:auto;background:rgba(23,24,27,.90);color:#f7f7f7;border:1px solid rgba(255,255,255,.14);border-radius:18px;box-shadow:0 8px 28px rgba(0,0,0,.38);padding:0 13px 13px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);overscroll-behavior:contain}
      #__xgrid_xsearch_overlay__ .xrf-sheet.xrf-card-menu{min-height:0;max-height:38vh;width:min(calc(100vw - 28px),520px)}
      #__xgrid_xsearch_overlay__ .xrf-main-panel{height:44vh;max-height:78vh;transition:height .16s ease}
      #__xgrid_xsearch_overlay__ .xrf-main-panel.xrf-expanded{height:78vh}
      #__xgrid_xsearch_overlay__ .xrf-expand{all:initial;display:grid;place-items:center;flex:0 0 38px;width:38px;height:38px;margin-left:auto;border-radius:19px;background:rgba(255,255,255,.08);color:#dfe1e7;font:700 11px/38px Arial,sans-serif;text-align:center;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-health{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;padding:8px 9px;border:1px solid #353842;border-radius:10px;background:#202228;color:#dce0e8;font:700 11px/15px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-health b[data-health=healthy]{color:#86efac}#__xgrid_xsearch_overlay__ .xrf-health b[data-health=thin]{color:#fde68a}#__xgrid_xsearch_overlay__ .xrf-health b[data-health=exhausted]{color:#fca5a5}
      #__xgrid_xsearch_overlay__ .xrf-engine-note{margin-top:6px;color:#7f8491;font:9px/13px Arial,sans-serif;white-space:normal}
      #__xgrid_xsearch_overlay__ .xrf-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;background:rgba(23,24,27,.94);padding:9px 0 8px;border-bottom:1px solid rgba(255,255,255,.10);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      #__xgrid_xsearch_overlay__ .xrf-title{font:700 16px/21px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-sub{margin-top:1px;color:#aeb0b8;font:11px/15px Arial,sans-serif;max-width:72vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      #__xgrid_xsearch_overlay__ .xrf-close{all:initial;display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;margin-left:10px;border-radius:20px;background:rgba(255,255,255,.10);color:#fff;font:27px/40px Arial,sans-serif;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
      #__xgrid_xsearch_overlay__ .xrf-close:active{background:rgba(255,255,255,.20)}
      #__xgrid_xsearch_overlay__ .xrf-section{padding:12px 0 2px}
      #__xgrid_xsearch_overlay__ .xrf-label{color:#d7d8dc;font:700 12px/16px Arial,sans-serif;margin-bottom:7px}
      #__xgrid_xsearch_overlay__ .xrf-help{color:#989aa3;font:11px/15px Arial,sans-serif;margin:5px 0 0}
      #__xgrid_xsearch_overlay__ .xrf-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#25262b;border-radius:11px;padding:4px}
      #__xgrid_xsearch_overlay__ .xrf-seg button{all:initial;text-align:center;color:#c8cad0;border-radius:8px;padding:9px 4px;font:700 12px/16px Arial,sans-serif;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-seg button[data-active="1"]{background:#4f46e5;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-chips{display:flex;flex-wrap:wrap;gap:7px}
      #__xgrid_xsearch_overlay__ .xrf-chip{all:initial;max-width:100%;padding:8px 10px;border-radius:16px;font:700 12px/16px Arial,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #__xgrid_xsearch_overlay__ .xrf-chip[data-state="prefer"]{background:#26364c;color:#d8eaff;border:1px solid #365879}
      #__xgrid_xsearch_overlay__ .xrf-chip[data-state="required"]{background:#17472d;color:#d9ffe7;border:1px solid #267548}
      #__xgrid_xsearch_overlay__ .xrf-chip[data-state="exclude"]{background:#4c2327;color:#ffe0e2;border:1px solid #7b343b}
      #__xgrid_xsearch_overlay__ .xrf-chip[data-state="ignore"]{background:#292a2f;color:#8d8f97;border:1px dashed #4b4c52;text-decoration:line-through}
      #__xgrid_xsearch_overlay__ .xrf-add{display:flex;gap:7px;margin-top:9px}
      #__xgrid_xsearch_overlay__ input[type="text"]{all:initial;min-width:0;flex:1;background:#24252a;color:#fff;border:1px solid #414249;border-radius:10px;padding:9px 10px;font:13px/18px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-add button,#__xgrid_xsearch_overlay__ .xrf-small{all:initial;color:#fff;background:#303138;border-radius:10px;padding:9px 12px;font:700 12px/18px Arial,sans-serif;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #28292e}
      #__xgrid_xsearch_overlay__ .xrf-row:last-child{border-bottom:0}
      #__xgrid_xsearch_overlay__ .xrf-row span{font:13px/18px Arial,sans-serif;color:#e8e8ea}
      #__xgrid_xsearch_overlay__ input[type="checkbox"]{width:20px;height:20px;accent-color:#4f46e5}
      #__xgrid_xsearch_overlay__ details{margin-top:9px;background:#202126;border-radius:11px;padding:0 10px}
      #__xgrid_xsearch_overlay__ summary{padding:11px 0;cursor:pointer;color:#d7d8dc;font:700 12px/16px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-actions{position:sticky;bottom:0;display:grid;grid-template-columns:.7fr 1.3fr;gap:8px;background:linear-gradient(to top,rgba(23,24,27,.92) 75%,rgba(23,24,27,0));padding:14px 0 2px}
      #__xgrid_xsearch_overlay__ .xrf-actions button{all:initial;text-align:center;border-radius:12px;padding:12px 8px;font:700 13px/18px Arial,sans-serif;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-reset{background:#292a2f;color:#d9dadd}
      #__xgrid_xsearch_overlay__ .xrf-apply{background:#4f46e5;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-progress{height:8px;background:#292a2f;border-radius:999px;overflow:hidden;margin:8px 0 6px}
      #__xgrid_xsearch_overlay__ .xrf-progress>i{display:block;height:100%;background:#4f46e5;border-radius:999px;transition:width .18s ease}
      #__xgrid_xsearch_overlay__ .xrf-status{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 0}
      #__xgrid_xsearch_overlay__ .xrf-status strong{font:700 15px/20px Arial,sans-serif;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-status em{font:700 12px/18px Arial,sans-serif;color:#b7b9c2;font-style:normal}
      #__xgrid_xsearch_overlay__ .xrf-train-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 2px}
      #__xgrid_xsearch_overlay__ .xrf-train-grid button{all:initial;text-align:center;min-height:54px;border-radius:12px;padding:10px 8px;font:700 12px/16px Arial,sans-serif;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-more{background:#17472d;color:#e0ffea;border:1px solid #27774a}
      #__xgrid_xsearch_overlay__ .xrf-less{background:#4c2327;color:#ffe3e5;border:1px solid #7b343b}
      #__xgrid_xsearch_overlay__ .xrf-siteyes{background:#26364c;color:#d8eaff;border:1px solid #365879}
      #__xgrid_xsearch_overlay__ .xrf-siteno{background:#42323a;color:#ffe1ef;border:1px solid #6d4b59}
      #__xgrid_xsearch_overlay__ .xrf-quick-grid{margin:8px 0 0}
      #__xgrid_xsearch_overlay__ .xrf-quick-grid button{min-height:47px;padding:8px 6px}
      #__xgrid_xsearch_overlay__ .xrf-train-grid button:disabled{opacity:.36;filter:grayscale(1)}
      #__xgrid_xsearch_overlay__ .xrf-preview{display:flex;align-items:center;gap:10px;padding:8px 0 2px}
      #__xgrid_xsearch_overlay__ .xrf-preview img{width:62px;height:62px;object-fit:cover;border-radius:10px;background:#24252a;flex:0 0 auto}
      #__xgrid_xsearch_overlay__ .xrf-preview div{min-width:0}
      #__xgrid_xsearch_overlay__ .xrf-preview b{display:block;font:700 13px/18px Arial,sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #__xgrid_xsearch_overlay__ .xrf-preview small{display:block;color:#9ea0a9;font:11px/15px Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #__xgrid_xsearch_overlay__ .xrf-strength{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#25262b;border-radius:11px;padding:4px}
      #__xgrid_xsearch_overlay__ .xrf-strength button{all:initial;text-align:center;color:#c8cad0;border-radius:8px;padding:9px 4px;font:700 12px/16px Arial,sans-serif;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-strength button[data-active="1"]{background:#4f46e5;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-target-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
      #__xgrid_xsearch_overlay__ .xrf-target-actions button{all:initial;text-align:center;border-radius:10px;padding:10px 8px;font:700 12px/18px Arial,sans-serif;cursor:pointer;background:#303138;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-target-actions .danger{background:#4c2327;color:#ffe3e5}
      #__xgrid_xsearch_overlay__ .xrf-target-actions .complete{background:#1f4d65;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-target-actions .next-batch{background:#283d58;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-target-actions .exact{grid-column:1/-1;background:#175b47;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-basket{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;min-height:22px}
      #__xgrid_xsearch_overlay__ .xrf-basket-empty{font:11px/18px Arial,sans-serif;color:#777b85;padding:2px 0}
      #__xgrid_xsearch_overlay__ .xrf-querybox{margin-top:6px;padding:8px 9px;border-radius:10px;background:#202126;border:1px solid #32343a;color:#f0f1f4;font:12px/16px Arial,sans-serif;word-break:break-word}
      #__xgrid_xsearch_overlay__ .xrf-querybox.generated{color:#dce8ff;background:#1f2937;border-color:#34465f}
      #__xgrid_xsearch_overlay__ .xrf-origin-note{display:block;margin-top:4px;color:#8f93a0;font:10px/14px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-bchip{all:initial;display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:6px 8px;border-radius:999px;font:700 11px/14px Arial,sans-serif;cursor:pointer;box-sizing:border-box}
      #__xgrid_xsearch_overlay__ .xrf-bchip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px}
      #__xgrid_xsearch_overlay__ .xrf-bchip i{font:700 14px/14px Arial,sans-serif;font-style:normal;opacity:.75}
      #__xgrid_xsearch_overlay__ .xrf-bchip.more{background:#173d29;color:#d9ffe7;border:1px solid #2d6a47}
      #__xgrid_xsearch_overlay__ .xrf-bchip.less{background:#47252a;color:#ffe1e4;border:1px solid #774049}
      #__xgrid_xsearch_overlay__ .xrf-bchip.siteyes{background:#24384f;color:#dcecff;border:1px solid #3b5e82}
      #__xgrid_xsearch_overlay__ .xrf-bchip.siteno{background:#44323b;color:#ffe1ef;border:1px solid #735263}
      #__xgrid_xsearch_overlay__ .xrf-signal-chip{display:inline-flex;align-items:stretch;max-width:100%;border-radius:999px;overflow:hidden;box-sizing:border-box}
      #__xgrid_xsearch_overlay__ .xrf-signal-chip.more{background:#173d29;color:#d9ffe7;border:1px solid #2d6a47}
      #__xgrid_xsearch_overlay__ .xrf-signal-chip.less{background:#47252a;color:#ffe1e4;border:1px solid #774049}
      #__xgrid_xsearch_overlay__ .xrf-signal-main,#__xgrid_xsearch_overlay__ .xrf-signal-delete{all:initial;box-sizing:border-box;color:inherit;cursor:pointer;font-family:Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-signal-main{display:inline-flex;align-items:center;gap:6px;min-width:0;padding:6px 7px 6px 9px;font:700 11px/14px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-signal-main span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:185px}
      #__xgrid_xsearch_overlay__ .xrf-signal-main i{font:700 11px/14px Arial,sans-serif;font-style:normal;opacity:.82}
      #__xgrid_xsearch_overlay__ .xrf-signal-delete{display:grid;place-items:center;min-width:30px;padding:5px 8px 6px;border-left:1px solid rgba(255,255,255,.18);font:900 16px/16px Arial,sans-serif;background:rgba(0,0,0,.14)}
      #__xgrid_xsearch_overlay__ .xrf-signal-delete:active{background:#6b242b;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-basket-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      #__xgrid_xsearch_overlay__ .xrf-basket-head b{font:700 12px/16px Arial,sans-serif;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-basket-head small{font:700 10px/14px Arial,sans-serif;color:#9ea0a9}
      #__xgrid_xsearch_overlay__ .xrf-clearrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
      #__xgrid_xsearch_overlay__ .xrf-clearrow button{all:initial;text-align:center;border-radius:10px;padding:9px 6px;font:700 11px/16px Arial,sans-serif;cursor:pointer;background:#303138;color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-clearrow .danger{background:#4c2327;color:#ffe3e5}
      #__xgrid_xsearch_overlay__ .xrf-tag-details{margin-top:8px;border:1px solid #333741;border-radius:11px;background:#202126;overflow:hidden}
      #__xgrid_xsearch_overlay__ .xrf-tag-details summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;color:#e7e9ee;font:700 12px/16px Arial,sans-serif;cursor:pointer;user-select:none}
      #__xgrid_xsearch_overlay__ .xrf-tag-details summary::-webkit-details-marker{display:none}
      #__xgrid_xsearch_overlay__ .xrf-tag-details summary:after{content:'OPEN';color:#9ca3af;font:700 10px/14px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-tag-details[open] summary:after{content:'CLOSE'}
      #__xgrid_xsearch_overlay__ .xrf-tag-details summary small{margin-left:auto;color:#8f93a0;font:600 10px/14px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-tag-body{padding:0 12px 12px;border-top:1px solid #30333a}
      #__xgrid_xsearch_overlay__ .xrf-fresh{all:initial;display:block;box-sizing:border-box;width:100%;text-align:center;margin-top:8px;border-radius:10px;padding:11px 8px;font:700 12px/16px Arial,sans-serif;cursor:pointer;background:#202b3b;color:#dcecff;border:1px solid #36506d}
      #__xgrid_xsearch_overlay__ .xrf-sitewide{grid-column:1/-1}
      #__xgrid_xsearch_overlay__ .xrf-site-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
      #__xgrid_xsearch_overlay__ .xrf-site-grid button{all:initial;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:54px;border-radius:12px;padding:8px 6px;background:#292d35;color:#f3f5f9;border:1px solid #3b414c;font:700 11px/15px Arial,sans-serif;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-site-grid button small{display:block;color:#9da5b4;font:10px/13px Arial,sans-serif;margin-top:2px}
      #__xgrid_xsearch_overlay__ .xrf-site-grid button[data-active="1"]{background:#293f65;border-color:#5375ab}
      #__xgrid_xsearch_overlay__ .xrf-text{all:initial;display:block;box-sizing:border-box;width:100%;padding:10px 11px;border-radius:10px;background:#17181c;color:#fff;border:1px solid #3a3c43;font:13px/18px Arial,sans-serif;caret-color:#fff}
      #__xgrid_xsearch_overlay__ .xrf-goal-row{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:7px}
      #__xgrid_xsearch_overlay__ .xrf-goal-row button{all:initial;display:grid;place-items:center;border-radius:10px;padding:0 12px;background:#4f46e5;color:#fff;font:700 11px/16px Arial,sans-serif;cursor:pointer}
      #__xgrid_xsearch_overlay__ .xrf-signal-weight{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;margin-top:10px;color:#aaaeb8;font:700 9px/12px Arial,sans-serif}
      #__xgrid_xsearch_overlay__ .xrf-signal-weight input{width:100%;accent-color:#4f46e5}
      #__xgrid_xsearch_overlay__ button:disabled{opacity:.38;filter:grayscale(1)}
      #__xgrid_xsearch_toast__{all:initial;position:fixed;z-index:2147483647;left:50%;bottom:calc(86px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:88vw;padding:10px 14px;border-radius:999px;background:rgba(20,21,24,.96);color:#fff;font:700 12px/16px Arial,sans-serif;box-shadow:0 5px 22px rgba(0,0,0,.4);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #__xgridpro_diag_overlay__{all:initial;position:fixed;z-index:2147483647;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;font-family:monospace;direction:ltr}
      #__xgridpro_diag_overlay__ .xgd-box{box-sizing:border-box;width:min(94vw,720px);max-height:88vh;background:#17181b;color:#f5f5f5;border:1px solid #444;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden}
      #__xgridpro_diag_overlay__ .xgd-head{display:flex;align-items:center;justify-content:space-between;padding:11px 12px;font:600 14px sans-serif;border-bottom:1px solid #333}
      #__xgridpro_diag_overlay__ .xgd-head button{all:initial;color:#fff;font:24px/24px sans-serif;padding:0 4px;cursor:pointer}
      #__xgridpro_diag_overlay__ pre{all:initial;display:block;white-space:pre-wrap;word-break:break-word;overflow:auto;flex:1;padding:12px;color:#e9e9e9;background:#111;font:12px/1.45 monospace;user-select:text;-webkit-user-select:text}
      #__xgridpro_diag_overlay__ .xgd-actions{display:flex;gap:8px;justify-content:flex-end;padding:10px;border-top:1px solid #333}
      #__xgridpro_diag_overlay__ .xgd-actions button{all:initial;color:#fff;background:#303238;border-radius:8px;padding:9px 12px;font:600 12px sans-serif;cursor:pointer}
    `;(document.head||document.documentElement).appendChild(e)
  }

  function protectedArea(e){
    if(!e||e===document.body||e===document.documentElement)return false;
    if(e.closest('[role=dialog],[aria-modal=true],dialog,[data-modal],[class*=modal],[class*=viewer],[class*=preview]'))return true;
    for(let n=e;n&&n!==document.body;n=n.parentElement){
      const cs=getComputedStyle(n);if(cs.position!=='fixed'&&cs.position!=='sticky')continue;
      gridRead();const r=n.getBoundingClientRect();if(r.width>innerWidth*.55&&r.height>innerHeight*.45)return true;
    }return false
  }

  function isGallery(c){
    if(!c||c.id===ID||c.closest('#'+ID)||c.classList?.contains(GHOST)||protectedArea(c)||c.children.length<4||c.children.length>300)return false;
    // Never turn a nested result strip into a second masonry wall. This was the source
    // of the 141px mini-walls and most of the blank space in the v2 diagnostic.
    if(c.parentElement?.closest?.('.'+WALL))return false;
    // Horizontal carousels are image-rich too, but they are not the search-results wall.
    // Reject them before our own column CSS can change their geometry.
    if(!c.classList.contains(WALL)){
      const cw=c.clientWidth||0,sw=c.scrollWidth||0;
      if(cw>40&&sw>cw*1.22)return false;
      const cs=getComputedStyle(c);
      if((cs.overflowX==='auto'||cs.overflowX==='scroll')&&sw>cw+8)return false;
    }
    let eligible=0,withImage=0;
    for(const x of c.children){
      if(x.tagName==='SCRIPT'||x.tagName==='STYLE'||x.tagName==='TEMPLATE')continue;
      eligible++;if(x.matches('img,picture')||x.querySelector('img,picture img'))withImage++;
      if(eligible>=12&&withImage/eligible<.6)return false;
    }
    return eligible>=5&&withImage>=5&&withImage/eligible>=.80
  }

  function mainImage(card){
    if(card instanceof HTMLImageElement&&!card.classList.contains('__xgridpro_live_gif__'))return card;
    const imgs=card.querySelectorAll?card.querySelectorAll('img:not(.__xgridpro_live_gif__):not(.__xgridpro_hd_image__)'):[];
    let best=null,bestScore=-1;
    for(const img of imgs){
      gridRead();const r=img.getBoundingClientRect();
      const w=Math.max(r.width||0,img.naturalWidth||0,Number(img.getAttribute('width'))||0);
      const h=Math.max(r.height||0,img.naturalHeight||0,Number(img.getAttribute('height'))||0);
      const score=(w>=24&&h>=24?w*h:0)+(img.currentSrc||img.src?1:0);
      if(score>bestScore){bestScore=score;best=img}
    }
    return best||imgs[0]||null
  }

  function clearCard(card){
    if(!card||!card.querySelectorAll)return;
    preparedImage.delete(card);
    card.classList.remove(IMAGE_ONLY,SKIP);
    card.querySelectorAll('.'+PATH).forEach(n=>n.classList.remove(PATH));
    card.querySelectorAll('.'+HIDE).forEach(n=>n.classList.remove(HIDE));
  }

  function prepareCard(card){
    if(!card||card.id===ID||card.closest('#'+ID))return;
    const img=mainImage(card);if(!img||!card.contains(img))return;
    if(card.classList.contains(IMAGE_ONLY)&&preparedImage.get(card)===img)return;
    clearCard(card);
    card.classList.add(IMAGE_ONLY);preparedImage.set(card,img);
    let node=img;
    while(node&&node!==card){
      node.classList?.add(PATH);
      const parent=node.parentElement;if(!parent)break;
      for(const sib of [...parent.children]){
        if(sib===node||sib.tagName==='SOURCE'||sib.id===ID||sib.closest?.('#'+ID)||sib.classList?.contains('__xgridpro_live_gif__')||sib.classList?.contains('__xgridpro_hd_image__'))continue;
        sib.classList.add(HIDE);
      }
      node=parent;
    }
  }

  const wallLayoutCache=new WeakMap(), wallRatioCache=new WeakMap(), preparedImage=new WeakMap();
  const gridStats={full:0,append:0,partial:0,ratioUpgrades:0,ratioRepairs:0,anchorRestores:0,widthRelayouts:0,repairBatches:0,mutationBatches:0,mutationNodes:0,ignoredOwnMutations:0,initialScans:0,columnChanges:0,resizeBatches:0};
  let gridLayoutReads=0,gridInitialScanMs=0,gridInitialScanMax=0,gridMutationMs=0,gridMutationMax=0;
  function gridRead(n=1){gridLayoutReads+=n}
  const ratioRepairQueue=new Map(),widthQueue=new Set();let ratioRepairFrame=0,widthFrame=0;
  const wallResizeObserver=('ResizeObserver' in window)?new ResizeObserver(entries=>{
    for(const entry of entries){
      const wall=entry.target;if(!wall?.classList?.contains(WALL)||wall.classList.contains(GHOST))continue;
      const prev=wallLayoutCache.get(wall);if(!entry.contentRect?.width)gridRead();const w=entry.contentRect?.width||wall.getBoundingClientRect().width||0;
      if(prev&&w>1&&Math.abs(prev.available-w)>1)scheduleWidthRelayout(wall)
    }
  }):null;
  function clampRatio(v){return Math.max(.12,Math.min(8,Number.isFinite(v)&&v>0?v:1))}
  function ratioInfo(card){
    const img=mainImage(card);if(!img)return {img:null,ratio:1,quality:0,source:'fallback'};
    if(img.naturalWidth>1&&img.naturalHeight>1)return {img,ratio:clampRatio(img.naturalHeight/img.naturalWidth),quality:4,source:'natural'};
    const aw=Number(img.getAttribute('width')),ah=Number(img.getAttribute('height'));
    if(aw>1&&ah>1)return {img,ratio:clampRatio(ah/aw),quality:3,source:'attributes'};
    let n=img;
    while(n&&n!==card){gridRead();const r=n.getBoundingClientRect?.();if(r&&r.width>2&&r.height>2)return {img,ratio:clampRatio(r.height/r.width),quality:2,source:'rendered'};n=n.parentElement}
    gridRead();const cr=card.getBoundingClientRect?.();if(cr&&cr.width>2&&cr.height>2)return {img,ratio:clampRatio(cr.height/cr.width),quality:1,source:'card'};
    return {img,ratio:1,quality:0,source:'fallback'}
  }
  function wallRatio(card,refresh=false){
    const next=ratioInfo(card),cached=wallRatioCache.get(card);
    if(!cached||cached.img!==next.img||(cached.quality<=0&&next.quality>cached.quality))wallRatioCache.set(card,next);
    return (wallRatioCache.get(card)||next).ratio
  }
  function captureWallAnchor(wall){
    if(scrollY<24)return null;let best=null,bestScore=Infinity;
    for(const cell of [...wall.children]){
      if(!cell.classList?.contains(IMAGE_ONLY)||cell.classList.contains(SKIP))continue;
      gridRead();const r=cell.getBoundingClientRect();if(r.bottom<4||r.top>innerHeight-40)continue;
      const score=Math.abs(Math.max(0,r.top));if(score<bestScore){best={el:cell,top:r.top};bestScore=score}
    }return best
  }
  function restoreWallAnchor(anchor){
    if(!anchor?.el?.isConnected)return;gridRead();const delta=anchor.el.getBoundingClientRect().top-anchor.top;
    if(Number.isFinite(delta)&&Math.abs(delta)>1&&Math.abs(delta)<innerHeight*2.5){scrollBy(0,delta);gridStats.anchorRestores++}
  }
  function reassertCell(cell,g){
    if(!g)return;cell.style.setProperty('position','absolute','important');
    cell.style.setProperty('left',g.x+'px','important');cell.style.setProperty('top',g.y+'px','important');
    cell.style.setProperty('width',g.w+'px','important');cell.style.setProperty('max-width',g.w+'px','important');
    cell.style.setProperty('height',g.h+'px','important');cell.style.setProperty('min-height',g.h+'px','important');cell.style.setProperty('max-height',g.h+'px','important')
  }
  function layoutWall(wall,force=false,repairFrom=null){
    if(!wall?.isConnected)return;
    const cells=[...wall.children].filter(n=>n.classList?.contains(IMAGE_ONLY)&&!n.classList.contains(SKIP));
    if(!cells.length){wall.style.setProperty('height','0px','important');wall.style.setProperty('min-height','0px','important');return}
    gridRead();const gap=gapFor(currentCols),available=Math.max(1,wall.getBoundingClientRect().width||wall.clientWidth||innerWidth);
    const colWidth=Math.max(18,(available-gap*(currentCols-1))/currentCols);
    const prev=wallLayoutCache.get(wall);
    const sameBase=!!prev&&prev.cols===currentCols&&prev.gap===gap&&Math.abs(prev.available-available)<=1&&prev.cells.length<=cells.length&&prev.cells.every((n,i)=>cells[i]===n);
    let heights=Array(currentCols).fill(0),start=0,mode='full';
    if(sameBase&&Number.isInteger(repairFrom)&&repairFrom>0&&repairFrom<cells.length){
      start=Math.min(repairFrom,prev.geometry.length);mode='partial';
      for(let j=0;j<start;j++){const g=prev.geometry[j];if(!g)continue;const col=Math.max(0,Math.min(currentCols-1,Number.isInteger(g.col)?g.col:Math.round(g.x/Math.max(1,colWidth+gap))));heights[col]=Math.max(heights[col],g.y+g.h+gap);reassertCell(cells[j],g)}
      gridStats.partial++
    }else if(!force&&sameBase){
      start=prev.cells.length;heights=prev.heights.slice();mode='append';
      for(let j=0;j<start;j++)reassertCell(cells[j],prev.geometry[j]);
      if(start<cells.length)gridStats.append+=cells.length-start
    }else gridStats.full++;
    const geometry=(mode==='full'?[]:(prev?.geometry||[]).slice(0,start));
    for(let j=start;j<cells.length;j++){
      const cell=cells[j],ratio=wallRatio(cell,mode==='partial'),h=Math.max(1,colWidth*ratio);
      let col=0;for(let i=1;i<heights.length;i++)if(heights[i]<heights[col]-.05)col=i;
      const x=col*(colWidth+gap),y=heights[col];
      const g={x,y,w:colWidth,h,col};reassertCell(cell,g);geometry[j]=g;heights[col]=y+h+gap
    }
    const finalH=Math.max(1,...heights.map(v=>Math.max(0,v-gap)));
    wall.style.setProperty('display','block','important');wall.style.setProperty('position','relative','important');
    wall.style.setProperty('height',finalH+'px','important');wall.style.setProperty('min-height',finalH+'px','important');wall.style.setProperty('max-height',finalH+'px','important');
    wall.style.setProperty('margin','0','important');wall.style.setProperty('padding','0','important');
    wallLayoutCache.set(wall,{cols:currentCols,gap,available,colWidth,cells:cells.slice(),heights:heights.slice(),geometry});
    wallResizeObserver?.observe(wall)
  }
  function scheduleRatioRepair(card){
    const wall=card?.parentElement;if(!wall?.classList?.contains(WALL)||wall.classList.contains(GHOST))return;
    const cells=wallLayoutCache.get(wall)?.cells||[...wall.children].filter(n=>n.classList?.contains(IMAGE_ONLY)&&!n.classList.contains(SKIP));
    const idx=cells.indexOf(card);if(idx<0)return;
    const next=ratioInfo(card),cached=wallRatioCache.get(card);
    if(!next.img||next.quality<4||(cached?.quality===4&&cached.img===next.img&&Math.abs(next.ratio-cached.ratio)<.005))return;
    const changed=!cached||cached.img!==next.img||Math.abs(next.ratio-cached.ratio)/Math.max(.01,cached.ratio)>.08;
    wallRatioCache.set(card,next);if(!changed)return;
    if(cached)gridStats.ratioUpgrades++;
    const old=ratioRepairQueue.get(wall);ratioRepairQueue.set(wall,old==null?idx:Math.min(old,idx));
    if(ratioRepairFrame)return;ratioRepairFrame=requestAnimationFrame(()=>{ratioRepairFrame=0;flushRatioRepairs()})
  }
  function flushRatioRepairs(){
    if(!ratioRepairQueue.size)return;gridStats.repairBatches++;
    for(const [wall,idx] of [...ratioRepairQueue]){ratioRepairQueue.delete(wall);if(!wall?.isConnected||!wall.classList.contains(WALL))continue;const anchor=captureWallAnchor(wall);layoutWall(wall,false,idx);restoreWallAnchor(anchor);gridStats.ratioRepairs++}
  }
  function scheduleWidthRelayout(wall){
    widthQueue.add(wall);if(widthFrame)return;widthFrame=requestAnimationFrame(()=>{widthFrame=0;for(const w of [...widthQueue]){widthQueue.delete(w);if(!w?.isConnected||!w.classList.contains(WALL))continue;const anchor=captureWallAnchor(w);layoutWall(w,true);restoreWallAnchor(anchor);gridStats.widthRelayouts++}})
  }
  document.addEventListener('load',e=>{
    const img=e.target;if(!(img instanceof HTMLImageElement)||img.classList.contains('__xgridpro_live_gif__')||img.classList.contains('__xgridpro_hd_image__'))return;
    const card=img.closest?.('.'+IMAGE_ONLY);if(!card||mainImage(card)!==img)return;scheduleRatioRepair(card)
  },true);

  function prepareGallery(c){
    if(!c||c.parentElement?.closest?.('.'+WALL))return;
    const firstPass=!c.classList.contains(WALL);
    // Clear nested legacy walls once. Repeating this on every Google mutation caused visible churn.
    if(firstPass)c.querySelectorAll('.'+WALL).forEach(n=>{if(n!==c)clearGallery(n)});
    for(const card of [...c.children]){
      if(card.matches?.('script,style,template'))continue;
      const img=mainImage(card);
      if(!img){if(card.classList.contains(IMAGE_ONLY))clearCard(card);card.classList.add(SKIP);continue}
      const cachedRatio=wallRatioCache.get(card);if(!cachedRatio||cachedRatio.img!==img)wallRatioCache.set(card,ratioInfo(card));
      card.classList.remove(SKIP);prepareCard(card);if(card.dataset?.xgridSearchFiltered==='1')card.classList.add(SKIP)
    }
    c.classList.add(WALL);
    layoutWall(c);validateWall(c);xsMaybeIndexWall(c)
  }

  function clearGallery(c){
    if(!c)return;
    wallResizeObserver?.unobserve(c);ratioRepairQueue.delete(c);widthQueue.delete(c);
    c.classList.remove(WALL);wallLayoutCache.delete(c);
    for(const card of [...c.children]){clearCard(card);for(const prop of ['position','left','top','width','max-width','height','min-height','max-height'])card.style?.removeProperty(prop)}
    for(const prop of ['height','min-height','max-height','position','margin','padding'])c.style?.removeProperty(prop)
  }

  const ghostChecks=new WeakMap();let ghostSuppressed=0;
  function ghostSignature(c){
    if(!c?.isConnected||!c.classList?.contains(WALL))return false;
    gridRead();const r=c.getBoundingClientRect(),cw=c.clientWidth||0,sw=c.scrollWidth||0,vw=Math.max(1,innerWidth||document.documentElement.clientWidth||1);
    return r.width<24&&cw<24&&sw>vw*.72
  }
  function suppressGhostWall(c){
    if(!c?.isConnected||c.classList?.contains(GHOST))return;
    clearGallery(c);c.classList.add(GHOST);ghostSuppressed++
  }
  function validateWall(c){
    if(!c?.isConnected||!c.classList?.contains(WALL))return;
    if(!ghostSignature(c)){ghostChecks.delete(c);return}
    const n=(ghostChecks.get(c)||0)+1;ghostChecks.set(c,n);
    if(n>=2){suppressGhostWall(c);return}
    requestAnimationFrame(()=>{if(c?.isConnected&&c.classList?.contains(WALL)){if(ghostSignature(c))suppressGhostWall(c);else ghostChecks.delete(c)}})
  }
  function reviveGhostWalls(){
    document.querySelectorAll('.'+GHOST).forEach(c=>{c.classList.remove(GHOST);ghostChecks.delete(c)})
  }

  function checkCandidate(c){
    if(!c||!c.classList)return;
    if(c.classList.contains(GHOST))return;
    if(c.parentElement?.closest?.('.'+WALL)){if(c.classList.contains(WALL))clearGallery(c);return}
    if(c.classList.contains(WALL)&&ghostSignature(c)){validateWall(c);return}
    if(isGallery(c))prepareGallery(c);
    else if(c.classList.contains(WALL))clearGallery(c)
  }

  function optimizeImages(root=document){
    if(!root||!root.querySelectorAll)return;
    const imgs=root.matches&&root.matches('img')?[root]:root.querySelectorAll('img');
    for(const img of imgs){
      if(img.dataset.xbgOptimized)continue;img.dataset.xbgOptimized='1';img.classList.add('xbg_ratio')
    }
    // Do not change loading/decoding/fetchpriority. Google already schedules its thumbnails;
    // changing those attributes here made the wall visibly reload while scrolling.
  }

  function initialGalleries(){
    if(initialScanQueued)return;initialScanQueued=true;
    idle(()=>{const t0=performance.now();initialScanQueued=false;gridStats.initialScans++;document.querySelectorAll('main,section,article,div,ul,ol').forEach(checkCandidate);const dt=performance.now()-t0;gridInitialScanMs+=dt;gridInitialScanMax=Math.max(gridInitialScanMax,dt)})
  }

  function queueGalleryNodes(nodes){
    for(const node of nodes||[])if(node&&node.nodeType===1)pendingGalleryNodes.add(node);
    if(galleryQueued)return;galleryQueued=true;
    nextPaint(()=>{
      const __t0=performance.now();galleryQueued=false;const batch=[...pendingGalleryNodes];pendingGalleryNodes.clear();const seen=new Set();
      gridStats.mutationBatches++;gridStats.mutationNodes+=batch.length;
      for(const node of batch){
        if(!node||node.nodeType!==1||!node.isConnected)continue;optimizeImages(node);
        let p=node;
        for(let i=0;p&&p!==document.body&&i<5;i++,p=p.parentElement)if(!seen.has(p)){seen.add(p);checkCandidate(p)}
        node.querySelectorAll&&node.querySelectorAll('main,section,article,div,ul,ol').forEach(c=>{
          if(c.children.length>=4&&!seen.has(c)){seen.add(c);checkCandidate(c)}
        })
      }
      const __dt=performance.now()-__t0;gridMutationMs+=__dt;gridMutationMax=Math.max(gridMutationMax,__dt);
      // If mutations arrived while this batch was processing, never drop them.
      if(pendingGalleryNodes.size)queueGalleryNodes([])
    })
  }

  function applyColumns(v){
    const next=clampCols(v),changed=next!==currentCols;currentCols=next;saveCols(currentCols);styles();
    document.documentElement.style.setProperty('--xbg-cols',String(currentCols));
    document.documentElement.style.setProperty('--xbg-gap',gapFor(currentCols)+'px');
    document.documentElement.dataset.xgridCols=String(currentCols);
    if(changed)gridStats.columnChanges++;
    // prepareGallery already performs the required layout. Do not immediately lay out twice.
    document.querySelectorAll('.'+WALL).forEach(w=>prepareGallery(w));
    updateControl();initialGalleries()
  }

  // XSearch Result Memory + FastPath GIF v28.3.4: native same-query continuation and metadata-precision search; all existing controls remain.
  // Preference learning and retrieval learning are intentionally separate: Goal/anchors/signals define what matters;
  // retrieval outcomes teach which Google query directions actually produce useful new candidates.
  // Retrieval, stable identity/indexing, intent (Goal/anchors/signals/sites/media), global scoring,
  // filtering/presentation and observability remain separate stages. Google supplies candidates;
  // XSearch decides when the live corpus is healthy, thin or exhausted and retrieves deliberately.
  const XS_KEY='__xgrid_xsearch_core_v1__',XS_OVERLAY='__xgrid_xsearch_overlay__',XS_TOAST='__xgrid_xsearch_toast__',XS_MAX=10,XS_FILTER_ATTR='xgridSearchFiltered';
  let xsOrigIndex=new WeakMap(),xsCardKey=new WeakMap();const xsResultIndex=new Map();
  let xsMetaCache=new WeakMap(),xsOrigCounter=0,xsPendingRankReason='none';
  const xsStructuredMeta=new Map();let xsSeenScripts=new WeakSet();
  let xsState=null,xsRankTimer=0,xsLongTimer=0,xsLongCard=null,xsLongX=0,xsLongY=0,xsBlockClickUntil=0,xsTrainerInstalled=false;
  let xsStructuredEntries=0,xsDomainWjd=0,xsDomainDom=0,xsDomainImage=0,xsDomainUnknown=0;
  let xsIndexBuilds=0,xsFullIndexBuilds=0,xsIncrementalPasses=0,xsNewCardsIndexed=0,xsStalePruned=0,xsIndexedCards=0,xsUniqueResults=0,xsVocabulary=0,xsAvgTags=0,xsIndexMs=0,xsIndexMax=0;
  let xsReranks=0,xsUserReranks=0,xsGoogleReranks=0,xsInitialReranks=0,xsDuplicateRankSchedules=0,xsCardsRanked=0,xsRestores=0,xsRankMs=0,xsRankMax=0,xsDomReorderMs=0,xsDomReorderMax=0,xsReorderTransactions=0,xsReorderMovedNodes=0,xsAnchorPreserved=0;
  let xsQuickOpens=0,xsHubOpens=0,xsCapBlocks=0,xsManualQueryResets=0,xsManualQueryRebases=0,xsMutationTriggers=0,xsSelfMutationsIgnored=0,xsFeedbackChoices=0,xsFeedbackRemovals=0,xsSearchBarRestores=0,xsGoogleUserEditUntil=0;
  let xsFindMoreBusy=false,xsNextBatchBusy=false,xsNavigationBusy=false,xsAutoTimer=0,xsFindMoreDuplicateBlocks=0,xsMediaCounts={gif:0,image:0,unknown:0};
  const XS_FIND_MORE_CHANGE_TARGET=.80,XS_FIND_MORE_WINDOW=25,XS_RESEARCH_FRESH_TARGET=1,XS_RESEARCH_TARGET_CARDS=100,XS_RESEARCH_MAX_PASSES=4,XS_GIF_PAGE_LIMIT=100;let xsFindMoreBaselineHashes=[];
  let xsNoveltyTimer=0,xsNoveltyStableSamples=0,xsNoveltyLastSignature='',xsNoveltySettleRuns=0;
  let xsDf=new Map(),xsIdf=new Map(),xsCorpusDocs=0,xsDuplicateHidden=0,xsRankingMode='full-greedy';
  let xsVisualCache=new WeakMap(),xsVisualAttempts=0,xsVisualSuccess=0,xsVisualBlocked=0,xsVisualFeaturesCount=0;
  let xsRetrievalQuiet=false,xsRetrievalPhase='idle',xsQuietSince=0,xsQuietEntries=0,xsQuietMs=0,xsQuietMutationCandidates=0,xsQuietNeedsIndex=false,xsQuietWatchdog=0,xsQuietToken=0,xsQuietWatchdogTrips=0,xsSettleReleaseTimer=0;
  let xsLastHealth={status:'thin',reason:'initial',total:0,unique:0,strong:0,similar:0,mediaCount:0,duplicateRatio:0};
  let xsPrevTopKeys=[],xsTop10Changed=0,xsHubExpanded=false,xsTagsExpanded=false;
  let xsIndexEpoch=0,xsIndexCommittedEpoch=0,xsIndexKey='',xsIndexResets=0,xsIndexIntegrityRepairs=0;
  const xsVisualIdentityCache=new Map();
  const XS_TXN_KEY='__xgrid_xsearch_nav_txn_v3__',XS_TXN_TTL=60000,XS_TXN_FALLBACK_TTL=15000;
  let xsIndexReady=false,xsIndexReason='initial',xsIndexTimer=0,xsTxnSeq=0,xsLastRankReason='none';
  let xsLastDiag={cards:0,moved:0,avgMove:0,maxMove:0,scoreMin:0,scoreMedian:0,scoreAvg:0,scoreMax:0,uniqueDomains:0,blockedLeakage:0,positiveTop10:0,filtered:0,top:[]};
  let xsCoverage={title:0,domain:0,source:0,image:0,dims:0,animation:0,total:0};
  const XS_STOP=new Set('the a an and or of to in on for with from by is are was were be been being this that these those it its at as into over under more less like image images photo photos gif gifs animated video videos result results search view click download stock website google gallery galleries page pages home homepage official source sources thumbnail thumbnails preview previews media content post posts article articles watch player embed embedded hd full fullscreen free online check out pics picture com net org www best pictures pic porn sex once went had have has having your yours you youre ive cant cannot could would should may might must needs need now then than which who whom whose what when where why how three two one first second next last really just very much many some any all each every own same other another also only'.split(' '));
  const XS_RETRIEVAL_NOISE=new Set('best new tag tags user users latest top trending viral random funny hottest hot fresh today daily world page pages clip clips post posts category categories collection collections stuff thing things site website pics picture photo photos image images gif gifs video videos watch free online'.split(' '));
  function xsGoogleImages(){try{const u=new URL(location.href);return /(^|\.)google\./i.test(u.hostname)&&(u.searchParams.get('udm')==='2'||u.searchParams.get('tbm')==='isch'||/\/search/i.test(u.pathname))}catch(_){return false}}
  function xsCurrentQuery(){try{return new URL(location.href).searchParams.get('q')||''}catch(_){return ''}}
  function xsRestoreGoogleSearchDisplay(s=xsState){if(!xsGoogleImages()||!s?.baseQuery||Date.now()<xsGoogleUserEditUntil)return 0;const base=String(s.baseQuery),els=[...document.querySelectorAll('textarea[name="q"],input[name="q"]')].filter(el=>el&&String(el.type||'').toLowerCase()!=='hidden');let n=0;for(const el of els){if(document.activeElement===el||String(el.value||'')===base)continue;try{const proto=Object.getPrototypeOf(el),d=Object.getOwnPropertyDescriptor(proto,'value');if(d?.set)d.set.call(el,base);else el.value=base;el.setAttribute('value',base);n++}catch(_){try{el.value=base;n++}catch(__){}}}if(n)xsSearchBarRestores+=n;return n}
  function xsScheduleGoogleSearchDisplay(s=xsState){if(!s?.baseQuery)return;for(const ms of [0,80,240,700,1600,3000])setTimeout(()=>xsRestoreGoogleSearchDisplay(s),ms)}
  document.addEventListener('input',e=>{const el=e.target;if(el?.matches?.('textarea[name="q"],input[name="q"]'))xsGoogleUserEditUntil=Date.now()+15000},true);document.addEventListener('keydown',e=>{const el=e.target;if(e.key==='Enter'&&el?.matches?.('textarea[name="q"],input[name="q"]'))xsGoogleUserEditUntil=Date.now()+15000},true);
  function xsQueryKey(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ')}
  function xsNorm(v){return String(v||'').normalize?.('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ')}
  function xsHost(v){try{return new URL(v,location.href).hostname.toLowerCase().replace(/^www\./,'')}catch(_){return ''}}
  const XS_MULTI_SUFFIX=new Set(['co.uk','org.uk','com.au','net.au','org.au','co.za','org.za','net.za','co.nz','com.br','com.mx','co.jp','co.in','com.sg','com.tr']);
  function xsSiteKey(v){let h=String(v||'').toLowerCase().replace(/^www\./,'').replace(/\.$/,'');if(!h)return '';const p=h.split('.').filter(Boolean);if(p.length<=2)return h;const tail2=p.slice(-2).join('.');return XS_MULTI_SUFFIX.has(tail2)&&p.length>=3?p.slice(-3).join('.'):tail2}
  function xsSameSite(a,b){const x=xsSiteKey(a),y=xsSiteKey(b);return !!x&&x===y}
  function xsTokens(v,limit=80){const out=[];for(const w of xsNorm(v).split(' ')){if(w.length<3||w.length>30||XS_STOP.has(w)||/^\d+$/.test(w)||out.includes(w))continue;out.push(w);if(out.length>=limit)break}return out}
  function xsClamp(v,min,max){return Math.max(min,Math.min(max,Number(v)||0))}
  function xsNewSessionId(){return 'xss-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)}
  function xsStats(){return {choices:0,removals:0,clears:0,newSearches:0,completeRefreshes:0,nextBatchActions:0,exactSearches:0,signalsAdded:0,signalsEdited:0,signalsDeleted:0,guaranteedSignalChoices:0,tagsPromoted:0,tagsDeleted:0,signalsDemoted:0,sitesRegistered:0,goalEdits:0,goalApplies:0,siteChanges:0,mediaChanges:0,retrievalActions:0,autoRetrievals:0,findMoreFallbacks:0,ownedNavigationsPreserved:0,ownedNavigationRejects:0,top10More:0,top10Less:0,outside10More:0,outside10Less:0,lastAction:'',lastAt:0}}
  function xsDefaults(q){const base=String(q||''),now=Date.now();return {v:15,qualityModel:6,qualityRebuildPending:false,searchSession:{id:xsNewSessionId(),createdAt:now,navSeq:0,preservedNavigations:0,rejectedNavigations:0,lastOwnedNavAt:0},pendingNavigation:null,baseQuery:base,baseKey:xsQueryKey(base),retrievalQuery:base,retrievalKey:xsQueryKey(base),pendingRetrievalKey:'',pendingRetrievalKind:'',goal:base,strength:'balanced',mediaIntent:'gif',autoRetrieve:true,resultMemoryMode:'open',feedback:[],signals:[],manualTags:[],suppressedSignals:[],suppressedTags:[],registeredSites:[],siteRules:[],flags:{idf:true,diversity:true,mediaBias:true,visual:true,quietRetrieval:true},retrieval:{batches:1,searches:0,findMore:0,findMoreGrowth:0,researches:0,auto:0,quiet:0,lastGrowth:0,lastKind:'initial',lastQuery:base,lastMedia:'mixed',lastReason:'initial',queryHistory:[],previousIdentityHashes:[],seenIdentityHashes:[],pendingNovelty:false,lastNoveltyCount:0,lastNoveltyRatio:0,lastOverlapCount:0,plannerSlot:0,plannerTerm:'',plannerSupport:0,lastResearchMode:'',lastResearchTerm:'',lastFindMoreOutcome:'',actionStartCorpus:0,pageHighWater:0,lastPreservedCorpus:0,lastFindMoreStart:0,lastFindMoreHighWater:0,lastFindMoreNetGrowth:0,lastFindMorePasses:0,lastFindMoreBatches:0,lastFindMoreViewportRestored:false,lastFindMoreDurationMs:0,lastFindMoreTxnId:'',retrievalOutcomes:[],pendingRetrievalEval:null,lastUsefulNoveltyCount:0,lastUsefulNoveltyRatio:0,lastRetrievalYield:0,lastDestinationStrong:0,lastDestinationDomains:0,lastCoverageGap:0,lastCoverageGapTerm:'',lastDecisionDelta:null,findMoreChangeTarget:XS_FIND_MORE_CHANGE_TARGET,lastFindMoreChangedCount:0,lastFindMoreChangedRatio:0,lastFindMoreWindow:0,activeFreshnessTarget:0,lastResearchSeenHidden:0,lastResearchFreshnessTarget:0,lastResearchFreshnessAchieved:0,lastResearchRepeatPruned:0,lastResearchFreshAccepted:0,researchTargetCards:XS_RESEARCH_TARGET_CARDS,researchPasses:0,researchStatus:'',lastResearchPurpose:'',researchTxn:null,nextBatchOffset:0,nextBatchQuery:'',nextBatchPruned:0,nextBatchLastStatus:'',exactMode:false,lastAt:now},stats:xsStats(),createdAt:now,updatedAt:now}}
  function xsSignalRecord(tag,weight,source='learned',hits=0,origins=[]){const clean=xsNorm(tag);return {tag:clean,weight:Number(xsClamp(weight,-10,10).toFixed(2)),source,learnedHits:Math.max(0,Number(hits)||0),origins:[...new Set(Array.isArray(origins)?origins.filter(Boolean):[])].slice(0,XS_MAX),at:Date.now()}}
  function xsGoodSignalToken(t){if(!t||t.length<3||t.length>26||XS_STOP.has(t))return false;if(/^[a-z]*\d{3,}[a-z\d_-]*$/i.test(t))return false;if(/^[a-z0-9_-]{9,}$/i.test(t)){const d=(t.match(/\d/g)||[]).length,v=(t.match(/[aeiou]/ig)||[]).length;if(d>=2&&d/t.length>=.18)return false;if(v===0||v/t.length<.12)return false}const d=(t.match(/\d/g)||[]).length;if(d/t.length>=.25)return false;const unique=new Set(t).size;if(t.length>=9&&unique/t.length<.38)return false;return true}
  function xsIdfWeight(t){if(!(xsState?.flags?.idf??true))return 1;return xsIdf.get(t)||1}
  function xsTermPrevalence(t){return xsCorpusDocs?((xsDf.get(t)||0)/xsCorpusDocs):0}
  function xsLegacySignals(s,q){const base=new Set(xsTokens(q,36)),score=new Map();for(const f of Array.isArray(s?.feedback)?s.feedback:[]){if(f.type!=='more'&&f.type!=='less')continue;const sign=f.type==='more'?1:-1;for(const [t,w] of Object.entries(f.vector||{})){if(base.has(t)||!xsGoodSignalToken(t))continue;score.set(t,(score.get(t)||0)+sign*(Number(w)||0))}}return [...score.entries()].filter(([,v])=>Math.abs(v)>=.7).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,18).map(([tag,w])=>xsSignalRecord(tag,xsClamp(w,-10,10),'learned',1))}
  function xsNormalizeState(s,q){
    if(!s||typeof s!=='object')return xsDefaults(q);
    if(s.v===1){const n=xsDefaults(s.baseQuery||q);n.strength=s.strength==='strong'?'strong':'balanced';n.feedback=(Array.isArray(s.feedback)?s.feedback:[]).filter(f=>f?.type==='more'||f?.type==='less').slice(0,XS_MAX);n.signals=xsLegacySignals(s,n.baseQuery);const rules=new Map();for(const f of Array.isArray(s.feedback)?s.feedback:[]){if(!f?.domain)continue;if(f.type==='site+')rules.set(xsSiteKey(f.domain),{domain:xsSiteKey(f.domain),mode:'more',at:f.at||Date.now()});if(f.type==='site-')rules.set(xsSiteKey(f.domain),{domain:xsSiteKey(f.domain),mode:'none',at:f.at||Date.now()})}n.siteRules=[...rules.values()];n.stats=Object.assign(xsStats(),s.stats||{});return n}
    if(s.v===2){s.v=3;s.suppressedSignals=[]}
    if(s.v===3){s.v=4;s.mediaIntent='auto';s.autoRetrieve=true;s.retrievalQuery=String(q||s.baseQuery||'');s.retrievalKey=xsQueryKey(s.retrievalQuery);s.pendingRetrievalKey='';s.pendingRetrievalKind='';s.retrieval={batches:1,searches:0,findMore:0,findMoreGrowth:0,researches:0,auto:0,lastKind:'migrated',lastQuery:s.retrievalQuery,lastMedia:'mixed',lastAt:Date.now()}}
    if(s.v===4){s.v=5;s.flags={idf:true,diversity:true,mediaBias:true,visual:true,quietRetrieval:true};s.retrieval=Object.assign({quiet:0,lastGrowth:0,lastReason:'migrated'},s.retrieval||{})}
    if(s.v===5){s.v=6;s.retrieval=Object.assign({queryHistory:[],previousIdentityHashes:[],seenIdentityHashes:[],pendingNovelty:false,lastNoveltyCount:0,lastNoveltyRatio:0,lastOverlapCount:0,plannerSlot:0},s.retrieval||{})}
    if(s.v===6){s.v=7;s.searchSession={id:xsNewSessionId(),createdAt:s.createdAt||Date.now(),navSeq:0,preservedNavigations:0,rejectedNavigations:0,lastOwnedNavAt:0};s.pendingNavigation=null}
    if(s.v===7){s.v=8;s.qualityModel=2;s.qualityRebuildPending=true}
    if(s.v===8){s.v=9;s.qualityModel=3;s.qualityRebuildPending=true}
    if(s.v===9){s.v=10;s.qualityModel=4;s.manualTags=[];s.qualityRebuildPending=true}
    if(s.v===10){s.v=11;s.retrieval=Object.assign({retrievalOutcomes:[],pendingRetrievalEval:null,lastUsefulNoveltyCount:0,lastUsefulNoveltyRatio:0,lastRetrievalYield:0,lastDestinationStrong:0,lastDestinationDomains:0,lastCoverageGap:0,lastCoverageGapTerm:'',lastDecisionDelta:null},s.retrieval||{})}
    if(s.v===11){s.v=12;s.qualityModel=5;s.suppressedTags=[];s.registeredSites=[];s.qualityRebuildPending=false}
    if(s.v===12){s.v=13;s.qualityModel=6;s.retrieval=Object.assign({seenIdentityHashes:[]},s.retrieval||{})}
    if(s.v===13){s.v=14;s.retrieval=Object.assign({findMoreChangeTarget:XS_FIND_MORE_CHANGE_TARGET,lastFindMoreChangedCount:0,lastFindMoreChangedRatio:0,lastFindMoreWindow:0,activeFreshnessTarget:0,lastResearchSeenHidden:0},s.retrieval||{})}
    if(s.v===14){s.v=15;s.retrieval=Object.assign({lastResearchFreshnessTarget:0,lastResearchFreshnessAchieved:0,lastResearchRepeatPruned:0,lastResearchFreshAccepted:0,researchTargetCards:XS_RESEARCH_TARGET_CARDS,researchPasses:0,researchStatus:'',researchTxn:null},s.retrieval||{})}
    if(s.v!==15)return xsDefaults(q);
    const now=Date.now(),ss=s.searchSession&&typeof s.searchSession==='object'?s.searchSession:{};s.searchSession={id:String(ss.id||xsNewSessionId()),createdAt:Number(ss.createdAt)||s.createdAt||now,navSeq:Math.max(0,Number(ss.navSeq)||0),preservedNavigations:Math.max(0,Number(ss.preservedNavigations)||0),rejectedNavigations:Math.max(0,Number(ss.rejectedNavigations)||0),lastOwnedNavAt:Math.max(0,Number(ss.lastOwnedNavAt)||0)};
    if(s.pendingNavigation&&typeof s.pendingNavigation==='object'){const pn=s.pendingNavigation,age=now-(Number(pn.startedAt)||0);s.pendingNavigation=age>=0&&age<=XS_TXN_TTL?{id:String(pn.id||''),sessionId:String(pn.sessionId||''),kind:String(pn.kind||'research'),expectedKey:xsQueryKey(pn.expectedKey||pn.expectedQuery||''),expectedQuery:String(pn.expectedQuery||''),sourceRetrievalKey:xsQueryKey(pn.sourceRetrievalKey||''),sourceBaseKey:xsQueryKey(pn.sourceBaseKey||''),media:String(pn.media||'mixed'),marker:String(pn.marker||''),preserveTarget:pn.preserveTarget!==false,startedAt:Number(pn.startedAt)||now}:null}else s.pendingNavigation=null;
    s.baseQuery=String(s.baseQuery||q||'');s.baseKey=xsQueryKey(s.baseQuery);s.retrievalQuery=String(s.retrievalQuery||q||s.baseQuery);s.retrievalKey=xsQueryKey(s.retrievalQuery);s.pendingRetrievalKey=xsQueryKey(s.pendingRetrievalKey||'');s.pendingRetrievalKind=String(s.pendingRetrievalKind||'');s.goal=String(s.goal==null?s.baseQuery:s.goal).trim();s.strength=['balanced','strong','aggressive'].includes(s.strength)?s.strength:'balanced';s.mediaIntent='gif';s.autoRetrieve=s.autoRetrieve!==false;s.resultMemoryMode=['auto','manual','open'].includes(s.resultMemoryMode)?s.resultMemoryMode:'open';
    s.qualityModel=6;s.qualityRebuildPending=!!s.qualityRebuildPending;
    s.flags=Object.assign({idf:true,diversity:true,mediaBias:true,visual:true,quietRetrieval:true},s.flags&&typeof s.flags==='object'?s.flags:{});
    s.feedback=(Array.isArray(s.feedback)?s.feedback:[]).filter(f=>f?.type==='more'||f?.type==='less').slice(0,XS_MAX).map(f=>Object.assign({},f,{domain:xsSiteKey(f.domain||''),mediaType:['gif','image','unknown'].includes(f.mediaType)?f.mediaType:'unknown',mediaConfidence:xsClamp(f.mediaConfidence!=null?f.mediaConfidence:((f.mediaType==='gif'||f.mediaType==='image')?.7:0),0,1)}));
    const sm=new Map();for(const raw of Array.isArray(s.signals)?s.signals:[]){const source=raw?.source||'learned',original=xsNorm(raw?.tag),tag=source==='learned'?xsAtomicLearnedSignalTag(original,s):original;if(!tag)continue;const rec=xsSignalRecord(tag,raw.weight,source,raw.learnedHits,raw.origins),prev=sm.get(tag);if(prev&&prev.source==='learned'&&rec.source==='learned'){prev.origins=[...new Set([...(prev.origins||[]),...(rec.origins||[])])].slice(0,XS_MAX);prev.learnedHits=Math.max(prev.learnedHits||0,rec.learnedHits||0,prev.origins.length);if(Math.sign(prev.weight||0)===Math.sign(rec.weight||0)&&Math.abs(rec.weight)>Math.abs(prev.weight))prev.weight=rec.weight;prev.at=Math.max(prev.at||0,rec.at||0)}else if(!prev||Math.abs(rec.weight)>=Math.abs(prev.weight))sm.set(tag,rec)}s.signals=[...sm.values()].slice(0,40);
    s.manualTags=(Array.isArray(s.manualTags)?s.manualTags:[]).map(x=>({tag:xsNorm(x?.tag||x),score:Number(xsClamp(x?.score??3,-6,6).toFixed(2)),at:Number(x?.at)||Date.now()})).filter(x=>x.tag).filter((x,i,a)=>a.findIndex(y=>y.tag===x.tag)===i).slice(0,40);s.suppressedSignals=[...new Set((Array.isArray(s.suppressedSignals)?s.suppressedSignals:[]).map(xsNorm).filter(Boolean))].slice(0,80);s.suppressedTags=[...new Set((Array.isArray(s.suppressedTags)?s.suppressedTags:[]).map(xsNorm).filter(Boolean))].slice(0,120);const rsm=new Map();for(const raw of Array.isArray(s.registeredSites)?s.registeredSites:[]){const d=xsSiteKey(raw?.domain||raw);if(!d)continue;const prev=rsm.get(d)||{domain:d,more:0,less:0,total:0,lastAt:0};prev.more+=Math.max(0,Number(raw?.more)||0);prev.less+=Math.max(0,Number(raw?.less)||0);prev.total+=Math.max(0,Number(raw?.total)||0);prev.lastAt=Math.max(prev.lastAt,Number(raw?.lastAt)||0);rsm.set(d,prev)}s.registeredSites=[...rsm.values()].slice(-40);
    const rm=new Map();for(const raw of Array.isArray(s.siteRules)?s.siteRules:[]){const d=xsSiteKey(raw?.domain||'');if(!d||!['more','only','less','none'].includes(raw.mode))continue;rm.set(d,{domain:d,mode:raw.mode,at:raw.at||Date.now()})}s.siteRules=[...rm.values()];
    s.retrieval=Object.assign({batches:1,searches:0,findMore:0,findMoreGrowth:0,researches:0,auto:0,quiet:0,lastGrowth:0,lastKind:'initial',lastQuery:s.retrievalQuery,lastMedia:'mixed',lastReason:'initial',queryHistory:[],previousIdentityHashes:[],seenIdentityHashes:[],pendingNovelty:false,lastNoveltyCount:0,lastNoveltyRatio:0,lastOverlapCount:0,plannerSlot:0,findMoreChangeTarget:XS_FIND_MORE_CHANGE_TARGET,lastFindMoreChangedCount:0,lastFindMoreChangedRatio:0,lastFindMoreWindow:0,activeFreshnessTarget:0,lastResearchSeenHidden:0,lastResearchFreshnessTarget:0,lastResearchFreshnessAchieved:0,lastResearchRepeatPruned:0,lastResearchFreshAccepted:0,researchTargetCards:XS_RESEARCH_TARGET_CARDS,researchPasses:0,researchStatus:'',lastResearchPurpose:'',researchTxn:null,nextBatchOffset:0,nextBatchQuery:'',nextBatchPruned:0,nextBatchLastStatus:'',exactMode:false,lastAt:Date.now()},s.retrieval&&typeof s.retrieval==='object'?s.retrieval:{});s.retrieval.queryHistory=[...new Set((Array.isArray(s.retrieval.queryHistory)?s.retrieval.queryHistory:[]).map(xsQueryKey).filter(Boolean))].slice(-8);s.retrieval.previousIdentityHashes=[...new Set((Array.isArray(s.retrieval.previousIdentityHashes)?s.retrieval.previousIdentityHashes:[]).map(String).filter(Boolean))].slice(-1200);s.retrieval.seenIdentityHashes=s.resultMemoryMode==='open'?[]:[...new Set((Array.isArray(s.retrieval.seenIdentityHashes)?s.retrieval.seenIdentityHashes:[]).map(String).filter(Boolean))].slice(-1200);s.retrieval.retrievalOutcomes=(Array.isArray(s.retrieval.retrievalOutcomes)?s.retrieval.retrievalOutcomes:[]).filter(x=>x&&typeof x==='object').slice(-24).map(x=>({kind:String(x.kind||''),term:xsNorm(x.term||''),queryKey:xsQueryKey(x.queryKey||x.query||''),baseKey:xsQueryKey(x.baseKey||''),goalKey:xsQueryKey(x.goalKey||''),sourceCount:Math.max(0,Number(x.sourceCount)||0),destinationCount:Math.max(0,Number(x.destinationCount)||0),newCount:Math.max(0,Number(x.newCount)||0),overlapCount:Math.max(0,Number(x.overlapCount)||0),usefulNewCount:Math.max(0,Number(x.usefulNewCount)||0),noveltyRatio:xsClamp(x.noveltyRatio,0,1),usefulRatio:xsClamp(x.usefulRatio,0,1),strongCount:Math.max(0,Number(x.strongCount)||0),domainCount:Math.max(0,Number(x.domainCount)||0),yieldScore:xsClamp(x.yieldScore,0,1),at:Math.max(0,Number(x.at)||0)}));
    for(const [k,v] of Object.entries({plannerTerm:'',plannerSupport:0,lastResearchMode:'',lastResearchTerm:'',lastFindMoreOutcome:'',actionStartCorpus:0,pageHighWater:0,lastPreservedCorpus:0,lastFindMoreStart:0,lastFindMoreHighWater:0,lastFindMoreNetGrowth:0,lastFindMorePasses:0,lastFindMoreBatches:0,lastFindMoreViewportRestored:false,lastFindMoreDurationMs:0,lastFindMoreTxnId:'',retrievalOutcomes:[],pendingRetrievalEval:null,lastUsefulNoveltyCount:0,lastUsefulNoveltyRatio:0,lastRetrievalYield:0,lastDestinationStrong:0,lastDestinationDomains:0,lastCoverageGap:0,lastCoverageGapTerm:'',lastDecisionDelta:null,findMoreChangeTarget:XS_FIND_MORE_CHANGE_TARGET,lastFindMoreChangedCount:0,lastFindMoreChangedRatio:0,lastFindMoreWindow:0,activeFreshnessTarget:0,lastResearchSeenHidden:0,lastResearchFreshnessTarget:0,lastResearchFreshnessAchieved:0,lastResearchRepeatPruned:0,lastResearchFreshAccepted:0,researchTargetCards:XS_RESEARCH_TARGET_CARDS,researchPasses:0,researchStatus:'',lastResearchPurpose:'',researchTxn:null,nextBatchOffset:0,nextBatchQuery:'',nextBatchPruned:0,nextBatchLastStatus:'',exactMode:false}))if(s.retrieval[k]==null)s.retrieval[k]=v;s.retrieval.exactMode=s.retrieval.exactMode===true;if(s.resultMemoryMode==='open')s.retrieval.activeFreshnessTarget=0;
    if(s.retrieval.researchTxn&&typeof s.retrieval.researchTxn==='object'&&s.retrieval.researchTxn.active){const tx=s.retrieval.researchTxn;tx.id=String(tx.id||('xrt-'+Date.now().toString(36)));tx.pass=Math.max(1,Number(tx.pass)||1);tx.maxPasses=Math.max(1,Number(tx.maxPasses)||XS_RESEARCH_MAX_PASSES);tx.targetCards=Math.max(1,Number(tx.targetCards)||XS_RESEARCH_TARGET_CARDS);tx.baselineSeenHashes=[...new Set((Array.isArray(tx.baselineSeenHashes)?tx.baselineSeenHashes:[]).map(String).filter(Boolean))].slice(-1200);tx.excludeDomains=[...new Set((Array.isArray(tx.excludeDomains)?tx.excludeDomains:[]).map(xsSiteKey).filter(Boolean))].slice(0,3);tx.bestFresh=Math.max(0,Number(tx.bestFresh)||0);tx.bestQuery=String(tx.bestQuery||'');tx.purpose=tx.purpose==='complete-refresh'?'complete-refresh':'research';tx.seedQuery=String(tx.seedQuery||'');tx.sourceHashes=[...new Set((Array.isArray(tx.sourceHashes)?tx.sourceHashes:[]).map(String))].slice(-1200);tx.startedAt=Math.max(0,Number(tx.startedAt)||Date.now())}else s.retrieval.researchTxn=null;
    s.stats=Object.assign(xsStats(),s.stats&&typeof s.stats==='object'?s.stats:{});return s
  }
  function xsLoad(){if(xsState)return xsSync();let s=null;try{s=JSON.parse(localStorage.getItem(XS_KEY)||'null')}catch(_){}xsState=xsNormalizeState(s,xsCurrentQuery());xsSave();return xsSync()}
  function xsSave(){if(!xsState)return;xsState.updatedAt=Date.now();try{localStorage.setItem(XS_KEY,JSON.stringify(xsState))}catch(_){}updateControl()}
  function xsWriteNavTxn(kind,query,media,marker=''){const s=xsState||xsLoad(),ss=s.searchSession||(s.searchSession={id:xsNewSessionId(),createdAt:Date.now(),navSeq:0,preservedNavigations:0,rejectedNavigations:0,lastOwnedNavAt:0}),seq=++ss.navSeq,txn={id:ss.id+':'+seq,sessionId:ss.id,kind:String(kind||'research'),expectedKey:xsQueryKey(query),expectedQuery:String(query||''),sourceRetrievalKey:xsQueryKey(s.retrievalKey||xsCurrentQuery()),sourceBaseKey:xsQueryKey(s.baseKey||s.baseQuery),media:String(media||'mixed'),marker:String(marker||Date.now()),preserveTarget:true,startedAt:Date.now()};s.pendingNavigation=txn;s.pendingRetrievalKey=txn.expectedKey;s.pendingRetrievalKind=txn.kind;try{sessionStorage.setItem(XS_TXN_KEY,JSON.stringify(txn))}catch(_){}return txn}
  function xsReadNavTxn(){const now=Date.now(),s=xsState;if(s?.pendingNavigation&&typeof s.pendingNavigation==='object'){const t=s.pendingNavigation,age=now-(Number(t.startedAt)||0);if(age>=0&&age<=XS_TXN_TTL&&t.sessionId===s.searchSession?.id)return t;if(age>XS_TXN_TTL)s.pendingNavigation=null}try{const t=JSON.parse(sessionStorage.getItem(XS_TXN_KEY)||'null'),age=now-(Number(t?.startedAt)||0);if(t&&age>=0&&age<=XS_TXN_TTL)return t;sessionStorage.removeItem(XS_TXN_KEY)}catch(_){}return null}
  function xsClearNavTxn(s=xsState){if(s){s.pendingNavigation=null;s.pendingRetrievalKey='';s.pendingRetrievalKind=''}try{sessionStorage.removeItem(XS_TXN_KEY)}catch(_){}}
  function xsQuerySimilarity(a,b){const A=new Set(xsTokens(a,40)),B=new Set(xsTokens(b,40));if(!A.size&&!B.size)return 1;if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(A.size,B.size)}
  function xsCurrentNavMarker(){try{return new URL(location.href).searchParams.get('zx')||''}catch(_){return ''}}
  function xsOwnedNavigationMatch(txn,q,key,s=xsState){if(!txn||!s||txn.sessionId!==s.searchSession?.id||txn.preserveTarget===false)return {match:false,reason:'session'};const age=Date.now()-(Number(txn.startedAt)||0);if(age<0||age>XS_TXN_TTL)return {match:false,reason:'expired'};const marker=xsCurrentNavMarker(),markerMatch=!!txn.marker&&marker===txn.marker,arrived=key!==xsQueryKey(txn.sourceRetrievalKey),exact=arrived&&!!txn.expectedKey&&key===txn.expectedKey,sim=xsQuerySimilarity(q,txn.expectedQuery||txn.expectedKey),fallback=arrived&&age<=XS_TXN_FALLBACK_TTL&&sim>=.7;return {match:markerMatch||exact||fallback,markerMatch,arrived,exact,fallback,sim,age,reason:markerMatch?'marker':exact?'query':fallback?'similarity':'mismatch'}}
  function xsSetRetrievalQuiet(on,reason='retrieval'){return xsSetRetrievalPhase(on?'harvesting':'idle',reason)}
  function xsSetRetrievalPhase(phase='idle',reason='retrieval',watchdogMs=0){if(!['idle','harvesting','navigating','settling'].includes(phase))phase='idle';const prevPhase=xsRetrievalPhase,prevQuiet=xsRetrievalQuiet;clearTimeout(xsQuietWatchdog);xsQuietWatchdog=0;xsRetrievalPhase=phase;xsRetrievalQuiet=phase!=='idle';window.__xgridRetrievalQuiet=xsRetrievalQuiet;if(xsRetrievalQuiet&&!prevQuiet){xsQuietSince=performance.now();xsQuietEntries++;const s=xsState||xsLoad();if(s?.retrieval)s.retrieval.quiet=(s.retrieval.quiet||0)+1}else if(!xsRetrievalQuiet&&prevQuiet&&xsQuietSince){xsQuietMs+=performance.now()-xsQuietSince;xsQuietSince=0}const token=++xsQuietToken;if(xsRetrievalQuiet){const ms=watchdogMs|| (phase==='navigating'?14000:phase==='harvesting'?9000:7000);xsQuietWatchdog=setTimeout(()=>{if(token!==xsQuietToken||xsRetrievalPhase==='idle')return;xsQuietWatchdogTrips++;xsNavigationBusy=false;xsFindMoreBusy=false;xsRetrievalPhase='idle';xsRetrievalQuiet=false;window.__xgridRetrievalQuiet=false;if(xsQuietSince){xsQuietMs+=performance.now()-xsQuietSince;xsQuietSince=0}try{window.dispatchEvent(new CustomEvent('__xgridRetrievalQuiet',{detail:{quiet:false,phase:'idle',reason:'watchdog-'+reason}}))}catch(_){}xsScheduleIndex(20,'google')},ms)}if(prevPhase!==phase||prevQuiet!==xsRetrievalQuiet)try{window.dispatchEvent(new CustomEvent('__xgridRetrievalQuiet',{detail:{quiet:xsRetrievalQuiet,phase,reason}}))}catch(_){}return phase}
  function xsScheduleSettleRelease(reason='index-settled'){clearTimeout(xsSettleReleaseTimer);xsSettleReleaseTimer=setTimeout(()=>{if(xsRetrievalPhase!=='settling')return;if(xsQuietNeedsIndex){xsQuietNeedsIndex=false;xsRepairIndexIntegrity()}xsSetRetrievalPhase('idle',reason)},260)}
  function xsResetIndexState(nextKey='',reason='reset'){xsStructuredMeta.clear();xsSeenScripts=new WeakSet();xsMetaCache=new WeakMap();xsVisualCache=new WeakMap();xsResultIndex.clear();xsOrigIndex=new WeakMap();xsCardKey=new WeakMap();xsOrigCounter=0;xsIndexReady=false;xsDf.clear();xsIdf.clear();xsCorpusDocs=0;xsIndexKey=xsQueryKey(nextKey||xsCurrentQuery());xsIndexEpoch++;xsIndexResets++;return xsIndexEpoch}
  function xsRepairIndexIntegrity(){xsEnsureIndexEpoch();const cards=[...document.querySelectorAll('.'+WALL+' > .'+IMAGE_ONLY)];if(!cards.length)return false;const expected=new Set(cards.map(xsResultKey)).size;if(xsResultIndex.size>=expected&&xsCorpusDocs===expected&&(xsVocabulary===0||xsIdf.size>0))return false;for(const c of cards)xsRegisterCard(c);xsRefreshIndexStats(cards);xsIndexReady=true;xsIndexCommittedEpoch=xsIndexEpoch;xsIndexIntegrityRepairs++;return true}
  function xsEnsureIndexEpoch(){const key=xsQueryKey(xsCurrentQuery());if(!xsIndexKey){xsResetIndexState(key,'initial-epoch');return}if(key&&key!==xsIndexKey)xsResetIndexState(key,'query-key-change')}
  function xsPreserveOnManualGoogleSearch(q,key){const s=xsState||xsDefaults(q),oldBaseKey=xsQueryKey(s.baseQuery),goalFollowedBase=!s.goal||xsQueryKey(s.goal)===oldBaseKey;s.baseQuery=String(q||'');s.baseKey=key;s.retrievalQuery=String(q||'');s.retrievalKey=key;if(goalFollowedBase)s.goal=String(q||'');xsClearNavTxn(s);const r=s.retrieval||(s.retrieval={});r.lastKind='manual-google-search';r.exactMode=false;r.lastQuery=String(q||'');r.lastReason='manual-google-preserved';r.lastGrowth=0;r.queryHistory=[];r.previousIdentityHashes=[];r.seenIdentityHashes=[];r.pendingNovelty=false;r.retrievalOutcomes=[];r.pendingRetrievalEval=null;r.lastUsefulNoveltyCount=0;r.lastUsefulNoveltyRatio=0;r.lastRetrievalYield=0;r.lastDestinationStrong=0;r.lastDestinationDomains=0;r.lastCoverageGap=0;r.lastCoverageGapTerm='';r.lastDecisionDelta=null;r.findMoreChangeTarget=XS_FIND_MORE_CHANGE_TARGET;r.lastFindMoreChangedCount=0;r.lastFindMoreChangedRatio=0;r.lastFindMoreWindow=0;r.activeFreshnessTarget=0;r.lastResearchSeenHidden=0;r.lastResearchFreshnessTarget=0;r.lastResearchFreshnessAchieved=0;r.lastResearchRepeatPruned=0;r.lastResearchFreshAccepted=0;r.researchTargetCards=XS_RESEARCH_TARGET_CARDS;r.researchPasses=0;r.researchStatus='';r.researchTxn=null;r.nextBatchOffset=0;r.nextBatchQuery='';r.nextBatchLastStatus='';r.lastNoveltyCount=0;r.lastNoveltyRatio=0;r.lastOverlapCount=0;r.plannerSlot=0;r.plannerTerm='';r.plannerSupport=0;r.lastResearchMode='';r.lastResearchTerm='';r.lastFindMoreOutcome='';r.actionStartCorpus=0;r.pageHighWater=0;r.lastPreservedCorpus=0;r.lastFindMoreStart=0;r.lastFindMoreHighWater=0;r.lastFindMoreNetGrowth=0;r.lastFindMorePasses=0;r.lastFindMoreBatches=0;r.lastFindMoreViewportRestored=false;r.lastFindMoreDurationMs=0;r.lastFindMoreTxnId='';r.lastAt=Date.now();s.stats=s.stats||xsStats();s.stats.lastAction='manual-google-search-preserved';s.stats.lastAt=Date.now();xsManualQueryRebases++;xsResetIndexState(key,'manual-google-preserved');xsSetRetrievalPhase('idle','manual-google-preserved');xsSave();return s}
  function xsSync(){const q=xsCurrentQuery(),key=xsQueryKey(q);if(!xsState)xsState=xsDefaults(q);if(!q)return xsState;const txn=xsReadNavTxn();if(txn){const own=xsOwnedNavigationMatch(txn,q,key,xsState);if(own.match){const s=xsState;s.retrievalQuery=q;s.retrievalKey=key;s.retrieval.lastKind=txn.kind||s.retrieval.lastKind;s.retrieval.lastMedia=txn.media||s.retrieval.lastMedia;s.retrieval.lastQuery=q;s.retrieval.lastAt=Date.now();s.retrieval.lastReason='owned-navigation-'+own.reason;if(txn.kind==='next-page'){let reached=0;try{reached=Number(new URL(location.href).searchParams.get('start'))||0}catch(_){}s.retrieval.nextBatchLastStatus=reached===(Number(s.retrieval.nextBatchOffset)||0)?'offset-recognized':'offset-not-confirmed'}s.searchSession.preservedNavigations++;s.searchSession.lastOwnedNavAt=Date.now();s.stats.ownedNavigationsPreserved++;xsClearNavTxn(s);if(xsIndexKey&&xsIndexKey!==key)xsResetIndexState(key,'owned-navigation');xsNavigationBusy=false;xsSetRetrievalPhase('settling','owned-navigation',8000);xsSave();xsScheduleGoogleSearchDisplay(s);return s}const age=Date.now()-(Number(txn.startedAt)||0),sourceStillCurrent=key===xsQueryKey(txn.sourceRetrievalKey);if(sourceStillCurrent&&age<=XS_TXN_TTL)return xsState;xsState.searchSession.rejectedNavigations++;xsState.stats.ownedNavigationRejects++;xsClearNavTxn(xsState)}if(xsState.pendingRetrievalKey&&key===xsState.pendingRetrievalKey){xsState.retrievalQuery=q;xsState.retrievalKey=key;xsClearNavTxn(xsState);if(xsIndexKey&&xsIndexKey!==key)xsResetIndexState(key,'pending-navigation');xsSetRetrievalPhase('settling','pending-navigation',8000);xsSave();xsScheduleGoogleSearchDisplay(xsState);return xsState}if(!xsState.retrievalKey){xsState.retrievalQuery=q;xsState.retrievalKey=key;xsSave();return xsState}if(key!==xsState.retrievalKey)return xsPreserveOnManualGoogleSearch(q,key);return xsState}
  function xsClearLegacy(){try{localStorage.removeItem('__xgrid_targetlearn_v1__');sessionStorage.removeItem('__xgrid_refine_reopen_v259__');sessionStorage.removeItem('__xgrid_refine_nav_v260__');sessionStorage.removeItem('__xgrid_refine_guard_v261__')}catch(_){}}
  function xsCollectStrings(v,out,depth=0){if(depth>7||out.length>260||v==null)return;if(typeof v==='string'){out.push(v);return}if(Array.isArray(v)){for(const x of v)xsCollectStrings(x,out,depth+1);return}if(typeof v==='object'){for(const x of Object.values(v))xsCollectStrings(x,out,depth+1)}}
  function xsBalancedObject(text,start){const brace=text.indexOf('{',start);if(brace<0)return null;let depth=0,str=false,esc=false;for(let i=brace;i<text.length;i++){const ch=text[i];if(str){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')str=false;continue}if(ch==='"'){str=true;continue}if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0)return text.slice(brace,i+1)}}return null}
  function xsExternalHttp(v){try{const u=new URL(v,location.href),h=u.hostname.toLowerCase();return /^https?:$/.test(u.protocol)&&h&&!/(^|\.)google\.[a-z.]+$/i.test(h)&&!/(^|\.)gstatic\.com$/i.test(h)}catch(_){return false}}
  function xsSourceUrlScore(v,orig){if(!xsExternalHttp(v)||v===orig)return -999;let score=0;try{const u=new URL(v),path=(u.pathname||'').toLowerCase();if(!/\.(?:jpe?g|png|gif|webp|avif|apng|bmp|svg)(?:$|[?#])/i.test(path))score+=10;else score-=4;if(path&&path!=='/')score+=2;if(/article|post|gallery|photo|image|view|watch|page/i.test(path))score+=2;if(/[?&](?:url|imgurl|mediaurl)=/i.test(v))score-=4}catch(_){}return score}
  function xsTitleScore(v,docId){const t=String(v||'').trim();if(!t||t===docId||/^https?:\/\//i.test(t)||t.length<4||t.length>220||!/[A-Za-z\p{L}]/u.test(t))return -999;if(/^[A-Za-z0-9_-]{18,}$/.test(t))return -20;let score=Math.min(12,t.length/16);if(/\s/.test(t))score+=5;if(/[.!?:-]/.test(t))score+=1;return score}
  function xsExtractStructuredObject(obj){if(!obj||typeof obj!=='object')return;for(const val of Object.values(obj)){if(!Array.isArray(val))continue;let inner=val;if(Array.isArray(val[1]))inner=val[1];const docId=(typeof inner[1]==='string'&&inner[1])||(typeof inner[7]==='string'&&inner[7])||null;if(!docId)continue;const orig=Array.isArray(inner[3])&&typeof inner[3][0]==='string'?inner[3][0]:'';const ow=Array.isArray(inner[3])?Number(inner[3][1])||0:0,oh=Array.isArray(inner[3])?Number(inner[3][2])||0:0;const strings=[];xsCollectStrings(inner,strings);let sourceUrl='',sourceScore=-999,title='',titleScore=-999;for(const raw of strings){const us=xsSourceUrlScore(raw,orig);if(us>sourceScore){sourceScore=us;sourceUrl=raw}const ts=xsTitleScore(raw,docId);if(ts>titleScore){titleScore=ts;title=String(raw).trim()}}const domain=xsHost(sourceUrl)||xsHost(orig);const prev=xsStructuredMeta.get(docId);if(!domain&&!title&&!orig&&!prev)continue;const rec={docId,sourceUrl:sourceUrl||prev?.sourceUrl||'',originalUrl:orig||prev?.originalUrl||'',domain:domain||prev?.domain||'',title:title||prev?.title||'',w:ow||prev?.w||0,h:oh||prev?.h||0};if(!prev)xsStructuredEntries++;xsStructuredMeta.set(docId,rec)}}
  function xsRefreshStructured(){try{if(window.W_jd&&typeof window.W_jd==='object')xsExtractStructuredObject(window.W_jd)}catch(_){}for(const sc of document.querySelectorAll('script')){if(xsSeenScripts.has(sc))continue;xsSeenScripts.add(sc);const t=sc.textContent||'';if(t.length<20||!t.includes('var m'))continue;let pos=0;for(let n=0;n<8;n++){const k=t.indexOf('var m',pos);if(k<0)break;const eq=t.indexOf('=',k);if(eq<0)break;const raw=xsBalancedObject(t,eq);if(!raw)break;try{xsExtractStructuredObject(JSON.parse(raw))}catch(_){}pos=eq+raw.length}}}
  function xsDocId(card){return card?.getAttribute?.('data-docid')||card?.querySelector?.('[data-docid]')?.getAttribute?.('data-docid')||card?.getAttribute?.('data-tbnid')||card?.querySelector?.('[data-tbnid]')?.getAttribute?.('data-tbnid')||''}
  function xsDomDomain(card){for(const a of card.querySelectorAll?.('a[href]')||[]){try{let u=new URL(a.href,location.href),h=u.hostname.toLowerCase();if(/(^|\.)google\./.test(h)){for(const k of ['imgrefurl','url','q']){const v=u.searchParams.get(k);if(/^https?:\/\//i.test(v||'')){u=new URL(v);h=u.hostname.toLowerCase();break}}}if(h&&!/(^|\.)google\./.test(h))return h.replace(/^www\./,'')}catch(_){}}return ''}
  function xsImageDomain(card){const img=mainImage(card),c=[img?.getAttribute?.('data-ou'),img?.getAttribute?.('data-img-url'),img?.getAttribute?.('data-original'),img?.currentSrc,img?.src];for(const v of c){const h=xsHost(v);if(h&&!/(^|\.)google\./.test(h)&&!/(^|\.)gstatic\.com$/.test(h))return h}return ''}
  function xsClassifyMedia(card,imageUrl,sourceUrl,title,cardText){let e=null;try{if(typeof window.__xgridGifEvidence==='function')e=window.__xgridGifEvidence(card)}catch(_){}if(e?.type==='gif'&&Number(e.confidence)>=.65)return {type:'gif',confidence:xsClamp(e.confidence,0,1),evidence:e.evidence||'gif-engine'};if(googleGifFilterActive())return {type:'gif',confidence:.98,evidence:'google-animated-filter'};if(/\.(?:gif|apng)(?:$|[?#])/i.test(imageUrl)||/\.(?:gif|apng)(?:$|[?#])/i.test(sourceUrl))return {type:'gif',confidence:.98,evidence:'animated-extension'};if(/(?:^|\s)gif(?:\s|$)/i.test(cardText)||/\bgif\b/i.test(title))return {type:'gif',confidence:.78,evidence:'result-badge'};if(/\.(?:jpe?g|png|bmp)(?:$|[?#])/i.test(sourceUrl)||/\.(?:jpe?g|png|bmp)(?:$|[?#])/i.test(imageUrl))return {type:'image',confidence:.9,evidence:'static-extension'};if(e?.type==='image'&&Number(e.confidence)>=.7)return {type:'image',confidence:xsClamp(e.confidence,0,1),evidence:e.evidence||'image-engine'};return {type:'unknown',confidence:0,evidence:'unconfirmed'}}
  function xsWeightedAdd(obj,tokens,w){for(const t of tokens)obj[t]=(obj[t]||0)+w}
  function xsCosine(a,b){if(!a||!b)return 0;let dot=0,aa=0,bb=0;for(const [k,v] of Object.entries(a)){aa+=v*v;if(b[k])dot+=v*b[k]}for(const v of Object.values(b))bb+=v*v;return dot/((Math.sqrt(aa)||1)*(Math.sqrt(bb)||1))}
  function xsVisualFeatures(card){if(!(xsState?.flags?.visual??true)||!card?.isConnected)return null;const img=mainImage(card),src=img?.currentSrc||img?.src||'',vk=(xsDocId(card)||'img')+'|'+src;if(xsVisualIdentityCache.has(vk))return xsVisualIdentityCache.get(vk);if(xsVisualCache.has(card))return xsVisualCache.get(card);if(!img?.complete||!(img.naturalWidth>1&&img.naturalHeight>1)){xsVisualCache.set(card,null);return null}let safe=false;try{const u=new URL(src,location.href);safe=u.protocol==='data:'||u.protocol==='blob:'||u.origin===location.origin||img.crossOrigin==='anonymous'}catch(_){}if(!safe){xsVisualBlocked++;xsVisualCache.set(card,null);xsVisualIdentityCache.set(vk,null);if(xsVisualIdentityCache.size>700)xsVisualIdentityCache.delete(xsVisualIdentityCache.keys().next().value);return null}xsVisualAttempts++;try{const cv=document.createElement('canvas');cv.width=8;cv.height=8;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(img,0,0,8,8);const d=cx.getImageData(0,0,8,8).data,g=[];let r=0,gg=0,b=0,sat=0;for(let i=0;i<d.length;i+=4){const R=d[i],G=d[i+1],B=d[i+2];r+=R;gg+=G;b+=B;const mx=Math.max(R,G,B),mn=Math.min(R,G,B);sat+=mx?((mx-mn)/mx):0;g.push(.299*R+.587*G+.114*B)}const mean=g.reduce((a,x)=>a+x,0)/g.length,hash=g.map(x=>x>=mean?'1':'0').join('');let edges=0,n=0;for(let y=0;y<8;y++)for(let x=0;x<8;x++){const i=y*8+x;if(x<7){edges+=Math.abs(g[i]-g[i+1]);n++}if(y<7){edges+=Math.abs(g[i]-g[i+8]);n++}}const f={hash,r:r/64/255,g:gg/64/255,b:b/64/255,brightness:mean/255,saturation:sat/64,edge:n?edges/n/255:0};xsVisualSuccess++;xsVisualFeaturesCount++;xsVisualCache.set(card,f);xsVisualIdentityCache.set(vk,f);if(xsVisualIdentityCache.size>700)xsVisualIdentityCache.delete(xsVisualIdentityCache.keys().next().value);return f}catch(_){xsVisualBlocked++;xsVisualCache.set(card,null);xsVisualIdentityCache.set(vk,null);return null}}
  function xsVisualSimilarity(a,b){if(!a||!b)return 0;let same=0;for(let i=0;i<Math.min(a.hash?.length||0,b.hash?.length||0);i++)if(a.hash[i]===b.hash[i])same++;const h=(a.hash?.length&&b.hash?.length)?same/Math.min(a.hash.length,b.hash.length):0;const cd=Math.sqrt((a.r-b.r)**2+(a.g-b.g)**2+(a.b-b.b)**2)/Math.sqrt(3),color=1-xsClamp(cd,0,1),bright=1-Math.min(1,Math.abs(a.brightness-b.brightness)),edge=1-Math.min(1,Math.abs(a.edge-b.edge)*2);return xsClamp(h*.45+color*.3+bright*.15+edge*.1,0,1)}
  function xsMeta(card){let m=xsMetaCache.get(card);const liveEvidence=(()=>{try{return typeof window.__xgridGifEvidence==='function'?window.__xgridGifEvidence(card):null}catch(_){return null}})();if(m&&liveEvidence?.type==='gif'&&m.mediaType!=='gif'&&Number(liveEvidence.confidence)>=.65){m.mediaType='gif';m.mediaConfidence=xsClamp(liveEvidence.confidence,0,1);m.mediaEvidence=liveEvidence.evidence||'gif-engine';m.animated=true;return m}const docid=xsDocId(card);const sm=docid?xsStructuredMeta.get(docid):null;if(m&&(!sm||m.structuredReady))return m;const img=mainImage(card),parts=[],vec={};const title=String(sm?.title||card.getAttribute?.('aria-label')||card.getAttribute?.('title')||img?.alt||'').trim();const titleTokens=xsTokens(title);xsWeightedAdd(vec,titleTokens,3);if(img?.alt&&img.alt!==title)xsWeightedAdd(vec,xsTokens(img.alt),2);let domain='',domainSource='unresolved';if(sm?.domain){domain=sm.domain;domainSource='wjd';xsDomainWjd++}else{domain=xsDomDomain(card);if(domain){domainSource='dom';xsDomainDom++}else{domain=xsImageDomain(card);if(domain){domainSource='image';xsDomainImage++}else xsDomainUnknown++}}domain=xsSiteKey(domain);if(domain)xsWeightedAdd(vec,xsTokens(domain.replace(/[.\-_]+/g,' ')),1.25);if(sm?.sourceUrl)try{xsWeightedAdd(vec,xsTokens(new URL(sm.sourceUrl).pathname.replace(/[\/_.-]+/g,' ')),.8)}catch(_){}let n=0;for(const el of card.querySelectorAll?.('[aria-label],[title],[data-title]')||[]){if(n++>10)break;parts.push(el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-title'))}if(parts.length)xsWeightedAdd(vec,xsTokens(parts.filter(Boolean).join(' ')),.75);let w=sm?.w||img?.naturalWidth||0,h=sm?.h||img?.naturalHeight||0;if(!(w>0&&h>0)){const cw=parseFloat(card.style.width),ch=parseFloat(card.style.height);if(cw>0&&ch>0){w=cw;h=ch}}const imageUrl=sm?.originalUrl||img?.getAttribute?.('data-ou')||img?.currentSrc||img?.src||'',sourceUrl=sm?.sourceUrl||'',cardText=String(card.textContent||'').slice(0,500),mc=xsClassifyMedia(card,imageUrl,sourceUrl,title,cardText),allTokens=Object.keys(vec);m={card,docid,title,domain,domainSource,sourceUrl,imageUrl,w,h,aspect:w>0&&h>0?w/h:0,animated:mc.type==='gif',mediaType:mc.type,mediaConfidence:mc.confidence,mediaEvidence:mc.evidence,vector:vec,tokens:allTokens,sig:(xsNorm(title)||xsNorm(img?.alt)||docid||imageUrl.slice(-100)),structuredReady:!!sm,visual:null};m.visual=xsVisualFeatures(card);xsMetaCache.set(card,m);return m}
  function xsResultKey(card){const m=xsMeta(card),doc=String(m.docid||'').trim();if(doc)return 'doc:'+doc;const img=String(m.imageUrl||'').split('#')[0];if(img)return 'img:'+img;const src=String(m.sourceUrl||'').split('#')[0],fallback=xsNorm((src?src+' ':'')+(m.domain||'')+' '+(m.sig||m.title||''));return 'fallback:'+(fallback||'unknown')}
  function xsFastHash(v){let h=2166136261>>>0;for(let i=0;i<String(v||'').length;i++){h^=String(v).charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(36)}
  function xsIdentityHashes(cards=xsGlobalCards()){const out=[],seen=new Set();for(const c of cards){const h=xsFastHash(xsResultKey(c));if(!seen.has(h)){seen.add(h);out.push(h)}}return out.slice(0,320)}
  function xsRememberSeenIdentities(s=xsLoad(),ids=xsIdentityHashes(),manualSave=false){
    // OPEN never stores identities; MANUAL stores only an explicit user-saved batch.
    if(s.resultMemoryMode==='open'||(s.resultMemoryMode==='manual'&&!manualSave))return s.retrieval?.seenIdentityHashes?.length||0;
    const r=s.retrieval||(s.retrieval={}),old=Array.isArray(r.seenIdentityHashes)?r.seenIdentityHashes:[];
    r.seenIdentityHashes=[...new Set([...old,...(ids||[]).map(String).filter(Boolean)])].slice(-1200);
    return r.seenIdentityHashes.length;
  }
  function xsSetResultMemory(mode){
    if(!['auto','manual','open'].includes(mode))return false;
    const s=xsLoad();if(s.resultMemoryMode===mode)return false;
    if(xsNavigationBusy||xsNextBatchBusy||s.retrieval?.researchTxn?.active){xsToast('RESULT MEMORY • wait for current operation');return false;}
    s.resultMemoryMode=mode;
    if(mode==='open'){s.retrieval.seenIdentityHashes=[];s.retrieval.activeFreshnessTarget=0;}
    s.stats.lastAction='result-memory-'+mode;s.stats.lastAt=Date.now();xsSave();
    xsToast('RESULT MEMORY '+mode.toUpperCase()+(mode==='open'?' • no result history':' • preferences preserved'));
    return true;
  }
  function xsSaveResultBatch(){
    const s=xsLoad();if(s.resultMemoryMode!=='manual'){xsToast('RESULT MEMORY • select MANUAL first');return false;}
    const before=s.retrieval.seenIdentityHashes?.length||0;
    const count=xsRememberSeenIdentities(s,xsIdentityHashes(xsGlobalCards().filter(c=>c?.isConnected&&c.dataset?.[XS_FILTER_ATTR]!=='1')),true);
    s.stats.lastAction='result-memory-manual-save';s.stats.lastAt=Date.now();xsSave();
    xsToast('SAVED RESULTS • '+(count-before)+' new identities • '+count+' total');return true;
  }
  function xsButtonOutcome(s,name,status,count=0){
    const b=s.retrieval.buttonOutcomes||(s.retrieval.buttonOutcomes={});
    b[name]={status:String(status),count:Math.max(0,Number(count)||0),at:Date.now()};
  }
  function xsRememberCorpusForNovelty(s=xsLoad(),ctx={}){const ids=xsIdentityHashes();xsRememberSeenIdentities(s,ids);s.retrieval.previousIdentityHashes=ids;s.retrieval.pendingNovelty=!!ids.length;s.retrieval.pendingRetrievalEval={kind:String(ctx.kind||s.retrieval.lastKind||''),term:xsNorm(ctx.term||s.retrieval.lastResearchTerm||s.retrieval.plannerTerm||''),query:String(ctx.query||s.retrieval.lastQuery||s.retrievalQuery||''),queryKey:xsQueryKey(ctx.query||s.retrieval.lastQuery||s.retrievalQuery||''),baseKey:xsQueryKey(s.baseQuery),goalKey:xsQueryKey(s.goal||s.baseQuery),sourceCount:ids.length,startedAt:Date.now()};xsNoveltyStableSamples=0;xsNoveltyLastSignature='';clearTimeout(xsNoveltyTimer);xsNoveltyTimer=0}
  function xsSetResearchHold(on){const de=document.documentElement;if(!de)return;if(!document.getElementById('__xsearch_research_hold_style__')){const st=document.createElement('style');st.id='__xsearch_research_hold_style__';st.textContent='html[data-xsearch-research-hold=\"1\"] .'+WALL+'{visibility:hidden!important}';(document.head||de).appendChild(st)}if(on)de.dataset.xsearchResearchHold='1';else delete de.dataset.xsearchResearchHold}
  function xsResearchBaseline(s=xsLoad()){const tx=s.retrieval?.researchTxn;return new Set(tx?.active?(tx.baselineSeenHashes||[]):(s.retrieval?.seenIdentityHashes||[]))}
  function xsPrepareResearchNovelty(s,ctx={}){const tx=s.retrieval?.researchTxn,baseline=[...((s.resultMemoryMode==='open'||tx?.purpose==='complete-refresh')?(tx?.sourceHashes||[]):(tx?.baselineSeenHashes||s.retrieval?.seenIdentityHashes||[]))];s.retrieval.previousIdentityHashes=baseline.slice(-1200);s.retrieval.pendingNovelty=true;s.retrieval.pendingRetrievalEval={kind:'research',term:xsNorm(ctx.term||s.retrieval.lastResearchTerm||s.retrieval.plannerTerm||''),query:String(ctx.query||s.retrieval.lastQuery||s.retrievalQuery||''),queryKey:xsQueryKey(ctx.query||s.retrieval.lastQuery||s.retrievalQuery||''),baseKey:xsQueryKey(s.baseQuery),goalKey:xsQueryKey(s.goal||s.baseQuery),sourceCount:baseline.length,startedAt:Date.now()};xsNoveltyStableSamples=0;xsNoveltyLastSignature='';clearTimeout(xsNoveltyTimer);xsNoveltyTimer=0}
  function xsStartResearchTxn(s=xsLoad(),purpose='research',seedQuery=''){
    const sourceHashes=xsIdentityHashes();
    xsRememberSeenIdentities(s,sourceHashes);
    const baseline=s.resultMemoryMode==='open'?[]:[...(s.retrieval?.seenIdentityHashes||[])].slice(-1200);
    const p=purpose==='complete-refresh'?'complete-refresh':'research';
    const tx={active:true,id:'xrt-'+Date.now().toString(36),pass:1,maxPasses:XS_RESEARCH_MAX_PASSES,
      targetCards:XS_RESEARCH_TARGET_CARDS,baselineSeenHashes:baseline,sourceHashes,excludeDomains:[],
      bestFresh:0,bestQuery:'',purpose:p,seedQuery:String(seedQuery||'').trim(),startedAt:Date.now()};
    const r=s.retrieval;r.researchTxn=tx;r.lastResearchPurpose=p;
    // Do not hide history-matching results while waiting for the transaction to settle.
    r.activeFreshnessTarget=0;r.lastResearchFreshnessTarget=p==='research'&&s.resultMemoryMode!=='open'?1:0;
    r.lastResearchFreshnessAchieved=0;r.lastResearchRepeatPruned=0;r.lastResearchFreshAccepted=0;
    r.researchTargetCards=XS_RESEARCH_TARGET_CARDS;r.researchPasses=1;r.researchStatus='searching';r.lastResearchSeenHidden=0;
    xsButtonOutcome(s,p,'navigation-started');xsSetResearchHold(true);return tx;
  }
  function xsResearchPassStats(cards,s=xsLoad()){const baseline=xsResearchBaseline(s),seen=new Set(),fresh=[],repeats=[],filtered=[];for(const c of cards||xsGlobalCards()){const key=xsResultKey(c),h=xsFastHash(key);if(seen.has(h))continue;seen.add(h);const m=xsMeta(c);if(xsShouldFilter(m,s)){filtered.push(c);continue}if(baseline.has(h))repeats.push(c);else fresh.push(c)}const src=new Set(s.retrieval?.researchTxn?.sourceHashes||[]);const eligible=[...fresh,...repeats];return {fresh,repeats,filtered,total:seen.size,freshCount:fresh.length,repeatCount:repeats.length,eligibleCount:eligible.length,newFromSource:eligible.filter(c=>!src.has(xsFastHash(xsResultKey(c)))).length}}
  function xsResearchDominantDomain(cards,s=xsLoad()){const counts=new Map();for(const c of cards||[]){const d=xsSiteKey(xsMeta(c).domain);if(!d)continue;counts.set(d,(counts.get(d)||0)+1)}return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||''}
  function xsApplyResearchExclusions(query,s=xsLoad()){let out=String(query||'').trim(),tx=s.retrieval?.researchTxn;if(!tx?.active)return out;const only=s.siteRules?.find(r=>r.mode==='only');if(only)return out;for(const d of tx.excludeDomains||[])if(d&&!out.toLowerCase().includes('-site:'+d.toLowerCase()))out+=' -site:'+d;return out.trim()}
  function xsPruneResearchCorpus(cards,s=xsLoad(),strict=false){
    const baseline=xsResearchBaseline(s),seen=new Set();let pruned=0;
    for(const c of [...(cards||xsGlobalCards())]){
      const h=xsFastHash(xsResultKey(c)),m=xsMeta(c);
      const remove=seen.has(h)||xsShouldFilter(m,s)||(strict&&baseline.has(h));seen.add(h);
      if(remove&&c?.isConnected){c.remove();pruned++}
    }
    return pruned;
  }
  function xsFinalizeResearch(cards,s=xsLoad(),status='accepted'){
    const r=s.retrieval,tx=r.researchTxn,purpose=tx?.purpose==='complete-refresh'?'complete-refresh':'research';
    const label=purpose==='complete-refresh'?'COMPLETE REFRESH':'RE-SEARCH',stats=xsResearchPassStats(cards,s);
    // Never create an empty/near-empty page merely to claim 100% freshness.
    // COMPLETE REFRESH obeys the same-query replacement purpose; OPEN ignores history entirely.
    const strict=purpose==='research'&&s.resultMemoryMode!=='open'&&stats.freshCount>=8;
    const pruned=xsPruneResearchCorpus(cards,s,strict),accepted=xsGlobalCards();
    const novel=(s.resultMemoryMode==='open'||purpose==='complete-refresh')?stats.newFromSource:stats.freshCount,denom=Math.max(1,stats.eligibleCount);
    r.lastResearchFreshnessTarget=purpose==='research'&&s.resultMemoryMode!=='open'?1:0;
    r.lastResearchFreshnessAchieved=Number((novel/denom).toFixed(3));
    r.lastResearchRepeatPruned=pruned;r.lastResearchSeenHidden=0;r.lastResearchFreshAccepted=accepted.length;
    r.researchPasses=Math.max(r.researchPasses||0,tx?.pass||1);
    r.researchStatus=status+(strict?'-strict':'-full-batch');r.lastResearchPurpose=purpose;
    r.activeFreshnessTarget=0;r.researchTxn=null;r.pendingNovelty=false;r.previousIdentityHashes=[];r.pendingRetrievalEval=null;
    r.lastReason='batch-committed-'+r.researchStatus;
    xsButtonOutcome(s,purpose,r.researchStatus,accepted.length);
    xsPruneCorpus(accepted);xsRefreshIndexStats(accepted);xsSave();
    if(accepted.length)xsRankAll('google');xsSetResearchHold(false);
    xsToast(label+' • '+accepted.length+' results'+(purpose==='complete-refresh'?' • replacement batch':''));
    return {accepted:accepted.length,pruned,stats};
  }
  function xsMaybeContinueResearch(cards,s=xsLoad()){
    const tx=s.retrieval?.researchTxn;if(!tx?.active)return false;
    const stats=xsResearchPassStats(cards,s),r=s.retrieval,complete=tx.purpose==='complete-refresh';
    const candidate=complete?stats.newFromSource:stats.freshCount;
    if(candidate>tx.bestFresh){tx.bestFresh=candidate;tx.bestQuery=String(r.lastQuery||s.retrievalQuery||'')}
    r.lastResearchFreshAccepted=stats.eligibleCount;r.lastResearchRepeatPruned=stats.repeatCount;
    r.researchPasses=tx.pass;r.researchStatus='pass-'+tx.pass+'-'+stats.eligibleCount+'-eligible-'+candidate+'-different';
    r.lastResearchFreshnessAchieved=stats.eligibleCount?Number((candidate/stats.eligibleCount).toFixed(3)):0;
    // OPEN makes the button take the first usable Google batch, not wait on stored history.
    if(s.resultMemoryMode==='open'&&stats.eligibleCount>=15&&(!complete||candidate>=20)){
      xsFinalizeResearch(cards,s,'accepted');return true;
    }
    if(complete&&stats.eligibleCount>=25&&candidate>=20){xsFinalizeResearch(cards,s,'accepted');return true;}
    if(!complete&&s.resultMemoryMode!=='open'&&stats.freshCount>=Math.min(tx.targetCards,40)){
      xsFinalizeResearch(cards,s,'accepted');return true;
    }
    if(tx.pass<tx.maxPasses){
      const dom=xsResearchDominantDomain(cards,s);
      if(dom&&!tx.excludeDomains.includes(dom)&&tx.excludeDomains.length<3)tx.excludeDomains.push(dom);
      r.researchStatus='retrying-'+(tx.pass+1);xsSave();xsSetResearchHold(true);
      setTimeout(()=>xsNavigateRetrieval('research',{continueResearch:true}),160);return true;
    }
    // Google may recycle candidates. Commit the actual returned batch (not blank),
    // recording the fact that the freshness target was unavailable.
    xsFinalizeResearch(cards,s,stats.eligibleCount?'limited-novelty':'no-results');return true;
  }
  function xsCommitNovelty(cards,s=xsLoad()){if(!s.retrieval.pendingNovelty)return;const prev=new Set(s.retrieval.previousIdentityHashes||[]),ctx=xsFeedbackContext(s),seen=new Set(),unique=[];for(const c of cards||xsGlobalCards()){const h=xsFastHash(xsResultKey(c));if(seen.has(h))continue;seen.add(h);unique.push({card:c,hash:h})}const now=unique.map(x=>x.hash),novelRows=unique.filter(x=>!prev.has(x.hash)),novel=novelRows.length,overlap=Math.max(0,now.length-novel);let useful=0,strong=0;const domains=new Set();for(const x of unique){const m=xsMeta(x.card);if(!xsShouldFilter(m,s)){if(xsGoalScore(m,s).value>=25)strong++;if(m.domain)domains.add(xsSiteKey(m.domain))}}for(const x of novelRows)if(xsUsefulCandidate(x.card,s,ctx))useful++;const noveltyRatio=now.length?novel/now.length:0,usefulRatio=now.length?useful/now.length:0,strongRatio=now.length?strong/now.length:0,diversity=Math.min(1,domains.size/Math.max(8,Math.min(30,now.length*.22))),yieldScore=xsClamp(usefulRatio*.45+noveltyRatio*.25+strongRatio*.2+diversity*.1,0,1),pending=s.retrieval.pendingRetrievalEval||{};s.retrieval.lastNoveltyCount=novel;s.retrieval.lastOverlapCount=overlap;s.retrieval.lastNoveltyRatio=Number(noveltyRatio.toFixed(3));s.retrieval.lastUsefulNoveltyCount=useful;s.retrieval.lastUsefulNoveltyRatio=Number(usefulRatio.toFixed(3));s.retrieval.lastRetrievalYield=Number(yieldScore.toFixed(3));s.retrieval.lastDestinationStrong=strong;s.retrieval.lastDestinationDomains=domains.size;if(pending.queryKey){s.retrieval.retrievalOutcomes=[...(s.retrieval.retrievalOutcomes||[]),{kind:String(pending.kind||''),term:xsNorm(pending.term||''),queryKey:xsQueryKey(pending.queryKey),baseKey:xsQueryKey(pending.baseKey||s.baseQuery),goalKey:xsQueryKey(pending.goalKey||s.goal||s.baseQuery),sourceCount:Math.max(0,Number(pending.sourceCount)||prev.size),destinationCount:now.length,newCount:novel,overlapCount:overlap,usefulNewCount:useful,noveltyRatio:Number(noveltyRatio.toFixed(3)),usefulRatio:Number(usefulRatio.toFixed(3)),strongCount:strong,domainCount:domains.size,yieldScore:Number(yieldScore.toFixed(3)),at:Date.now()}].slice(-24)}s.retrieval.pendingNovelty=false;s.retrieval.previousIdentityHashes=[];s.retrieval.pendingRetrievalEval=null;xsNoveltyStableSamples=0;xsNoveltyLastSignature='';clearTimeout(xsNoveltyTimer);xsNoveltyTimer=0;xsSave()}
  function xsScheduleNoveltyCommit(s=xsLoad()){if(!s?.retrieval?.pendingNovelty)return;clearTimeout(xsNoveltyTimer);const check=()=>{if(!s.retrieval.pendingNovelty)return;const cards=xsGlobalCards(),ids=xsIdentityHashes(cards),sig=ids.length+':'+ids.slice(0,4).join('.')+':'+ids.slice(-4).join('.');xsNoveltySettleRuns++;if(sig&&sig===xsNoveltyLastSignature)xsNoveltyStableSamples++;else{xsNoveltyLastSignature=sig;xsNoveltyStableSamples=0}if(xsRetrievalPhase==='navigating'||xsRetrievalPhase==='harvesting'||xsNoveltyStableSamples<3){xsNoveltyTimer=setTimeout(check,450);return}xsCommitNovelty(cards,s);xsMaybeContinueResearch(cards,s)};xsNoveltyTimer=setTimeout(check,650)}
  function xsRegisterCard(card){const key=xsResultKey(card);let rec=xsResultIndex.get(key),isNew=false;if(!rec){rec={key,orig:xsOrigCounter++,card,firstSeen:Date.now(),lastSeen:Date.now(),stale:false};xsResultIndex.set(key,rec);xsNewCardsIndexed++;isNew=true}else{const old=rec.card;if(!old||!old.isConnected||old===card){rec.card=card;rec.stale=false}rec.lastSeen=Date.now()}xsCardKey.set(card,key);if(!xsOrigIndex.has(card)){const same=rec.card===card||!rec.card?.isConnected;xsOrigIndex.set(card,same?rec.orig:xsOrigCounter++)}return {key,rec,isNew}}
  function xsKnownCard(card){if(!card)return true;const key=xsResultKey(card),rec=xsResultIndex.get(key);return !!rec&&(rec.card===card||xsCardKey.get(card)===key)}
  function xsFeedbackKey(card){return xsResultKey(card)}
  function xsSnapshot(card,type){const m=xsMeta(card);const nativeGifUrl=xsNativeWarmAnchor(card);return {nativeGifUrl,nativePreviewUrl:xsNativePreviewURL(card),id:xsFeedbackKey(card),type,docid:m.docid||'',domain:m.domain||'',title:m.title||'',imageUrl:m.imageUrl||'',sourceUrl:m.sourceUrl||'',mediaType:m.mediaType||'unknown',mediaConfidence:m.mediaConfidence||0,mediaEvidence:m.mediaEvidence||'',tokens:m.tokens.slice(0,80),vector:m.vector,visual:m.visual||xsVisualFeatures(card),aspect:Number((m.aspect||0).toFixed(4)),rankBefore:xsVisibleRank(card),at:Date.now()}}
  function xsBaseTokens(s=xsLoad()){return xsTokens(s.baseQuery,36)}
  function xsGoalTokens(s=xsLoad()){return xsTokens(s.goal||s.baseQuery,36)}
  function xsFeedbackGroups(s=xsLoad()){const pos=[],neg=[];for(const f of s.feedback){if(f.type==='more')pos.push(f);else if(f.type==='less')neg.push(f)}return {pos,neg}}
  function xsSiteGroups(s=xsLoad()){const more=[],only=[],less=[],none=[];for(const r of s.siteRules){if(r.mode==='more')more.push(r.domain);else if(r.mode==='only')only.push(r.domain);else if(r.mode==='less')less.push(r.domain);else if(r.mode==='none')none.push(r.domain)}return {more,only,less,none}}
  function xsDerivedSignals(s=xsLoad()){const goal=new Set(xsGoalTokens(s));return [...s.signals].sort((a,b)=>Math.abs(b.weight)-Math.abs(a.weight)).map(x=>{const terms=xsTokens(x.tag,8),inGoal=!!terms.length&&terms.every(t=>goal.has(t));return {tag:x.tag,weight:Number(x.weight.toFixed(2)),kind:x.weight>=0?'more':'less',source:x.source||'learned',learnedHits:x.learnedHits||0,origins:(x.origins||[]).length,inGoal}})}
  function xsDerivedTags(s=xsLoad()){const base=new Set([...xsBaseTokens(s),...xsGoalTokens(s)]),suppressed=new Set([...(s.suppressedSignals||[]),...(s.suppressedTags||[])]),activeSignals=new Set((s.signals||[]).map(x=>x.tag)),activeSignalTerms=new Set((s.signals||[]).flatMap(x=>xsTokens(x.tag,8))),map=new Map();for(const f of s.feedback){const sign=f.type==='more'?1:-1,domainTerms=new Set(xsTokens(String(f.domain||'').replace(/\./g,' '),8));for(const [t,w0] of Object.entries(f.vector||{})){const w=Number(w0)||0;if(base.has(t)||domainTerms.has(t)||suppressed.has(t)||activeSignals.has(t)||activeSignalTerms.has(t)||!xsGoodSignalToken(t)||w<.65||xsTermPrevalence(t)>.72)continue;let r=map.get(t);if(!r){r={tag:t,pos:0,neg:0,posWeight:0,negWeight:0,origins:new Set()};map.set(t,r)}if(sign>0){r.pos++;r.posWeight+=w}else{r.neg++;r.negWeight+=w}r.origins.add(f.id)}}const out=[];for(const r of map.values()){const net=r.pos-r.neg;if(!net)continue;const avg=(r.posWeight+r.negWeight)/Math.max(1,r.pos+r.neg),idf=Math.min(2,xsIdfWeight(r.tag)),rarity=Math.max(.25,1-xsTermPrevalence(r.tag)),support=Math.abs(net),confidence=Math.min(1,.22*support+.12*Math.min(3,avg)+.18*rarity+.08*Math.min(2,idf)),score=Math.sign(net)*Math.min(10,(.7+support*.9)*Math.min(2,avg)*(.65+.35*rarity)*Math.min(1.4,.72+.24*idf));out.push({tag:r.tag,score:Number(score.toFixed(2)),kind:net>0?'more':'less',positive:r.pos,negative:r.neg,support,confidence:Number(confidence.toFixed(2)),prevalence:Number(xsTermPrevalence(r.tag).toFixed(3)),origins:r.origins.size,consensus:support>=2,manual:false})}for(const mt of s.manualTags||[]){const tag=xsNorm(mt.tag);if(!tag||activeSignals.has(tag)||activeSignalTerms.has(tag)||base.has(tag)||suppressed.has(tag))continue;const score=Number(xsClamp(mt.score??3,-6,6).toFixed(2));out.push({tag,score,kind:score>=0?'more':'less',positive:score>=0?1:0,negative:score<0?1:0,support:1,confidence:1,prevalence:Number(xsTermPrevalence(tag).toFixed(3)),origins:0,consensus:false,manual:true})}const dedup=new Map();for(const t of out){const prev=dedup.get(t.tag);if(!prev||t.manual||Math.abs(t.score)>Math.abs(prev.score))dedup.set(t.tag,t)}return [...dedup.values()].sort((a,b)=>(Number(b.manual)-Number(a.manual))||(Number(b.consensus)-Number(a.consensus))||(Math.abs(b.score)-Math.abs(a.score))||(b.confidence-a.confidence)).slice(0,24)}
  function xsAutoSignalEligible(t,s=xsLoad()){if(!t||t.manual||!t.consensus||!xsGoodSignalToken(t.tag))return false;const g=xsFeedbackGroups(s),pool=t.score>=0?g.pos.length:g.neg.length;if(t.support>=3&&t.origins>=3)return true;return pool>=3&&t.support>=2&&t.origins>=2&&(t.support/pool)>=.6&&t.confidence>=.68}
  function xsConsensusVector(list){if(!list?.length||list.length<2)return {};const counts=new Map(),sums=new Map(),n=list.length,threshold=Math.max(2,Math.ceil(n*.5));for(const f of list){const local=new Set();for(const [t,w0] of Object.entries(f.vector||{})){const w=Number(w0)||0;if(w<.55||!xsGoodSignalToken(t)||local.has(t))continue;local.add(t);counts.set(t,(counts.get(t)||0)+1);sums.set(t,(sums.get(t)||0)+w)}}const out={};for(const [t,c] of counts){if(c<threshold)continue;const support=c/n,avg=(sums.get(t)||0)/c;out[t]=avg*Math.pow(support,1.2)*Math.min(1.35,.78+.2*xsIdfWeight(t))}return out}
  function xsFeedbackContext(s=xsLoad()){const g=xsFeedbackGroups(s);return {groups:g,posConsensus:xsConsensusVector(g.pos),negConsensus:xsConsensusVector(g.neg),tags:xsDerivedTags(s)}}
  function xsSoftCap(v,cap){v=Math.max(0,Number(v)||0);cap=Math.max(.01,Number(cap)||0);return cap*(1-Math.exp(-v/cap))}
  function xsTagScore(m,s,tags){let p=0,n=0;for(const t of tags||[]){const match=xsSignalMatch(m,t.tag);if(!match)continue;const authority=(t.consensus?.72:.22)*(.62+.38*t.confidence),v=Math.abs(t.score)*match*authority;if(t.score>=0)p+=v;else n+=v}const cap=s.strength==='aggressive'?8:s.strength==='strong'?6:5,positive=xsSoftCap(p,cap),negative=xsSoftCap(n,cap);return {positive,negative,net:positive-negative}}
  function xsVisibleRank(card){let n=0;for(const c of xsGlobalCards()){if(c.dataset?.[XS_FILTER_ATTR]==='1')continue;n++;if(c===card)return n}return 0}
  function xsEffectiveMedia(s=xsLoad()){if(s.mediaIntent==='gif'||s.mediaIntent==='image')return {type:s.mediaIntent,source:'explicit',confidence:1};const more=s.feedback.filter(f=>f.type==='more'&&(f.mediaType==='gif'||f.mediaType==='image')&&(f.mediaConfidence||0)>=.55);if(!more.length)return {type:'mixed',source:'auto-neutral',confidence:0,gif:0,image:0};let gif=0,image=0;for(const f of more){const w=Math.max(.55,Number(f.mediaConfidence)||.6);if(f.mediaType==='gif')gif+=w;else image+=w}const total=gif+image,type=gif===image?(more[more.length-1].mediaType):(gif>image?'gif':'image'),confidence=total?Math.max(gif,image)/total:0;return {type,source:'anchors',confidence,gif,image}}
  function xsMediaBonus(m,s){if(!(s.flags?.mediaBias??true)||s.mediaIntent!=='auto')return 0;const e=xsEffectiveMedia(s);if(e.type==='mixed'||e.confidence<.55||m.mediaType==='unknown')return 0;const match=m.mediaType===e.type,aggressive=s.strength==='aggressive',strong=aggressive||s.strength==='strong',scale=.6+.4*e.confidence;return match?(aggressive?20:strong?16:12)*scale:-(aggressive?7:strong?5:3)*scale}
  function xsRetrievalNoiseToken(t,deliberate=false){return !deliberate&&XS_RETRIEVAL_NOISE.has(xsNorm(t))}
  function xsAnchorSupport(tag,s=xsLoad()){const terms=xsTokens(tag,8),pos=s.feedback.filter(f=>f.type==='more');if(!terms.length||!pos.length)return {count:0,total:pos.length,ratio:0};let count=0;for(const f of pos){const v=f.vector||{};if(terms.every(t=>(v[t]||0)>=.7))count++}return {count,total:pos.length,ratio:pos.length?count/pos.length:0}}
  function xsSignalCoverage(tag,s=xsLoad()){const cards=xsGlobalCards(),seen=new Set();let eligible=0,matched=0;for(const c of cards){const k=xsResultKey(c);if(seen.has(k))continue;seen.add(k);const m=xsMeta(c);if(xsShouldFilter(m,s))continue;eligible++;if(xsSignalMatch(m,tag)>=.42)matched++}return {matched,eligible,ratio:eligible?matched/eligible:0,gap:eligible?1-matched/eligible:1}}
  function xsRetrievalHistoryForTerm(tag,s=xsLoad()){const keyTerms=xsTokens(tag,8),baseKey=xsQueryKey(s.baseQuery),rows=(s.retrieval?.retrievalOutcomes||[]).filter(x=>{if(!x||x.baseKey!==baseKey||!x.term||!keyTerms.length)return false;const terms=new Set(xsTokens(x.term,20));return keyTerms.every(t=>terms.has(t))});if(!rows.length)return {attempts:0,yieldScore:0,novelty:0,useful:0,saturation:0,factor:1};const recent=rows.slice(-4),avg=k=>recent.reduce((a,x)=>a+(Number(x[k])||0),0)/recent.length,y=avg('yieldScore'),n=avg('noveltyRatio'),u=avg('usefulRatio'),last=recent[recent.length-1]||{},poor=(Number(last.noveltyRatio)||0)<.45||(Number(last.usefulRatio)||0)<.22||(Number(last.yieldScore)||0)<.32,baseSat=xsClamp((1-n)*.45+(1-u)*.35+(1-y)*.2,0,1),sat=xsClamp(baseSat+(poor?.15:0)+Math.min(.22,Math.max(0,rows.length-1)*.07),0,1);let factor=(.55+y*.85)*(1-sat*.78)*Math.pow(.82,Math.max(0,rows.length-1));if(poor)factor*=.55;factor=xsClamp(factor,.12,1.35);return {attempts:rows.length,yieldScore:y,novelty:n,useful:u,saturation:sat,factor}}
  function xsAnchorCoSupport(a,b,s=xsLoad()){const A=xsTokens(a,8),B=xsTokens(b,8),pos=s.feedback.filter(f=>f.type==='more');let count=0;for(const f of pos){const v=f.vector||{};if(A.every(t=>(v[t]||0)>=.7)&&B.every(t=>(v[t]||0)>=.7))count++}return {count,total:pos.length,ratio:pos.length?count/pos.length:0}}
  function xsUsefulCandidate(card,s=xsLoad(),ctx=xsFeedbackContext(s)){const m=xsMeta(card);if(xsShouldFilter(m,s))return false;const q=xsGoalScore(m,s),sc=xsScore(card,s,ctx);if(q.value>=25)return true;const g=ctx.groups||xsFeedbackGroups(s);let sim=0;for(const a of g.pos)sim=Math.max(sim,xsCosine(m.vector,a.vector));return sc.score>=32||(g.pos.length&&sim>=.31)}
  function xsResearchTermCandidates(s=xsLoad(),max=6){const goal=new Set(xsGoalTokens(s)),domainTokens=new Set();for(const r of s.siteRules)for(const t of xsTokens(r.domain.replace(/[.\-_]+/g,' '),8))domainTokens.add(t);for(const f of s.feedback)for(const t of xsTokens((f.domain||'').replace(/[.\-_]+/g,' '),8))domainTokens.add(t);const pos=s.feedback.filter(f=>f.type==='more'),out=[];for(const sig of s.signals){if(sig.weight<=0||xsSignalInGoal(sig,s))continue;const terms=xsTokens(sig.tag,6),deliberate=sig.source==='manual'||sig.source==='edited'||sig.source==='manual-tag',novelTerms=terms.filter(t=>!goal.has(t));if(!terms.length||!novelTerms.length||terms.some(t=>domainTokens.has(t)||!xsGoodSignalToken(t)||xsRetrievalNoiseToken(t,deliberate)))continue;const aggressive=s.strength==='aggressive',support=xsAnchorSupport(sig.tag,s),minSupport=deliberate?0:(aggressive?1:Math.min(Math.max(2,Math.ceil(pos.length*.34)),Math.max(2,pos.length))),prevalence=Math.max(...novelTerms.map(xsTermPrevalence)),idf=novelTerms.reduce((a,t)=>a+xsIdfWeight(t),0)/novelTerms.length;if(!deliberate){if(pos.length<(aggressive?1:2)||support.count<minSupport||(sig.learnedHits||0)<(aggressive?1:2)||sig.weight<(aggressive?3.1:2.8))continue;if(prevalence>=(aggressive?.78:.72)||idf<(aggressive?.92:1.01))continue}else if(prevalence>=.82)continue;const coverage=xsSignalCoverage(sig.tag,s),history=xsRetrievalHistoryForTerm(sig.tag,s),distinctive=(1-Math.min(.82,prevalence))*(.75+.25*Math.min(2,idf)),agreement=deliberate?1.1:(.75+.55*support.ratio),gapBoost=(aggressive?.62:.48)+(aggressive?1.45:1.18)*coverage.gap,noveltyPressure=aggressive?(history.attempts?(.3+.75*history.novelty+.55*history.useful):1.2):1,score=sig.weight*agreement*distinctive*gapBoost*history.factor*noveltyPressure;out.push({tag:sig.tag,queryTerm:novelTerms.join(' '),score:Number(score.toFixed(3)),support:support.count,supportRatio:Number(support.ratio.toFixed(3)),prevalence:Number(prevalence.toFixed(3)),coverage:Number(coverage.ratio.toFixed(3)),gap:Number(coverage.gap.toFixed(3)),idf:Number(idf.toFixed(3)),source:sig.source||'learned',historyAttempts:history.attempts,historyYield:Number(history.yieldScore.toFixed(3)),saturation:Number(history.saturation.toFixed(3))})}return out.sort((a,b)=>b.score-a.score||b.gap-a.gap||b.support-a.support||a.prevalence-b.prevalence).slice(0,max)}
  function xsBuildResearchPlan(s=xsLoad()){const base=String(s.goal||s.baseQuery||'').trim()||s.baseQuery,cands=xsResearchTermCandidates(s,6),raw=[];for(const c of cands)raw.push({query:(base+' '+(c.queryTerm||c.tag)).trim(),term:c.tag,support:c.support,score:c.score,gap:c.gap,saturation:c.saturation,historyYield:c.historyYield});if(cands.length>=2){const a=cands[0],b=cands[1],co=xsAnchorCoSupport(a.tag,b.tag,s);if(a.support>=2&&b.support>=2&&a.gap>=.3&&b.gap>=.3&&co.count>=2&&co.ratio>=.5&&a.saturation<.72&&b.saturation<.72)raw.push({query:(base+' '+(a.queryTerm||a.tag)+' '+(b.queryTerm||b.tag)).trim(),term:a.tag+' + '+b.tag,support:co.count,score:(a.score+b.score)*.68,gap:Math.min(a.gap,b.gap),saturation:Math.max(a.saturation,b.saturation),historyYield:(a.historyYield+b.historyYield)/2})}raw.push({query:base,term:'',support:0,score:0,gap:0,saturation:0,historyYield:0});const out=[],seen=new Set();for(const x of raw.sort((a,b)=>b.score-a.score)){const q=xsApplyRetrievalSiteRules(x.query,s),k=xsQueryKey(q);if(k&&!seen.has(k)){seen.add(k);out.push({...x,query:q,key:k})}}return out}
  function xsRetrievalUsedTerms(s=xsLoad()){const out=new Set();for(const q of (s.retrieval?.queryHistory||[]).slice(-6))for(const t of xsTokens(q,60))out.add(t);return out}
  function xsRetrievalSafeTags(s,max=2,kind='find-more',seed=''){const used=xsRetrievalUsedTerms(s),base=new Set(xsTokens(seed||s.baseQuery,40)),signals=new Set(s.signals.map(x=>x.tag)),out=[];for(const t of xsDerivedTags(s)){if(t.score<=0||!t.consensus||signals.has(t.tag)||base.has(t.tag)||used.has(t.tag)||t.prevalence>.42)continue;if(t.support<3||t.origins<3||t.confidence<.6)continue;out.push(t.tag);if(out.length>=max)break}return out}
  function xsRetrievalSafeSignals(s,max=2,seed=''){const target=new Set(xsTokens(seed||s.baseQuery,40)),used=xsRetrievalUsedTerms(s),out=[];for(const sig of [...s.signals].sort((a,b)=>(b.weight*xsIdfWeight(b.tag))-(a.weight*xsIdfWeight(a.tag)))){if(sig.weight<=0)continue;const terms=xsTokens(sig.tag,8);if(!terms.length||terms.some(t=>target.has(t))||terms.every(t=>used.has(t)))continue;const deliberate=sig.source==='manual'||sig.source==='edited'||sig.source==='manual-tag',confirmed=(sig.learnedHits||0)>=2&&sig.weight>=3.5,distinctive=terms.every(t=>xsTermPrevalence(t)<.48);if(!distinctive||(!deliberate&&!confirmed))continue;out.push(sig.tag);for(const t of terms)target.add(t);if(out.length>=max)break}return out}
  function xsRetrievalNoveltyTerms(s,max=4,kind='find-more',seed=''){const out=[],seen=new Set();for(const x of [...xsRetrievalSafeSignals(s,2,seed),...xsRetrievalSafeTags(s,2,kind,seed)]){const k=xsNorm(x);if(k&&!seen.has(k)){seen.add(k);out.push(x)}if(out.length>=max)break}return out}
  function xsApplyRetrievalSiteRules(q,s){let out=String(q||'').trim();const only=s.siteRules.find(r=>r.mode==='only');if(only&&!out.toLowerCase().includes('site:'+only.domain.toLowerCase()))out+=' site:'+only.domain;for(const r of s.siteRules.filter(r=>r.mode==='none').slice(0,2))if(!out.toLowerCase().includes('-site:'+r.domain.toLowerCase()))out+=' -site:'+r.domain;return out.trim()}
  function xsBuildRetrievalPlan(s=xsLoad(),kind='research'){const explicitGoal=kind==='research'||kind==='goal-apply',seed=String(explicitGoal?(s.goal||s.baseQuery):s.baseQuery).trim()||s.baseQuery,terms=xsRetrievalNoveltyTerms(s,4,kind,seed),raw=[seed];for(const t of terms)raw.push((seed+' '+t).trim());if(terms.length>=2)raw.push((seed+' '+terms[0]+' '+terms[1]).trim());if(terms.length>=3)raw.push((seed+' '+terms[1]+' '+terms[2]).trim());const out=[],seen=new Set();for(const q of raw){const v=xsApplyRetrievalSiteRules(q,s),k=xsQueryKey(v);if(k&&!seen.has(k)){seen.add(k);out.push(v)}}return out}
  function xsSelectRetrievalQuery(s=xsLoad(),kind='research'){if(kind==='research'||kind==='auto-feedback'){const plan=xsBuildResearchPlan(s);if(!plan.length)return String(s.goal||s.baseQuery||'').trim();const current=xsQueryKey(s.retrievalQuery||xsCurrentQuery()),history=new Set(s.retrieval.queryHistory||[]);const aggressive=s.strength==='aggressive';let pick=plan.find(x=>x.term&&x.saturation<(aggressive?.62:.78)&&x.key!==current&&!history.has(x.key));if(!pick)pick=plan.find(x=>x.term&&x.saturation<(aggressive?.72:.68)&&x.key!==current);if(!pick&&aggressive)pick=plan.find(x=>x.term&&x.key!==current);if(!pick)pick=plan.find(x=>!x.term&&x.key!==current)||plan.find(x=>!x.term)||plan[0];s.retrieval.plannerSlot=Math.max(0,plan.indexOf(pick));s.retrieval.plannerTerm=pick.term||'';s.retrieval.plannerSupport=pick.support||0;s.retrieval.lastResearchMode=pick.term?(kind==='auto-feedback'?'auto-gap':'coverage-gap'):'base-refresh';s.retrieval.lastResearchTerm=pick.term||'';s.retrieval.lastCoverageGap=Number(pick.gap||0);s.retrieval.lastCoverageGapTerm=pick.term||'';return pick.query}if(kind==='goal-apply'){const q=xsApplyRetrievalSiteRules(String(s.goal||s.baseQuery||'').trim(),s);s.retrieval.plannerSlot=0;s.retrieval.plannerTerm='';s.retrieval.plannerSupport=0;s.retrieval.lastResearchMode='goal-apply';s.retrieval.lastResearchTerm='';s.retrieval.lastCoverageGap=0;s.retrieval.lastCoverageGapTerm='';return q}const plan=xsBuildRetrievalPlan(s,kind);if(!plan.length)return String(s.baseQuery||'').trim();if(kind==='media'||kind==='site-only'){s.retrieval.plannerSlot=0;s.retrieval.plannerTerm='';s.retrieval.plannerSupport=0;return plan[0]}const current=xsQueryKey(s.retrievalQuery||xsCurrentQuery()),history=new Set(s.retrieval.queryHistory||[]),alts=plan.slice(1);let pick=alts.find(q=>xsQueryKey(q)!==current&&!history.has(xsQueryKey(q)));if(!pick)pick=alts.find(q=>xsQueryKey(q)!==current);if(!pick)pick=plan[0];s.retrieval.plannerSlot=Math.max(0,plan.indexOf(pick));s.retrieval.plannerTerm='';s.retrieval.plannerSupport=0;return pick}
  function xsBuildRetrievalQuery(s=xsLoad(),kind='research'){return xsSelectRetrievalQuery(s,kind)}
  function xsApplyMediaToUrl(u,s=xsLoad()){const e=xsEffectiveMedia(s),parts=(u.searchParams.get('tbs')||'').split(',').map(x=>x.trim()).filter(Boolean).filter(x=>!/^itp:/i.test(x));const wantsGif=true;if(wantsGif)parts.push('itp:animated');if(parts.length)u.searchParams.set('tbs',parts.join(','));else u.searchParams.delete('tbs');return e}
  function xsNavigateRetrieval(kind='research',opts={}){if(xsNavigationBusy||xsNextBatchBusy||xsFindMoreBusy||!xsGoogleImages()){xsToast('SEARCH • another operation is running');return false}const s=xsLoad(),continuing=kind==='research'&&opts?.continueResearch===true,purpose=opts?.purpose==='complete-refresh'?'complete-refresh':'research';if(s.retrieval?.researchTxn?.active&&!continuing){xsToast('SEARCH • finishing existing refresh');return false}if(kind==='research'){if(!continuing||!s.retrieval?.researchTxn?.active)xsStartResearchTxn(s,purpose,opts?.seedQuery||'');else{s.retrieval.researchTxn.pass=Math.min(s.retrieval.researchTxn.maxPasses,(s.retrieval.researchTxn.pass||1)+1);s.retrieval.researchPasses=s.retrieval.researchTxn.pass;xsSetResearchHold(true)}}const tx=kind==='research'?s.retrieval.researchTxn:null,isComplete=tx?.purpose==='complete-refresh';let query=kind==='exact'?String(opts.exactQuery||xsBuildExactQuery(s)):isComplete&&tx.seedQuery?tx.seedQuery:xsBuildRetrievalQuery(s,kind);if(kind==='research')query=xsApplyResearchExclusions(query,s);const key=xsQueryKey(query);if(!query){if(kind==='research'){s.retrieval.researchTxn=null;s.retrieval.activeFreshnessTarget=0;xsSetResearchHold(false)}xsToast('SEARCH • no valid query');return false}let u;try{u=(kind==='research'||kind==='exact')?new URL('/search',location.origin):new URL(location.href)}catch(_){return false}if(kind==='research')xsPrepareResearchNovelty(s,{kind:isComplete?'complete-refresh':kind,query,term:isComplete?'':(s.retrieval.lastResearchTerm||s.retrieval.plannerTerm||'')});else xsRememberCorpusForNovelty(s,{kind,query,term:s.retrieval.lastResearchTerm||s.retrieval.plannerTerm||''});s.retrieval.activeFreshnessTarget=0;s.retrieval.exactMode=kind==='exact';s.retrieval.lastResearchSeenHidden=0;let history=Array.isArray(s.retrieval.queryHistory)?s.retrieval.queryHistory:[];history=[...history.filter(k=>k!==key),key].slice(-12);s.retrieval.queryHistory=history;u.pathname='/search';u.searchParams.set('q',query);u.searchParams.set('udm','2');for(const k of ['start','ijn','ei','ved','sei','sssc'])u.searchParams.delete(k);const media=xsApplyMediaToUrl(u,s),marker=String(Date.now())+String((s.searchSession?.navSeq||0)%10),navKind=isComplete?'complete-refresh':kind;const txn=xsWriteNavTxn(navKind,query,media.type,marker);u.searchParams.set('zx',txn.marker);s.stats.retrievalActions++;if(kind==='exact')s.stats.exactSearches=(s.stats.exactSearches||0)+1;if(isComplete)s.stats.completeRefreshes=(s.stats.completeRefreshes||0)+(!continuing?1:0);s.stats.lastAction=kind==='exact'?'find-exact-results':isComplete?'complete-refresh':'retrieve-'+kind;s.stats.lastAt=Date.now();s.retrieval.searches++;s.retrieval.batches++;if(kind==='research'||kind==='goal-apply'||kind==='media'||kind==='site-only'||kind==='auto-feedback')s.retrieval.researches++;if(kind.startsWith('auto')){s.retrieval.auto++;s.stats.autoRetrievals++}s.retrieval.lastKind=navKind;s.retrieval.lastQuery=query;s.retrieval.lastMedia=media.type;s.retrieval.lastReason=kind==='research'?(isComplete?'complete-refresh-pass-':'fresh-page-pass-')+(s.retrieval.researchTxn?.pass||1):kind;s.retrieval.lastResearchPurpose=isComplete?'complete-refresh':(kind==='research'?'research':s.retrieval.lastResearchPurpose||'');s.retrieval.lastAt=Date.now();xsButtonOutcome(s,isComplete?'complete-refresh':kind==='exact'?'find-exact-results':kind==='research'?'research':kind,'navigation-started');xsNavigationBusy=true;xsSetRetrievalPhase('navigating','navigate-'+navKind,14000);xsSave();xsCloseOverlay();const pass=s.retrieval.researchTxn?.pass||1,label=isComplete?'COMPLETE REFRESH':'RE-SEARCH';xsToast(kind==='research'?label+' • fresh pass '+pass+'/'+XS_RESEARCH_MAX_PASSES:kind==='exact'?'FIND EXACT RESULTS • precise text query':'XSearch re-searching • '+(media.type==='mixed'?'MIXED':media.type.toUpperCase()));setTimeout(()=>location.assign(u.toString()),90);return true}
  function xsCorpusFit(f,s=xsLoad()){return xsCorpusHealth(f,s)}
  function xsCorpusHealth(anchor=null,s=xsLoad()){const raw=xsGlobalCards(),seen=new Set(),eligible=[],freshLedger=new Set(s.retrieval?.seenIdentityHashes||[]),freshOnly=Number(s.retrieval?.activeFreshnessTarget||0)>=XS_RESEARCH_FRESH_TARGET;for(const c of raw){const k=xsResultKey(c);if(seen.has(k))continue;seen.add(k);const m=xsMeta(c),old=freshOnly&&freshLedger.has(xsFastHash(k));if(!xsShouldFilter(m,s)&&!old)eligible.push(c)}let strong=0,similar=0,useful=0;const ctx=xsFeedbackContext(s);for(const c of eligible){const m=xsMeta(c),g=xsGoalScore(m,s);if(g.value>=25)strong++;if(anchor&&xsCosine(m.vector,anchor.vector)>=.34)similar++;if(xsUsefulCandidate(c,s,ctx))useful++}const scored=eligible.map(c=>({c,score:xsScore(c,s,ctx).score,useful:xsUsefulCandidate(c,s,ctx)})).sort((a,b)=>b.score-a.score),topN=scored.slice(0,Math.min(30,scored.length)),topUseful=topN.filter(x=>x.useful).length,eff=xsEffectiveMedia(s),mediaCount=eff.type==='mixed'?eligible.length:eligible.filter(c=>xsMeta(c).mediaType===eff.type).length,dup=raw.length?Math.max(0,(raw.length-seen.size)/raw.length):0,gaps=xsResearchTermCandidates(s,3),gapTop=gaps[0]||null;let status='healthy',reason='good-fit';if(eligible.length<35||(anchor&&similar<4)||(eff.type!=='mixed'&&eff.confidence>=.65&&mediaCount<6)){status='exhausted';reason=eligible.length<35?'small-corpus':eff.type!=='mixed'&&mediaCount<6?'media-exhausted':'semantic-exhausted'}else if(eligible.length<90||(anchor&&similar<10)||strong<Math.max(8,Math.round(eligible.length*.06))||dup>.18||topUseful<Math.max(6,Math.round(topN.length*.3))||(gapTop&&gapTop.gap>=.7&&gapTop.support>=2)){status='thin';reason=dup>.18?'duplicates':gapTop&&gapTop.gap>=.7&&gapTop.support>=2?'preference-gap':topUseful<Math.max(6,Math.round(topN.length*.3))?'quality-thin':anchor&&similar<10?'semantic-thin':eligible.length<90?'small-corpus':'goal-thin'}const h={status,reason,total:raw.length,unique:seen.size,strong,similar,useful,topUseful,mediaCount,duplicateRatio:Number(dup.toFixed(3)),coverageGap:gapTop?gapTop.gap:0,coverageGapTerm:gapTop?.tag||''};xsLastHealth=h;return h}
  function xsMaybeAutoRetrieve(f){const s=xsLoad();if(!s.autoRetrieve||f.type!=='more'||xsNavigationBusy||xsFindMoreBusy)return;clearTimeout(xsAutoTimer);xsAutoTimer=setTimeout(()=>{const eff=xsEffectiveMedia(s),mediaMismatch=eff.type==='gif'&&eff.confidence>=.67&&!googleGifFilterActive(),fit=xsCorpusHealth(f,s);s.retrieval.lastReason=fit.reason;s.retrieval.lastDecisionDelta={kind:'more',health:fit.status,reason:fit.reason,strong:fit.strong,useful:fit.useful,coverageGap:Number(fit.coverageGap||0),coverageGapTerm:fit.coverageGapTerm||'',at:Date.now()};xsSave();if(mediaMismatch)xsNavigateRetrieval('media');else if(fit.status!=='healthy')xsFindMore('auto-feedback')},420)}
  function xsSetMediaIntent(mode){if(mode!=='gif')return false;const s=xsLoad();if(s.mediaIntent===mode)return false;s.mediaIntent=mode;s.stats.mediaChanges++;s.stats.lastAction='media-'+mode;s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');if(mode==='auto'){xsToast('Media AUTO • follows positive anchors');return true}xsToast('Media '+mode.toUpperCase()+' • fetching matching candidates');setTimeout(()=>xsNavigateRetrieval('media'),140);return true}
  function xsSetAutoRetrieve(on){const s=xsLoad(),v=!!on;if(s.autoRetrieve===v)return false;s.autoRetrieve=v;s.stats.lastAction=v?'auto-retrieve-on':'auto-retrieve-off';s.stats.lastAt=Date.now();xsSave();xsToast(v?'Auto retrieval ON':'Auto retrieval MANUAL');return true}
  function xsCompleteRefresh(){if(xsNavigationBusy||!xsGoogleImages())return false;const s=xsLoad(),seed=String(s.retrievalQuery||xsCurrentQuery()||s.goal||s.baseQuery||'').trim();if(!seed){xsButtonOutcome(s,'complete-refresh','no-query');xsToast('COMPLETE REFRESH • no current search');return false}return xsNavigateRetrieval('research',{purpose:'complete-refresh',seedQuery:seed})}
  // Reliable mobile Google Images continuation. Google does not consistently honor
  // start/ijn at udm=2; never navigate to an empty synthetic offset page again.
  // Stage newly loaded cards while retaining the existing batch. Commit only after
  // at least one genuinely new, eligible identity exists; otherwise preserve 100%.
  function xsLoadNewResults(){
    if(xsNextBatchBusy||xsNavigationBusy||xsFindMoreBusy||!xsGoogleImages()){xsToast('LOAD NEW RESULTS • another action is running');return false}
    const s=xsLoad(),query=String(s.retrievalQuery||xsCurrentQuery()||s.baseQuery||'').trim();
    if(s.retrieval?.researchTxn?.active){xsToast('LOAD NEW RESULTS • wait for refresh');return false}
    if(!query){xsToast('LOAD NEW RESULTS • no search');return false}
    const before=xsGlobalCards().filter(c=>c?.isConnected),originalY=window.scrollY||0;
    if(!before.length){
      let legacy=null;try{legacy=new URL(location.href)}catch(_){}
      if(legacy&&(legacy.searchParams.has('start')||legacy.searchParams.has('ijn'))){
        const u=new URL('/search',location.origin);u.searchParams.set('q',query);u.searchParams.set('udm','2');
        const media=xsApplyMediaToUrl(u,s),marker=String(Date.now());
        const tx=xsWriteNavTxn('next-batch-recovery',query,media.type,marker);u.searchParams.set('zx',tx.marker);
        s.retrieval.nextBatchLastStatus='recovered-invalid-google-offset';
        s.retrieval.nextBatchQuery=query;s.retrieval.nextBatchOffset=0;
        s.stats.lastAction='load-new-results-recovery';s.stats.lastAt=Date.now();
        xsSave();xsCloseOverlay();xsToast('LOAD NEW RESULTS • restoring Google Images');
        setTimeout(()=>location.assign(u.toString()),80);return true;
      }
      xsToast('LOAD NEW RESULTS • no current images; run a search first');return false
    }
    const baseline=new Set([...(s.retrieval?.seenIdentityHashes||[]),...xsIdentityHashes(before)]);
    xsRememberSeenIdentities(s,xsIdentityHashes(before));
    const seenOnPage=new Set(before.map(c=>xsResultKey(c))),found=new Map();
    const started=Date.now(),target=XS_GIF_PAGE_LIMIT,maxMs=12500,maxSteps=54;
    let steps=0,steady=0,previousCount=before.length;
    xsNextBatchBusy=true;
    s.retrieval.nextBatchLastStatus='harvesting-same-query';xsButtonOutcome(s,'load-new-results','harvesting');
    s.retrieval.nextBatchQuery=query;
    s.stats.nextBatchActions=(s.stats.nextBatchActions||0)+1;
    s.stats.lastAction='load-new-results';s.stats.lastAt=Date.now();
    s.retrieval.lastKind='next-batch-harvest';s.retrieval.lastReason='same-query-native-lazy-loading';
    s.retrieval.lastAt=Date.now();
    xsSave();xsCloseOverlay();
    xsSetRetrievalPhase('harvesting','next-batch',18000);
    xsSetResearchHold(true);
    const collect=()=>{
      for(const c of xsGlobalCards()){
        const k=xsResultKey(c),h=xsFastHash(k);
        if(!seenOnPage.has(k)&&!baseline.has(h)&&!found.has(k)&&!xsShouldFilter(xsMeta(c),s))found.set(k,c)
      }
    };
    const finish=()=>{
      collect();
      const accepted=[...found.values()].filter(c=>c.isConnected&&xsResultKey(c)&&!xsShouldFilter(xsMeta(c),s)).slice(0,target);
      if(accepted.length){
        const keep=new Set(accepted);let pruned=0;
        for(const c of xsGlobalCards())if(!keep.has(c)){c.remove();pruned++}
        for(const w of xsGlobalWalls())layoutWall(w,true);
        s.retrieval.nextBatchPruned=(s.retrieval.nextBatchPruned||0)+pruned;
        s.retrieval.nextBatchOffset=(s.retrieval.nextBatchOffset||0)+accepted.length;
        s.retrieval.nextBatchLastStatus='accepted-'+accepted.length+'-new';xsButtonOutcome(s,'load-new-results','accepted',accepted.length);
        s.retrieval.lastGrowth=accepted.length;s.retrieval.lastKind='next-batch-accepted';
        xsPruneCorpus(accepted);xsRefreshIndexStats(accepted);
      }else{
        s.retrieval.nextBatchLastStatus='google-exhausted-original-preserved';xsButtonOutcome(s,'load-new-results','exhausted-original-preserved');
        s.retrieval.lastGrowth=0;
      }
      xsNextBatchBusy=false;xsSetResearchHold(false);
      xsSetRetrievalPhase('idle','next-batch-settled');
      try{window.scrollTo(0,accepted.length?0:originalY)}catch(_){}
      xsSave();
      if(accepted.length)xsRankAll('google');
      xsToast(accepted.length?'LOAD NEW RESULTS • '+accepted.length+' new / 100 max':'LOAD NEW RESULTS • no more images; page preserved');
    };
    const step=()=>{
      steps++;
      collect();
      const count=xsGlobalCards().length;
      if(count===previousCount)steady++;else{steady=0;previousCount=count}
      if(found.size>=target||steps>=maxSteps||Date.now()-started>=maxMs){finish();return}
      // Advance in viewport-sized increments to trigger Google's own lazy loading.
      const totalHeight=Math.max(document.body?.scrollHeight||0,document.documentElement?.scrollHeight||0);
      const y=Math.min(Math.max(0,totalHeight-innerHeight),Math.max(0,window.scrollY||0)+Math.max(330,innerHeight*.82));
      try{window.scrollTo(0,y)}catch(_){}
      // At the current bottom, wait for Google to append more; give up safely if exhausted.
      if(steady>=9&&y>=totalHeight-innerHeight-5){finish();return}
      setTimeout(step,210);
    };
    setTimeout(step,100);
    return true;
  }
  // Exact means strong TEXT / METADATA matching; it never claims to read pixels.
  // The Goal is mandatory, Tags are not retrieval drivers, and only validated
  // positive Signals may add one or two specificity terms.
  function xsBuildExactQuery(s=xsLoad()){
    const goal=String(s.goal||s.baseQuery||'').trim(),terms=xsNorm(goal).split(' ').filter(t=>t.length>=2&&t.length<=30).slice(0,8);
    if(!goal)return '';
    const quoted=terms.slice(0,5).map(t=>'"'+t+'"');
    let q=(goal.includes('"')?goal:(terms.length>=2&&terms.length<=5?'"'+terms.join(' ')+'"':goal));
    const used=new Set(terms),extra=[];
    for(const sig of [...(s.signals||[])].filter(x=>x.weight>0).sort((a,b)=>b.weight-a.weight)){
      const tokens=xsTokens(sig.tag,4),manual=(sig.source||'')!=='learned';
      if(!tokens.length||tokens.some(t=>used.has(t)||XS_RETRIEVAL_NOISE.has(t)||!xsGoodSignalToken(t)))continue;
      if(!manual&&((sig.learnedHits||0)<2||sig.weight<3.2))continue;
      extra.push('"'+tokens.join(' ')+'"');tokens.forEach(t=>used.add(t));
      if(extra.length>=2)break;
    }
    return xsApplyRetrievalSiteRules([q,...extra].join(' '),s);
  }
  function xsFindExactResults(){
    if(xsNextBatchBusy||xsNavigationBusy||xsFindMoreBusy||!xsGoogleImages())return false;
    const s=xsLoad(),query=xsBuildExactQuery(s);
    if(!query){xsButtonOutcome(s,'find-exact-results','no-goal');xsToast('FIND EXACT RESULTS • specify a Goal first');return false}
    return xsNavigateRetrieval('exact',{exactQuery:query});
  }
  // Bound managed GIF cards before indexing/playback so a Google lazy-load cannot
  // grow a single page indefinitely. No result-type logic or GIF scheduler changes.
  function xsEnforceGifPageLimit(){
    if(xsNextBatchBusy||!googleGifFilterActive())return 0;
    const cards=[...document.querySelectorAll('.'+WALL+' > .'+IMAGE_ONLY)];
    if(cards.length<=XS_GIF_PAGE_LIMIT)return 0;
    const touched=new Set();let removed=0;
    for(const c of cards.slice(XS_GIF_PAGE_LIMIT)){
      const w=c.parentElement;if(w?.classList?.contains(WALL))touched.add(w);
      c.remove();removed++;
    }
    for(const w of touched)if(w?.isConnected)layoutWall(w,true);
    const s=xsState;if(s?.retrieval){s.retrieval.nextBatchPruned=(s.retrieval.nextBatchPruned||0)+removed}
    return removed;
  }

  function xsCaptureViewportAnchor(){const cards=xsGlobalCards().filter(c=>c?.isConnected&&c.dataset?.[XS_FILTER_ATTR]!=='1');let best=null,bestDist=Infinity;for(const c of cards){const r=c.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)continue;const d=Math.abs(r.top);if(d<bestDist){best=c;bestDist=d}}return {key:best?xsResultKey(best):'',offset:best?best.getBoundingClientRect().top:0,y:window.scrollY||0}}
  function xsRestoreViewportAnchor(a){if(!a)return false;let restored=false;if(a.key){for(const c of xsGlobalCards()){if(xsResultKey(c)!==a.key)continue;const r=c.getBoundingClientRect();try{window.scrollBy(0,r.top-(Number(a.offset)||0));restored=true}catch(_){}break}}if(!restored)try{window.scrollTo(0,Math.max(0,Number(a.y)||0));restored=true}catch(_){}return restored}
/* Yellow / Blue FastPath v28.3.6: bridge transactions, native scoring, diagnostics. */
  const xsNativeSignatures=new Map(),xsNativePending=new Map(),xsNativeScores=new Map(),xsNativeFailed=new Map(),xsNativeKinds=new Map();
  let xsNativeRankEnabled=false,xsNativeFindRuns=0,xsNativeRequested=0,xsNativeSuccess=0,xsNativeErrors=0;
  let xsNativeSkipped=0,xsNativeTimeouts=0,xsNativeCompleted=0,xsNativeApplied=0,xsNativeComparable=0;
  let xsNativeLastOutcome='never-started',xsNativeWaitMs=0,xsNativeLastReady=false,xsNativeAnchorReady=0,xsNativeCoverage=0,xsNativeSampleCount=0;
  const xsNativeErrorsByType=new Map();
  const xsNativeHost=()=>{try{for(const api of [window.xgridUCVision,window.yellowVision])if(api&&typeof api.status==='function'&&typeof api.analyzeVisual==='function')return api;return null}catch(_){return null}};
  function xsNativeStatus(){try{const api=xsNativeHost();return api?JSON.parse(api.status()):null}catch(_){return null}}
  function xsNativeLikelyImage(v){return typeof v==='string'&&/^https:\/\/[^\s]+$/i.test(v)&&v.length<1600}
  function xsNativeLikelyGif(v){return xsNativeLikelyImage(v)&&(/\.gif(?:[?#]|$)/i.test(v)||/[?&](?:format|fm|type)=gif(?:[&#]|$)/i.test(v))}
  function xsNativeGifURL(card){
    if(!card)return '';
    const m=xsMeta(card);
    const pool=[card.__xgLockedSrc,card.__xgNativeSrc,...(card.__xgSources||[]).map(x=>x?.url||x),card.__xhdSource?.url,m?.imageUrl];
    for(const v of pool)if(xsNativeLikelyGif(v))return v;
    return '';
  }
  function xsNativePreviewURL(card){
    if(!card)return '';
    const m=xsMeta(card),img=mainImage(card);
    const pool=[img?.currentSrc,img?.getAttribute?.('data-src'),img?.src,m?.imageUrl,card.__xgLockedSrc,card.__xgNativeSrc];
    for(const url of pool)if(xsNativeLikelyImage(url))return url;
    return '';
  }
  function xsNativeAnchorSource(f,cards){
    const card=cards.find(c=>xsFeedbackKey(c)===f?.id||xsResultKey(c)===f?.id);
    const gif=xsNativeLikelyGif(f?.nativeGifUrl)?f.nativeGifUrl:(card?xsNativeGifURL(card):'');
    const preview=xsNativeLikelyImage(f?.nativePreviewUrl)?f.nativePreviewUrl:
      (card?xsNativePreviewURL(card):xsNativeLikelyImage(f?.imageUrl)?f.imageUrl:'');
    return {type:f?.type||'more',url:gif||preview,preview:preview||gif};
  }
  function xsNativeWarmAnchor(card){
    xsNativeRankEnabled=false;xsNativeScores.clear();
    const gif=xsNativeGifURL(card),preview=xsNativePreviewURL(card);
    if(gif||preview)xsNativeRequest(gif||preview,preview||gif);else xsNativeSkipped++;
    return gif;
  }
  function xsNativeRequest(url,preview){
    if(!xsNativeLikelyImage(url))return false;
    if(xsNativeSignatures.has(url)||xsNativePending.has(url))return true;
    if((xsNativeFailed.get(url)||0)>Date.now())return false;
    const api=xsNativeHost();if(!api)return false;
    const token='yv-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
    try{
      const capability=String(window.__xgridNativeSession||'');
      if(capability.length!==48){xsNativeRecordError('uc-session-unavailable');return false;}
      const accepted=api.analyzeVisual(xsNativeLikelyGif(url)?url:'',preview||url,token,capability);
      if(!accepted)return false;
      xsNativePending.set(url,{token,since:performance.now()});xsNativeRequested++;return true;
    }catch(err){xsNativeErrors++;xsNativeRecordError('bridge:'+String(err?.name||'exception'));return false}
  }
  function xsNativeRecordError(code){
    const key=String(code||'unknown').slice(0,64);
    xsNativeErrorsByType.set(key,(xsNativeErrorsByType.get(key)||0)+1);
  }
  window.addEventListener('__xgridNativeAnalysis',event=>{
    try{
      const d=event.detail||{},url=String(d.url||''),pending=xsNativePending.get(url);
      if(!pending||pending.token!==d.token)return; // Reject stale callbacks and wrong result identities.
      xsNativePending.delete(url);
      if(d.ok&&d.signature&&d.signature.method==='native-subject-pose-flow-v3'&&Array.isArray(d.signature.geometry)&&d.signature.geometry.length===232){
        xsNativeSignatures.set(url,d.signature);xsNativeKinds.set(url,String(d.mode||'unknown'));xsNativeSuccess++;xsNativeFailed.delete(url);
        if(xsNativeSignatures.size>180)xsNativeSignatures.delete(xsNativeSignatures.keys().next().value);
      }else{
        xsNativeErrors++;
        const type=String(d.error||'native-rejected').slice(0,110);
        xsNativeRecordError(type);
        xsNativeFailed.set(url,Date.now()+120000);
      }
    }catch(_){xsNativeErrors++;xsNativeRecordError('callback-parse')}
  });

// Yellow accuracy v28.3.8: compare people and poses rather than mainly background pixels.
function xsNativeSubjectScore(a,b){
  if(!Array.isArray(a?.features)||!Array.isArray(b?.features)||a.features.length!==70||b.features.length!==70)return null;
  let shape=0, rows=0, cols=0, colors=0;
  for(let i=0;i<48;i++)shape+=Math.pow((a.features[i]||0)-(b.features[i]||0),2);
  for(let i=48;i<56;i++)rows+=Math.pow((a.features[i]||0)-(b.features[i]||0),2);
  for(let i=56;i<62;i++)cols+=Math.pow((a.features[i]||0)-(b.features[i]||0),2);
  for(let i=62;i<70;i++)colors+=Math.pow((a.features[i]||0)-(b.features[i]||0),2);
  // Relative silhouettes dominate; colors are only weak supporting evidence.
  const d=.72*Math.sqrt(shape/48)+.13*Math.sqrt(rows/8)+.10*Math.sqrt(cols/6)+.05*Math.sqrt(colors/8);
  return Math.exp(-4.8*d);
}
function xsNativePoseScore(a,b){
  const as=Array.isArray(a?.normalizedPoses)?a.normalizedPoses:[];
  const bs=Array.isArray(b?.normalizedPoses)?b.normalizedPoses:[];
  let max=-1;
  for(const pa of as)for(const pb of bs){
    if(!Array.isArray(pa)||!Array.isArray(pb)||pa.length!==16||pb.length!==16)continue;
    let d=0;for(let i=0;i<16;i++)d+=Math.pow((pa[i]||0)-(pb[i]||0),2);
    max=Math.max(max,Math.exp(-2.8*Math.sqrt(d/16)));
  }
  return max<0?null:max;
}
function xsNativeCompare(a,b){
  if(!a||!b||a.method!=='native-subject-pose-flow-v3'||b.method!=='native-subject-pose-flow-v3'||
     a.geometry?.length!==232||b.geometry?.length!==232)return null;
  let d=0;
  for(let i=0;i<216;i++){
    const delta=(Number(a.geometry[i])||0)-(Number(b.geometry[i])||0);
    d+=(i<100?.35:i<200?.20:.4)*delta*delta;
  }
  const globalGeom=Math.exp(-3*Math.sqrt(d/216));
  const as=Array.isArray(a.subjects)?a.subjects:[];
  const bs=Array.isArray(b.subjects)?b.subjects:[];
  let bestSubject=0,confidence=0;
  for(const sa of as)for(const sb of bs){
    const sim=xsNativeSubjectScore(sa,sb);
    if(sim==null)continue;
    const conf=Math.max(0,Math.min(1,Math.min(Number(sa.confidence)||0,Number(sb.confidence)||0)));
    const candidate=sim*(.20+.80*conf);
    if(candidate>bestSubject){bestSubject=candidate;confidence=conf;}
  }
  const pose=xsNativePoseScore(a,b);
  // Subject-first ranking when robust foregrounds exist; give low confidence
  // preview-only images a conservative fallback instead of false certainty.
  let geom=globalGeom;
  if(confidence>=.5)geom=.12*globalGeom+.68*bestSubject/Math.max(.2,.20+.80*confidence)+.20*(pose==null?bestSubject/Math.max(.2,.20+.80*confidence):pose);
  else if(pose!=null)geom=.35*globalGeom+.65*pose;
  else if(bestSubject>0)geom=.70*globalGeom+.30*bestSubject;
  geom=Math.max(0,Math.min(1,geom));
  const motion=!!(a.motionValid&&b.motionValid&&a.motion?.length===12&&b.motion?.length===12);
  let mot=0;
  if(motion){let md=0;for(let i=0;i<12;i++){const x=(a.motion[i]||0)-(b.motion[i]||0);md+=x*x}mot=Math.exp(-4*Math.sqrt(md/12))}
  const score=motion?.7*geom+.3*mot:geom;
  return {score:Number.isFinite(score)?Math.max(0,Math.min(1,score)):0,geometry:geom,motion:mot,motionValid:motion,poseUsed:pose!=null,subjectsUsed:confidence>=.5};
}
  // Sample the entire candidate grid, not just its first rows. Keep anchors
  // and visible top results first, then spread a bounded budget across the corpus.
  function xsNativeSampleQueue(samples,anchors,maxRequests,known=xsNativeSignatures){
    const queue=[],seen=new Set();
    const enqueue=(url,preview)=>{
      if(queue.length>=maxRequests||seen.has(url)||known.has(url)||!xsNativeLikelyImage(url))return;
      seen.add(url);queue.push({url,preview});
    };
    for(const anchor of anchors)enqueue(anchor.url,anchor.preview);
    const topBudget=Math.min(12,Math.max(0,Math.floor((maxRequests-queue.length)/3)));
    for(const sample of samples.slice(0,topBudget))enqueue(sample.url,sample.preview);
    const spreadBudget=Math.max(0,maxRequests-queue.length);
    for(let i=0;i<spreadBudget&&samples.length;i++){
      const at=Math.min(samples.length-1,Math.floor((i+.5)*samples.length/spreadBudget));
      const sample=samples[at];enqueue(sample.url,sample.preview);
    }
    // Fill any gaps left by duplicate URLs or already-cached signatures.
    for(const sample of samples)enqueue(sample.url,sample.preview);
    return queue;
  }
  function xsNativePrepareFindMore(cards,s,done,engineWaitStart){
    const info=xsNativeStatus();
    xsNativeRankEnabled=false;xsNativeScores.clear();xsNativeApplied=0;
    xsNativeComparable=0;xsNativeAnchorReady=0;xsNativeCoverage=0;xsNativeSampleCount=0;
    if(!info?.ready){
      const started=engineWaitStart==null?performance.now():engineWaitStart;
      // Allow background native initialization to finish. Never silently claim
      // native ranking ran when MediaPipe or OpenCV could not be initialized.
      if(xsNativeHost()&&performance.now()-started<8500){
        xsNativeLastReady=false;xsNativeLastOutcome='waiting-for-required-native';
        setTimeout(()=>xsNativePrepareFindMore(cards,s,done,started),250);return;
      }
      xsNativeLastReady=false;xsNativeLastOutcome='required-native-unavailable';
      xsNativeRecordError('required-native-unavailable');
      xsToast('MediaPipe / OpenCV unavailable • see XSearch diagnostics');
      done();return;
    }
    xsNativeLastReady=true;xsNativeFindRuns++;
    const t0=performance.now(),feedback=xsFeedbackGroups(s);
    const anchors=[...feedback.pos,...feedback.neg].map(f=>xsNativeAnchorSource(f,cards)).filter(a=>xsNativeLikelyImage(a.url));
    const positives=anchors.filter(a=>a.type==='more');
    const full=cards.filter(c=>c?.isConnected),samples=[];
    for(const card of full){
      const gif=xsNativeGifURL(card),preview=xsNativePreviewURL(card),url=gif||preview;
      if(xsNativeLikelyImage(url))samples.push({key:xsResultKey(card),url,preview:preview||gif});
    }
    xsNativeSampleCount=samples.length;
    if(!positives.length||!samples.length){xsNativeLastOutcome=!positives.length?'anchor-source-missing':'candidate-source-missing';done();return}
    const maxRequests=Math.min(40,Math.max(12,samples.length)),maxInflight=2,deadline=13500;
    const queue=xsNativeSampleQueue(samples,anchors,maxRequests);
    let cursor=0,requests=0,ended=false;
    const finish=why=>{
      if(ended)return;ended=true;clearInterval(tick);
      xsNativeScores.clear();xsNativeAnchorReady=positives.filter(a=>xsNativeSignatures.has(a.url)).length;
      let comparable=0;
      for(const candidate of samples){
        const sig=xsNativeSignatures.get(candidate.url);if(!sig)continue;
        let p=0,n=0,pn=0,nn=0;
        for(const anchor of anchors){
          const anchorSig=xsNativeSignatures.get(anchor.url);if(!anchorSig)continue;
          const sim=xsNativeCompare(sig,anchorSig);if(!sim)continue;
          if(anchor.type==='more'){p+=sim.score;pn++}else{n+=sim.score;nn++}
        }
        if(pn){xsNativeScores.set(candidate.key,Math.max(0,p/pn-(nn?.4*n/nn:0)));comparable++}
      }
      xsNativeComparable=comparable;xsNativeCoverage=samples.length?comparable/samples.length:0;
      xsNativeWaitMs=Math.round(performance.now()-t0);
      const minimum=Math.min(samples.length,Math.max(8,Math.ceil(samples.length*.24)));
      xsNativeRankEnabled=xsNativeAnchorReady>0&&comparable>=minimum;
      xsNativeLastOutcome=(xsNativeRankEnabled?'native-':'insufficient-')+why+':'+comparable+'/'+samples.length+
        ' ('+Math.round(100*xsNativeCoverage)+'% coverage) / '+xsNativeWaitMs+'ms';
      xsNativeCompleted++;done();
    };
    const tick=setInterval(()=>{
      if(ended)return;
      for(const [url,p] of xsNativePending)if(performance.now()-p.since>12000){
        xsNativePending.delete(url);xsNativeFailed.set(url,Date.now()+30000);
        xsNativeRecordError('callback-timeout');xsNativeTimeouts++;
      }
      let active=queue.reduce((sum,q)=>sum+(xsNativePending.has(q.url)?1:0),0);
      while(active<maxInflight && cursor<queue.length && requests<maxRequests){
        const q=queue[cursor++];requests++;
        if(xsNativeRequest(q.url,q.preview)&&xsNativePending.has(q.url))active++;
        else xsNativeSkipped++;
      }
      const ready=positives.some(a=>xsNativeSignatures.has(a.url));
      const matched=samples.reduce((count,x)=>count+(xsNativeSignatures.has(x.url)?1:0),0);
      if(ready&&matched>=Math.max(16,Math.floor(samples.length*.45))){finish('coverage');return}
      if((cursor>=queue.length||requests>=maxRequests)&&active===0){finish('queue-drained');return}
      if(performance.now()-t0>=deadline){xsNativeTimeouts++;finish('deadline')}
    },170);
  }
  function xsNativeDebug(){return {bridge:!!xsNativeHost(),hostProbe:window.__xgridNativeProbe||null,status:xsNativeStatus(),ready:xsNativeLastReady,
    findRuns:xsNativeFindRuns,requested:xsNativeRequested,success:xsNativeSuccess,errors:xsNativeErrors,skipped:xsNativeSkipped,
    timeouts:xsNativeTimeouts,completed:xsNativeCompleted,signatures:xsNativeSignatures.size,matchedScores:xsNativeScores.size,
    anchorsReady:xsNativeAnchorReady,comparable:xsNativeComparable,applied:xsNativeApplied,rankEnabled:xsNativeRankEnabled,
    waitMs:xsNativeWaitMs,outcome:xsNativeLastOutcome,coverage:xsNativeCoverage,sampleCount:xsNativeSampleCount,
    originalSources:[...xsNativeKinds.values()].filter(x=>x==='original-gif-motion').length,
    previewSources:[...xsNativeKinds.values()].filter(x=>x==='preview-geometry').length,errorsByType:[...xsNativeErrorsByType].map(([k,v])=>k+':'+v).join(',')||'none'} }

  function xsFindVariations(){
    const state=xsLoad(),groups=xsFeedbackGroups(state),anchor=groups.pos[0];
    if(!anchor){xsToast('FIND VARIATIONS • select MORE LIKE THIS first');return false}
    const goal=String(state.goal||state.baseQuery||xsCurrentQuery()||'').trim();
    const title=String(anchor.title||'').toLowerCase().replace(/[^a-z0-9\s-]+/g,' ');
    const stop=new Set(['and','the','with','without','best','guide','tips','how','you','your','for','more','that','this','form','worked','benefits','workoutlabs','fitness','exercise']);
    const words=title.split(/\s+/).filter(x=>x.length>3&&!stop.has(x)&&!goal.toLowerCase().includes(x)).slice(0,4);
    const illustrated=/(illustrat|exercise guide|workoutlabs|spotebi|diagram)/i.test(String(anchor.title||'')+' '+String(anchor.domain||''));
    const query=[goal,...words,illustrated?'illustrated':'','animated gif'].filter(Boolean).join(' ').trim();
    xsToast('FIND VARIATIONS • retrieving new GIF candidates');
    return xsNavigateRetrieval('exact',{exactQuery:query});
  }
  function xsFindMore(trigger='manual'){if(xsFindMoreBusy||xsNavigationBusy||xsNextBatchBusy||xsLoad().retrieval?.researchTxn?.active||!xsGoogleImages()){xsFindMoreDuplicateBlocks++;return false}if(!xsIndexReady)xsRebuildIndex('initial');const currentCards=xsGlobalCards().filter(c=>c?.isConnected&&c.dataset?.[XS_FILTER_ATTR]!=='1'),s=xsLoad(),current=xsUniqueResults||new Set(xsGlobalCards().map(xsResultKey)).size,started=performance.now(),txnId='xfm-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);xsFindMoreBaselineHashes=currentCards.slice(0,XS_FIND_MORE_WINDOW).map(c=>xsFastHash(xsResultKey(c)));s.retrieval.findMoreChangeTarget=XS_FIND_MORE_CHANGE_TARGET;s.retrieval.findMore++;s.stats.retrievalActions++;s.stats.lastAction='find-more-local';s.stats.lastAt=Date.now();s.retrieval.lastKind='find-more-local';s.retrieval.lastReason='local-reshuffle';s.retrieval.lastGrowth=0;s.retrieval.actionStartCorpus=current;s.retrieval.pageHighWater=current;s.retrieval.lastPreservedCorpus=current;s.retrieval.lastFindMoreStart=current;s.retrieval.lastFindMoreHighWater=current;s.retrieval.lastFindMoreNetGrowth=0;s.retrieval.lastFindMorePasses=0;s.retrieval.lastFindMoreBatches=0;s.retrieval.lastFindMoreViewportRestored=true;s.retrieval.lastFindMoreDurationMs=0;s.retrieval.lastFindMoreTxnId=txnId;s.retrieval.lastFindMoreOutcome='local reshuffle • target 80% top-window change • '+current+' candidates • no navigation';xsButtonOutcome(s,'find-more','local-rerank',current);s.retrieval.lastDecisionDelta=null;xsFindMoreBusy=true;xsSave();xsNativePrepareFindMore(currentCards,s,()=>{xsRankAll('find-more');xsSave();setTimeout(()=>{xsFindMoreBusy=false;s.retrieval.lastFindMoreDurationMs=Math.round(performance.now()-started);s.retrieval.lastAt=Date.now();xsLastHealth=xsCorpusHealth(null,s);xsSave();xsButtonOutcome(s,'find-more','completed-'+Math.round((s.retrieval.lastFindMoreChangedRatio||0)*100)+'%-changed',current);xsToast('FIND MORE • '+Math.round((s.retrieval.lastFindMoreChangedRatio||0)*100)+'% changed • no reload')},110)});return true}
  function xsGoalScore(m,s){const q=xsGoalTokens(s);if(!q.length)return {value:0,hits:0,total:0};let hits=0,weighted=0,idfSum=0;for(const t of q){const v=m.vector[t]||0,idf=1+.25*(xsIdfWeight(t)-1);idfSum+=idf;if(v>0){hits++;weighted+=Math.min(3,v)*idf}}const cov=hits/q.length;return {value:cov*30+weighted*2,hits,total:q.length,idf:idfSum/q.length}}
  function xsSignalMatch(m,tag){const terms=xsTokens(tag,8);if(!terms.length)return 0;let hit=0,sum=0;for(const t of terms){const v=m.vector[t]||0;if(v>0){hit++;sum+=Math.min(1,v/3)*Math.min(1.45,.8+.22*xsIdfWeight(t))}}return hit?sum/terms.length:0}
  function xsSignalInGoal(sig,s){const goal=new Set(xsGoalTokens(s)),terms=xsTokens(sig.tag,8);return !!terms.length&&terms.every(t=>goal.has(t))}
  function xsSignalScore(m,s){let lp=0,ln=0,mp=0,mn=0;for(const sig of s.signals){if(xsSignalInGoal(sig,s))continue;const match=xsSignalMatch(m,sig.tag);if(!match)continue;const v=sig.weight*match,isLearned=(sig.source||'learned')==='learned';if(v>=0){if(isLearned)lp+=v;else mp+=v}else{if(isLearned)ln+=-v;else mn+=-v}}const factor=s.strength==='strong'?2.25:1.75,learnedCap=s.strength==='strong'?38:30,manualCap=s.strength==='strong'?54:42;return {learnedPositive:Math.min(learnedCap,lp*factor),learnedNegative:Math.min(learnedCap,ln*factor),manualPositive:Math.min(manualCap,mp*factor),manualNegative:Math.min(manualCap,mn*factor)}}
  function xsSiteRule(s,domain){const d=xsSiteKey(domain);return s.siteRules.find(r=>xsSameSite(r.domain,d))||null}
  function xsShouldFilter(m,s){const g=xsSiteGroups(s);if(g.none.some(d=>xsSameSite(d,m.domain)))return true;if(g.only.length&&!g.only.some(d=>xsSameSite(d,m.domain)))return true;if(s.mediaIntent==='gif'&&m.mediaType!=='gif')return true;if(s.mediaIntent==='image'&&m.mediaType!=='image')return true;return false}
  function xsScore(card,s,ctx=xsFeedbackContext(s)){const m=xsMeta(card),g=ctx.groups||xsFeedbackGroups(s),q=xsGoalScore(m,s),sig=xsSignalScore(m,s),tags=xsTagScore(m,s,ctx.tags);let posNearest=0,negNearest=0,visPos=0,visNeg=0;for(const a of g.pos){const v=xsCosine(m.vector,a.vector);posNearest=Math.max(posNearest,v);if(s.flags?.visual!==false&&m.visual&&a.visual)visPos=Math.max(visPos,xsVisualSimilarity(m.visual,a.visual))}for(const a of g.neg){const v=xsCosine(m.vector,a.vector);negNearest=Math.max(negNearest,v);if(s.flags?.visual!==false&&m.visual&&a.visual)visNeg=Math.max(visNeg,xsVisualSimilarity(m.visual,a.visual))}const posConsensus=xsCosine(m.vector,ctx.posConsensus||{}),negConsensus=xsCosine(m.vector,ctx.negConsensus||{}),aggressive=s.strength==='aggressive',strong=aggressive||s.strength==='strong';const posBlend=g.pos.length<=1?posNearest:g.pos.length===2?(posConsensus*.8+posNearest*.2):(posConsensus*.88+posNearest*.12),negBlend=g.neg.length<=1?negNearest:g.neg.length===2?(negConsensus*.82+negNearest*.18):(negConsensus*.9+negNearest*.1);const directPosCap=!g.pos.length?0:g.pos.length===1?(aggressive?38:strong?28:22):g.pos.length===2?(aggressive?56:strong?40:32):(aggressive?72:strong?52:42),directNegCap=!g.neg.length?0:g.neg.length===1?(aggressive?46:strong?34:27):g.neg.length===2?(aggressive?66:strong?48:38):(aggressive?84:strong?60:48),directPos=directPosCap?xsSoftCap(posBlend*(aggressive?82:strong?62:49),directPosCap):0,directNeg=directNegCap?xsSoftCap(negBlend*(aggressive?92:strong?70:55),directNegCap):0,learnedPos=xsSoftCap(sig.learnedPositive,aggressive?38:strong?28:22),learnedNeg=xsSoftCap(sig.learnedNegative,aggressive?44:strong?32:25),manualSignal=(sig.manualPositive-sig.manualNegative)*(aggressive?1.28:1),signalNet=manualSignal+learnedPos-learnedNeg,pos=directPos,neg=directNeg;const rule=xsSiteRule(s,m.domain),siteBoost=rule?.mode==='more'?(aggressive?30:strong?24:18):0,sitePenalty=rule?.mode==='less'?(aggressive?32:strong?24:18):0,filtered=xsShouldFilter(m,s),mediaBonus=xsMediaBonus(m,s),visualBonus=Math.min(aggressive?20:strong?14:10,visPos*(aggressive?20:strong?14:10))-Math.min(aggressive?24:strong?16:12,visNeg*(aggressive?24:strong?16:12)),aspectBonus=g.pos.length?Math.max(...g.pos.map(a=>a.aspect>0&&m.aspect>0?Math.max(0,1-Math.min(1,Math.abs(Math.log(m.aspect/a.aspect))/1.2)):0))*(aggressive?5:3):0;return {score:q.value+signalNet+pos-neg+tags.net+siteBoost-sitePenalty+aspectBonus+mediaBonus+visualBonus-(filtered?100000:0),query:q.value,queryHits:q.hits,queryTotal:q.total,signal:signalNet,signalPositive:sig.manualPositive+learnedPos,signalNegative:sig.manualNegative+learnedNeg,tag:tags.net,tagPositive:tags.positive,tagNegative:tags.negative,pos,neg,posCap:directPosCap,negCap:directNegCap,posConsensus,negConsensus,siteBoost,sitePenalty,siteMode:rule?.mode||'',filtered,aspectBonus,mediaBonus,visualBonus,mediaType:m.mediaType,mediaConfidence:m.mediaConfidence||0,domain:m.domain,title:m.title,sig:m.sig}}
  function xsEnsureOrig(wall,cards){for(const c of cards)if(!xsOrigIndex.has(c))xsRegisterCard(c)}
  function xsOrder(cards,s,nativeTransaction=false){const ctx=xsFeedbackContext(s),seenHistory=new Set(s.retrieval?.seenIdentityHashes||[]),hasSeenHistory=seenHistory.size>0,items=cards.map(card=>{const hash=xsFastHash(xsResultKey(card));return {card,orig:xsOrigIndex.get(card)||0,divPenalty:0,dupPenalty:0,freshBoost:0,seenBefore:hasSeenHistory&&seenHistory.has(hash),...xsScore(card,s,ctx)}});if(xsNativeRankEnabled&&nativeTransaction){for(const it of items){const nativeScore=xsNativeScores.get(xsResultKey(it.card));if(nativeScore!==undefined){it.score=100*nativeScore;xsNativeApplied++}}}if(s.flags?.diversity===false)return items.sort((a,b)=>(b.score-a.score)||(a.orig-b.orig)).map(x=>(x.finalScore=x.score,x));const out=[],domains=new Map(),sigs=new Map(),full=items.length<=280,aggressive=s.strength==='aggressive',maxOrig=Math.max(1,...items.map(x=>x.orig||0));xsRankingMode=(aggressive?'aggressive-':'')+(full?'full-greedy':'windowed-greedy');let remaining=items.slice().sort((a,b)=>(b.score-a.score)||(a.orig-b.orig));while(remaining.length){const limit=full?remaining.length:Math.min(100,remaining.length);let bi=0,best=-Infinity,bd=0,bs=0,bf=0;for(let i=0;i<limit;i++){const it=remaining[i],site=xsSiteKey(it.domain),count=site?(domains.get(site)||0):0,mode=it.siteMode||'',scale=mode==='only'?0:mode==='more'?.4:1,rawDp=count<=0?0:Math.min(aggressive?125:90,count*(aggressive?8:5)+Math.max(0,count-1)*Math.max(0,count-1)*(aggressive?6:4)),dp=it.filtered?0:rawDp*scale,sp=it.filtered?0:(it.sig?Math.min(aggressive?95:70,(sigs.get(it.sig)||0)*(aggressive?11:7)):0),lateFresh=aggressive?Math.min(16,16*(it.orig/maxOrig)):0,sessionFresh=aggressive&&hasSeenHistory?(it.seenBefore?-16:18):0,fresh=lateFresh+sessionFresh,val=it.score-dp-sp+fresh-it.orig*1e-4;if(val>best){best=val;bi=i;bd=dp;bs=sp;bf=fresh}}const it=remaining.splice(bi,1)[0];it.divPenalty=bd;it.dupPenalty=bs;it.freshBoost=bf;it.finalScore=it.score-bd-bs+bf;out.push(it);if(!it.filtered&&it.domain){const site=xsSiteKey(it.domain);domains.set(site,(domains.get(site)||0)+1)}if(!it.filtered&&it.sig)sigs.set(it.sig,(sigs.get(it.sig)||0)+1)}return out}
  function xsApplyFindMoreChangeTarget(ordered,s){const baseline=[...xsFindMoreBaselineHashes],target=xsClamp(s.retrieval?.findMoreChangeTarget??XS_FIND_MORE_CHANGE_TARGET,0,1);if(!baseline.length||!ordered.length){if(s.retrieval){s.retrieval.lastFindMoreWindow=0;s.retrieval.lastFindMoreChangedCount=0;s.retrieval.lastFindMoreChangedRatio=0}return ordered}const uniq=[],dupes=[],seen=new Set();for(const x of ordered){const h=xsFastHash(xsResultKey(x.card));if(seen.has(h)){dupes.push(x);continue}seen.add(h);uniq.push(x)}const researchFresh=Number(s.retrieval?.activeFreshnessTarget||0)>=XS_RESEARCH_FRESH_TARGET,displayable=x=>!x.filtered&&!(researchFresh&&x.seenBefore===true),eligible=uniq.filter(displayable),window=Math.min(XS_FIND_MORE_WINDOW,baseline.length,eligible.length),oldTop=new Set(baseline.slice(0,window)),outside=eligible.filter(x=>!oldTop.has(xsFastHash(xsResultKey(x.card)))),need=Math.min(Math.ceil(window*target),outside.length),prefix=outside.slice(0,need),prefixSet=new Set(prefix);for(const x of eligible){if(prefix.length>=window)break;if(!prefixSet.has(x)){prefix.push(x);prefixSet.add(x)}}const out=[...prefix,...uniq.filter(x=>!prefixSet.has(x)),...dupes],overlap=prefix.slice(0,window).filter(x=>oldTop.has(xsFastHash(xsResultKey(x.card)))).length,changed=Math.max(0,window-overlap),ratio=window?changed/window:0;if(s.retrieval){s.retrieval.lastFindMoreWindow=window;s.retrieval.lastFindMoreChangedCount=changed;s.retrieval.lastFindMoreChangedRatio=Number(ratio.toFixed(3));s.retrieval.lastFindMoreOutcome='local reshuffle • '+Math.round(ratio*100)+'% top-window change • '+(xsUniqueResults||uniq.length)+' candidates • no navigation'}xsFindMoreBaselineHashes=[];return out}
  function xsRankReasonPriority(r){return r==='find-more'?5:r==='user'?4:r==='google'?3:r==='metadata'?2:r==='initial'?1:0}
  function xsMarkSearchBusy(wall){const token=String(++xsTxnSeq);wall.dataset.xgridSearchBusy='1';wall.dataset.xgridSearchTxn=token;return token}
  function xsClearSearchBusyLater(wall,token){setTimeout(()=>{if(wall?.dataset?.xgridSearchTxn===token){delete wall.dataset.xgridSearchBusy;delete wall.dataset.xgridSearchTxn}},0)}
  function xsWallCards(wall){return [...wall.children].filter(c=>c.classList?.contains(IMAGE_ONLY)&&(!c.classList.contains(SKIP)||c.dataset?.[XS_FILTER_ATTR]==='1'))}
  function xsSetFiltered(card,on){if(!card?.classList)return false;const was=card.dataset?.[XS_FILTER_ATTR]==='1';if(on){card.dataset[XS_FILTER_ATTR]='1';card.classList.add(SKIP)}else if(was){delete card.dataset[XS_FILTER_ATTR];card.classList.remove(SKIP);prepareCard(card)}return was!==on}
  function xsRankWall(wall,reason='user'){return xsRankAll(reason)}
  function xsRestoreWall(wall){return xsRestoreAll()}
  function xsGlobalWalls(){return [...document.querySelectorAll('.'+WALL)].filter(w=>w?.isConnected)}
  function xsGlobalCards(walls=xsGlobalWalls()){const out=[];for(const w of walls)for(const c of xsWallCards(w))out.push(c);return out}
  function xsViewportWall(walls){return walls.find(w=>{const r=w.getBoundingClientRect?.();return r&&r.bottom>0&&r.top<innerHeight})||walls[0]||null}
  function xsCommitGlobalOrder(cardOrder,walls,reason){const cards=xsGlobalCards(walls),caps=walls.map(w=>xsWallCards(w).length);if(cardOrder.length!==cards.length)return false;let changed=!cards.every((c,i)=>c===cardOrder[i]);if(!changed){for(const w of walls)layoutWall(w,true);return false}const anchorWall=xsViewportWall(walls),anchor=anchorWall?captureWallAnchor(anchorWall):null,d0=performance.now(),tokens=walls.map(xsMarkSearchBusy),target=new Map();let p=0,movedNodes=0;for(let wi=0;wi<walls.length;wi++)for(let n=0;n<caps[wi]&&p<cardOrder.length;n++,p++)target.set(cardOrder[p],walls[wi]);for(const card of cardOrder){const w=target.get(card);if(w&&card.parentElement!==w){w.appendChild(card);movedNodes++}}p=0;for(let wi=0;wi<walls.length;wi++){const w=walls[wi],chunk=cardOrder.slice(p,p+caps[wi]);p+=caps[wi];for(let j=chunk.length-1;j>=0;j--){const node=chunk[j],next=j+1<chunk.length?chunk[j+1]:null;if(node.parentElement!==w||node.nextElementSibling!==next){w.insertBefore(node,next);movedNodes++}}}for(const w of walls)layoutWall(w,true);restoreWallAnchor(anchor);if(anchor)xsAnchorPreserved++;xsReorderTransactions++;xsReorderMovedNodes+=movedNodes;walls.forEach((w,idx)=>xsClearSearchBusyLater(w,tokens[idx]));try{window.dispatchEvent(new CustomEvent('__xgridSearchReordered',{detail:{reason,moved:movedNodes,global:true,cards:cardOrder.length}}))}catch(_){}const dt=performance.now()-d0;xsDomReorderMs+=dt;xsDomReorderMax=Math.max(xsDomReorderMax,dt);return true}
  function xsRankAll(reason='user'){xsRepairIndexIntegrity();const walls=xsGlobalWalls(),cards=xsGlobalCards(walls);if(!walls.length||!cards.length)return;const s=xsLoad();xsEnsureOrig(null,cards);const t0=performance.now();let ordered=xsOrder(cards,s,reason==='find-more');if(s.retrieval?.exactMode&&reason!=='find-more'){ordered.sort((a,b)=>{const qa=xsGoalScore(xsMeta(a.card),s),qb=xsGoalScore(xsMeta(b.card),s);return qb.hits-qa.hits||qb.value-qa.value||b.finalScore-a.finalScore})}if(reason==='find-more'&&!xsNativeRankEnabled)ordered=xsApplyFindMoreChangeTarget(ordered,s);else if(reason==='find-more'&&xsNativeRankEnabled){const baseline=new Set(xsFindMoreBaselineHashes);const window=Math.min(XS_FIND_MORE_WINDOW,ordered.length);const changed=ordered.slice(0,window).filter(it=>!baseline.has(xsFastHash(xsResultKey(it.card)))).length;if(s.retrieval){s.retrieval.lastFindMoreWindow=window;s.retrieval.lastFindMoreChangedCount=changed;s.retrieval.lastFindMoreChangedRatio=window?changed/window:0;s.retrieval.lastFindMoreOutcome='native visual comparison • '+xsNativeApplied+' score applications • '+Math.round((window?changed/window:0)*100)+'% natural top-window change'}xsFindMoreBaselineHashes=[];}const rankDt=performance.now()-t0;xsRankMs+=rankDt;xsRankMax=Math.max(xsRankMax,rankDt);let visibilityChanged=false,seenKeys=new Set(),dupes=0,researchSeenHidden=0;const researchFresh=Number(s.retrieval?.activeFreshnessTarget||0)>=XS_RESEARCH_FRESH_TARGET;for(const x of ordered){const key=xsResultKey(x.card),hardDuplicate=seenKeys.has(key);if(!hardDuplicate)seenKeys.add(key);else dupes++;const freshnessFiltered=researchFresh&&x.seenBefore===true;if(freshnessFiltered)researchSeenHidden++;x.hardDuplicate=hardDuplicate;x.freshnessFiltered=freshnessFiltered;if(xsSetFiltered(x.card,x.filtered||hardDuplicate||freshnessFiltered))visibilityChanged=true}xsDuplicateHidden=dupes;if(s.retrieval)s.retrieval.lastResearchSeenHidden=researchSeenHidden;const visible=ordered.filter(x=>!x.filtered&&!x.hardDuplicate&&!x.freshnessFiltered),scores=visible.map(x=>x.finalScore).sort((a,b)=>a-b),moves=visible.map((x,i)=>Math.abs((x.orig??i)-i)),freshSeen=visible.filter(x=>x.seenBefore).length,freshNew=visible.filter(x=>!x.seenBefore).length,mid=a=>{if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2};const top10=visible.slice(0,10),groups=xsFeedbackGroups(s),sites=xsSiteGroups(s),blockedLeakage=top10.filter(x=>sites.none.some(d=>xsSameSite(d,x.domain))).length,positiveIds=new Set(groups.pos.map(x=>x.id||x.docid).filter(Boolean)),positiveTop10=top10.filter(x=>positiveIds.has(xsResultKey(x.card))||positiveIds.has(xsMeta(x.card).docid)).length,newTop=top10.map(x=>xsResultKey(x.card));xsTop10Changed=newTop.filter((k,i)=>xsPrevTopKeys[i]!==k).length;xsPrevTopKeys=newTop;xsLastDiag={cards:visible.length,moved:moves.filter(x=>x>0).length,avgMove:moves.length?moves.reduce((a,b)=>a+b,0)/moves.length:0,maxMove:moves.length?Math.max(...moves):0,scoreMin:scores.length?scores[0]:0,scoreMedian:mid(scores),scoreAvg:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0,scoreMax:scores.length?scores[scores.length-1]:0,uniqueDomains:new Set(visible.map(x=>xsSiteKey(x.domain)).filter(Boolean)).size,blockedLeakage,positiveTop10,filtered:ordered.length-visible.length,duplicatesHidden:dupes,top10Changed:xsTop10Changed,freshSeen,freshNew,freshFiltered:researchSeenHidden,top:visible.slice(0,5).map((x,i)=>({rank:i+1,score:Number(x.finalScore.toFixed(2)),from:(x.orig??i)+1,move:Math.abs((x.orig??i)-i),domain:x.domain||'(unknown)',title:(x.title||'').slice(0,100),query:Number(x.query.toFixed(2)),queryHits:x.queryHits,queryTotal:x.queryTotal,signal:Number(x.signal.toFixed(2)),tag:Number((x.tag||0).toFixed(2)),pos:Number(x.pos.toFixed(2)),neg:Number(x.neg.toFixed(2)),posConsensus:Number((x.posConsensus||0).toFixed(3)),negConsensus:Number((x.negConsensus||0).toFixed(3)),posCap:x.posCap,negCap:x.negCap,siteBoost:x.siteBoost,sitePenalty:x.sitePenalty,siteMode:x.siteMode||'',mediaType:x.mediaType||'unknown',mediaConfidence:Number((x.mediaConfidence||0).toFixed(2)),mediaBonus:Number((x.mediaBonus||0).toFixed(2)),visualBonus:Number((x.visualBonus||0).toFixed(2)),aspect:Number(x.aspectBonus.toFixed(2)),diversity:Number(x.divPenalty.toFixed(2)),duplicate:Number(x.dupPenalty.toFixed(2)),freshness:Number((x.freshBoost||0).toFixed(2)),seenBefore:x.seenBefore===true}))};xsCommitGlobalOrder(ordered.map(x=>x.card),walls,reason);xsReranks++;xsCardsRanked+=cards.length;xsLastRankReason=reason;if(reason==='user'||reason==='find-more')xsUserReranks++;else if(reason==='google'||reason==='metadata')xsGoogleReranks++;else if(reason==='initial')xsInitialReranks++;xsLastHealth=xsCorpusHealth(null,s)}
  function xsScheduleRank(wall,reason='user'){if(!wall?.isConnected)return;const current=xsPendingRankReason;if(xsRankTimer&&xsRankReasonPriority(current)>=xsRankReasonPriority(reason)){xsDuplicateRankSchedules++;return}if(xsRankReasonPriority(reason)>xsRankReasonPriority(current))xsPendingRankReason=reason;if(xsRankTimer)return;xsRankTimer=setTimeout(()=>{xsRankTimer=0;const r=xsPendingRankReason;xsPendingRankReason='none';xsRankAll(r)},45)}
  function xsApplyAll(reason='user'){const wall=document.querySelector('.'+WALL);if(wall)xsScheduleRank(wall,reason)}
  function xsRestoreAll(){if(xsRankTimer){clearTimeout(xsRankTimer);xsRankTimer=0}xsPendingRankReason='none';const walls=xsGlobalWalls(),cards=xsGlobalCards(walls);if(!walls.length||!cards.length)return;xsEnsureOrig(null,cards);for(const c of cards)xsSetFiltered(c,false);const ordered=cards.slice().sort((a,b)=>(xsOrigIndex.get(a)||0)-(xsOrigIndex.get(b)||0));if(xsCommitGlobalOrder(ordered,walls,'restore'))xsRestores++}
  function xsHasTarget(s=xsLoad()){return !!(s.feedback.length||s.signals.length||s.siteRules.length||s.mediaIntent!=='auto'||xsQueryKey(s.goal)!==s.baseKey)}
  function xsPruneCorpus(cards=xsGlobalCards()){const live=new Map();for(const c of cards){const k=xsResultKey(c);if(!live.has(k))live.set(k,c)}for(const [k,rec] of xsResultIndex){const c=live.get(k);if(c){rec.card=c;rec.stale=false;rec.lastSeen=Date.now()}else if(!rec.stale){rec.card=null;rec.stale=true;xsStalePruned++}}}
  function xsRefreshIndexStats(cards){const vocab=new Set(),seen=new Set(),df=new Map();let title=0,domain=0,source=0,image=0,dims=0,classified=0,tags=0;const media={gif:0,image:0,unknown:0};for(const c of cards){const m=xsMeta(c),key=xsResultKey(c);if(seen.has(key))continue;seen.add(key);if(m.title)title++;if(m.domain)domain++;if(m.sourceUrl)source++;if(m.imageUrl)image++;if(m.w>0&&m.h>0)dims++;if(m.mediaType!=='unknown')classified++;media[m.mediaType]=(media[m.mediaType]||0)+1;const local=new Set(m.tokens);for(const t of local){vocab.add(t);df.set(t,(df.get(t)||0)+1);tags++}}xsCorpusDocs=seen.size;xsDf=df;xsIdf=new Map([...df].map(([t,n])=>[t,Math.min(3.2,1+Math.log((xsCorpusDocs+1)/(n+1)))]));xsIndexedCards=cards.length;xsUniqueResults=seen.size;xsVocabulary=vocab.size;xsAvgTags=seen.size?tags/seen.size:0;xsCoverage={title,domain,source,image,dims,animation:classified,total:seen.size};xsMediaCounts=media}
  function xsReconcileQualitySignals(s=xsLoad()){if(!s.qualityRebuildPending)return false;s.qualityRebuildPending=false;s.qualityModel=5;s.stats.lastAction='quality-model-migrated';return true}
  function xsRebuildIndex(reason='initial'){if(!xsGoogleImages())return;xsEnsureIndexEpoch();const t0=performance.now();xsEnforceGifPageLimit();xsRefreshStructured();const cards=[...document.querySelectorAll('.'+WALL+' > .'+IMAGE_ONLY)];let newCards=0;for(const c of cards){const r=xsRegisterCard(c);if(r.isNew)newCards++;xsMeta(c)}xsPruneCorpus(cards);xsRefreshIndexStats(cards);const s=xsLoad();if(xsReconcileQualitySignals(s))xsSave();xsIndexBuilds++;if(!xsIndexReady){xsFullIndexBuilds++;xsIndexReady=true}else xsIncrementalPasses++;xsIndexCommittedEpoch=xsIndexEpoch;xsScheduleNoveltyCommit(s);const dt=performance.now()-t0;xsIndexMs+=dt;xsIndexMax=Math.max(xsIndexMax,dt);const researchHolding=!!s.retrieval?.researchTxn?.active&&!!s.retrieval?.pendingNovelty;if(researchHolding)xsSetResearchHold(true);else if(!xsNextBatchBusy&&xsHasTarget()&&(newCards>0||reason==='initial'||reason==='metadata'||reason==='google'))xsApplyAll(reason==='initial'?'initial':reason==='metadata'?'metadata':'google');if(xsRetrievalPhase==='settling')xsScheduleSettleRelease('index-settled')}
  function xsScheduleIndex(delay=80,reason='google'){if(xsIndexTimer){if(xsRankReasonPriority(reason)>xsRankReasonPriority(xsIndexReason))xsIndexReason=reason;return}xsIndexReason=reason;xsIndexTimer=setTimeout(()=>{xsIndexTimer=0;const r=xsIndexReason;xsIndexReason='google';xsRebuildIndex(r)},delay)}
  function xsMaybeIndexWall(wall){if(!wall?.isConnected||wall.dataset?.xgridSearchBusy==='1')return;for(const c of wall.children)if(c.classList?.contains(IMAGE_ONLY)&&!xsKnownCard(c)){xsScheduleIndex(55,xsIndexReady?'google':'initial');return}}
  function xsNeedsStructuredEnrichment(){for(const c of xsGlobalCards()){const m=xsMetaCache.get(c);if(!m||!m.structuredReady)return true}return false}
  function xsToast(text){let t=document.getElementById(XS_TOAST);if(t)t.remove();t=document.createElement('div');t.id=XS_TOAST;t.textContent=text;document.documentElement.appendChild(t);setTimeout(()=>{if(t?.isConnected)t.remove()},1500)}
  function xsUpsertSignal(tag,weight,source='manual',hits=0,origin=''){const s=xsLoad(),clean=xsNorm(tag);if(!clean)return false;let sig=s.signals.find(x=>x.tag===clean);if(sig){sig.weight=Number(xsClamp(weight,-10,10).toFixed(2));sig.source=source==='learned'&&sig.source!=='learned'?sig.source:source;sig.learnedHits=Math.max(sig.learnedHits||0,hits||0);sig.origins=[...new Set([...(sig.origins||[]),...(origin?[origin]:[])])].slice(0,XS_MAX);sig.at=Date.now()}else{s.signals.push(xsSignalRecord(clean,weight,source,hits,origin?[origin]:[]));s.signals=s.signals.slice(0,40)}return true}
  function xsRegisterChoiceSite(s,f){const d=xsSiteKey(f?.domain||'');if(!d)return false;let r=(s.registeredSites||[]).find(x=>xsSameSite(x.domain,d));if(!r){r={domain:d,more:0,less:0,total:0,lastAt:Date.now()};s.registeredSites=[...(s.registeredSites||[]),r].slice(-40);s.stats.sitesRegistered=(s.stats.sitesRegistered||0)+1}r.total=(r.total||0)+1;if(f.type==='more')r.more=(r.more||0)+1;else if(f.type==='less')r.less=(r.less||0)+1;r.lastAt=Date.now();return true}
  const XS_SIGNAL_NOISE=new Set([...XS_RETRIEVAL_NOISE,'feat','featuring','starring','episode','scene','volume']);
  const XS_SIGNAL_HARD_NOISE=new Set('go goes going gone get gets getting got put puts putting make makes making made give gives giving gave show shows showing showed shown say says saying said take takes taking took want wants wanting wanted like likes liking liked look looks looking looked use uses using used seem seems seemed become becomes became come comes came do does did done'.split(' '));
  const XS_SIGNAL_GENERIC=new Set('girl girls woman women man men person people babe babes lady ladies someone somebody thing things stuff body bodies'.split(' '));
  function xsSignalTokenPriority(t){t=xsNorm(t);if(!t||XS_SIGNAL_HARD_NOISE.has(t))return -2;if(XS_SIGNAL_GENERIC.has(t))return -.9;return 0}
  function xsChoiceTokenSupport(t,s=xsLoad()){let count=0,sum=0;for(const f of s.feedback||[]){const w=Number(f?.vector?.[t])||0;if(w>=.55){count++;sum+=w}}return {count,avg:count?sum/count:0}}
  function xsAtomicLearnedSignalTag(tag,s=xsLoad()){const baseGoal=new Set([...xsBaseTokens(s),...xsGoalTokens(s)]),terms=xsTokens(tag,8).filter(t=>xsGoodSignalToken(t)&&!XS_SIGNAL_NOISE.has(t)&&!XS_SIGNAL_HARD_NOISE.has(t));if(!terms.length)return '';if(terms.length===1){const t=terms[0],a=xsChoiceTokenSupport(t,s);if(XS_SIGNAL_GENERIC.has(t)&&a.count<2)return '';return t}return terms.map(t=>{const a=xsChoiceTokenSupport(t,s);return {t,adds:baseGoal.has(t)?0:1,support:a.count,avg:a.avg,priority:xsSignalTokenPriority(t)}}).sort((a,b)=>b.priority-a.priority||b.adds-a.adds||b.support-a.support||b.avg-a.avg||a.t.length-b.t.length)[0].t}
  function xsChoiceConceptCandidates(f,s=xsLoad()){const baseGoal=new Set([...xsBaseTokens(s),...xsGoalTokens(s)]),domainTerms=new Set(xsTokens(String(f?.domain||'').replace(/[.\-_]+/g,' '),12)),blocked=new Set([...(s.suppressedSignals||[]),...(s.suppressedTags||[])]),title=xsTokens(f?.title||'',28).filter(t=>xsGoodSignalToken(t)&&!domainTerms.has(t)&&!XS_SIGNAL_NOISE.has(t)&&!XS_SIGNAL_HARD_NOISE.has(t)),vec=f?.vector||{},rows=[],seen=new Set(),push=(tag,bonus=0,fallback=false)=>{tag=xsNorm(tag);if(!tag||seen.has(tag)||blocked.has(tag))return;const terms=xsTokens(tag,2);if(terms.length!==1)return;const t=terms[0];if(domainTerms.has(t)||!xsGoodSignalToken(t)||XS_SIGNAL_NOISE.has(t)||XS_SIGNAL_HARD_NOISE.has(t))return;const adds=!baseGoal.has(t);if(!adds&&!fallback)return;const w=Number(vec[t])||0,idf=Math.min(1.35,xsIdfWeight(t)),prev=xsTermPrevalence(t),support=xsChoiceTokenSupport(t,s),genericPenalty=XS_SIGNAL_GENERIC.has(t)?1.15:0,singletonPenalty=support.count<=1&&prev<.02?.25:0,score=w*1.15+idf*.35+(1-prev)*.15+Math.min(4,support.count)*1.2+support.avg*.45+bonus-genericPenalty-singletonPenalty;seen.add(tag);rows.push({tag,score:Number(score.toFixed(3)),terms:1,adds,support:support.count,avg:support.avg,generic:XS_SIGNAL_GENERIC.has(t)})};for(const t of title)push(t,.2);for(const [t,w] of Object.entries(vec).sort((a,b)=>(Number(b[1])||0)-(Number(a[1])||0)))if(Number(w)>=.7)push(t,0);if(!rows.length){for(const t of title)push(t,0,true)}if(!rows.length){for(const t of xsTokens(s.goal||s.baseQuery,12))push(t,0,true)}return rows.sort((a,b)=>b.support-a.support||b.score-a.score||Number(a.generic)-Number(b.generic))}
  function xsExistingChoiceSignalCandidate(f,s=xsLoad(),sign=1){const rows=[];for(const sig of s.signals||[]){if((sig.source||'learned')!=='learned'||Math.sign(sig.weight||0)!==sign)continue;const terms=xsTokens(sig.tag,2);if(terms.length!==1)continue;const t=terms[0];if(!xsGoodSignalToken(t)||XS_SIGNAL_NOISE.has(t)||XS_SIGNAL_HARD_NOISE.has(t))continue;const w=Number(f?.vector?.[t])||0;if(w<.5)continue;const support=xsChoiceTokenSupport(t,s),score=w*1.15+Math.min(5,support.count)*1.35+support.avg*.5+Math.min(2,Math.abs(sig.weight||0))*.3-(XS_SIGNAL_GENERIC.has(t)?.8:0);rows.push({tag:t,score:Number(score.toFixed(3)),support:support.count,reinforce:true})}return rows.sort((a,b)=>b.score-a.score||b.support-a.support)[0]||null}
  function xsGuaranteeChoiceSignal(f,s=xsLoad()){const sign=f.type==='less'?-1:1,candidates=xsChoiceConceptCandidates(f,s),reinforce=xsExistingChoiceSignalCandidate(f,s,sign);let chosen=candidates[0]||reinforce;if(reinforce&&(!chosen||(chosen.support||0)<2||reinforce.score>=chosen.score*.82))chosen=reinforce;if(!chosen)return null;let sig=s.signals.find(x=>x.tag===chosen.tag);const baseWeight=sign*(f.type==='more'?3.4:3.2);if(sig){sig.origins=[...new Set([...(sig.origins||[]),f.id])].slice(0,XS_MAX);sig.learnedHits=Math.max((sig.learnedHits||0)+1,sig.origins.length);if(sig.source==='learned'){if(Math.sign(sig.weight||0)===sign)sig.weight=Number(xsClamp(sig.weight+sign*.55,-8,8).toFixed(2));else sig.weight=Number(xsClamp(sig.weight+sign*.9,-8,8).toFixed(2))}sig.at=Date.now()}else{s.signals.push(xsSignalRecord(chosen.tag,baseWeight,'learned',1,[f.id]));s.stats.signalsAdded=(s.stats.signalsAdded||0)+1}const mt=new Set(xsTokens(chosen.tag,8));s.manualTags=(s.manualTags||[]).filter(x=>!mt.has(xsNorm(x.tag)));s.stats.guaranteedSignalChoices=(s.stats.guaranteedSignalChoices||0)+1;return chosen.tag}
  function xsDeleteTag(tag){const s=xsLoad(),k=xsNorm(tag);if(!k)return false;s.manualTags=(s.manualTags||[]).filter(x=>x.tag!==k);s.suppressedTags=[...new Set([...(s.suppressedTags||[]),k])].slice(-120);s.stats.tagsDeleted=(s.stats.tagsDeleted||0)+1;s.stats.lastAction='delete-tag';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsToast('Tag deleted • automatic tag regeneration suppressed');xsShowHub(true);return true}
  function xsLearnSnapshot(f){const s=xsLoad(),suppressed=new Set([...(s.suppressedSignals||[]),...(s.suppressedTags||[])]),tags=xsDerivedTags(s);for(const t of tags){if(!xsAutoSignalEligible(t,s)||suppressed.has(t.tag))continue;const sig=s.signals.find(x=>x.tag===t.tag);if(!sig)continue;const desired=Math.sign(t.score)*Math.min(8,1.4+t.support*1.15+t.confidence*2.1),origins=s.feedback.filter(a=>a.type===(desired>=0?'more':'less')&&(a.vector?.[t.tag]||0)>.55).map(a=>a.id).filter(Boolean);sig.learnedHits=Math.max(sig.learnedHits||0,t.support);sig.origins=[...new Set([...(sig.origins||[]),...origins])].slice(0,XS_MAX);if(sig.source==='learned'){const same=Math.sign(sig.weight||0)===Math.sign(desired);if(same&&Math.abs(desired)>Math.abs(sig.weight))sig.weight=Number((sig.weight+(desired-sig.weight)*.3).toFixed(2));else if(!same&&t.support>=3)sig.weight=Number(xsClamp(sig.weight+desired*.2,-10,10).toFixed(2))}sig.at=Date.now()}s.signals=s.signals.sort((a,b)=>{const am=a.source==='manual'||a.source==='edited'||a.source==='manual-tag',bm=b.source==='manual'||b.source==='edited'||b.source==='manual-tag';return Number(bm)-Number(am)||Math.abs(b.weight)-Math.abs(a.weight)}).slice(0,40)}
  function xsRecord(card,type){if(!xsIndexReady)xsRebuildIndex('initial');if(type!=='more'&&type!=='less')return false;const s=xsLoad(),id=xsFeedbackKey(card),idx=s.feedback.findIndex(x=>x.id===id);if(idx<0&&s.feedback.length>=XS_MAX){xsCapBlocks++;xsToast('Image target full 10/10 • remove one in SEARCH');return false}const f=xsSnapshot(card,type),same=idx>=0&&s.feedback[idx]?.type===type;if(idx>=0)s.feedback[idx]=f;else s.feedback.push(f);s.feedback=s.feedback.slice(0,XS_MAX);if(!same){xsRegisterChoiceSite(s,f);xsGuaranteeChoiceSignal(f,s);xsLearnSnapshot(f)}if(f.rankBefore>0&&f.rankBefore<=10){if(type==='more')s.stats.top10More++;else s.stats.top10Less++}else{if(type==='more')s.stats.outside10More++;else s.stats.outside10Less++}s.stats.choices++;s.stats.lastAction=type;s.stats.lastAt=Date.now();s.retrieval.lastDecisionDelta={kind:type,pendingReshuffle:true,anchors:s.feedback.length,at:Date.now()};xsFeedbackChoices++;xsSave();xsToast((type==='more'?'More like this':'Less like this')+' recorded • '+s.feedback.length+'/'+XS_MAX+' • FIND MORE to reshuffle');return true}
  function xsRemoveFeedback(id){const s=xsLoad(),n=s.feedback.length;s.feedback=s.feedback.filter(x=>x.id!==id);if(s.feedback.length===n)return;s.stats.removals++;s.stats.lastAction='remove-anchor';s.stats.lastAt=Date.now();xsFeedbackRemovals++;xsSave();if(xsHasTarget(s))xsApplyAll('user');else xsRestoreAll();xsToast('Image anchor removed • learned signals kept');xsShowHub(true)}
  function xsSetGoal(goal){const s=xsLoad(),next=String(goal||'').trim()||s.baseQuery;if(xsQueryKey(next)===xsQueryKey(s.goal))return false;s.goal=next;s.stats.goalEdits++;s.stats.lastAction='goal-local';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsToast('Goal updated locally');return true}
  function xsApplyGoal(goal){const s=xsLoad(),next=String(goal||'').trim()||s.baseQuery,changed=xsQueryKey(next)!==xsQueryKey(s.goal);if(changed){s.goal=next;s.stats.goalEdits++}s.stats.goalApplies=(s.stats.goalApplies||0)+1;s.stats.lastAction='goal-apply';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsToast('Goal applied • fetching matching results');setTimeout(()=>xsNavigateRetrieval('goal-apply'),120);return true}
  function xsDeleteSignal(tag){const s=xsLoad(),k=xsNorm(tag),n=s.signals.length;s.signals=s.signals.filter(x=>x.tag!==k);if(s.signals.length===n)return;s.suppressedSignals=[...new Set([...(s.suppressedSignals||[]),k])].slice(-80);s.stats.signalsDeleted++;s.stats.lastAction='delete-signal';s.stats.lastAt=Date.now();xsSave();if(xsHasTarget(s))xsApplyAll('user');else xsRestoreAll();xsToast('Signal deleted • automatic relearning suppressed');xsShowHub(true)}
  function xsSaveSignal(oldTag,newTag,weight){const s=xsLoad(),old=xsNorm(oldTag),next=xsNorm(newTag);if(!next){xsToast('Enter a signal');return false}if(old&&old!==next)s.signals=s.signals.filter(x=>x.tag!==old);s.manualTags=(s.manualTags||[]).filter(x=>x.tag!==next&&x.tag!==old);s.suppressedSignals=(s.suppressedSignals||[]).filter(x=>x!==next);s.suppressedTags=(s.suppressedTags||[]).filter(x=>x!==next);const existed=s.signals.find(x=>x.tag===next);xsUpsertSignal(next,weight,old||existed?'edited':'manual',existed?.learnedHits||0);if(old||existed)s.stats.signalsEdited++;else s.stats.signalsAdded++;s.stats.lastAction=old||existed?'edit-signal':'add-signal';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsToast((old||existed?'Signal updated':'Signal added')+' • '+(Number(weight)>=0?'+':'')+Number(weight).toFixed(1));return true}
  function xsPromoteTagToSignal(tag){const s=xsLoad(),k=xsNorm(tag);if(!k)return false;const t=xsDerivedTags(s).find(x=>x.tag===k),weight=xsClamp(t?.score||3,-8,8);s.manualTags=(s.manualTags||[]).filter(x=>x.tag!==k);s.suppressedSignals=(s.suppressedSignals||[]).filter(x=>x!==k);s.suppressedTags=(s.suppressedTags||[]).filter(x=>x!==k);xsUpsertSignal(k,Math.abs(weight)<2.5?(weight<0?-3:3):weight,'manual-tag',t?.support||0);s.stats.signalsAdded++;s.stats.tagsPromoted=(s.stats.tagsPromoted||0)+1;s.stats.lastAction='tag-to-signal';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsToast('Tag promoted to Signal • '+k);xsShowHub(true);return true}
  function xsDemoteSignalToTag(tag){const s=xsLoad(),k=xsNorm(tag),sig=s.signals.find(x=>x.tag===k);if(!sig)return false;s.signals=s.signals.filter(x=>x.tag!==k);s.suppressedTags=(s.suppressedTags||[]).filter(x=>x!==k);const score=Number(xsClamp((sig.weight||0)*.65,-6,6).toFixed(2))||3;s.manualTags=[...(s.manualTags||[]).filter(x=>x.tag!==k),{tag:k,score,at:Date.now()}].slice(-40);s.suppressedSignals=[...new Set([...(s.suppressedSignals||[]),k])].slice(-80);s.stats.signalsDemoted=(s.stats.signalsDemoted||0)+1;s.stats.lastAction='signal-to-tag';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsToast('Signal moved to Tag • '+k);xsShowHub(true);return true}
  function xsAddSignalToGoal(tag){const s=xsLoad(),terms=xsNorm(tag);if(!terms)return;const current=xsNorm(s.goal),tokens=new Set(xsTokens(current,36));const add=xsTokens(terms,8).filter(t=>!tokens.has(t));if(!add.length){xsToast('Signal already in Goal • signal score is not double-counted');return}s.goal=((s.goal||'').trim()+' '+add.join(' ')).trim();s.stats.goalEdits++;s.stats.lastAction='signal-to-goal';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsToast('Signal promoted to Goal • duplicate signal weight paused')}
  function xsSetSiteRule(domain,mode){const s=xsLoad(),d=xsSiteKey(domain);if(!d)return false;s.siteRules=s.siteRules.filter(r=>!xsSameSite(r.domain,d));if(mode==='only')s.siteRules=s.siteRules.filter(r=>r.mode!=='only');if(['more','only','less','none'].includes(mode))s.siteRules.push({domain:d,mode,at:Date.now()});s.stats.siteChanges++;s.stats.lastAction='site-'+(mode||'clear');s.stats.lastAt=Date.now();xsSave();if(xsHasTarget(s))xsApplyAll('user');else xsRestoreAll();xsToast(mode==='more'?'More from '+d:mode==='only'?'Only '+d+' • fetching site candidates':mode==='less'?'Less from '+d:mode==='none'?'None from '+d:'Site rule cleared');if(mode==='only')setTimeout(()=>xsNavigateRetrieval('site-only'),140);return true}
  function xsClearSignals(){const s=xsLoad();s.signals=[];s.suppressedSignals=[];s.stats.clears++;s.stats.lastAction='clear-signals';xsSave();if(xsHasTarget(s))xsApplyAll('user');else xsRestoreAll();xsShowHub(true)}
  function xsClearAll(){const s=xsLoad();s.feedback=[];s.signals=[];s.manualTags=[];s.suppressedSignals=[];s.suppressedTags=[];s.registeredSites=[];s.siteRules=[];s.goal=s.baseQuery;s.mediaIntent='gif';s.retrieval.retrievalOutcomes=[];s.retrieval.lastCoverageGap=0;s.retrieval.lastCoverageGapTerm='';s.retrieval.lastDecisionDelta=null;s.stats.clears++;s.stats.lastAction='clear-all';xsSave();xsRestoreAll();xsShowHub(true)}
  function xsNewSearch(){const s=xsLoad();s.stats.newSearches++;xsClearNavTxn(s);xsSave();try{const u=new URL(location.href);u.pathname='/imghp';u.search='';u.hash='';location.assign(u.toString())}catch(_){location.assign('https://www.google.com/imghp')}}
  function xsFeedbackLabel(f){const t=(f.title||f.tokens?.slice(0,4).join(' ')||'selected image').slice(0,42),m=f.mediaType==='gif'?'GIF':f.mediaType==='image'?'IMG':'?';return (f.type==='more'?'+ ':'− ')+m+' · '+t}
  function xsSiteLabel(r){return r.mode==='more'?'↑ '+r.domain:r.mode==='only'?'ONLY '+r.domain:r.mode==='less'?'↓ '+r.domain:'NONE '+r.domain}
  function xsCloseOverlay(){document.getElementById(XS_OVERLAY)?.remove()}
  function xsShowSiteOptions(domain){const d=String(domain||'');if(!d){xsToast('Site unavailable for this result');return}const s=xsLoad(),current=xsSiteRule(s,d)?.mode||'',o=document.createElement('div');xsCloseOverlay();o.id=XS_OVERLAY;o.dataset.kind='site';o.innerHTML='<div class="xrf-sheet xrf-card-menu"><div class="xrf-head"><div><div class="xrf-title">Site control</div><div class="xrf-sub" data-xs-domain></div></div><button class="xrf-close" type="button">×</button></div><div class="xrf-help">Soft controls change ranking. ONLY filters locally and re-searches Google for that site. NONE blocks locally and future re-searches exclude that site.</div><div class="xrf-site-grid"><button data-mode="more">MORE FROM SITE<small>soft boost</small></button><button data-mode="only">ONLY THIS SITE<small>hard local filter</small></button><button data-mode="less">LESS FROM SITE<small>soft demotion</small></button><button data-mode="none">NONE FROM SITE<small>hard local block</small></button></div><button class="xrf-fresh" data-mode="">CLEAR SITE RULE</button></div>';o.querySelector('[data-xs-domain]').textContent=d+(current?' • current: '+current.toUpperCase():'');o.querySelector('.xrf-close').onclick=xsCloseOverlay;o.querySelectorAll('[data-mode]').forEach(b=>{if(b.dataset.mode===current)b.dataset.active='1';b.onclick=()=>{xsSetSiteRule(d,b.dataset.mode);xsShowHub()}});document.documentElement.appendChild(o)}
  function xsShowQuick(card){if(!card?.isConnected)return;if(!xsIndexReady)xsRebuildIndex('initial');xsCloseOverlay();xsQuickOpens++;const m=xsMeta(card),s=xsLoad(),o=document.createElement('div');o.id=XS_OVERLAY;o.dataset.kind='quick';const media=m.mediaType==='gif'?'GIF':m.mediaType==='image'?'IMAGE':'UNKNOWN';o.innerHTML='<div class="xrf-sheet xrf-card-menu"><div class="xrf-head"><div><div class="xrf-title">XSearch</div><div class="xrf-sub">Example '+media+' • anchors '+s.feedback.length+'/'+XS_MAX+'</div></div><button class="xrf-close" type="button">×</button></div><div class="xrf-preview"><img alt=""><div><b></b><small></small></div></div><div class="xrf-train-grid xrf-quick-grid"><button class="xrf-more" data-xs-act="more">MORE LIKE THIS</button><button class="xrf-less" data-xs-act="less">LESS LIKE THIS</button><button class="xrf-siteyes xrf-sitewide" data-xs-site>SITE OPTIONS</button></div></div>';const im=o.querySelector('.xrf-preview img'),src=mainImage(card)?.currentSrc||mainImage(card)?.src||'';if(src)im.src=src;o.querySelector('.xrf-preview b').textContent=(m.title||'Selected result').slice(0,80);o.querySelector('.xrf-preview small').textContent=media+' '+Math.round((m.mediaConfidence||0)*100)+'% • '+(m.domain||'Site unavailable');o.querySelector('.xrf-close').onclick=xsCloseOverlay;o.querySelector('[data-xs-site]').disabled=!m.domain;o.querySelector('[data-xs-site]').onclick=()=>{if(m.domain)xsShowSiteOptions(m.domain)};for(const b of o.querySelectorAll('[data-xs-act]'))b.onclick=()=>{if(xsRecord(card,b.dataset.xsAct))xsCloseOverlay()};document.documentElement.appendChild(o)}
  function xsRenderFeedback(box,list){box.innerHTML='';if(!list.length){box.innerHTML='<span class="xrf-basket-empty">None yet</span>';return}for(const f of list){const b=document.createElement('button');b.type='button';b.className='xrf-bchip '+(f.type==='more'?'more':'less');b.innerHTML='<span></span><i>×</i>';b.querySelector('span').textContent=xsFeedbackLabel(f);b.title='Remove image anchor; learned signals are kept';b.onclick=()=>xsRemoveFeedback(f.id);box.appendChild(b)}}
  function xsRenderSites(box,rules,registered=[]){box.innerHTML='';const ruled=new Set((rules||[]).map(r=>xsSiteKey(r.domain)));for(const r of rules||[]){const b=document.createElement('button');b.type='button';b.className='xrf-bchip '+(r.mode==='more'||r.mode==='only'?'siteyes':'siteno');b.innerHTML='<span></span><i>›</i>';b.querySelector('span').textContent=xsSiteLabel(r);b.onclick=()=>xsShowSiteOptions(r.domain);box.appendChild(b)}for(const r of (registered||[]).filter(x=>!ruled.has(xsSiteKey(x.domain))).sort((a,b)=>(b.total||0)-(a.total||0)).slice(0,12)){const b=document.createElement('button');b.type='button';b.className='xrf-bchip';b.innerHTML='<span></span><i>›</i>';b.querySelector('span').textContent='• '+r.domain+' ('+(r.more||0)+'+/'+(r.less||0)+'−)';b.title='Registered from image choices • neutral until you set a site rule';b.onclick=()=>xsShowSiteOptions(r.domain);box.appendChild(b)}if(!box.children.length)box.innerHTML='<span class="xrf-basket-empty">None yet</span>'}
  function xsShowSignalEditor(tag=''){const s=xsLoad(),key=xsNorm(tag),sig=s.signals.find(x=>x.tag===key),o=document.createElement('div');xsCloseOverlay();o.id=XS_OVERLAY;o.dataset.kind='signal';o.innerHTML='<div class="xrf-sheet xrf-card-menu"><div class="xrf-head"><div><div class="xrf-title">Signal</div><div class="xrf-sub">Fine tune local ranking • −10 to +10</div></div><button class="xrf-close" type="button">×</button></div><div class="xrf-section"><div class="xrf-label">Signal</div><input class="xrf-text" data-xs-signal autocomplete="off" maxlength="60"><div class="xrf-signal-weight"><span>AVOID</span><input type="range" min="-10" max="10" step="0.5" data-xs-weight><span>PREFER</span></div><div class="xrf-querybox generated" data-xs-weight-label></div><div class="xrf-help" data-xs-origin></div></div><div class="xrf-clearrow"><button type="button" data-xs-save>SAVE</button><button type="button" data-xs-demote>MOVE TO TAG</button><button type="button" data-xs-goal>PROMOTE TO GOAL</button><button type="button" class="danger" data-xs-delete>DELETE</button><button type="button" data-xs-cancel>CANCEL</button></div></div>';const input=o.querySelector('[data-xs-signal]'),range=o.querySelector('[data-xs-weight]'),label=o.querySelector('[data-xs-weight-label]');input.value=sig?.tag||'';range.value=String(sig?.weight??5);const refresh=()=>{const v=Number(range.value);label.textContent=(v>0?'Prefer +':v<0?'Avoid ':'Neutral ')+v.toFixed(1)};range.oninput=refresh;refresh();o.querySelector('[data-xs-origin]').textContent=sig?'Source: '+(sig.source||'learned')+(sig.learnedHits?' • learned confirmations '+sig.learnedHits:''):'Manual signal';o.querySelector('.xrf-close').onclick=xsShowHub;o.querySelector('[data-xs-cancel]').onclick=xsShowHub;o.querySelector('[data-xs-save]').onclick=()=>{if(xsSaveSignal(sig?.tag||'',input.value,Number(range.value)))xsShowHub()};o.querySelector('[data-xs-goal]').onclick=()=>{const v=input.value.trim();if(v){xsAddSignalToGoal(v);xsShowHub()}};const dem=o.querySelector('[data-xs-demote]');dem.disabled=!sig;dem.onclick=()=>{if(sig)xsDemoteSignalToTag(sig.tag)};const del=o.querySelector('[data-xs-delete]');del.disabled=!sig;del.onclick=()=>{if(sig)xsDeleteSignal(sig.tag)};document.documentElement.appendChild(o);setTimeout(()=>input.focus(),20)}
  function xsShowHub(preserveScroll=false){const prev=document.getElementById(XS_OVERLAY);let st=0;if(preserveScroll)st=prev?.querySelector('.xrf-sheet')?.scrollTop||0;xsCloseOverlay();xsHubOpens++;const s=xsLoad(),signals=xsDerivedSignals(s),tags=xsDerivedTags(s),eff=xsEffectiveMedia(s),health=xsCorpusHealth(null,s),o=document.createElement('div');o.id=XS_OVERLAY;o.dataset.kind='hub';o.innerHTML='<div class="xrf-sheet xrf-main-panel'+(xsHubExpanded?' xrf-expanded':'')+'"><div class="xrf-head"><div><div class="xrf-title">XSearch Quality</div><div class="xrf-sub">Goal retrieves • Signals guide • Tags observe</div></div><button class="xrf-expand" type="button" data-xs-expand>'+(xsHubExpanded?'COLLAPSE':'EXPAND')+'</button><button class="xrf-close" type="button">×</button></div><div class="xrf-section"><div class="xrf-basket-head"><b>Goal</b><small data-xs-count></small></div><div class="xrf-origin-note" data-xs-base></div><div class="xrf-goal-row"><input class="xrf-text" data-xs-goal autocomplete="off" maxlength="180"><button type="button" data-xs-goal-apply>APPLY</button></div><div class="xrf-help">APPLY reranks immediately and retrieves results for this Goal. XSearch keeps the visible Google search box on your Original search.</div></div><div class="xrf-section"><div class="xrf-basket-head"><b>Media · GIF ONLY</b><small data-xs-media-note></small></div><div class="xrf-seg"><button type="button" data-xs-media="gif">GIF</button></div><div class="xrf-health"><span>Corpus <b data-xs-health></b></span><span data-xs-health-detail></span></div><div class="xrf-target-actions"><button type="button" data-xs-findmore>FIND MORE</button><button type="button" data-xs-variants>FIND VARIATIONS</button><button type="button" data-xs-research>RE-SEARCH</button><button type="button" class="complete" data-xs-complete>COMPLETE REFRESH</button><button type="button" class="next-batch" data-xs-next-batch>LOAD NEW RESULTS</button><button type="button" class="exact" data-xs-exact>FIND EXACT RESULTS</button></div><div class="xrf-origin-note">FIND VARIATIONS retrieves new title-related GIF candidates from Google (not guaranteed visual matches). FIND MORE reshuffles only loaded results and targets 80% top-window change. RE-SEARCH changes retrieval direction from learned intent. COMPLETE REFRESH keeps the same query direction and requests a replacement batch, preferring different results without leaving a blank grid. LOAD NEW RESULTS harvests up to 100 additional results in the same Google search without a fragile page offset; if exhausted the current page stays. FIND EXACT RESULTS searches for exact Goal words and confirmed Signals, then prioritizes Goal coverage.</div><div class="xrf-basket-head" style="margin-top:10px"><b>Auto retrieval</b><small>choices stay manual in stabilized flow</small></div><div class="xrf-strength"><button type="button" data-xs-auto="1">ON</button><button type="button" data-xs-auto="0">MANUAL</button></div><div class="xrf-basket-head" style="margin-top:10px"><b>Result Memory</b><small>separate from saved Anchors, Signals, Tags and Goal</small></div><div class="xrf-strength"><button type="button" data-xs-memory="auto">AUTO</button><button type="button" data-xs-memory="manual">MANUAL</button><button type="button" data-xs-memory="open">OPEN</button></div><div class="xrf-origin-note" data-xs-memory-note></div><button type="button" class="xrf-fresh" data-xs-save-results style="display:none">SAVE CURRENT BATCH</button><div class="xrf-engine-note" data-xs-engine></div></div><div class="xrf-section"><div class="xrf-basket-head"><b>Signals</b><small>important • editable • × suppresses relearning</small></div><div class="xrf-basket" data-xs-signals></div><button class="xrf-fresh" data-xs-add-signal>+ ADD SIGNAL</button><div class="xrf-basket-head" style="margin-top:10px"><b>Image anchors</b><small>examples • every choice teaches • max 10</small></div><div class="xrf-basket" data-xs-images></div></div><div class="xrf-section"><div class="xrf-basket-head"><b>Sites</b><small>more / only / less / none</small></div><div class="xrf-basket" data-xs-sites></div></div><div class="xrf-section"><div class="xrf-label">Ranking strength</div><div class="xrf-strength"><button type="button" data-xs-strength="balanced">BALANCED</button><button type="button" data-xs-strength="strong">STRONG</button><button type="button" data-xs-strength="aggressive">AGGRESSIVE</button></div></div><div class="xrf-section"><div class="xrf-basket-head"><b>Results</b><small>global corpus</small></div><div class="xrf-querybox generated" data-xs-results></div><div class="xrf-origin-note" data-xs-retrieval-query></div></div><div class="xrf-clearrow"><button type="button" data-xs-goal-reset>RESET GOAL</button><button type="button" data-xs-clear-signals>CLEAR SIGNALS</button><button type="button" class="danger" data-xs-clear-all>CLEAR TARGET</button><button type="button" data-xs-new>NEW SEARCH</button></div><div class="xrf-section"><button class="xrf-fresh" type="button" data-xs-diag>DIAGNOSTIC</button><details class="xrf-tag-details" data-xs-tag-details><summary><span>TAGS</span><small data-xs-tag-count></small></summary><div class="xrf-tag-body"><div class="xrf-basket" data-xs-tags></div><div class="xrf-origin-note">Automatic observations • low authority. ↑ promotes to Signal • × deletes and suppresses the Tag. A Signal can be moved back here from its editor.</div></div></details></div></div>';const sheet=o.querySelector('.xrf-main-panel');o.querySelector('.xrf-close').onclick=xsCloseOverlay;o.querySelector('[data-xs-expand]').onclick=()=>{xsHubExpanded=!xsHubExpanded;sheet.classList.toggle('xrf-expanded',xsHubExpanded);o.querySelector('[data-xs-expand]').textContent=xsHubExpanded?'COLLAPSE':'EXPAND'};o.querySelector('[data-xs-count]').textContent='anchors '+s.feedback.length+'/'+XS_MAX;o.querySelector('[data-xs-base]').textContent='Google search stays: '+(s.baseQuery||'(none)');o.querySelector('[data-xs-retrieval-query]').textContent='XSearch retrieval target: '+(s.retrievalQuery||xsCurrentQuery()||'(none)');const goal=o.querySelector('[data-xs-goal]');goal.value=s.goal||s.baseQuery||'';o.querySelector('[data-xs-goal-apply]').onclick=()=>{xsCloseOverlay();xsApplyGoal(goal.value)};goal.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();xsCloseOverlay();xsApplyGoal(goal.value)}});o.querySelector('[data-xs-goal-reset]').onclick=()=>{xsSetGoal(s.baseQuery);xsShowHub(true)};o.querySelector('[data-xs-media-note]').textContent=s.mediaIntent==='auto'?(eff.type==='mixed'?'neutral':('lean '+eff.type.toUpperCase()+' • '+Math.round(eff.confidence*100)+'%')):s.mediaIntent.toUpperCase()+' hard';o.querySelectorAll('[data-xs-media]').forEach(b=>{b.dataset.active=b.dataset.xsMedia===s.mediaIntent?'1':'0';b.onclick=()=>{if(xsSetMediaIntent(b.dataset.xsMedia)&&b.dataset.xsMedia==='auto')xsShowHub(true)}});const hb=o.querySelector('[data-xs-health]');hb.textContent=health.status.toUpperCase();hb.dataset.health=health.status;o.querySelector('[data-xs-health-detail]').textContent=health.unique+' unique • '+health.strong+' goal-strong • '+health.reason;o.querySelector('[data-xs-engine]').textContent='Quality: choice Signals • editable Tags • IDF '+(s.flags.idf?'ON':'OFF')+' • diversity '+(s.flags.diversity?'ON':'OFF')+' • '+signals.length+' signals • '+tags.length+' tags';o.querySelectorAll('[data-xs-auto]').forEach(b=>{b.dataset.active=(b.dataset.xsAuto==='1')===s.autoRetrieve?'1':'0';b.onclick=()=>{xsSetAutoRetrieve(b.dataset.xsAuto==='1');xsShowHub(true)}});o.querySelectorAll('[data-xs-memory]').forEach(b=>{b.dataset.active=b.dataset.xsMemory===s.resultMemoryMode?'1':'0';b.onclick=()=>{xsSetResultMemory(b.dataset.xsMemory);xsShowHub(true)}});o.querySelector('[data-xs-memory-note]').textContent=s.resultMemoryMode==='open'?'OPEN • no result history, obey the selected button':s.resultMemoryMode==='manual'?'MANUAL • remember only batches you explicitly save':'AUTO • remember result identities automatically';const saveBatch=o.querySelector('[data-xs-save-results]');saveBatch.style.display=s.resultMemoryMode==='manual'?'block':'none';saveBatch.onclick=()=>{xsSaveResultBatch();xsShowHub(true)};o.querySelector('[data-xs-findmore]').onclick=()=>{xsCloseOverlay();xsFindMore('manual')};o.querySelector('[data-xs-variants]').onclick=()=>{xsCloseOverlay();xsFindVariations()};o.querySelector('[data-xs-research]').onclick=()=>xsNavigateRetrieval('research');o.querySelector('[data-xs-complete]').onclick=()=>xsCompleteRefresh();o.querySelector('[data-xs-next-batch]').onclick=()=>xsLoadNewResults();o.querySelector('[data-xs-exact]').onclick=()=>xsFindExactResults();const sig=o.querySelector('[data-xs-signals]');sig.innerHTML='';if(!signals.length)sig.innerHTML='<span class="xrf-basket-empty">No Signals yet • each new MORE/LESS choice creates or reinforces at least one Signal</span>';for(const x of signals){const row=document.createElement('span');row.className='xrf-signal-chip '+(x.weight>=0?'more':'less');const edit=document.createElement('button');edit.type='button';edit.className='xrf-signal-main';edit.innerHTML='<span></span><i></i>';edit.querySelector('span').textContent=x.tag;edit.querySelector('i').textContent=x.inGoal?'GOAL':((x.weight>=0?'+':'')+x.weight);edit.title=x.inGoal?'In Goal • separate signal score paused':'Edit signal and weight';edit.onclick=()=>xsShowSignalEditor(x.tag);const del=document.createElement('button');del.type='button';del.className='xrf-signal-delete';del.textContent='×';del.title='Delete only this signal';del.onclick=e=>{e.preventDefault();e.stopPropagation();xsDeleteSignal(x.tag)};row.append(edit,del);sig.appendChild(row)}o.querySelector('[data-xs-add-signal]').onclick=()=>xsShowSignalEditor('');xsRenderFeedback(o.querySelector('[data-xs-images]'),s.feedback);xsRenderSites(o.querySelector('[data-xs-sites]'),s.siteRules,s.registeredSites||[]);o.querySelectorAll('[data-xs-strength]').forEach(b=>{b.dataset.active=b.dataset.xsStrength===s.strength?'1':'0';b.onclick=()=>{s.strength=b.dataset.xsStrength;s.stats.lastAction='strength';s.stats.lastAt=Date.now();xsSave();xsApplyAll('user');xsShowHub(true)}});o.querySelector('[data-xs-results]').textContent=`${xsIndexedCards} DOM • ${xsUniqueResults} unique • ${xsMediaCounts.gif||0} GIF • ${xsMediaCounts.image||0} image • ${xsMediaCounts.unknown||0} unknown • ${xsLastDiag.duplicatesHidden||0} duplicates hidden`;const tagDetails=o.querySelector('[data-xs-tag-details]');tagDetails.open=xsTagsExpanded;tagDetails.addEventListener('toggle',()=>{xsTagsExpanded=tagDetails.open});o.querySelector('[data-xs-tag-count]').textContent=tags.length+' observed';const tagBox=o.querySelector('[data-xs-tags]');tagBox.innerHTML='';if(!tags.length)tagBox.innerHTML='<span class="xrf-basket-empty">No tags yet</span>';for(const t of tags.slice(0,18)){const chip=document.createElement('span');chip.className='xrf-signal-chip '+(t.score>=0?'more':'less');const main=document.createElement('button');main.type='button';main.className='xrf-signal-main';main.innerHTML='<span></span><i></i>';main.querySelector('span').textContent=(t.score>=0?'+ ':'− ')+t.tag;main.querySelector('i').textContent=t.manual?'MANUAL':((t.consensus?'C':'T')+t.support);main.title=(t.manual?'Manual Tag':t.consensus?'Consensus Tag':'Observed Tag')+' • low-authority score '+t.score;const promote=document.createElement('button');promote.type='button';promote.className='xrf-signal-delete';promote.textContent='↑';promote.title='Promote Tag to Signal';promote.onclick=e=>{e.preventDefault();e.stopPropagation();xsPromoteTagToSignal(t.tag)};const del=document.createElement('button');del.type='button';del.className='xrf-signal-delete';del.textContent='×';del.title='Delete Tag and suppress automatic regeneration';del.onclick=e=>{e.preventDefault();e.stopPropagation();xsDeleteTag(t.tag)};main.onclick=()=>xsPromoteTagToSignal(t.tag);chip.append(main,promote,del);tagBox.appendChild(chip)}o.querySelector('[data-xs-clear-signals]').onclick=xsClearSignals;o.querySelector('[data-xs-clear-all]').onclick=xsClearAll;o.querySelector('[data-xs-new]').onclick=xsNewSearch;o.querySelector('[data-xs-diag]').onclick=()=>{xsCloseOverlay();setTimeout(showDiagnostic,0)};document.documentElement.appendChild(o);if(st)sheet.scrollTop=st}
  function xsInstallTrainer(){
    if(xsTrainerInstalled)return;xsTrainerInstalled=true;
    let press=null,blockedCard=null,lastOpenedCard=null;
    const input={touches:0,holds:0,contexts:0,nativeRequests:0,nativeHandled:0,nativeDeclined:0,nativeReused:0,movesCancelled:0,uiClicksAllowed:0,ghostClicksBlocked:0,openErrors:0};
    window.__xgridUcInteractionDebug=()=>({...input});
    const elementFrom=e=>e.target?.nodeType===1?e.target:e.target?.parentElement;
    const own=el=>!!el?.closest?.('#'+ID+',#'+XS_OVERLAY+',#__xgridpro_diag_overlay__');
    const cardFrom=e=>{const el=elementFrom(e),card=el?.closest?.('.'+IMAGE_ONLY);return !card||card.dataset?.[XS_FILTER_ATTR]==='1'||!card.closest?.('.'+WALL)||own(el)?null:card};
    const cancel=()=>{if(xsLongTimer){clearTimeout(xsLongTimer);xsLongTimer=0}xsLongCard=null};
    const open=card=>{
      if(!card?.isConnected||card.dataset?.[XS_FILTER_ATTR]==='1')return false;
      if(card===lastOpenedCard&&document.getElementById(XS_OVERLAY)?.dataset.kind==='quick')return true;
      cancel();blockedCard=card;xsBlockClickUntil=Date.now()+900;
      try{xsShowQuick(card);const opened=document.getElementById(XS_OVERLAY)?.dataset.kind==='quick';if(opened){lastOpenedCard=card;if(press?.card===card)press.opened=true}return !!opened}catch(_){input.openErrors++;return false}
    };
    // UC can cancel the DOM touch stream before its native long-click callback.
    // Keep the last card briefly, independently of the cancelled JS hold timer.
    window.__xgridUcOpenImageMenu=(source,deadline)=>{
      input.nativeRequests++;
      const decline=()=>{input.nativeDeclined++;return false};
      if(!isGoogleImages()||!Number.isFinite(Number(deadline))||Date.now()>Number(deadline))return decline();
      const recent=press&&Date.now()-press.at<=3000;
      if(recent&&(press.excluded||press.moved||press.multi))return decline();
      if(recent&&press.card?.isConnected){
        if(press.opened){input.nativeReused++;input.nativeHandled++;return true}
        if(open(press.card)){input.nativeHandled++;return true}
        return decline();
      }
      // If UC withheld touchstart, use only an unambiguous exact result URL.
      const url=String(source||'');if(!url)return decline();
      let found=null;
      for(const card of document.querySelectorAll('.'+WALL+' .'+IMAGE_ONLY)){
        if(card.dataset?.[XS_FILTER_ATTR]==='1')continue;
        const img=mainImage(card),meta=xsMeta(card);
        if(![img?.currentSrc,img?.src,meta.imageUrl,meta.sourceUrl].some(x=>x&&x===url))continue;
        if(found&&found!==card)return decline();found=card;
      }
      if(found&&open(found)){input.nativeHandled++;return true}
      return decline();
    };
    document.addEventListener('touchstart',e=>{
      cancel();const c=cardFrom(e),t=e.touches?.[0];
      press={card:c,at:Date.now(),excluded:own(elementFrom(e)),multi:e.touches?.length!==1,moved:false,opened:false};
      if(!c||!t||press.multi)return;
      input.touches++;xsLongCard=c;xsLongX=t.clientX;xsLongY=t.clientY;
      xsLongTimer=setTimeout(()=>{xsLongTimer=0;const cc=xsLongCard;xsLongCard=null;if(cc?.isConnected&&!press?.moved&&!press?.multi&&open(cc))input.holds++},620);
    },{capture:true,passive:true});
    document.addEventListener('touchmove',e=>{
      const t=e.touches?.[0];
      if(press&&(!t||e.touches?.length!==1||Math.hypot(t.clientX-xsLongX,t.clientY-xsLongY)>14)){
        if(!press.moved)input.movesCancelled++;press.moved=true;cancel();
      }
    },{capture:true,passive:true});
    document.addEventListener('touchend',cancel,{capture:true,passive:true});
    document.addEventListener('touchcancel',cancel,{capture:true,passive:true});
    document.addEventListener('contextmenu',e=>{const c=cardFrom(e);if(!c)return;e.preventDefault();cancel();if(open(c))input.contexts++},{capture:true});
    document.addEventListener('click',e=>{
      if(own(elementFrom(e))){input.uiClicksAllowed++;return}
      if(Date.now()<xsBlockClickUntil&&cardFrom(e)===blockedCard){input.ghostClicksBlocked++;e.preventDefault();e.stopImmediatePropagation()}
    },true);
  }
  function xsInstallObserver(){if(xsInstallObserver.mo||!document.body)return;xsInstallObserver.mo=new MutationObserver(rs=>{let metadata=false,newCandidate=false;for(const r of rs){if(r.target?.nodeType===1&&r.target.dataset?.xgridSearchBusy==='1'){xsSelfMutationsIgnored++;continue}for(const n of r.addedNodes||[]){if(n.nodeType!==1||n.id===XS_OVERLAY||n.closest?.('#'+XS_OVERLAY)||n.parentElement?.dataset?.xgridSearchBusy==='1'){xsSelfMutationsIgnored++;continue}if(n.tagName==='SCRIPT'&&(n.textContent||'').includes('var m')&&xsNeedsStructuredEnrichment())metadata=true;if((n.classList?.contains(IMAGE_ONLY)&&!xsKnownCard(n))||[...n.querySelectorAll?.('.'+IMAGE_ONLY)||[]].some(c=>!xsKnownCard(c)))newCandidate=true}if(newCandidate)break}if(newCandidate||metadata){xsMutationTriggers++;if(xsRetrievalQuiet){xsQuietNeedsIndex=true;xsQuietMutationCandidates++;return}xsScheduleIndex(metadata&&!newCandidate?90:65,metadata&&!newCandidate?'metadata':'google')}});xsInstallObserver.mo.observe(document.body,{childList:true,subtree:true})}
  function xsPercent(n,d){return d?Math.round(n*100/d):0}
  function xsDebug(){xsRepairIndexIntegrity();const s=xsLoad(),g=xsFeedbackGroups(s),sites=xsSiteGroups(s),signals=xsDerivedSignals(s),tags=xsDerivedTags(s),ctx=xsFeedbackContext(s),st=s.stats||xsStats(),d=xsLastDiag,total=xsCoverage.total||0,eff=xsEffectiveMedia(s),rt=s.retrieval||{},health=xsCorpusHealth(null,s),top10Decisions=(st.top10More||0)+(st.top10Less||0);return {version:'XSearch Result Memory + FastPath GIF v28.3.4',baseQuery:s.baseQuery,retrievalQuery:s.retrievalQuery,goal:s.goal,mediaIntent:s.mediaIntent,effectiveMedia:eff.type,mediaConfidence:Number((eff.confidence||0).toFixed(2)),autoRetrieve:s.autoRetrieve,resultMemoryMode:s.resultMemoryMode,buttonOutcomes:s.retrieval?.buttonOutcomes||{},flags:s.flags,feedbackCount:s.feedback.length,feedbackMax:XS_MAX,strength:s.strength,more:g.pos.length,less:g.neg.length,preferredSites:sites.more,onlySites:sites.only,lessSites:sites.less,blockedSites:sites.none,signals,signalCount:signals.length,tags,tagCount:tags.length,positiveConsensusTerms:Object.keys(ctx.posConsensus||{}).length,negativeConsensusTerms:Object.keys(ctx.negConsensus||{}).length,suppressedSignals:s.suppressedSignals||[],suppressedTags:s.suppressedTags||[],registeredSites:(s.registeredSites||[]).map(x=>({domain:x.domain,more:x.more||0,less:x.less||0,total:x.total||0})),stats:st,top10More:st.top10More||0,top10Less:st.top10Less||0,outside10More:st.outside10More||0,outside10Less:st.outside10Less||0,top10Approval:top10Decisions?Number(((st.top10More||0)/top10Decisions*100).toFixed(1)):0,quickOpens:xsQuickOpens,hubOpens:xsHubOpens,capBlocks:xsCapBlocks,manualQueryResets:xsManualQueryResets,manualQueryRebases:xsManualQueryRebases,searchSessionId:s.searchSession?.id||'',sessionNavSeq:s.searchSession?.navSeq||0,sessionPreservedNavigations:s.searchSession?.preservedNavigations||0,sessionRejectedNavigations:s.searchSession?.rejectedNavigations||0,pendingNavigation:!!s.pendingNavigation,pendingNavigationKind:s.pendingNavigation?.kind||'',pendingNavigationMarker:s.pendingNavigation?.marker||'',mutationTriggers:xsMutationTriggers,selfMutationsIgnored:xsSelfMutationsIgnored,retrievalBatches:rt.batches||1,retrievalSearches:rt.searches||0,retrievalFindMore:rt.findMore||0,retrievalFindMoreGrowth:rt.findMoreGrowth||0,retrievalResearches:rt.researches||0,retrievalAuto:rt.auto||0,retrievalPhase:xsRetrievalPhase,retrievalQuietEntries:xsQuietEntries,retrievalQuietWatchdogTrips:xsQuietWatchdogTrips,retrievalQuietMs:Number((xsQuietMs+(xsRetrievalQuiet&&xsQuietSince?performance.now()-xsQuietSince:0)).toFixed(1)),retrievalQuietMutations:xsQuietMutationCandidates,lastRetrievalGrowth:rt.lastGrowth||0,lastNoveltyCount:rt.lastNoveltyCount||0,lastNoveltyRatio:rt.lastNoveltyRatio||0,lastOverlapCount:rt.lastOverlapCount||0,retrievalPlannerSlot:rt.plannerSlot||0,retrievalQueryHistory:(rt.queryHistory||[]).length,lastRetrievalReason:rt.lastReason||'',lastRetrievalKind:rt.lastKind||'initial',lastRetrievalQuery:rt.lastQuery||s.retrievalQuery,lastRetrievalMedia:rt.lastMedia||eff.type,health,backgroundRequests:0,backgroundSuccess:0,backgroundResults:0,zeroResultBatches:0,indexBuilds:xsIndexBuilds,fullIndexBuilds:xsFullIndexBuilds,incrementalPasses:xsIncrementalPasses,newCardsIndexed:xsNewCardsIndexed,stalePruned:xsStalePruned,indexedCards:xsIndexedCards,uniqueResults:xsUniqueResults,identityRecords:xsResultIndex.size,structuredEntries:xsStructuredEntries,uniqueDomains:d.uniqueDomains||0,mediaCounts:xsMediaCounts,coverage:{title:xsPercent(xsCoverage.title,total),domain:xsPercent(xsCoverage.domain,total),source:xsPercent(xsCoverage.source,total),image:xsPercent(xsCoverage.image,total),dims:xsPercent(xsCoverage.dims,total),animation:xsPercent(xsCoverage.animation,total)},domainSources:{wjd:xsDomainWjd,dom:xsDomainDom,image:xsDomainImage,unresolved:xsDomainUnknown},vocabulary:xsVocabulary,avgTags:Number(xsAvgTags.toFixed(1)),idfDocs:xsCorpusDocs,idfTerms:xsIdf.size,indexEpoch:xsIndexEpoch,indexCommittedEpoch:xsIndexCommittedEpoch,indexKey:xsIndexKey,indexResets:xsIndexResets,indexIntegrityRepairs:xsIndexIntegrityRepairs,indexReady:xsIndexReady,indexMs:Number(xsIndexMs.toFixed(2)),indexMax:Number(xsIndexMax.toFixed(2)),reranks:xsReranks,userReranks:xsUserReranks,googleReranks:xsGoogleReranks,initialReranks:xsInitialReranks,duplicateRankSchedules:xsDuplicateRankSchedules,lastRankReason:xsLastRankReason,cardsRanked:xsCardsRanked,restores:xsRestores,reorderTransactions:xsReorderTransactions,reorderMovedNodes:xsReorderMovedNodes,anchorPreserved:xsAnchorPreserved,rankMs:Number(xsRankMs.toFixed(2)),rankMax:Number(xsRankMax.toFixed(2)),domReorderMs:Number(xsDomReorderMs.toFixed(2)),domReorderMax:Number(xsDomReorderMax.toFixed(2)),rankingMode:xsRankingMode,cards:d.cards||0,filtered:d.filtered||0,duplicatesHidden:d.duplicatesHidden||0,top10Changed:d.top10Changed||0,moved:d.moved||0,avgMove:Number((d.avgMove||0).toFixed(1)),maxMove:d.maxMove||0,scoreMin:Number((d.scoreMin||0).toFixed(2)),scoreMedian:Number((d.scoreMedian||0).toFixed(2)),scoreAvg:Number((d.scoreAvg||0).toFixed(2)),scoreMax:Number((d.scoreMax||0).toFixed(2)),blockedLeakage:d.blockedLeakage||0,positiveTop10:d.positiveTop10||0,top:d.top||[],globalRanking:true,visualMode:'native-subject-pose-flow-v3-accuracy',nativeVision:xsNativeDebug(),pixelReads:xsVisualAttempts,visualFeatures:xsVisualFeaturesCount,visualSuccess:xsVisualSuccess,visualBlocked:xsVisualBlocked,choices:st.choices||0,removals:st.removals||0,manualTags:(s.manualTags||[]).map(x=>({tag:x.tag,score:x.score})),tagPromotions:st.tagsPromoted||0,signalDemotions:st.signalsDemoted||0,goalApplies:st.goalApplies||0,googleSearchDisplayProtected:true,googleSearchBarRestores:xsSearchBarRestores,lastFindMoreOutcome:rt.lastFindMoreOutcome||'',lastFindMoreStart:rt.lastFindMoreStart||0,lastFindMoreHighWater:rt.lastFindMoreHighWater||0,lastFindMoreNetGrowth:rt.lastFindMoreNetGrowth||0,lastFindMorePasses:rt.lastFindMorePasses||0,lastFindMoreBatches:rt.lastFindMoreBatches||0,lastFindMoreViewportRestored:rt.lastFindMoreViewportRestored===true,lastFindMoreDurationMs:rt.lastFindMoreDurationMs||0,lastFindMoreTxnId:rt.lastFindMoreTxnId||'',findMoreDuplicateBlocks:xsFindMoreDuplicateBlocks,findMoreChangeTarget:rt.findMoreChangeTarget??XS_FIND_MORE_CHANGE_TARGET,lastFindMoreChangedCount:rt.lastFindMoreChangedCount||0,lastFindMoreChangedRatio:rt.lastFindMoreChangedRatio||0,lastFindMoreWindow:rt.lastFindMoreWindow||0,researchFreshnessTarget:rt.lastResearchFreshnessTarget||rt.activeFreshnessTarget||0,researchFreshnessAchieved:rt.lastResearchFreshnessAchieved||((d.cards||0)?Number(((d.freshNew||0)/(d.cards||1)).toFixed(3)):0),researchSeenHidden:rt.lastResearchRepeatPruned||d.freshFiltered||rt.lastResearchSeenHidden||0,researchFreshAccepted:rt.lastResearchFreshAccepted||0,researchTargetCards:rt.researchTargetCards||XS_RESEARCH_TARGET_CARDS,researchPasses:rt.researchPasses||0,researchStatus:rt.researchStatus||'',lastResearchPurpose:rt.lastResearchPurpose||'',completeRefreshes:st.completeRefreshes||0,nextBatchActions:st.nextBatchActions||0,nextBatchOffset:rt.nextBatchOffset||0,nextBatchPruned:rt.nextBatchPruned||0,nextBatchQuery:rt.nextBatchQuery||'',nextBatchStatus:rt.nextBatchLastStatus||'',nextBatchBusy:xsNextBatchBusy,exactMode:rt.exactMode===true,exactSearches:st.exactSearches||0,exactQueryUsed:rt.exactMode===true?(rt.lastQuery||''):'',exactTop5GoalHits:(d.top||[]).map(x=>x.queryHits||0),gifPageLimit:XS_GIF_PAGE_LIMIT,lastResearchMode:rt.lastResearchMode||'',lastResearchTerm:rt.lastResearchTerm||'',researchPlannerCandidates:xsResearchTermCandidates(s,5),retrievalPlannerTerm:rt.plannerTerm||'',retrievalPlannerSupport:rt.plannerSupport||0,retrievalActionStartCorpus:rt.actionStartCorpus||0,retrievalPageHighWater:rt.pageHighWater||0,lastPreservedCorpus:rt.lastPreservedCorpus||0,lastUsefulNoveltyCount:rt.lastUsefulNoveltyCount||0,lastUsefulNoveltyRatio:rt.lastUsefulNoveltyRatio||0,lastRetrievalYield:rt.lastRetrievalYield||0,lastDestinationStrong:rt.lastDestinationStrong||0,lastDestinationDomains:rt.lastDestinationDomains||0,retrievalOutcomeCount:(rt.retrievalOutcomes||[]).length,sessionSeenIdentityCount:(rt.seenIdentityHashes||[]).length,freshSeen:d.freshSeen||0,freshNew:d.freshNew||0,lastCoverageGap:rt.lastCoverageGap||0,lastCoverageGapTerm:rt.lastCoverageGapTerm||'',lastDecisionDelta:rt.lastDecisionDelta||null,noveltySettleRuns:xsNoveltySettleRuns}}
  window.__xgridXSearchDebug=xsDebug;
  window.__xgridXSearchSetFlag=(name,value)=>{const s=xsLoad();if(!['idf','diversity','mediaBias','visual','quietRetrieval'].includes(name))return false;s.flags[name]=!!value;xsSave();xsMetaCache=new WeakMap();xsVisualCache=new WeakMap();xsRebuildIndex('metadata');return true};



  function updateControl(){
    const root=document.getElementById(ID);if(!root)return;
    const value=root.querySelector('[data-xgrid-col-value]');if(value)value.textContent=currentCols+'×';
    const gif=root.querySelector('[data-xgrid-gif]'),on=gifEnabled();
    if(gif){gif.textContent='GIF ONLY';gif.dataset.active=on?'1':'0';gif.setAttribute('aria-pressed',on?'true':'false')}
    const search=root.querySelector('[data-xgrid-search]'),xs=xsLoad();if(search){const n=xs.feedback.length;search.textContent=n?'SEARCH '+n:'SEARCH';search.title='XSearch GIF • '+n+'/'+XS_MAX+' GIF anchors';search.dataset.active=n?'1':'0';search.setAttribute('aria-pressed',n?'true':'false')}
  }

  function toggleGif(){
    const next=true;
    if(isGoogleImages()&&!googleGifFilterActive()&&setGoogleGifFilter(true))return;
    try{if(typeof window.__xgridSetGifEnabled==='function')window.__xgridSetGifEnabled(next);else localStorage.setItem(GIF_KEY,next?'1':'0')}catch(_){}
    updateControl()
  }

  function median(values){
    if(!values.length)return 0;
    const a=[...values].sort((x,y)=>x-y),m=Math.floor(a.length/2);
    return a.length%2?a[m]:(a[m-1]+a[m])/2
  }

  function diagnosticText(){
    const de=document.documentElement, body=document.body;
    const walls=[...document.querySelectorAll('.'+WALL)];
    const cards=walls.flatMap(w=>[...w.children].filter(c=>!c.matches?.('script,style,template')));
    const managedCards=cards.filter(c=>c.classList?.contains(IMAGE_ONLY));
    const backedCards=cards.filter(c=>!!mainImage(c));
    const gridImgs=[...new Set(walls.flatMap(w=>[...w.querySelectorAll('img:not(.__xgridpro_live_gif__):not(.__xgridpro_hd_image__)')]))];
    const loaded=gridImgs.filter(i=>i.complete&&i.naturalWidth>0&&i.naturalHeight>0);
    const zeroCards=cards.filter(c=>c.getBoundingClientRect().height<1).length;
    const cardWidths=cards.map(c=>c.getBoundingClientRect().width).filter(v=>v>0);
    const cardHeights=cards.map(c=>c.getBoundingClientRect().height).filter(v=>v>0);
    let aspectMismatch=0,mainLoaded=0,mainMismatch=0,naturalRatios=0,provisionalRatios=0;
    for(const img of loaded){
      const r=img.getBoundingClientRect();
      if(r.width>2&&r.height>2){
        const natural=img.naturalWidth/img.naturalHeight, shown=r.width/r.height;
        if(Number.isFinite(natural)&&natural>0&&Math.abs(shown-natural)/natural>.06)aspectMismatch++
      }
    }
    for(const card of managedCards){
      const img=mainImage(card),ri=wallRatioCache.get(card);if(ri?.quality>=4)naturalRatios++;else provisionalRatios++;
      if(!img?.complete||img.naturalWidth<1||img.naturalHeight<1)continue;mainLoaded++;
      const r=img.getBoundingClientRect();if(r.width>2&&r.height>2){const natural=img.naturalWidth/img.naturalHeight,shown=r.width/r.height;if(Number.isFinite(natural)&&natural>0&&Math.abs(shown-natural)/natural>.06)mainMismatch++}
    }
    let candidateContainers=0;
    try{document.querySelectorAll('main,section,article,div,ul,ol').forEach(c=>{if(isGallery(c))candidateContainers++})}catch(_){}
    let wallOverflow=0;
    const wallLines=walls.slice(0,6).map((w,i)=>{
      const r=w.getBoundingClientRect(),cs=getComputedStyle(w);
      const over=Math.max(0,w.scrollWidth-w.clientWidth); if(over>1)wallOverflow++;
      return `Wall ${i+1}: cards=${[...w.children].length}, top/height=${Math.round(r.top)}/${Math.round(r.height)}px, width=${Math.round(r.width)}px, client/scroll=${w.clientWidth}/${w.scrollWidth}, columns=${cs.columnCount}, gap=${cs.columnGap}, overflow=${Math.round(over)}px`;
    });
    const gifDebug=(typeof window.__xgridGifDebug==='function')?window.__xgridGifDebug():null;
    const hdDebug=(typeof window.__xgridHdDebug==='function')?window.__xgridHdDebug():null;
    const gridDebug=(typeof window.__xgridGridDebug==='function')?window.__xgridGridDebug():null;
    const xsearchDebug=(typeof window.__xgridXSearchDebug==='function')?window.__xgridXSearchDebug():null;
    const lines=[
      'XGrid Yellow v28.3.7 BlueBase Visual Coverage diagnostic',
      `Time: ${new Date().toISOString()}`,
      `Host: ${location.host||'(local)'}`,
      `URL: ${location.href.slice(0,180)}`,
      `Columns target: ${currentCols}`,
      `Grid groups: ${walls.length}`,
      `Gallery candidates now: ${candidateContainers}`,
      `Candidate-backed cards: ${backedCards.length}`,
      `Managed structural cards: ${managedCards.length}`,
      `Grid images: ${gridImgs.length} (${loaded.length} loaded)` ,
      `Hidden branches: ${document.querySelectorAll('.'+HIDE).length}`,
      `Managed path nodes: ${document.querySelectorAll('.'+PATH).length}`,
      `Visible width: ${innerWidth}px`,
      `Page width: ${de.scrollWidth}px (overflow ${Math.max(0,de.scrollWidth-innerWidth)}px)`,
      `Page height: ${Math.max(de.scrollHeight,body?body.scrollHeight:0)}px`,
      `Card width min/median/max: ${cardWidths.length?Math.round(Math.min(...cardWidths)):0}/${Math.round(median(cardWidths))}/${cardWidths.length?Math.round(Math.max(...cardWidths)):0}px`,
      `Card height median: ${Math.round(median(cardHeights))}px`,
      `Zero-height cards: ${zeroCards}`,
      `Skipped non-image children: ${document.querySelectorAll('.'+SKIP).length}`,
      `Nested wall count: ${walls.filter(w=>!!w.parentElement?.closest?.('.'+WALL)).length}`,
      `Loaded image aspect mismatches (>6%): ${aspectMismatch} (all Google img nodes)`,
      `Primary image aspect mismatches (>6%): ${mainMismatch}/${mainLoaded}`,
      `Ratio quality natural/provisional: ${naturalRatios}/${provisionalRatios}`,
      `Walls with horizontal overflow: ${wallOverflow}`,
      `Stable masonry caches: ${walls.filter(w=>wallLayoutCache.has(w)).length}/${walls.length}`,
      `Masonry layouts full/append/partial: ${gridStats.full}/${gridStats.append}/${gridStats.partial}`,
      `Ratio upgrades/repairs/batches: ${gridStats.ratioUpgrades}/${gridStats.ratioRepairs}/${gridStats.repairBatches}`,
      `Anchor restores / width relayouts: ${gridStats.anchorRestores}/${gridStats.widthRelayouts}`,
      `Mutation batches/nodes/ignored-own: ${gridStats.mutationBatches}/${gridStats.mutationNodes}/${gridStats.ignoredOwnMutations}`,
      `Initial scans / column changes / resize batches: ${gridStats.initialScans}/${gridStats.columnChanges}/${gridStats.resizeBatches}`,
      `Pending gallery/ratio/width work: ${pendingGalleryNodes.size}/${ratioRepairQueue.size}/${widthQueue.size}`,
      `Suppressed ghost walls: ${document.querySelectorAll('.'+GHOST).length} (lifetime ${ghostSuppressed})`,
      `GIF filter active: ${googleGifFilterActive()}`,
      ...wallLines
    ];
    lines.push('Performance mode: LeanPerf production (continuous profiler removed)');
    if(xsearchDebug){
      const list=a=>(a&&a.length?a.join(' | '):'(none)'),clean=v=>String(v??'(none)').replace(/\s+/g,' ').slice(0,300),st=xsearchDebug.stats||{},cov=xsearchDebug.coverage||{},ds=xsearchDebug.domainSources||{};
      lines.push(
        '--- XSearch Quality Merge diagnostic ---',
        `XSearch original base query: ${clean(xsearchDebug.baseQuery)}`,
        `XSearch local goal: ${clean(xsearchDebug.goal)}`,
        `XSearch current Google retrieval query: ${clean(xsearchDebug.retrievalQuery)}`,
        `XSearch media intent/effective/confidence: ${xsearchDebug.mediaIntent}/${xsearchDebug.effectiveMedia}/${xsearchDebug.mediaConfidence}`,
        `XSearch auto retrieval / corpus health: ${xsearchDebug.autoRetrieve} / ${xsearchDebug.health?.status||'unknown'} (${clean(xsearchDebug.health?.reason||'')}) • useful ${xsearchDebug.health?.useful||0} • top-useful ${xsearchDebug.health?.topUseful||0} • gap ${clean(xsearchDebug.health?.coverageGapTerm||'')}:${xsearchDebug.health?.coverageGap||0}`,
        `XSearch corpus media GIF/image/unknown: ${xsearchDebug.mediaCounts?.gif||0}/${xsearchDebug.mediaCounts?.image||0}/${xsearchDebug.mediaCounts?.unknown||0}` ,
        `XSearch engine flags IDF/diversity/media/visual/quiet: ${xsearchDebug.flags?.idf}/${xsearchDebug.flags?.diversity}/${xsearchDebug.flags?.mediaBias}/${xsearchDebug.flags?.visual}/${xsearchDebug.flags?.quietRetrieval}`,
        `XSearch image anchors active/cap: ${xsearchDebug.feedbackCount}/${xsearchDebug.feedbackMax}`,
        `XSearch image more/less: ${xsearchDebug.more}/${xsearchDebug.less}`,
        `XSearch signals active: ${xsearchDebug.signalCount||0}`,
        `XSearch tags active: ${xsearchDebug.tagCount||0}`,
        `XSearch anchor consensus positive/negative terms: ${xsearchDebug.positiveConsensusTerms||0}/${xsearchDebug.negativeConsensusTerms||0}`,
        `XSearch suppressed signals: ${list(xsearchDebug.suppressedSignals)}`,
        `XSearch suppressed tags: ${list(xsearchDebug.suppressedTags)}`,
        `XSearch registered choice sites: ${list((xsearchDebug.registeredSites||[]).map(x=>x.domain+':'+x.total+'('+x.more+'+/'+x.less+'-)'))}`,
        `XSearch sites more/only/less/none: ${list(xsearchDebug.preferredSites)} / ${list(xsearchDebug.onlySites)} / ${list(xsearchDebug.lessSites)} / ${list(xsearchDebug.blockedSites)}`,
        `XSearch strength: ${xsearchDebug.strength}`,
        `XSearch UI quick/hub/cap-blocks: ${xsearchDebug.quickOpens}/${xsearchDebug.hubOpens}/${xsearchDebug.capBlocks}`,
        `XSearch actions choices/removals/manual-query-resets: ${st.choices||0}/${st.removals||0}/${xsearchDebug.manualQueryResets||0}` ,
        `XSearch manual Google search preserves/rebases: ${xsearchDebug.manualQueryRebases||0}` ,
        `XSearch session id/nav-seq/preserved/rejected: ${clean(xsearchDebug.searchSessionId)}/${xsearchDebug.sessionNavSeq||0}/${xsearchDebug.sessionPreservedNavigations||0}/${xsearchDebug.sessionRejectedNavigations||0}` ,
        `XSearch pending owned navigation/kind/marker: ${xsearchDebug.pendingNavigation===true}/${clean(xsearchDebug.pendingNavigationKind||'')}/${clean(xsearchDebug.pendingNavigationMarker||'')}`,
        `XSearch signal actions added/edited/deleted: ${st.signalsAdded||0}/${st.signalsEdited||0}/${st.signalsDeleted||0}`,
        `XSearch guaranteed choice-signals / tag deletions: ${st.guaranteedSignalChoices||0}/${st.tagsDeleted||0}`,
        `XSearch tag promotions / signal demotions: ${xsearchDebug.tagPromotions||0}/${xsearchDebug.signalDemotions||0}`,
        `XSearch goal applies / Google-bar restores: ${xsearchDebug.goalApplies||0}/${xsearchDebug.googleSearchBarRestores||0}`,
        `XSearch manual tags: ${list((xsearchDebug.manualTags||[]).map(x=>(x.score>=0?'+ ':'- ')+x.tag+':'+Math.abs(x.score)))}`, 
        `XSearch last action: ${clean(st.lastAction)}`,
        `XSearch persistent signals: ${list((xsearchDebug.signals||[]).map(x=>(x.weight>=0?'+ ':'- ')+x.tag+':'+Math.abs(x.weight)+'['+(x.source||'learned')+']'))}`,
        `XSearch tags low-authority: ${list((xsearchDebug.tags||[]).slice(0,18).map(x=>(x.score>=0?'+ ':'- ')+x.tag+':'+Math.abs(x.score)+'['+(x.consensus?'consensus':'hint')+' '+x.support+']'))}`,
        '--- XSearch retrieval ---',
        `Retrieval batches/searches/find-more/auto: ${xsearchDebug.retrievalBatches}/${xsearchDebug.retrievalSearches}/${xsearchDebug.retrievalFindMore}/${xsearchDebug.retrievalAuto}`,
        `Retrieval find-more growth/re-searches: ${xsearchDebug.retrievalFindMoreGrowth}/${xsearchDebug.retrievalResearches}`,
        `Retrieval last kind/media/query: ${clean(xsearchDebug.lastRetrievalKind)} / ${clean(xsearchDebug.lastRetrievalMedia)} / ${clean(xsearchDebug.lastRetrievalQuery)}` ,
        `Retrieval last reason/growth: ${clean(xsearchDebug.lastRetrievalReason)} / ${xsearchDebug.lastRetrievalGrowth||0}` ,
        `Retrieval FIND MORE outcome: ${clean(xsearchDebug.lastFindMoreOutcome||'')}` ,
        `Retrieval FIND MORE txn start/high-water/net/passes/batches/restored/ms: ${xsearchDebug.lastFindMoreStart||0}/${xsearchDebug.lastFindMoreHighWater||0}/${xsearchDebug.lastFindMoreNetGrowth||0}/${xsearchDebug.lastFindMorePasses||0}/${xsearchDebug.lastFindMoreBatches||0}/${xsearchDebug.lastFindMoreViewportRestored===true}/${xsearchDebug.lastFindMoreDurationMs||0}` ,
        `Retrieval FIND MORE duplicate-action blocks / txn: ${xsearchDebug.findMoreDuplicateBlocks||0}/${clean(xsearchDebug.lastFindMoreTxnId||'')}` ,
        `Retrieval FIND MORE change target/achieved/window: ${Math.round((xsearchDebug.findMoreChangeTarget||0)*100)}%/${Math.round((xsearchDebug.lastFindMoreChangedRatio||0)*100)}%/${xsearchDebug.lastFindMoreWindow||0}` ,
        `RE-SEARCH freshness target/achieved / repeats pruned: ${Math.round((xsearchDebug.researchFreshnessTarget||0)*100)}%/${Math.round((xsearchDebug.researchFreshnessAchieved||0)*100)}% / ${xsearchDebug.researchSeenHidden||0}` ,
        `RE-SEARCH fresh corpus accepted/target / passes/status: ${xsearchDebug.researchFreshAccepted||0}/${xsearchDebug.researchTargetCards||0} / ${xsearchDebug.researchPasses||0}/${clean(xsearchDebug.researchStatus||'')}` ,
        `Complete refresh actions / last purpose: ${xsearchDebug.completeRefreshes||0} / ${clean(xsearchDebug.lastResearchPurpose||'')}` ,
        `Result Memory mode/saved identities: ${clean(xsearchDebug.resultMemoryMode||'open')}/${xsearchDebug.sessionSeenIdentityCount||0}` ,
        `Button outcomes: ${list(Object.entries(xsearchDebug.buttonOutcomes||{}).map(([k,v])=>k+':'+v.status+'('+v.count+')'))}` ,
        `LOAD NEW RESULTS actions/gathered/limit/pruned: ${xsearchDebug.nextBatchActions||0}/${xsearchDebug.nextBatchOffset||0}/${xsearchDebug.gifPageLimit||100}/${xsearchDebug.nextBatchPruned||0} • ${clean(xsearchDebug.nextBatchStatus||'')} • busy=${xsearchDebug.nextBatchBusy===true}` ,
        `FIND EXACT RESULTS searches/mode: ${xsearchDebug.exactSearches||0}/${xsearchDebug.exactMode===true}` ,
        `RE-SEARCH mode/term: ${clean(xsearchDebug.lastResearchMode||'')}/${clean(xsearchDebug.lastResearchTerm||'')}`,
        `RE-SEARCH utility candidates: ${list((xsearchDebug.researchPlannerCandidates||[]).map(x=>x.tag+':'+x.score+'@'+x.support+' gap='+x.gap+' cov='+x.coverage+' hist='+x.historyAttempts+' sat='+x.saturation))}`,
        `Retrieval planner term/support: ${clean(xsearchDebug.retrievalPlannerTerm||'')}/${xsearchDebug.retrievalPlannerSupport||0}`,
        `Retrieval action-start / page-high-water / preserved: ${xsearchDebug.retrievalActionStartCorpus||0}/${xsearchDebug.retrievalPageHighWater||0}/${xsearchDebug.lastPreservedCorpus||0}` ,
        `Retrieval phase / quiet entries/ms/mutations/watchdogs: ${clean(xsearchDebug.retrievalPhase||'idle')} / ${xsearchDebug.retrievalQuietEntries||0}/${xsearchDebug.retrievalQuietMs||0}/${xsearchDebug.retrievalQuietMutations||0}/${xsearchDebug.retrievalQuietWatchdogTrips||0}` ,
        `Retrieval novelty new/overlap/ratio • useful/ratio/yield: ${xsearchDebug.lastNoveltyCount||0}/${xsearchDebug.lastOverlapCount||0}/${xsearchDebug.lastNoveltyRatio||0} • ${xsearchDebug.lastUsefulNoveltyCount||0}/${xsearchDebug.lastUsefulNoveltyRatio||0}/${xsearchDebug.lastRetrievalYield||0}` ,
        `Retrieval outcome memory / destination strong/domains / settle-runs: ${xsearchDebug.retrievalOutcomeCount||0} / ${xsearchDebug.lastDestinationStrong||0}/${xsearchDebug.lastDestinationDomains||0} / ${xsearchDebug.noveltySettleRuns||0}` ,
        `Retrieval coverage gap term/value / planner-slot/history: ${clean(xsearchDebug.lastCoverageGapTerm||'')}/${xsearchDebug.lastCoverageGap||0} / ${xsearchDebug.retrievalPlannerSlot||0}/${xsearchDebug.retrievalQueryHistory||0}`,
        `Retrieval candidates indexed/unique: ${xsearchDebug.indexedCards}/${xsearchDebug.uniqueResults}`,
        `Retrieval stable identity records: ${xsearchDebug.identityRecords||0}`,
        '--- XSearch index ---',
        `Index builds full/incremental / structured W_jd entries: ${xsearchDebug.fullIndexBuilds||0}/${xsearchDebug.incrementalPasses||0}/${xsearchDebug.structuredEntries}`,
        `Index new cards / stale pruned / self mutations ignored: ${xsearchDebug.newCardsIndexed||0}/${xsearchDebug.stalePruned||0}/${xsearchDebug.selfMutationsIgnored||0}`,
        `Index unique domains / vocabulary / avg tags-result: ${xsearchDebug.uniqueDomains}/${xsearchDebug.vocabulary}/${xsearchDebug.avgTags}` ,
        `Index IDF documents/terms: ${xsearchDebug.idfDocs||0}/${xsearchDebug.idfTerms||0}` ,
        `Index epoch/committed/key/ready/resets/repairs: ${xsearchDebug.indexEpoch||0}/${xsearchDebug.indexCommittedEpoch||0}/${clean(xsearchDebug.indexKey||'')}/${xsearchDebug.indexReady===true}/${xsearchDebug.indexResets||0}/${xsearchDebug.indexIntegrityRepairs||0}`,
        `Index metadata coverage title/domain/source/image/dims/animation: ${cov.title||0}%/${cov.domain||0}%/${cov.source||0}%/${cov.image||0}%/${cov.dims||0}%/${cov.animation||0}%`,
        `Index domain source W_jd/DOM/image/unresolved: ${ds.wjd||0}/${ds.dom||0}/${ds.image||0}/${ds.unresolved||0}`,
        `Index time total/max: ${xsearchDebug.indexMs||0}/${xsearchDebug.indexMax||0}ms`,
        `Index mutation triggers: ${xsearchDebug.mutationTriggers||0}`,
        '--- XSearch ranking ---',
        `Ranking reranks user/google/initial: ${xsearchDebug.userReranks||0}/${xsearchDebug.googleReranks||0}/${xsearchDebug.initialReranks||0}`,
        `Ranking total/cards/restores/duplicate-schedules: ${xsearchDebug.reranks}/${xsearchDebug.cardsRanked}/${xsearchDebug.restores}/${xsearchDebug.duplicateRankSchedules||0}`,
        `Ranking reorder transactions/moved-nodes/anchors-preserved: ${xsearchDebug.reorderTransactions||0}/${xsearchDebug.reorderMovedNodes||0}/${xsearchDebug.anchorPreserved||0}`,
        `Ranking last reason/global corpus/mode: ${xsearchDebug.lastRankReason||'none'} / ${xsearchDebug.globalRanking===true} / ${xsearchDebug.rankingMode||'unknown'}`,
        `Ranking cards/hidden/duplicates/moved/avg-move/max-move: ${xsearchDebug.cards}/${xsearchDebug.filtered||0}/${xsearchDebug.duplicatesHidden||0}/${xsearchDebug.moved}/${xsearchDebug.avgMove}/${xsearchDebug.maxMove}` ,
        `Ranking freshness session-ledger/seen/current-new: ${xsearchDebug.sessionSeenIdentityCount||0}/${xsearchDebug.freshSeen||0}/${xsearchDebug.freshNew||0}` ,
        `Ranking top-10 positions changed: ${xsearchDebug.top10Changed||0}`,
        `Ranking score min/median/avg/max: ${xsearchDebug.scoreMin}/${xsearchDebug.scoreMedian}/${xsearchDebug.scoreAvg}/${xsearchDebug.scoreMax}`,
        `Ranking compute total/max: ${xsearchDebug.rankMs||0}/${xsearchDebug.rankMax||0}ms`,
        `Ranking DOM reorder total/max: ${xsearchDebug.domReorderMs||0}/${xsearchDebug.domReorderMax||0}ms`,
        `Ranking top10 positive anchors / blocked-site leakage: ${xsearchDebug.positiveTop10||0}/${xsearchDebug.blockedLeakage||0}`,
        '--- XSearch visual ---',
        `Native engine / Pose / OpenCV / attached: ${xsearchDebug.nativeVision?.bridge===true} / ${xsearchDebug.nativeVision?.status?.pose===true} / ${xsearchDebug.nativeVision?.status?.openCv===true} / ${xsearchDebug.nativeVision?.status?.nativeAttached||0}`,
`UC native interface visibility probe: ${JSON.stringify(xsearchDebug.nativeVision?.hostProbe||null)}`,
        `Native analysis requested/success/errors/signatures: ${xsearchDebug.nativeVision?.requested||0}/${xsearchDebug.nativeVision?.success||0}/${xsearchDebug.nativeVision?.errors||0}/${xsearchDebug.nativeVision?.signatures||0}`,
        `Native FIND MORE outcome/scored/waitMs: ${xsearchDebug.nativeVision?.outcome||'none'}/${xsearchDebug.nativeVision?.matchedScores||0}/${xsearchDebug.nativeVision?.waitMs||0}`,
        `Native actual rank applied / anchors ready / fallback: ${xsearchDebug.nativeVision?.applied||0}/${xsearchDebug.nativeVision?.anchorsReady||0}/${xsearchDebug.nativeVision?.rankEnabled===true?'NO':'YES'}`,
        `Native coverage/scored / original GIF / preview geometry: ${Math.round(100*(xsearchDebug.nativeVision?.coverage||0))}%/${xsearchDebug.nativeVision?.comparable||0}/${xsearchDebug.nativeVision?.originalSources||0}/${xsearchDebug.nativeVision?.previewSources||0}`,
        `Native preview fetch attempts/success/errors/last: ${xsearchDebug.nativeVision?.status?.previewRequests||0}/${xsearchDebug.nativeVision?.status?.previewSuccess||0}/${xsearchDebug.nativeVision?.status?.previewErrors||0} • ${clean(xsearchDebug.nativeVision?.status?.previewLastError||'none')}`,
        `Native failure categories: ${xsearchDebug.nativeVision?.errorsByType||'none'}`,
        `Visual mode / pixel reads / features / success / blocked: ${xsearchDebug.visualMode}/${xsearchDebug.pixelReads||0}/${xsearchDebug.visualFeatures||0}/${xsearchDebug.visualSuccess||0}/${xsearchDebug.visualBlocked||0}`,
        '--- XSearch user success ---',
        `User feedback choices/removals: ${xsearchDebug.choices||0}/${xsearchDebug.removals||0}`,
        `User success top10 more/less / approval: ${xsearchDebug.top10More||0}/${xsearchDebug.top10Less||0} / ${xsearchDebug.top10Approval||0}%`,
        `User success outside10 more/less: ${xsearchDebug.outside10More||0}/${xsearchDebug.outside10Less||0}`
      );
      for(const t of (xsearchDebug.top||[]))lines.push(`XSearch top ${t.rank}: score=${t.score}, from=${t.from}, move=${t.move}, media=${t.mediaType||'unknown'}@${t.mediaConfidence||0}(${t.mediaBonus||0}), visual=${t.visualBonus||0}, domain=${t.domain}, goal=${t.query} (${t.queryHits}/${t.queryTotal}), signals=${t.signal||0}, tags=${t.tag||0}, positive=${t.pos}/${t.posCap??0} (consensus ${t.posConsensus||0}), negative=${t.neg}/${t.negCap??0} (consensus ${t.negConsensus||0}), site=${t.siteMode||'neutral'} ${t.siteBoost}/${t.sitePenalty}, aspect=${t.aspect}, diversity=${t.diversity}, duplicate=${t.duplicate}, freshness=${t.freshness||0}, seen=${t.seenBefore===true}, title=${clean(t.title)}`)
    }
    if(gridDebug){
      lines.push(`Grid runtime scans initial/mutation: ${gridDebug.initialScans}/${gridDebug.mutationBatches}`,`Grid runtime measured reads / scan-max / mutation-max: ${gridDebug.layoutReads}/${gridDebug.initialScanMax.toFixed(1)}ms/${gridDebug.mutationMax.toFixed(1)}ms`)
    }
    if(hdDebug){
      lines.push(
        `HD clarity enabled: ${hdDebug.enabled}`,
        `HD suspended on GIF search: ${hdDebug.suspendedForGif===true}`,
        `HD exact source map entries: ${hdDebug.mapEntries??0}`,
        `HD cards considered/queued: ${hdDebug.considered??0}/${hdDebug.queued??0}`,
        `HD upgrades shown/success/fail/timeout: ${hdDebug.shown??0}/${hdDebug.success??0}/${hdDebug.fail??0}/${hdDebug.timeout??0}`,
        `HD skipped already-sharp/no-source: ${hdDebug.skippedSharp??0}/${hdDebug.noSource??0}`,
        `HD active requests/surfaces: ${hdDebug.active??0}/${hdDebug.surfaces??0}`,
        `HD median quality gain: ${hdDebug.medianGain??0}x`,
        `HD runtime scans / scan avg-max: ${hdDebug.scans??0}/${hdDebug.scans?((hdDebug.scanMs||0)/hdDebug.scans).toFixed(1):'0.0'}-${(hdDebug.scanMax||0).toFixed(1)}ms`,
        `HD runtime scroll fallbacks / layout reads: ${hdDebug.scrollTriggers??0}/${hdDebug.layoutReads??0}`
      )
    }
    if(gifDebug){
      lines.push(
        `GIF enabled: ${gifDebug.enabled}`,
        `GIF loader mode: ${gifDebug.loaderMode||'legacy'}`,
        `GIF native image-animation / :animated-image: ${gifDebug.nativeAnimSupported===true?'yes':'no'}/${gifDebug.animatedPseudoSupported===true?'yes':'no'}`,
        `GIF native starts/loaded/errors/retries: ${gifDebug.nativeStarts??0}/${gifDebug.nativeLoaded??0}/${gifDebug.nativeErrors??0}/${gifDebug.nativeRetries??0}`,
        `GIF native selected/predictive starts/loading: ${gifDebug.nativeSelectedStarts??0}/${gifDebug.nativeNearStarts??0}/${gifDebug.nativeLoading??0}`,
        `GIF ready-reveal waits/shows: ${gifDebug.deferredRevealWaits??0}/${gifDebug.readyRevealShows??0}`,
        `GIF predictive warm active/starts/limit: ${gifDebug.predictiveWarmActive??0}/${gifDebug.predictiveWarmStarts??0}/${gifDebug.predictiveWarmLimit??2}`,
        `GIF strict attempt-cap blocks: ${gifDebug.attemptCapBlocks??0}`,
        `GIF native animated matches/non-matches: ${gifDebug.nativeAnimatedMatches??0}/${gifDebug.nativeAnimatedNonMatches??0}`,
        `GIF native request timeouts/cancellations: ${gifDebug.nativeTimeouts||0}/${gifDebug.loadCancels||0}`,
        `GIF candidates: ${gifDebug.candidates}`,
        `GIF managed: ${gifDebug.managed}`,
        `GIF near viewport: ${gifDebug.nearViewport}`,
        `GIF Play Zone: ${gifDebug.zoneTopPct??0}%-${gifDebug.zoneBottomPct??0}% (STRICT)` ,
        `GIF zone eligible: ${gifDebug.zoneEligible??0}`,
        `GIF active playing: ${gifDebug.activePlaying??0}`,
        `GIF zone playback selected/limit: ${gifDebug.slotSelected??0}/${gifDebug.maxActive??10}`,
        `GIF selected loaded/loading/warming/waiting: ${gifDebug.selectedLoaded??0}/${gifDebug.selectedLoading??0}/${gifDebug.selectedWarming??0}/${gifDebug.selectedWaiting??0}`,
        `GIF selected playing/loading/retry-wait/confirmed-failed: ${gifDebug.activePlaying??0}/${gifDebug.selectedLoading??0}/${gifDebug.selectedRetryWait??0}/${gifDebug.selectedConfirmedFailed??0}`,
        `GIF slot starts / settle waits: ${gifDebug.slotStarts??0}/${gifDebug.settleWaits??0}`,
        `GIF slot exhaustions / promotions: ${gifDebug.slotExhaustions??0}/${gifDebug.slotPromotions??0}`,
        `GIF cold loads active/limit/deferred: ${gifDebug.liveLoadActive??0}/${gifDebug.liveLoadLimit??3}/${gifDebug.directDeferred??0}` ,
        `GIF concurrency invariant current/cumulative blocks/cancels/max-load/max-warm: ${gifDebug.concurrencyInvariantViolations??0}/${gifDebug.concurrencyViolationEvents??0} ${gifDebug.loadConcurrencyBlocks??0}/${gifDebug.loadCancels??0}/${gifDebug.maxObservedLoads??0}/${gifDebug.maxObservedWarm??0}`,
        `GIF zone-fill warm active/limit/starts: ${gifDebug.zoneWarmActive??0}/${gifDebug.zoneWarmLimit??7}/${gifDebug.zoneWarmStarts??0}`,
        `GIF zone-fill success/fail/timeout/cancel: ${gifDebug.zoneWarmOk??0}/${gifDebug.zoneWarmFail??0}/${gifDebug.zoneWarmTimeout??0}/${gifDebug.zoneWarmCancels??0}`,
        `GIF zone-fill direct shows/in-flight promotions: ${gifDebug.zoneWarmDirectShows??0}/${gifDebug.zoneWarmInflightPromotions??0}`,
        `GIF warm promotions ready/in-flight/evicted/cancelled: ${gifDebug.warmReadyPromotions??0}/${gifDebug.warmInflightPromotions??0}/${gifDebug.warmReadyEvictions??0}/${gifDebug.warmPreloadCancels??0}`,
        `GIF preconnect origins/created: ${gifDebug.preconnectOrigins??0}/${gifDebug.preconnectCount??0}`,
        `GIF host backoffs/blocked skips: ${gifDebug.hostBackoffs??0}/${gifDebug.hostBlockedSkips??0}`,
        `GIF adaptive timeout live/preload: ${gifDebug.adaptiveLiveTimeout??0}/${gifDebug.adaptivePreloadTimeout??0}ms`,
        `GIF preload direction: ${gifDebug.scrollDir===1?'down':gifDebug.scrollDir===-1?'up':'neutral'}`,
        `GIF soft retry waits/wakes/scheduled: ${gifDebug.cooldownSkips??0}/${gifDebug.cooldownRetries??0}/${gifDebug.softRetryScheduled??0}`,
        `GIF live retries / confirmed failed / zone soft fails: ${gifDebug.liveRetryAttempts??0}/${gifDebug.confirmedFailed??0}/${gifDebug.zoneWarmSoftFails??0}`,
        `GIF exact sources/card min/median/max: ${gifDebug.sourceCountStats?.min??0}/${gifDebug.sourceCountStats?.median??0}/${gifDebug.sourceCountStats?.max??0}`,
        `GIF failure cards preload/zone/live: ${gifDebug.failureCardsPreload??0}/${gifDebug.failureCardsZone??0}/${gifDebug.failureCardsLive??0}`,
        `GIF exact source map W_jd/imgres/data/current: ${gifDebug.wjdHits??0}/${gifDebug.imgresHits??0}/${gifDebug.dataHits??0}/${gifDebug.currentHits??0}`,
        `GIF identity misses/rejects: ${gifDebug.identityMisses??0}/${gifDebug.identityRejects??0}`,
        `GIF card geometry moves: ${gifDebug.geometryMoves??0}`,
        `GIF structured W_jd entries: ${gifDebug.wjdEntries??0}`,
        `GIF paused outside zone: ${gifDebug.pausedOutside??0}`,
        `GIF preloaded ready: ${gifDebug.preloaded??0}`,
        `GIF preload queue/active: ${gifDebug.preloadQueued??0}/${gifDebug.preloadActive??0}`,
        `GIF preload success/fail/timeout: ${gifDebug.preloadOk??0}/${gifDebug.preloadFail??0}/${gifDebug.preloadTimeout??0}`,
        `GIF direct starts/fallbacks/live timeouts: ${gifDebug.directStarts??0}/${gifDebug.directFallbacks??0}/${gifDebug.liveTimeouts??0}`,
        `GIF persistent surfaces shows/creates/evictions: ${gifDebug.surfaceShows??0}/${gifDebug.surfaceCreates??0}/${gifDebug.surfaceEvictions??0}`,
        `GIF successful source locks: ${gifDebug.sourceLocks??0}`,
        `GIF boundary holds / grace stops: ${gifDebug.boundaryHolds??0}/${gifDebug.graceStops??0}`,
        `GIF live load success/fail: ${gifDebug.loadOk??0}/${gifDebug.loadFail??0}`,
        `GIF queue wait avg/p95: ${(gifDebug.queueWaitAvg||0).toFixed(0)}/${(gifDebug.queueWaitP95||0).toFixed(0)}ms`,
        `GIF load-to-display avg/p95: ${(gifDebug.loadAvg||0).toFixed(0)}/${(gifDebug.loadP95||0).toFixed(0)}ms`,
        `GIF zone-to-display avg/p95: ${(gifDebug.zoneDisplayAvg||0).toFixed(0)}/${(gifDebug.zoneDisplayP95||0).toFixed(0)}ms`,
        `GIF runtime zone runs / scan avg-max: ${gifDebug.zoneRuns??0}/${gifDebug.scans?((gifDebug.scanMs||0)/gifDebug.scans).toFixed(1):'0.0'}-${(gifDebug.scanMax||0).toFixed(1)}ms`,
        `GIF runtime layout reads / scroll events: ${gifDebug.layoutReads??0}/${gifDebug.scrollEvents??0}`,
        `GIF max attempts/card / failures/card: ${gifDebug.maxAttempts??0}/${gifDebug.maxCardFailures??0}`,
        `GIF selected/warm attempt limits / observed max: ${gifDebug.selectedAttemptLimit??4}/${gifDebug.warmAttemptLimit??1} / ${gifDebug.maxSelectedAttempts??0}/${gifDebug.maxWarmAttempts??0}`,
        `GIF decoded MP total/active: ${gifDebug.decodedMP??0}/${gifDebug.activeDecodedMP??0}`,
        `GIF registered lifetime: ${gifDebug.registeredLifetime}`,
        `GIF source chunks: ${gifDebug.sourceChunks??0} (loose scanning disabled)`,
        `GIF scans/chunks added/deduped: ${gifDebug.scans??0}/${gifDebug.chunkAdds??0}/${gifDebug.chunkDedup??0}`,
        `GIF seed passes / mutation scans: ${gifDebug.seedPasses??0}/${gifDebug.mutationScans??0}`,
        `GIF background pauses: ${gifDebug.visibilityPauses??0}` ,
        `GIF retrieval quiet / pauses: ${gifDebug.retrievalQuiet??false}/${gifDebug.quietPauses??0}`,
        `GIF boundary drag events: ${gifDebug.lineMoves??0}`,
        `GIF unique failed sources: ${gifDebug.failedSources??0}`
      )
    } else lines.push(`GIF enabled: ${gifEnabled()}`, 'GIF debug provider: unavailable');
    return lines.join('\n')
  }

  function showDiagnostic(){
    let overlay=document.getElementById('__xgridpro_diag_overlay__');
    if(!overlay){
      overlay=document.createElement('div'); overlay.id='__xgridpro_diag_overlay__';
      overlay.innerHTML='<div class="xgd-box"><div class="xgd-head"><b>Grid / GIF / XSearch diagnostic</b><button type="button" data-xgd-close>×</button></div><pre data-xgd-text></pre><div class="xgd-actions"><button type="button" data-xgd-refresh>REFRESH</button><button type="button" data-xgd-copy>COPY</button><button type="button" data-xgd-close2>CLOSE</button></div></div>';
      overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
      overlay.querySelector('[data-xgd-close]').onclick=()=>overlay.remove();
      overlay.querySelector('[data-xgd-close2]').onclick=()=>overlay.remove();
      overlay.querySelector('[data-xgd-refresh]').onclick=()=>{const p=overlay.querySelector('[data-xgd-text]');if(p)p.textContent=diagnosticText()};
      overlay.querySelector('[data-xgd-copy]').onclick=async()=>{
        const text=overlay.querySelector('[data-xgd-text]')?.textContent||'';
        try{await navigator.clipboard.writeText(text);overlay.querySelector('[data-xgd-copy]').textContent='COPIED'}catch(_){
          try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();overlay.querySelector('[data-xgd-copy]').textContent='COPIED'}catch(__){}
        }
      };
      document.documentElement.appendChild(overlay)
    }
    const p=overlay.querySelector('[data-xgd-text]');if(p)p.textContent=diagnosticText();
  }

  function attachGifLongPress(button){
    let timer=0,longFired=false,startX=0,startY=0,lastFire=0;
    const cancel=()=>{if(timer){clearTimeout(timer);timer=0}};
    const begin=(x,y)=>{cancel();longFired=false;startX=x||0;startY=y||0;timer=setTimeout(()=>{timer=0;longFired=true;lastFire=Date.now();showDiagnostic()},650)};
    button.addEventListener('touchstart',e=>{const t=e.touches&&e.touches[0];begin(t?.clientX,t?.clientY)},{passive:true});
    button.addEventListener('touchmove',e=>{const t=e.touches&&e.touches[0];if(t&&Math.hypot(t.clientX-startX,t.clientY-startY)>14)cancel()},{passive:true});
    button.addEventListener('touchend',cancel,{passive:true});button.addEventListener('touchcancel',cancel,{passive:true});
    button.addEventListener('mousedown',e=>{if(Date.now()-lastFire<700)return;begin(e.clientX,e.clientY)});
    button.addEventListener('mousemove',e=>{if(timer&&Math.hypot(e.clientX-startX,e.clientY-startY)>14)cancel()});
    button.addEventListener('mouseup',cancel);button.addEventListener('mouseleave',cancel);
    button.addEventListener('contextmenu',e=>{e.preventDefault();cancel();if(Date.now()-lastFire>500){longFired=true;lastFire=Date.now();showDiagnostic()}});
    button.addEventListener('click',e=>{if(longFired||Date.now()-lastFire<800){e.preventDefault();e.stopImmediatePropagation();longFired=false}},true)
  }

  function control(){
    if(document.getElementById(ID)){updateControl();return}
    const h=document.createElement('div');h.id=ID;
    h.innerHTML='<div class="xgc-dock"><button class="xgc-step" data-xgrid-minus type="button" aria-label="Fewer grid columns">−</button><span data-xgrid-col-value>3×</span><button data-xgrid-gif type="button" aria-label="GIF playback" aria-pressed="true">GIF ON</button><button data-xgrid-search type="button" aria-label="XSearch controls" aria-pressed="false">SEARCH</button><button class="xgc-step" data-xgrid-plus type="button" aria-label="More grid columns">+</button></div>';
    h.querySelector('[data-xgrid-minus]').onclick=()=>applyColumns(currentCols-1);
    h.querySelector('[data-xgrid-plus]').onclick=()=>applyColumns(currentCols+1);
    const gifButton=h.querySelector('[data-xgrid-gif]');
    gifButton.onclick=toggleGif;
    attachGifLongPress(gifButton);
    const searchButton=h.querySelector('[data-xgrid-search]');searchButton.onclick=()=>xsShowHub();
    ['touchstart','touchmove','touchend','mousedown','mousemove','mouseup','click'].forEach(name=>h.addEventListener(name,e=>e.stopPropagation(),{passive:name.startsWith('touch')}));
    document.documentElement.appendChild(h);updateControl()
  }

  function isOwnMutationNode(n){
    if(!n||n.nodeType!==1)return false;
    return n.id===ID||n.id==='__xgridpro_diag_overlay__'||n.id===XS_OVERLAY||n.id===XS_TOAST||n.parentElement?.dataset?.xgridSearchBusy==='1'||n.id==='__xgridpro_gif_top_line__'||n.id==='__xgridpro_gif_bottom_line__'||n.classList?.contains('__xgridpro_live_gif__')||n.classList?.contains('__xgridpro_hd_image__')||n.classList?.contains('__xgridpro_gif_zone_line__')||!!n.closest?.('#'+ID+',#__xgridpro_diag_overlay__,#'+XS_OVERLAY)
  }
  function watch(){
    if(observer||!document.body)return;
    observer=new MutationObserver(records=>{
      const added=[];
      for(const r of records){
        if(r.type==='childList')for(const n of r.addedNodes){if(n.nodeType!==1)continue;if(isOwnMutationNode(n)){gridStats.ignoredOwnMutations++;continue}added.push(n)}
        else if(r.type==='attributes'&&r.target?.nodeType===1){if(isOwnMutationNode(r.target)){gridStats.ignoredOwnMutations++;continue}added.push(r.target)}
      }
      if(added.length)queueGalleryNodes(added)
    });
    // Class changes are mostly our own bookkeeping and caused observer feedback loops.
    // Pinterest-style stability: gallery discovery is structural only. Media URL churn must never trigger masonry work.
    observer.observe(document.body,{childList:true,subtree:true})
  }

  function init(){
    if(!document.body)return;
    try{
      const u=new URL(location.href);
      if(/(^|\.)google\.[a-z.]+$/i.test(u.hostname)&&u.pathname==='/search'&&u.searchParams.get('q')){
        let dirty=false;
        if(u.searchParams.get('udm')!=='2'){u.searchParams.set('udm','2');dirty=true}
        const parts=(u.searchParams.get('tbs')||'').split(',').filter(Boolean).filter(v=>!/^itp:/i.test(v));
        parts.push('itp:animated');const tbs=parts.join(',');
        if(u.searchParams.get('tbs')!==tbs){u.searchParams.set('tbs',tbs);dirty=true}
        if(dirty){location.replace(u.toString());return}
      }
      localStorage.setItem('__xgridpro_gif_enabled_v2__','1');
    }catch(_){}
    styles();xsClearLegacy();const bootState=xsLoad();if(bootState.retrieval?.researchTxn?.active)xsSetResearchHold(true);else xsSetResearchHold(false);xsScheduleGoogleSearchDisplay(bootState);xsInstallTrainer();control();applyColumns(readCols());watch();xsInstallObserver();xsScheduleIndex(180,'initial');
    idle(()=>{optimizeImages(document);initialGalleries();xsScheduleIndex(80,'initial')})
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
  addEventListener('load',()=>{updateControl();if(!document.querySelector('.'+WALL))initialGalleries()},{once:true});
  addEventListener('_urlchange',()=>setTimeout(()=>{reviveGhostWalls();const before=xsState?.baseKey||'',state=xsLoad();xsScheduleGoogleSearchDisplay(state);const after=xsQueryKey(xsCurrentQuery()),changed=!!before&&!!after&&before!==after;currentCols=readCols();control();applyColumns(currentCols);xsScheduleIndex(120,changed?'initial':'google')},50));
  addEventListener('resize',()=>{if(globalResizeFrame)return;globalResizeFrame=requestAnimationFrame(()=>{globalResizeFrame=0;gridStats.resizeBatches++;document.querySelectorAll('.'+WALL).forEach(scheduleWidthRelayout);updateControl()})},{passive:true});
  addEventListener('__xgridGifState',updateControl);
  window.__xgridGridDebug=()=>({...gridStats,layoutReads:gridLayoutReads,initialScanMs:Number(gridInitialScanMs.toFixed(2)),initialScanMax:Number(gridInitialScanMax.toFixed(2)),mutationMs:Number(gridMutationMs.toFixed(2)),mutationMax:Number(gridMutationMax.toFixed(2)),walls:document.querySelectorAll('.'+WALL).length});
})();
;(() => {
  'use strict';
  /* XGridPro v27.0 XSearch Core + LeanPerf + Progressive HD Clarity.
     Never changes masonry geometry or Google's thumbnail element. A higher-resolution
     source is decoded off-DOM, quality-checked, then atomically layered into the
     already-fixed card. */
  const HD_CLASS='__xgridpro_hd_image__',HD_VISIBLE='__xgridpro_hd_visible__';
  const WALL='__xbg_masonry',CARD='__xbg_imageonly';
  const KEY='__xgridpro_hd_clarity_v1__';
  const MAX_ACTIVE=2,LOAD_TIMEOUT=6500,NEAR_MARGIN=.65,MAX_SURFACES=24,TARGET_DPR=2.15;
  const docMap=new Map(),queue=[],queued=new Set(),managed=new Set();let seenScripts=new WeakSet();
  let enabled=true,active=0,scanTimer=0,pageKey='',hdObserver=null,retrievalQuiet=!!window.__xgridRetrievalQuiet,quietPauses=0;
  let considered=0,queueAdds=0,success=0,fail=0,timeouts=0,shown=0,skippedSharp=0,noSource=0,mapEntries=0,surfaceEvictions=0;
  let hdScans=0,hdScanMs=0,hdScanMax=0,hdScrollTriggers=0,hdLayoutReads=0;function hdRead(n=1){hdLayoutReads+=n}
  const gains=[];
  try{enabled=localStorage.getItem(KEY)!=='0'}catch(_){}
  function isGoogleImages(){try{const u=new URL(location.href);return /(^|\.)google\.[a-z.]+$/i.test(u.hostname)&&u.searchParams.get('udm')==='2'}catch(_){return false}}
  function gifFilter(){try{return /(?:^|,)itp:animated(?:,|$)/i.test(new URL(location.href).searchParams.get('tbs')||'')}catch(_){return false}}
  function usable(v){if(!/^https?:\/\//i.test(v||''))return false;try{const u=new URL(v,location.href),h=u.hostname.toLowerCase();if(/(^|\.)google\.[a-z.]+$/i.test(h)&&/\/(?:search|url)(?:[/?#]|$)/i.test(u.pathname))return false;return true}catch(_){return false}}
  function animated(v){return /\.(?:gif)(?:$|[?#])/i.test(v||'')||/[?&](?:format|fm|type)=gif(?:&|$)/i.test(v||'')}
  function balancedObject(text,start){const brace=text.indexOf('{',start);if(brace<0)return null;let depth=0,str=false,esc=false;for(let i=brace;i<text.length;i++){const ch=text[i];if(str){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')str=false;continue}if(ch==='"'){str=true;continue}if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0)return text.slice(brace,i+1)}}return null}
  function extract(obj){if(!obj||typeof obj!=='object')return;for(const val of Object.values(obj)){if(!Array.isArray(val))continue;let inner=val;if(Array.isArray(val[1]))inner=val[1];const id=(typeof inner[1]==='string'&&inner[1])||(typeof inner[7]==='string'&&inner[7])||null;const meta=Array.isArray(inner[3])?inner[3]:null;const url=meta?.[0];if(id&&usable(url)){if(!docMap.has(id))mapEntries++;docMap.set(id,{url,w:Number(meta?.[1])||0,h:Number(meta?.[2])||0})}}}
  function refreshMap(){try{if(window.W_jd&&typeof window.W_jd==='object')extract(window.W_jd)}catch(_){}for(const sc of document.querySelectorAll('script')){if(seenScripts.has(sc))continue;seenScripts.add(sc);const t=sc.textContent||'';if(t.length<20||!t.includes('var m'))continue;let pos=0;for(let n=0;n<4;n++){const k=t.indexOf('var m',pos);if(k<0)break;const eq=t.indexOf('=',k);if(eq<0)break;const raw=balancedObject(t,eq);if(!raw)break;try{extract(JSON.parse(raw))}catch(_){}pos=eq+raw.length}}}
  function findDocId(card,img){const nodes=[];for(const n of [img?.closest?.('[data-docid],[data-tbnid],[jsdata],[id^="e-"]'),card?.querySelector?.('[data-docid],[data-tbnid],[jsdata],[id^="e-"]'),card])if(n&&!nodes.includes(n))nodes.push(n);for(const n of nodes){const d=n.getAttribute?.('data-docid')||n.getAttribute?.('data-tbnid');if(d)return d;const id=n.getAttribute?.('id');if(id?.startsWith('e-')&&id.length>2)return id.slice(2);const js=n.getAttribute?.('jsdata');const m=js?.match(/;([^;"'\s]+);/);if(m)return m[1]}return null}
  function decodeImgres(href){try{const u=new URL(href,location.href);if(!u.pathname.includes('/imgres'))return null;const v=u.searchParams.get('imgurl')||u.searchParams.get('mediaurl');return usable(v)?v:null}catch(_){return null}}
  function primary(card){return card?.querySelector?.('img:not(.__xgridpro_live_gif__):not(.__xgridpro_hd_image__)')||null}
  function bestSrcset(img){const raw=img?.getAttribute?.('srcset')||'';if(!raw||raw.startsWith('data:'))return null;let best=null,bestScore=0;for(const part of raw.split(',')){const p=part.trim();if(!p)continue;const m=p.match(/^(\S+)\s+([0-9.]+)(w|x)$/);if(!m||!usable(m[1]))continue;const score=Number(m[2])*(m[3]==='x'?10000:1);if(score>bestScore){bestScore=score;best=m[1]}}return best}
  function exactSource(card,img){const ss=bestSrcset(img);if(ss&&ss!==(img.currentSrc||img.src))return {url:ss,tier:'srcset'};if(gifFilter())return null;const anchors=[];const own=img.closest?.('a[href]');if(own)anchors.push(own);card.querySelectorAll?.('a[href*="/imgres?"],a[href*="imgurl="],a[href*="mediaurl="]').forEach(a=>{if(!anchors.includes(a))anchors.push(a)});for(const a of anchors){const v=decodeImgres(a.href||a.getAttribute('href'));if(v&&!animated(v))return {url:v,tier:'imgres'}};const holder=img.closest?.('[data-docid],[data-tbnid]')||card.querySelector?.('[data-docid],[data-tbnid]')||card;for(const el of [img,holder,card])if(el?.getAttribute)for(const k of ['data-img-url','data-ou','data-iurl','data-original','data-image-url']){const v=el.getAttribute(k);if(usable(v)&&!animated(v))return {url:v,tier:'data'}};const id=findDocId(card,img),m=id?docMap.get(id):null;if(m?.url&&!animated(m.url))return {url:m.url,tier:'wjd',w:m.w,h:m.h};return null}
  function currentQuality(img,card){hdRead();const r=card.getBoundingClientRect(),nw=img.naturalWidth||0,nh=img.naturalHeight||0;if(r.width<2||r.height<2||nw<2||nh<2)return 0;return Math.min(nw/r.width,nh/r.height)}
  function near(card){if(hdObserver)return card?.dataset?.xhdNear==='1';hdRead();const r=card.getBoundingClientRect(),vh=Math.max(1,innerHeight||document.documentElement.clientHeight||800);return r.bottom>=-vh*NEAR_MARGIN&&r.top<=vh*(1+NEAR_MARGIN)}
  function removeSurface(card){const s=card?.__xhdSurface;if(s?.isConnected)try{s.remove()}catch(_){}card.__xhdSurface=null;card.dataset.xhdShown='0'}
  function prune(){const live=[...managed].filter(c=>c?.isConnected&&c.__xhdSurface?.isConnected);if(live.length<=MAX_SURFACES)return;const victims=live.filter(c=>!near(c)).sort((a,b)=>(a.__xhdLastShown||0)-(b.__xhdLastShown||0));let n=live.length;for(const c of victims){if(n<=MAX_SURFACES)break;removeSurface(c);c.dataset.xhdState='idle';surfaceEvictions++;n--}}
  async function decodeReady(im){if(typeof im.decode==='function'){try{await im.decode();return true}catch(_){return im.complete&&im.naturalWidth>0}}return im.complete&&im.naturalWidth>0}
  function loadCard(card){if(!enabled||!card?.isConnected||active>=MAX_ACTIVE)return;const img=primary(card);if(!img){card.dataset.xhdState='done';return}const source=card.__xhdSource||exactSource(card,img);if(!source){card.dataset.xhdState='done';noSource++;return}card.__xhdSource=source;const cq=currentQuality(img,card),target=Math.min(TARGET_DPR,Math.max(1,devicePixelRatio||1));if(cq>=target*.96){card.dataset.xhdState='done';skippedSharp++;return}active++;card.dataset.xhdState='loading';const hi=new Image();hi.className=HD_CLASS;hi.alt='';hi.draggable=false;hi.setAttribute('aria-hidden','true');hi.decoding='async';hi.loading='eager';try{hi.fetchPriority=near(card)?'high':'low'}catch(_){}let done=false;const finish=async(ok,why)=>{if(done)return;done=true;clearTimeout(timer);hi.onload=hi.onerror=null;active=Math.max(0,active-1);if(!ok){if(why==='timeout')timeouts++;else fail++;card.dataset.xhdState='done';pump();return}await decodeReady(hi);if(!card.isConnected){pump();return}hdRead();const r=card.getBoundingClientRect(),hq=(r.width>1&&r.height>1)?Math.min((hi.naturalWidth||0)/r.width,(hi.naturalHeight||0)/r.height):0;if(!hi.naturalWidth||!hi.naturalHeight||hq<=cq*1.12){skippedSharp++;card.dataset.xhdState='done';pump();return}removeSurface(card);hi.classList.add(HD_VISIBLE);card.appendChild(hi);card.__xhdSurface=hi;card.__xhdLastShown=Date.now();card.dataset.xhdShown='1';card.dataset.xhdState='done';success++;shown++;gains.push(Math.min(9.99,hq/Math.max(.15,cq)));if(gains.length>120)gains.shift();prune();pump()};hi.onload=()=>finish(true,'load');hi.onerror=()=>finish(false,'error');const timer=setTimeout(()=>finish(false,'timeout'),LOAD_TIMEOUT);try{hi.src=source.url}catch(_){finish(false,'error')}}
  function pump(){if(retrievalQuiet)return;while(enabled&&active<MAX_ACTIVE&&queue.length){const c=queue.shift();queued.delete(c);if(!c?.isConnected||c.dataset.xhdState==='loading'||c.dataset.xhdState==='done')continue;if(!near(c))continue;loadCard(c)}}
  function enqueue(card){if(retrievalQuiet||!enabled||!card?.isConnected||queued.has(card)||card.dataset.xhdState==='loading'||card.dataset.xhdState==='done'||card.__xhdSurface?.isConnected)return;queued.add(card);queue.push(card);queueAdds++;pump()}
  function scan(){scanTimer=0;if(retrievalQuiet||!enabled||!isGoogleImages()||document.hidden||gifFilter())return;const __t0=performance.now();hdScans++;const key=location.href.split('#')[0];if(key!==pageKey){pageKey=key;docMap.clear();seenScripts=new WeakSet()}refreshMap();const cards=[...document.querySelectorAll('.'+WALL+'>.'+CARD)],liveSet=new Set(cards);for(const old of [...managed])if(!old?.isConnected||!liveSet.has(old)){removeSurface(old);if(hdObserver)try{hdObserver.unobserve(old)}catch(_){}managed.delete(old);queued.delete(old);delete old.dataset.xhdNear}for(const card of cards){considered++;if(!managed.has(card)){managed.add(card);if(hdObserver)try{hdObserver.observe(card)}catch(_){}}if(near(card))enqueue(card)}prune();const __dt=performance.now()-__t0;hdScanMs+=__dt;hdScanMax=Math.max(hdScanMax,__dt)}
  function schedule(delay=70){if(retrievalQuiet||!enabled||!isGoogleImages()||gifFilter())return;clearTimeout(scanTimer);scanTimer=setTimeout(scan,delay)}
  function onScrollFallback(){if(gifFilter()||hdObserver)return;hdScrollTriggers++;schedule(0)}
  function median(a){if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2}
  function install(){if(!document.getElementById('__xgridpro_hd_style__')){const st=document.createElement('style');st.id='__xgridpro_hd_style__';st.textContent=`.${WALL}>.${CARD}>img.${HD_CLASS}{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;z-index:10!important;pointer-events:none!important;object-fit:contain!important;object-position:center!important;image-rendering:auto!important;filter:none!important;display:block!important;visibility:visible!important;opacity:1!important;transform:none!important}`;(document.head||document.documentElement).appendChild(st)}if('IntersectionObserver'in window){hdObserver=new IntersectionObserver(entries=>{if(!enabled||gifFilter())return;for(const e of entries){const c=e.target;if(!managed.has(c))continue;c.dataset.xhdNear=e.isIntersecting?'1':'0';if(e.isIntersecting)enqueue(c);else queued.delete(c)}prune();pump()},{root:null,rootMargin:Math.round(NEAR_MARGIN*100)+'% 0px '+Math.round(NEAR_MARGIN*100)+'% 0px',threshold:0})}schedule(20);const mo=new MutationObserver(rs=>{if(!enabled||!isGoogleImages()||document.hidden||gifFilter())return;for(const r of rs){for(const n of r.addedNodes||[]){if(n.nodeType!==1||n.classList?.contains(HD_CLASS)||n.classList?.contains('__xgridpro_live_gif__'))continue;schedule(110);return}}});mo.observe(document.documentElement,{subtree:true,childList:true});if(!hdObserver)addEventListener('scroll',onScrollFallback,{passive:true});addEventListener('resize',()=>schedule(100),{passive:true});addEventListener('_urlchange',()=>setTimeout(()=>{pageKey='';docMap.clear();seenScripts=new WeakSet();queue.length=0;queued.clear();for(const c of [...managed]){if(c?.isConnected){removeSurface(c);c.dataset.xhdState='idle';delete c.__xhdSource;delete c.__xhdLastShown;delete c.dataset.xhdNear}else managed.delete(c)}schedule(20)},80));addEventListener('__xgridRetrievalQuiet',e=>{retrievalQuiet=!!e.detail?.quiet;if(retrievalQuiet){quietPauses++;clearTimeout(scanTimer);scanTimer=0;queue.length=0;queued.clear()}else schedule(60)})}
  window.__xgridHdDebug=()=>({enabled,mapEntries,considered,queued:queueAdds,shown,success,fail,timeout:timeouts,skippedSharp,noSource,active,surfaces:[...managed].filter(c=>c?.isConnected&&c.__xhdSurface?.isConnected).length,medianGain:Number(median(gains).toFixed(2)),surfaceEvictions,suspendedForGif:gifFilter(),retrievalQuiet,quietPauses,scans:hdScans,scanMs:Number(hdScanMs.toFixed(2)),scanMax:Number(hdScanMax.toFixed(2)),scrollTriggers:hdScrollTriggers,layoutReads:hdLayoutReads});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();
;(() => {
  'use strict';
  /* XGridPro GridClean v27.0 XSearch Core GIF Play Zone.
     Stable architecture retained from v18-v25.1:
       1) masonry/card geometry is never owned or changed by GIF state;
       2) each card is mapped only from exact card-local metadata / exact docId -> W_jd data;
       3) one persistent real <img> surface per card and one native request lifecycle per exact source;
       4) selected cards start immediately; only the next two off-zone cards are predictively warmed;
       5) each card gets at most two real starts per page; warm failure waits for actual selection;
       6) no duplicate loaders or timeout cancellation; Chrome owns download/decode;
       7) the original thumbnail remains visible until the persistent GIF reports a completed successful load;
       8) up to ten fully in-zone cards may be visible/playing simultaneously. */
  const GIF_CLASS='__xgridpro_live_gif__';
  const GIF_KEY='__xgridpro_gif_enabled_v2__';
  const TOP_ID='__xgridpro_gif_top_line__',BOTTOM_ID='__xgridpro_gif_bottom_line__';
  const TOP_KEY='__xgridpro_gif_zone_top_v1__',BOTTOM_KEY='__xgridpro_gif_zone_bottom_v1__';
  const DEFAULT_TOP=.20,DEFAULT_BOTTOM=.76,MIN_GAP=.18;
  const IO_MARGIN=.68,EXIT_HYSTERESIS=.06,STOP_GRACE_MS=1000,SETTLE_MS=45,MAX_ACTIVE=10,WARM_AHEAD=2,LOAD_LIMIT=MAX_ACTIVE+WARM_AHEAD,SELECTED_ATTEMPT_LIMIT=4,WARM_ATTEMPT_LIMIT=1,VISIBLE_CLASS='__xgridpro_live_visible__';
  const managed=new Set(),docMap=new Map(),nearSet=new Set(),stopTimers=new WeakMap(),settleTimers=new WeakMap(),retryTimers=new WeakMap();
  let seenScripts=new WeakSet(),nearObserver=null;
  function filterActive(){try{const u=new URL(location.href),tbs=u.searchParams.get('tbs')||'';return /(^|\.)google\.[a-z.]+$/i.test(u.hostname)&&u.searchParams.get('udm')==='2'&&/(?:^|,)itp:animated(?:,|$)/i.test(tbs)}catch(_){return false}}
  function savedEnabled(){try{return localStorage.getItem(GIF_KEY)==='1'}catch(_){return false}}
  function isGoogleHost(){return /(^|\.)google\.[a-z.]+$/i.test(location.hostname)}
  let enabled=filterActive()||(!isGoogleHost()&&savedEnabled()),pageKey='',scanTimer=0,zoneFrame=0,scrollDir=0,lastScrollY=window.scrollY||0,retrievalQuiet=!!window.__xgridRetrievalQuiet,quietPauses=0;
  let topLine=null,bottomLine=null,zoneTop=DEFAULT_TOP,zoneBottom=DEFAULT_BOTTOM;
  try{const t=Number(localStorage.getItem(TOP_KEY)),b=Number(localStorage.getItem(BOTTOM_KEY));if(t>=.02&&b<=.98&&b-t>=MIN_GAP){zoneTop=t;zoneBottom=b}}catch(_){}

  const nativeAnimSupported=(()=>{try{return typeof CSS!=='undefined'&&typeof CSS.supports==='function'&&CSS.supports('image-animation','paused')}catch(_){return false}})();
  const animatedPseudoSupported=(()=>{try{return typeof CSS!=='undefined'&&typeof CSS.supports==='function'&&CSS.supports('selector(:animated-image)')}catch(_){return false}})();
  let candidateCards=0,registeredLifetime=0,surfaceShows=0,surfaceCreates=0,sourceLocks=0,surfaceEvictions=0;
  let nativeStarts=0,nativeLoaded=0,nativeErrors=0,nativeRetries=0,nativeTimeouts=0,nativeAnimatedMatches=0,nativeAnimatedNonMatches=0,nativeSelectedStarts=0,nativeNearStarts=0,predictiveWarmStarts=0,attemptCapBlocks=0,deferredRevealWaits=0,readyRevealShows=0,loadConcurrencyBlocks=0,loadCancels=0,concurrencyViolationEvents=0,maxObservedLoads=0,maxObservedWarm=0;
  let loadOk=0,loadFail=0,preloadOk=0,preloadFail=0,directStarts=0,directFallbacks=0;
  let zoneEligible=0,activeNow=0,pausedOutside=0,slotSelected=0,slotStarts=0,settleWaits=0,slotPromotions=0,boundaryHolds=0,graceStops=0,lineMoves=0,visibilityPauses=0;
  let gifScans=0,mutationScans=0,wjdEntries=0,wjdHits=0,imgresHits=0,dataHits=0,currentHits=0,identityMisses=0,identityRejects=0,geometryMoves=0;
  let gifLayoutReads=0,gifZoneRuns=0,gifZoneMs=0,gifZoneMax=0,gifScanMs=0,gifScanMax=0,gifScrollEvents=0;let gifSourceCacheHits=0,gifSourceResolves=0,gifLineWritesSaved=0,gifWarmInflightPromotions=0,gifWarmReadyPromotions=0,gifReadyReuses=0,gifColdEvictions=0,gifTimedOut=0,gifStaleCallbacks=0,gifWarmHysteresis=0,gifLastTrim=0;
  const loadSamples=[],zoneDisplaySamples=[],selectedLoadSamples=[],warmLoadSamples=[];
  function gifRead(n=1){gifLayoutReads+=n}
  function pushSample(a,v,name){if(!Number.isFinite(v)||v<0)return;a.push(v);if(a.length>240)a.shift()}
  function sampleP95(a){if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.ceil(.95*b.length)-1)]||0}

  function saveZone(){try{localStorage.setItem(TOP_KEY,String(zoneTop));localStorage.setItem(BOTTOM_KEY,String(zoneBottom))}catch(_){} }
  function pct(v){return Math.round(v*100)}
  function lineMarkup(label){return `<span class="xg-zone-dot xg-zone-left"></span><span class="xg-zone-dot xg-zone-right"></span><span class="xg-zone-label">${label}</span>`}
function positionLines(){const vh=Math.max(1,innerHeight||document.documentElement.clientHeight||800);for(const [line,value,name] of [[topLine,zoneTop,'TOP'],[bottomLine,zoneBottom,'BOTTOM']]){if(!line)continue;const y=Math.round(vh*value),label=name+' '+pct(value)+'%';if(line.__xgLineY!==y){line.style.setProperty('transform',`translate3d(0,${y}px,0)`,'important');line.__xgLineY=y}else gifLineWritesSaved++;if(line.__xgLineLabel!==label){const el=line.querySelector('.xg-zone-label');if(el)el.textContent=label;line.__xgLineLabel=label}}}
  function beginLineDrag(e,which,line){if(e.button!=null&&e.button!==0)return;e.preventDefault();e.stopPropagation();const id=e.pointerId,vh=Math.max(1,innerHeight||document.documentElement.clientHeight||800),current=(which==='top'?zoneTop:zoneBottom)*vh,offset=(e.clientY??current)-current;line.classList.add('xg-zone-dragging');try{line.setPointerCapture?.(id)}catch(_){}const move=ev=>{if(ev.pointerId!==id)return;ev.preventDefault();const h=Math.max(1,innerHeight||document.documentElement.clientHeight||800),y=(ev.clientY??current)-offset;let p=Math.max(.02,Math.min(.98,y/h));if(which==='top')zoneTop=Math.min(p,zoneBottom-MIN_GAP);else zoneBottom=Math.max(p,zoneTop+MIN_GAP);lineMoves++;positionLines();queueZoneUpdate()};const cleanup=()=>{line.removeEventListener('pointermove',move);line.removeEventListener('pointerup',end);line.removeEventListener('pointercancel',end);line.classList.remove('xg-zone-dragging');try{if(line.hasPointerCapture?.(id))line.releasePointerCapture?.(id)}catch(_){}};const end=ev=>{if(ev.pointerId!==id)return;ev.preventDefault();cleanup();saveZone();queueZoneUpdate()};line.addEventListener('pointermove',move,{passive:false});line.addEventListener('pointerup',end,{passive:false});line.addEventListener('pointercancel',end,{passive:false})}
  function makeLine(which){const line=document.createElement('div');line.id=which==='top'?TOP_ID:BOTTOM_ID;line.className='__xgridpro_gif_zone_line__';line.setAttribute('role','slider');line.setAttribute('aria-label',which==='top'?'GIF play zone top':'GIF play zone bottom');line.innerHTML=lineMarkup(which==='top'?'TOP':'BOTTOM');line.addEventListener('pointerdown',e=>beginLineDrag(e,which,line),{passive:false});return line}
  function ensureLines(){if(!enabled)return removeLines();if(!topLine?.isConnected){document.querySelectorAll('#'+TOP_ID).forEach(n=>n.remove());topLine=makeLine('top');document.documentElement.appendChild(topLine)}if(!bottomLine?.isConnected){document.querySelectorAll('#'+BOTTOM_ID).forEach(n=>n.remove());bottomLine=makeLine('bottom');document.documentElement.appendChild(bottomLine)}positionLines()}
  function removeLines(){document.querySelectorAll('#'+TOP_ID+',#'+BOTTOM_ID).forEach(n=>n.remove());topLine=bottomLine=null}

  function usableUrl(v){if(!/^https?:\/\//i.test(v||''))return false;try{const u=new URL(v,location.href),h=u.hostname.toLowerCase();if(/(^|\.)google\.[a-z.]+$/i.test(h)&&/\/(?:search|url)(?:[/?#]|$)/i.test(u.pathname))return false;if(/(^|\.)encrypted-tbn\d*\.gstatic\.com$/i.test(h))return false;return true}catch(_){return false}}
  function knownStatic(v){return /\.(?:jpe?g|png|bmp)(?:$|[?#])/i.test(v||'')}
  function knownUnsupported(v){return /\.(?:mp4|m4v|webm|mov|avi|mkv)(?:$|[?#])/i.test(v||'')}
  function knownAnimated(v){return /\.(?:gif|webp|avif|apng)(?:$|[?#])/i.test(v||'')||/[?&](?:format|fm|type)=(?:gif|webp|avif|apng)(?:&|$)/i.test(v||'')}
  function extractWjdObject(obj){if(!obj||typeof obj!=='object')return;for(const val of Object.values(obj)){if(!Array.isArray(val))continue;let inner=val;if(Array.isArray(val[1]))inner=val[1];const docId=(typeof inner[1]==='string'&&inner[1])||(typeof inner[7]==='string'&&inner[7])||null;const orig=Array.isArray(inner[3])?inner[3][0]:null;if(docId&&usableUrl(orig)&&!knownStatic(orig)&&!knownUnsupported(orig)){if(!docMap.has(docId))wjdEntries++;docMap.set(docId,orig)}}}
  function balancedObject(text,start){const brace=text.indexOf('{',start);if(brace<0)return null;let depth=0,str=false,esc=false;for(let i=brace;i<text.length;i++){const ch=text[i];if(str){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')str=false;continue}if(ch==='"'){str=true;continue}if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0)return text.slice(brace,i+1)}}return null}
  function refreshDocMap(){try{if(window.W_jd&&typeof window.W_jd==='object')extractWjdObject(window.W_jd)}catch(_){}for(const s of document.querySelectorAll('script')){if(seenScripts.has(s))continue;seenScripts.add(s);const t=s.textContent||'';if(t.length<20||!t.includes('var m'))continue;let pos=0;for(let n=0;n<4;n++){const k=t.indexOf('var m',pos);if(k<0)break;const eq=t.indexOf('=',k);if(eq<0)break;const raw=balancedObject(t,eq);if(!raw)break;try{extractWjdObject(JSON.parse(raw))}catch(_){}pos=eq+raw.length}}}
  function decodeImgres(href){try{const u=new URL(href,location.href);if(!u.pathname.includes('/imgres'))return null;const v=u.searchParams.get('imgurl')||u.searchParams.get('mediaurl');return usableUrl(v)&&!knownStatic(v)&&!knownUnsupported(v)?v:null}catch(_){return null}}
  function findDocId(card,img){const nodes=[];for(const n of [img?.closest?.('[data-docid],[data-tbnid],[jsdata],[id^="e-"]'),card?.querySelector?.('[data-docid],[data-tbnid],[jsdata],[id^="e-"]'),card])if(n&&!nodes.includes(n))nodes.push(n);for(const n of nodes){const direct=n.getAttribute?.('data-docid')||n.getAttribute?.('data-tbnid');if(direct)return direct;const id=n.getAttribute?.('id');if(id?.startsWith('e-')&&id.length>2)return id.slice(2);const jd=n.getAttribute?.('jsdata');const m=jd?.match(/;([^;"'\s]+);/);if(m)return m[1]}return null}
  function mainImg(card){return card?.querySelector?.('img:not(.'+GIF_CLASS+'):not(.__xgridpro_hd_image__)')||null}
  function sourcesFrom(img,card){const out=[],seen=new Set();const add=(v,tier)=>{if(!usableUrl(v)||knownStatic(v)||knownUnsupported(v)||seen.has(v))return;seen.add(v);out.push({url:v,tier})};const anchors=[];const own=img.closest?.('a[href]');if(own)anchors.push(own);card.querySelectorAll?.('a[href*="/imgres?"],a[href*="imgurl="],a[href*="mediaurl="]').forEach(a=>{if(!anchors.includes(a))anchors.push(a)});for(const a of anchors){const v=decodeImgres(a.href||a.getAttribute('href'));if(v){add(v,'imgres');imgresHits++}}const holder=img.closest?.('[data-docid],[data-tbnid]')||card.querySelector?.('[data-docid],[data-tbnid]')||card;for(const el of [img,holder,card])if(el?.getAttribute)for(const a of ['data-img-url','data-ou','data-iurl','data-original','data-image-url']){const v=el.getAttribute(a);if(v&&usableUrl(v)&&!knownStatic(v)&&!knownUnsupported(v)){add(v,'data');dataHits++}}const docId=findDocId(card,img);if(docId){const v=docMap.get(docId);if(v){add(v,'wjd');wjdHits++}}const current=img.currentSrc||img.src||'';if(knownAnimated(current)&&usableUrl(current)){add(current,'current');currentHits++}if(!out.length)identityMisses++;return out}

  function cancelStop(g){const t=stopTimers.get(g);if(t){clearTimeout(t);stopTimers.delete(g)}}
  function cancelSettle(g){const t=settleTimers.get(g);if(t){clearTimeout(t);settleTimers.delete(g)}}
  function cancelRetry(g){const t=retryTimers.get(g);if(t){clearTimeout(t);retryTimers.delete(g)}}
  function currentLoadingCards(){return [...managed].filter(g=>g?.isConnected&&g.dataset.xgLoading==='1')}
  function currentWarmLoading(){return currentLoadingCards().filter(g=>g.__xgLoadKind==='warm')}
  function clearLoadWatchdog(g){if(g?.__xgLoadWatchdog){clearTimeout(g.__xgLoadWatchdog);g.__xgLoadWatchdog=0}}
  function cancelNativeLoad(g,reason='scheduler'){if(!g?.isConnected||g.dataset.xgLoading!=='1')return false;cancelRetry(g);clearLoadWatchdog(g);g.__xgLoadToken=(g.__xgLoadToken||0)+1;const kind=g.__xgLoadKind||'idle',img=g.__xgSurface;if(img){img.onload=img.onerror=null;try{img.removeAttribute('src')}catch(_){}}g.dataset.xgLoading='0';g.dataset.xgLoaded='0';g.__xgLoadKind='idle';g.__xgRetrySrc=null;g.__xgWarmError=false;g.__xgDeferredRevealForSrc=null;g.__xgAttemptCount=Math.max(0,(g.__xgAttemptCount||1)-1);if(kind==='warm')g.__xgWarmAttempts=Math.max(0,(g.__xgWarmAttempts||1)-1);else if(kind==='selected')g.__xgSelectedAttempts=Math.max(0,(g.__xgSelectedAttempts||1)-1);loadCancels++;return true}
  function gifInvariantSnapshot(){const loading=currentLoadingCards(),warm=loading.filter(g=>g.__xgLoadKind==='warm'),selected=[...managed].filter(g=>g?.isConnected&&g.dataset.xgEligible==='1');maxObservedLoads=Math.max(maxObservedLoads,loading.length);maxObservedWarm=Math.max(maxObservedWarm,warm.length);const bad=loading.length>LOAD_LIMIT||warm.length>WARM_AHEAD||selected.length>MAX_ACTIVE;if(bad)concurrencyViolationEvents++;return {loading:loading.length,warm:warm.length,selected:selected.length,bad}}
function setNativeAnimation(img,running){if(!img||!nativeAnimSupported||img.__xgAnimRunning===!!running)return;try{img.style.setProperty('image-animation',running?'running':'paused','important');img.__xgAnimRunning=!!running}catch(_){}}
  function attachSurface(g,img){if(!g?.isConnected||!img)return null;img.className=GIF_CLASS;img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');img.decoding='async';if(!img.isConnected)g.appendChild(img);g.__xgSurface=img;setNativeAnimation(img,false);surfaceCreates++;return img}
  function ensureSurface(g){if(!g?.isConnected)return null;let img=g.__xgSurface;if(img?.isConnected)return img;return attachSurface(g,document.createElement('img'))}
  function surfaceVisible(g,on){const img=g?.__xgSurface;if(!img)return false;const wants=!!on&&!g.__xgSourceError,ready=wants&&g.dataset.xgLoaded==='1'&&img.complete&&(img.naturalWidth||0)>0;if(wants&&!ready&&g.dataset.xgLoading==='1'&&g.__xgDeferredRevealForSrc!==g.__xgNativeSrc){g.__xgDeferredRevealForSrc=g.__xgNativeSrc;deferredRevealWaits++}on=ready;const isOn=img.classList.contains(VISIBLE_CLASS);if(on&&!isOn){img.classList.add(VISIBLE_CLASS);surfaceShows++;readyRevealShows++}else if(!on&&isOn)img.classList.remove(VISIBLE_CLASS);setNativeAnimation(img,on);g.classList.toggle('__xgridpro_gif_card_playing__',on);if(on&&!isOn){g.__xgLastShown=Date.now();if(g.__xgProfileEligibleAt){pushSample(zoneDisplaySamples,performance.now()-g.__xgProfileEligibleAt,'gifZoneToDisplay');g.__xgProfileEligibleAt=0}}return true}
  function resetSurface(g,remove=false){clearLoadWatchdog(g);const img=g?.__xgSurface;if(!img)return;g.__xgLoadToken=(g.__xgLoadToken||0)+1;img.onload=img.onerror=null;surfaceVisible(g,false);if(remove){try{img.removeAttribute('src')}catch(_){}try{img.remove()}catch(_){}g.__xgSurface=null;surfaceEvictions++}g.dataset.xgLoaded='0';g.dataset.xgLoading='0';g.removeAttribute('data-xg-active-src')}
  function chooseSource(g,exclude=null){for(const item of g?.__xgSources||[]){const u=item.url||item;if(u!==exclude&&!g.__xgFailedSources?.has(u))return u}return null}
  function nativeLoad(g,selected=false,forceSource=null){
    if(retrievalQuiet||!enabled||!g?.isConnected)return;
    const img=ensureSurface(g);if(!img)return;
    if(selected){try{img.fetchPriority='high'}catch(_){}img.loading='eager';if(g.dataset.xgLoading!=='1')g.__xgLoadKind='selected';g.__xgWarmError=false}
    else{try{img.fetchPriority='low'}catch(_){}img.loading='eager';if(g.__xgWarmError||(g.__xgWarmAttempts||0)>=WARM_ATTEMPT_LIMIT)return;if(!g.__xgLoadKind)g.__xgLoadKind='warm'}
if(g.dataset.xgLoaded==='1'){if(selected){if(g.__xgLoadedAsWarm){gifWarmReadyPromotions++;g.__xgLoadedAsWarm=false}else gifReadyReuses++;surfaceVisible(g,true)}return}
if(g.dataset.xgLoading==='1'){if(selected){if(g.__xgLoadKind==='warm')gifWarmInflightPromotions++;g.__xgLoadKind='selected'}return}
    if(retryTimers.has(g)&&!forceSource)return;
    if(selected&&(g.__xgSelectedAttempts||0)>=SELECTED_ATTEMPT_LIMIT){if(!g.__xgSourceError)attemptCapBlocks++;g.__xgSourceError=true;return}
    if(!selected&&(g.__xgWarmAttempts||0)>=WARM_ATTEMPT_LIMIT)return;
    if(!selected&&currentWarmLoading().length>=WARM_AHEAD){loadConcurrencyBlocks++;return}
    if(currentLoadingCards().length>=LOAD_LIMIT){if(selected){const victim=currentWarmLoading().find(x=>x.dataset.xgEligible!=='1');if(victim)cancelNativeLoad(victim,'selected-priority')}if(currentLoadingCards().length>=LOAD_LIMIT){loadConcurrencyBlocks++;return}}
    let src=forceSource||g.__xgRetrySrc||g.__xgLockedSrc||g.__xgNativeSrc||chooseSource(g);
    if(!src&&selected){try{refreshDocMap();const host=mainImg(g);if(host){const fresh=sourcesFrom(host,g);for(const item of fresh)if(item?.url&&!g.__xgSources?.some(x=>x.url===item.url))(g.__xgSources||(g.__xgSources=[])).push(item);src=chooseSource(g)}}catch(_){}}
    if(!src){if(selected)g.__xgSourceError=true;return}
    g.__xgRetrySrc=null;
    if(g.__xgNativeSrc&&g.__xgNativeSrc!==src)resetSurface(g,false);
    g.__xgNativeSrc=src;g.__xgSourceError=false;g.__xgDeferredRevealForSrc=null;g.dataset.xgLoading='1';g.dataset.xgLoaded='0';g.dataset.xgActiveSrc=src;
    g.__xgAttemptCount=(g.__xgAttemptCount||0)+1;
    if(selected)g.__xgSelectedAttempts=(g.__xgSelectedAttempts||0)+1;else g.__xgWarmAttempts=(g.__xgWarmAttempts||0)+1;
    const selectedAttempt=g.__xgSelectedAttempts||0;
    nativeStarts++;if(selected){nativeSelectedStarts++;directStarts++;g.__xgLoadKind='selected'}else{nativeNearStarts++;predictiveWarmStarts++;g.__xgLoadKind='warm'}
    try{img.referrerPolicy=selected&&selectedAttempt>=2?'no-referrer':''}catch(_){}
    gifInvariantSnapshot();const started=performance.now(),token=(g.__xgLoadToken||0)+1;g.__xgLoadToken=token;g.__xgNativeStartedAt=started;g.__xgLoadedAsWarm=!selected;
    img.onload=()=>{if(!g?.isConnected||g.__xgNativeSrc!==src||g.__xgLoadToken!==token){gifStaleCallbacks++;return;}clearLoadWatchdog(g);cancelRetry(g);g.dataset.xgLoading='0';g.dataset.xgLoaded='1';g.__xgDeferredRevealForSrc=null;g.__xgLockedSrc=src;g.__xgSourceError=false;g.__xgWarmError=false;g.__xgRetrySrc=null;g.__xgLoadKind='loaded';g.__xgWarmAttempts=0;g.__xgSelectedAttempts=0;nativeLoaded++;loadOk++;sourceLocks++;pushSample(loadSamples,performance.now()-started,'gifLoadToDisplay');pushSample(selected?selectedLoadSamples:warmLoadSamples,performance.now()-started,'gifFirstReady');let matches=null;if(animatedPseudoSupported){try{matches=img.matches(':animated-image')}catch(_){matches=null}}if(matches===true)nativeAnimatedMatches++;else if(matches===false)nativeAnimatedNonMatches++;if(g.dataset.xgPlay==='1'&&g.dataset.xgEligible==='1')surfaceVisible(g,true);else{surfaceVisible(g,false);preloadOk++}queueZoneUpdate()};
    img.onerror=()=>{if(!g?.isConnected||g.__xgNativeSrc!==src||g.__xgLoadToken!==token){gifStaleCallbacks++;return;}clearLoadWatchdog(g);g.__xgLoadedAsWarm=false;g.dataset.xgLoading='0';g.dataset.xgLoaded='0';g.__xgFailureCount=(g.__xgFailureCount||0)+1;g.__xgLiveFailures=(g.__xgLiveFailures||0)+1;nativeErrors++;loadFail++;surfaceVisible(g,false);
      if(selected){const attempt=g.__xgSelectedAttempts||0,alt=chooseSource(g,src);if(attempt<SELECTED_ATTEMPT_LIMIT){nativeRetries++;directFallbacks++;g.__xgRetrySrc=alt||src;cancelRetry(g);const delays=[0,180,480,980,1650],delay=alt?45:(delays[Math.min(attempt,delays.length-1)]||480);const t=setTimeout(()=>{retryTimers.delete(g);if(!g?.isConnected||g.dataset.xgEligible!=='1'||retrievalQuiet)return;try{img.removeAttribute('src')}catch(_){}g.dataset.xgLoading='0';nativeLoad(g,true,g.__xgRetrySrc||src)},delay);retryTimers.set(g,t)}else{(g.__xgFailedSources||(g.__xgFailedSources=new Set())).add(src);g.__xgSourceError=true;g.__xgLoadKind='failed'}}
      else{g.__xgWarmError=true;g.__xgLoadKind='warm-error'}queueZoneUpdate()};
    // Network timeout is recoverable through the pre-existing retry / fallback logic.
    clearLoadWatchdog(g);
    g.__xgLoadWatchdog=setTimeout(()=>{
      if(!g?.isConnected||g.__xgLoadToken!==token||g.dataset.xgLoading!=='1')return;
      nativeTimeouts++;
      const onError=img.onerror;
      img.onerror=null;
      try{img.removeAttribute('src')}catch(_){}
      if(onError)onError();
    },selected?Math.min(22000,12000+Math.max(0,selectedAttempt-1)*3000):20000);
    try{img.src=src}catch(_){img.onerror?.()}
  }
  
  function playVisible(g){if(!g?.isConnected)return;cancelStop(g);g.dataset.xgPlay='1';nativeLoad(g,true);surfaceVisible(g,true)}
  function stopVisible(g){if(!g)return;cancelStop(g);g.dataset.xgPlay='0';surfaceVisible(g,false)}
  function scheduleStop(g){if(!g||stopTimers.has(g))return;const t=setTimeout(()=>{stopTimers.delete(g);if(g?.isConnected&&g.dataset.xgEligible!=='1'){stopVisible(g);graceStops++}},STOP_GRACE_MS);stopTimers.set(g,t)}
  function removeOverlay(g){if(!g)return;cancelStop(g);cancelSettle(g);cancelRetry(g);nearSet.delete(g);if(nearObserver)try{nearObserver.unobserve(g)}catch(_){}managed.delete(g);resetSurface(g,true);for(const k of ['xgPlay','xgLoading','xgLoaded','xgEligible','xgNear','xgActiveSrc','xgSlot'])delete g.dataset[k];for(const k of ['__xgSources','__xgHostImg','__xgNativeSrc','__xgLockedSrc','__xgFailedSources','__xgErrorRetries','__xgSourceError','__xgLastShown','__xgGeom','__xgGeomArmAt','__xgGeomArmed','__xgInsideSince','__xgProfileEligibleAt','__xgAttemptCount','__xgSelectedAttempts','__xgWarmAttempts','__xgFailureCount','__xgLiveFailures','__xgNativeStartedAt','__xgDocId','__xgRetrySrc','__xgWarmError','__xgLoadKind','__xgDeferredRevealForSrc','__xgSourceFingerprint','__xgLoadToken','__xgLoadedAsWarm'])delete g[k]}

  function styleGeom(g){if(!g)return null;const l=parseFloat(g.style.left),t=parseFloat(g.style.top),w=parseFloat(g.style.width),h=parseFloat(g.style.height);return Number.isFinite(t)&&Number.isFinite(h)&&h>0?{l:Number.isFinite(l)?l:0,t,w:Number.isFinite(w)?w:0,h}:null}
  function snapshotGeom(g){const q=styleGeom(g);if(q)return q;return {l:g.offsetLeft,t:g.offsetTop,w:g.offsetWidth,h:g.offsetHeight}}
  function trackGeom(g){const n=snapshotGeom(g),now=Date.now();if(!g.__xgGeomArmed){if(now>=(g.__xgGeomArmAt||0)){g.__xgGeom=n;g.__xgGeomArmed=true}return}const p=g.__xgGeom;if(p&&(Math.abs(p.l-n.l)>1||Math.abs(p.t-n.t)>1||Math.abs(p.w-n.w)>1||Math.abs(p.h-n.h)>1))geometryMoves++;g.__xgGeom=n}
  function ensureOverlay(card){const img=mainImg(card);if(!img)return null;const docId=findDocId(card,img);const own=img.closest?.('a[href]'),fingerprint=[docId||'',img.currentSrc||img.src||'',own?.href||'',docMap.get(docId)||'',img.getAttribute?.('data-ou')||'',card.getAttribute?.('data-ou')||''].join('\x1f');if(managed.has(card)&&card.__xgHostImg===img&&card.__xgSourceFingerprint===fingerprint&&card.__xgSources?.length){gifSourceCacheHits++;return card}gifSourceResolves++;const sources=sourcesFrom(img,card);if(!sources.length){identityRejects++;return null}if(!managed.has(card)){card.__xgHostImg=img;card.__xgSources=[];card.__xgFailedSources=new Set();card.__xgErrorRetries=new Map();card.__xgDocId=docId||null;card.__xgRetrySrc=null;card.__xgWarmError=false;card.__xgLoadKind='idle';card.__xgSelectedAttempts=0;card.__xgWarmAttempts=0;card.__xgDeferredRevealForSrc=null;card.dataset.xgPlay='0';card.dataset.xgLoading='0';card.dataset.xgLoaded='0';card.dataset.xgEligible='0';card.dataset.xgNear='0';card.dataset.xgSlot='0';card.__xgGeom=snapshotGeom(card);card.__xgGeomArmAt=Date.now()+1200;card.__xgGeomArmed=false;managed.add(card);if(nearObserver)try{nearObserver.observe(card)}catch(_){}registeredLifetime++}else if(docId&&card.__xgDocId&&docId!==card.__xgDocId){cancelRetry(card);resetSurface(card,true);card.__xgNativeSrc=null;card.__xgLockedSrc=null;card.__xgFailedSources=new Set();card.__xgErrorRetries=new Map();card.__xgAttemptCount=0;card.__xgSelectedAttempts=0;card.__xgWarmAttempts=0;card.__xgFailureCount=0;card.__xgLiveFailures=0;card.__xgRetrySrc=null;card.__xgWarmError=false;card.__xgSourceError=false;card.__xgLoadKind='idle';card.__xgDeferredRevealForSrc=null;card.__xgDocId=docId}card.__xgHostImg=img;if(!card.__xgDocId&&docId)card.__xgDocId=docId;const merged=[];for(const item of card.__xgSources||[])if(item?.url&&!merged.some(x=>x.url===item.url))merged.push(item);for(const item of sources)if(!merged.some(x=>x.url===item.url))merged.push(item);card.__xgSources=merged;card.__xgSourceFingerprint=fingerprint;return card}
  function geometry(g,wallTops){if(!g?.isConnected)return null;const q=styleGeom(g),wall=g.parentElement?.classList?.contains('__xbg_masonry')?g.parentElement:null;if(q&&wall){let wt=wallTops.get(wall);if(wt==null){gifRead();wt=wall.getBoundingClientRect().top;wallTops.set(wall,wt)}const top=wt+q.t;return {top,bottom:top+q.h,height:q.h}}gifRead();const r=g.getBoundingClientRect();return r.width>0&&r.height>0?r:null}
  function strictInside(r,vh){const top=vh*zoneTop,bottom=vh*zoneBottom;return r.top>=top&&r.bottom<=bottom}
  function heldInside(r,vh){const pad=vh*EXIT_HYSTERESIS,top=vh*zoneTop-pad,bottom=vh*zoneBottom+pad;return r.top>=top&&r.bottom<=bottom}
  function scheduleSettle(g,delay){if(!g||settleTimers.has(g))return;settleWaits++;const t=setTimeout(()=>{settleTimers.delete(g);if(enabled&&g?.isConnected)queueZoneUpdate()},Math.max(20,delay));settleTimers.set(g,t)}
function trimColdSurfaces(now,vh){if(now-gifLastTrim<1600)return;gifLastTrim=now;const loaded=[...managed].filter(g=>g?.isConnected&&g.dataset.xgLoaded==='1'&&g.dataset.xgEligible!=='1'&&g.dataset.xgPlay!=='1');if(loaded.length<=24)return;const far=[];for(const g of loaded){const r=g.getBoundingClientRect();if(r.bottom< -2.8*vh||r.top>3.8*vh)far.push({g,d:Math.min(Math.abs(r.bottom),Math.abs(r.top-vh))})}far.sort((a,b)=>b.d-a.d);for(const x of far.slice(0,Math.max(0,loaded.length-24))){resetSurface(x.g,true);gifColdEvictions++}}
  function updateZone(){const __t0=performance.now();gifZoneRuns++;zoneFrame=0;if(!enabled||retrievalQuiet)return;ensureLines();const vh=Math.max(1,innerHeight||document.documentElement.clientHeight||800),now=Date.now(),zoneCenter=vh*(zoneTop+zoneBottom)/2,zoneTopPx=vh*zoneTop,zoneBottomPx=vh*zoneBottom;let nearCount=0;zoneEligible=0;activeNow=0;pausedOutside=0;const info=[],nearInfo=[],wallTops=new Map();const candidates=nearObserver?[...new Set([...nearSet,...[...managed].filter(g=>g?.dataset?.xgSlot==='1')])]:[...managed];for(const g of candidates){if(!g?.isConnected){removeOverlay(g);continue}const r=geometry(g,wallTops);if(!r){g.dataset.xgSlot='0';stopVisible(g);continue}const near=g.dataset.xgNear==='1'||r.bottom>=-vh*IO_MARGIN&&r.top<=vh*(1+IO_MARGIN),strict=near&&strictInside(r,vh),wasSlot=g.dataset.xgSlot==='1',inside=strict||(wasSlot&&heldInside(r,vh));if(near){nearCount++;nearInfo.push({g,r,strict,center:(r.top+r.bottom)/2})}if(!strict&&inside&&wasSlot)boundaryHolds++;if(strict){zoneEligible++;if(!g.__xgProfileEligibleAt)g.__xgProfileEligibleAt=performance.now()}if(inside){if(!g.__xgInsideSince)g.__xgInsideSince=now;const dist=Math.abs((r.top+r.bottom)/2-zoneCenter);info.push({g,r,strict,wasSlot,dist,age:now-g.__xgInsideSince})}else{g.__xgInsideSince=0;g.__xgProfileEligibleAt=0;cancelSettle(g);g.dataset.xgSlot='0';g.dataset.xgEligible='0';if(g.dataset.xgPlay==='1'||g.dataset.xgLoaded==='1')scheduleStop(g);if(near)pausedOutside++}}
    const selected=[],selectedSet=new Set();for(const x of info.filter(x=>x.wasSlot&&x.strict).sort((a,b)=>a.dist-b.dist)){if(selected.length>=MAX_ACTIVE)break;selected.push(x);selectedSet.add(x.g)}for(const x of info.filter(x=>!selectedSet.has(x.g)&&x.strict).sort((a,b)=>a.dist-b.dist)){if(selected.length>=MAX_ACTIVE)break;if(x.age<SETTLE_MS){scheduleSettle(x.g,SETTLE_MS-x.age);continue}selected.push(x);selectedSet.add(x.g);slotStarts++}for(const x of info.filter(x=>!selectedSet.has(x.g)&&x.wasSlot&&!x.strict).sort((a,b)=>a.dist-b.dist)){if(selected.length>=MAX_ACTIVE)break;selected.push(x);selectedSet.add(x.g)}
    const outside=nearInfo.filter(x=>!selectedSet.has(x.g)&&!x.g.__xgSourceError&&!x.g.__xgWarmError),score=x=>{if(x.strict)return -1;if(scrollDir>0&&x.r.top>=zoneBottomPx)return x.r.top-zoneBottomPx;if(scrollDir<0&&x.r.bottom<=zoneTopPx)return zoneTopPx-x.r.bottom;if(scrollDir>0)return 1e6+Math.abs(x.center-zoneBottomPx);if(scrollDir<0)return 1e6+Math.abs(x.center-zoneTopPx);return Math.min(Math.abs(x.r.top-zoneBottomPx),Math.abs(zoneTopPx-x.r.bottom))};outside.sort((a,b)=>score(a)-score(b));const warmTargets=outside.slice(0,WARM_AHEAD),warmSet=new Set(warmTargets.map(x=>x.g));for(const g of currentLoadingCards())if(!selectedSet.has(g)&&!warmSet.has(g)){if(g.__xgLoadKind==='warm'&&performance.now()-(g.__xgNativeStartedAt||0)<240){gifWarmHysteresis++;continue}cancelNativeLoad(g,'stale-zone-load')};
    for(const x of info){const g=x.g,on=selectedSet.has(g),was=g.dataset.xgSlot==='1';g.dataset.xgSlot=on?'1':'0';g.dataset.xgEligible=on?'1':'0';if(on){if(!was)slotPromotions++;cancelSettle(g);playVisible(g)}else{if(g.dataset.xgPlay==='1'||g.dataset.xgLoaded==='1')scheduleStop(g);if(g.dataset.xgNear==='1')pausedOutside++}if(g.dataset.xgPlay==='1'&&g.dataset.xgLoaded==='1'&&g.__xgSurface?.classList.contains(VISIBLE_CLASS))activeNow++}
    for(const x of warmTargets)nativeLoad(x.g,false);trimColdSurfaces(now,vh);gifInvariantSnapshot();slotSelected=selected.length;window.__xgridGifNearCount=nearCount;const __dt=performance.now()-__t0;gifZoneMs+=__dt;gifZoneMax=Math.max(gifZoneMax,__dt)}
  function queueZoneUpdate(){if(zoneFrame||retrievalQuiet||!enabled||document.hidden)return;zoneFrame=requestAnimationFrame(updateZone)}
  let gifScanDue=0;
  function scan(){scanTimer=0;gifScanDue=0;if(retrievalQuiet||!enabled||document.hidden)return;const __t0=performance.now();gifScans++;const key=location.href.split('#')[0];if(key!==pageKey){pageKey=key;docMap.clear();seenScripts=new WeakSet()}refreshDocMap();ensureLines();const cards=[...document.querySelectorAll('.__xbg_masonry>.__xbg_imageonly')];let found=0;for(const card of cards){const g=ensureOverlay(card);if(g){found++;trackGeom(g)}}candidateCards=found;for(const g of [...managed])if(!g.isConnected||!g.matches('.__xbg_masonry>.__xbg_imageonly'))removeOverlay(g);queueZoneUpdate();const __dt=performance.now()-__t0;gifScanMs+=__dt;gifScanMax=Math.max(gifScanMax,__dt)}
  function scheduleScan(delay=50){
    if(retrievalQuiet||!enabled)return;
    const due=performance.now()+Math.max(0,delay);
    if(scanTimer&&gifScanDue<=due)return;
    if(scanTimer)clearTimeout(scanTimer);
    gifScanDue=due;scanTimer=setTimeout(scan,Math.max(0,due-performance.now()));
  }
  function clearAll(){if(scanTimer){clearTimeout(scanTimer);scanTimer=0}gifScanDue=0;if(zoneFrame){cancelAnimationFrame(zoneFrame);zoneFrame=0}nearSet.clear();for(const g of [...managed])removeOverlay(g);managed.clear();activeNow=zoneEligible=pausedOutside=slotSelected=0;removeLines()}
  function setEnabled(v){enabled=!!v;try{localStorage.setItem(GIF_KEY,enabled?'1':'0')}catch(_){}if(enabled){ensureLines();scheduleScan(0)}else clearAll();window.dispatchEvent(new CustomEvent('__xgridGifState',{detail:{enabled}}))}
  function install(){if('IntersectionObserver'in window){nearObserver=new IntersectionObserver(entries=>{for(const e of entries){const g=e.target;if(!managed.has(g))continue;if(e.isIntersecting){nearSet.add(g);g.dataset.xgNear='1'}else{nearSet.delete(g);g.dataset.xgNear='0';g.__xgInsideSince=0;g.dataset.xgSlot='0';g.dataset.xgEligible='0';if(g.dataset.xgPlay==='1'||g.dataset.xgLoaded==='1')scheduleStop(g)}}queueZoneUpdate()},{root:null,rootMargin:(Math.round(Math.max(1,innerHeight||document.documentElement.clientHeight||800)*IO_MARGIN)+'px 0px ')+Math.round(Math.max(1,innerHeight||document.documentElement.clientHeight||800)*IO_MARGIN)+'px 0px',threshold:0})}
    const style=document.createElement('style');style.id='__xgridpro_live_gif_style__';style.textContent=`
      .__xbg_masonry>.__xbg_imageonly{overflow:hidden!important}
      .__xbg_masonry>.__xbg_imageonly>img.__xgridpro_live_gif__{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;z-index:20!important;pointer-events:none!important;object-fit:cover!important;object-position:center!important;display:block!important;visibility:visible!important;opacity:0!important;transform:none!important;background:transparent!important;color:transparent!important;font-size:0!important;image-animation:paused!important}
      .__xbg_masonry>.__xbg_imageonly>img.__xgridpro_live_gif__.__xgridpro_live_visible__{opacity:1!important;image-animation:running!important}
      .__xgridpro_gif_zone_line__{position:fixed!important;left:0!important;right:0!important;top:0!important;height:34px!important;margin-top:-17px!important;z-index:2147483600!important;pointer-events:auto!important;touch-action:none!important;cursor:ns-resize!important;background:linear-gradient(to bottom,transparent 15px,rgba(34,197,94,.96) 15px,rgba(34,197,94,.96) 18px,transparent 18px)!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.38))!important;will-change:transform!important}
      .__xgridpro_gif_zone_line__ .xg-zone-dot{position:absolute!important;top:10px!important;width:14px!important;height:14px!important;border-radius:50%!important;background:#22c55e!important;border:2px solid rgba(255,255,255,.94)!important;box-sizing:border-box!important;box-shadow:0 1px 4px rgba(0,0,0,.45)!important}.xg-zone-left{left:6px!important}.xg-zone-right{right:6px!important}
      .__xgridpro_gif_zone_line__ .xg-zone-label{position:absolute!important;left:50%!important;top:2px!important;transform:translate(-50%,-100%)!important;background:rgba(17,24,39,.90)!important;color:#fff!important;border-radius:8px!important;padding:3px 7px!important;font:700 11px/1.2 sans-serif!important;white-space:nowrap!important;opacity:0!important;pointer-events:none!important}.xg-zone-dragging .xg-zone-label{opacity:1!important}`;if(!document.getElementById(style.id))(document.head||document.documentElement).appendChild(style);if(enabled){ensureLines();scheduleScan(10)}
    const mo=new MutationObserver(records=>{if(!enabled||document.hidden)return;let relevant=false;for(const r of records){if(r.target?.nodeType===1&&r.target.dataset?.xgridSearchBusy==='1')continue;for(const n of r.addedNodes||[]){if(n.nodeType!==1||n.parentElement?.dataset?.xgridSearchBusy==='1'||n.classList?.contains('__xgridpro_gif_zone_line__')||n.classList?.contains(GIF_CLASS)||n.classList?.contains('__xgridpro_hd_image__'))continue;if(n.matches?.('.__xbg_imageonly,script')||n.querySelector?.('.__xbg_imageonly')||(n.tagName==='SCRIPT'&&(n.textContent||'').includes('var m'))){relevant=true;break}}if(relevant)break}if(relevant){mutationScans++;scheduleScan(180)}});mo.observe(document.documentElement,{subtree:true,childList:true});addEventListener('__xgridSearchReordered',()=>{if(!enabled)return;for(const g of managed)if(g?.isConnected){g.__xgGeom=snapshotGeom(g);g.__xgGeomArmed=true}queueZoneUpdate()});addEventListener('scroll',()=>{if(enabled&&!retrievalQuiet){const y=window.scrollY||0,d=y-lastScrollY;if(Math.abs(d)>3)scrollDir=d>0?1:-1;lastScrollY=y;gifScrollEvents++;queueZoneUpdate()}},{passive:true});addEventListener('resize',()=>{if(enabled){for(const g of managed)if(g?.isConnected)g.__xgGeom=snapshotGeom(g);positionLines();queueZoneUpdate()}},{passive:true});addEventListener('visibilitychange',()=>{if(!enabled)return;if(document.hidden){visibilityPauses++;if(zoneFrame){cancelAnimationFrame(zoneFrame);zoneFrame=0}for(const g of managed)if(g?.isConnected)surfaceVisible(g,false)}else if(!retrievalQuiet){ensureLines();scheduleScan(0);queueZoneUpdate()}});addEventListener('__xgridRetrievalQuiet',e=>{retrievalQuiet=!!e.detail?.quiet;if(retrievalQuiet){quietPauses++;if(scanTimer){clearTimeout(scanTimer);scanTimer=0}if(zoneFrame){cancelAnimationFrame(zoneFrame);zoneFrame=0}for(const g of managed)if(g?.isConnected){cancelRetry(g);if(g.dataset.xgLoading==='1')cancelNativeLoad(g,'retrieval-quiet');surfaceVisible(g,false)}}else if(enabled){ensureLines();scheduleScan(40);queueZoneUpdate()}})}
  window.__xgridGifEvidence=card=>{try{if(!card)return {type:'unknown',confidence:0,evidence:'no-card'};const locked=card.__xgLockedSrc||card.__xgNativeSrc||'',surf=card.__xgSurface;if(locked&&knownAnimated(locked))return {type:'gif',confidence:.99,evidence:'gif-locked-source'};if(card.dataset?.xgLoaded==='1'&&surf?.complete&&surf.naturalWidth>0)return {type:'gif',confidence:animatedPseudoSupported&&surf.matches?.(':animated-image')?1:.93,evidence:'gif-ready-surface'};for(const it of card.__xgSources||[])if(knownAnimated(it?.url||it))return {type:'gif',confidence:.94,evidence:'gif-exact-source'};const img=mainImg(card),id=findDocId(card,img);if(id&&docMap.has(id))return {type:'gif',confidence:.78,evidence:'gif-wjd-candidate'};if(filterActive())return {type:'gif',confidence:.96,evidence:'google-animated-filter'};return {type:'unknown',confidence:0,evidence:'unconfirmed'}}catch(_){return {type:'unknown',confidence:0,evidence:'error'}}};
  window.__xgridSetGifEnabled=setEnabled;window.__xgridGetGifEnabled=()=>enabled;
  function sourceCountStats(){const a=[...managed].filter(g=>g?.isConnected).map(g=>(g.__xgSources||[]).length);if(!a.length)return {min:0,median:0,max:0};a.sort((x,y)=>x-y);const m=Math.floor(a.length/2),med=a.length%2?a[m]:(a[m-1]+a[m])/2;return {min:a[0],median:med,max:a[a.length-1]}}
  window.__xgridGifDebug=()=>{const live=[...managed].filter(g=>g?.isConnected),selected=live.filter(g=>g.dataset.xgEligible==='1'),loading=live.filter(g=>g.dataset.xgLoading==='1').length,loaded=live.filter(g=>g.dataset.xgLoaded==='1').length,failed=live.filter(g=>g.__xgSourceError).length;return {
    enabled,totalImages:document.images.length,candidates:candidateCards,managed:live.length,nearViewport:Number(window.__xgridGifNearCount||0),loaded,eager:0,highPriority:selected.length,registeredLifetime,prioritizeCalls:nativeSelectedStarts,sourceChunks:0,failedSources:failed,activePlaying:activeNow,loadOk,loadFail,zoneTopPct:pct(zoneTop),zoneBottomPct:pct(zoneBottom),zoneEligible,pausedOutside,
    selectedLoaded:selected.filter(g=>g.dataset.xgLoaded==='1').length,selectedLoading:selected.filter(g=>g.dataset.xgLoading==='1').length,selectedWarming:0,selectedWaiting:selected.filter(g=>g.dataset.xgLoaded!=='1'&&g.dataset.xgLoading!=='1'&&!g.__xgSourceError).length,selectedRetryWait:selected.filter(g=>retryTimers.has(g)).length,selectedConfirmedFailed:selected.filter(g=>g.__xgSourceError).length,
    preloaded:live.filter(g=>g.dataset.xgLoaded==='1'&&g.dataset.xgEligible!=='1').length,preloadQueued:0,preloadActive:live.filter(g=>g.dataset.xgLoading==='1'&&g.__xgLoadKind==='warm').length,preloadOk,preloadFail,preloadTimeout:0,directStarts,directFallbacks,liveTimeouts:0,lineMoves,boundaryHolds,graceStops,surfaceShows,surfaceCreates,surfaceEvictions,sourceLocks,slotSelected,maxActive:MAX_ACTIVE,slotStarts,settleWaits,slotExhaustions:0,slotPromotions,directDeferred:0,cooldownSkips:0,cooldownRetries:0,softRetryScheduled:0,confirmedFailed:failed,liveRetryAttempts:nativeRetries,zoneWarmSoftFails:0,liveLoadActive:loading,liveLoadLimit:LOAD_LIMIT,zoneWarmActive:live.filter(g=>g.dataset.xgLoading==='1'&&g.__xgLoadKind==='warm').length,zoneWarmLimit:0,zoneWarmStarts:predictiveWarmStarts,zoneWarmOk:preloadOk,zoneWarmFail:preloadFail,zoneWarmTimeout:0,zoneWarmCancels:0,zoneWarmDirectShows:0,zoneWarmInflightPromotions:gifWarmInflightPromotions,warmReadyPromotions:gifWarmReadyPromotions,warmInflightPromotions:gifWarmInflightPromotions,warmReadyEvictions:gifColdEvictions,warmPreloadCancels:0,preconnectCount:0,preconnectOrigins:0,hostBackoffs:0,hostBlockedSkips:0,adaptiveLiveTimeout:0,adaptivePreloadTimeout:0,scrollDir,extensionlessSources:0,sourceCountStats:sourceCountStats(),failureCardsPreload:0,failureCardsZone:0,failureCardsLive:live.filter(g=>(g.__xgLiveFailures||0)>0).length,
    scans:gifScans,chunkAdds:0,chunkDedup:0,seedPasses:0,mutationScans,visibilityPauses,wjdEntries,wjdHits,imgresHits,dataHits,currentHits,identityMisses,identityRejects,geometryMoves,layoutReads:gifLayoutReads,zoneRuns:gifZoneRuns,zoneMs:Number(gifZoneMs.toFixed(2)),zoneMax:Number(gifZoneMax.toFixed(2)),scanMs:Number(gifScanMs.toFixed(2)),scanMax:Number(gifScanMax.toFixed(2)),scrollEvents:gifScrollEvents,queueWaitAvg:0,queueWaitP95:0,loadAvg:loadSamples.length?loadSamples.reduce((a,b)=>a+b,0)/loadSamples.length:0,loadP95:sampleP95(loadSamples),selectedLoadP95:sampleP95(selectedLoadSamples),warmLoadP95:sampleP95(warmLoadSamples),gifSourceCacheHits,gifSourceResolves,gifLineWritesSaved,gifWarmHysteresis,gifReadyReuses,gifColdEvictions,gifStaleCallbacks,zoneDisplayAvg:zoneDisplaySamples.length?zoneDisplaySamples.reduce((a,b)=>a+b,0)/zoneDisplaySamples.length:0,zoneDisplayP95:sampleP95(zoneDisplaySamples),maxAttempts:Math.max(0,...live.map(g=>g.__xgAttemptCount||0)),selectedAttemptLimit:SELECTED_ATTEMPT_LIMIT,warmAttemptLimit:WARM_ATTEMPT_LIMIT,maxSelectedAttempts:Math.max(0,...live.map(g=>g.__xgSelectedAttempts||0)),maxWarmAttempts:Math.max(0,...live.map(g=>g.__xgWarmAttempts||0)),maxCardFailures:Math.max(0,...live.map(g=>g.__xgFailureCount||0)),decodedMP:Number((live.filter(g=>g.__xgSurface?.isConnected&&g.dataset.xgLoaded==='1').reduce((n,g)=>n+(g.__xgSurface.naturalWidth||0)*(g.__xgSurface.naturalHeight||0),0)/1e6).toFixed(2)),activeDecodedMP:Number((live.filter(g=>g.dataset.xgPlay==='1'&&g.__xgSurface?.isConnected&&g.dataset.xgLoaded==='1').reduce((n,g)=>n+(g.__xgSurface.naturalWidth||0)*(g.__xgSurface.naturalHeight||0),0)/1e6).toFixed(2)),
    loaderMode:'XGrid Yellow v28.3.4 BlueBase GIF-only: cached identity, immediate settling warm, stable lines, bounded cold eviction (10 selected + 2 predictive)',retrievalQuiet,quietPauses,nativeAnimSupported,animatedPseudoSupported,nativeStarts,nativeLoaded,nativeErrors,nativeRetries,nativeAnimatedMatches,nativeAnimatedNonMatches,nativeSelectedStarts,nativeNearStarts,nativeLoading:loading,nativeNoTimeouts:false,nativeTimeouts,predictiveWarmStarts,predictiveWarmLimit:WARM_AHEAD,predictiveWarmActive:live.filter(g=>g.dataset.xgLoading==='1'&&g.__xgLoadKind==='warm').length,loadConcurrencyBlocks,loadCancels,concurrencyViolationEvents,maxObservedLoads,maxObservedWarm,concurrencyInvariantViolations:(loading>LOAD_LIMIT||live.filter(g=>g.dataset.xgLoading==='1'&&g.__xgLoadKind==='warm').length>WARM_AHEAD||selected.length>MAX_ACTIVE)?1:0,attemptCapBlocks,deferredRevealWaits,readyRevealShows,scrollDir
  }};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
  addEventListener('_urlchange',()=>setTimeout(()=>{pageKey='';enabled=filterActive()||(!isGoogleHost()&&enabled);if(enabled){ensureLines();scheduleScan(0)}else clearAll();window.dispatchEvent(new CustomEvent('__xgridGifState',{detail:{enabled}}))},60));
  setTimeout(()=>window.dispatchEvent(new CustomEvent('__xgridGifState',{detail:{enabled}})),80);
})();

})();
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install()})();
