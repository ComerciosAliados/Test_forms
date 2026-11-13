/* ============================================================
   include.js  —  Carga el menú y el pie de página compartidos
   ------------------------------------------------------------
   El menú vive en  components/header.html
   El pie vive en   components/footer.html
   Editando esos dos archivos se actualizan TODAS las páginas.

   Nota: usa fetch(), así que el sitio debe abrirse por HTTP
   (GitHub Pages o Firebase). Para probar en tu PC, usa un
   servidor local, p. ej.:  python -m http.server
   ============================================================ */

(function () {
  // Inserta el contenido de un componente dentro de un contenedor
  function incluir(id, url) {
    var cont = document.getElementById(id);
    if (!cont) return Promise.resolve();
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (html) { cont.innerHTML = html; })
      .catch(function (e) { console.error("No se pudo cargar", url, e); });
  }

  // Carga menú y pie de página
  incluir("site-header", "components/header.html").then(marcarActivo);
  incluir("site-footer", "components/footer.html");

  // Marca como activo el enlace de la página actual
  function marcarActivo() {
    var pagina = (location.pathname.split("/").pop() || "index.html");
    var vista = pagina.replace(".html", "");
    if (pagina === "index.html" || pagina === "") vista = "home";
    var link = document.querySelector('.nav-link[data-view="' + vista + '"]');
    if (link) link.classList.add("active");
  }
})();

/* ---- Navegación entre páginas ----
   navigate() redirige al archivo correspondiente, así todos los
   onclick="navigate('...')" del menú siguen funcionando. */
function navigate(view) {
  window.location.href = (view === "home") ? "index.html" : view + ".html";
}

/* Ir a una página y hacer scroll a una sección */
function navigateAndScroll(view, sectionId) {
  var destino = (view === "home") ? "index.html" : view + ".html";
  if (sectionId) destino += "#" + sectionId;
  window.location.href = destino;
}

/* ---- Menú móvil ---- */
function toggleMobile() {
  var m = document.getElementById("mobile-menu");
  var b = document.getElementById("mobile-backdrop");
  if (m) m.classList.toggle("open");
  if (b) b.classList.toggle("open");
}
function closeMobile() {
  var m = document.getElementById("mobile-menu");
  var b = document.getElementById("mobile-backdrop");
  if (m) m.classList.remove("open");
  if (b) b.classList.remove("open");
}

/* ---- Al llegar a la home con #prod=xxx, abrir ese producto ---- */
window.addEventListener("load", function () {
  var m = location.hash.match(/prod=([a-z]+)/);
  if (m) {
    setTimeout(function () {
      var tab = document.querySelector('[data-prod="' + m[1] + '"]');
      if (tab) tab.click();
      var sec = document.getElementById("productos");
      if (sec) {
        var top = sec.getBoundingClientRect().top + window.pageYOffset - 64;
        window.scrollTo({ top: top, behavior: "smooth" });
      }
    }, 300);
  }
});
