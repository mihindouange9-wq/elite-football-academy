/* Minutage du film de présentation (sans voix) : partagé par la scène et par l'encodeur (musique). */
window.MINUTAGE = [
  { id: "ouv", d: 7 }, { id: "identite", d: 9 }, { id: "mission", d: 10 }, { id: "valeurs", d: 8 }, { id: "filieres", d: 11 }, { id: "programme", d: 9 }, { id: "parcours", d: 9 },
  { id: "transition", d: 6 },
  { id: "passeport", d: 9 }, { id: "parents", d: 9 }, { id: "coachs", d: 9 }, { id: "scolaire", d: 9 }, { id: "detection", d: 9 }, { id: "paiements", d: 9 }, { id: "partage", d: 9 }, { id: "direction", d: 9 }, { id: "site", d: 9 }, { id: "securite", d: 9 },
  { id: "fin", d: 7 },
];
window.DEBUTS = {}; { let t = 0; for (const m of window.MINUTAGE) { window.DEBUTS[m.id] = t; t += m.d; } window.DUREE_TOTALE = t; }
