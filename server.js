/* ============================================================
   Elite Football Academy — serveur (Node natif, ZÉRO dépendance)
   Sert le site + reçoit les inscriptions + espace admin.
   Lancer : node server.js
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5600;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const F = {
  inscriptions: path.join(DATA_DIR, "inscriptions.json"),
  settings:     path.join(DATA_DIR, "settings.json"),
};
const DEFAULT_SETTINGS = {
  whatsapp: "24100000000",                 // ← numéro WhatsApp de l'académie (à régler)
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  adminPassword: process.env.ADMIN_PASSWORD || "Elite2026",
  lieu: "Akanda — proche du stade de l'Amitié, Libreville (Gabon)"
};

function ensureFile(f, def){ if(!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(def,null,2),"utf8"); }
function read(f){ try { return JSON.parse(fs.readFileSync(f,"utf8").replace(/^﻿/,"")); } catch { return []; } }
function write(f, d){ fs.writeFileSync(f, JSON.stringify(d,null,2),"utf8"); }
function init(){ if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  ensureFile(F.inscriptions,[]); ensureFile(F.settings,DEFAULT_SETTINGS); }
const settings = ()=>({ ...DEFAULT_SETTINGS, ...read(F.settings) });

const tokens = new Set();
const newToken = ()=>{ const t=crypto.randomBytes(24).toString("hex"); tokens.add(t); return t; };
const authOk = req=>{ const h=req.headers["authorization"]||""; return tokens.has(h.startsWith("Bearer ")?h.slice(7):""); };

function json(res,c,o){ const b=JSON.stringify(o); res.writeHead(c,{"Content-Type":"application/json; charset=utf-8"}); res.end(b); }
function body(req){ return new Promise(r=>{ let d=""; req.on("data",c=>{d+=c;if(d.length>1e6)req.destroy();}); req.on("end",()=>{try{r(JSON.parse(d||"{}"))}catch{r({})}});}); }
const uid = p=>p+Date.now().toString(36).toUpperCase()+Math.floor(Math.random()*1e3);
const MIME={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon",".webp":"image/webp"};
function serveStatic(req,res){
  let u=decodeURIComponent(req.url.split("?")[0]); if(u==="/")u="/index.html";
  if(u==="/admin"||u==="/admin/")u="/admin.html";
  const fp=path.join(PUBLIC_DIR, path.normalize(u).replace(/^([/\\])+/,""));
  if(!fp.startsWith(PUBLIC_DIR)){res.writeHead(403);return res.end("Forbidden");}
  fs.readFile(fp,(e,c)=>{ if(e){res.writeHead(404,{"Content-Type":"text/html; charset=utf-8"});return res.end("<h1>404</h1>");}
    res.writeHead(200,{"Content-Type":MIME[path.extname(fp).toLowerCase()]||"application/octet-stream"}); res.end(c); });
}

init();
const server = http.createServer(async (req,res)=>{
  const url=req.url.split("?")[0], m=req.method;
  if(url.startsWith("/api/")){
   try{
    if(url==="/api/public-settings" && m==="GET"){ const s=settings(); return json(res,200,{whatsapp:s.whatsapp,facebook:s.facebook,instagram:s.instagram,lieu:s.lieu}); }

    // Inscription (publique)
    if(url==="/api/inscriptions" && m==="POST"){
      const b=await body(req); const e=b.enfant||{}, p=b.parent||{};
      if(!e.nom || !p.nom || !p.tel) return json(res,400,{error:"Nom de l'enfant, nom du parent et téléphone requis."});
      const ins={ id:uid("INS-"), createdAt:new Date().toISOString(),
        enfant:{ nom:String(e.nom).slice(0,120), age:String(e.age||"").slice(0,10), poste:String(e.poste||"").slice(0,40), filiere:String(e.filiere||"").slice(0,40), niveau:String(e.niveau||"").slice(0,60) },
        parent:{ nom:String(p.nom).slice(0,120), tel:String(p.tel).slice(0,40), email:String(p.email||"").slice(0,120), quartier:String(p.quartier||"").slice(0,80) },
        message:String(b.message||"").slice(0,600), status:"nouveau" };
      const all=read(F.inscriptions); all.push(ins); write(F.inscriptions,all);
      return json(res,201,{ok:true,id:ins.id});
    }
    if(url==="/api/admin/login" && m==="POST"){ const b=await body(req);
      if(b.password===settings().adminPassword) return json(res,200,{token:newToken()});
      return json(res,401,{error:"Mot de passe incorrect."}); }

    if(url.startsWith("/api/admin/")){
      if(!authOk(req)) return json(res,401,{error:"Non autorisé"});
      if(url==="/api/admin/inscriptions" && m==="GET"){
        const all=read(F.inscriptions).slice().reverse();
        const st={ total:all.length, nouveaux:all.filter(x=>x.status==="nouveau").length,
          inscrits:all.filter(x=>x.status==="inscrit").length,
          sportEtudes:all.filter(x=>(x.enfant.filiere||"").toLowerCase().includes("sport")).length };
        return json(res,200,{inscriptions:all,stats:st});
      }
      const mm=url.match(/^\/api\/admin\/inscriptions\/([^/]+)$/);
      if(mm){ const all=read(F.inscriptions); const it=all.find(x=>x.id===mm[1]);
        if(m==="PATCH"){ if(!it) return json(res,404,{error:"Introuvable"}); const b=await body(req);
          if(["nouveau","contacté","détection","inscrit","refusé"].includes(b.status)){ it.status=b.status; write(F.inscriptions,all); return json(res,200,{ok:true}); }
          return json(res,400,{error:"Statut invalide"}); }
        if(m==="DELETE"){ write(F.inscriptions,all.filter(x=>x.id!==mm[1])); return json(res,200,{ok:true}); }
      }
      return json(res,404,{error:"Route admin inconnue"});
    }
    return json(res,404,{error:"Route inconnue"});
   }catch(e){ return json(res,500,{error:"Erreur serveur"}); }
  }
  serveStatic(req,res);
});
server.listen(PORT,()=>{
  console.log("=================================================");
  console.log("  Elite Football Academy — serveur démarré");
  console.log("  Site  : http://localhost:"+PORT);
  console.log("  Admin : http://localhost:"+PORT+"/admin  (mdp: "+settings().adminPassword+")");
  console.log("=================================================");
});
