/* Kita · SpaceX כיתה ה׳ · app.js (adapted from the Kita site engine) */
(function(){
"use strict";
var LS={get:function(k,d){try{var v=localStorage.getItem(k);return v===null?d:v;}catch(e){return d;}},set:function(k,v){try{localStorage.setItem(k,v);}catch(e){}},del:function(k){try{localStorage.removeItem(k);}catch(e){}}};
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}
function shuffleSeed(arr,seed){var a=arr.slice(),s=seed||1;for(var i=a.length-1;i>0;i--){s=(s*9301+49297)%233280;var j=Math.floor(s/233280*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function rnd(){return (Date.now()%997)+3;}
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
var EMAIL=/^[^@\s]+@[^@\s]+\.[^@\s]+$/, PFX="kitaSpx5";
try{var t=new URLSearchParams(location.search).get("t"); if(t&&EMAIL.test(t)) LS.set(PFX+"Teacher",t);}catch(e){}

/* mobile nav */
var tog=$("#nav-toggle");
if(tog){tog.addEventListener("click",function(){var o=document.body.classList.toggle("nav-open");tog.setAttribute("aria-expanded",o?"true":"false");});}

/* ---------- TTS (he-IL) ---------- */
var TTS={supported:("speechSynthesis" in window)&&("SpeechSynthesisUtterance" in window),voice:null,queue:[],
  pick:function(){if(!TTS.supported)return null;var vs=speechSynthesis.getVoices()||[];for(var i=0;i<vs.length;i++){if(/^he|^iw/i.test(vs[i].lang))return vs[i];}return null;},
  stop:function(){if(!TTS.supported)return;TTS.queue=[];speechSynthesis.cancel();$$(".speaking").forEach(function(e){e.classList.remove("speaking");});},
  speakText:function(items,rate){if(!TTS.supported)return false;TTS.stop();TTS.voice=TTS.pick();TTS.rate=rate||0.95;
    items.forEach(function(it){var txt=(it.text||"").replace(/\s+/g," ").trim();if(!txt)return;var parts=txt.match(/[^.!?:]+[.!?:״]*/g)||[txt];parts.forEach(function(p){p=p.trim();if(p)TTS.queue.push({el:it.el,text:p});});});
    TTS.next();return true;},
  speak:function(blocks,rate){return TTS.speakText(blocks.map(function(b){return {el:b,text:(b.value!==undefined&&b.tagName==="TEXTAREA")?b.value:(b.innerText||b.textContent||"")};}),rate);},
  next:function(){$$(".speaking").forEach(function(e){e.classList.remove("speaking");});var it=TTS.queue.shift();if(!it)return;if(it.el)it.el.classList.add("speaking");
    var u=new SpeechSynthesisUtterance(it.text);u.lang="he-IL";u.rate=TTS.rate||0.95;if(TTS.voice)u.voice=TTS.voice;u.onend=function(){TTS.next();};u.onerror=function(){TTS.next();};speechSynthesis.speak(u);}
};
window.KitaTTS=TTS;
if(TTS.supported&&speechSynthesis.onvoiceschanged!==undefined){speechSynthesis.onvoiceschanged=function(){TTS.voice=TTS.pick();};}
function noteFor(btn){return btn.parentNode.querySelector(".tts-note");}
function ttsMsg(note){if(note)note.textContent=TTS.pick()?"מקריאים... אפשר לעצור בכל רגע.":"מקריאים. אם לא שומעים, ייתכן שאין במכשיר קול בעברית: אפשר להוסיף קול עברית בהגדרות המכשיר, או לנסות Chrome או Edge.";}
function bindTTS(root){
  $$("[data-tts]",root).forEach(function(btn){
    btn.addEventListener("click",function(){
      var note=noteFor(btn);
      if(!TTS.supported){if(note)note.textContent="הדפדפן הזה לא תומך בהקראה. נסו Chrome, Edge או Safari.";return;}
      TTS.speak($$(btn.getAttribute("data-tts")), btn.hasAttribute("data-slow")?0.75:0.95); ttsMsg(note);
    });
  });
  $$("[data-tts-stop]",root).forEach(function(b){b.addEventListener("click",function(){TTS.stop();});});
}
bindTTS(document);
window.addEventListener("beforeunload",function(){TTS.stop();});

/* ---------- print a section ---------- */
function printSel(sel){
  var target=sel==="page"?null:$(sel); var marked=[];
  if(target){target.classList.add("print-me");var p=target.parentElement;while(p&&p!==document.body){p.classList.add("print-path");marked.push(p);p=p.parentElement;}document.body.classList.add("print-one","print-path");}
  setTimeout(function(){window.print();document.body.classList.remove("print-one","print-path");if(target)target.classList.remove("print-me");marked.forEach(function(m){m.classList.remove("print-path");});},60);
}
function bindPrint(root){$$("[data-print]",root).forEach(function(b){b.addEventListener("click",function(){printSel(b.getAttribute("data-print"));});});}
bindPrint(document);

/* ---------- checklists remember state on this device ---------- */
$$("input[data-done]").forEach(function(cb){var k=PFX+"Done:"+cb.getAttribute("data-done");cb.checked=LS.get(k,"")==="1";cb.addEventListener("change",function(){LS.set(k,cb.checked?"1":"");});});

/* ---------- class timer ---------- */
$$(".timer").forEach(function(box){
  var clock=$(".tclock",box),iv=null,left=0;
  function draw(){clock.textContent=Math.floor(left/60)+":"+("0"+left%60).slice(-2);}
  $$("[data-min]",box).forEach(function(b){b.addEventListener("click",function(){clearInterval(iv);left=+b.getAttribute("data-min")*60;draw();
    iv=setInterval(function(){left--;draw();if(left<=0){clearInterval(iv);clock.textContent="⏰ 0:00";box.classList.add("done");}},1000);});});
  var st=$(".tstop",box);if(st)st.addEventListener("click",function(){clearInterval(iv);});
});

/* ---------- quizzes ---------- */
var PRAISE=["כל הכבוד! 🎉","מצוין! ⭐","נכון מאוד! 👏","יפה מאוד! 🌟","בדיוק! 🚀"];
var LEARN=["כמעט! לומדים מזה:","לא נורא, ככה לומדים:","שווה לבדוק שוב:","טוב שניסיתם! הנה הסבר:"];
$$(".quiz[data-quiz]").forEach(function(box){
  var data;try{data=JSON.parse($("#"+box.getAttribute("data-quiz")).textContent);}catch(e){return;}
  var title=box.getAttribute("data-title")||"בוחן", answers=new Array(data.length), score=0, answered=0;
  var progWrap=el("div","progress","<span></span>");var prog=progWrap.firstChild;box.appendChild(progWrap);
  var list=el("ol","qlist");box.appendChild(list);
  data.forEach(function(q,qi){
    var d=el("li","q");d.setAttribute("data-q",qi);
    var order=shuffleSeed(q.o.map(function(_,i){return i;}),(qi+1)*7+data.length);
    var h='<p class="qtext">'+esc(q.q)+'</p><div class="opts">';
    order.forEach(function(oi,k){h+='<button type="button" class="opt" data-o="'+oi+'"><span class="key">'+"אבגד"[k]+'</span>'+esc(q.o[oi])+'</button>';});
    d.innerHTML=h+'</div><div class="fb" role="status" aria-live="polite"></div>';list.appendChild(d);
    $$(".opt",d).forEach(function(btn){btn.addEventListener("click",function(){
      var oi=+btn.getAttribute("data-o"),fb=$(".fb",d);
      $$(".opt",d).forEach(function(b){b.disabled=true;if(+b.getAttribute("data-o")===q.a)b.classList.add("correct");});
      answers[qi]=oi;answered++;
      if(oi===q.a){score++;fb.className="fb show ok";fb.innerHTML="<b>"+PRAISE[qi%5]+"</b> "+esc(q.e);}
      else{btn.classList.add("wrong");fb.className="fb show no";fb.innerHTML="<b>"+LEARN[qi%4]+"</b> התשובה הנכונה: <b>"+esc(q.o[q.a])+"</b>. "+esc(q.e);}
      prog.style.width=(answered/data.length*100)+"%"; if(answered===data.length)finish();
    });});
  });
  var sum=el("div","summary");box.appendChild(sum);
  function finish(){
    var pct=Math.round(score/data.length*100),msg;
    if(pct===100)msg="וואו! ענית/ם נכון על הכול. 🏆";
    else if(pct>=70)msg="עבודה טובה מאוד! קראו את ההסברים לשאלות שהיו קשות, ואפשר לנסות שוב.";
    else if(pct>=40)msg="התחלה טובה! חזרו לטקסט (אפשר גם להאזין לו), קראו את ההסברים ונסו שוב.";
    else msg="זה בסדר לטעות, ככה לומדים! גם ב־SpaceX ניסו כמה פעמים עד שהצליחו. קראו שוב ונסו שוב.";
    var te=LS.get(PFX+"Teacher","");
    sum.innerHTML='<h3>סיכום: '+score+' מתוך '+data.length+'</h3><p>'+msg+'</p>'+
      '<h4>✉️ שליחת התוצאה למורה (לא חובה)</h4><p class="hint">לוחצים על הכפתור, ותוכנת המייל נפתחת עם התוצאה מוכנה. בודקים ולוחצים ״שליחה״. שום מידע לא נשמר באתר.</p>'+
      '<p><label>המייל של המורה<br><input type="email" class="t-email" value="'+esc(te)+'" placeholder="teacher@example.com"></label></p>'+
      '<p><label>שם או כינוי (לא חובה)<br><input type="text" class="s-name" maxlength="40"></label></p>'+
      '<p><a class="btn send-mail" href="#">✉️ פתיחת מייל למורה</a> <button type="button" class="btn ghost retry">🔄 לנסות שוב</button></p>'+
      '<p class="err mail-err" hidden>כדי לשלוח צריך לכתוב את המייל של המורה.</p>';
    sum.classList.add("show");
    $(".retry",sum).addEventListener("click",function(){location.reload();});
    $(".send-mail",sum).addEventListener("click",function(ev){
      var em=$(".t-email",sum).value.trim();
      if(!EMAIL.test(em)){ev.preventDefault();$(".mail-err",sum).hidden=false;return;}
      LS.set(PFX+"Teacher",em);
      var name=$(".s-name",sum).value.trim();
      var lines=["שלום,","","התוצאה שלי ב"+title+":","ציון: "+score+" מתוך "+data.length+" ("+pct+"%)",""];
      data.forEach(function(q,qi){var ok=answers[qi]===q.a;lines.push((qi+1)+". "+(ok?"✓":"✗")+" "+q.q+(ok?"":" (התשובה הנכונה: "+q.o[q.a]+")"));});
      lines.push("","תודה!",name);
      this.href="mailto:"+encodeURIComponent(em)+"?subject="+encodeURIComponent("בוחן SpaceX: "+title+(name?" · "+name:""))+"&body="+encodeURIComponent(lines.join("\n"));
    });
  }
});

/* ---------- class game: "ספירה לאחור" true / myth with a fuel tank ---------- */
$$(".launchgame").forEach(function(box){
  var data=JSON.parse($("#"+box.getAttribute("data-src")).textContent), items=data.slice(), i=0, fuel=0, iv=null;
  var st=$(".statement",box),cnt=$(".gcount",box),cd=$(".countdown",box),ver=$(".verdict",box),lvl=$(".lvl",box),fuelBox=$(".fuel",box),inf=$(".ginfo",box);
  var bStart=$(".g-think",box),bReveal=$(".g-reveal",box),bYes=$(".g-yes",box),bNo=$(".g-no",box),bNext=$(".g-next",box),bRead=$(".g-read",box);
  function setBtns(a){[bStart,bReveal,bYes,bNo,bNext].forEach(function(b){b.hidden=a.indexOf(b)<0;});}
  function draw(){var it=items[i];cnt.textContent="משפט "+(i+1)+" מתוך "+items.length;st.textContent=it.s;cd.textContent="";ver.className="verdict";ver.innerHTML="";inf.textContent="";setBtns([bStart,bReveal]);}
  function fuelUp(){lvl.style.height=Math.round(fuel/items.length*100)+"%";}
  bRead.addEventListener("click",function(){if(TTS.supported){TTS.speakText([{el:st,text:st.textContent}],0.9);}});
  bStart.addEventListener("click",function(){var n=10;clearInterval(iv);cd.textContent="🤔 "+n;bStart.hidden=true;iv=setInterval(function(){n--;cd.textContent=n>0?"🤔 "+n:"✋ מצביעים!";if(n<=0)clearInterval(iv);},1000);});
  bReveal.addEventListener("click",function(){clearInterval(iv);var it=items[i];cd.textContent="";ver.className="verdict show "+(it.t?"t":"f");ver.innerHTML="<b>"+(it.t?"✔ אמת!":"✘ מיתוס!")+"</b> "+esc(it.e);setBtns([bYes,bNo]);});
  bYes.addEventListener("click",function(){fuel++;fuelUp();inf.textContent="⛽ הוספנו דלק לטיל!";setBtns([bNext]);if(i===items.length-1)finish();});
  bNo.addEventListener("click",function(){inf.textContent="לא נורא! ככה לומדים, ממשיכים.";setBtns([bNext]);if(i===items.length-1)finish();});
  bNext.addEventListener("click",function(){i++;draw();});
  function finish(){bNext.hidden=true;var pct=Math.round(fuel/items.length*100);
    var d=el("div","gdone",'🚀 '+(pct>=60?"שלוש, שתיים, אחת... שיגור! ":"הטיל כמעט מוכן! ")+'הכיתה מילאה '+pct+'% מהמכל. <button type="button" class="btn ghost sm g-again">🔄 משחק חדש</button>');d.setAttribute("role","status");box.appendChild(d);
    if(pct>=60)setTimeout(function(){fuelBox.classList.add("launch");},400);
    $(".g-again",d).addEventListener("click",function(){d.remove();fuelBox.classList.remove("launch");i=0;fuel=0;fuelUp();items=shuffleSeed(data,rnd());draw();});}
  box.setAttribute("data-ready","1");draw();
});

/* ---------- sort games ---------- */
$$(".sortgame").forEach(function(box){
  var g=JSON.parse($("#"+box.getAttribute("data-src")).textContent);
  function start(){
    box.innerHTML="";var items=shuffleSeed(g.items.map(function(it){return {t:it[0],b:it[1]};}),rnd());
    var tray=el("div","tray");box.appendChild(tray);var bins=el("div","bins");box.appendChild(bins);var inf=el("p","ginfo");inf.setAttribute("aria-live","polite");box.appendChild(inf);var sel=null,placed=0,right=0;
    items.forEach(function(it){var b=el("button","tile",esc(it.t));b.type="button";it.el=b;b.addEventListener("click",function(){$$(".tile",tray).forEach(function(x){x.classList.remove("sel");});sel=it;b.classList.add("sel");inf.textContent="עכשיו בחרו את הקבוצה המתאימה.";});tray.appendChild(b);});
    g.bins.forEach(function(name,bi){var d=el("div","bin",'<h4>'+esc(name)+'</h4>');d.setAttribute("role","button");d.tabIndex=0;d.setAttribute("aria-label","קבוצה: "+name);
      function drop(){if(!sel){inf.textContent="קודם בוחרים כרטיס.";return;}var ok=sel.b===bi;d.appendChild(el("span","placed "+(ok?"ok":"no"),esc(sel.t)+(ok?" ✓":" ✗ ← "+esc(g.bins[sel.b]))));sel.el.remove();placed++;if(ok)right++;
        inf.textContent=ok?"נכון!":"לא בדיוק. זה שייך ל״"+g.bins[sel.b]+"״.";sel=null;
        if(placed===items.length){var dn=el("div","gdone",'⭐ סיימתם! '+right+' מתוך '+items.length+' במקום הנכון. <button type="button" class="btn ghost sm">🔄 שוב</button>');dn.setAttribute("role","status");box.appendChild(dn);$("button",dn).addEventListener("click",start);}}
      d.addEventListener("click",drop);d.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();drop();}});bins.appendChild(d);});
  }
  start();
});

/* ---------- argument planner (saved only in this browser) ---------- */
var pl=$("#planner");
if(pl){
  var fields=$$("textarea,select",pl);
  fields.forEach(function(f){var k=PFX+"Plan:"+f.id;var v=LS.get(k,"");if(v)f.value=v;f.addEventListener("input",function(){LS.set(k,f.value);});f.addEventListener("change",function(){LS.set(k,f.value);});});
  function text(){var out=[];fields.forEach(function(f){var lab=$('label[for="'+f.id+'"]',pl);var v=(f.value||"").trim();if(v)out.push((lab?lab.textContent.replace(/\s+/g," ").trim()+"\n":"")+v);});return out.join("\n\n");}
  $("#plan-read").addEventListener("click",function(){var note=$("#plan-note");if(!TTS.supported){note.textContent="הדפדפן הזה לא תומך בהקראה.";return;}var t=text();if(!t){note.textContent="עוד לא כתבתם כלום. 🙂";return;}TTS.speakText([{el:null,text:t.replace(/([^.!?:])\n+/g,"$1. ").replace(/\n+/g," ")}],0.95);ttsMsg(note);});
  $("#plan-copy").addEventListener("click",function(){var t=text(),note=$("#plan-note");if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){note.textContent="הועתק! אפשר להדביק במסמך או במייל.";},function(){note.textContent="לא הצלחנו להעתיק. אפשר לסמן ולהעתיק ידנית.";});}else note.textContent="לא הצלחנו להעתיק. אפשר לסמן ולהעתיק ידנית.";});
  $("#plan-clear").addEventListener("click",function(){fields.forEach(function(f){f.value=f.tagName==="SELECT"?f.options[0].value:"";LS.del(PFX+"Plan:"+f.id);});$("#plan-note").textContent="נמחק מהמכשיר הזה.";});
}

/* ---------- teacher gate ---------- */
var gate=$("#teacher-gate");
if(gate){
  var content=$("#teacher-content"),pw=$("#teacher-pw"),err=$("#teacher-err");
  var unlock=function(){
    content.innerHTML=decodeURIComponent(escape(atob($("#teacher-data").textContent.trim())));content.hidden=false;$("#teacher-form").hidden=true;
    try{sessionStorage.setItem(PFX+"TeacherOK","1");}catch(e){}
    var te=$("#teacher-email-set");
    if(te){te.value=LS.get(PFX+"Teacher","");$("#teacher-email-save").addEventListener("click",function(){
      var v=te.value.trim(),out=$("#teacher-link");if(!EMAIL.test(v)){out.textContent="נא לכתוב כתובת מייל תקינה.";return;}
      LS.set(PFX+"Teacher",v);var base=location.href.replace(/teacher\.html.*$/,"");
      out.innerHTML='הקישור לכיתה שלך (המייל ימולא אוטומטית בבחנים):<br><code>'+esc(base+"index.html?t="+encodeURIComponent(v))+'</code>';});}
    bindPrint(content);bindTTS(content);
  };
  $("#teacher-form").addEventListener("submit",function(e){e.preventDefault();if(pw.value.trim()==="1010"){err.hidden=true;unlock();}else{err.hidden=false;pw.value="";pw.focus();}});
  try{if(sessionStorage.getItem(PFX+"TeacherOK")==="1")unlock();}catch(e){}
}
})();
