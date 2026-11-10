(function () {
  'use strict';
  var t = window.APP.t;
  var api = (window.HOCHZEIT && window.HOCHZEIT.apiUrl) || '';

  var suche = document.getElementById('rsvp-suche');
  var gruppeForm = document.getElementById('rsvp-gruppe');
  var nameInput = document.getElementById('rsvp-name');
  var pwInput = document.getElementById('rsvp-pw');
  var sucheMsg = document.getElementById('suche-msg');
  var gruppeMsg = document.getElementById('gruppe-msg');
  var vorschlaege = document.getElementById('vorschlaege');
  var personen = document.getElementById('personen');

  var aktuell = null; // { name, password, members, open }
  var letzteMeldung = null; // { el, key, cls } – wird beim Sprachwechsel neu übersetzt

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function zeige(el) {
    var r = el.getBoundingClientRect();
    var oben = (document.querySelector('.nav') && getComputedStyle(document.querySelector('.nav')).position === 'sticky') ? document.querySelector('.nav').offsetHeight : 0;
    if (r.top < oben + 8 || r.bottom > window.innerHeight - 8) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function meldung(el, key, cls) {
    letzteMeldung = key ? { el: el, key: key, cls: cls } : null;
    el.innerHTML = key ? '<p class="msg ' + (cls || '') + '" role="' + (cls === 'error' ? 'alert' : 'status') + '">' + esc(t(key)) + '</p>' : '';
  }

  // Ladeanzeige im Knopf: Drehkreis und Text "Suche …" / "Wird gesendet …"
  function laedt(knopf, an, key) {
    if (an) {
      knopf.dataset.text = knopf.innerHTML;
      knopf.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + esc(t(key));
      knopf.classList.add('is-loading');
      knopf.disabled = true;
      knopf.setAttribute('aria-busy', 'true');
    } else {
      if (knopf.dataset.text != null) knopf.innerHTML = knopf.dataset.text;
      knopf.classList.remove('is-loading');
      knopf.disabled = false;
      knopf.removeAttribute('aria-busy');
    }
  }

  function post(daten) {
    // text/plain vermeidet die CORS-Vorabfrage, die Apps Script nicht beantwortet
    return fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(daten) })
      .then(function (r) { return r.json(); });
  }

  function fehler(el, res) {
    var map = { password: 'err_password', closed: 'err_closed' };
    meldung(el, map[res && res.error] || 'err_server', 'error');
  }

  function suchen(name) {
    if (!api) { meldung(sucheMsg, 'err_noapi', 'error'); return; }
    var knopf = suche.querySelector('button[type="submit"]');
    laedt(knopf, true, 'searching');
    vorschlaege.innerHTML = '';
    meldung(sucheMsg, null);
    post({ action: 'lookup', name: name, password: pwInput.value })
      .then(function (res) {
        if (!res.ok) { fehler(sucheMsg, res); zeige(sucheMsg); if (res.error === 'password') pwInput.focus(); return; }
        if (res.status === 'short') { meldung(sucheMsg, 'err_short', 'error'); zeige(sucheMsg); nameInput.focus(); return; }
        if (res.status === 'none') { meldung(sucheMsg, 'err_none', 'error'); zeige(sucheMsg); return; }
        if (res.status === 'suggest') {
          meldung(sucheMsg, null);
          zeigeVorschlaege(res.suggestions);
          return;
        }
        if (res.status === 'group') {
          meldung(sucheMsg, null);
          aktuell = { name: res.name, password: pwInput.value, members: res.members, open: res.open };
          window.APP.kalenderPasswort(pwInput.value);
          zeigeGruppe();
        }
      })
      .catch(function () { meldung(sucheMsg, 'err_server', 'error'); zeige(sucheMsg); })
      .then(function () { laedt(knopf, false); });
  }

  function zeigeVorschlaege(liste) {
    vorschlaege.innerHTML = '<p class="label" style="margin: 0 0 8px">' + esc(t('suggest')) + '</p><div class="suggest">' +
      liste.map(function (n) { return '<button type="button" data-name="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') +
      '</div>';
    vorschlaege.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        nameInput.value = b.getAttribute('data-name');
        b.innerHTML = '<span class="spinner dunkel" aria-hidden="true"></span>' + esc(b.getAttribute('data-name'));
        suchen(nameInput.value);
      });
    });
    var erster = vorschlaege.querySelector('button');
    if (erster) erster.focus();
  }

  function radio(name, wert, text, aktiv, gesperrt) {
    return '<label class="choice"><input type="radio" name="' + name + '" value="' + wert + '"' + (aktiv ? ' checked' : '') + (gesperrt ? ' disabled' : '') + '><span>' + esc(text) + '</span></label>';
  }

  function box(name, text, aktiv, gesperrt) {
    return '<label class="choice"><input type="checkbox" name="' + name + '"' + (aktiv ? ' checked' : '') + (gesperrt ? ' disabled' : '') + '><span>' + esc(text) + '</span></label>';
  }

  function zeigeGruppe() {
    var m = aktuell.members;
    var zu = !aktuell.open;
    // bereits eingegebene, noch nicht gesendete Werte beim Sprachwechsel erhalten
    var stand = sammle();
    personen.innerHTML = m.map(function (p, i) {
      var a = stand[p.id] || p.answer || {};
      var zusage = a.zusage || '';
      var ern = a.ernaehrung || 'keine';
      return '<fieldset class="person" data-id="' + esc(p.id) + '">' +
        '<legend>' + esc(p.name) + (p.kind ? ' <span class="tag">' + esc(t('child')) + '</span>' : '') + '</legend>' +
        '<div class="choices">' +
          radio('z' + i, 'ja', t('yes'), zusage === 'ja', zu) +
          radio('z' + i, 'nein', t('no'), zusage === 'nein', zu) +
        '</div>' +
        '<div class="diet"' + (zusage === 'ja' ? '' : ' hidden') + '>' +
          '<p class="label" style="margin: 6px 0 0">' + esc(t('diet')) + '</p>' +
          '<div class="choices">' +
            radio('e' + i, 'keine', t('diet_keine'), ern === 'keine', zu) +
            radio('e' + i, 'vegetarisch', t('diet_vegetarisch'), ern === 'vegetarisch', zu) +
            radio('e' + i, 'vegan', t('diet_vegan'), ern === 'vegan', zu) +
          '</div>' +
          '<div class="field" style="margin-bottom: 8px"><label for="a' + i + '">' + esc(t('allergies')) + '</label>' +
          '<input type="text" id="a' + i + '" maxlength="300" placeholder="' + esc(t('allergies_ph')) + '" value="' + esc(a.allergien || '') + '"' + (zu ? ' disabled' : '') + '></div>' +
          '<p class="label" style="margin: 6px 0 0">' + esc(t('shuttle_q')) + '</p>' +
          '<div class="choices">' +
            box('sh' + i, t('shuttle_hin'), a.shuttleHin, zu) +
            box('sz' + i, t('shuttle_zurueck'), a.shuttleZurueck, zu) +
          '</div>' +
        '</div>' +
      '</fieldset>';
    }).join('');
    personen.querySelectorAll('.person').forEach(function (fs) {
      fs.querySelectorAll('input[name^="z"]').forEach(function (r) {
        r.addEventListener('change', function () {
          fs.querySelector('.diet').hidden = r.value !== 'ja';
          fs.classList.remove('fehlt');
        });
      });
    });
    gruppeForm.querySelector('button[type="submit"]').hidden = zu;
    if (zu) meldung(gruppeMsg, 'closed_note');
    else if (!letzteMeldung || letzteMeldung.el !== gruppeMsg || letzteMeldung.key === 'already') zeigeHinweisBereits();
    var neu = suche.hidden === false;
    suche.hidden = true;
    gruppeForm.hidden = false;
    if (neu) {
      var kopf = gruppeForm.querySelector('.label');
      kopf.setAttribute('tabindex', '-1');
      window.APP.springeZu(document.getElementById('rueckmeldung'));
      kopf.focus({ preventScroll: true });
    }
  }

  // Hinweis, wenn für diese Einladung schon geantwortet wurde
  function zeigeHinweisBereits() {
    var beantwortet = aktuell.members.filter(function (p) { return p.answer && p.answer.zusage; });
    if (!beantwortet.length) { meldung(gruppeMsg, null); return; }
    var daten = beantwortet.map(function (p) { return p.answer.geaendert || ''; }).filter(String).sort(function (a, b) {
      return a.split('.').reverse().join('') < b.split('.').reverse().join('') ? 1 : -1;
    });
    letzteMeldung = { el: gruppeMsg, key: 'already' };
    var text = daten.length ? t('already_date').replace('{datum}', daten[0]) : t('already');
    gruppeMsg.innerHTML = '<p class="msg" role="status">' + esc(text) + '</p>';
  }

  function sammle() {
    var res = {};
    personen.querySelectorAll('.person').forEach(function (fs) {
      var z = fs.querySelector('input[name^="z"]:checked');
      var e = fs.querySelector('input[name^="e"]:checked');
      var a = fs.querySelector('input[type="text"]');
      res[fs.getAttribute('data-id')] = {
        zusage: z ? z.value : '',
        ernaehrung: e ? e.value : 'keine',
        allergien: a ? a.value.trim() : '',
        shuttleHin: !!(fs.querySelector('input[name^="sh"]') || {}).checked,
        shuttleZurueck: !!(fs.querySelector('input[name^="sz"]') || {}).checked,
      };
    });
    return res;
  }

  // Passwort anzeigen / verbergen
  var pwToggle = document.getElementById('pw-toggle');
  function pwBeschriften() {
    var sichtbar = pwInput.type === 'text';
    var fr = window.I18N.fr;
    var k = sichtbar ? 'pw_hide' : 'pw_show';
    pwToggle.setAttribute('data-i18n', k);
    pwToggle.textContent = window.APP.lang() === 'fr' ? fr[k] : (sichtbar ? 'Verbergen' : 'Anzeigen');
    pwToggle.setAttribute('aria-pressed', sichtbar ? 'true' : 'false');
  }
  pwToggle.addEventListener('click', function () {
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
    pwBeschriften();
    pwInput.focus();
  });
  window.APP.onLang(pwBeschriften);

  suche.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (nameInput.value.trim().split(/\s+/).length < 2) { meldung(sucheMsg, 'err_short', 'error'); zeige(sucheMsg); nameInput.focus(); return; }
    if (!pwInput.value.trim()) { meldung(sucheMsg, 'err_pw_leer', 'error'); zeige(sucheMsg); pwInput.focus(); return; }
    suchen(nameInput.value);
  });

  gruppeForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var werte = sammle();
    var antworten = Object.keys(werte).map(function (id) {
      var w = werte[id];
      return { id: id, zusage: w.zusage, ernaehrung: w.ernaehrung, allergien: w.allergien, shuttleHin: w.shuttleHin, shuttleZurueck: w.shuttleZurueck };
    });
    personen.querySelectorAll('.person').forEach(function (fs) {
      fs.classList.toggle('fehlt', !(werte[fs.getAttribute('data-id')] || {}).zusage);
    });
    if (antworten.some(function (a) { return !a.zusage; })) {
      meldung(gruppeMsg, 'err_missing', 'error');
      var erste = personen.querySelector('.person.fehlt');
      erste.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var r1 = erste.querySelector('input'); if (r1) r1.focus({ preventScroll: true });
      return;
    }
    var knopf = gruppeForm.querySelector('button[type="submit"]');
    laedt(knopf, true, 'saving');
    meldung(gruppeMsg, null);
    post({ action: 'save', name: aktuell.name, password: aktuell.password, lang: window.APP.lang(), answers: antworten })
      .then(function (res) {
        if (!res.ok) { fehler(gruppeMsg, res); zeige(gruppeMsg); return; }
        aktuell.members.forEach(function (p) { p.answer = werte[p.id]; });
        meldung(gruppeMsg, 'saved', 'ok');
        document.getElementById('rsvp-cal').hidden = !antworten.some(function (x) { return x.zusage === 'ja'; });
        gruppeMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () { meldung(gruppeMsg, 'err_server', 'error'); zeige(gruppeMsg); })
      .then(function () { laedt(knopf, false); });
  });

  document.getElementById('andere-einladung').addEventListener('click', function () {
    aktuell = null;
    meldung(gruppeMsg, null);
    personen.innerHTML = '';
    gruppeForm.hidden = true;
    document.getElementById('rsvp-cal').hidden = true;
    suche.hidden = false;
    vorschlaege.innerHTML = '';
    nameInput.value = '';
    window.APP.springeZu(document.getElementById('rueckmeldung'));
    nameInput.focus({ preventScroll: true });
  });

  window.APP.onLang(function () {
    if (aktuell && !gruppeForm.hidden) zeigeGruppe();
    if (letzteMeldung && letzteMeldung.key === 'already') zeigeHinweisBereits();
    else if (letzteMeldung) meldung(letzteMeldung.el, letzteMeldung.key, letzteMeldung.cls);
  });
})();
