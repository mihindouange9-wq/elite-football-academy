/* Elite Football Academy — front */
let WHATSAPP="24166802521", FACEBOOK="https://www.facebook.com/", INSTAGRAM="https://www.instagram.com/";
const $=id=>document.getElementById(id);

async function loadSettings(){
  try{ const r=await fetch("/api/public-settings"); if(r.ok){ const s=await r.json();
    if(s.whatsapp) WHATSAPP=String(s.whatsapp).replace(/\D/g,""); if(s.facebook) FACEBOOK=s.facebook; if(s.instagram) INSTAGRAM=s.instagram; } }catch{}
  const hello=`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Bonjour Elite Football Academy 👋, je souhaite inscrire mon enfant.")}`;
  ["waFloat","waInsc","waFoot"].forEach(id=>{ const el=$(id); if(el) el.href=hello; });
  if($("fbFoot")) $("fbFoot").href=FACEBOOK;
  if($("igFoot")) $("igFoot").href=INSTAGRAM;
}

function showToast(msg){ let t=document.querySelector(".toast"); if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t);} t.textContent=msg; t.classList.add("show"); clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove("show"),3200); }

// lecture du formulaire d'inscription
function readForm(){ const f=$("insForm"); return {
  enfant:{ nom:f.enfNom.value.trim(), age:f.enfAge.value, filiere:f.filiere.value, poste:f.poste.value, niveau:f.niveau.value.trim() },
  parent:{ nom:f.parNom.value.trim(), tel:f.parTel.value.trim(), email:f.parEmail.value.trim(), quartier:f.parQuartier.value.trim() },
  message:f.message.value.trim()
}; }
// construit le lien WhatsApp de pré-inscription pré-rempli vers l'académie
function waInscriptionURL(p){
  const L=["*PRÉ-INSCRIPTION — Elite Football Academy*",""];
  L.push("👦 Enfant : "+p.enfant.nom+(p.enfant.age?(" ("+p.enfant.age+" ans)"):""));
  L.push("⚽ Filière : "+(p.enfant.filiere||"—")+(p.enfant.poste?(" — Poste : "+p.enfant.poste):""));
  if(p.enfant.niveau) L.push("🎓 Niveau : "+p.enfant.niveau);
  L.push("👤 Parent : "+p.parent.nom);
  L.push("📞 Tél : "+p.parent.tel);
  if(p.parent.email) L.push("✉️ E-mail : "+p.parent.email);
  if(p.parent.quartier) L.push("📍 Quartier : "+p.parent.quartier);
  if(p.message) L.push("📝 "+p.message);
  L.push("","Merci de me recontacter pour la journée de détection. 🙏");
  return "https://wa.me/"+WHATSAPP+"?text="+encodeURIComponent(L.join("\n"));
}

document.addEventListener("DOMContentLoaded",()=>{
  loadSettings();
  $("year").textContent=new Date().getFullYear();

  // menu mobile
  $("burger").addEventListener("click",()=>$("nav").classList.toggle("open"));
  $("nav").addEventListener("click",e=>{ if(e.target.tagName==="A") $("nav").classList.remove("open"); });

  // boutons de formule -> présélectionne la filière + scroll
  document.querySelectorAll("[data-filiere]").forEach(b=>b.addEventListener("click",()=>{
    const sel=$("filiereSel"); if(sel) sel.value=b.dataset.filiere;
  }));

  // bouton "Pré-inscription sur WhatsApp" : reprend les infos déjà saisies si présentes
  const waBtn=$("waInsc");
  if(waBtn) waBtn.addEventListener("click",()=>{
    const p=readForm();
    if(p.enfant.nom && p.parent.tel) waBtn.href=waInscriptionURL(p);
    // sinon : garde le message d'accueil défini par loadSettings()
  });

  // soumission inscription -> ouvre WhatsApp pré-rempli vers l'académie + enregistre dans l'admin
  $("insForm").addEventListener("submit",e=>{
    e.preventDefault();
    const payload=readForm();
    if(!payload.enfant.nom||!payload.parent.nom||!payload.parent.tel){ showToast("Renseignez l'enfant, le parent et le téléphone."); return; }
    const btn=$("insSubmit"); const old=btn.textContent; btn.disabled=true; btn.textContent="Ouverture de WhatsApp…";
    // 1) enregistrement dans l'espace admin (sans bloquer l'ouverture de WhatsApp)
    fetch("/api/inscriptions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{});
    // 2) ouverture de WhatsApp avec la pré-inscription complète pré-remplie
    window.open(waInscriptionURL(payload),"_blank");
    showToast("✅ WhatsApp s'ouvre : envoyez le message pour finaliser la pré-inscription.");
    setTimeout(()=>{ btn.disabled=false; btn.textContent=old; },1000);
  });
});
