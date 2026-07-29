/* =============================== THEMES ===============================
   One engine, two skins. app.js and brokers.js are byte-identical across
   both — the classifier, the statutes and the 581-broker registry do not
   change. Only chrome and voice change.

   DISCIPLINE: humour lives in the chrome. It never touches a safety line.
   "Do not reply", "do not open the link" and every statute citation read
   identically in both themes, because that copy is the product working.
   ===================================================================== */

const THEMES = {

/* ---------------------------------------------------------------- SOLD */
sold: {
  id:"sold",
  name:"Who Sold Me",
  nameHtml:'Who <span class="a">Sold</span> Me',
  tagline:"Paste a spam text. Find out who sold your number — and take it back.",
  emoji:"🔎",
  short:"WhoSoldMe",
  desc:"Paste a spam text. Find out which records leaked your number, why it carries a stranger's name, and get every deletion request written for you. Runs entirely on your device.",
  privacy:"🔒 Runs entirely on your device. Nothing is uploaded, ever.",
  css:{
    bg:"#0b0e13", panel:"#141922", panel2:"#1b212c", line:"#28303d",
    ink:"#e8edf5", dim:"#93a0b4", dimmer:"#6b7688",
    accent:"#5eead4", accent2:"#38bdf8",
    danger:"#f87171", warn:"#fbbf24", ok:"#4ade80",
    font:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    radius:"14px", logoWeight:"800", logoSpacing:"-.02em", logoTransform:"none"
  },
  inputLabel:"The text message",
  inputHint:'Paste it exactly as received, including any "Reply STOP" line and the sign-off.',
  cta:"Trace it →",
  h:{
    what:"What this is",
    first:"Do this first",
    have:"What they actually have on you",
    chain:"How they got to you",
    cut:"Cut it off — in this order",
    report:"Report it — complaint already written",
    receipts:"If it keeps coming — the receipts",
    pack:"Delete yourself at the source",
    details:"Your details — never leaves this device",
    ready:n=>`Your removal pack — ${n} letters ready`,
    tips:"Things that actually work",
    industry:"The industry, in its own numbers"
  },
  badgeScam:"SCAM", badgeComm:"UNWANTED MARKETING",
  packBtn:"Build my removal pack →",
  genBtn:"Generate my letters →",
  buyBtn:p=>`Get the full pack — ${p}`,
  tierFree:"Free", tierPro:"Full Removal Pack",
  statLetters:"deletion demands written",
  statTime:"of manual work skipped (at ~15 min each)",
  statDue:"their statutory deadline to respond",
  statZero:"bytes of your data sent anywhere",
  packLead:"Replying STOP silences one sender. It doesn't remove the record that produced them — the next buyer of that list texts you next month. To stop it properly you have to delete the underlying data, and that means a formal request to each company holding it.",
  packWin:"<b>We write every letter.</b> You fill in your details once. It generates a personalised, legally-formed deletion demand for each broker — citing your state's statute, addressed to that broker's registered privacy contact, with the response deadline calculated. You send them from your own email in a few taps.",
  colBroker:"Broker", colSend:"Send", colDeny:"Denial rate", colFlags:"Flags",
  sendHow:"<b>How to send them.</b> Fastest is <b>Copy all recipients</b> — paste that into the BCC field of one email from your own address, then paste the letter body. One email, every broker, and every reply lands in your inbox."
},

/* ----------------------------------------------------------------- EAT */
eat: {
  id:"eat",
  name:"Eat the Spam",
  nameHtml:'Eat the <span class="a">Spam</span>',
  tagline:"Paste the junk. We'll show you who cooked it — and send it back.",
  emoji:"🍴",
  short:"EatTheSpam",
  desc:"Paste a spam text. Find out which records leaked your number, why it carries a stranger's name, and get every deletion request written for you. Runs entirely on your device.",
  privacy:"🔒 Everything happens on your device. Nothing gets sent to us. Ever.",
  css:{
    bg:"#12100e", panel:"#1c1815", panel2:"#241f1b", line:"#3a322b",
    ink:"#faf6f0", dim:"#b8a898", dimmer:"#877868",
    accent:"#ff8a4c", accent2:"#ffd166",
    danger:"#ff5d5d", warn:"#ffd166", ok:"#8ed081",
    font:'"Avenir Next","Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif',
    radius:"18px", logoWeight:"900", logoSpacing:"-.03em", logoTransform:"none"
  },
  inputLabel:"What did they send you?",
  inputHint:'Paste the whole thing — the "Reply STOP" line and the sign-off are the tastiest bits.',
  cta:"Carve it up →",
  h:{
    what:"What's on the plate",
    first:"Don't swallow this",
    have:"What they've got in the pantry",
    chain:"Where it was cooked",
    cut:"Send it back — in this order",
    report:"Complain to the health inspector",
    receipts:"If they keep serving it — the bill",
    pack:"Clear out the whole kitchen",
    details:"Your details — they never leave this device",
    ready:n=>`Order up — ${n} letters plated`,
    tips:"House rules",
    industry:"The kitchen, by its own numbers"
  },
  badgeScam:"ROTTEN", badgeComm:"UNWANTED SERVING",
  packBtn:"Clear out the kitchen →",
  genBtn:"Plate up my letters →",
  buyBtn:p=>`Order the full menu — ${p}`,
  tierFree:"Small plate", tierPro:"The full menu",
  statLetters:"letters plated and ready",
  statTime:"of tedious form-filling skipped",
  statDue:"when the law says they must answer",
  statZero:"bytes of your data sent anywhere",
  packLead:"Replying STOP sends one plate back. It doesn't empty the kitchen — the recipe is still on file, and whoever buys that list next serves you the same thing in a month. To stop it properly you have to delete the ingredients, and that means a formal request to every kitchen holding them.",
  packWin:"<b>We write every letter.</b> Fill in your details once. You get a personalised, legally-formed deletion demand for each broker — citing your state's statute, addressed to that broker's registered privacy contact, with the deadline already worked out. Send them from your own inbox in a few taps.",
  colBroker:"Kitchen", colSend:"Send it back", colDeny:"Refusal rate", colFlags:"On the label",
  sendHow:"<b>How to send them back.</b> Fastest is <b>Copy all recipients</b> — paste that into the BCC field of one email from your own address, then paste the letter. One email, every kitchen, and every reply lands in your inbox."
}
};

/* Theme selection: ?theme= wins (so both can be compared on one URL),
   otherwise hostname, otherwise the serious one. */
function pickTheme(){
  let q=null;
  try{ q=new URLSearchParams(location.search).get("theme"); }catch(e){}
  if(q && THEMES[q]) { try{localStorage.setItem("spamtrace_theme",q);}catch(e){} return THEMES[q]; }
  const h=(location.hostname||"").toLowerCase();
  if(h.indexOf("eatthespam")===0 || h.indexOf("eat")===0) return THEMES.eat;
  if(h.indexOf("whosoldme")===0) return THEMES.sold;
  let saved=null; try{ saved=localStorage.getItem("spamtrace_theme"); }catch(e){}
  if(saved && THEMES[saved]) return THEMES[saved];
  return THEMES.sold;
}
const T = pickTheme();

/* Paint the theme before first render so there is no flash. */
(function applyTheme(){
  const c=T.css, r=document.documentElement.style;
  r.setProperty("--bg",c.bg); r.setProperty("--panel",c.panel); r.setProperty("--panel2",c.panel2);
  r.setProperty("--line",c.line); r.setProperty("--ink",c.ink); r.setProperty("--dim",c.dim);
  r.setProperty("--dimmer",c.dimmer); r.setProperty("--accent",c.accent); r.setProperty("--accent2",c.accent2);
  r.setProperty("--danger",c.danger); r.setProperty("--warn",c.warn); r.setProperty("--ok",c.ok);
  r.setProperty("--r",c.radius); r.setProperty("--font",c.font);
  r.setProperty("--logoW",c.logoWeight); r.setProperty("--logoS",c.logoSpacing); r.setProperty("--logoT",c.logoTransform);
  document.title = T.name + " — where did they get my number?";
  const mt=document.querySelector('meta[name="theme-color"]'); if(mt) mt.setAttribute("content",c.bg);
  const md=document.querySelector('meta[name="description"]'); if(md) md.setAttribute("content",T.desc);
  const fi=document.querySelector('link[rel="icon"]');
  if(fi) fi.setAttribute("href","data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>"+T.emoji+"</text></svg>");
  const set=(id,html)=>{const e=document.getElementById(id); if(e) e.innerHTML=html;};
  set("logo",T.nameHtml); set("tagline",T.tagline); set("privacyPill",T.privacy);
  set("msgLabel",T.inputLabel); set("msgHint",T.inputHint); set("go",T.cta);
  set("brandName",T.name);
  const mf=document.querySelector('link[rel="manifest"]');
  if(mf) mf.setAttribute("href","manifest-"+T.id+".webmanifest?v=6");
  const ti=document.getElementById("touchIcon");
  if(ti) ti.setAttribute("href","icon-"+T.id+"-192.png");
})();
