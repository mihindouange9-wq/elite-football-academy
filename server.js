/* ============================================================
   Elite Football Academy — serveur + tableau de bord opérationnel
   Node natif (http+fs), ZÉRO dépendance. Lancer : node server.js
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
  joueurs:      path.join(DATA_DIR, "joueurs.json"),
  categories:   path.join(DATA_DIR, "categories.json"),
  seances:      path.join(DATA_DIR, "seances.json"),
  detections:   path.join(DATA_DIR, "detections.json"),
  expenses:     path.join(DATA_DIR, "expenses.json"),
  settings:     path.join(DATA_DIR, "settings.json"),
};

/* ---------- Données par défaut (amorçage) ---------- */
const DEFAULT_SETTINGS = {
  whatsapp: "24166802521",                 // ← numéro WhatsApp de l'académie
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  adminPassword: process.env.ADMIN_PASSWORD || "Elite2026",
  lieu: "Akanda — proche du stade de l'Amitié, Libreville (Gabon)"
};
const DEFAULT_CATEGORIES = [
  { id:"u7_u9",   name:"U7 – U9 (École de foot)", tranche:"7-9 ans",   coach:"", jours:"Mer · Sam" },
  { id:"u10_u12", name:"U10 – U12",               tranche:"10-12 ans", coach:"", jours:"Mar · Jeu · Sam" },
  { id:"u13_u15", name:"U13 – U15",               tranche:"13-15 ans", coach:"", jours:"Lun · Mer · Ven" },
  { id:"u16_u18", name:"U16 – U18",               tranche:"16-18 ans", coach:"", jours:"Lun · Mer · Ven · Sam" },
];
const DEFAULT_SEANCES = [
  { id:"s1", jour:"Lundi",    debut:"16:00", fin:"18:00", categorie:"U13 – U15", type:"Technique", lieu:"Terrain d'Akanda", coach:"" },
  { id:"s2", jour:"Mercredi", debut:"15:00", fin:"17:00", categorie:"U7 – U9 (École de foot)", type:"Technique", lieu:"Terrain d'Akanda", coach:"" },
  { id:"s3", jour:"Mercredi", debut:"17:00", fin:"19:00", categorie:"U16 – U18", type:"Tactique", lieu:"Terrain d'Akanda", coach:"" },
  { id:"s4", jour:"Vendredi", debut:"16:00", fin:"18:00", categorie:"U13 – U15", type:"Physique", lieu:"Terrain d'Akanda", coach:"" },
  { id:"s5", jour:"Samedi",   debut:"09:00", fin:"11:00", categorie:"U10 – U12", type:"Match", lieu:"Stade de l'Amitié", coach:"" },
];

/* ---------- Stockage générique ---------- */
function ensureFile(f, def){ if(!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(def,null,2),"utf8"); }
function read(f){ try { return JSON.parse(fs.readFileSync(f,"utf8").replace(/^﻿/,"")); } catch { return []; } }
function write(f, d){ fs.writeFileSync(f, JSON.stringify(d,null,2),"utf8"); }
function init(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  ensureFile(F.inscriptions,[]); ensureFile(F.joueurs,[]); ensureFile(F.categories,DEFAULT_CATEGORIES);
  ensureFile(F.seances,DEFAULT_SEANCES); ensureFile(F.detections,[]); ensureFile(F.expenses,[]);
  ensureFile(F.settings,DEFAULT_SETTINGS);
}
const settings = ()=>({ ...DEFAULT_SETTINGS, ...read(F.settings) });

/* ---------- Auth ---------- */
const tokens = new Set();
const newToken = ()=>{ const t=crypto.randomBytes(24).toString("hex"); tokens.add(t); return t; };
const authOk = req=>{ const h=req.headers["authorization"]||""; return tokens.has(h.startsWith("Bearer ")?h.slice(7):""); };

/* ---------- HTTP utils ---------- */
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

/* ---------- Calculs tableau de bord ---------- */
function dashboard(){
  const INS=read(F.inscriptions), J=read(F.joueurs), D=read(F.detections), E=read(F.expenses);
  const now=new Date();
  // statuts des demandes
  const parStatut={nouveau:0,"contacté":0,"détection":0,inscrit:0,"refusé":0};
  INS.forEach(i=>{ parStatut[i.status]=(parStatut[i.status]||0)+1; });
  // inscriptions des 7 derniers jours
  const ins7=[]; for(let i=6;i>=0;i--){ const dd=new Date(now); dd.setDate(now.getDate()-i); const key=dd.toISOString().slice(0,10);
    ins7.push({ jour:dd.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit"}), n:INS.filter(x=>String(x.createdAt).slice(0,10)===key).length }); }
  // joueurs actifs
  const actifs=J.filter(j=>j.actif!==false);
  const sportEtudes=actifs.filter(j=>(j.filiere||"").toLowerCase().includes("sport")).length;
  // par filière
  const fm={}; actifs.forEach(j=>{ const k=j.filiere||"Non précisé"; fm[k]=(fm[k]||0)+1; });
  const parFiliere=Object.entries(fm).map(([name,n])=>({name,n})).sort((a,b)=>b.n-a.n);
  // par catégorie
  const cm={}; actifs.forEach(j=>{ const k=j.categorie||"Non classé"; cm[k]=(cm[k]||0)+1; });
  const parCategorie=Object.entries(cm).map(([name,n])=>({name,n})).sort((a,b)=>b.n-a.n);
  // finances
  const cotisations=actifs.reduce((s,j)=>s+(+j.cotisation||0),0);
  const encaisse=actifs.filter(j=>j.paiement==="à jour").reduce((s,j)=>s+(+j.cotisation||0),0);
  const enRetardList=actifs.filter(j=>j.paiement==="en retard");
  const depenses=E.reduce((s,e)=>s+(+e.amount||0),0);
  // détections à venir
  const detAvenir=D.filter(d=>d.statut!=="passée").length;
  // 6 dernières demandes (les plus récentes en premier)
  const dernieres=INS.slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,6)
    .map(i=>({ id:i.id, createdAt:i.createdAt, status:i.status,
      enfant:i.enfant.nom, age:i.enfant.age, filiere:i.enfant.filiere,
      parent:i.parent.nom, tel:i.parent.tel }));
  return {
    kpis:{ demandes:INS.length, nouvelles:parStatut.nouveau, joueurs:actifs.length, sportEtudes,
      cotisations, enRetard:enRetardList.length, detections:detAvenir },
    parStatut, ins7, parFiliere, parCategorie, dernieres,
    finances:{ cotisations, encaisse, depenses, solde:encaisse-depenses },
    alertes:enRetardList.map(j=>({nom:j.nom,categorie:j.categorie||"—",cotisation:+j.cotisation||0}))
  };
}

/* ---------- Serveur ---------- */
init();
const server = http.createServer(async (req,res)=>{
  const url=req.url.split("?")[0], m=req.method;
  if(url.startsWith("/api/")){
   try{
    /* ----- PUBLIC ----- */
    if(url==="/api/public-settings" && m==="GET"){ const s=settings(); return json(res,200,{whatsapp:s.whatsapp,facebook:s.facebook,instagram:s.instagram,lieu:s.lieu}); }

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

    /* ----- ADMIN (auth) ----- */
    if(url.startsWith("/api/admin/")){
      if(!authOk(req)) return json(res,401,{error:"Non autorisé"});
      let mm;

      if(url==="/api/admin/dashboard" && m==="GET") return json(res,200,dashboard());

      /* --- Inscriptions (demandes) --- */
      if(url==="/api/admin/inscriptions" && m==="GET"){
        const all=read(F.inscriptions).slice().reverse();
        const st={ total:all.length, nouveaux:all.filter(x=>x.status==="nouveau").length,
          inscrits:all.filter(x=>x.status==="inscrit").length,
          sportEtudes:all.filter(x=>(x.enfant.filiere||"").toLowerCase().includes("sport")).length };
        return json(res,200,{inscriptions:all,stats:st});
      }
      if((mm=url.match(/^\/api\/admin\/inscriptions\/([^/]+)$/))){
        const all=read(F.inscriptions); const it=all.find(x=>x.id===mm[1]);
        if(m==="PATCH"){ if(!it) return json(res,404,{error:"Introuvable"}); const b=await body(req);
          if(["nouveau","contacté","détection","inscrit","refusé"].includes(b.status)){ it.status=b.status; write(F.inscriptions,all); return json(res,200,{ok:true}); }
          return json(res,400,{error:"Statut invalide"}); }
        if(m==="DELETE"){ write(F.inscriptions,all.filter(x=>x.id!==mm[1])); return json(res,200,{ok:true}); }
      }

      /* --- Joueurs --- */
      if(url==="/api/admin/joueurs" && m==="GET") return json(res,200,read(F.joueurs).slice().reverse());
      if(url==="/api/admin/joueurs" && m==="POST"){ const b=await body(req); const J=read(F.joueurs);
        const j={ id:uid("J-"), createdAt:new Date().toISOString(),
          nom:String(b.nom||"Joueur").slice(0,120), age:String(b.age||"").slice(0,10), categorie:String(b.categorie||"").slice(0,60),
          filiere:String(b.filiere||"").slice(0,40), poste:String(b.poste||"").slice(0,40),
          parentNom:String(b.parentNom||"").slice(0,120), parentTel:String(b.parentTel||"").slice(0,40), quartier:String(b.quartier||"").slice(0,80),
          cotisation:+b.cotisation||0, paiement:["à jour","en retard","exonéré"].includes(b.paiement)?b.paiement:"en retard",
          actif:b.actif!==false, notes:String(b.notes||"").slice(0,500) };
        J.push(j); write(F.joueurs,J); return json(res,201,{ok:true,id:j.id}); }
      if((mm=url.match(/^\/api\/admin\/joueurs\/([^/]+)$/))){
        const J=read(F.joueurs); const j=J.find(x=>x.id===mm[1]);
        if(m==="PUT"){ if(!j) return json(res,404,{error:"Introuvable"}); const b=await body(req);
          ["nom","age","categorie","filiere","poste","parentNom","parentTel","quartier","notes"].forEach(k=>{ if(b[k]!=null) j[k]=String(b[k]); });
          if(b.cotisation!=null) j.cotisation=+b.cotisation||0;
          if(b.paiement!=null && ["à jour","en retard","exonéré"].includes(b.paiement)) j.paiement=b.paiement;
          if(b.actif!=null) j.actif=!!b.actif;
          write(F.joueurs,J); return json(res,200,{ok:true}); }
        if(m==="DELETE"){ write(F.joueurs,J.filter(x=>x.id!==mm[1])); return json(res,200,{ok:true}); }
      }

      /* --- Catégories --- */
      if(url==="/api/admin/categories" && m==="GET") return json(res,200,read(F.categories));
      if(url==="/api/admin/categories" && m==="POST"){ const b=await body(req); const C=read(F.categories);
        C.push({ id:uid("cat-"), name:String(b.name||"Catégorie").slice(0,60), tranche:String(b.tranche||"").slice(0,40),
          coach:String(b.coach||"").slice(0,80), jours:String(b.jours||"").slice(0,60) });
        write(F.categories,C); return json(res,201,{ok:true}); }
      if((mm=url.match(/^\/api\/admin\/categories\/([^/]+)$/))){
        const C=read(F.categories); const c=C.find(x=>x.id===mm[1]);
        if(m==="PUT"){ if(!c) return json(res,404,{error:"Introuvable"}); const b=await body(req);
          ["name","tranche","coach","jours"].forEach(k=>{ if(b[k]!=null) c[k]=String(b[k]); });
          write(F.categories,C); return json(res,200,{ok:true}); }
        if(m==="DELETE"){ write(F.categories,C.filter(x=>x.id!==mm[1])); return json(res,200,{ok:true}); }
      }

      /* --- Séances / planning --- */
      if(url==="/api/admin/seances" && m==="GET") return json(res,200,read(F.seances));
      if(url==="/api/admin/seances" && m==="POST"){ const b=await body(req); const S=read(F.seances);
        S.push({ id:uid("se-"), jour:String(b.jour||"Lundi").slice(0,12), debut:String(b.debut||"").slice(0,8), fin:String(b.fin||"").slice(0,8),
          categorie:String(b.categorie||"").slice(0,60), type:String(b.type||"Entraînement").slice(0,30),
          lieu:String(b.lieu||"").slice(0,80), coach:String(b.coach||"").slice(0,80) });
        write(F.seances,S); return json(res,201,{ok:true}); }
      if((mm=url.match(/^\/api\/admin\/seances\/([^/]+)$/))){
        const S=read(F.seances); const s=S.find(x=>x.id===mm[1]);
        if(m==="PUT"){ if(!s) return json(res,404,{error:"Introuvable"}); const b=await body(req);
          ["jour","debut","fin","categorie","type","lieu","coach"].forEach(k=>{ if(b[k]!=null) s[k]=String(b[k]); });
          write(F.seances,S); return json(res,200,{ok:true}); }
        if(m==="DELETE"){ write(F.seances,S.filter(x=>x.id!==mm[1])); return json(res,200,{ok:true}); }
      }

      /* --- Détections --- */
      if(url==="/api/admin/detections" && m==="GET") return json(res,200,read(F.detections).slice().reverse());
      if(url==="/api/admin/detections" && m==="POST"){ const b=await body(req); const D=read(F.detections);
        D.push({ id:uid("det-"), date:String(b.date||new Date().toISOString().slice(0,10)).slice(0,10), heure:String(b.heure||"").slice(0,8),
          lieu:String(b.lieu||"").slice(0,80), titre:String(b.titre||"Journée de détection").slice(0,100),
          description:String(b.description||"").slice(0,500), candidats:+b.candidats||0,
          statut:["à venir","passée"].includes(b.statut)?b.statut:"à venir" });
        write(F.detections,D); return json(res,201,{ok:true}); }
      if((mm=url.match(/^\/api\/admin\/detections\/([^/]+)$/))){
        const D=read(F.detections); const d=D.find(x=>x.id===mm[1]);
        if(m==="PUT"){ if(!d) return json(res,404,{error:"Introuvable"}); const b=await body(req);
          ["date","heure","lieu","titre","description"].forEach(k=>{ if(b[k]!=null) d[k]=String(b[k]); });
          if(b.candidats!=null) d.candidats=+b.candidats||0;
          if(b.statut!=null && ["à venir","passée"].includes(b.statut)) d.statut=b.statut;
          write(F.detections,D); return json(res,200,{ok:true}); }
        if(m==="DELETE"){ write(F.detections,D.filter(x=>x.id!==mm[1])); return json(res,200,{ok:true}); }
      }

      /* --- Dépenses / finances --- */
      if(url==="/api/admin/expenses" && m==="GET") return json(res,200,read(F.expenses).slice().reverse());
      if(url==="/api/admin/expenses" && m==="POST"){ const b=await body(req); const E=read(F.expenses);
        E.push({ id:uid("dep-"), date:b.date||new Date().toISOString().slice(0,10), label:String(b.label||"Dépense").slice(0,120),
          category:String(b.category||"Autre").slice(0,40), amount:+b.amount||0 });
        write(F.expenses,E); return json(res,201,{ok:true}); }
      if((mm=url.match(/^\/api\/admin\/expenses\/([^/]+)$/)) && m==="DELETE"){ write(F.expenses,read(F.expenses).filter(x=>x.id!==mm[1])); return json(res,200,{ok:true}); }

      /* --- Paramètres --- */
      if(url==="/api/admin/settings" && m==="GET"){ const s=settings(); return json(res,200,{whatsapp:s.whatsapp,facebook:s.facebook,instagram:s.instagram,lieu:s.lieu}); }
      if(url==="/api/admin/settings" && m==="PUT"){ const b=await body(req); const s=settings();
        if(b.whatsapp!=null) s.whatsapp=String(b.whatsapp).replace(/\D/g,""); if(b.facebook!=null) s.facebook=String(b.facebook);
        if(b.instagram!=null) s.instagram=String(b.instagram); if(b.lieu!=null) s.lieu=String(b.lieu);
        write(F.settings,s); return json(res,200,{ok:true}); }
      if(url==="/api/admin/password" && m==="POST"){ const b=await body(req); const s=settings();
        if(b.current!==s.adminPassword) return json(res,400,{error:"Mot de passe actuel incorrect."});
        if(!b.next||String(b.next).length<5) return json(res,400,{error:"Le nouveau mot de passe doit faire au moins 5 caractères."});
        s.adminPassword=String(b.next); write(F.settings,s); return json(res,200,{ok:true}); }

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
