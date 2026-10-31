/* jacobruiz.es · analítica con consentimiento (Google Analytics 4)
   Google Analytics solo se carga si la persona lo acepta. Hasta entonces no se
   instala ninguna cookie ni se envía ningún dato a Google. La elección se guarda
   en este navegador durante 12 meses y se puede cambiar en /cookies. */
(function () {
  "use strict";
  var ID_GA = "G-NV1E6VM3LR";
  var CLAVE = "jr_consentimiento_analitica";
  var VIGENCIA_MS = 365 * 24 * 60 * 60 * 1000;

  function leer() {
    try {
      var v = JSON.parse(localStorage.getItem(CLAVE) || "null");
      if (v && (v.valor === "si" || v.valor === "no") && Date.now() - v.fecha < VIGENCIA_MS) return v.valor;
    } catch (e) {}
    return null;
  }
  function guardar(valor) {
    try { localStorage.setItem(CLAVE, JSON.stringify({ valor: valor, fecha: Date.now() })); } catch (e) {}
  }

  var cargado = false;
  function cargarGA() {
    window["ga-disable-" + ID_GA] = false;
    if (cargado) return;
    cargado = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ID_GA);
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID_GA;
    document.head.appendChild(s);
  }

  function borrarCookiesGA() {
    window["ga-disable-" + ID_GA] = true; // deja de enviar datos en esta página si ya se había cargado
    var dominios = [location.hostname, "." + location.hostname.replace(/^www\./, "")];
    document.cookie.split(";").forEach(function (c) {
      var nombre = c.split("=")[0].trim();
      if (/^_ga/.test(nombre) || nombre === "_gid") {
        dominios.forEach(function (d) {
          document.cookie = nombre + "=; Max-Age=0; path=/; domain=" + d;
        });
        document.cookie = nombre + "=; Max-Age=0; path=/";
      }
    });
  }

  var estilos =
    ".jr-cookies{position:fixed;left:var(--gutter,16px);right:var(--gutter,16px);bottom:16px;z-index:9999;" +
    "max-width:560px;margin-inline:auto;background:var(--surface,#fff);color:var(--text,#141414);" +
    "border:1px solid var(--line-strong,#d6d4cd);border-radius:var(--radius-core,18px);" +
    "box-shadow:var(--shadow,0 12px 32px -12px rgba(20,20,20,.18));padding:20px 22px;" +
    "font:15px/1.5 var(--font,system-ui,sans-serif)}" +
    ".jr-cookies p{margin:0 0 14px;color:var(--text-2,#4f4d48)}" +
    ".jr-cookies strong{color:var(--text,#141414)}" +
    ".jr-cookies a{color:inherit;text-decoration:underline;text-underline-offset:2px}" +
    ".jr-cookies__botones{display:flex;gap:10px;flex-wrap:wrap}" +
    ".jr-cookies__botones button{flex:1 1 140px;min-height:44px;border-radius:999px;cursor:pointer;" +
    "font:600 15px/1 var(--font,system-ui,sans-serif);padding:12px 18px;border:1px solid var(--text,#141414)}" +
    ".jr-cookies__rechazar{background:transparent;color:var(--text,#141414)}" +
    ".jr-cookies__aceptar{background:var(--inverse-bg,#141414);color:var(--inverse-text,#f6f5f1)}" +
    ".jr-cookies button:focus-visible{outline:2px solid var(--focus,#7a5400);outline-offset:2px}";

  var aviso = null;
  function cerrar() {
    if (aviso) { aviso.remove(); aviso = null; }
  }
  function mostrar() {
    if (aviso) return;
    if (!document.getElementById("jr-cookies-estilos")) {
      var st = document.createElement("style");
      st.id = "jr-cookies-estilos";
      st.textContent = estilos;
      document.head.appendChild(st);
    }
    aviso = document.createElement("div");
    aviso.className = "jr-cookies";
    aviso.setAttribute("role", "dialog");
    aviso.setAttribute("aria-live", "polite");
    aviso.setAttribute("aria-label", "Cookies de analítica");
    aviso.innerHTML =
      "<p><strong>¿Me dejas medir las visitas?</strong> Uso Google Analytics para saber cuánta gente lee esta web " +
      "y qué páginas le sirven. Solo si aceptas. Nada de publicidad. <a href=\"/cookies\">Más información</a></p>" +
      "<div class=\"jr-cookies__botones\">" +
      "<button type=\"button\" class=\"jr-cookies__rechazar\">Rechazar</button>" +
      "<button type=\"button\" class=\"jr-cookies__aceptar\">Aceptar</button>" +
      "</div>";
    aviso.querySelector(".jr-cookies__aceptar").addEventListener("click", function () {
      guardar("si"); cerrar(); cargarGA();
    });
    aviso.querySelector(".jr-cookies__rechazar").addEventListener("click", function () {
      guardar("no"); cerrar(); borrarCookiesGA();
    });
    document.body.appendChild(aviso);
  }

  // Para el botón «Cambiar mi elección» de la página de cookies
  window.jrCookies = {
    abrir: function () {
      if (leer() === "si") { guardar("no"); borrarCookiesGA(); }
      try { localStorage.removeItem(CLAVE); } catch (e) {}
      mostrar();
    }
  };

  function iniciar() {
    var eleccion = leer();
    if (eleccion === "si") cargarGA();
    else if (eleccion === null) mostrar();
    document.querySelectorAll("[data-cookies-abrir]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); window.jrCookies.abrir(); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
