/* jacobruiz.es · comportamiento de la web (sin dependencias) */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Imágenes aún no subidas: se muestra el hueco con su descripción ---------- */
  document.querySelectorAll(".media img").forEach(function (img) {
    function marcar() { img.parentElement.classList.add("is-missing"); }
    if (img.complete && img.naturalWidth === 0) marcar();
    img.addEventListener("error", marcar);
  });

  /* ---------- Menú en móvil ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu");
  function cerrarMenu() {
    doc.classList.remove("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (menu) menu.setAttribute("aria-hidden", "true");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var abierto = doc.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(abierto));
      menu.setAttribute("aria-hidden", String(!abierto));
      toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) cerrarMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarMenu(); });
  }

  /* ---------- Aparición al entrar en pantalla ---------- */
  var revelar = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    revelar.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revelar.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Página de recursos: capítulo activo en el índice ---------- */
  var indice = document.querySelector(".res-index");
  if (indice && "IntersectionObserver" in window) {
    var enlaces = {};
    indice.querySelectorAll("a").forEach(function (a) { enlaces[a.getAttribute("href").slice(1)] = a; });
    var activo = null;
    var io2 = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var a = enlaces[en.target.id];
        if (!a || a === activo) return;
        if (activo) activo.classList.remove("is-active");
        a.classList.add("is-active");
        activo = a;
        a.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".chapter").forEach(function (c) { io2.observe(c); });
  }

  /* ---------- Newsletter (varios formularios por página) ---------- */
  var EMAIL_N = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  document.querySelectorAll("[data-newsletter]").forEach(function (nf) {
    var err = nf.querySelector("[data-error]");
    var ok = nf.querySelector("[data-ok]");
    var btn = nf.querySelector("[type=submit]");
    nf.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(nf);
      if (fd.get("web")) return;
      var email = String(fd.get("email") || "").trim();
      var msg = "";
      if (!EMAIL_N.test(email)) msg = "Revisa el email: parece que falta algo.";
      else if (fd.get("acepta") !== "on") msg = "Marca la casilla para que pueda escribirte.";
      err.textContent = msg;
      if (msg) { (msg.indexOf("email") > -1 ? nf.querySelector("[name=email]") : nf.querySelector("[name=acepta]")).focus(); return; }
      var datos = { nombre: String(fd.get("nombre") || "").trim(), email: email, acepta: true, lugar: nf.getAttribute("data-lugar") || "web", web: "", pagina: location.pathname };
      btn.setAttribute("aria-busy", "true");
      var local = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === "file:";
      var envio = local
        ? new Promise(function (r) { console.info("[jacobruiz.es] Modo local, alta no enviada:", datos); setTimeout(r, 600); })
        : fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) })
            .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
      envio.then(function () {
        nf.classList.add("is-done");
        ok.hidden = false;
        ok.focus();
      }).catch(function () {
        err.textContent = "No he podido apuntarte. Inténtalo de nuevo en un momento o escríbeme a contacto@jacobruiz.es.";
      }).then(function () { btn.removeAttribute("aria-busy"); });
    });
  });

  /* ---------- Material del libro: registro o pregunta del libro ---------- */
  var gate = document.querySelector("[data-gate]");
  if (gate) {
    var CLAVE = "jr_material_libro";
    var okMsg = document.querySelector("[data-gate-ok]");
    function desbloquear(foco) {
      document.querySelectorAll("[data-href]").forEach(function (a) { a.setAttribute("href", a.getAttribute("data-href")); });
      doc.classList.add("material-libre");
      gate.hidden = true;
      okMsg.hidden = false;
      try { localStorage.setItem(CLAVE, "1"); } catch (e) {}
      if (foco) okMsg.focus();
    }
    var guardado = false;
    try { guardado = localStorage.getItem(CLAVE) === "1"; } catch (e) {}
    if (guardado) desbloquear(false);

    // Puerta 1: registro
    var gf = gate.querySelector("[data-gate-form]");
    var gErr = gf.querySelector("[data-error]");
    var gBtn = gf.querySelector("[type=submit]");
    gf.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(gf);
      if (fd.get("web")) return;
      var email = String(fd.get("email") || "").trim();
      var msg = "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) msg = "Revisa el email: parece que falta algo.";
      else if (fd.get("acepta_privacidad") !== "on") msg = "Marca la casilla de la política de privacidad para continuar.";
      gErr.textContent = msg;
      if (msg) return;
      var datos = { nombre: String(fd.get("nombre") || "").trim(), email: email, newsletter: fd.get("newsletter") === "on", acepta_privacidad: true, web: "", pagina: location.pathname };
      gBtn.setAttribute("aria-busy", "true");
      var local = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === "file:";
      var envio = local
        ? new Promise(function (r) { console.info("[jacobruiz.es] Modo local, registro no enviado:", datos); setTimeout(r, 600); })
        : fetch("/api/material", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) })
            .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });
      envio.then(function () { desbloquear(true); })
        .catch(function () { gErr.textContent = "No he podido registrarte. Inténtalo de nuevo o contesta la pregunta del libro."; })
        .then(function () { gBtn.removeAttribute("aria-busy"); });
    });

    // Puerta 2: pregunta del libro
    var PREGUNTAS = [
      { q: "En la conclusión, cada flujo que automatizas es «un ___ más». ¿Qué palabra falta?", a: ["ladrillo"] },
      { q: "Según el capítulo 14, ¿cuántos controles incluye el anexo de la norma ISO/IEC 42001?", a: ["38", "treinta y ocho"] },
      { q: "Según el capítulo 14, ¿en cuántas áreas se agrupan los controles de la norma ISO/IEC 42001?", a: ["9", "nueve"] }
    ];
    var gq = gate.querySelector("[data-gate-quiz]");
    var qLabel = gq.querySelector("[data-quiz-q]");
    var qInput = gq.querySelector("[name=respuesta]");
    var qErr = gq.querySelector("[data-error]");
    var actual = Math.floor(Math.random() * PREGUNTAS.length);
    function mostrar() { qLabel.textContent = PREGUNTAS[actual].q; qInput.value = ""; qErr.textContent = ""; }
    function normal(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
    mostrar();
    gq.querySelector("[data-quiz-next]").addEventListener("click", function () { actual = (actual + 1) % PREGUNTAS.length; mostrar(); qInput.focus(); });
    gq.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = normal(qInput.value);
      if (!r) { qErr.textContent = "Escribe la respuesta."; return; }
      var bien = PREGUNTAS[actual].a.some(function (x) { return normal(x) === r; });
      if (bien) desbloquear(true);
      else qErr.textContent = "Esa no es. Búscalo en el libro y vuelve a probar.";
    });
  }

  /* ---------- Formulario ---------- */
  var form = document.querySelector("[data-form]");
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var MOTIVOS = ["ai-act", "charla", "iso-42001", "contacto"];
  var ALIAS = { conferencia: "charla", diagnostico: "contacto" };
  var motivo = (params.get("motivo") || "").toLowerCase();
  if (ALIAS[motivo]) motivo = ALIAS[motivo];
  var select = form.querySelector("[name=motivo]");
  if (select && MOTIVOS.indexOf(motivo) > -1) select.value = motivo;

  /* Casilla de presupuesto: obligatoria salvo para «Otro asunto» */
  var cajaPresu = form.querySelector("[data-budget]");
  var presu = cajaPresu && cajaPresu.querySelector("input");
  function ajustarPresupuesto() {
    if (!presu || !select) return;
    var otro = select.value === "contacto";
    cajaPresu.hidden = otro;
    presu.required = !otro;
    if (otro) { cajaPresu.removeAttribute("data-invalid"); cajaPresu.querySelector(".field__error").textContent = ""; }
  }
  if (select) select.addEventListener("change", ajustarPresupuesto);
  ajustarPresupuesto();

  var status = form.querySelector("[data-status]");
  var done = document.querySelector("[data-done]");
  var boton = form.querySelector("[type=submit]");
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validar(campo) {
    var caja = campo.closest(".field") || campo.closest(".check");
    var error = caja && caja.querySelector(".field__error");
    var msg = "";
    if (campo.type === "checkbox") { if (campo.required && !campo.checked) msg = campo.name === "presupuesto" ? "Si no tienes presupuesto, prefiero que empieces por el libro y el material gratuito." : "Necesitamos tu aceptación para poder responderte."; }
    else if (campo.required && !campo.value.trim()) msg = "Este campo es obligatorio.";
    else if (campo.type === "email" && campo.value && !EMAIL.test(campo.value.trim())) msg = "Revisa el email: parece que falta algo.";
    if (caja) { if (msg) caja.setAttribute("data-invalid", ""); else caja.removeAttribute("data-invalid"); }
    if (error) error.textContent = msg;
    return !msg;
  }
  form.querySelectorAll("[required], [name=presupuesto]").forEach(function (c) {
    c.addEventListener("blur", function () { validar(c); });
    c.addEventListener(c.type === "checkbox" ? "change" : "input", function () {
      var caja = c.closest(".field") || c.closest(".check");
      if (caja && caja.hasAttribute("data-invalid")) validar(c);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.classList.remove("is-visible");
    var primero = null;
    form.querySelectorAll("[required]").forEach(function (c) { if (!validar(c) && !primero) primero = c; });
    if (primero) { primero.focus(); return; }

    var fd = new FormData(form);
    if (fd.get("web")) return;
    var datos = {
      nombre: String(fd.get("nombre") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      empresa: String(fd.get("empresa") || "").trim(),
      motivo: fd.get("motivo"),
      mensaje: String(fd.get("mensaje") || "").trim(),
      acepta_privacidad: fd.get("acepta_privacidad") === "on",
      presupuesto: fd.get("presupuesto") === "on",
      web: "",
      pagina: location.pathname + location.search
    };

    boton.setAttribute("aria-busy", "true");
    var local = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === "file:";
    var envio = local
      ? new Promise(function (ok) { console.info("[jacobruiz.es] Modo local, no se envía:", datos); setTimeout(ok, 700); })
      : fetch("/api/contacto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); });

    envio.then(function () {
      form.hidden = true;
      done.classList.add("is-visible");
      done.focus();
    }).catch(function () {
      status.classList.add("is-visible");
    }).then(function () {
      boton.removeAttribute("aria-busy");
    });
  });
})();
