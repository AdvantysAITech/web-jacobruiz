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

  /* ---------- Formulario ---------- */
  var form = document.querySelector("[data-form]");
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var MOTIVOS = ["contacto", "diagnostico", "iso-42001", "conferencia"];
  var motivo = (params.get("motivo") || "").toLowerCase();
  var select = form.querySelector("[name=motivo]");
  if (select && MOTIVOS.indexOf(motivo) > -1) select.value = motivo;

  var status = form.querySelector("[data-status]");
  var done = document.querySelector("[data-done]");
  var boton = form.querySelector("[type=submit]");
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validar(campo) {
    var caja = campo.closest(".field") || campo.closest(".check");
    var error = caja && caja.querySelector(".field__error");
    var msg = "";
    if (campo.type === "checkbox") { if (campo.required && !campo.checked) msg = "Necesitamos tu aceptación para poder responderte."; }
    else if (campo.required && !campo.value.trim()) msg = "Este campo es obligatorio.";
    else if (campo.type === "email" && campo.value && !EMAIL.test(campo.value.trim())) msg = "Revisa el email: parece que falta algo.";
    if (caja) { if (msg) caja.setAttribute("data-invalid", ""); else caja.removeAttribute("data-invalid"); }
    if (error) error.textContent = msg;
    return !msg;
  }
  form.querySelectorAll("[required]").forEach(function (c) {
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
