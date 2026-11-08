/*variables */
var canvas = document.getElementById("juegoCanvas");
var ctx = canvas.getContext("2d");
var tiempo = 180;    
var tiempoMax = 180; 
var estado = "idle"; 

var palabrasLista = [
  "BUG", "VIRUS", "CODIGO", "VARIABLE", "BUCLE", 
  "ERROR", "FUNCION", "HTML", "NUMERO", "CSS", 
  "OBJETO", "CLASE", "BASE", "SERVIDOR", "WEB", 
  "USUARIO", "JAVA"
];

var letrasValidasSet = [];
for(var i = 0; i < palabrasLista.length; i++){
  var p = palabrasLista[i];
  for(var j = 0; j < p.length; j++){
    if(letrasValidasSet.indexOf(p[j]) === -1){
      letrasValidasSet.push(p[j]);
    }
  }
}

var bugs = [];
var virus = [];
var cafes = [];
var letras = [];
var teclas = {};
var intervaloTiempo;

function obtenerFactorVelocidad() {
  if (tiempo >= 120) {
    return 1.0;
  } else if (tiempo >= 60) {
    return 2.0;
  } else {
    return 3.0;
  }
}

function Jugador(x, y, color, nombre, esIA) {
  this.x = x;
  this.y = y;
  this.w = 54;
  this.h = 54;
  this.color = color;
  this.nombre = nombre;
  this.esIA = esIA;
  this.puntos = 0;
  this.vidas = 3;
  this.palabrasCompletadas = 0;
  
  this.vel = 7.0; 
  this.velBoost = 1; 
  this.boostTiempo = 0;
  
  this.palabraObjetivo = ""; 
  this.progreso = 0;
  this.intencion = "Buscando inicio";

  this.dibujar = function() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillRect(this.x + 5, this.y - 10, 10, 10);
    ctx.fillRect(this.x + this.w - 15, this.y - 10, 10, 10);
    ctx.fillStyle = "#fff";
    ctx.fillRect(this.x + 12, this.y + 12, 8, 8);
    ctx.fillRect(this.x + this.w - 20, this.y + 12, 8, 8);

    if(this.esIA){
      ctx.fillStyle = "#22d3ee";
      ctx.font = "bold 14px monospace";
      ctx.fillText(this.intencion, this.x, this.y - 14);
    }
    if(this.velBoost > 1){
      ctx.strokeStyle = "#f59e0b"; 
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 3, this.y - 3, this.w + 6, this.h + 6);
    } else if(this.velBoost < 1){
      ctx.strokeStyle = "#a855f7"; 
      ctx.lineWidth = 3;
      ctx.strokeRect(this.x - 3, this.y - 3, this.w + 6, this.h + 6);
    }
  };

  this.mover = function(dir){
    this.x += dir * this.vel * this.velBoost;
    if(this.x < 0) this.x = 0;
    if(this.x > canvas.width - this.w) this.x = canvas.width - this.w;
  };

  this.aplicarCafe = function(){
    this.puntos += 5;
    this.velBoost = 1.5;
    this.boostTiempo = 180; 
    if(this.vidas < 3) this.vidas++;
  };

  this.aplicarVirus = function(){
    this.velBoost = 0.5; 
    this.boostTiempo = 180; 
  };

  this.recogerLetra = function(letraObj){
    if(this.palabraObjetivo === ""){
      var posibles = palabrasLista.filter(function(p){ return p.startsWith(letraObj.letra); });
      
      if(posibles.length > 0){
        this.palabraObjetivo = posibles[Math.floor(Math.random() * posibles.length)];
        this.progreso = 1;
        this.puntos += 15;
        
        if(this.progreso >= this.palabraObjetivo.length){
          this.puntos += 20;
          this.palabrasCompletadas++;
          this.palabraObjetivo = "";
          this.progreso = 0;
        }
      }
      return;
    }

    var letraNecesaria = this.palabraObjetivo[this.progreso];
    if(letraObj.letra === letraNecesaria){
      this.progreso++;
      this.puntos += 15;
      
      if(this.progreso >= this.palabraObjetivo.length){
        this.puntos += 20;
        this.palabrasCompletadas++; 
        this.palabraObjetivo = ""; 
        this.progreso = 0;
      }
    } else {
      this.palabraObjetivo = "";
      this.progreso = 0;
    }
  };
}

var humano = new Jugador(150, canvas.height - 80, "#f472b6", "Humano", false);
var ia = new Jugador(canvas.width - 250, canvas.height - 80, "#22d3ee", "Android", true);

/*canvas objetos */
function Bug(x){
  this.x = x; this.y = -40; this.w = 40; this.h = 40; 
  this.velBase = 2 + Math.random() * 1.5;
  this.dibujar = function(){ 
    ctx.fillStyle = "#ef4444"; ctx.fillRect(this.x, this.y, this.w, this.h); 
    ctx.fillStyle="#000"; ctx.font="bold 12px sans-serif"; ctx.fillText("BUG", this.x + 6, this.y + 24); 
  };
  this.actualizar = function(){ this.y += this.velBase * obtenerFactorVelocidad(); };
}

function Virus(x){
  this.x = x; this.y = -50; this.w = 48; this.h = 48; 
  this.velBase = 2.5 + Math.random() * 1.5;
  this.dibujar = function(){ 
    ctx.fillStyle = "#a855f7"; ctx.fillRect(this.x, this.y, this.w, this.h); 
    ctx.fillStyle="#fff"; ctx.font="bold 12px sans-serif"; ctx.fillText("VIRUS", this.x + 4, this.y + 28); 
  };
  this.actualizar = function(){ this.y += this.velBase * obtenerFactorVelocidad(); };
}

function Cafe(x){
  this.x = x; this.y = -40; this.w = 40; this.h = 40; 
  this.velBase = 1.5;
  this.dibujar = function(){ 
    ctx.fillStyle = "#f59e0b"; ctx.fillRect(this.x, this.y, this.w, this.h); 
    ctx.fillStyle="#000"; ctx.font="24px sans-serif"; ctx.fillText("☕", this.x + 6, this.y + 29); 
  };
  this.actualizar = function(){ this.y += this.velBase * obtenerFactorVelocidad(); };
}

function Letra(x, letra){
  this.x = x; this.y = -55; this.w = 54; this.h = 54; 
  this.velBase = 1.2 + Math.random() * 0.8; 
  this.letra = letra;
  this.dibujar = function(){ 
    ctx.fillStyle = "#e2e8f0"; 
    ctx.fillRect(this.x, this.y, this.w, this.h); 
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.w, this.h);
    
    ctx.fillStyle = "#0f172a"; 
    ctx.font = "bold 32px monospace"; 
    ctx.textAlign = "center";
    ctx.fillText(this.letra, this.x + this.w / 2, this.y + 38); 
    ctx.textAlign = "left"; 
  };
  this.actualizar = function(){ this.y += this.velBase * obtenerFactorVelocidad(); };
}

function colision(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function generarObjetos(){
  if(Math.random() < 0.009) bugs.push(new Bug(Math.random()*(canvas.width - 40)));
  if(Math.random() < 0.006) virus.push(new Virus(Math.random()*(canvas.width - 48)));
  if(Math.random() < 0.007) cafes.push(new Cafe(Math.random()*(canvas.width - 40)));
  
  if(Math.random() < 0.038){
    var posX = Math.random() * (canvas.width - 60);
    var demasiadoCerca = letras.some(function(l){
      return Math.abs(l.x - posX) < 70 && l.y < 120; 
    });

    if(!demasiadoCerca){
      var l = letrasValidasSet[Math.floor(Math.random() * letrasValidasSet.length)];
      letras.push(new Letra(posX, l));
    }
  }
}

function inteligenciaIA(){
  var objetivo = null;
  var distanciaMin = 9999;

  /*Lógica de IA mejorada para priorización de letras y predicción de urgencia*/
  if(ia.palabraObjetivo === ""){
    ia.intencion = "Buscando inicio";
    var inicialesValidas = palabrasLista.map(function(p){ return p[0]; });
    for(var i=0; i<letras.length; i++){
      if(inicialesValidas.includes(letras[i].letra)){
        // Evaluar tanto la distancia horizontal como la proximidad de caída (cuánto falta para que baje)
        var d = Math.abs(letras[i].x - (ia.x + ia.w/2)) * 0.8 + (canvas.height - letras[i].y) * 0.2;
        if(d < distanciaMin){ distanciaMin = d; objetivo = letras[i]; }
      }
    }
  } else {
    var letraNecesaria = ia.palabraObjetivo[ia.progreso];
    ia.intencion = "Buscando: " + letraNecesaria;
    for(var i=0; i<letras.length; i++){
      if(letras[i].letra === letraNecesaria){
        var d = Math.abs(letras[i].x - (ia.x + ia.w/2)) * 0.8 + (canvas.height - letras[i].y) * 0.2;
        if(d < distanciaMin){ distanciaMin = d; objetivo = letras[i]; }
      }
    }
  }

  /*Si no encuentra la letra exacta o está muy lejos, evalúa si hay café cercano para ganar velocidad*/
  if(!objetivo && cafes.length > 0){
    for(var i=0; i<cafes.length; i++){
      var d = Math.abs(cafes[i].x - (ia.x + ia.w/2));
      if(d < distanciaMin && cafes[i].y < canvas.height - 200){ 
        distanciaMin = d; 
        objetivo = cafes[i]; 
      }
    }
    if(objetivo) ia.intencion = "Buscando Café";
  }

  // Capa de evasión de peligros inteligente (Bugs y Virus cercanos a menos de 100px)
  for(var i=0; i<bugs.length; i++){
    if(Math.abs(bugs[i].x - ia.x) < 90 && bugs[i].y > ia.y - 150 && bugs[i].y < ia.y + 60){
      if(ia.x < canvas.width/2) ia.mover(2); else ia.mover(-2);
      ia.intencion = "¡Esquivando Bug!";
      return;
    }
  }
  for(var i=0; i<virus.length; i++){
    if(Math.abs(virus[i].x - ia.x) < 90 && virus[i].y > ia.y - 150 && virus[i].y < ia.y + 60){
      if(ia.x < canvas.width/2) ia.mover(2); else ia.mover(-2);
      ia.intencion = "¡Esquivando Virus!";
      return;
    }
  }

  if(objetivo){
    if(objetivo.x < ia.x + ia.w/2 - 5) ia.mover(-1);
    else if(objetivo.x > ia.x + ia.w/2 + 5) ia.mover(1);
  }
}

function dibujarHUDEnCanvas() {
  ctx.save();
  
 /* 1. TIEMPO Y ESTADO (Centro Arriba - Más Grande) */
  ctx.textAlign = "center";
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("⏱ " + tiempo + "s / " + tiempoMax + "s", canvas.width / 2, 35);
  ctx.font = "14px monospace";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("Estado: " + estado.toUpperCase(), canvas.width / 2, 58);

  /*
   2. JUGADOR (Lado Izquierdo - Más Grande)
  */
  ctx.textAlign = "left";
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#f472b6";
  ctx.fillText("JUGADOR", 30, 32);
  
  ctx.font = "17px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Puntos: " + humano.puntos, 30, 60);
  
  var vidasHumanoTexto = "Vidas: " + "❤️".repeat(Math.max(0, humano.vidas)) + "🖤".repeat(Math.max(0, 3 - humano.vidas));
  ctx.fillText(vidasHumanoTexto, 30, 88);
  
  var objetivoHumano = humano.palabraObjetivo !== "" ? humano.palabraObjetivo : "Atrapa 1ª letra";
  ctx.fillText("Objetivo: " + objetivoHumano, 30, 116);
  
  var progresoHumanoTexto = "";
  if (humano.palabraObjetivo === "") {
    progresoHumanoTexto = "_ _ _ _";
  } else {
    for (var i = 0; i < humano.palabraObjetivo.length; i++) {
      progresoHumanoTexto += (i < humano.progreso) ? humano.palabraObjetivo[i] + " " : "_ ";
    }
  }
  ctx.font = "bold 22px monospace";
  ctx.fillStyle = "#f472b6";
  ctx.fillText(progresoHumanoTexto.trim(), 30, 148);


 /*3. NEMESIS IA (Lado Derecho - Más Grande)*/
  var posXIA = canvas.width - 340; 
  
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#22d3ee";
  ctx.fillText("NEMESIS IA", posXIA, 32);
  
  ctx.font = "17px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Puntos: " + ia.puntos, posXIA, 60);
  
  var vidasIATexto = "Vidas: " + "💚".repeat(Math.max(0, ia.vidas)) + "🖤".repeat(Math.max(0, 3 - ia.vidas));
  ctx.fillText(vidasIATexto, posXIA, 88);
  
  var objetivoIA = ia.palabraObjetivo !== "" ? ia.palabraObjetivo : "Atrapa 1ª letra";
  ctx.fillText("Objetivo: " + objetivoIA, posXIA, 116);
  
  var progresoIATexto = "";
  if (ia.palabraObjetivo === "") {
    progresoIATexto = "_ _ _ _";
  } else {
    for (var j = 0; j < ia.palabraObjetivo.length; j++) {
      progresoIATexto += (j < ia.progreso) ? ia.palabraObjetivo[j] + " " : "_ ";
    }
  }
  ctx.font = "bold 22px monospace";
  ctx.fillStyle = "#22d3ee";
  ctx.fillText(progresoIATexto.trim(), posXIA, 148);

  ctx.font = "bold 15px monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("IA: " + ia.intencion, posXIA, 175);

  ctx.restore();
}

function actualizarUI(){
  /* Compatible con funciones auxiliares*/
}

function procesarTeclasContinuas() {
  if (teclas["a"] || teclas["A"] || teclas["ArrowLeft"] || teclas["Left"]) {
    humano.mover(-1);
  }
  if (teclas["d"] || teclas["D"] || teclas["ArrowRight"] || teclas["Right"]) {
    humano.mover(1);
  }
}

function gameLoop(){
  if(estado !== "playing") return;

  procesarTeclasContinuas();

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f172a";
  for(var i=0; i<20; i++){
    ctx.fillRect((i*80 + Date.now()*0.05)%canvas.width, 0, 1, canvas.height);
  }

  dibujarHUDEnCanvas();

  if(humano.boostTiempo > 0){ humano.boostTiempo--; if(humano.boostTiempo==0) humano.velBoost=1; }
  if(ia.boostTiempo > 0){ ia.boostTiempo--; if(ia.boostTiempo==0) ia.velBoost=1; }

  generarObjetos();
  inteligenciaIA();

  for(var i=bugs.length-1; i>=0; i--){
    bugs[i].actualizar(); bugs[i].dibujar();
    if(bugs[i].y > canvas.height) bugs.splice(i,1);
    else {
      if(colision(humano, bugs[i])){ humano.vidas--; humano.puntos-=10; if(humano.puntos<0)humano.puntos=0; bugs.splice(i,1); continue; }
      if(colision(ia, bugs[i])){ ia.vidas--; ia.puntos-=10; if(ia.puntos<0)ia.puntos=0; bugs.splice(i,1); continue; }
    }
  }

  for(var i=virus.length-1; i>=0; i--){
    virus[i].actualizar(); virus[i].dibujar();
    if(virus[i].y > canvas.height) virus.splice(i,1);
    else {
      if(colision(humano, virus[i])){ humano.aplicarVirus(); virus.splice(i,1); continue; }
      if(colision(ia, virus[i])){ ia.aplicarVirus(); virus.splice(i,1); continue; }
    }
  }

  for(var i=cafes.length-1; i>=0; i--){
    cafes[i].actualizar(); cafes[i].dibujar();
    if(cafes[i].y > canvas.height) cafes.splice(i,1);
    else {
      if(colision(humano, cafes[i])){ humano.aplicarCafe(); cafes.splice(i,1); continue; }
      if(colision(ia, cafes[i])){ ia.aplicarCafe(); cafes.splice(i,1); continue; }
    }
  }

  for(var i=letras.length-1; i>=0; i--){
    letras[i].actualizar(); letras[i].dibujar();
    if(letras[i].y > canvas.height) letras.splice(i,1);
    else {
      if(colision(humano, letras[i])){ humano.recogerLetra(letras[i]); letras.splice(i,1); continue; }
      if(colision(ia, letras[i])){ ia.recogerLetra(letras[i]); letras.splice(i,1); continue; }
    }
  }

  humano.dibujar();
  ia.dibujar();

  if(humano.palabrasCompletadas >= 10){ finJuego("¡Gana Jugador por completar 10 palabras!"); return; }
  if(ia.palabrasCompletadas >= 10){ finJuego("¡Gana Android IA por completar 10 palabras!"); return; }

  if(humano.vidas <= 0 && ia.vidas <= 0){ finJuego("Empate - Ambos sin vidas"); }
  else if(humano.vidas <= 0){ finJuego("Gana Android IA"); }
  else if(ia.vidas <= 0){ finJuego("Gana Jugador"); }

  requestAnimationFrame(gameLoop);
}

function iniciar(){
  if(estado === "over"){ reiniciar(); return; }
  estado = "playing";
  document.getElementById("mensajeFinal").textContent = "¡Jugando! Completa 10 palabras o más puntos al terminar el tiempo";
  
  if(!intervaloTiempo){
    intervaloTiempo = setInterval(function(){
      if(estado === "playing"){
        tiempo--;
        if(tiempo <= 0){ 
          finJuego(humano.puntos > ia.puntos ? "Gana Jugador por puntos" : ia.puntos > humano.puntos ? "Gana Android por puntos" : "Empate por tiempo"); 
        }
      }
    }, 1000);
  }
  gameLoop();
}

function pausar(){
  if(estado === "playing"){ estado = "paused"; document.getElementById("mensajeFinal").textContent = "⏸ Pausado"; }
  else if(estado === "paused"){ estado = "playing"; document.getElementById("mensajeFinal").textContent = "¡Jugando!"; gameLoop(); }
}

function reiniciar(){
  tiempo = tiempoMax; 
  estado = "idle";
  bugs = []; virus = []; cafes = []; letras = [];
  humano = new Jugador(150, canvas.height - 80, "#f472b6", "Humano", false);
  ia = new Jugador(canvas.width - 250, canvas.height - 80, "#22d3ee", "Android", true);
  document.getElementById("mensajeFinal").textContent = "Presiona Iniciar";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  clearInterval(intervaloTiempo); 
  intervaloTiempo = null;
}

function finJuego(mensaje){
  estado = "over";
  document.getElementById("mensajeFinal").textContent = "🏁 " + mensaje + " - Jugador: " + humano.puntos + " pts ("+humano.palabrasCompletadas+" palabras) vs IA: " + ia.puntos + " pts ("+ia.palabrasCompletadas+" palabras)";
  clearInterval(intervaloTiempo);
  intervaloTiempo = null;
}

document.getElementById("btnIniciar").onclick = iniciar;
document.getElementById("btnPausar").onclick = pausar;
document.getElementById("btnReiniciar").onclick = reiniciar;

var btnIzq = document.getElementById("btnIzquierda");
var btnDer = document.getElementById("btnDerecha");

if (btnIzq) {
  btnIzq.addEventListener("touchstart", function(e) { e.preventDefault(); teclas["ArrowLeft"] = true; }, {passive: false});
  btnIzq.addEventListener("touchend", function(e) { e.preventDefault(); teclas["ArrowLeft"] = false; }, {passive: false});
  btnIzq.addEventListener("mousedown", function() { teclas["ArrowLeft"] = true; });
  btnIzq.addEventListener("mouseup", function() { teclas["ArrowLeft"] = false; });
}

if (btnDer) {
  btnDer.addEventListener("touchstart", function(e) { e.preventDefault(); teclas["ArrowRight"] = true; }, {passive: false});
  btnDer.addEventListener("touchend", function(e) { e.preventDefault(); teclas["ArrowRight"] = false; }, {passive: false});
  btnDer.addEventListener("mousedown", function() { teclas["ArrowRight"] = true; });
  btnDer.addEventListener("mouseup", function() { teclas["ArrowRight"] = false; });
}

document.getElementById("btnGirar").onclick = function(){
  if(screen.orientation && screen.orientation.lock){
    screen.orientation.lock("landscape").catch(()=>{ alert("Gira tu celular manualmente a horizontal"); });
  } else {
    alert("Gira tu celular a horizontal para tener más espacio");
  }
};

document.addEventListener("keydown", function(e){ teclas[e.key] = true; });
document.addEventListener("keyup", function(e){ teclas[e.key] = false; });