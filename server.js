const http = require('http');

const API_KEY = process.env.GROQ_API_KEY;

const CHUNKS = [
  { topic: "X / Twitter acquisition & social media", start: 210, summary: "X has ~600M monthly users, can spike to 1B during major events. Elon bought Twitter because it amplified far-left ideology; his goal is a balanced centrist platform following each country's laws. X aims to be a global town square — not dopamine-optimized content but meaningful exchange of ideas across languages via auto-translation.", keywords: ["twitter","x","social media","users","centrist","acquisition","town square","collective consciousness","translation"] },
  { topic: "Meaning of life & collective consciousness", start: 780, summary: "Elon frames the meaning of life through Douglas Adams' Hitchhiker's Guide: the hard part is knowing the right questions, not finding answers. Expanding the scope and scale of human consciousness helps us better understand the universe.", keywords: ["meaning of life","consciousness","collective","hitchhiker","douglas adams","42","universe","questions","philosophy"] },
  { topic: "Spirituality and physics", start: 1380, summary: "Elon is physics-pulled — he pays attention to things with predictive value. Spiritual feelings may be real to others but don't universally translate. Physics is the study of that which has predictive value.", keywords: ["spirituality","religion","physics","predictive","belief","faith"] },
  { topic: "Long-term investing philosophy", start: 1620, summary: "Elon's investing framework: focus on long-term — do you like the products/services? Is the team talented and motivated? A company is just people assembled to create products. Don't worry about daily fluctuations.", keywords: ["investing","stocks","investment","company","team","products","long term","fluctuations","stock market","first principles"] },
  { topic: "Entrepreneurship advice for Indian founders", start: 1920, summary: "The most important thing is to make useful products and services. A business plan is a hypothesis — validate it fast with customer feedback. Don't over-engineer the planning phase.", keywords: ["entrepreneur","startup","india","founders","build","products","advice","business plan","hypothesis","useful"] },
  { topic: "Tesla SpaceX xAI and Optimus robot", start: 2000, summary: "There's a convergence between SpaceX, Tesla, and xAI — the future is solar-powered AI satellites. Tesla leads in real-world AI and autonomous driving. Optimus robot begins production next year. Starlink operates in 150 countries.", keywords: ["tesla","spacex","xai","optimus","robot","autonomous","self-driving","satellites","convergence","starlink"] },
  { topic: "How Starlink works", start: 2260, summary: "Starlink has thousands of satellites in low earth orbit around 550km, moving at 25x the speed of sound. Low altitude means low latency. Satellites have laser links forming a mesh — robust even when undersea cables are cut. Works best in rural areas; physics prevents serving dense cities at more than 1-2%.", keywords: ["starlink","satellite","low earth orbit","latency","internet","rural","laser","mesh","how does starlink work","technology"] },
  { topic: "AI safety and civilizational importance", start: 2330, summary: "AI is the most transformative technology in human history. Getting AI right is existentially important. It could solve disease and poverty but also carries civilizational risks.", keywords: ["AI safety","artificial intelligence","transformative","existential risk","danger","future AI","worried","ai"] },
  { topic: "Future of work — working will be optional", start: 2900, summary: "Elon predicts that in less than 20 years working will be optional due to AI and robotics. It will be like growing your own vegetables: optional, not mandatory. UHI Universal High Income replaces UBI.", keywords: ["work","future of work","optional","20 years","jobs","universal high income","UHI","UBI","robotics","employment"] },
  { topic: "The singularity and post-scarcity world", start: 3120, summary: "We are heading toward the singularity — AI is like a black hole, you don't know what happens past the event horizon. If AI and robotics keep advancing, people can have anything they can think of. Delayed gratification is key.", keywords: ["singularity","post scarcity","abundance","AI","robotics","marshmallow","delayed gratification","future"] },
  { topic: "Why Elon likes the letter X and X.com history", start: 3540, summary: "X.com started in 1999 as a real-time secure financial database. Became PayPal, acquired by eBay. Elon bought domain back. Acquiring Twitter revived the X.com vision. SpaceX is FedEx for space.", keywords: ["letter x","x.com","paypal","domain","financial","money database","wechat","spacex","why x"] },
  { topic: "Future of money and energy as true currency", start: 3840, summary: "Long-term, money disappears as a concept. Energy is the true currency — you cannot legislate it. Kardashev scale: K1 is planet energy, K2 is sun energy. Iain Banks Culture books best imagine this future.", keywords: ["money","future of money","energy","currency","bitcoin","kardashev","kardashev scale","culture books","iain banks","wealth"] },
  { topic: "US debt inflation and deflation via AI", start: 4260, summary: "US interest payments on debt exceed the military budget. AI and robotics can solve the debt crisis by dramatically increasing goods and services output. Elon predicts goods and services growth exceeds money supply growth in about 3 years.", keywords: ["US debt","inflation","deflation","money supply","interest rates","productivity","economy","deficit"] },
  { topic: "Simulation theory — are we in a matrix", start: 4560, summary: "Elon thinks the probability we are in a simulation is pretty high. Video games went from Pong to photorealistic in 50 years. With billions of simulations running, the odds we are in base reality are very low.", keywords: ["simulation","matrix","simulation theory","are we in a simulation","base reality","video games","probability"] },
  { topic: "First-principles thinking", start: 1620, summary: "Elon applies physics-based first-principles reasoning — breaking problems down to fundamental truths rather than reasoning by analogy. Applied to money as information system for labor allocation, to investing, and to Starlink physics.", keywords: ["first principles","first-principles","thinking","reasoning","physics","framework","mental model","methodology"] },
  { topic: "Elon on family and children", start: 3540, summary: "Elon has multiple children. His son X was named by the child's mother. If he got a tattoo he would get his kids names. He practices delayed gratification and works extremely long hours.", keywords: ["family","children","kids","son x","tattoo","personal life","father","parenting"] },
];

function findChunks(query) {
  const q = query.toLowerCase();
  return CHUNKS.map(c => {
    let score = 0;
    c.keywords.forEach(k => { if (q.includes(k)) score += 3; });
    c.topic.toLowerCase().split(/\W+/).forEach(w => { if (w.length > 3 && q.includes(w)) score += 2; });
    c.summary.toLowerCase().split(/\W+/).forEach(w => { if (w.length > 4 && q.includes(w)) score += 1; });
    return { ...c, score };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  return m + ':' + String(s % 60).padStart(2, '0');
}

async function callGroq(query) {
  const chunks = findChunks(query);
  const context = chunks.map((c, i) =>
    '[Segment ' + (i+1) + ' — starts at ' + formatTime(c.start) + ' — Topic: ' + c.topic + ']\n' + c.summary
  ).join('\n\n');

  const bodyData = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: 'You are a Q&A bot for the podcast People by WTF Ep. 16 featuring Elon Musk interviewed by Nikhil Kamath. Answer using ONLY the provided transcript segments. Be concise (2-4 sentences). At the end of your reply, output exactly this JSON on its own line: {"timestamp_seconds": NUMBER, "topic": "TOPIC"} — use the most relevant segment start time. If the question is not covered, say so honestly.'
      },
      {
        role: "user",
        content: 'Transcript segments:\n' + context + '\n\nQuestion: ' + query
      }
    ]
  });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + API_KEY
    },
    body: bodyData
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('Groq API error: ' + JSON.stringify(data));
  }

  const raw = data.choices[0].message.content || '';

  let answer = raw, ts = chunks[0].start, topic = chunks[0].topic;
  const m = raw.match(/\{[\s\S]*?"timestamp_seconds"[\s\S]*?\}/);
  if (m) {
    try {
      const j = JSON.parse(m[0]);
      if (j.timestamp_seconds) ts = j.timestamp_seconds;
      if (j.topic) topic = j.topic;
      answer = raw.replace(m[0], '').trim();
    } catch (e) {}
  }
  return { answer, ts, topic };
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Podcast Q&A Bot — Elon Musk x Nikhil Kamath</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px}
.container{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);padding:28px 28px 32px;max-width:720px;width:100%}
.header{margin-bottom:20px}
.header h1{font-size:20px;font-weight:600;color:#111;margin-bottom:4px}
.header p{font-size:13px;color:#666;line-height:1.5}
.podcast-card{display:flex;align-items:center;gap:12px;background:#f8f8f8;border:1px solid #e8e8e8;border-radius:10px;padding:10px 14px;margin-bottom:20px}
.podcast-card img{width:90px;height:52px;object-fit:cover;border-radius:6px;flex-shrink:0}
.podcast-card .meta{flex:1;min-width:0}
.podcast-card .meta .title{font-size:13px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.podcast-card .meta .sub{font-size:11px;color:#888;margin-top:2px}
.podcast-card a{font-size:12px;color:#555;text-decoration:none;border:1px solid #ddd;padding:4px 10px;border-radius:6px;white-space:nowrap;flex-shrink:0}
.podcast-card a:hover{background:#eee}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}
.chip{font-size:12px;padding:5px 11px;border-radius:999px;border:1px solid #ddd;color:#555;background:#fafafa;cursor:pointer;transition:all 0.15s}
.chip:hover{background:#f0f0f0;color:#111;border-color:#bbb}
.input-row{display:flex;gap:8px;margin-bottom:20px}
.input-row input{flex:1;height:42px;padding:0 14px;border-radius:8px;border:1.5px solid #ddd;font-size:14px;font-family:inherit;color:#111;background:#fff}
.input-row input:focus{outline:none;border-color:#4a7cf7}
.input-row input::placeholder{color:#aaa}
.input-row button{height:42px;padding:0 18px;border-radius:8px;border:none;background:#1a1a1a;color:#fff;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit}
.input-row button:hover{background:#333}
.input-row button:disabled{background:#ccc;cursor:not-allowed}
.answer-card{background:#fff;border:1px solid #e8e8e8;border-radius:12px;padding:16px 18px;margin-bottom:12px;animation:fadeIn 0.3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.answer-card .q{font-size:12px;color:#888;margin-bottom:8px;font-weight:500;text-transform:uppercase;letter-spacing:0.04em}
.answer-card .q span{color:#4a7cf7}
.answer-card .a{font-size:14px;color:#222;line-height:1.7;margin-bottom:14px}
.ts-btn{display:inline-flex;align-items:center;gap:7px;font-size:13px;padding:7px 14px;border-radius:8px;border:1px solid #e0e0e0;color:#444;background:#f7f7f7;text-decoration:none;font-family:inherit}
.ts-btn:hover{background:#eef2ff;border-color:#b0c0f0;color:#2a5fd4}
.loading{display:flex;gap:5px;align-items:center;padding:16px 4px}
.dot{width:7px;height:7px;border-radius:50%;background:#bbb;animation:pulse 1.2s ease-in-out infinite}
.dot:nth-child(2){animation-delay:0.2s}
.dot:nth-child(3){animation-delay:0.4s}
@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
.error{font-size:13px;color:#c00;padding:8px 0}
.built-tag{font-size:11px;color:#bbb;text-align:center;margin-top:20px}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Podcast Q&A Bot</h1>
    <p>Ask anything from the Elon Musk x Nikhil Kamath conversation. Get an answer + jump to the exact moment in the video.</p>
  </div>
  <div class="podcast-card">
    <img src="https://i.ytimg.com/vi/Rni7Fz7208c/mqdefault.jpg" alt="Podcast thumbnail" onerror="this.style.display='none'">
    <div class="meta">
      <div class="title">Elon Musk x Nikhil Kamath — People by WTF Ep. 16</div>
      <div class="sub">Full episode · Nov 30, 2025</div>
    </div>
    <a href="https://www.youtube.com/watch?v=Rni7Fz7208c" target="_blank">Watch</a>
  </div>
  <div class="chips" id="chips"></div>
  <div class="input-row">
    <input type="text" id="q-input" placeholder="Ask a question about the podcast..." />
    <button id="ask-btn">Ask</button>
  </div>
  <div id="answers"></div>
  <div class="built-tag">Built with Llama 3 via Groq · Sportomic AI Intern Assignment</div>
</div>
<script>
const QUESTIONS=["What is first-principles thinking?","Future of work?","How does Starlink work?","Will money exist in the future?","What is the Kardashev scale?","Is Elon worried about AI?","Advice for entrepreneurs?","Does Elon believe in simulation theory?"];
const VIDEO_ID="Rni7Fz7208c";
function fmt(s){return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
function card(q,r){
  const url="https://www.youtube.com/watch?v="+VIDEO_ID+"&t="+r.ts+"s";
  const d=document.createElement("div");
  d.className="answer-card";
  d.innerHTML='<div class="q">Question: <span>'+q+'</span></div><div class="a">'+r.answer+'</div><a class="ts-btn" href="'+url+'" target="_blank">Watch at '+fmt(r.ts)+' \u2014 '+r.topic+'</a>';
  return d;
}
const chips=document.getElementById("chips");
const input=document.getElementById("q-input");
const btn=document.getElementById("ask-btn");
const answers=document.getElementById("answers");
QUESTIONS.forEach(function(q){
  const c=document.createElement("button");
  c.className="chip";c.textContent=q;
  c.onclick=function(){input.value=q;doAsk();};
  chips.appendChild(c);
});
async function doAsk(){
  const query=input.value.trim();
  if(!query)return;
  btn.disabled=true;
  const loader=document.createElement("div");
  loader.className="loading";
  loader.innerHTML='<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  answers.prepend(loader);
  try{
    const res=await fetch("/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:query})});
    const result=await res.json();
    if(result.error) throw new Error(result.error);
    loader.remove();
    answers.prepend(card(query,result));
    input.value="";
  }catch(e){
    loader.remove();
    const err=document.createElement("div");
    err.className="error";
    err.textContent="Something went wrong: "+e.message;
    answers.prepend(err);
  }
  btn.disabled=false;
  input.focus();
}
btn.onclick=doAsk;
input.addEventListener("keydown",function(e){if(e.key==="Enter")doAsk();});
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
    return;
  }

  if (req.method === 'POST' && req.url === '/ask') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);
        if (!query) { res.writeHead(400); res.end(JSON.stringify({ error: 'No query provided' })); return; }
        const result = await callGroq(query);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        console.error('Error:', e.message);
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
