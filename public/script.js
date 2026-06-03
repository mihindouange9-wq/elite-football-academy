/* Elite Football Academy — front */
let WHATSAPP="24100000000", FACEBOOK="https://www.facebook.com/", INSTAGRAM="https://www.instagram.com/";
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

  // soumission inscription
  $("insForm").addEventListener("submit",async e=>{
    e.preventDefault(); const f=e.target;
    const payload={
      enfant:{ nom:f.enfNom.value.trim(), age:f.enfAge.value, filiere:f.filiere.value, poste:f.poste.value, niveau:f.niveau.value.trim() },
      parent:{ nom:f.parNom.value.trim(), tel:f.parTel.value.trim(), email:f.parEmail.value.trim(), quartier:f.parQuartier.value.trim() },
      message:f.message.value.trim()
    };
    if(!payload.enfant.nom||!payload.parent.nom||!payload.parent.tel){ showToast("Renseignez l'enfant, le parent et le téléphone."); return; }
    const btn=$("insSubmit"); btn.disabled=true; const old=btn.textContent; btn.textContent="Envoi…";
    try{
      const r=await fetch("/api/inscriptions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const d=await r.json();
      if(r.ok){ showToast("✅ Demande envoyée ! L'académie vous recontacte très vite."); f.reset(); }
      else showToast(d.error||"Erreur lors de l'envoi.");
    }catch{
      // repli WhatsApp
      const m=`*INSCRIPTION — Elite Football Academy*%0A%0A👦 Enfant : ${payload.enfant.nom} (${payload.enfant.age} ans)%0A⚽ Filière : ${payload.enfant.filiere} — Poste : ${payload.enfant.poste}%0A👤 Parent : ${payload.parent.nom}%0A📞 Tél : ${payload.parent.tel}%0A${payload.message?("📝 "+payload.message+"%0A"):""}%0AMerci de me recontacter.`;
      window.open(`https://wa.me/${WHATSAPP}?text=${m}`,"_blank");
    }
    btn.disabled=false; btn.textContent=old;
  });
});
