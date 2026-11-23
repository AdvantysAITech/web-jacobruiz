/* jacobruiz.es · chat de la web (SofIA, asistente de IA de Jacob, en GHL)
   El chat de GHL no se carga al entrar en la página. Hasta que la persona pulsa
   el botón «Pregunta a SofIA» no se conecta con GHL ni se guarda nada en su
   navegador. Al pulsarlo se carga el widget y se abre. Si ya habló con SofIA
   antes (hay una sesión del chat guardada en este navegador), el widget se
   carga directamente para que no pierda la conversación. */
(function () {
  "use strict";
  var WIDGET = "6b048faa10f9c20b4dee27b6";
  var UBICACION = "6Uic5caqVwFRsJ6TtrRL";
  var cargado = false;
  var boton = null;

  function yaHabloAntes() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i) || "";
        if (k.indexOf("contact_session_" + UBICACION) !== -1) return true;
      }
    } catch (e) {}
    return false;
  }

  function abrir(intentos) {
    var lc = window.leadConnector && window.leadConnector.chatWidget;
    if (lc && typeof lc.openWidget === "function") {
      try { lc.openWidget(); } catch (e) {}
      quitarBoton();
      return;
    }
    if (intentos > 0) setTimeout(function () { abrir(intentos - 1); }, 250);
    else quitarBoton();
  }

  function quitarBoton() {
    if (boton) { boton.remove(); boton = null; }
  }

  function cargar(abrirAlCargar) {
    if (cargado) { if (abrirAlCargar) abrir(40); return; }
    cargado = true;
    var s = document.createElement("script");
    s.src = "https://widgets.leadconnectorhq.com/loader.js";
    s.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
    s.setAttribute("data-widget-id", WIDGET);
    s.async = true;
    document.body.appendChild(s);
    if (abrirAlCargar) {
      if (boton) {
        boton.setAttribute("aria-busy", "true");
        boton.querySelector(".jr-chat__texto").textContent = "Abriendo el chat…";
      }
      window.addEventListener("LC_chatWidgetLoaded", function () { abrir(40); }, { once: true });
      abrir(60);
    }
  }

  function pintarBoton() {
    var st = document.createElement("style");
    st.textContent =
      ".jr-chat{position:fixed;right:20px;bottom:20px;z-index:9000;display:flex;align-items:center;gap:10px;" +
      "min-height:52px;padding:0 18px 0 14px;border:0;border-radius:999px;cursor:pointer;" +
      "background:var(--accent,#e3a72f);color:#141414;font:500 15px/1.2 var(--font,system-ui,sans-serif);" +
      "box-shadow:0 8px 24px -8px rgba(0,0,0,.35)}" +
      ".jr-chat:hover{filter:brightness(1.05)}" +
      ".jr-chat:focus-visible{outline:2px solid var(--focus,#7a5400);outline-offset:3px}" +
      ".jr-chat svg{width:22px;height:22px;flex:none}" +
      ".jr-chat__ia{font-size:12px;font-weight:600;padding:2px 7px;border-radius:999px;background:rgba(20,20,20,.12)}" +
      "@media (max-width:520px){.jr-chat{right:14px;bottom:14px;padding:0 14px 0 12px}.jr-chat__texto{display:none}}";
    document.head.appendChild(st);
    boton = document.createElement("button");
    boton.type = "button";
    boton.className = "jr-chat";
    boton.setAttribute("aria-label", "Pregunta a SofIA, la asistente con inteligencia artificial de Jacob");
    boton.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>' +
      '<span class="jr-chat__texto">Pregunta a SofIA</span><span class="jr-chat__ia">IA</span>';
    boton.addEventListener("click", function () { cargar(true); });
    document.body.appendChild(boton);
  }

  function iniciar() {
    if (yaHabloAntes()) cargar(false);
    else pintarBoton();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
