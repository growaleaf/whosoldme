/* ==========================================================================
   SPAMTRACE — engine
   Everything runs on the device. Nothing is transmitted. No cookies, no beacons.
   ========================================================================== */

/* ---------------------------------- law ---------------------------------- */
const PER_SE = ["stop","quit","end","revoke","opt out","optout","cancel","unsubscribe"];
const SHORTENERS = /\b(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rb\.gy|cutt\.ly|shorturl|tiny\.cc|lnkd\.in)\b/i;
const SUSP_TLD = /^(top|xyz|icu|cyou|rest|click|link|shop|vip|cfd|sbs|bond|monster|buzz|lol|live|world|today|info|online|site|store|fun|space|website|life|ru|cn|tk|ml|ga|cf|gq)$/i;

/* States with a comprehensive privacy law giving a deletion right that is
   verified in this build. Conservative on purpose: only entries confirmed at a
   primary source ship with a statute cite; everything else falls back to the
   generic route rather than inventing a citation. */
const STATE_LAW = {
  CA:{n:"California", act:"the California Consumer Privacy Act (Cal. Civ. Code § 1798.105)", days:45, ext:45, drop:true},
  VA:{n:"Virginia",   act:"the Virginia Consumer Data Protection Act", days:45, ext:45},
  CO:{n:"Colorado",   act:"the Colorado Privacy Act", days:45, ext:45},
  CT:{n:"Connecticut",act:"the Connecticut Data Privacy Act", days:45, ext:45},
  UT:{n:"Utah",       act:"the Utah Consumer Privacy Act", days:45, ext:45},
  TX:{n:"Texas",      act:"the Texas Data Privacy and Security Act", days:45, ext:45},
  OR:{n:"Oregon",     act:"the Oregon Consumer Privacy Act", days:45, ext:45},
  MT:{n:"Montana",    act:"the Montana Consumer Data Privacy Act", days:45, ext:45},
  DE:{n:"Delaware",   act:"the Delaware Personal Data Privacy Act", days:45, ext:45},
  IA:{n:"Iowa",       act:"the Iowa Consumer Data Protection Act", days:90, ext:45},
  NE:{n:"Nebraska",   act:"the Nebraska Data Privacy Act", days:45, ext:45},
  NH:{n:"New Hampshire", act:"the New Hampshire Data Privacy Act", days:45, ext:45},
  NJ:{n:"New Jersey", act:"the New Jersey Data Privacy Act", days:45, ext:45},
  TN:{n:"Tennessee",  act:"the Tennessee Information Protection Act", days:45, ext:45},
  MN:{n:"Minnesota",  act:"the Minnesota Consumer Data Privacy Act", days:45, ext:45},
  MD:{n:"Maryland",   act:"the Maryland Online Data Privacy Act", days:45, ext:45},
  IN:{n:"Indiana",    act:"the Indiana Consumer Data Protection Act", days:45, ext:45},
  KY:{n:"Kentucky",   act:"the Kentucky Consumer Data Protection Act", days:45, ext:45},
  RI:{n:"Rhode Island", act:"the Rhode Island Data Transparency and Privacy Protection Act", days:45, ext:45}
};
const STATES = {AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};
const SEVENTH = ["IL","IN","WI"];

/* ------------------------------- extraction ------------------------------ */
function extract(t){
  const s={raw:t, lower:t.toLowerCase()};
  s.urls=[...t.matchAll(/\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9][a-z0-9-]*\.[a-z]{2,}\/[^\s<>"']*)/gi)].map(m=>m[1]);
  s.domains=s.urls.map(u=>{try{return new URL(u.startsWith("http")?u:"https://"+u).hostname.replace(/^www\./,"");}catch(e){return u.split("/")[0];}});
  s.phones=[...t.matchAll(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g)].map(m=>m[0].trim());
  s.money=[...t.matchAll(/\$\s?[\d,]+(?:\.\d{2})?/g)].map(m=>m[0]);
  const sfx="(?:ave|avenue|st|street|rd|road|dr|drive|ln|lane|ct|court|blvd|boulevard|way|pl|place|ter|terrace|cir|circle|pkwy|parkway|hwy|trl|trail)";
  const am=t.match(new RegExp("\\b(\\d{1,6}\\s+(?:[A-Z][A-Za-z'-]*\\s+){0,4}"+sfx+")\\b","i"));
  s.address=am?am[1].trim():null;
  const gm=t.match(/\b(?:[Hh][Ii]|[Hh][Ee][Yy]|[Hh][Ee][Ll][Ll][Oo]|[Gg]ood\s+(?:[Mm]orning|[Aa]fternoon|[Ee]vening))[,!\s]+([A-Z][a-z]{1,15})\b/)
         ||t.match(/^\s*([A-Z][a-z]{1,15})\s*[,!]\s+(?:are|do|would|is|this|i|we|just|quick)\b/);
  s.name=gm?gm[1]:null;
  if(s.name&&/^(there|again|it|is|this|how|are|hope|just|quick|i|we|you|the|and|good|sorry|congrats|urgent|final|alert|notice)$/i.test(s.name)) s.name=null;
  const sg=t.match(/(?:[Tt]hanks|[Tt]hank you|[Rr]egards|[Bb]est|[Ss]incerely|[Cc]heers|[Ff]rom|-|—)\s*[,:]?\s*\n?\s*([A-Z][A-Za-z&.'\s]{1,28}?)\s*$/);
  s.signer=sg?sg[1].trim():null;
  if(s.signer&&/^(regards|best|you|me|us|now|here|stop|end)$/i.test(s.signer)) s.signer=null;
  const om=t.match(/reply\s+["']?([A-Za-z]{2,12})["']?\s*(?:to|for)\s+(?:end|stop|opt|unsub|cancel|quit|remove|be removed|no more)/i)
        ||t.match(/text\s+["']?([A-Za-z]{2,12})["']?\s+to\s+(?:end|stop|opt out|unsubscribe|cancel)/i)
        ||t.match(/\b(?:reply|text|send)\s+["']?(stop|quit|end|cancel|unsubscribe|optout|opt\s?out)["']?\b/i);
  s.optWord=om?om[1].toUpperCase().replace(/\s+/g,""):null;
  s.hasOptOut=!!s.optWord;
  s.optIsPerSe=s.optWord?PER_SE.includes(s.optWord.toLowerCase()):false;
  s.shortener=SHORTENERS.test(t);
  s.suspTld=s.domains.some(d=>SUSP_TLD.test(d.split(".").pop()));
  s.urgency=/\b(immediately|urgent|final notice|last warning|within 24 hours|today only|expires|act now|avoid (?:a )?(?:penalty|late fee|suspension))\b/i.test(t);
  s.len=t.trim().length;
  return s;
}

/* ------------------------------ archetypes ------------------------------- */
const A=[
{id:"realestate",label:"Real-estate wholesaler — cash-offer solicitation",risk:"COMMERCIAL",classes:["property","skiptrace"],
 sub:"A property investor, not a scammer. They're working a bulk list of property records with phone numbers appended.",
 hits:[[/\b(letting go of|sell(ing)?\s+(your|the)\s+(house|home|property)|cash offer|as[- ]is|off[- ]market|no repairs|close (quickly|fast|in \d+ days)|any condition|buy your (house|home|property)|are you (still )?the owner|interested in selling|open to (selling|an offer)|make you an offer)\b/i,10],
  [/\b(property|house|home|lot|parcel|real estate|acreage)\b/i,3],[/\bwould you be open to\b/i,6],[/\binvestor|we buy\b/i,5]],needAddr:4,
 chain:[{t:"County assessor / recorder — public record",d:"Your name and property address become a public record the moment a deed is filed. Legal, and where the pairing starts.",v:["County assessor","County recorder","Tax rolls"]},
  {t:"Bulk property-data aggregator",d:"Aggregators buy county records nationwide and resell them as filterable lists (\"absentee owner\", \"high equity\", \"pre-foreclosure\").",v:["ATTOM Data","CoreLogic","First American","PropStream","PropertyRadar","Black Knight"]},
  {t:"Skip-trace phone append — where YOUR number entered",d:"The property record has no phone number. A skip-tracing vendor matches the owner against identity graphs built from credit-header, utility and marketing data and appends a phone. This is the step that attaches a phone to a name — and the step that gets it wrong.",v:["BatchData / BatchLeads","REISkip","Skip Genie","TLOxp (TransUnion)","idiCORE","LexisNexis Accurint","Enformion"]},
  {t:"Mass-SMS platform built for this niche",d:"Purpose-built platforms blast the enriched list from rotating 10-digit numbers — which is why blocking one number doesn't stop it.",v:["Launch Control","Smarter Contact","Lead Sherpa","REI Reply","Roor"]},
  {t:"The sender",d:"Usually a small wholesaler or a hired virtual assistant working someone else's list. The initials are often the only identifying mark.",v:[]}],agency:"fcc"},
{id:"debt",label:"Debt collection / debt relief",risk:"COMMERCIAL",classes:["skiptrace"],
 sub:"Collectors are the heaviest users of skip tracing — which is exactly why a recycled number gets caught in it.",
 hits:[[/\b(outstanding balance|past due|delinquen|collection agency|your (account|debt|balance)|settle (your|this)|creditor|original creditor|debt relief|consolidat|charged? off|resolve your account)\b/i,10],[/\b(account|balance|payment plan|reduce|owe)\b/i,3]],
 chain:[{t:"The original account",d:"A defaulted or sold account is the root record. Portfolios are bought and sold in bulk, often several times.",v:["Original creditor","Debt buyers"]},
  {t:"Skip tracing to find the person",d:"When a debtor can't be reached, the collector runs a skip trace. These tools return \"best known\" numbers with a confidence score — including numbers reassigned years ago.",v:["TLOxp (TransUnion)","LexisNexis Accurint","idiCORE","Enformion","Experian","Equifax"]},
  {t:"Dialer / SMS platform",d:"Appended numbers are loaded into an outbound dialer or texting platform.",v:[]}],agency:"cfpb",
 extra:"If this debt isn't yours, you have a separate federal right: under the Fair Debt Collection Practices Act you can send a written dispute and demand validation. Do it in writing, within 30 days of their first contact, and they must stop collection until they validate."},
{id:"toll",label:"Toll-road smishing — this is a scam",risk:"SCAM",classes:[],
 sub:"There is no unpaid toll. The link harvests card details. Sent to numbers in bulk, mostly generated, not bought.",
 hits:[[/\b(e-?zpass|fastrak|sunpass|toll|txtag|peachpass|ipass|good ?to ?go|tolls? by mail)\b/i,12],[/\b(unpaid|outstanding toll|violation|late fee|penalty|final notice)\b/i,5]],
 chain:[{t:"Number generation, not a data leak",d:"Blasted across whole number ranges. In most cases nothing about you leaked — your number was simply in sequence.",v:[]},
  {t:"Overseas SMS gateways / SIM farms",d:"Sent through gateways and hijacked devices that rotate constantly.",v:[]},
  {t:"Phishing kit",d:"A cloned tolling-authority page built to capture card numbers and increasingly one-time passcodes.",v:[]}],agency:"ic3"},
{id:"package",label:"Package-delivery smishing — this is a scam",risk:"SCAM",classes:[],
 sub:"No carrier texts you about an \"incomplete address\" with a link. The link is the payload.",
 hits:[[/\b(usps|ups|fedex|dhl|royal mail|post ?office|parcel|package|shipment|tracking (number|code)|delivery (attempt|failed)|undeliverable|address is incomplete|reschedule (your )?delivery)\b/i,11],[/\b(confirm|update|verify) your (address|details|information)\b/i,5]],
 chain:[{t:"Bulk number lists or generation",d:"Sent to enormous ranges with no personalisation — note there's no real tracking number matching anything you ordered.",v:[]},
  {t:"Phishing kit impersonating a carrier",d:"Harvests address, card and login details. Some variants push a malicious app install.",v:[]}],agency:"uspis"},
{id:"bank",label:"Bank / fraud-alert smishing — this is a scam",risk:"SCAM",classes:[],
 sub:"The most dangerous archetype. Often paired with a call from a spoofed bank number moments later.",
 hits:[[/\b(fraud alert|suspicious (activity|charge|transaction)|did you (attempt|authorize|make)|your (card|account) (has been )?(locked|suspended|restricted|frozen)|verify your account|unusual activity|unauthorized (charge|attempt)|zelle|wire transfer)\b/i,12],[/\breply (y|n|yes|no)\b/i,4],[/\b(bank|chase|wells fargo|bank of america|citi|capital one|usaa|navy federal)\b/i,4]],
 chain:[{t:"Breached lists — or pure guessing",d:"Attackers blast a bank's name at huge number lists knowing a slice will be customers.",v:[]},
  {t:"Spoofed sender + follow-up call",d:"The text softens you up; a spoofed call then 'confirms' the fraud and walks you into moving money. Banks never ask you to move money to a 'safe account'.",v:[]}],agency:"ic3"},
{id:"pig",label:"\"Wrong number\" opener — relationship/investment scam",risk:"SCAM",classes:[],
 sub:"A deliberately innocuous opener. The goal is a reply — any reply — starting a weeks-long conversation that ends at a fake investment platform.",
 hits:[[/\b(is this|sorry,? (is|who)|wrong number|do (i|you) know you|have we met|long time no (see|talk)|remember me|are you (still )?(free|available)|this is (mia|anna|amy|lily|sophia|emily|jessica|linda))\b/i,9],
  [/\b(golf|tennis|dinner|coffee|appointment|assistant|schedule)\b/i,3],[/\b(whatsapp|telegram|line|signal)\b/i,6],[/\b(crypto|bitcoin|usdt|eth|trading|investment|profit|portfolio|exchange)\b/i,7]],shortBonus:true,
 chain:[{t:"Bulk lists and number generation",d:"Volume plays. The opener is generic precisely so it works on anyone.",v:[]},
  {t:"The reply is the product",d:"A reply proves a human is on the line. Confirmed-live numbers are worth more and get resold — which is why replying makes volume go up, not down.",v:[]},
  {t:"Grooming, then a fake platform",d:"Weeks of friendly conversation, then an 'opportunity' on a site showing fake gains that blocks withdrawal.",v:[]}],agency:"ic3"},
{id:"job",label:"Job / task scam",risk:"SCAM",classes:[],
 sub:"Fake recruiter offering easy daily pay. Ends with you paying to 'unlock' commissions, or laundering funds.",
 hits:[[/\b(part[- ]time|remote (job|work|position)|daily (pay|salary|income)|\d{2,4}\s*(?:usd|\$)?\s*(?:per|a|\/)\s*day|hiring|recruit|job offer|work from home|no experience|flexible hours|online (job|task)|rating tasks|product boosting)\b/i,10],[/\b(whatsapp|telegram)\b/i,6]],
 chain:[{t:"Scraped job-board data — or plain enumeration",d:"Some campaigns target recent résumé posters; most are untargeted blasts.",v:["Job-board scrapes","Breached résumé databases"]},
  {t:"Move to an off-platform chat",d:"They push immediately to WhatsApp or Telegram, where there's no moderation and no record.",v:[]}],agency:"ic3"},
{id:"medicare",label:"Health insurance / Medicare lead generation",risk:"COMMERCIAL",classes:["marketing","health"],
 sub:"Driven by lead-gen forms with buried 'marketing partner' consent — the classic 'I never signed up for this' pipeline.",
 hits:[[/\b(medicare|medicaid|health (plan|insurance|coverage)|aca|obamacare|affordable care|open enrollment|subsid|premium|benefits? (you|package)|final expense|dental (plan|coverage))\b/i,11]],
 chain:[{t:"Lead-generation web form",d:"A 'check your benefits' or quiz page with fine print consenting to contact from dozens or hundreds of 'marketing partners'.",v:["Lead-gen landing pages","Quiz/survey sites"]},
  {t:"Lead aggregator / ping tree",d:"Your submission is auctioned in real time and can be sold to many buyers at once. One form fill produces months of calls.",v:["Lead aggregators","Ping-tree networks"]},
  {t:"Licensed agent or call centre",d:"The eventual sender is often several hops from whoever collected the data.",v:[]}],agency:"fcc"},
{id:"solar",label:"Solar / home-improvement lead generation",risk:"COMMERCIAL",classes:["property","marketing"],
 sub:"Targeted using property records — they know you own a roof.",
 hits:[[/\b(solar|panels?|energy bill|utility bill|electric bill|roof|hvac|windows|gutter|weatheriz|insulation|rebate|incentive program|no cost to homeowners?)\b/i,10],[/\b(homeowner|your home|your property)\b/i,4]],
 chain:[{t:"Property records identify homeowners",d:"Ownership, build year, roof size and estimated equity come from public and aggregated property data.",v:["County records","ATTOM Data","CoreLogic"]},
  {t:"Phone append + lead-gen forms",d:"Skip-trace append, or a 'check your eligibility' form that sells the lead onward.",v:["Skip-trace vendors","Lead aggregators"]}],agency:"fcc"},
{id:"auto",label:"Auto warranty / vehicle service contract",risk:"COMMERCIAL",classes:["auto","marketing"],
 sub:"One of the most-fined categories in FCC history.",
 hits:[[/\b(warranty|vehicle service contract|your (car|vehicle|auto)|bumper[- ]to[- ]bumper|factory warranty|coverage (on|for) your (car|vehicle)|extended (warranty|coverage))\b/i,12]],
 chain:[{t:"Vehicle registration, lienholder and dealer data",d:"Make, model and year come from registration, service and warranty records resold through the automotive data market.",v:["DMV-derived data (state-dependent)","Dealer/DMS records","Lienholder data"]},
  {t:"Lead aggregator, then call centre",d:"Sold on to boiler rooms that dial and text at enormous volume.",v:[]}],agency:"fcc"},
{id:"student",label:"Student-loan forgiveness / repayment",risk:"COMMERCIAL",classes:["marketing"],
 sub:"Frequently a fee-for-service scam charging for something free at studentaid.gov.",
 hits:[[/\b(student loan|forgiveness|loan repayment|borrower|federal loans?|income[- ]driven|pslf|refinanc(e|ing) your (student )?loans?|discharge)\b/i,12]],
 chain:[{t:"Lead-gen forms and breached education data",d:"'Check if you qualify' pages, plus resold lists of people with education-loan indicators.",v:["Lead aggregators"]},
  {t:"Debt-relief boiler rooms",d:"Charge fees for free federal programs. Never pay for federal loan forgiveness.",v:[]}],agency:"cfpb"},
{id:"political",label:"Political fundraising / campaign text",risk:"COMMERCIAL",classes:["marketing"],
 sub:"Different rules apply — these are largely exempt from Do-Not-Call, and the source is a public record.",
 hits:[[/\b(donate|chip in|contribut|campaign|ballot|election|vote|voting|poll|candidate|governor|senate|congress|president|match(ed|ing)? (your )?gift|deadline (is )?(tonight|midnight)|grassroots)\b/i,10]],
 chain:[{t:"The state voter file — a public record",d:"Your name, address, party registration and voting history are public records in most states. Campaigns buy the file legally.",v:["State voter file","L2","Aristotle","i360","TargetSmart"]},
  {t:"Phone append",d:"Voter files are matched against commercial data to attach mobile numbers.",v:["Commercial data appends"]},
  {t:"Peer-to-peer texting platform",d:"P2P platforms use human 'senders' to sidestep autodialer rules — which is why the volume is legal and relentless.",v:["P2P texting platforms"]}],agency:"fcc",
 extra:"Political texts are largely exempt from the Do-Not-Call registry, and the voter file behind them is a public record you generally cannot delete. Replying STOP is genuinely your main lever here. A few states allow confidential voter status for people at risk — check with your state election office."},
{id:"injury",label:"Personal-injury / mass-tort lead generation",risk:"COMMERCIAL",classes:["marketing"],
 sub:"Targeted from accident reports, court records, or medical-adjacent data.",
 hits:[[/\b(accident|injur(y|ed)|were you (in|injured)|compensation|settlement (you|may)|claim (you|your)|mass tort|camp lejeune|roundup|talcum|mesothelioma|car crash|slip and fall)\b/i,11]],
 chain:[{t:"Accident reports and court records",d:"Police accident reports are public in many states and are resold within days.",v:["Police accident reports","Court dockets"]},
  {t:"Lead-gen and case-acquisition networks",d:"Cases are bought and sold by marketing firms and referred to law firms.",v:["Legal lead aggregators"]}],agency:"fcc"},
{id:"crypto",label:"Crypto / investment solicitation",risk:"SCAM",classes:[],
 sub:"Unsolicited investment texts are effectively never legitimate.",
 hits:[[/\b(crypto|bitcoin|btc|eth|usdt|binance|coinbase|trading signal|pump|whale|guaranteed (return|profit)|\d+ ?% (daily|weekly|monthly|return)|investment (opportunity|group)|stock pick|insider)\b/i,11]],
 chain:[{t:"Bulk lists, breach data and enumeration",d:"Often seeded from breached exchange or trading-app user lists.",v:["Breached exchange data"]},
  {t:"Fake platform or pump-and-dump group",d:"Deposits show fake gains; withdrawals require ever-larger 'fees' and never arrive.",v:[]}],agency:"ic3"},
{id:"timeshare",label:"Timeshare exit / resale solicitation",risk:"COMMERCIAL",classes:["property"],
 sub:"Targets people with a recorded timeshare interest — again, a property record.",
 hits:[[/\b(timeshare|vacation (club|ownership)|maintenance fees|exit your|get out of your (timeshare|contract)|resale)\b/i,12]],
 chain:[{t:"Recorded timeshare deeds",d:"Timeshare interests are recorded property interests and appear in county records.",v:["County records","Resort/HOA lists"]},
  {t:"Exit-company lead lists",d:"Sold between 'exit' companies, most of which charge large upfront fees.",v:[]}],agency:"ftc"},
{id:"settlement",label:"Class-action / settlement claim",risk:"COMMERCIAL",classes:["marketing"],
 sub:"Some are genuine administrator notices; many are lead-gen or outright phishing.",
 hits:[[/\b(class action|settlement (fund|administrator|claim)|you may be entitled|claim your (share|portion|payment)|deadline to (file|claim)|payout)\b/i,11]],
 chain:[{t:"Court-approved class lists, or scraped interest",d:"Real administrators mail or email — a cold text with a link deserves suspicion.",v:["Settlement administrators"]},
  {t:"Verify independently",d:"Find the settlement's official site through a search engine, never through the link you were sent.",v:[]}],agency:"ftc"},
{id:"generic",label:"Unsolicited commercial text",risk:"COMMERCIAL",classes:["marketing"],
 sub:"Marketing you didn't ask for. The remedies below still apply.",
 hits:[[/\b(offer|deal|discount|sale|promo|limited time|sign up|subscribe|click|shop now)\b/i,4]],
 chain:[{t:"A form you filled in — or a list someone sold",d:"Most commercial texts trace to a web form with broad 'marketing partner' consent, or to a purchased marketing list.",v:["Lead aggregators","Marketing list brokers"]},
  {t:"SMS marketing platform",d:"Sent through a bulk messaging provider on a registered campaign.",v:[]}],agency:"fcc"}];

function classify(s){
  const sc=A.map(a=>{let n=0,w=[];a.hits.forEach(([re,v])=>{const m=s.raw.match(re);if(m){n+=v;w.push(m[0]);}});
    if(a.needAddr&&s.address)n+=a.needAddr;
    if(a.shortBonus&&s.len<90&&!s.urls.length&&!s.hasOptOut)n+=6;
    return{a,sc:n,why:w};}).sort((x,y)=>y.sc-x.sc);
  let top=sc[0];
  if(top.sc<6&&s.urls.length&&!s.hasOptOut) top={a:A.find(x=>x.id==="package"),sc:5,why:[]};
  if(top.sc<4) top={a:A.find(x=>x.id==="generic"),sc:0,why:[]};
  return{arch:top.a,score:top.sc,conf:top.sc>=14?"high":top.sc>=8?"moderate":top.sc>=4?"low":"very low",
    why:[...new Set(top.why)].slice(0,6),runners:sc.slice(1,3).filter(r=>r.sc>=5)};
}

const AGENCIES={
 fcc:{n:"FCC — unwanted calls and texts",u:"https://consumercomplaints.fcc.gov/hc/en-us/requests/new",d:"Handles unwanted commercial texts; shares complaint data with enforcement partners."},
 ftc:{n:"FTC — fraud and deceptive practices",u:"https://reportfraud.ftc.gov/",d:"Feeds the Consumer Sentinel database that state attorneys general search."},
 ic3:{n:"FBI IC3 — internet crime",u:"https://www.ic3.gov/",d:"For outright fraud. IC3 aggregates reports to identify and disrupt campaigns."},
 uspis:{n:"U.S. Postal Inspection Service",u:"https://www.uspis.gov/report",d:"Impersonating USPS is a federal offence USPIS actively investigates."},
 cfpb:{n:"CFPB — debt collection",u:"https://www.consumerfinance.gov/complaint/",d:"Requires a company response, and you have extra rights under the FDCPA."}};

/* --------------------------- removal-pack engine -------------------------- */
/* Requests are generated for the consumer to send FROM THEIR OWN EMAIL.
   That is deliberate and it is the strongest route: under 11 CCR § 7063 a
   business may demand proof of signed permission when an AGENT submits, and may
   require the consumer to verify directly. A request that comes straight from
   the consumer carries none of that friction — and we never hold your data. */

function brokersFor(classes, all){
  if(all) return BROKERS.slice();
  const want = classes && classes.length ? classes : ["skiptrace","marketing"];
  const hit = BROKERS.filter(b=>b.t.some(t=>want.includes(t)));
  const rest = BROKERS.filter(b=>!hit.includes(b));
  // prioritise: matching class first, then by 2024 request volume (the big holders)
  hit.sort((a,b)=>(b.q||0)-(a.q||0));
  rest.sort((a,b)=>(b.q||0)-(a.q||0));
  return hit.concat(rest);
}

function lawFor(st){
  const L=STATE_LAW[st];
  if(L) return {act:L.act, days:L.days, ext:L.ext, named:true, state:L.n};
  return {act:"applicable state and federal privacy law, and your right to opt out of the sale of your personal information",
          days:45, ext:45, named:false, state:st?STATES[st]:null};
}

function requestBody(p, broker){
  const L=lawFor(p.state);
  const idl=[];
  if(p.fullName) idl.push(`Full name: ${p.fullName}`);
  if(p.alsoKnown) idl.push(`Also appears in your records as: ${p.alsoKnown}`);
  if(p.email) idl.push(`Email address: ${p.email}`);
  if(p.phone) idl.push(`Telephone number: ${p.phone}`);
  if(p.addr) idl.push(`Current address: ${p.addr}`);
  if(p.prevAddr) idl.push(`Previous address: ${p.prevAddr}`);
  const L2=[];
  L2.push(`To the Privacy Officer / Data Protection Officer,`);
  L2.push(``);
  L2.push(`I am a resident of ${L.state||"the United States"}. I am exercising my right under ${L.act} to request that ${broker?broker.n:"your organisation"} DELETE all personal information you hold about me, and that you cease selling or sharing my personal information.`);
  L2.push(``);
  L2.push(`This request covers personal information you collected directly, purchased, licensed, inferred, or received from any third party or affiliate, and I ask that you direct your service providers, contractors and any third parties to whom you have sold or disclosed my information to do the same.`);
  L2.push(``);
  L2.push(`IDENTIFIERS — to locate my records:`);
  idl.forEach(x=>L2.push(`  ${x}`));
  const ev=(typeof evidenceParagraph==="function")?evidenceParagraph():"";
  if(ev){ L2.push(``); L2.push(ev); }
  if(p.wrongName && p.wrongNameValue){
    L2.push(``);
    L2.push(`IMPORTANT — DATA ACCURACY: my telephone number appears in third-party records associated with the name "${p.wrongNameValue}", who is not me. That association is incorrect and appears to result from a reassigned telephone number. If your records link this number to that name, they are inaccurate. Please delete the record rather than merging it with mine, and do not use it to build an identity or household association.`);
  }
  L2.push(``);
  L2.push(`I am NOT consenting to the creation of a new record about me in order to process this request beyond what is strictly necessary, and under applicable regulations you may not use information I provide here for any purpose other than verifying and fulfilling this request.`);
  L2.push(``);
  L2.push(`Please confirm in writing when the deletion is complete, and state which categories of information were deleted and whether any information was retained under a statutory exemption (identifying the exemption).`);
  L2.push(``);
  L2.push(`I understand you are required to respond substantively within ${L.days} days of receipt${L.ext?`, extendable by a further ${L.ext} days only if you notify me of the extension within the first ${L.days}-day period`:""}.`);
  L2.push(``);
  L2.push(`If you believe you are not the correct recipient, please forward this to the person responsible for privacy requests and tell me who that is.`);
  L2.push(``);
  L2.push(`Sincerely,`);
  L2.push(p.fullName||"[your name]");
  if(p.email) L2.push(p.email);
  L2.push(``);
  L2.push(`— Sent ${new Date().toISOString().slice(0,10)}. A copy of this request has been retained.`);
  return L2.join("\n");
}
function requestSubject(p, broker){
  return `Formal request to delete personal information — ${p.fullName||"consumer request"}`;
}
function followUpBody(p, broker, sentDate){
  const L=lawFor(p.state);
  return [`To the Privacy Officer,`,``,
  `On ${sentDate} I sent ${broker?broker.n:"your organisation"} a verifiable request to delete my personal information under ${L.act}. The statutory response period has now elapsed and I have not received a substantive response.`,``,
  `This is a formal follow-up. Please confirm within 10 business days that my information has been deleted, or state the specific statutory basis on which you are refusing.`,``,
  `If I do not receive a response I intend to file a complaint with my state Attorney General and, where applicable, the California Privacy Protection Agency, and to include a copy of this correspondence.`,``,
  `Identifiers previously supplied:`,
  `  ${[p.fullName&&`Name: ${p.fullName}`,p.email&&`Email: ${p.email}`,p.phone&&`Phone: ${p.phone}`].filter(Boolean).join("\n  ")}`,``,
  `Sincerely,`,p.fullName||"[your name]"].join("\n");
}

function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}
const fmtDate=d=>d.toISOString().slice(0,10);

/* time / annoyance model — figures are published vendor & journalist estimates,
   not a controlled study. Sources and the caveat are shown in the UI. */
const MIN_PER_BROKER_LOW=5, MIN_PER_BROKER_HIGH=30, MIN_PER_BROKER_MID=15;
function timeModel(count){
  const lo=count*MIN_PER_BROKER_LOW, mid=count*MIN_PER_BROKER_MID, hi=count*MIN_PER_BROKER_HIGH;
  return {lo,mid,hi,loH:(lo/60),midH:(mid/60),hiH:(hi/60)};
}
function humanHours(m){
  if(m<60) return `${Math.round(m)} min`;
  const h=m/60;
  return h<10?`${h.toFixed(1)} hours`:`${Math.round(h)} hours`;
}
