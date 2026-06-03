/* ============================================================
   Tableau de bord admin — Elite Football Academy
   ============================================================ */
let TOKEN = sessionStorage.getItem("elite_token") || "";
let CURRENT = "dashboard";
let timer = null;

const $ = id => document.getElementById(id);
const fmt = n => (Math.round(+n)||0).toLocaleString("fr-FR") + " FCFA";
const num = n => (Math.round(+n)||0).toLocaleString("fr-FR");
const esc = s => String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const waNum = t => { t=String(t||"").replace(/\D/g,""); return t.startsWith("241")?t:("241"+t.replace(/^0+/,"")); };
const TITLES={dashboard:"Tableau de bord",inscriptions:"Inscriptions (demandes)",joueurs:"Joueurs",categories:"Catégories / équipes",seances:"Planning des séances",detections:"Journées de détection",finances:"Finances",settings:"Paramètres"};
const POSTES=["Gardien","Défenseur","Latéral","Milieu","Ailier","Attaquant","À déterminer"];
const FILIERES=["Sport-Études","Loisirs"];
const JOURS=["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
let CATS=[]; // cache des catégories

async function api(path, opts={}){
  opts.headers=Object.assign({"Content-Type":"application/json"},opts.headers||{},{Authorization:"Bearer "+TOKEN});
  const r=await fetch(path,opts);
  if(r.status===401){ doLogout(); throw new Error("401"); }
  return r;
}
async function loadCats(){ try{ CATS=await (await api("/api/admin/categories")).json(); }catch{ CATS=[]; } return CATS; }
function catOptions(sel){ return ['<option value="">— Catégorie —</option>'].concat(CATS.map(c=>`<option ${c.name===sel?"selected":""}>${esc(c.name)}</option>`)).join(""); }
function listOptions(arr,sel){ return arr.map(o=>`<option ${o===sel?"selected":""}>${o}</option>`).join(""); }

/* ---------- Auth ---------- */
function showLogin(){ $("loginView").hidden=false; $("appView").hidden=true; }
function showApp(){ $("loginView").hidden=true; $("appView").hidden=false; }
function doLogout(){ TOKEN=""; sessionStorage.removeItem("elite_token"); clearInterval(timer); showLogin(); }

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault(); $("loginErr").textContent="";
  try{ const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("pwd").value})});
    const d=await r.json();
    if(r.ok){ TOKEN=d.token; sessionStorage.setItem("elite_token",TOKEN); enter(); }
    else $("loginErr").textContent=d.error||"Échec.";
  }catch{ $("loginErr").textContent="Serveur indisponible."; }
});
$("logoutBtn").addEventListener("click",doLogout);
$("reloadBtn").addEventListener("click",()=>setView(CURRENT));
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("nav").addEventListener("click",e=>{ const a=e.target.closest("[data-view]"); if(!a) return; setView(a.dataset.view); $("sidebar").classList.remove("open"); });

const VIEWS=["dashboard","inscriptions","joueurs","categories","seances","detections","finances","settings"];
async function enter(){ showApp(); await loadCats(); const h=(location.hash||"").replace("#",""); setView(VIEWS.includes(h)?h:"dashboard"); }
function setView(v){
  CURRENT=v;
  if(location.hash!=="#"+v) try{ location.hash=v; }catch{}
  document.querySelectorAll("#nav a").forEach(a=>a.classList.toggle("active",a.dataset.view===v));
  $("viewTitle").textContent=TITLES[v]||v;
  clearInterval(timer);
  ({dashboard:viewDashboard,inscriptions:viewInscriptions,joueurs:viewJoueurs,categories:viewCategories,seances:viewSeances,detections:viewDetections,finances:viewFinances,settings:viewSettings}[v]||viewDashboard)();
  if(v==="dashboard"||v==="inscriptions") timer=setInterval(()=>{ if(CURRENT===v) ({dashboard:viewDashboard,inscriptions:viewInscriptions}[v])(true); },15000);
}

/* ---------- Modal ---------- */
function openModal(html){ $("modal").innerHTML=html; $("modalBg").classList.add("open"); }
function closeModal(){ $("modalBg").classList.remove("open"); }
$("modalBg").addEventListener("click",e=>{ if(e.target.id==="modalBg") closeModal(); });

/* ============================================================
   TABLEAU DE BORD
   ============================================================ */
async function viewDashboard(){
  let d; try{ d=await (await api("/api/admin/dashboard")).json(); }catch{ return; }
  const k=d.kpis, stat=d.parStatut, fin=d.finances;
  const statRows=[["nouveau",stat.nouveau,"#e67e22"],["contacté",stat["contacté"],"#2980b9"],["détection",stat["détection"],"#8e44ad"],["inscrit",stat.inscrit,"#27ae60"],["refusé",stat["refusé"],"#c0392b"]];
  const maxS=Math.max(1,...statRows.map(r=>r[1]));
  const statBars=statRows.map(r=>`<div class="barrow"><div class="t"><span>${r[0]}</span><b>${r[1]}</b></div><div class="bartrack"><div class="barfill" style="width:${Math.round(r[1]/maxS*100)}%;background:${r[2]}"></div></div></div>`).join("");
  const maxC=Math.max(1,...d.parCategorie.map(c=>c.n));
  const catBars=d.parCategorie.length? d.parCategorie.map(c=>`<div class="barrow"><div class="t"><span>${esc(c.name)}</span><b>${c.n} joueur(s)</b></div><div class="bartrack"><div class="barfill green" style="width:${Math.round(c.n/maxC*100)}%"></div></div></div>`).join("") : '<p class="empty">Aucun joueur enregistré.</p>';
  const alertes=d.alertes.length? d.alertes.map(a=>`<div class="alert">⚠️ <b>${esc(a.nom)}</b> — ${esc(a.categorie)} · cotisation ${fmt(a.cotisation)} <b>en retard</b></div>`).join("") : '<p style="color:#1e7a45;font-size:.88rem">✓ Aucun retard de paiement.</p>';
  $("content").innerHTML=`
    <div class="kpis">
      <div class="kpi"><div class="l">Demandes reçues</div><div class="n">${k.demandes}</div></div>
      <div class="kpi"><div class="l">Nouvelles demandes</div><div class="n">${k.nouvelles}</div></div>
      <div class="kpi alt"><div class="l">Joueurs inscrits</div><div class="n">${k.joueurs}</div></div>
      <div class="kpi alt"><div class="l">Sport-Études</div><div class="n">${k.sportEtudes}</div></div>
      <div class="kpi"><div class="l">Cotisations / mois</div><div class="n">${num(k.cotisations)}</div></div>
      <div class="kpi"><div class="l">Paiements en retard</div><div class="n" style="color:${k.enRetard?'#c0392b':'var(--green)'}">${k.enRetard}</div></div>
      <div class="kpi alt"><div class="l">Détections à venir</div><div class="n">${k.detections}</div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>📈 Demandes reçues (7 derniers jours)</h3><canvas id="cv7" height="220"></canvas></div>
      <div class="panel"><h3>📝 Demandes par statut</h3><div class="barlist">${statBars}</div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>🗂️ Joueurs par catégorie</h3><div class="barlist">${catBars}</div></div>
      <div class="panel">
        <h3>💰 Finances (mensuel)</h3>
        <div class="barlist">
          <div class="barrow"><div class="t"><span>Cotisations attendues</span><b>${fmt(fin.cotisations)}</b></div></div>
          <div class="barrow"><div class="t"><span>Encaissé (à jour)</span><b style="color:#1e7a45">${fmt(fin.encaisse)}</b></div></div>
          <div class="barrow"><div class="t"><span>Dépenses</span><b style="color:#c0392b">${fmt(fin.depenses)}</b></div></div>
          <div class="barrow"><div class="t"><span>Solde</span><b>${fmt(fin.solde)}</b></div></div>
        </div>
        <h3 style="margin-top:1rem">⚠️ Alertes paiement</h3>${alertes}
      </div>
    </div>`;
  drawBarChart("cv7", d.ins7.map(x=>x.jour), d.ins7.map(x=>x.n));
}
function drawBarChart(id, labels, values){
  const cv=$(id); if(!cv) return;
  const ratio=window.devicePixelRatio||1;
  const W=cv.clientWidth||600, H=220; cv.width=W*ratio; cv.height=H*ratio;
  const c=cv.getContext("2d"); c.scale(ratio,ratio);
  const padL=40,padB=28,padT=12,padR=8, pw=W-padL-padR, ph=H-padT-padB;
  const max=Math.max(1,...values), maxAxis=niceMax(max);
  c.font="11px Barlow,sans-serif"; c.textBaseline="middle";
  for(let i=0;i<=4;i++){ const y=padT+ph-ph*i/4; const v=Math.round(maxAxis*i/4);
    c.strokeStyle="#eee"; c.beginPath(); c.moveTo(padL,y); c.lineTo(padL+pw,y); c.stroke();
    c.fillStyle="#999"; c.textAlign="right"; c.fillText(v, padL-6, y); }
  const n=values.length, slot=pw/n, bw=slot*0.5;
  values.forEach((v,i)=>{ const bh=ph*(v/maxAxis); const x=padL+slot*i+(slot-bw)/2, y=padT+ph-bh;
    const g=c.createLinearGradient(0,y,0,y+bh); g.addColorStop(0,"#e9cf6f"); g.addColorStop(1,"#b8902a");
    c.fillStyle=g; c.fillRect(x,y,bw,bh);
    c.fillStyle="#6d6a60"; c.textAlign="center"; c.fillText(labels[i], padL+slot*i+slot/2, padT+ph+14);
    if(v>0){ c.fillStyle="#14532d"; c.fillText(v, padL+slot*i+slot/2, y-8); } });
}
function niceMax(m){ const p=Math.pow(10,Math.floor(Math.log10(m))); const f=m/p; const n=f<=1?1:f<=2?2:f<=5?5:10; return n*p; }

/* ============================================================
   INSCRIPTIONS (demandes)
   ============================================================ */
let INSCRIPTIONS=[];
async function viewInscriptions(silent){
  let d; try{ d=await (await api("/api/admin/inscriptions")).json(); }catch{ return; }
  INSCRIPTIONS=d.inscriptions;
  if(!silent || !$("insSearch")) renderInscriptions(d.stats);
  else renderInscTable();
}
function renderInscriptions(st){
  $("content").innerHTML=`
    <div class="kpis">
      <div class="kpi"><div class="l">Total demandes</div><div class="n">${st.total}</div></div>
      <div class="kpi"><div class="l">Nouvelles</div><div class="n">${st.nouveaux}</div></div>
      <div class="kpi alt"><div class="l">Inscrits</div><div class="n">${st.inscrits}</div></div>
      <div class="kpi alt"><div class="l">Sport-Études</div><div class="n">${st.sportEtudes}</div></div>
    </div>
    <div class="toolbar">
      <input id="insSearch" placeholder="🔍 Rechercher (enfant, parent, tél)" />
      <select id="insFilter"><option value="">Tous les statuts</option><option>nouveau</option><option>contacté</option><option>détection</option><option>inscrit</option><option>refusé</option></select>
      <button class="btn-sm btn-gold" id="insCsv">⬇ Exporter CSV</button>
    </div>
    <div class="tablewrap"><table id="insTable"></table></div>`;
  $("insSearch").addEventListener("input",renderInscTable);
  $("insFilter").addEventListener("change",renderInscTable);
  $("insCsv").addEventListener("click",exportInscCsv);
  renderInscTable();
}
function filteredInsc(){
  const q=($("insSearch")?.value||"").toLowerCase(), f=$("insFilter")?.value||"";
  return INSCRIPTIONS.filter(x=>(!f||x.status===f) && (!q || (x.enfant.nom+x.parent.nom+x.parent.tel).toLowerCase().includes(q)));
}
function renderInscTable(){
  const list=filteredInsc();
  const head=`<tr><th>Enfant</th><th>Filière / Poste</th><th>Parent</th><th>Reçu</th><th>Statut</th><th>Actions</th></tr>`;
  const rows=list.map(x=>{
    const dt=new Date(x.createdAt).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
    const opts=["nouveau","contacté","détection","inscrit","refusé"].map(s=>`<option ${s===x.status?"selected":""}>${s}</option>`).join("");
    const w=waNum(x.parent.tel);
    return `<tr>
      <td><b>${esc(x.enfant.nom)}</b> <small>${esc(x.enfant.age)} ans</small>${x.enfant.niveau?'<br/><small>'+esc(x.enfant.niveau)+'</small>':''}${x.message?'<br/><small>📝 '+esc(x.message)+'</small>':''}</td>
      <td>${esc(x.enfant.filiere)||"—"}<br/><small>${esc(x.enfant.poste)||""}</small></td>
      <td>${esc(x.parent.nom)}<br/><small>${esc(x.parent.tel)}</small>${x.parent.quartier?'<br/><small>'+esc(x.parent.quartier)+'</small>':''}</td>
      <td><small>${dt}</small></td>
      <td><select class="statusSel" data-istatus="${x.id}">${opts}</select></td>
      <td><a class="mini call" href="tel:+${w}">📞</a> <a class="mini wa" target="_blank" href="https://wa.me/${w}?text=${encodeURIComponent('Bonjour '+x.parent.nom+', merci pour l\'inscription de '+x.enfant.nom+' à Elite Football Academy…')}">💬</a> <button class="btn-sm btn-add" data-iconv="${x.id}" title="Ajouter aux joueurs">➕ Joueur</button> <button class="btn-sm btn-del" data-idel="${x.id}">🗑</button></td>
    </tr>`;
  }).join("");
  $("insTable").innerHTML=head+(list.length?rows:`<tr><td colspan="6" class="empty">Aucune demande.</td></tr>`);
}
function exportInscCsv(){
  const rows=[["Enfant","Âge","Filière","Poste","Niveau","Parent","Téléphone","Email","Quartier","Statut","Reçu le","Message"]];
  filteredInsc().forEach(x=>rows.push([x.enfant.nom,x.enfant.age,x.enfant.filiere,x.enfant.poste,x.enfant.niveau,x.parent.nom,x.parent.tel,x.parent.email,x.parent.quartier,x.status,x.createdAt,x.message]));
  const csv=rows.map(r=>r.map(c=>'"'+String(c==null?"":c).replace(/"/g,'""')+'"').join(";")).join("\r\n");
  const a=document.createElement("a"); a.href="data:text/csv;charset=utf-8,﻿"+encodeURIComponent(csv); a.download="inscriptions_elite.csv"; a.click();
}
document.addEventListener("change",async e=>{
  const s=e.target.closest("[data-istatus]"); if(!s) return;
  await api("/api/admin/inscriptions/"+encodeURIComponent(s.dataset.istatus),{method:"PATCH",body:JSON.stringify({status:s.value})});
  viewInscriptions(true);
});
document.addEventListener("click",async e=>{
  const del=e.target.closest("[data-idel]"); if(del && confirm("Supprimer cette demande ?")){ await api("/api/admin/inscriptions/"+encodeURIComponent(del.dataset.idel),{method:"DELETE"}); viewInscriptions(); }
  const cv=e.target.closest("[data-iconv]"); if(cv){ const x=INSCRIPTIONS.find(i=>i.id===cv.dataset.iconv); if(x) joueurModal(null,{
    nom:x.enfant.nom, age:x.enfant.age, filiere:x.enfant.filiere, poste:x.enfant.poste,
    parentNom:x.parent.nom, parentTel:x.parent.tel, quartier:x.parent.quartier }); }
});

/* ============================================================
   JOUEURS
   ============================================================ */
let JOUEURS=[];
async function viewJoueurs(){
  try{ JOUEURS=await (await api("/api/admin/joueurs")).json(); await loadCats(); }catch{ return; }
  const actifs=JOUEURS.filter(j=>j.actif!==false);
  const retard=actifs.filter(j=>j.paiement==="en retard").length;
  $("content").innerHTML=`
    <div class="kpis">
      <div class="kpi"><div class="l">Joueurs actifs</div><div class="n">${actifs.length}</div></div>
      <div class="kpi alt"><div class="l">Total enregistrés</div><div class="n">${JOUEURS.length}</div></div>
      <div class="kpi"><div class="l">Paiements en retard</div><div class="n" style="color:${retard?'#c0392b':'var(--green)'}">${retard}</div></div>
    </div>
    <div class="toolbar">
      <input id="jSearch" placeholder="🔍 Rechercher (nom, parent, tél)" />
      <select id="jFilter"><option value="">Toutes catégories</option>${CATS.map(c=>`<option>${esc(c.name)}</option>`).join("")}</select>
      <select id="jPay"><option value="">Tous paiements</option><option>à jour</option><option>en retard</option><option>exonéré</option></select>
      <button class="btn-sm btn-add" id="jAdd">+ Ajouter un joueur</button>
    </div>
    <div class="tablewrap"><table id="jTable"></table></div>`;
  $("jSearch").addEventListener("input",renderJoueurs);
  $("jFilter").addEventListener("change",renderJoueurs);
  $("jPay").addEventListener("change",renderJoueurs);
  $("jAdd").addEventListener("click",()=>joueurModal());
  renderJoueurs();
}
function renderJoueurs(){
  const q=($("jSearch")?.value||"").toLowerCase(), fc=$("jFilter")?.value||"", fp=$("jPay")?.value||"";
  const list=JOUEURS.filter(j=>(!fc||j.categorie===fc)&&(!fp||j.paiement===fp)&&(!q||(j.nom+j.parentNom+j.parentTel).toLowerCase().includes(q)));
  const payCls={"à jour":"pay-ok","en retard":"pay-late","exonéré":"pay-ex"};
  const head=`<tr><th>Joueur</th><th>Catégorie</th><th>Filière / Poste</th><th>Parent</th><th>Cotisation</th><th>Paiement</th><th>Actions</th></tr>`;
  const rows=list.map(j=>{ const w=waNum(j.parentTel);
    return `<tr>
      <td><b>${esc(j.nom)}</b> <small>${esc(j.age)} ans</small>${j.actif===false?' <span class="chip off">inactif</span>':''}</td>
      <td>${esc(j.categorie)||"—"}</td>
      <td>${esc(j.filiere)||"—"}<br/><small>${esc(j.poste)||""}</small></td>
      <td>${esc(j.parentNom)||"—"}<br/><small>${esc(j.parentTel)}</small></td>
      <td><b>${fmt(j.cotisation)}</b></td>
      <td><span class="${payCls[j.paiement]||''}">${esc(j.paiement)}</span></td>
      <td><a class="mini call" href="tel:+${w}">📞</a> <a class="mini wa" target="_blank" href="https://wa.me/${w}">💬</a> <button class="btn-sm btn-edit" data-jedit="${j.id}">✎</button> <button class="btn-sm btn-del" data-jdel="${j.id}">🗑</button></td>
    </tr>`; }).join("");
  $("jTable").innerHTML=head+(list.length?rows:`<tr><td colspan="7" class="empty">Aucun joueur. Cliquez sur « + Ajouter un joueur » ou convertissez une inscription.</td></tr>`);
}
function joueurModal(j, pre){
  const e=j||pre||{};
  openModal(`<h3>${j?"Modifier le joueur":"Nouveau joueur"}</h3>
    <div class="frow">
      <label>Nom complet<input id="jf_nom" value="${esc(e.nom||"")}"></label>
      <label>Âge<input id="jf_age" value="${esc(e.age||"")}" placeholder="12"></label>
    </div>
    <div class="frow">
      <label>Catégorie<select id="jf_cat">${catOptions(e.categorie)}</select></label>
      <label>Filière<select id="jf_fil"><option value="">—</option>${listOptions(FILIERES,e.filiere)}</select></label>
      <label>Poste<select id="jf_poste"><option value="">—</option>${listOptions(POSTES,e.poste)}</select></label>
    </div>
    <div class="frow">
      <label>Parent / tuteur<input id="jf_pnom" value="${esc(e.parentNom||"")}"></label>
      <label>Téléphone<input id="jf_ptel" value="${esc(e.parentTel||"")}"></label>
      <label>Quartier<input id="jf_quartier" value="${esc(e.quartier||"")}"></label>
    </div>
    <div class="frow">
      <label>Cotisation mensuelle (FCFA)<input id="jf_cot" type="number" value="${e.cotisation!=null?e.cotisation:''}" placeholder="50000"></label>
      <label>Paiement<select id="jf_pay">${listOptions(["à jour","en retard","exonéré"],e.paiement||"en retard")}</select></label>
      <label>Statut<select id="jf_actif"><option value="1" ${e.actif!==false?"selected":""}>Actif</option><option value="0" ${e.actif===false?"selected":""}>Inactif</option></select></label>
    </div>
    <label>Notes<textarea id="jf_notes" rows="2">${esc(e.notes||"")}</textarea></label>
    <div class="modal-actions"><button class="btn-sm" style="background:#999" onclick="closeModal()">Annuler</button>
    <button class="btn-sm btn-add" id="jf_save">${j?"Enregistrer":"Créer le joueur"}</button></div>`);
  $("jf_save").addEventListener("click",async ()=>{
    const payload={ nom:$("jf_nom").value, age:$("jf_age").value, categorie:$("jf_cat").value, filiere:$("jf_fil").value, poste:$("jf_poste").value,
      parentNom:$("jf_pnom").value, parentTel:$("jf_ptel").value, quartier:$("jf_quartier").value,
      cotisation:$("jf_cot").value, paiement:$("jf_pay").value, actif:$("jf_actif").value==="1", notes:$("jf_notes").value };
    if(!payload.nom.trim()){ alert("Indiquez le nom du joueur."); return; }
    if(j) await api("/api/admin/joueurs/"+encodeURIComponent(j.id),{method:"PUT",body:JSON.stringify(payload)});
    else await api("/api/admin/joueurs",{method:"POST",body:JSON.stringify(payload)});
    closeModal(); viewJoueurs();
  });
}
document.addEventListener("click",async e=>{
  const ed=e.target.closest("[data-jedit]"); if(ed) joueurModal(JOUEURS.find(j=>j.id===ed.dataset.jedit));
  const dl=e.target.closest("[data-jdel]"); if(dl && confirm("Supprimer ce joueur ?")){ await api("/api/admin/joueurs/"+encodeURIComponent(dl.dataset.jdel),{method:"DELETE"}); viewJoueurs(); }
});

/* ============================================================
   CATÉGORIES
   ============================================================ */
async function viewCategories(){
  await loadCats();
  let J=[]; try{ J=await (await api("/api/admin/joueurs")).json(); }catch{}
  const count=name=>J.filter(j=>j.actif!==false && j.categorie===name).length;
  const rows=CATS.map(c=>`<tr>
    <td><b>${esc(c.name)}</b></td><td>${esc(c.tranche)||"—"}</td><td>${esc(c.jours)||"—"}</td>
    <td>${esc(c.coach)||"—"}</td><td>${count(c.name)}</td>
    <td><button class="btn-sm btn-edit" data-cedit="${c.id}">✎</button> <button class="btn-sm btn-del" data-cdel="${c.id}">🗑</button></td>
  </tr>`).join("");
  $("content").innerHTML=`
    <p class="hint">Les catégories (équipes par tranche d'âge) servent à classer les joueurs et à organiser le planning.</p>
    <div class="toolbar"><button class="btn-sm btn-add" id="cAdd">+ Ajouter une catégorie</button></div>
    <div class="tablewrap"><table><tr><th>Catégorie</th><th>Tranche d'âge</th><th>Jours</th><th>Coach</th><th>Joueurs</th><th>Actions</th></tr>${rows||'<tr><td colspan="6" class="empty">Aucune catégorie.</td></tr>'}</table></div>`;
  $("cAdd").addEventListener("click",()=>categoryModal());
}
function categoryModal(c){
  const e=c||{};
  openModal(`<h3>${c?"Modifier la catégorie":"Nouvelle catégorie"}</h3>
    <label>Nom (ex : U13 – U15)<input id="cf_name" value="${esc(e.name||"")}"></label>
    <div class="frow">
      <label>Tranche d'âge<input id="cf_tr" value="${esc(e.tranche||"")}" placeholder="13-15 ans"></label>
      <label>Jours d'entraînement<input id="cf_j" value="${esc(e.jours||"")}" placeholder="Lun · Mer · Ven"></label>
    </div>
    <label>Coach responsable<input id="cf_coach" value="${esc(e.coach||"")}"></label>
    <div class="modal-actions"><button class="btn-sm" style="background:#999" onclick="closeModal()">Annuler</button>
    <button class="btn-sm btn-add" id="cf_save">${c?"Enregistrer":"Créer"}</button></div>`);
  $("cf_save").addEventListener("click",async ()=>{
    const payload={ name:$("cf_name").value, tranche:$("cf_tr").value, jours:$("cf_j").value, coach:$("cf_coach").value };
    if(!payload.name.trim()){ alert("Indiquez le nom de la catégorie."); return; }
    if(c) await api("/api/admin/categories/"+encodeURIComponent(c.id),{method:"PUT",body:JSON.stringify(payload)});
    else await api("/api/admin/categories",{method:"POST",body:JSON.stringify(payload)});
    closeModal(); await loadCats(); viewCategories();
  });
}
document.addEventListener("click",async e=>{
  const ed=e.target.closest("[data-cedit]"); if(ed) categoryModal(CATS.find(c=>c.id===ed.dataset.cedit));
  const dl=e.target.closest("[data-cdel]"); if(dl && confirm("Supprimer cette catégorie ?")){ await api("/api/admin/categories/"+encodeURIComponent(dl.dataset.cdel),{method:"DELETE"}); await loadCats(); viewCategories(); }
});

/* ============================================================
   PLANNING (séances)
   ============================================================ */
let SEANCES=[];
async function viewSeances(){
  try{ SEANCES=await (await api("/api/admin/seances")).json(); await loadCats(); }catch{ return; }
  const cols=JOURS.map(jr=>{
    const slots=SEANCES.filter(s=>s.jour===jr).sort((a,b)=>String(a.debut).localeCompare(String(b.debut)));
    const inner=slots.length? slots.map(s=>`<div class="slot"><span class="x" data-sdel="${s.id}">✕</span><b>${esc(s.debut)}–${esc(s.fin)}</b>${esc(s.categorie)||""}<br/><small>${esc(s.type)}${s.lieu?" · "+esc(s.lieu):""}${s.coach?" · "+esc(s.coach):""}</small></div>`).join("") : '<div class="none">—</div>';
    return `<div class="day"><h4>${jr}</h4><div class="slots">${inner}</div></div>`;
  }).join("");
  $("content").innerHTML=`
    <div class="form-card"><h3>+ Ajouter une séance</h3>
      <div class="frow">
        <label>Jour<select id="sf_jour">${listOptions(JOURS,"Lundi")}</select></label>
        <label>Début<input id="sf_deb" type="time" value="16:00"></label>
        <label>Fin<input id="sf_fin" type="time" value="18:00"></label>
        <label>Catégorie<select id="sf_cat">${catOptions("")}</select></label>
      </div>
      <div class="frow">
        <label>Type<select id="sf_type">${listOptions(["Technique","Physique","Tactique","Match","Gardiens","Théorie"],"Technique")}</select></label>
        <label>Lieu<input id="sf_lieu" placeholder="Terrain d'Akanda"></label>
        <label>Coach<input id="sf_coach" placeholder="Nom du coach"></label>
      </div>
      <button class="btn-sm btn-add" id="sf_save">Ajouter au planning</button>
    </div>
    <div class="week">${cols}</div>`;
  $("sf_save").addEventListener("click",async ()=>{
    const payload={ jour:$("sf_jour").value, debut:$("sf_deb").value, fin:$("sf_fin").value, categorie:$("sf_cat").value, type:$("sf_type").value, lieu:$("sf_lieu").value, coach:$("sf_coach").value };
    await api("/api/admin/seances",{method:"POST",body:JSON.stringify(payload)}); viewSeances();
  });
}
document.addEventListener("click",async e=>{
  const dl=e.target.closest("[data-sdel]"); if(dl){ await api("/api/admin/seances/"+encodeURIComponent(dl.dataset.sdel),{method:"DELETE"}); viewSeances(); }
});

/* ============================================================
   DÉTECTIONS
   ============================================================ */
let DETECTIONS=[];
async function viewDetections(){
  try{ DETECTIONS=await (await api("/api/admin/detections")).json(); }catch{ return; }
  const rows=DETECTIONS.map(d=>`<tr>
    <td><b>${esc(d.titre)}</b>${d.description?'<br/><small>'+esc(d.description)+'</small>':''}</td>
    <td>${new Date(d.date).toLocaleDateString("fr-FR")}${d.heure?'<br/><small>'+esc(d.heure)+'</small>':''}</td>
    <td>${esc(d.lieu)||"—"}</td>
    <td>${d.candidats||0}</td>
    <td><span class="chip ${d.statut==="à venir"?"on":"off"}">${esc(d.statut)}</span></td>
    <td><button class="btn-sm btn-edit" data-dedit="${d.id}">✎</button> <button class="btn-sm btn-del" data-ddel="${d.id}">🗑</button></td>
  </tr>`).join("");
  $("content").innerHTML=`
    <p class="hint">Organisez les journées de détection (tests) ouvertes aux jeunes des quartiers.</p>
    <div class="toolbar"><button class="btn-sm btn-add" id="dAdd">+ Programmer une détection</button></div>
    <div class="tablewrap"><table><tr><th>Détection</th><th>Date</th><th>Lieu</th><th>Candidats</th><th>Statut</th><th>Actions</th></tr>${rows||'<tr><td colspan="6" class="empty">Aucune détection programmée.</td></tr>'}</table></div>`;
  $("dAdd").addEventListener("click",()=>detectionModal());
}
function detectionModal(d){
  const e=d||{};
  openModal(`<h3>${d?"Modifier la détection":"Nouvelle journée de détection"}</h3>
    <label>Titre<input id="df_t" value="${esc(e.titre||"Journée de détection")}"></label>
    <div class="frow">
      <label>Date<input id="df_date" type="date" value="${esc(e.date||"")}"></label>
      <label>Heure<input id="df_h" type="time" value="${esc(e.heure||"")}"></label>
      <label>Candidats attendus<input id="df_c" type="number" value="${e.candidats!=null?e.candidats:''}"></label>
    </div>
    <label>Lieu<input id="df_lieu" value="${esc(e.lieu||"")}" placeholder="Terrain d'Akanda"></label>
    <label>Description<textarea id="df_desc" rows="2">${esc(e.description||"")}</textarea></label>
    <label>Statut<select id="df_stat">${listOptions(["à venir","passée"],e.statut||"à venir")}</select></label>
    <div class="modal-actions"><button class="btn-sm" style="background:#999" onclick="closeModal()">Annuler</button>
    <button class="btn-sm btn-add" id="df_save">${d?"Enregistrer":"Programmer"}</button></div>`);
  $("df_save").addEventListener("click",async ()=>{
    const payload={ titre:$("df_t").value, date:$("df_date").value, heure:$("df_h").value, candidats:$("df_c").value, lieu:$("df_lieu").value, description:$("df_desc").value, statut:$("df_stat").value };
    if(d) await api("/api/admin/detections/"+encodeURIComponent(d.id),{method:"PUT",body:JSON.stringify(payload)});
    else await api("/api/admin/detections",{method:"POST",body:JSON.stringify(payload)});
    closeModal(); viewDetections();
  });
}
document.addEventListener("click",async e=>{
  const ed=e.target.closest("[data-dedit]"); if(ed) detectionModal(DETECTIONS.find(d=>d.id===ed.dataset.dedit));
  const dl=e.target.closest("[data-ddel]"); if(dl && confirm("Supprimer cette détection ?")){ await api("/api/admin/detections/"+encodeURIComponent(dl.dataset.ddel),{method:"DELETE"}); viewDetections(); }
});

/* ============================================================
   FINANCES
   ============================================================ */
async function viewFinances(){
  let dash,exp; try{ dash=await (await api("/api/admin/dashboard")).json(); exp=await (await api("/api/admin/expenses")).json(); }catch{ return; }
  const fin=dash.finances;
  const cat={}; exp.forEach(e=>cat[e.category]=(cat[e.category]||0)+(+e.amount||0));
  const maxC=Math.max(1,...Object.values(cat));
  const catBars=Object.entries(cat).map(([c,v])=>`<div class="barrow"><div class="t"><span>${esc(c)}</span><b>${fmt(v)}</b></div><div class="bartrack"><div class="barfill green" style="width:${Math.round(v/maxC*100)}%"></div></div></div>`).join("")||'<p class="empty">Aucune dépense.</p>';
  const rows=exp.map(e=>`<tr><td>${new Date(e.date).toLocaleDateString("fr-FR")}</td><td>${esc(e.label)}</td><td><span class="chip">${esc(e.category)}</span></td><td><b>${fmt(e.amount)}</b></td><td><button class="btn-sm btn-del" data-xdel="${e.id}">🗑</button></td></tr>`).join("");
  $("content").innerHTML=`
    <div class="kpis">
      <div class="kpi"><div class="l">Cotisations attendues / mois</div><div class="n">${num(fin.cotisations)}</div></div>
      <div class="kpi"><div class="l">Encaissé (à jour)</div><div class="n" style="color:#1e7a45">${num(fin.encaisse)}</div></div>
      <div class="kpi"><div class="l">Dépenses</div><div class="n" style="color:#c0392b">${num(fin.depenses)}</div></div>
      <div class="kpi alt"><div class="l">Solde</div><div class="n">${num(fin.solde)}</div></div>
    </div>
    <p class="hint">Les recettes proviennent des cotisations des joueurs (module Joueurs). Enregistrez ici les dépenses de l'académie.</p>
    <div class="grid2">
      <div class="form-card"><h3>+ Enregistrer une dépense</h3>
        <div class="frow">
          <label>Date<input id="xf_date" type="date"></label>
          <label>Catégorie<select id="xf_cat"><option>Équipements</option><option>Terrain / location</option><option>Salaires coachs</option><option>Transport</option><option>Matériel médical</option><option>Licences / FEGAFOOT</option><option>Administratif</option><option>Autre</option></select></label>
          <label>Montant (FCFA)<input id="xf_amount" type="number"></label>
        </div>
        <label>Libellé<input id="xf_label" placeholder="Achat de ballons et chasubles"></label>
        <button class="btn-sm btn-add" id="xf_save">Ajouter la dépense</button>
      </div>
      <div class="panel"><h3>Dépenses par catégorie</h3><div class="barlist">${catBars}</div></div>
    </div>
    <div class="tablewrap"><table><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Montant</th><th></th></tr>${rows||'<tr><td colspan="5" class="empty">Aucune dépense enregistrée.</td></tr>'}</table></div>`;
  $("xf_save").addEventListener("click",async ()=>{
    const amt=$("xf_amount").value; if(!amt){ alert("Indiquez un montant."); return; }
    await api("/api/admin/expenses",{method:"POST",body:JSON.stringify({date:$("xf_date").value,category:$("xf_cat").value,amount:amt,label:$("xf_label").value})});
    viewFinances();
  });
}
document.addEventListener("click",async e=>{
  const d=e.target.closest("[data-xdel]"); if(d && confirm("Supprimer cette dépense ?")){ await api("/api/admin/expenses/"+encodeURIComponent(d.dataset.xdel),{method:"DELETE"}); viewFinances(); }
});

/* ============================================================
   PARAMÈTRES
   ============================================================ */
async function viewSettings(){
  let s; try{ s=await (await api("/api/admin/settings")).json(); }catch{ return; }
  $("content").innerHTML=`
    <div class="form-card"><h3>Coordonnées (utilisées sur le site public)</h3>
      <label>Numéro WhatsApp (format international, ex : 24166802521)<input id="sf_wa" value="${esc(s.whatsapp)}"></label>
      <div class="frow">
        <label>Lien page Facebook<input id="sf_fb" value="${esc(s.facebook||'')}"></label>
        <label>Lien Instagram<input id="sf_ig" value="${esc(s.instagram||'')}"></label>
      </div>
      <label>Localisation de l'académie<input id="sf_lieu" value="${esc(s.lieu||'')}"></label>
      <button class="btn-sm btn-add" id="sf_save">Enregistrer</button><span class="ok-msg" id="sf_ok"></span>
    </div>
    <div class="form-card"><h3>Changer le mot de passe administrateur</h3>
      <div class="frow">
        <label>Mot de passe actuel<input id="pw_cur" type="password"></label>
        <label>Nouveau mot de passe<input id="pw_new" type="password"></label>
      </div>
      <button class="btn-sm btn-add" id="pw_save">Mettre à jour le mot de passe</button><span class="ok-msg" id="pw_ok"></span>
    </div>`;
  $("sf_save").addEventListener("click",async ()=>{
    await api("/api/admin/settings",{method:"PUT",body:JSON.stringify({whatsapp:$("sf_wa").value,facebook:$("sf_fb").value,instagram:$("sf_ig").value,lieu:$("sf_lieu").value})});
    $("sf_ok").textContent="✓ Enregistré. Le site public est mis à jour.";
  });
  $("pw_save").addEventListener("click",async ()=>{
    const r=await api("/api/admin/password",{method:"POST",body:JSON.stringify({current:$("pw_cur").value,next:$("pw_new").value})});
    const d=await r.json(); $("pw_ok").style.color=r.ok?"#1e7a45":"#c0392b"; $("pw_ok").textContent=r.ok?"✓ Mot de passe mis à jour.":(d.error||"Erreur.");
  });
}

/* ---------- démarrage ---------- */
if(TOKEN) enter(); else showLogin();
