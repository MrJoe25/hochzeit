(function () {
  'use strict';

  // Beim Laden und Neuladen immer oben starten, ohne #abschnitt in der Adresse
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (location.hash) {
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  window.scrollTo(0, 0);
  window.addEventListener('load', function () { window.scrollTo(0, 0); });

  // Interne Links scrollen weich, ohne die Adresse zu ändern
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.closest('.leaflet-container')) return; // Kartenknöpfe (z. B. Schließen-X) nicht anfassen
    var id = a.getAttribute('href').slice(1);
    var ziel = id === 'start' || !id ? null : document.getElementById(id);
    if (id && id !== 'start' && !ziel) return;
    e.preventDefault();
    if (ziel) ziel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- Sprache ----------
  var GCAL = {"de": "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Hochzeit%20Aline%20%26%20Joachim&dates=20270717T120000Z%2F20270718T000000Z&location=St.%20Albani%20Kirche%2C%20Albanikirchhof%201A%2C%2037073%20G%C3%B6ttingen&details=Programm%0A14%3A00%20Kirchliche%20Trauung%2C%20St.%20Albani%20Kirche%2C%20Albanikirchhof%201A%2C%2037073%20G%C3%B6ttingen%0A15%3A00%20Gratulation%20vor%20der%20Kirche%0Adanach%20Shuttle%20zum%20Kiessee%2C%20Abfahrt%20Albaniplatz%0A16%3A00%20Empfang%20im%20Biergarten%2C%20Kredo%20am%20Kiessee%2C%20Sandweg%209a%2C%2037083%20G%C3%B6ttingen%0A18%3A00%20Abendessen%0A21%3A00%20Tanz%20und%20Feier%20bis%202%20Uhr%2C%20danach%20Shuttle%20zu%20den%20Hotels%0A%0ADresscode%3A%20Cutaway%20oder%20dunkler%20Anzug%2C%20f%C3%BCr%20die%20Damen%20ein%20elegantes%20Kleid.%0A%0AAlle%20Infos%20und%20Zu-%20oder%20Absage%20bis%201.%20Februar%202027%3A%0Ahttps%3A%2F%2Fmrjoe25.github.io%2Fhochzeit%2F&ctz=Europe%2FBerlin", "fr": "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mariage%20Aline%20%26%20Joachim&dates=20270717T120000Z%2F20270718T000000Z&location=%C3%89glise%20St.%20Albani%2C%20Albanikirchhof%201A%2C%2037073%20G%C3%B6ttingen&details=Programme%0A14h00%20C%C3%A9r%C3%A9monie%20religieuse%2C%20%C3%A9glise%20St.%20Albani%2C%20Albanikirchhof%201A%2C%2037073%20G%C3%B6ttingen%0A15h00%20F%C3%A9licitations%20devant%20l%E2%80%99%C3%A9glise%0Aensuite%20navette%20vers%20le%20Kiessee%2C%20d%C3%A9part%20Albaniplatz%0A16h00%20Vin%20d%E2%80%99honneur%20au%20jardin%2C%20Kredo%20am%20Kiessee%2C%20Sandweg%209a%2C%2037083%20G%C3%B6ttingen%0A18h00%20D%C3%AEner%0A21h00%20Soir%C3%A9e%20dansante%20jusqu%E2%80%99%C3%A0%202%20heures%2C%20puis%20navette%20vers%20les%20h%C3%B4tels%0A%0ATenue%20%3A%20jaquette%20ou%20costume%20sombre%2C%20robe%20%C3%A9l%C3%A9gante%20pour%20les%20dames.%0A%0AToutes%20les%20informations%20et%20r%C3%A9ponse%20avant%20le%201er%20f%C3%A9vrier%202027%20%3A%0Ahttps%3A%2F%2Fmrjoe25.github.io%2Fhochzeit%2F&ctz=Europe%2FBerlin"};
  var istAndroid = /android/i.test(navigator.userAgent);
  if (istAndroid) document.documentElement.classList.add('is-android');
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
    document.querySelectorAll('.cal-ics').forEach(function (a) {
      // Android: Google Kalender direkt, sonst .ics (iPhone, Mac, Outlook)
      if (istAndroid) { a.href = GCAL[neu] || GCAL.de; a.removeAttribute('download'); a.target = '_blank'; a.rel = 'noopener'; }
      else a.href = 'kalender/hochzeit-aline-joachim-' + neu + '.ics';
    });
    document.querySelectorAll('.cal-g').forEach(function (a) { a.href = GCAL[neu] || GCAL.de; });
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
  function key(o) { return String(o.punkt || '') + '|' + String(o.name || ''); }
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
      return '<div class="card klickbar" data-ort="' + esc(key(o)) + '"><p class="label">' + kopf + '</p>' +
        '<p class="title"><button type="button" class="ort-btn">' + esc(o.name) + '</button></p>' +
        '<p>' + esc(o.adresse) + '</p>' +
        (text ? '<p class="small" style="margin-top:6px">' + esc(text) + '</p>' : '') +
        '<a class="textlink" target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(t('route')) + ' →</a></div>';
    }).join('');

    document.getElementById('park-liste').innerHTML = orte.filter(function (o) { return typ(o) === 'parken'; }).map(function (o) {
      return '<li data-ort="' + esc(key(o)) + '"><button type="button" class="ort-btn ort-inline">' + esc(o.name) + '</button>, ' + esc(String(o.adresse || '').replace(/,\s*\d{5}.*$/, '')) + ' · <a target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(t('route_kurz')) + '</a></li>';
    }).join('');

    document.getElementById('hotel-liste').innerHTML = orte.filter(function (o) { return typ(o) === 'hotel'; }).map(function (o) {
      var l = link(o);
      return '<div class="tile klickbar" data-ort="' + esc(key(o)) + '"><p class="label">' + esc(o.punkt) + '</p>' +
        '<p class="title"><button type="button" class="ort-btn">' + esc(o.name) + '</button></p>' +
        '<p>' + esc(String(o.adresse || '').replace(/,\s*\d{5}.*$/, '')) + '</p>' +
        (hinweis(o) ? '<p class="small">' + esc(hinweis(o)) + '</p>' : '') +
        '<a class="textlink" target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(t('route')) + ' →</a>' +
        (l ? ' &nbsp; <a class="textlink" target="_blank" rel="noopener" href="' + esc(l) + '">' + esc(t('website')) + ' →</a>' : '') +
        '</div>';
    }).join('');
  }

  // ---------- Karte ----------
  var karte = null, ebene = null, marker = {};

  // Klick auf einen Ort in der Liste: Karte darauf zentrieren
  function zeigeAufKarte(k) {
    var m = marker[k];
    if (!m || !karte) return;
    var box = document.querySelector('.map-box');
    var r = box.getBoundingClientRect();
    var sichtbar = r.top >= 0 && r.top < window.innerHeight * 0.5;
    var los = function () {
      karte.flyTo(m.getLatLng(), Math.max(karte.getZoom(), 16), { duration: 0.8 });
      karte.once('moveend', function () { m.openPopup(); });
    };
    if (sichtbar || box.classList.contains('is-full')) los();
    else { box.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(los, 450); }
  }
  document.addEventListener('click', function (e) {
    var p = e.target.closest('[data-punkt]');
    if (p) {
      var k = Object.keys(marker).filter(function (x) { return x.split('|')[0] === p.getAttribute('data-punkt'); })[0];
      if (k) zeigeAufKarte(k);
      return;
    }
    var el = e.target.closest('[data-ort]');
    if (!el || e.target.closest('a')) return;
    zeigeAufKarte(el.getAttribute('data-ort'));
  });

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
      var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      // Auf Handy/Tablet: Karte im Normalmodus nicht mit einem Finger verschieben, damit die Seite gut scrollt
      karte = L.map('map', { scrollWheelZoom: true, dragging: !touch });
      karte._touchModus = touch;
      vollbildKnopf();
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(karte);
      ebene = L.layerGroup().addTo(karte);
    }
    ebene.clearLayers();
    marker = {};
    var belegt = {};
    var punkte = [];
    var reihenfolge = { parken: 0, hotel: 1, shuttle: 2, station: 3 };
    orte.filter(function (o) { return o.lat && o.lng; })
      .sort(function (a, b) { return (reihenfolge[typ(a)] || 0) - (reihenfolge[typ(b)] || 0); })
      .forEach(function (o) {
        var lat = Number(o.lat), lng = Number(o.lng);
        var pos = lat.toFixed(4) + ',' + lng.toFixed(4);
        if (belegt[pos]) lng += 0.0005 * belegt[pos]; // gleiche Adresse leicht versetzen
        belegt[pos] = (belegt[pos] || 0) + 1;
        var text = typ(o) === 'shuttle' ? (hinweis(o) || t('shuttle_text')) : hinweis(o);
        var html = '<p class="popup-title">' + esc(o.name) + '</p>' +
          (o.uhrzeit ? '<p>' + esc(zeit(o)) + '</p>' : '') +
          '<p>' + esc(o.adresse) + '</p>' +
          (text ? '<p>' + esc(text) + '</p>' : '') +
          '<a class="textlink" target="_blank" rel="noopener" href="' + esc(route(o)) + '">' + esc(t('route')) + ' →</a>';
        marker[key(o)] = L.marker([lat, lng], { icon: pin(o), title: o.name, zIndexOffset: (reihenfolge[typ(o)] || 0) * 100, keyboard: true })
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
      if (hinweisEl) hinweisEl.textContent = lang === 'fr' ? '↔ Plein écran pour déplacer la carte' : '↔ Vollbild, um die Karte zu verschieben';
    }
    var hinweisEl = null;
    if (karte._touchModus) {
      hinweisEl = document.createElement('button');
      hinweisEl.type = 'button';
      hinweisEl.className = 'map-hinweis';
      box.classList.add('mit-hinweis');
      hinweisEl.addEventListener('click', function () { umschalten(); });
      box.appendChild(hinweisEl);
    }
    var gemerkt = 0;
    function umschalten(aus) {
      var an = aus ? false : !box.classList.contains('is-full');
      if (an === box.classList.contains('is-full')) return;
      if (an) gemerkt = window.scrollY;
      box.classList.toggle('is-full', an);
      if (karte._touchModus) { if (an) karte.dragging.enable(); else karte.dragging.disable(); }
      document.body.classList.toggle('map-open', an);
      if (!an) window.scrollTo({ top: gemerkt, behavior: 'instant' }); // zurück an dieselbe Stelle der Seite
      beschrifte();
      setTimeout(function () { karte.invalidateSize(); if (!an) window.scrollTo({ top: gemerkt, behavior: 'instant' }); }, 50);
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

// ---------- Führung: aktueller Abschnitt im Menü, Knopf nach oben, Sprungziele unter dem Menü ----------
(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  var oben = document.getElementById('nach-oben');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var abschnitte = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);

  function navHoehe() {
    var h = getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
    return h;
  }
  var nh = navHoehe();
  window.addEventListener('resize', function () { nh = navHoehe(); });

  var gewaehlt = null; // zuletzt im Menü angeklickt
  links.forEach(function (a) { a.addEventListener('click', function () { gewaehlt = a.getAttribute('href').slice(1); }); });
  var tick = false;
  function aktualisieren() {
    tick = false;
    var y = window.scrollY;
    // Knopf nach oben: erst nach etwas Scrollen, nicht über dem Antwortformular auf dem Handy
    var rsvp = document.getElementById('rueckmeldung').getBoundingClientRect();
    var imFormular = window.innerWidth <= 700 && rsvp.top < window.innerHeight && rsvp.bottom > 0;
    var tippt = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (oben) oben.hidden = y < 700 || imFormular || tippt;
    // Abschnitt, dessen Oberkante zuletzt unter dem Menü durchgelaufen ist
    var aktiv = null, grenze = nh + window.innerHeight * 0.3;
    var aktivOben = -Infinity;
    abschnitte.forEach(function (s) {
      var t = s.getBoundingClientRect().top; // nebeneinander liegende Abschnitte (Dresscode | Geschenke): den ersten nehmen
      if (t <= grenze && t > aktivOben + 1) { aktiv = s; aktivOben = t; }
    });
    var g = gewaehlt && document.getElementById(gewaehlt);
    if (g && aktiv && Math.abs(g.getBoundingClientRect().top - aktivOben) <= 1) aktiv = g;
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) aktiv = abschnitte[abschnitte.length - 1];
    links.forEach(function (a) {
      var an = aktiv && a.getAttribute('href') === '#' + aktiv.id;
      a.classList.toggle('is-aktiv', !!an);
      if (an) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  document.addEventListener('focusin', function () { requestAnimationFrame(aktualisieren); });
  document.addEventListener('focusout', function () { setTimeout(aktualisieren, 50); });
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(aktualisieren); } }, { passive: true });
  aktualisieren();
})();

// ---------- Seitenmenü auf dem Handy ----------
(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  var knopf = document.getElementById('menu-btn');
  var zu = document.getElementById('menu-zu');
  var schatten = document.getElementById('nav-schatten');
  var panel = document.getElementById('nav-panel');
  function setze(an, fokusZurueck) {
    nav.classList.toggle('is-offen', an);
    document.body.classList.toggle('menu-offen', an);
    schatten.hidden = !an;
    knopf.setAttribute('aria-expanded', an ? 'true' : 'false');
    if (an) { var erster = panel.querySelector('.nav-links a'); setTimeout(function () { erster.focus(); }, 60); }
    else if (fokusZurueck) knopf.focus();
  }
  knopf.addEventListener('click', function () { setze(!nav.classList.contains('is-offen')); });
  zu.addEventListener('click', function () { setze(false, true); });
  schatten.addEventListener('click', function () { setze(false, true); });
  panel.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { if (nav.classList.contains('is-offen')) setze(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-offen')) setze(false, true);
  });
  window.matchMedia('(min-width: 701px)').addEventListener('change', function (m) { if (m.matches) setze(false); });
})();
