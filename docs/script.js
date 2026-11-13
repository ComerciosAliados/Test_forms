/* CMF Landing — Scripts | Last updated: 2026-06-29 */

// ===== ROUTER =====
/* navigateAndScroll() -> include.js */

function showFileName(input, labelId) {
  var label = document.getElementById(labelId);
  if (label) {
    label.textContent = input.files.length ? input.files[0].name : 'Sin archivo';
  }
}

// ===== PROVINCE MAP =====
function selectProvMap(el) {
  var alreadyActive = el.classList.contains('prov-active');
  document.querySelectorAll('#prov-map .prov-g').forEach(function(g) {
    g.classList.remove('prov-active');
  });
  var chip = document.getElementById('prov-map-chip');
  var sel  = document.getElementById('filter-prov');
  if (alreadyActive) {
    sel.value = '';
    chip.style.display = 'none';
  } else {
    el.classList.add('prov-active');
    sel.value = el.dataset.prov;
    document.getElementById('prov-map-chip-label').textContent = el.dataset.name;
    chip.style.display = 'inline-flex';
  }
  filterBrands();
}

function clearProvMap() {
  document.querySelectorAll('#prov-map .prov-g').forEach(function(g) {
    g.classList.remove('prov-active');
  });
  document.getElementById('filter-prov').value = '';
  document.getElementById('prov-map-chip').style.display = 'none';
  filterBrands();
}

// ===== COMERCIOS ALIADOS FILTER =====
function filterBrands() {
  var prov = document.getElementById('filter-prov').value;
  var cat  = document.getElementById('filter-cat').value;
  var cards = document.querySelectorAll('#brands-grid .brand-card:not(.more)');
  var count = 0;

  cards.forEach(function(card) {
    var provList = (card.dataset.prov || '').split(',');
    var cardCat  = card.dataset.cat || '';
    var matchProv = !prov || provList.indexOf(prov) !== -1;
    var matchCat  = !cat  || cardCat === cat;

    if (matchProv && matchCat) {
      card.style.display = '';
      count++;
    } else {
      card.style.display = 'none';
    }
  });

  // Show/hide +more card only when no filter active
  var moreCard = document.getElementById('brand-card-more');
  if (moreCard) moreCard.style.display = (!prov && !cat) ? '' : 'none';

  // Update count label
  var countEl = document.getElementById('brand-count');
  if (countEl) {
    countEl.textContent = count === 0
      ? 'Sin resultados para este filtro'
      : 'Mostrando ' + count + ' comercio' + (count === 1 ? '' : 's');
  }

  // Toggle no-results state
  var noResults = document.getElementById('brands-no-results');
  if (noResults) noResults.style.display = count === 0 ? '' : 'none';
}

/* navigate() ahora está en include.js (redirige entre páginas) */





// ===== MOBILE MENU =====
/* toggleMobile() -> include.js */
/* closeMobile() -> include.js */
function toggleMobExpand(el, bodyId) {
  var body = document.getElementById(bodyId);
  if (!body) return;
  var isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  el.classList.toggle('open', !isOpen);
}
function navToProduct(prod) {
  closeMobile();
  navigate('home');
  setTimeout(function() {
    var tab = document.querySelector('[data-prod="' + prod + '"]');
    if (tab) { tab.click(); }
    var sec = document.getElementById('productos');
    if (sec) {
      var top = sec.getBoundingClientRect().top + window.pageYOffset - 64;
      window.scrollTo({top: top, behavior: 'smooth'});
    }
  }, 320);
}
function navToSection(selector) {
  closeMobile();
  navigate('home');
  setTimeout(function() {
    var sec = document.querySelector(selector);
    if (sec) {
      var top = sec.getBoundingClientRect().top + window.pageYOffset - 64;
      window.scrollTo({top: top, behavior: 'smooth'});
    }
  }, 320);
}

// ===== PRODUCTS SHOWCASE =====
function switchProd2(prod) {
  document.querySelectorAll('.ps-tab').forEach(t => t.classList.remove('active'));
  var activeTab = document.querySelector('.ps-tab[onclick*="' + prod + '"]');
  if(activeTab){
    activeTab.classList.add('active');
    // Scroll pill into view inside the scrollable row
    activeTab.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  }
  document.querySelectorAll('.prod-panel').forEach(function(p){
    if(p.dataset.prod2p === prod){ p.classList.add('active'); }
    else { p.classList.remove('active'); }
  });
}
// Legacy alias
function switchProd(prod){ switchProd2(prod); }


// ===== MOMENTS CAROUSEL (handled by IIFE below) =====

// ===== PROMO FILTERS =====
var _activePromoTag = 'all';
var _activeCatTag = 'all';

function _applyPromoFilters() {
  document.querySelectorAll('.promo-card').forEach(function(card) {
    var tags = card.getAttribute('data-tags') || '';
    var cat  = card.getAttribute('data-cat') || '';
    var matchTag = _activePromoTag === 'all' || tags.indexOf(_activePromoTag) >= 0;
    var matchCat = _activeCatTag === 'all' || cat === _activeCatTag;
    card.style.display = (matchTag && matchCat) ? 'block' : 'none';
  });
}

function filterPromos(tag) {
  _activePromoTag = tag;
  _applyPromoFilters();
}

function filterCat(cat) {
  _activeCatTag = cat;
  _applyPromoFilters();
}

// ===== FAQ =====
function toggleFaq(el) {
  var item = el.parentElement;
  item.classList.toggle('open');
}

/* ===== CALCULATOR ===== */
var calcMonths = 6;
function updateCalc() {
  var amt = parseInt(document.getElementById('calcRange').value) || 500;
  var rate = 0.15 / 12;
  var pmt = (amt * rate * Math.pow(1 + rate, calcMonths)) / (Math.pow(1 + rate, calcMonths) - 1);
  document.getElementById('calcResult').textContent = Math.ceil(pmt).toLocaleString('es-PA');
}
var simMonths = 6;
function calcSim() {
  var amt = parseFloat(document.getElementById('simAmtInput').value) || 500;
  var rate = 0.15 / 12;
  var n = simMonths;
  var cuota = rate ? (amt * rate * Math.pow(1+rate,n)) / (Math.pow(1+rate,n)-1) : amt/n;
  document.getElementById('simResult').textContent = cuota.toFixed(2);
}
function syncSimSlider(slider) { document.getElementById('simAmtInput').value = slider.value; calcSim(); }
function syncSimInput(input) { var val = Math.min(5000,Math.max(100,parseInt(input.value)||100)); document.getElementById('simRange').value = val; calcSim(); }
function clampSimInput(input) { var val = Math.min(5000,Math.max(100,Math.round((parseInt(input.value)||100)/50)*50)); input.value = val; document.getElementById('simRange').value = val; calcSim(); }
function selectSimPlazo(btn) { btn.closest('.calc-pills-wrap').querySelectorAll('.calc-pill').forEach(function(b){ b.classList.remove('active'); }); btn.classList.add('active'); simMonths = parseInt(btn.dataset.months); calcSim(); }
function syncFromSlider(slider) {
  var val = parseInt(slider.value);
  document.getElementById('calcAmtInput').value = val;
  updateCalc();
}
function syncFromInput(input) {
  var raw = parseInt(input.value);
  if (isNaN(raw) || raw < 1) return;
  var val = Math.min(5000, Math.max(100, raw));
  document.getElementById('calcRange').value = val;
  updateCalc();
}
function clampInput(input) {
  var raw = parseInt(input.value) || 100;
  var val = Math.min(5000, Math.max(100, Math.round(raw / 50) * 50));
  input.value = val;
  document.getElementById('calcRange').value = val;
  updateCalc();
}
function selectPlazo(btn) {
  document.querySelectorAll('.calc-pill').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  calcMonths = parseInt(btn.dataset.months);
  updateCalc();
}

// ===== SCROLL REVEAL =====
// Elements are visible by default. JS adds animation only to off-screen elements.
function initReveal() {
  var vh = window.innerHeight;
  document.querySelectorAll('.reveal').forEach(function(el) {
    var rect = el.getBoundingClientRect();
    if (rect.top > vh) {
      // Below viewport — prepare animation
      el.classList.add('will-animate');
    } else {
      // Already visible — no animation needed
      el.classList.add('vis');
    }
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.remove('will-animate');
          e.target.classList.add('vis');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 60px 0px' });
    document.querySelectorAll('.reveal.will-animate').forEach(function(el) {
      obs.observe(el);
    });
  } else {
    // No IntersectionObserver — just show everything
    document.querySelectorAll('.reveal').forEach(function(el) {
      el.classList.remove('will-animate');
      el.classList.add('vis');
    });
  }
}

// Run as soon as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveal);
} else {
  initReveal();
}
// Re-init on navigation
var origNavigate = navigate;
// (already handles via the router above)

// Listen for DOM additions (new views shown)

  /* ===== MOMENTS CAROUSEL – PORTRAIT SPOTLIGHT ===== */
  (function(){
    function initCarousel() {
      var wrap  = document.getElementById('momWrap');
      var track = document.getElementById('momTrack');
      var fill  = document.getElementById('momFill');
      var counter = document.getElementById('momCounter');
      if(!track || !wrap) return;
      var cards = Array.from(track.querySelectorAll('.mc'));
      var total = cards.length;
      if(total === 0) return;

      var cur = 0, timer, startX = 0, startY = 0;
      var INTERVAL = 3500;

      function goTo(idx) {
        cur = (idx + total) % total;

        // Center active card in wrap
        var wrapW = wrap.offsetWidth;
        var cardLeft = cards[cur].offsetLeft;
        var cardW    = cards[cur].offsetWidth;
        var offset   = cardLeft - (wrapW / 2) + (cardW / 2);
        track.style.transform = 'translateX(-' + offset + 'px)';

        // Per-card state
        cards.forEach(function(c, i) {
          var dist = Math.abs(i - cur);
          c.classList.toggle('active', dist === 0);
          if (dist === 0) {
            c.style.opacity = '1';
            c.style.transform = 'scale(1)';
            c.style.filter = 'none';
          } else if (dist === 1) {
            c.style.opacity = '0.45';
            c.style.transform = 'scale(0.88)';
            c.style.filter = 'brightness(0.7)';
          } else {
            c.style.opacity = '0.15';
            c.style.transform = 'scale(0.78)';
            c.style.filter = 'brightness(0.5)';
          }
        });

        // Counter
        counter.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');

        // Progress bar
        resetProgress();
      }

      function resetProgress() {
        fill.style.transition = 'none';
        fill.style.width = '0%';
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            fill.style.transition = 'width ' + INTERVAL + 'ms linear';
            fill.style.width = '100%';
          });
        });
      }

      function next() { goTo(cur + 1); }
      function startTimer() { timer = setInterval(next, INTERVAL); }
      function stopTimer()  { clearInterval(timer); }

      // Touch support
      track.addEventListener('touchstart', function(e){
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        stopTimer();
      }, {passive:true});
      track.addEventListener('touchend', function(e){
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36){
          dx < 0 ? next() : goTo(cur - 1);
        }
        startTimer();
      }, {passive:true});

      // Click a card to focus it
      cards.forEach(function(c, i){
        c.addEventListener('click', function(e){
          if(i !== cur){ e.stopPropagation(); goTo(i); stopTimer(); startTimer(); }
        });
      });

      // Edge spacers so card 0 and card 5 can be centered
      var spacerW = Math.max(0, Math.round((wrap.offsetWidth - cards[0].offsetWidth) / 2));
      cards[0].style.marginLeft = spacerW + 'px';
      cards[total - 1].style.marginRight = spacerW + 'px';

      goTo(0);
      startTimer();
    }

    // Single init — run as soon as DOM is ready, retry once after full load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ setTimeout(initCarousel, 100); });
    } else {
      setTimeout(initCarousel, 100);
    }
    window.addEventListener('load', function(){ setTimeout(initCarousel, 200); });
  })();


  /* ===== APP BENTO (no JS needed — static grid) ===== */

  /* benefits section — static horizontal cards, no JS needed */


// ===== SCROLL REVEAL =====
(function(){
  var els = document.querySelectorAll('.pdp-stats,.pdp-benefits,.pdp-spotlight,.pdp-steps,.pdp-conditions,.pdp-faq,.pdp-also,.pdp-cta-band,.pdp-tc,.tc-section');
  els.forEach(function(el){ el.classList.add('reveal'); });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },{threshold:0.1});
  els.forEach(function(el){ io.observe(el); });
})();

// ===== STAT COUNTER =====
(function(){
  function animateCount(el, target, suffix){
    var start=0, duration=1200, step=16;
    var timer=setInterval(function(){
      start+=Math.ceil(target/(duration/step));
      if(start>=target){ start=target; clearInterval(timer); }
      el.textContent=(start>=1000?start.toLocaleString():start)+suffix;
    },step);
  }
  var statsObs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      statsObs.unobserve(e.target);
      e.target.querySelectorAll('.pdp-stat-num').forEach(function(n){
        var txt=n.textContent.trim();
        var match=txt.match(/^([+$]?)([0-9,]+)([^0-9]*)$/);
        if(match){
          var prefix=match[1], num=parseInt(match[2].replace(/,/g,'')), suffix=match[3]||'';
          n.textContent=prefix+'0'+suffix;
          animateCount(n,num,suffix);
          if(prefix) n.textContent=prefix+'0'+suffix;
          // re-run with prefix
          var timer2=null;
          var s2=0;
          clearInterval(timer2);
          s2=0;
          timer2=setInterval(function(){
            s2+=Math.ceil(num/(1200/16));
            if(s2>=num){s2=num;clearInterval(timer2);}
            n.textContent=prefix+(s2>=1000?s2.toLocaleString():s2)+suffix;
          },16);
        }
      });
    });
  },{threshold:0.4});
  document.querySelectorAll('.pdp-stats').forEach(function(s){ statsObs.observe(s); });
})();

// ===== CAROUSEL DOTS =====
(function(){
  document.querySelectorAll('.pdp-carousel-wrap').forEach(function(wrap){
    var grid=wrap.querySelector('.pdp-grid');
    var dots=wrap.querySelectorAll('.pdp-dot');
    if(!grid||!dots.length) return;
    grid.addEventListener('scroll',function(){
      var idx=Math.round(grid.scrollLeft/(grid.scrollWidth/dots.length));
      dots.forEach(function(d,i){ d.classList.toggle('active',i===idx); });
    });
    dots.forEach(function(d,i){
      d.addEventListener('click',function(){
        var cardW=grid.querySelector('.pdp-card');
        if(cardW) grid.scrollTo({left:i*(cardW.offsetWidth+14),behavior:'smooth'});
      });
    });
  });
})();

// ===== TC TAB SWITCHER =====
function switchTC(tab){
  document.querySelectorAll('.tc-tab').forEach(function(t){
    t.classList.toggle('active', t.getAttribute('onclick')&&t.getAttribute('onclick').includes("'"+tab+"'"));
  });
  document.querySelectorAll('.tc-panel').forEach(function(p){
    p.classList.toggle('active', p.dataset.tc===tab);
  });
}



function resolveCardImages() {
  var master = document.querySelector('[data-prod2p="gold"] .prod-img-inline');
  if(!master) return;
  var masterSrc = master.getAttribute('src');
  if(!masterSrc) return;
  document.querySelectorAll('[data-src-from-master]').forEach(function(img){
    img.setAttribute('src', masterSrc);
  });
}

function cmfQuiz(prod, btn) {
  var data = {
    gold: { name:'Mastercard Gold', desc:'Perfecta para viajeros y quienes buscan beneficios premium con Puntos C+ en cada compra y cobertura de viaje incluida.', nav:'gold' },
    cmf:  { name:'Tarjeta CMF',     desc:'Ideal para compradores frecuentes en la red de +200 comercios aliados. Hasta 36 meses sin recargo.', nav:'tarjeta-cmf' },
    digital: { name:'Cuenta Digital', desc:'Tu billetera 100% digital. Sin costo, sin filas. Envía y recibe dinero al instante desde tu cel.', nav:'cuenta-digital' },
    joven:   { name:'Cuenta Digital Joven', desc:'La primera cuenta de muchos logros. Desde los 13 años, con metas de ahorro y control parental total.', nav:'cuenta-joven' },
    black:   { name:'Mastercard Black', desc:'El nivel máximo de CMF. Puntos C+ dobles, salas VIP en aeropuertos, concierge 24/7 y cobertura de viaje premium.', nav:'black' }
  };
  var d = data[prod];
  document.getElementById('cmp-result-name').textContent = d.name;
  document.getElementById('cmp-result-desc').textContent = d.desc;
  document.getElementById('cmp-result-cta').onclick = function(){ navigate(d.nav); };
  document.getElementById('cmp-result').classList.add('show');
  document.querySelectorAll('.cmp-quiz-opt').forEach(function(o){
    o.style.opacity='0.45'; o.style.transform=''; o.style.borderColor=''; o.style.background='';
  });
  btn.style.opacity='1';
  btn.style.borderColor='var(--lima)';
  btn.style.background='rgba(147,213,0,0.07)';
  btn.style.transform='translateY(-3px)';
  document.getElementById('cmp-result').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function loadCmpImages() {
  var map = {
    'cmpimg-gold':    '[data-prod2p="gold"] .prod-img-inline',
    'cmpimg-cmf':     '[data-prod2p="cmf"] .prod-img-inline',
    'cmpimg-digital': '[data-prod2p="digital"] .prod-img-inline',
    'cmpimg-joven':   '[data-prod2p="joven"] .prod-img-inline',
    'cmpimg-black':   '[data-prod2p="gold"] .prod-img-inline'
  };
  Object.keys(map).forEach(function(id){
    var srcEl = document.querySelector(map[id]);
    var destEl = document.getElementById(id);
    if(srcEl && destEl) destEl.setAttribute('src', srcEl.getAttribute('src'));
  });
}



/* Resolver imágenes al cargar la página (compatibilidad) */
document.addEventListener('DOMContentLoaded', function () {
  try { if (typeof resolveCardImages === 'function') resolveCardImages(); } catch(e){}
  try { if (typeof loadCmpImages === 'function') loadCmpImages(); } catch(e){}
});
