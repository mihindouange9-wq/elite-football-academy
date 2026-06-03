/* Admin — Elite Football Academy */
let TOKEN=sessionStorage.getItem("elite_token")||"";
let DATA={inscriptions:[],stats:{}}; let timer=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const waNum=t=>{t=String(t||"").replace(/\D/g,"");return t.startsWith("241")?t:("241"+t.replace(/^0+/,""));};

async function api(p,o={}){ o.headers=Object.assign({"Content-Type":"application/json"},o.headers||{},{Authorization:"Bearer "+TOKEN});
  const r=await fetch(p,o); if(r.status===401){ logout(); throw new Error("401"); } return r; }
function show(v){ $("loginView").hidden=v!=="login"; $("appView").hidden=v!=="app"; }
function logout(){ TOKEN=""; sessionStorage.removeItem("elite_token"); clearInterval(timer); show("login"); }

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault(); $("loginErr").textContent="";
  try{ const r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:$("pwd").value})});
    const d=await r.json(); if(r.ok){ TOKEN=d.token; sessionStorage.setItem("elite_token",TOKEN); enter(); } else $("loginErr").textContent=d.error||"Échec.";
  }catch{ $("loginErr").textContent="Serveur indisponible."; }
});
$("logoutBtn").addEventListener("click",logout);
$("reloadBtn").addEventListener("click",load);
$("search").addEventListener("input",render);
$("filter").addEventListener("change",render);

function enter(){ show("app"); load(); clearInterval(timer); timer=setInterval(load,15000); }
async function load(){ try{ DATA=await (await api("/api/admin/inscriptions")).json(); render(); }catch{} }

function render(){
  const s=DATA.stats||{};
  $("stTotal").textContent=s.total||0; $("stNew").textContent=s.nouveaux||0;
  $("stInscrits").textContent=s.inscrits||0; $("stSE").textContent=s.sportEtudes||0;
  const q=($("search").value||"").toLowerCase(), f=$("filter").value;
  const list=(DATA.inscriptions||[]).filter(x=>(!f||x.status===f) &&
    (!q || (x.enfant.nom+x.parent.nom+x.parent.tel).toLowerCase().includes(q)));
  const box=$("cards");
  if(!list.length){ box.innerHTML='<p class="empty">Aucune demande'+(f?" ("+f+")":"")+".</p>"; return; }
  box.innerHTML=list.map(x=>{
    const w=waNum(x.parent.tel);
    const dt=new Date(x.createdAt).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
    const opts=["nouveau","contacté","détection","inscrit","refusé"].map(o=>`<option ${o===x.status?"selected":""}>${o}</option>`).join("");
    return `<div class="ins s-${x.status}">
      <div class="ins-head">
        <span class="ins-name">⚽ ${esc(x.enfant.nom)} <small style="font-family:Barlow;color:#6c736e;font-size:.8rem">${esc(x.enfant.age)} ans</small></span>
        <span class="badge b-${x.status}">${x.status}</span>
      </div>
      <div class="ins-grid">
        <div><b>Filière :</b> ${esc(x.enfant.filiere)||"—"}</div>
        <div><b>Poste :</b> ${esc(x.enfant.poste)||"—"}</div>
        <div><b>Parent :</b> ${esc(x.parent.nom)}</div>
        <div><b>Téléphone :</b> ${esc(x.parent.tel)}</div>
        <div><b>Quartier :</b> ${esc(x.parent.quartier)||"—"}</div>
        <div><b>E-mail :</b> ${esc(x.parent.email)||"—"}</div>
        <div><b>Niveau :</b> ${esc(x.enfant.niveau)||"—"}</div>
        <div><b>Reçu le :</b> ${dt}</div>
      </div>
      ${x.message?`<div class="ins-msg">📝 ${esc(x.message)}</div>`:""}
      <div class="ins-act">
        <select data-status="${x.id}">${opts}</select>
        <a class="mini call" href="tel:+${w}">📞 Appeler</a>
        <a class="mini wa" target="_blank" href="https://wa.me/${w}?text=${encodeURIComponent("Bonjour "+x.parent.nom+", merci pour l'inscription de "+x.enfant.nom+" à Elite Football Academy…")}">💬 WhatsApp</a>
        <button class="mini del" data-del="${x.id}">🗑 Supprimer</button>
      </div>
    </div>`;
  }).join("");
}

document.addEventListener("change",async e=>{
  const s=e.target.closest("[data-status]"); if(!s) return;
  await api("/api/admin/inscriptions/"+encodeURIComponent(s.dataset.status),{method:"PATCH",body:JSON.stringify({status:s.value})});
  load();
});
document.addEventListener("click",async e=>{
  const d=e.target.closest("[data-del]"); if(d && confirm("Supprimer cette demande ?")){ await api("/api/admin/inscriptions/"+encodeURIComponent(d.dataset.del),{method:"DELETE"}); load(); }
});

if(TOKEN) enter(); else show("login");
