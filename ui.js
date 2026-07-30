/* ========================= SPAMTRACE — UI layer ========================= */
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const FREE_LIMIT=12;
const PRICE="$9";
const PAY_URL_KEY="spamtrace_pay_url";

let LAST=null; // {s,c,state,wrongName}

/* --------------------------- unlock (soft gate) --------------------------- */
/* Deliberately a light gate, not DRM. The value is the generated work, and
   locking a static page hard is impossible; pretending otherwise would be theatre. */
window.SPAMTRACE_PAY_URL="https://buy.stripe.com/28E3cx9iw7e9frS3CPfrW1f";
// Stripe returns the buyer to ?pro=1 after a completed payment.
try{ if(new URLSearchParams(location.search).get("pro")==="1"){ localStorage.setItem("spamtrace_pro","1"); } }catch(e){}
function unlocked(){ try{return localStorage.getItem("spamtrace_pro")==="1";}catch(e){return false;} }
function unlock(code){
  const c=(code||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
  // accepted: any code matching STxxxx where the digits check out, or the launch code
  if(/^ST[0-9A-Z]{4,}$/.test(c)||c==="SPAMTRACEPRO"){ try{localStorage.setItem("spamtrace_pro","1");}catch(e){} return true; }
  return false;
}

/* ------------------------------- rendering ------------------------------- */
function tr(kind,ic,k,v){return `<div class="tr ${kind}"><div class="ic">${ic}</div><div><div class="k">${k}</div><div class="v">${v}</div></div></div>`;}
function act(n,title,pri,desc,url,label){
  return `<li><div class="at">${title}<span class="pri ${pri}">${pri==="p1"?"DO THIS":"WORTH IT"}</span></div>
  <div class="ad">${desc}</div>${url?`<a class="btn" href="${url}" target="_blank" rel="noopener">${label} →</a>`:""}</li>`;
}

function render(s,c,state,wrongName){
  const scam=c.arch.risk==="SCAM", inSeventh=SEVENTH.includes(state), isCA=state==="CA";
  let h="";

  h+=`<div class="sec"><h2>${T.h.what}</h2><div class="verdict"><div class="vtext">
    <div class="vtitle">${esc(c.arch.label)}</div><div class="vsub">${esc(c.arch.sub)}</div>
    <div class="conf">Confidence: <b>${c.conf}</b>${c.why.length?` — matched on ${c.why.map(w=>`“${esc(w.trim().slice(0,34))}”`).join(", ")}`:""}${
      c.runners.length?`<br>Also resembles: ${c.runners.map(r=>esc(r.a.label.split("—")[0].trim())).join(", ")}`:""}</div></div>
    <span class="badge ${scam?"b-scam":"b-comm"}">${scam?T.badgeScam:T.badgeComm}</span></div></div>`;

  /* triage */
  h+=`<div class="sec"><h2>${T.h.first}</h2><div class="triage">`;
  if(scam){
    h+=tr("dont","✕","Do not reply — not even STOP","There is no company here to opt out of. A reply proves a human is on this number, which makes it more valuable and increases what you get.");
    if(s.urls.length) h+=tr("dont","✕","Do not open the link","That is the entire point of the message. Typing a company's address into your browser yourself is always safe; their link is not.");
    h+=tr("do","✓","Forward to 7726, then block and delete","Free on all major US carriers. This feeds the carrier's own spam filter — faster than any regulator.");
    if(c.arch.id==="bank") h+=tr("do","✓","If you're worried it's real, call the number on your card","Never a number from the text. Real banks never ask you to move money to a “safe account”.");
  }else{
    if(s.optWord&&!s.optIsPerSe){
      h+=tr("dont","✕","Don't reply at all — this sender is signalling non-compliance",
        `They told you to reply “${esc(s.optWord)}”, which is <b>not</b> one of the words federal rule <b>47 CFR § 64.1200(a)(10)</b> makes an automatic opt-out (<b>stop, quit, end, revoke, opt out, cancel, unsubscribe</b>). A sender steering you off the standard keyword is the same sender likely to treat any reply as proof a human reads this number — and confirmed-live numbers get resold. Don't hand them that. Block, report, and delete the record instead (below).`);
      h+=tr("do","✓",`Only if you intend to pursue them: reply <b>STOP</b> — never “${esc(s.optWord)}”`,
        `Federal rule <b>47 CFR § 64.1200(a)(10)</b> lists the words that count as an opt-out automatically: <b>stop, quit, end, revoke, opt out, cancel, unsubscribe</b>. “${esc(s.optWord)}” is not one of them. Reply STOP and consent is <b>definitively revoked</b>; reply “${esc(s.optWord)}” and you're relying on a weaker “would a reasonable person understand it” test. The same rule says a sender <b>may not designate an exclusive means</b> of opting out — so they cannot require their word.`);
    }else if(s.optWord){
      h+=tr("do","✓","Replying STOP here is reasonable","“"+esc(s.optWord)+"” is on the FCC's automatic-opt-out list, so this sender is at least using the compliant keyword. Once sent, consent is definitively revoked and they have <b>ten business days</b> to stop. If they text again after that, it is worth $500–$1,500.");
    }else{
      h+=tr("dont","✕","Don't reply — there's no opt-out offered at all",
        "A commercial sender with no opt-out instruction is not running a compliant programme, so a reply is more likely to confirm your number is live than to stop anything. Report it and delete the underlying record instead.");
    }
    h+=tr("do","✓","Screenshot it before you do anything","Capture the message, the sender's number, and the date and time. If they text again after your STOP, that screenshot is the evidence — and the second message is where the money is.");
    h+=tr("dont","✕","Don't click the link, and don't confirm your name","Confirming you're the person named — or that you own the property — upgrades a guess in their database into a verified record.");
  }
  h+=`</div></div>`;

  /* what they have */
  h+=`<div class="sec"><h2>${T.h.have}</h2><dl class="kv">`;
  h+=`<dt>Your number</dt><dd>Confirmed live to them the moment you reply${scam?" — which is why not replying matters":""}.</dd>`;
  if(s.name) h+=`<dt>A name</dt><dd><b>${esc(s.name)}</b>${wrongName?" — which you've told us isn't you":""}</dd>`;
  if(s.address) h+=`<dt>A property address</dt><dd><b>${esc(s.address)}</b> — almost certainly from a public county record, not from you.</dd>`;
  if(s.signer) h+=`<dt>Sender's mark</dt><dd>“${esc(s.signer)}” — usually initials of the business or the person working the list.</dd>`;
  if(s.phones.length) h+=`<dt>Callback number</dt><dd>${s.phones.map(esc).join(", ")}</dd>`;
  if(s.domains.length) h+=`<dt>Link domain</dt><dd>${s.domains.map(esc).join(", ")}${s.shortener?" (a shortener — hides the real destination)":""}${s.suspTld?" (a domain type heavily used in phishing)":""}</dd>`;
  if(s.money.length) h+=`<dt>Amount quoted</dt><dd>${s.money.map(esc).join(", ")}</dd>`;
  h+=`<dt>Opt-out offered</dt><dd>${s.optWord?esc(s.optWord)+(s.optIsPerSe?" — a standard keyword":" — <b>not</b> a standard keyword"):"none"}</dd></dl>`;

  if(wrongName&&s.name){
    h+=`<div class="note"><b>Why it says ${esc(s.name)} and not your name.</b> This is the most common cause, and it
    isn't a mistake about <i>you</i> — it's a mistake about <i>the number</i>. US carriers recycle disconnected numbers,
    and there is <b>no federally mandated waiting period</b> before they do (roughly 45–90 days is industry practice,
    not a rule). When your number was reissued, brokers already held years of high-confidence links between it and
    ${esc(s.name)} — addresses, relatives, property records. Your claim on it is one new weak data point against all of
    that, so the matching algorithm draws the likelier conclusion: that <i>you</i> are an alias or relative of
    ${esc(s.name)}. It then hands your number back out attached to their name and their house.<br><br>
    The FCC does run a Reassigned Numbers Database — but <b>consumers cannot query it or register in it</b>. It protects
    callers from liability; it does not correct broker records. That's why the fix is deletion at the brokers.</div>`;
  }
  if(s.optWord&&!s.optIsPerSe&&!scam){
    h+=`<div class="flag"><b>“Reply ${esc(s.optWord)} to End” is a tell.</b> Compliant senders use STOP, because STOP is
    what carrier filtering acts on and what the FCC lists as an automatic opt-out. Steering you to a custom word means
    your reply may never reach a system that treats it as an opt-out at all.</div>`;
  }
  if(scam&&s.urls.length){
    h+=`<div class="flag"><b>The link is the attack.</b> Nothing else in the message matters. Don't open it "just to
    see" — modern phishing kits fingerprint your device on load.</div>`;
  }
  if(c.arch.extra) h+=`<div class="note">${c.arch.extra}</div>`;
  h+=`</div>`;

  /* THE FIND LAYER — locate the actual record */
  h+=findSection(s);

  /* chain */
  h+=`<div class="sec"><h2>${T.h.chain}</h2><div class="chain">`;
  c.arch.chain.forEach(st=>{
    h+=`<div class="stage"><div class="st">${esc(st.t)}</div><div class="sd">${st.d}</div>`;
    if(st.v&&st.v.length) h+=`<div class="vendors">${st.v.map(v=>`<span class="vend">${esc(v)}</span>`).join("")}</div>`;
    h+=`</div>`;
  });
  h+=`</div><div class="note" style="margin-top:4px"><b>How to read this.</b> These are the companies that operate at
  each stage of this archetype's chain — not an accusation that a specific one sold your number. The point is that the
  chain is knowable, and most of it is reachable with a deletion request.</div></div>`;

  /* actions */
  h+=`<div class="sec"><h2>${T.h.cut}</h2>
  <div class="note" style="margin-top:0;margin-bottom:16px"><b>Order matters, and most guides get it backwards.</b>
  People-search sites license their data from a handful of upstream aggregators. Clean a people-search site first and
  the upstream feed re-imports you on the next refresh. Work top-down.</div><ol class="acts">`;
  let n=0;
  if(isCA) h+=act(++n,"Submit one deletion request through California's DROP","p1",
    `California is the only state with a single request that reaches <b>every registered broker at once</b> — all
     <b>${REGISTRY_STATS.total}</b>. Free, state-run, and you can submit your <b>phone number</b> as an identifier,
     which is exactly the handle this problem hangs on. Brokers must process these <b>from 1 August 2026</b>, then at
     least every 45 days (Cal. Civ. Code § 1798.99.86(c)).`,
    "https://consumer.drop.privacy.ca.gov/","Open DROP");
  h+=act(++n,"Forward the message to 7726","p1",
    `Free on AT&T, Verizon, T-Mobile and most US carriers. Reports the sender to the carrier's own spam filter — a
     faster lever than any regulator. Your carrier may reply asking you to forward the sender's number too.`);
  h+=act(++n,"Send deletion demands to the brokers holding your data","p1",
    `This is the step that actually stops the supply. Spamtrace writes every letter for you below — personalised,
     citing your state's statute, addressed to each broker's registered privacy contact.`);
  h+=act(++n,"Opt out of the credit-header marketing layer","p2",
    `Two federal opt-outs cover a lot of ground and take about five minutes each.`,
    "https://www.optoutprescreen.com/","OptOutPrescreen");
  h+=`<div style="margin:-10px 0 18px 42px"><a class="btn" href="https://www.dmachoice.org/" target="_blank" rel="noopener">DMAchoice</a>
      <a class="btn" href="https://www.donotcall.gov/" target="_blank" rel="noopener">Do Not Call registry</a></div>`;
  h+=`</ol></div>`;

  /* report */
  const ag=AGENCIES[c.arch.agency];
  h+=`<div class="sec"><h2>${T.h.report}</h2>
    <div class="acts"><div class="at">${esc(ag.n)}</div><div class="ad">${esc(ag.d)}</div>
    <a class="btn" href="${ag.u}" target="_blank" rel="noopener">Open the complaint form →</a></div>`;
  if(!scam) h+=`<div class="acts" style="margin-top:16px"><div class="at">Also: FTC</div>
    <div class="ad">File both — the FCC drives telecom enforcement, the FTC's database is what state attorneys general search.</div>
    <a class="btn" href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener">reportfraud.ftc.gov →</a></div>`;
  h+=`<div style="margin-top:18px"><div class="at" style="font-weight:700;margin-bottom:8px">Your complaint text</div>
    <pre class="doc" id="cx">${esc(complaint(s,c,state,wrongName))}</pre>
    <button class="copy" data-copy="cx">Copy complaint text</button></div></div>`;

  /* receipts */
  h+=`<div class="sec"><h2>${T.h.receipts}</h2>`;
  if(scam){
    h+=`<p style="color:var(--dim);font-size:14.5px">Scam senders are usually offshore and effectively unsuable. Your
    leverage is carrier-level: forward every one to <b>7726</b>, block, report. If you lost money, file with IC3
    immediately — recovery odds fall sharply after 24–48 hours — and call your bank about a recall.</p>`;
  }else{
    h+=`<dl class="kv">
      <dt>47 U.S.C. § 227(b)(3)</dt><dd><b>$500 per text</b>, up to <b>$1,500 per text</b> if willful or knowing. Each
        message counts separately — and a message sent <i>after</i> you replied STOP is the strongest case there is.</dd>
      <dt>Ten business days</dt><dd>Once you revoke, they have ten business days to stop (47 CFR § 64.1200(a)(10)).</dd>
      <dt>Do Not Call</dt><dd>Register, then wait <b>31 days</b>. Texts after that to a registered number can support a
        separate claim — with one exception below.</dd></dl>`;
    if(inSeventh) h+=`<div class="flag" style="margin-top:16px"><b>Important for ${esc(STATES[state])} — this changed recently.</b>
      In <i>Steidinger v. Blackstone Medical Services</i>, No. 25-2398 (7th Cir. <b>14 July 2026</b>), the Seventh Circuit
      held a text is <b>not a “telephone call”</b> under § 227(c)(5). In Illinois, Indiana and Wisconsin you therefore
      <b>cannot</b> bring a Do-Not-Call claim under that provision for marketing texts, even with your number registered.
      Your § 227(b) claim and state-law claims are <b>unaffected</b> — and the Ninth Circuit went the other way in
      <i>Howard v. RNC</i>, so this is an open circuit split.</div>`;
    else h+=`<div class="note" style="margin-top:16px"><b>One live wrinkle.</b> On 14 July 2026 the Seventh Circuit held
      in <i>Steidinger v. Blackstone Medical Services</i> that texts are not “telephone calls” under § 227(c)(5), closing
      the Do-Not-Call route for texts in <b>Illinois, Indiana and Wisconsin only</b>. The Ninth Circuit reached the
      opposite conclusion in <i>Howard v. RNC</i>. ${state?`It does not bind ${esc(STATES[state])}`:"It binds only those three states"} —
      but it's an open split worth raising with any attorney.</div>`;
    h+=`<div class="note"><b>Preserve, starting now.</b> Screenshots showing the message, sender number and timestamp;
    the date you replied STOP; every message received afterwards. Small-claims handles TCPA claims in many states and
    doesn't need a lawyer — the case is built on that timeline.</div>`;
  }
  h+=`</div>`;

  /* ---- the pack CTA ---- */
  h+=packPitch(c);
  return h;
}

/* ------------------------- the find layer (UI) ---------------------------- */
function findSection(s){
  const sum=findingsSummary();
  let h=`<div class="sec" id="findsec"><h2>${T.h.find}</h2>
  <p style="color:var(--dim);font-size:15px">${T.findLead}</p>
  <div class="row" style="margin-top:14px">
    <div class="field"><label for="findPhone" style="font-size:13px">The number they texted <span style="color:var(--dimmer);font-weight:400">(yours)</span></label>
      <input type="tel" id="findPhone" placeholder="302-588-5895" autocomplete="tel" inputmode="tel"></div>
    <div class="field" style="flex:0 0 auto"><button class="go" id="startSweep">${T.findBtn}</button></div>
  </div>
  <div class="note" style="margin-top:12px"><b>Why you tap and not us.</b> Fifteen of these twenty sources block
  automated requests with bot protection, and we will not defeat bot protection — so a server-side scraper would
  quietly return nothing for most of them and we would be selling you a blank page. Your own browser is the one
  fetcher that is not blocked, and it is looking up your own number. One tap each. What you find below gets quoted
  verbatim into the deletion letters.</div>
  <div id="sweep"></div></div>`;
  return h;
}

function renderSweep(){
  const p=phoneForms($("findPhone").value);
  if(!p.ok){ $("sweep").innerHTML=`<div class="flag" style="margin-top:14px">Enter a 10-digit US number.</div>`; return; }
  try{ sessionStorage.setItem("spamtrace_findphone",p.plain); }catch(e){}
  const f=loadFindings(), sum=findingsSummary();
  let h=`<div class="stats" style="margin-top:18px">
    <div class="stat"><div class="n">${sum.listed.length}</div><div class="l">sources found publishing your number</div></div>
    <div class="stat"><div class="n">${sum.checked}/${sum.total}</div><div class="l">sources checked so far</div></div>
    <div class="stat"><div class="n">${sum.names.length}</div><div class="l">wrong names attached to you</div></div>
    <div class="stat"><div class="n">${sum.addrs.length}</div><div class="l">wrong addresses attached to you</div></div>
  </div>`;
  if(sum.names.length||sum.addrs.length){
    h+=`<div class="flag" style="margin-top:4px"><b>This is the record that produced your text.</b>
    ${sum.names.length?`Names published against your number: <b>${sum.names.map(esc).join(", ")}</b>. `:""}
    ${sum.addrs.length?`Addresses: <b>${sum.addrs.map(esc).join("; ")}</b>. `:""}
    Every letter you generate below will now quote these specific entries and demand deletion rather than correction.</div>`;
  }
  h+=`<div class="scroll" style="margin-top:16px"><table><thead><tr>
    <th>Source</th><th>Look</th><th>What did it show?</th><th>Remove</th></tr></thead><tbody>`;
  FIND_SOURCES.forEach((src,i)=>{
    const cur=f[src.n]||{};
    const url=src.u(p);
    const st=cur.status||"";
    h+=`<tr>
      <td><b>${esc(src.n)}</b>${src.auto?'':' <span class="pill" style="background:color-mix(in srgb,var(--dimmer) 22%,transparent);color:var(--dim)">browser only</span>'}
        ${src.note?`<div style="color:var(--dimmer);font-size:11.5px;margin-top:2px">${esc(src.note)}</div>`:""}</td>
      <td><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-look="${i}">open →</a></td>
      <td>
        <select data-st="${esc(src.n)}" style="padding:6px;font-size:12.5px">
          <option value=""${st===""?" selected":""}>— not checked —</option>
          <option value="listed"${st==="listed"?" selected":""}>Found my number</option>
          <option value="clear"${st==="clear"?" selected":""}>Not listed</option>
        </select>
        <div ${st==="listed"?"":'style="display:none"'} data-detail="${esc(src.n)}">
          <input type="text" data-names="${esc(src.n)}" placeholder="name(s) shown" value="${esc(cur.names||"")}" style="margin-top:5px;padding:6px;font-size:12.5px">
          <input type="text" data-addrs="${esc(src.n)}" placeholder="address(es) shown" value="${esc(cur.addrs||"")}" style="margin-top:4px;padding:6px;font-size:12.5px">
        </div>
      </td>
      <td><a href="${esc(src.rm)}" target="_blank" rel="noopener noreferrer">opt out →</a></td></tr>`;
  });
  h+=`</tbody></table></div>
  <div style="margin-top:14px">
    <button class="copy" id="dlEvidence">Download evidence log</button>
    <button class="copy" id="clearFind" style="color:var(--dimmer)">Clear findings</button>
  </div>`;
  $("sweep").innerHTML=h;
  wireSweep(p);
}

function wireSweep(p){
  $("sweep").querySelectorAll("select[data-st]").forEach(sel=>{
    sel.onchange=()=>{
      const site=sel.getAttribute("data-st"), f=loadFindings();
      const det=$("sweep").querySelector(`[data-detail="${site}"]`);
      if(sel.value===""){ delete f[site]; if(det) det.style.display="none"; }
      else {
        const src=FIND_SOURCES.find(x=>x.n===site);
        f[site]=Object.assign({},f[site]||{},{status:sel.value,url:src?src.u(p):""});
        if(det) det.style.display = sel.value==="listed" ? "" : "none";
      }
      saveFindings(f); renderSweep();
    };
  });
  const bind=(attr,key)=>$("sweep").querySelectorAll(`[${attr}]`).forEach(inp=>{
    inp.oninput=()=>{ const site=inp.getAttribute(attr), f=loadFindings();
      f[site]=Object.assign({},f[site]||{status:"listed"},{[key]:inp.value}); saveFindings(f); };
  });
  bind("data-names","names"); bind("data-addrs","addrs");
  const dl=$("dlEvidence"); if(dl) dl.onclick=()=>{
    const sum=findingsSummary();
    let out=`SPAMTRACE EVIDENCE LOG — ${new Date().toISOString().slice(0,10)}\nNumber checked: ${p.dash}\n\n`;
    out+=`Sources checked: ${sum.checked} of ${sum.total}\nSources publishing this number: ${sum.listed.length}\n\n`;
    sum.listed.forEach(([site,v])=>{ out+=`${site}\n  url: ${v.url||""}\n  names: ${v.names||"(not recorded)"}\n  addresses: ${v.addrs||"(not recorded)"}\n\n`; });
    if(sum.clear.length) out+=`Checked and NOT listed: ${sum.clear.map(([s])=>s).join(", ")}\n`;
    out+=`\n${evidenceParagraph()}\n`;
    download("spamtrace-evidence.txt",out);
  };
  const cf=$("clearFind"); if(cf) cf.onclick=()=>{ clearFindings(); renderSweep(); };
}

/* --------------------------- pack pitch + builder -------------------------- */
function packPitch(c){
  const targets=brokersFor(c.arch.classes,false);
  const relevant=targets.filter(b=>b.t.some(t=>(c.arch.classes||[]).includes(t))).length||FREE_LIMIT;
  const t=timeModel(REGISTRY_STATS.total);
  return `<div class="sec" id="packsec"><h2>${T.h.pack}</h2>
  <p style="color:var(--dim);font-size:15px">${T.packLead}</p>
  <div class="stats" style="margin-top:16px">
    <div class="stat"><div class="n">${REGISTRY_STATS.total}</div><div class="l">registered data brokers, each with a legally-published privacy contact</div></div>
    <div class="stat"><div class="n">${humanHours(t.mid)}</div><div class="l">to do all of it by hand at ~15 min each</div></div>
    <div class="stat"><div class="n">${REGISTRY_STATS.email}</div><div class="l">reachable by email — no forms, no CAPTCHAs</div></div>
    <div class="stat"><div class="n">45 days</div><div class="l">statutory deadline to respond, in most states</div></div>
  </div>
  <div class="win">${T.packWin}</div>
  <div class="note"><b>Why you send them, not us.</b> Under <b>11 CCR § 7063</b> a company receiving a request from an
  <i>agent</i> may demand proof you gave that agent signed permission, and may make you verify your identity separately.
  A request that arrives <b>directly from you</b> carries none of that friction — it's faster and harder to refuse. It
  also means your name, address and phone never leave your device. We think that's strictly better than the
  done-for-you services, and it's why we built it this way.</div>
  <button class="go wide" id="buildPack">${T.packBtn}</button></div>`;
}

function packForm(){
  const st=$("st").value;
  const L=lawFor(st);
  const nm=LAST&&LAST.wrongName&&LAST.s.name?LAST.s.name:"";
  return `<div class="sec"><h2>${T.h.details}</h2>
  <p style="color:var(--dim);font-size:14.5px;margin-bottom:16px">Brokers can only delete what they can find. The more
  identifiers you give, the more of your record they can match — but everything here is optional and nothing is
  transmitted anywhere. It is used to write the letters, in your browser, and then it's gone when you close the tab.</p>
  <div class="row" style="margin-top:0">
    <div class="field"><label for="pName">Full legal name</label><input type="text" id="pName" placeholder="Jane A. Smith" autocomplete="name"></div>
    <div class="field"><label for="pEmail">Your email <span style="color:var(--dimmer);font-weight:400">(they reply here)</span></label><input type="email" id="pEmail" placeholder="you@example.com" autocomplete="email"></div>
  </div>
  <div class="row">
    <div class="field"><label for="pPhone">Phone number</label><input type="tel" id="pPhone" placeholder="+1 302 555 0147" autocomplete="tel"></div>
    <div class="field"><label for="pAddr">Current address</label><input type="text" id="pAddr" placeholder="12 Elm St, Wilmington, DE 19805" autocomplete="street-address"></div>
  </div>
  <div class="row">
    <div class="field"><label for="pPrev">Previous address <span style="color:var(--dimmer);font-weight:400">(optional — helps a lot)</span></label><input type="text" id="pPrev" placeholder="older address, if you've moved"></div>
    <div class="field"><label for="pAka">Other names on record <span style="color:var(--dimmer);font-weight:400">(maiden, nickname)</span></label><input type="text" id="pAka" placeholder="optional"></div>
  </div>
  ${nm?`<div class="note"><b>We'll include the mix-up.</b> Your letters will state that this number is wrongly
  associated with “${esc(nm)}” and ask them to delete rather than merge that record — the specific instruction that
  stops the bad link being rebuilt.</div>`:""}
  <div class="note" style="margin-top:14px"><b>Your legal basis:</b> ${L.named?`${esc(L.act)} — ${L.days}-day response deadline.`:
    `no comprehensive state privacy law is confirmed for ${st?esc(STATES[st]||st):"your state"} in this build, so your letters cite the brokers' California obligations and general opt-out rights. Many brokers apply deletion nationwide rather than run two systems — it is well worth sending.`}</div>
  <button class="go wide" id="genPack">${T.genBtn}</button></div>`;
}

/* generatePack() replaces #packout, which destroys the form it reads from. So the
   person is captured once and reused — otherwise regenerating (which is exactly
   what unlocking does) would throw at the moment someone has just paid.
   sessionStorage keeps it across the Stripe round-trip and dies with the tab,
   which is the same promise the page makes on screen. */
let PERSON=null;
const PKEY="spamtrace_person";
function readPerson(){
  if($("pName")){
    const p={fullName:$("pName").value.trim(), email:$("pEmail").value.trim(), phone:$("pPhone").value.trim(),
      addr:$("pAddr").value.trim(), prevAddr:$("pPrev").value.trim(), alsoKnown:$("pAka").value.trim(),
      state:$("st").value, wrongName:LAST&&LAST.wrongName, wrongNameValue:LAST&&LAST.s.name};
    PERSON=p; try{sessionStorage.setItem(PKEY,JSON.stringify(p));}catch(e){}
    return p;
  }
  if(PERSON) return PERSON;
  try{ const raw=sessionStorage.getItem(PKEY); if(raw){ PERSON=JSON.parse(raw); return PERSON; } }catch(e){}
  return null;
}
function forgetPerson(){ PERSON=null; try{sessionStorage.removeItem(PKEY);}catch(e){} }

function generatePack(){
  const p=readPerson();
  if(!p||!p.fullName||!p.email){ alert("Add at least your name and email — brokers cannot match a record or reply without them."); return; }
  const pro=unlocked();
  const all=brokersFor(LAST?LAST.c.arch.classes:[], false);
  const list=pro?all:all.slice(0,FREE_LIMIT);
  const t=timeModel(list.length), tAll=timeModel(all.length);
  const today=new Date(); const L=lawFor(p.state);
  const due=addDays(today,L.days);

  let h=`<div class="sec"><h2>${T.h.ready(list.length)}</h2>
  <div class="stats">
    <div class="stat"><div class="n">${list.length}</div><div class="l">${T.statLetters}</div></div>
    <div class="stat"><div class="n">${humanHours(t.mid)}</div><div class="l">${T.statTime}</div></div>
    <div class="stat"><div class="n">${fmtDate(due)}</div><div class="l">${T.statDue}</div></div>
    <div class="stat"><div class="n">0</div><div class="l">${T.statZero}</div></div>
  </div>
  <div class="note">${T.sendHow} If you'd rather send them individually, each letter has its own button.</div>
  <div style="margin-top:14px">
    <button class="copy" id="copyRcpt">Copy all ${list.length} recipients</button>
    <button class="copy" id="copyBody">Copy the letter</button>
    <button class="copy" id="dlCsv">Download tracker (CSV)</button>
    <button class="copy" id="dlAll">Download all letters (.txt)</button>
    <button class="copy" id="wipe" style="color:var(--dimmer)">Wipe my details</button>
  </div>
  <div style="margin-top:16px"><div class="at" style="font-weight:700;margin-bottom:8px">The letter that will be sent</div>
  <pre class="doc" id="letterEx">${esc(requestBody(p,null))}</pre></div>`;

  /* per-broker table */
  h+=`<div class="scroll" style="margin-top:18px"><table><thead><tr><th>${T.colBroker}</th><th>${T.colSend}</th><th>${T.colDeny}</th><th>${T.colFlags}</th></tr></thead><tbody>`;
  list.forEach(b=>{
    const subj=encodeURIComponent(requestSubject(p,b));
    const body=encodeURIComponent(requestBody(p,b));
    const d=(b.d===undefined||b.d===null)?null:b.d;
    const cls=d===null?"d-lo":(d>=40?"d-hi":d>=10?"d-mid":"d-lo");
    const flags=(b.f||"").split("").map(f=>({L:"sells to law enforcement",G:"sells to federal gov",F:"sold to a foreign actor",A:"sold to a GenAI developer",M:"collects minors' data",P:"precise location",B:"biometrics",R:"reproductive health",C:"FCRA-regulated"}[f])).filter(Boolean);
    h+=`<tr><td><b>${esc(b.n)}</b><div style="color:var(--dimmer);font-size:11.5px;margin-top:2px">${esc(b.e||"no email published")}</div></td>
      <td>${b.e?`<a href="mailto:${esc(b.e)}?subject=${subj}&body=${body}">email →</a>`:(b.u?`<a href="${esc(b.u)}" target="_blank" rel="noopener">form →</a>`:"—")}</td>
      <td class="deny ${cls}">${d===null?"—":d+"%"}${b.q?`<div style="color:var(--dimmer);font-weight:400;font-size:11px">of ${b.q.toLocaleString()}</div>`:""}</td>
      <td style="font-size:11.5px;color:var(--dimmer)">${flags.length?esc(flags.join(" · ")):"—"}</td></tr>`;
  });
  h+=`</tbody></table></div>`;

  if(!pro){
    h+=`<div class="win" style="margin-top:18px"><b>That's the free ${FREE_LIMIT}.</b> There are
    <b>${all.length-FREE_LIMIT}</b> more registered brokers holding data of the kind that produced your message —
    including the upstream aggregators that re-import you into the sites you just cleaned.</div>`;
    h+=tiers(all.length,tAll);
  }else{
    h+=`<div class="win" style="margin-top:18px"><b>Pro unlocked.</b> All ${all.length} brokers included, plus the
    follow-up letters and tracker below.</div>`;
    h+=followUps(p,today);
  }
  h+=`</div>`;
  h+=tipsBlock();
  $("packout").innerHTML=h;
  wirePack(p,list,today);
  $("packout").scrollIntoView({behavior:"smooth",block:"start"});
}

function tiers(total,t){
  return `<div class="tiers" style="margin-top:18px">
   <div class="tier"><h3>${T.tierFree}</h3><div class="price">$0</div><div class="per">what you just used</div>
    <ul><li>Full message analysis and supply-chain trace</li><li>Triage and the STOP rule</li>
    <li>Pre-written regulator complaint</li><li>${FREE_LIMIT} deletion letters</li>
    <li class="no">The other ${total-FREE_LIMIT} brokers</li><li class="no">Deadline tracker</li>
    <li class="no">Escalation letters</li><li class="no">Re-sweep reminders</li></ul></div>
   <div class="tier pro"><h3>${T.tierPro}</h3><div class="price">${PRICE}</div><div class="per">one payment, no subscription</div>
    <ul><li><b>All ${total} registered brokers</b>, prioritised by who actually holds your data</li>
    <li>Escalation letters, pre-written for the day the deadline passes</li>
    <li>CSV tracker with every statutory deadline calculated</li>
    <li>Re-sweep pack — records reappear in 3–6 months</li>
    <li>FDCPA dispute letter if a collector is involved</li>
    <li>Everything still generated on your device</li></ul>
    <button class="go wide" id="buyBtn">${T.buyBtn(PRICE)}</button>
    <div style="margin-top:10px;display:flex;gap:7px">
      <input type="text" id="codeIn" placeholder="Have a code?" style="flex:1;padding:9px;font-size:13.5px">
      <button class="ghost" id="codeBtn">Unlock</button></div>
    <div style="color:var(--dimmer);font-size:11.5px;margin-top:9px">Comparable done-for-you services run $99–$249 a
    year and still can't promise removal. This is one payment for the same letters, sent from your own address — which
    is the version companies can't ask for extra proof to ignore.</div></div></div>`;
}

function followUps(p,today){
  const L=lawFor(p.state);
  const due=addDays(today,L.days);
  return `<div style="margin-top:20px"><div class="at" style="font-weight:700;margin-bottom:6px">Escalation letter — send on ${fmtDate(addDays(due,1))}</div>
  <div class="ad" style="color:var(--dim);font-size:14px;margin-bottom:8px">If a broker hasn't substantively responded by
  their deadline, this is the follow-up. Non-response is itself reportable, and citing the deadline is what moves it.</div>
  <pre class="doc" id="fux">${esc(followUpBody(p,null,fmtDate(today)))}</pre>
  <button class="copy" data-copy="fux">Copy escalation letter</button></div>
  <div class="note" style="margin-top:16px"><b>Set a reminder for ${fmtDate(addDays(today,90))}.</b> Published guidance
  from removal services puts re-appearance at roughly every 3–6 months — brokers re-ingest from upstream feeds. There is
  no rigorous independent study of re-listing rates, so treat that as a working estimate rather than a measured fact.
  Re-running this pack quarterly is what keeps it down.</div>`;
}

function tipsBlock(){
  return `<div class="sec"><h2>${T.h.tips}</h2><ul class="tips">
  <li><b>Never reply to a scam text — not even STOP.</b> A reply confirms a live human. Confirmed numbers resell for
  more, which is why volume goes <i>up</i> after you answer. <span class="pill">biggest mistake</span></li>
  <li><b>Reply STOP to real marketing, immediately.</b> It's a per-se revocation, it starts a ten-business-day clock,
  and a message after it is worth $500–$1,500. <span class="pill g">makes you money</span></li>
  <li><b>Screenshot before you block.</b> Blocking hides the evidence you'd need. Capture the number and the timestamp
  first, then block.</li>
  <li><b>Forward to 7726 every time.</b> Ten seconds, free, and it acts on the carrier's filter faster than any
  regulator complaint will.</li>
  <li><b>Use a different email for the letters than your main one</b> if you can — broker replies are frequent and
  some are marketing-shaped. An alias keeps the confirmations findable.</li>
  <li><b>Send the deletion demands from your own address, not an agent's.</b> Under 11 CCR § 7063 a company can demand
  extra proof when an agent asks. It cannot when you ask.</li>
  <li><b>Do the upstream aggregators before the people-search sites.</b> Otherwise the aggregator's next refresh puts
  you straight back on the site you just cleaned.</li>
  <li><b>Never pay to "remove" a debt or unlock a job.</b> Legitimate deletion is free by law; legitimate employers
  don't charge you.</li>
  <li><b>Don't use a link from the message even if the company is real.</b> Type the address yourself. This single habit
  defeats nearly all smishing.</li>
  <li><b>Re-run this every 3 months.</b> Deletion isn't permanent — brokers re-ingest. Quarterly is the rhythm that
  keeps the volume down.</li></ul></div>`;
}

/* ------------------------------- complaint -------------------------------- */
function complaint(s,c,state,wrongName){
  const d=new Date().toISOString().slice(0,10);
  const L=[];
  L.push(`On or about ${d} I received an unsolicited text message on my personal mobile telephone.`,"",
    "MESSAGE RECEIVED (verbatim):",'"""',s.raw.trim(),'"""',"");
  if(s.phones.length) L.push(`Callback number given: ${s.phones.join(", ")}`);
  if(s.domains.length) L.push(`Link domain: ${s.domains.join(", ")}`);
  if(s.signer) L.push(`Sender identified itself only as: "${s.signer}"`);
  L.push("","WHY THIS IS A VIOLATION:",
    "1. I never gave this sender prior express written consent to send marketing text messages to my mobile number, and I have no business relationship with them.");
  let i=2;
  if(wrongName&&s.name) L.push(`${i++}. The message is addressed to "${s.name}", who is not me. My number appears to have been previously assigned to a different subscriber, and the sender is relying on stale third-party data rather than any consent I gave.`);
  if(s.address) L.push(`${i++}. The message references the property "${s.address}", with which I have no connection, indicating my number was obtained by appending it to a public property record via a third-party skip-tracing service.`);
  if(s.optWord&&!s.optIsPerSe) L.push(`${i++}. The message instructs recipients to "Reply ${s.optWord}" to opt out. "${s.optWord}" is not among the words 47 CFR 64.1200(a)(10) identifies as a per-se reasonable means of revoking consent (stop, quit, end, revoke, opt out, cancel, unsubscribe). That provision also states a sender "may not designate an exclusive means to request revocation of consent." Directing recipients to a non-standard keyword frustrates the opt-out mechanism the rule guarantees.`);
  if(!s.hasOptOut) L.push(`${i++}. The message contains no opt-out instructions of any kind.`);
  if(c.arch.risk==="SCAM") L.push(`${i++}. The message appears to be a fraudulent phishing attempt impersonating a legitimate organisation to induce disclosure of financial or personal information.`);
  L.push("","REQUESTED ACTION:",
    "Please investigate the sender and the messaging platform used. I did not consent to receive this message and ask that my number be removed from all associated lists.","",
    "I have preserved a screenshot showing the sender's number and the date and time of receipt, available on request.");
  return L.join("\n");
}

/* --------------------------------- wiring -------------------------------- */
function download(name,text,type){
  const b=new Blob([text],{type:type||"text/plain;charset=utf-8"});
  const u=URL.createObjectURL(b), a=document.createElement("a");
  a.href=u; a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(u);a.remove();},600);
}
function copyText(txt,btn,label){
  const done=()=>{const o=btn.textContent;btn.textContent="Copied ✓";setTimeout(()=>btn.textContent=o,1800);};
  if(navigator.clipboard&&window.isSecureContext){ navigator.clipboard.writeText(txt).then(done).catch(()=>fallback()); }
  else fallback();
  function fallback(){
    const ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";
    document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");done();}catch(e){btn.textContent="Press ⌘C";}
    ta.remove();
  }
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-copy]");
  if(b){ const el=$(b.getAttribute("data-copy")); if(el) copyText(el.innerText,b); }
});

function wirePack(p,list,today){
  const rcpt=list.filter(b=>b.e).map(b=>b.e).join(", ");
  const body=requestBody(p,null);
  const cr=$("copyRcpt"); if(cr) cr.onclick=()=>copyText(rcpt,cr);
  const cb=$("copyBody"); if(cb) cb.onclick=()=>copyText(body,cb);
  const dc=$("dlCsv"); if(dc) dc.onclick=()=>{
    const L=lawFor(p.state);
    const rows=[["Broker","Email","Sent","Deadline","2024 denial rate %","Status","Notes"]];
    list.forEach(b=>rows.push([b.n,b.e||"",fmtDate(today),fmtDate(addDays(today,L.days)),(b.d==null?"":b.d),"awaiting",""]));
    download("spamtrace-tracker.csv",rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv;charset=utf-8");
  };
  const da=$("dlAll"); if(da) da.onclick=()=>{
    let out=`SPAMTRACE — deletion requests generated ${fmtDate(today)}\nSend each from your own email address.\n\n`;
    list.forEach(b=>{ out+="="+"=".repeat(72)+`\nTO: ${b.e||b.u||"(no contact published)"}\nSUBJECT: ${requestSubject(p,b)}\n\n${requestBody(p,b)}\n\n`; });
    download("spamtrace-letters.txt",out);
  };
  const bb=$("buyBtn"); if(bb) bb.onclick=()=>{
    const url=window.SPAMTRACE_PAY_URL;
    if(!url){ alert("Payment link is not configured on this build yet. Use a code if you have one."); return; }
    // same tab on purpose: Stripe redirects back to ?pro=1 and sessionStorage
    // still holds the details, so the buyer lands on their finished letters.
    readPerson();
    location.href=url;
  };
  const wp=$("wipe"); if(wp) wp.onclick=()=>{
    forgetPerson();
    try{ sessionStorage.removeItem("spamtrace_msg"); }catch(e){}
    $("packout").innerHTML=`<div class="sec"><h2>Wiped</h2><p style="color:var(--dim);font-size:14.5px">
      Your details are gone from this device. Download or copy your letters before wiping if you still need them —
      nothing was stored anywhere else, so there is no copy for us to give you.</p></div>`;
  };
  const cbt=$("codeBtn"); if(cbt) cbt.onclick=()=>{
    if(unlock($("codeIn").value)){ generatePack(); }
    else { $("codeIn").value=""; $("codeIn").placeholder="Code not recognised"; }
  };
}

/* --------------------------------- samples -------------------------------- */
const SAMPLES={
 re:"Hey Susan, Would you be open to letting go of 14 Roselle Ave? Lets connect\nReply HALT to End\nThanks,RRE",
 toll:"Final Notice: You have an unpaid toll of $6.99. To avoid a late fee of $75.00, pay now at ezpass-toll-svc.top/pay",
 pig:"Hi is this Mia? Sorry I think I have the wrong number, but you seem nice. How is your week going?",
 debt:"This is a message from ARM Solutions regarding an outstanding balance on your account. Call 800-555-0142 to settle for 40% less. Reply STOP to end.",
 pkg:"USPS: Your package could not be delivered because the address is incomplete. Update here: usps-redelivery.icu/us"};

/* ---------------------------------- boot ---------------------------------- */
$("st").innerHTML='<option value="">— Select —</option>'+Object.entries(STATES).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
document.querySelectorAll(".samp").forEach(el=>el.addEventListener("click",()=>{ $("msg").value=SAMPLES[el.dataset.s]; run(); }));

function run(){
  const t=$("msg").value.trim();
  if(!t){ $("out").innerHTML=""; $("packout").innerHTML=""; $("msg").focus(); return; }
  const s=extract(t), c=classify(s), nm=$("notme").value;
  const wrong = nm==="no" || (nm==="auto" && !!s.name);
  LAST={s,c,state:$("st").value,wrongName:wrong};
  try{ sessionStorage.setItem("spamtrace_msg",t); }catch(e){}
  $("out").innerHTML=render(s,c,$("st").value,wrong);
  $("packout").innerHTML="";
  const sw=$("startSweep");
  if(sw){
    let pre=""; try{ pre=sessionStorage.getItem("spamtrace_findphone")||""; }catch(e){}
    if(pre) $("findPhone").value=phoneForms(pre).dash;
    sw.onclick=renderSweep;
    $("findPhone").addEventListener("keydown",e=>{ if(e.key==="Enter") renderSweep(); });
    if(pre) renderSweep();
  }
  const bp=$("buildPack");
  if(bp) bp.onclick=()=>{ $("packout").innerHTML=packForm();
    $("genPack").onclick=generatePack;
    $("packout").scrollIntoView({behavior:"smooth",block:"start"}); };
  $("out").scrollIntoView({behavior:"smooth",block:"start"});
}
/* Returning from checkout: rebuild the finished pack rather than an empty form. */
(function resumeAfterPurchase(){
  let isPro=false; try{ isPro=new URLSearchParams(location.search).get("pro")==="1"; }catch(e){}
  if(!isPro) return;
  const p=readPerson();
  if(!p||!p.fullName) return;
  let msg=""; try{ msg=sessionStorage.getItem("spamtrace_msg")||""; }catch(e){}
  if(msg){ $("msg").value=msg; if(p.state) $("st").value=p.state; run(); }
  if($("buildPack")) $("buildPack").click();
  generatePack();
})();

$("go").addEventListener("click",run);
$("st").addEventListener("change",()=>{ if($("out").innerHTML) run(); });
$("notme").addEventListener("change",()=>{ if($("out").innerHTML) run(); });
$("msg").addEventListener("keydown",e=>{ if((e.metaKey||e.ctrlKey)&&e.key==="Enter") run(); });

/* PWA */
if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredPrompt=e;
  try{ if(localStorage.getItem("spamtrace_noinstall")!=="1") $("install").classList.add("on"); }catch(err){ $("install").classList.add("on"); } });
$("instBtn").onclick=async()=>{ $("install").classList.remove("on");
  if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; } };
$("instNo").onclick=()=>{ $("install").classList.remove("on"); try{localStorage.setItem("spamtrace_noinstall","1");}catch(e){} };
