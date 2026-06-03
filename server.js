const http = require('http');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;

const CHUNKS = [
  { topic: "X / Twitter acquisition & social media", start: 210, summary: "X has ~600M monthly users, can spike to 1B during major events. Elon bought Twitter because it amplified far-left ideology; his goal is a balanced centrist platform following each country's laws. X aims to be a global town square — not dopamine-optimized content but meaningful exchange of ideas across languages via auto-translation.", keywords: ["twitter","x","social media","users","centrist","far left","acquisition","town square","collective consciousness","translation"] },
  { topic: "Meaning of life & collective consciousness", start: 780, summary: "Elon frames the meaning of life through Douglas Adams' Hitchhiker's Guide: the hard part is knowing the right questions, not finding answers. Expanding the scope and scale of human consciousness helps us better understand the universe. A network of humans collectively achieves far more than individuals — like cells forming a body.", keywords: ["meaning of life","consciousness","collective","hitchhiker","douglas adams","42","universe","questions","philosophy"] },
  { topic: "Spirituality and physics", start: 1380, summary: "Elon is 'physics-pulled' — he pays attention to things with predictive value. Spiritual feelings may be real to others but don't universally translate. Physics is the study of that which has predictive value.", keywords: ["spirituality","religion","physics","predictive","belief","faith"] },
  { topic: "Long-term investing philosophy", start: 1620, summary: "Elon's investing framework: focus on long-term — do you like the products/services? Is the team talented and motivated? A company is just people assembled to create products. Don't worry about daily fluctuations.", keywords: ["investing","stocks","investment","company","team","products","long term","fluctuations","stock market","first principles"] },
  { topic: "Entrepreneurship advice for Indian founders", start: 1920, summary: "The most important thing is to make useful products and services. A business plan is a hypothesis — validate it fast with customer feedback. Don't over-engineer the planning phase.", keywords: ["entrepreneur","startup","india","founders","build","products","advice","business plan","hypothesis","useful"] },
  { topic: "Tesla, SpaceX, xAI convergence & Optimus robot", start: 2000, summary: "There's a convergence between SpaceX, Tesla, and xAI — the future is solar-powered AI satellites. Tesla leads in real-world AI and autonomous driving. Optimus robot begins production next year. Starlink operates in 150 countries.", keywords: ["tesla","spacex","xai","optimus","robot","autonomous","self-driving","satellites","convergence","starlink"] },
  { topic: "How Starlink works", start: 2260, summary: "Starlink has thousands of satellites in low earth orbit (~550km), moving at 25x the speed of sound. Low altitude means low latency. Satellites have laser links forming a mesh — robust even when undersea cables are cut. Works best in rural areas; physics prevents serving dense cities at more than ~1-2%.", keywords: ["starlink","satellite","low earth orbit","latency","internet","rural","laser","mesh","how does starlink work","technology"] },
  { topic: "AI safety and civilizational importance", start: 2330, summary: "AI is the most transformative technology in human history. Getting AI right is existentially important. It could solve disease and poverty but also carries civilizational risks.", keywords: ["AI safety","artificial intelligence","transformative","existential risk","danger","future AI","worried","ai"] },
  { topic: "Future of work — working will be optional", start: 2900, summary: "Elon predicts that in less than 20 years working will be optional due to AI and robotics. It'll be like growing your own vegetables: optional, not mandatory. UHI (Universal High Income) replaces UBI.", keywords: ["work","future of work","optional","20 years","jobs","universal high income","UHI","UBI","robotics","employment"] },
  { topic: "The singularity and post-scarcity world", start: 3120, summary: "We're heading toward the singularity — AI is like a black hole, you don't know what happens past the event horizon. If AI/robotics keep advancing, people can have anything they can think of. Delayed gratification is key.", keywords: ["singularity","post scarcity","abundance","AI","robotics","marshmallow","delayed gratification","future"] },
  { topic: "Why Elon likes the letter X / X.com history", start: 3540, summary: "X.com started in 1999 as a real-time secure financial database. Became PayPal, acquired by eBay. Elon bought domain back. Acquiring Twitter revived the X.com vision. SpaceX: FedEx for space.", keywords: ["letter x","x.com","paypal","domain","financial","money database","wechat","spacex","why x"] },
  { topic: "Future of money and energy as true currency", start: 3840, summary: "Long-term, money disappears as a concept. Energy is the true currency — you can't legislate it. Kardashev scale: K1 = planet's energy, K2 = sun's energy. Iain Banks' Culture books best imagine this future.", keywords: ["money","future of money","energy","currency","bitcoin","kardashev","kardashev scale","culture books","iain banks","wealth"] },
  { topic: "US debt, inflation, and deflation via AI", start: 4260, summary: "US interest payments on debt exceed the military budget. AI and robotics can solve the debt crisis by dramatically increasing goods and services output. Elon predicts goods/services growth exceeds money supply growth in ~3 years.", keywords: ["US debt","inflation","deflation","money supply","interest rates","productivity","economy","deficit"] },
  { topic: "Simulation theory — are we in a matrix?", start: 4560, summary: "Elon thinks the probability we're in a simulation is pretty high. Video games went from Pong to photorealistic in 50 years. With billions of simulations running, the odds we're in base reality are very low.", keywords: ["simulation","matrix","simulation theory","are we in a simulation","base reality","video games","probability"] },
  { topic: "First-principles thinking", start: 1620, summary: "Elon applies physics-based first-principles reasoning — breaking problems down to fundamental truths rather than reasoning by analogy. Applied to money (information system for labor allocation), investing, and Starlink physics.", keywords: ["first principles","first-principles","thinking","reasoning","physics","framework","mental model","methodology"] },
  { topic: "Elon on family and children", start: 3540, summary: "Elon has multiple children. His son X was named by the child's mother. If he got a tattoo, he'd get his kids' names. He practices delayed gratification and works extremely long hours.", keywords: ["family","children","kids","son x","tattoo","personal life","father","parenting"] },
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
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

async function callClaude(query) {
  const chunks = findChunks(query);
  const context = chunks.map((c, i) =>
    `[Segment ${i + 1} — starts at ${formatTime(c.start)} — Topic: ${c.topic}]\n${c.summary}`
  ).join('\n\n');

  const body = JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You are a Q&A bot for the podcast "People by WTF Ep. 16" featuring Elon Musk interviewed by Nikhil Kamath (Nov 30, 2025). Answer questions using ONLY the provided transcript segments. Be concise (2–4 sentences). At the end output exactly: {"timestamp_seconds": NUMBER, "topic": "TOPIC"}. If not covered, say so honestly.`,
    messages: [{ role: "user", content: `Transcript segments:\n${context}\n\nQuestion: ${query}` }]
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body
  });

  const data = await response.json();
  const raw = data.content.map(b => b.text || '').join('');

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

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.method === 'POST' && req.url === '/ask') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);
        if (!query) { res.writeHead(400); res.end(JSON.stringify({ error: 'No query' })); return; }
        const result = await callClaude(query);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running on port ${PORT}`));
