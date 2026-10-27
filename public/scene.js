/* ============================================================
   Scène WebGL d'arrière-plan : éclipse-ballon de l'ouverture, ondulations lumineuses,
   brume d'horizon de la galerie. Un seul quad plein écran, piloté par le défilement.
   ============================================================ */
window.SCENE = (() => {
  const canvas = document.getElementById("fond");
  if (!canvas) return null;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance", preserveDrawingBuffer: false });
  if (!gl) return null;
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS = `precision highp float;
uniform vec2 u_res;uniform vec2 u_ptr;uniform float u_time,u_open,u_dune,u_pan,u_intro,u_pulse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;
  float t=u_time;
  /* ondulations fines du sol, comme un sable que la lumière rase */
  float ond=fbm(uv*2.6+vec2(u_pan*.12,t*.02));
  float lignes=sin(uv.y*62.+ond*16.+uv.x*4.)*.5+.5;
  lignes=pow(lignes,7.);
  /* éclipse : disque sombre au bord crénelé */
  float a=atan(uv.y,uv.x);
  float seg=floor((a+3.14159)/6.28318*13.);
  float jag=(hash(vec2(seg,3.))-.5)*.04+(hash(vec2(seg*2.,7.))-.5)*.018;
  float base=(.355+jag+u_pulse*.004*sin(t*1.6+seg))*min(1.,u_res.x/u_res.y*1.35);
  float ouverture=smoothstep(0.,1.,u_open);
  float r=mix(base,2.2,ouverture*ouverture);
  float d=length(uv)-r;
  float disque=1.-smoothstep(0.,.0035,d);
  float anis=.5+.5*sin(a*2.+1.1+t*.12);
  float halo=exp(-max(d,0.)*7.5)*(1.-ouverture*.85)*(.65+.35*anis);
  float rim=exp(-max(d,0.)*70.)*(1.-ouverture);
  vec3 or=vec3(.83,.69,.22),vert=vec3(.14,.56,.31),creme=vec3(.97,.95,.91);
  vec3 col=vec3(0.);
  col+=(lignes*1.1+.22)*halo*mix(creme,mix(vert,or,.4),.45)*.95;
  col+=rim*creme*1.1;
  col=mix(col,vec3(0.),disque);
  /* lueur qui suit le pointeur pendant l'ouverture */
  vec2 pt=(u_ptr-.5*u_res)/u_res.y;pt.y=-pt.y;
  col+=exp(-length(uv-pt)*5.)*.05*(1.-disque)*vec3(.95,.85,.5)*u_intro;
  /* galerie : brume verte à l'horizon et projecteur au-dessus des écrans */
  float brume=exp(-abs(uv.y+.08)*5.)*.2+smoothstep(.6,-.2,uv.y)*.06;
  col+=u_dune*brume*mix(vert,or,.18)*(.8+.2*ond);
  col+=u_dune*exp(-length((uv-vec2(0.,.62))*vec2(.7,1.4))*2.2)*.11*creme;
  col+=u_dune*lignes*.035*smoothstep(.1,-.5,uv.y)*mix(vert,creme,.5);
  /* vignette */
  float vg=smoothstep(1.35,.3,length(uv));
  col*=mix(.7,1.,vg);
  gl_FragColor=vec4(col,1.);
}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; } return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ["u_res", "u_ptr", "u_time", "u_open", "u_dune", "u_pan", "u_intro", "u_pulse"]) U[n] = gl.getUniformLocation(prog, n);
  const etat = { open: 0, dune: 0, pan: 0, intro: 1, pulse: 1, ptr: [0, 0], actif: true };
  let W = 0, H = 0, dpr = 1;
  function taille() {
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1 : 1.5);
    W = Math.round(window.innerWidth * dpr); H = Math.round(window.innerHeight * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H); }
  }
  taille(); window.addEventListener("resize", taille);
  window.addEventListener("pointermove", (e) => { etat.ptr = [e.clientX * dpr, e.clientY * dpr]; }, { passive: true });
  const t0 = performance.now();
  let rafId = 0;
  function rendu() {
    rafId = 0;
    if (!etat.actif || document.hidden) return;
    gl.uniform2f(U.u_res, W, H); gl.uniform2f(U.u_ptr, etat.ptr[0], etat.ptr[1]);
    gl.uniform1f(U.u_time, (performance.now() - t0) / 1000);
    gl.uniform1f(U.u_open, etat.open); gl.uniform1f(U.u_dune, etat.dune); gl.uniform1f(U.u_pan, etat.pan); gl.uniform1f(U.u_intro, etat.intro); gl.uniform1f(U.u_pulse, etat.pulse);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(rendu);
  }
  function demarrer() { if (!rafId && etat.actif) rafId = requestAnimationFrame(rendu); }
  document.addEventListener("visibilitychange", demarrer);
  demarrer();
  return { etat, set(o) { Object.assign(etat, o); if (etat.actif) demarrer(); canvas.style.visibility = etat.actif ? "" : "hidden"; }, canvas };
})();
