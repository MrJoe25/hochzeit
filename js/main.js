(function () {
  'use strict';

  // ---------- Sprache ----------
  var deTexte = {}; // deutsche Originaltexte aus index.html
  var lang = 'de';
  var listeners = [];

  function speichern(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function laden(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function startSprache() {
    var p = new URLSearchParams(location.search).get('lang');
    if (p === 'de' || p === 'fr') return p;
    var s = laden('hochzeit-lang');
    if (s === 'de' || s === 'fr') return s;
    return (navigator.language || '').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'de';
  }

  function t(key) {
    var d = window.I18N.js[lang] || window.I18N.js.de;
    return d[key] != null ? d[key] : window.I18N.js.de[key];
  }

  function setzeSprache(neu) {
    lang = neu;
    document.documentElement.lang = neu;
    var fr = window.I18N.fr;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!(k in deTexte)) deTexte[k] = el.innerHTML;
      el.innerHTML = neu === 'fr' && fr[k] ? fr[k] : deTexte[k];
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var k = 'alt:' + el.getAttribute('data-i18n-alt');
      if (!(k in deTexte)) deTexte[k] = el.getAttribute('alt');
      el.setAttribute('alt', neu === 'fr' && fr[el.getAttribute('data-i18n-alt')] ? fr[el.getAttribute('data-i18n-alt')] : deTexte[k]);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var k = 'aria:' + el.getAttribute('data-i18n-aria');
      if (!(k in deTexte)) deTexte[k] = el.getAttribute('aria-label');
      el.setAttribute('aria-label', neu === 'fr' && fr[el.getAttribute('data-i18n-aria')] ? fr[el.getAttribute('data-i18n-aria')] : deTexte[k]);
    });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === neu ? 'true' : 'false');
    });
    document.title = neu === 'fr' ? 'Aline & Joachim · 17 juillet 2027' : 'Aline & Joachim · 17. Juli 2027';
    speichern('hochzeit-lang', neu);
    listeners.forEach(function (fn) { fn(neu); });
  }

  window.APP = {
    t: t,
    lang: function () { return lang; },
    onLang: function (fn) { listeners.push(fn); },
  };

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setzeSprache(b.getAttribute('data-lang')); });
  });

  // ---------- IBAN kopieren ----------
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      var fertig = function () { var alt = b.textContent; b.textContent = t('copied'); setTimeout(function () { b.textContent = alt; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(fertig, function () {});
    });
  });

  // ---------- Orte ----------
  // Ersatzdaten, falls das Google Skript (noch) nicht erreichbar ist. Koordinaten ungefähr.
  var ERSATZ = [
    { punkt: '1', typ: 'Station', name: 'St. Albani Kirche', adresse: 'Albanikirchhof 9, 37073 Göttingen', uhrzeit: '14:00', hinweis: 'Kirchliche Trauung, danach Gratulation vor der Kirche', hinweisFr: 'Cérémonie religieuse, puis félicitations devant l’église', lat: 51.5337, lng: 9.9411 },
    { punkt: '2', typ: 'Station', name: 'Kredo am Kiessee', adresse: 'Sandweg 9a, 37083 Göttingen', uhrzeit: 'ab 16:00', hinweis: 'Empfang im Biergarten, Abendessen und Feier', hinweisFr: 'Vin d’honneur au jardin, dîner et soirée', lat: 51.5199, lng: 9.9268 },
    { punkt: 'P1', typ: 'Parken', name: 'Parken an der Kirche', adresse: 'Albanipl. 1, 37073 Göttingen', lat: 51.5334, lng: 9.9398 },
    { punkt: 'P2', typ: 'Parken', name: 'Parkplatz am Kiessee', adresse: 'Sandweg 15, 37083 Göttingen', lat: 51.5192, lng: 9.9246 },
    { punkt: 'P3', typ: 'Parken', name: 'Parkplatz Jahnstadion', adresse: 'Sandweg 5, 37083 Göttingen', lat: 51.5222, lng: 9.9290 },
    { punkt: 'S1', typ: 'Shuttle', name: 'Shuttle Abfahrt', adresse: 'Albanipl. 1, 37073 Göttingen', lat: 51.5334, lng: 9.9398 },
    { punkt: 'H1', typ: 'Hotel', name: 'Hotel FREIgeist Göttingen Innenstadt', adresse: 'Berliner Str. 30, 37073 Göttingen', lat: 51.5370, lng: 9.9395 },
    { punkt: 'H2', typ: 'Hotel', name: 'Gebhards Hotel', adresse: 'Goethe-Allee 22-23, 37073 Göttingen', lat: 51.5352, lng: 9.9290 },
    { punkt: 'H3', typ: 'Hotel', name: 'Hotel Stadt Hannover', adresse: 'Goethe-Allee 21, 37073 Göttingen', lat: 51.5349, lng: 9.9297 },
  ];

  var orte = ERSATZ;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function typ(o) { return String(o.typ || '').toLowerCase(); }
  function hinweis(o) { return lang === 'fr' ? (o.hinweisFr || '') : (o.hinweis || ''); }
  function zeit(o) { var z = String(o.uhrzeit || ''); return lang === 'fr' ? z.replace(/^ab\s+/i, t('ab') + ' ') : z; }
  function route(o) {
    var ziel = o.genau && o.lat && o.lng ? o.lat + ',' + o.lng : (o.adresse || o.name);
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(ziel);
  }
  function link(o) {
    var l = String(o.link || '').trim();
    if (!l) return '';
    if (!/^https?:\/\//i.test(l)) l = 'https://' + l;
    return l;
  }

  function zeichneListen() {
    var stationen = orte.filter(function (o) { return typ(o) === 'station' || typ(o) === 'shuttle'; });
    document.getElementById('orte-liste').innerHTML = stationen.map(function (o) {
      var kopf = esc(o.punkt) + (o.uhrzeit ? ' · ' + esc(zeit(o)) : '');
      if (typ(o) === 'shuttle') kopf = esc(o.punkt.charAt(0)) + ' · ' + esc(t('shuttle'));
      var text = typ(o) === 'shuttle' ? (hinweis(o) || t('shuttle_text')) : hinweis(o);
      return '<div class="card"><p class="label">' + kopf + '</p>' +
        '<p class="title">' + esc(o.name) + '</p>' +
        '<p>' + esc(o.adresse) + '</p>' +
        (text ? '<p class="small" style="margin-top:6px">' + esc(text) + '</p>' : '') +
        '<a class="textlink" target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(t('route')) + ' →</a></div>';
    }).join('');

    document.getElementById('park-liste').innerHTML = orte.filter(function (o) { return typ(o) === 'parken'; }).map(function (o) {
      return '<li><a target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(o.name) + '</a>, ' + esc(String(o.adresse || '').replace(/,\s*\d{5}.*$/, '')) + '</li>';
    }).join('');

    document.getElementById('hotel-liste').innerHTML = orte.filter(function (o) { return typ(o) === 'hotel'; }).map(function (o) {
      var l = link(o);
      return '<div class="tile"><p class="label">' + esc(o.punkt) + '</p>' +
        '<p class="title">' + esc(o.name) + '</p>' +
        '<p>' + esc(String(o.adresse || '').replace(/,\s*\d{5}.*$/, '')) + '</p>' +
        (hinweis(o) ? '<p class="small">' + esc(hinweis(o)) + '</p>' : '') +
        '<a class="textlink" target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(t('route')) + ' →</a>' +
        (l ? ' &nbsp; <a class="textlink" target="_blank" rel="noopener" href="' + esc(l) + '">' + esc(t('website')) + ' →</a>' : '') +
        '</div>';
    }).join('');
  }

  // ---------- Karte ----------
  var karte = null, ebene = null;

  function pin(o) {
    var ty = typ(o);
    var cls = { station: 'pin-station', shuttle: 'pin-shuttle', hotel: 'pin-hotel', parken: 'pin-parken' }[ty] || 'pin-station';
    var size = { station: [34, 34], shuttle: [30, 30], hotel: [38, 28], parken: [24, 24] }[ty] || [34, 34];
    var label = ty === 'parken' ? 'P' : ty === 'shuttle' ? 'S' : o.punkt;
    return L.divIcon({ className: '', html: '<div class="pin ' + cls + '">' + esc(label) + '</div>', iconSize: size, iconAnchor: [size[0] / 2, size[1] / 2] });
  }

  function zeichneKarte() {
    if (!window.L) return;
    if (!karte) {
      karte = L.map('map', { scrollWheelZoom: true });
      vollbildKnopf();
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(karte);
      ebene = L.layerGroup().addTo(karte);
    }
    ebene.clearLayers();
    var belegt = {};
    var punkte = [];
    var reihenfolge = { parken: 0, hotel: 1, shuttle: 2, station: 3 };
    orte.filter(function (o) { return o.lat && o.lng; })
      .sort(function (a, b) { return (reihenfolge[typ(a)] || 0) - (reihenfolge[typ(b)] || 0); })
      .forEach(function (o) {
        var lat = Number(o.lat), lng = Number(o.lng);
        var key = lat.toFixed(4) + ',' + lng.toFixed(4);
        if (belegt[key]) lng += 0.0005 * belegt[key]; // gleiche Adresse leicht versetzen
        belegt[key] = (belegt[key] || 0) + 1;
        var text = typ(o) === 'shuttle' ? (hinweis(o) || t('shuttle_text')) : hinweis(o);
        var html = '<p class="popup-title">' + esc(o.name) + '</p>' +
          (o.uhrzeit ? '<p>' + esc(zeit(o)) + '</p>' : '') +
          '<p>' + esc(o.adresse) + '</p>' +
          (text ? '<p>' + esc(text) + '</p>' : '') +
          '<a class="textlink" target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(t('route')) + ' →</a>';
        L.marker([lat, lng], { icon: pin(o), title: o.name, zIndexOffset: (reihenfolge[typ(o)] || 0) * 100, keyboard: true })
          .bindPopup(html).addTo(ebene);
        if (typ(o) !== 'parken') punkte.push([lat, lng]);
      });
    letztePunkte = punkte;
    if (punkte.length) karte.fitBounds(punkte, { padding: [40, 40], maxZoom: 15 });
  }
  var letztePunkte = [];
  window.addEventListener('load', function () {
    if (!karte) return;
    karte.invalidateSize();
    if (letztePunkte.length) karte.fitBounds(letztePunkte, { padding: [40, 40], maxZoom: 15 });
  });

  // ---------- Vollbild ----------
  function vollbildKnopf() {
    var box = document.querySelector('.map-box');
    var Knopf = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        var b = L.DomUtil.create('button', 'map-full');
        b.type = 'button';
        b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path class="auf" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path class="zu" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
        L.DomEvent.disableClickPropagation(b);
        L.DomEvent.on(b, 'click', function () { umschalten(); });
        knopfEl = b;
        beschrifte();
        return b;
      },
    });
    var knopfEl = null;
    function beschrifte() {
      if (!knopfEl) return;
      var an = box.classList.contains('is-full');
      var txt = lang === 'fr' ? (an ? 'Quitter le plein écran' : 'Plein écran') : (an ? 'Vollbild beenden' : 'Vollbild');
      knopfEl.setAttribute('aria-label', txt);
      knopfEl.title = txt;
      knopfEl.setAttribute('aria-pressed', an ? 'true' : 'false');
    }
    function umschalten(aus) {
      var an = aus ? false : !box.classList.contains('is-full');
      box.classList.toggle('is-full', an);
      document.body.classList.toggle('map-open', an);
      beschrifte();
      setTimeout(function () { karte.invalidateSize(); }, 50);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-full')) umschalten(true);
    });
    window.APP.onLang(beschrifte);
    new Knopf().addTo(karte);
  }

  function zeichneAlles() { zeichneListen(); zeichneKarte(); }

  function ladeOrte() {
    var api = (window.HOCHZEIT && window.HOCHZEIT.apiUrl) || '';
    if (!api) return;
    fetch(api + '?action=orte')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok && d.orte && d.orte.length) {
          // fehlende Koordinaten aus den Ersatzdaten übernehmen
          d.orte.forEach(function (o) {
            if (!o.lat) { var e = ERSATZ.filter(function (x) { return x.adresse === o.adresse; })[0]; if (e) { o.lat = e.lat; o.lng = e.lng; } }
          });
          orte = d.orte;
          zeichneAlles();
        }
      })
      .catch(function () {});
  }

  window.APP.onLang(function () { zeichneAlles(); });
  setzeSprache(startSprache());
  ladeOrte();
})();
