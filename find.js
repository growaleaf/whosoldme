/* ======================= THE FIND LAYER =======================
   Locating the actual record, not describing the supply chain.

   Measured 2026-07-29/30 by fetching every source below server-side with a
   normal browser UA. Result: 5 of 20 answer a plain request; 15 return a
   Cloudflare bot challenge. We do not bypass bot protection — ever.

   So the sweep runs in the user's own browser, which is the one fetcher that
   is not blocked, is looking up the user's own number, and violates nobody's
   terms. One tap per source. Whatever it finds becomes evidence that the
   deletion letters then CITE — which is the difference between "please delete
   any data you hold about me" and "your page at <url> currently publishes my
   number beside the name <name> and the address <address>; that is false."

   AUTO:true  = returns data to a plain server-side fetch, so this source could
                be automated the moment a server-side endpoint exists.
   AUTO:false = bot-challenged; browser-only by design.
   ============================================================== */

const FIND_SOURCES = [
 {n:"Spokeo",               u:p=>`https://www.spokeo.com/${p.dash}`,                                  rm:"https://www.spokeo.com/optout",                        auto:true,  note:"Published 23 names and 9 addresses against one test number. Highest-yield source found."},
 {n:"ThatsThem",            u:p=>`https://thatsthem.com/phone/${p.dash}`,                             rm:"https://thatsthem.com/optout",                         auto:true,  note:"Shows name, birth year, address and property value. Self-serve removal."},
 {n:"AnyWho",               u:p=>`https://www.anywho.com/phone/${p.plain}`,                           rm:"https://www.anywho.com/help/privacy",                  auto:true,  note:"Independently returned the same street association in testing."},
 {n:"Sync.me",              u:p=>`https://sync.me/search/?number=%2B1${p.plain}`,                     rm:"https://sync.me/optout/",                              auto:true,  note:"Crowd-sourced caller ID — names here come from other people's phone contacts."},
 {n:"Truecaller",           u:p=>`https://www.truecaller.com/search/us/${p.plain}`,                   rm:"https://www.truecaller.com/unlisting",                 auto:true,  note:"Same: names are scraped from uploaded address books. Unlisting is separate from deletion."},
 {n:"TruePeopleSearch",     u:p=>`https://www.truepeoplesearch.com/resultphone?phoneno=${p.plain}`,    rm:"https://www.truepeoplesearch.com/removal",             auto:false, note:"Operates as Free Data Services, LLC — registered California data broker."},
 {n:"FastPeopleSearch",     u:p=>`https://www.fastpeoplesearch.com/${p.plain}`,                        rm:"https://www.fastpeoplesearch.com/removal",             auto:false, note:"One of the most-linked free lookups; removal is quick and self-serve."},
 {n:"Whitepages",           u:p=>`https://www.whitepages.com/phone/1-${p.dash}`,                       rm:"https://www.whitepages.com/suppression-requests",      auto:false, note:"Reported 5,879 deletion requests in 2024, 3.1% denied."},
 {n:"Nuwber",               u:p=>`https://nuwber.com/search/phone?phone=${p.plain}`,                   rm:"https://nuwber.com/removal",                           auto:false, note:"Registered California data broker."},
 {n:"CyberBackgroundChecks",u:p=>`https://www.cyberbackgroundchecks.com/phone/${p.plain}`,             rm:"https://www.cyberbackgroundchecks.com/opt-out",        auto:false, note:""},
 {n:"SearchPeopleFree",     u:p=>`https://www.searchpeoplefree.com/phone-lookup/${p.plain}`,           rm:"https://www.searchpeoplefree.com/opt-out",             auto:false, note:""},
 {n:"USPhoneBook",          u:p=>`https://www.usphonebook.com/${p.plain}`,                             rm:"https://www.usphonebook.com/opt-out",                  auto:false, note:""},
 {n:"411.com",              u:p=>`https://www.411.com/phone/1-${p.dash}`,                             rm:"https://www.411.com/privacy/manage",                   auto:false, note:""},
 {n:"Radaris",              u:p=>`https://radaris.com/p/phone/${p.plain}/`,                            rm:"https://radaris.com/control/privacy",                  auto:false, note:"Removal requires clicking a link sent to your email."},
 {n:"ZabaSearch",           u:p=>`https://www.zabasearch.com/phone/${p.plain}`,                        rm:"https://www.zabasearch.com/opt-out",                   auto:false, note:""},
 {n:"PeopleFinders",        u:p=>`https://www.peoplefinders.com/phone/${p.plain}`,                     rm:"https://www.peoplefinders.com/opt-out",                auto:false, note:"Registered California data broker; reported 0% denials in 2024."},
 {n:"Addresses.com",        u:p=>`https://www.addresses.com/phone/${p.plain}`,                         rm:"https://www.addresses.com/opt-out",                    auto:false, note:""},
 {n:"Intelius",             u:p=>`https://www.intelius.com/phone-lookup/${p.plain}/`,                  rm:"https://www.intelius.com/optout",                      auto:false, note:"PeopleConnect group — one opt-out also covers Instant Checkmate and TruthFinder."},
 {n:"BeenVerified",         u:p=>`https://www.beenverified.com/rp/search/?phone=${p.plain}`,           rm:"https://www.beenverified.com/app/optout/search",       auto:false, note:"Reported 31,905 deletion requests in 2024."},
 {n:"MyLife",               u:p=>`https://www.mylife.com/phone/${p.plain}`,                            rm:"https://www.mylife.com/ccpa",                          auto:false, note:"Frequently the hardest to get removed; escalate to the state AG if ignored."}
];

function phoneForms(raw){
  const d=(raw||"").replace(/\D/g,"").replace(/^1(?=\d{10}$)/,"");
  return {plain:d, dash:d.length===10?`${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`:d,
          paren:d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:d, ok:d.length===10};
}

/* Findings live on the device only, keyed to nothing, wiped on demand. */
const FIND_KEY="spamtrace_findings";
function loadFindings(){ try{return JSON.parse(sessionStorage.getItem(FIND_KEY)||"{}");}catch(e){return {};} }
function saveFindings(f){ try{sessionStorage.setItem(FIND_KEY,JSON.stringify(f));}catch(e){} }
function clearFindings(){ try{sessionStorage.removeItem(FIND_KEY);}catch(e){} }

function findingsSummary(){
  const f=loadFindings();
  const listed=Object.entries(f).filter(([k,v])=>v && v.status==="listed");
  const clear=Object.entries(f).filter(([k,v])=>v && v.status==="clear");
  const names=new Set(), addrs=new Set();
  listed.forEach(([k,v])=>{
    (v.names||"").split(/[,;\n]/).map(s=>s.trim()).filter(Boolean).forEach(n=>names.add(n));
    (v.addrs||"").split(/[;\n]/).map(s=>s.trim()).filter(Boolean).forEach(a=>addrs.add(a));
  });
  return {listed, clear, checked:listed.length+clear.length, total:FIND_SOURCES.length,
          names:[...names], addrs:[...addrs]};
}

/* The paragraph that turns a generic demand into a citable one. */
function evidenceParagraph(){
  const s=findingsSummary();
  if(!s.listed.length) return "";
  const L=[];
  L.push("SPECIFIC RECORDS I HAVE LOCATED:");
  s.listed.forEach(([site,v])=>{
    let line=`  - ${site}`;
    if(v.url) line+=` (${v.url})`;
    const bits=[];
    if(v.names) bits.push(`publishes my telephone number beside the name(s): ${v.names}`);
    if(v.addrs) bits.push(`and the address(es): ${v.addrs}`);
    L.push(line+(bits.length?` — ${bits.join(" ")}`:""));
  });
  L.push("");
  L.push("These associations are inaccurate. I have no connection to the names or addresses listed above; "
        +"my telephone number was previously assigned to one or more different subscribers and your records "
        +"have not been updated to reflect reassignment. I am asking you to DELETE the record rather than "
        +"merge or correct it into a profile about me, and not to use it to infer a household, relative or "
        +"associate relationship.");
  return L.join("\n");
}
