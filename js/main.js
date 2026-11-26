
function toggleMobile() {
  const menu = document.getElementById('mobileMenu');
  const btn = document.querySelector('.mobile-toggle');
  const isOpen = menu.classList.toggle('active');
  btn.setAttribute('aria-expanded', isOpen);
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('active');
  document.querySelector('.mobile-toggle').setAttribute('aria-expanded', 'false');
}
function copyEmail(btn) {
  var email = 'info@nbs-ea.com';
  var label = btn.querySelector('.label');
  var original = label.textContent;
  navigator.clipboard.writeText(email).then(function () {
    label.textContent = 'Copied!';
    setTimeout(function () { label.textContent = original; }, 1600);
  });
}

var teamCarouselIndex = 0;
var teamCarouselSlides = document.querySelectorAll('.team-carousel-slide');
var teamCarouselDots = document.querySelectorAll('.team-carousel-dot');
var teamCarouselTimer;

function teamCarouselShow(i) {
  teamCarouselSlides.forEach(function (s, idx) { s.classList.toggle('active', idx === i); });
  teamCarouselDots.forEach(function (d, idx) { d.classList.toggle('active', idx === i); });
  teamCarouselIndex = i;
}
function teamCarouselMove(dir) {
  teamCarouselShow((teamCarouselIndex + dir + teamCarouselSlides.length) % teamCarouselSlides.length);
  resetTeamCarouselTimer();
}
function teamCarouselGo(i) {
  teamCarouselShow(i);
  resetTeamCarouselTimer();
}
function resetTeamCarouselTimer() {
  clearInterval(teamCarouselTimer);
  teamCarouselTimer = setInterval(function () { teamCarouselMove(1); }, 5000);
}
if (teamCarouselSlides.length) {
  resetTeamCarouselTimer();
}

/* ===== Forms (contact, enquiries, newsletter) ===== */
(function () {
  var cfg = window.RIZIKI_CONFIG || {};
  function post(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error('bad'); });
  }
  var form = document.querySelector('.js-form');
  if (form) {
    var status = document.getElementById('form-status');
    var success = document.getElementById('form-success');
    var btn = form.querySelector('.submit');
    var label = btn.querySelector('.btn-label');
    var btnText = label.textContent;
    try {
      var q = new URLSearchParams(location.search).get('interest');
      if (q) { var r = form.querySelector('input[name=interest][value="' + q + '"]'); if (r) r.checked = true; }
    } catch (e) {}
    var setErr = function (name, msg) {
      var p = form.querySelector('.err[data-for="' + name + '"]');
      if (p) p.textContent = msg || '';
      var f = form.querySelector('[name="' + name + '"]');
      var box = f && f.closest('.field'); if (box) box.classList.toggle('invalid', !!msg);
    };
    var validate = function () {
      var ok = true, seen = {};
      form.querySelectorAll('[required]').forEach(function (el) {
        var n = el.name; if (seen[n]) return; seen[n] = 1;
        var bad;
        if (el.type === 'radio') bad = !form.querySelector('input[name="' + n + '"]:checked');
        else if (el.type === 'checkbox') bad = !el.checked;
        else if (el.type === 'email') bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim());
        else bad = !el.value.trim();
        setErr(n, bad ? (el.getAttribute('data-msg') || 'This field is required.') : '');
        if (bad) ok = false;
      });
      if (!ok) { var f = form.querySelector('.invalid input, .invalid textarea, .invalid select') || form.querySelector('.err:not(:empty)'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return ok;
    };
    form.addEventListener('input', function (e) { if (e.target.name) setErr(e.target.name, ''); });
    form.addEventListener('change', function (e) { if (e.target.name) setErr(e.target.name, ''); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); status.textContent = ''; status.className = 'form-status';
      if (!validate()) return;
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (data.website) return;
      delete data.website; delete data.consent;
      var chosen = form.querySelector('input[name=interest]:checked');
      if (chosen && chosen.getAttribute('data-label')) data.interest = chosen.getAttribute('data-label');
      data.form = form.getAttribute('data-form'); data._subject = (form.getAttribute('data-subject') || 'Website message') + (data.interest ? ': ' + data.interest : '');
      var done = function () { form.hidden = true; success.hidden = false; success.focus(); };
      if (cfg.FORM_ENDPOINT) {
        btn.disabled = true; btn.classList.add('loading'); label.textContent = 'Sending';
        post(cfg.FORM_ENDPOINT, data).then(function () { form.reset(); done(); })
          .catch(function () { status.textContent = 'Sorry, that did not go through. Please try again or email ' + cfg.CONTACT_EMAIL + '.'; status.className = 'form-status error'; })
          .then(function () { btn.disabled = false; btn.classList.remove('loading'); label.textContent = btnText; });
      } else {
        var lines = []; Object.keys(data).forEach(function (k) { if (k.charAt(0) !== '_' && k !== 'form' && data[k]) lines.push(k + ': ' + data[k]); });
        status.textContent = 'Opening your email app. If nothing happens, write to ' + cfg.CONTACT_EMAIL + '.'; status.className = 'form-status info';
        window.location.href = 'mailto:' + cfg.CONTACT_EMAIL + '?subject=' + encodeURIComponent(data._subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      }
    });
    var again = document.getElementById('send-another');
    if (again) again.addEventListener('click', function () { success.hidden = true; form.hidden = false; var n = form.querySelector('input[name=name]'); if (n) n.focus(); });
  }
  var su = document.querySelector('.js-signup');
  if (su) {
    var st = su.querySelector('.signup-status');
    su.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = su.querySelector('input[name=email]').value.trim();
      st.className = 'signup-status';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { st.textContent = 'Please enter a valid email address.'; st.style.color = '#b3261e'; return; }
      st.style.color = '';
      var url = cfg.NEWSLETTER_ENDPOINT || cfg.FORM_ENDPOINT;
      if (url) {
        post(url, { email: em, form: 'newsletter', _subject: 'Newsletter sign-up' })
          .then(function () { st.textContent = 'Thank you. You are on the list.'; su.reset(); })
          .catch(function () { st.textContent = 'Sorry, that did not go through. Please email ' + cfg.CONTACT_EMAIL + '.'; });
      } else {
        st.textContent = 'Opening your email app to confirm your sign-up.';
        window.location.href = 'mailto:' + cfg.CONTACT_EMAIL + '?subject=' + encodeURIComponent('Newsletter sign-up') + '&body=' + encodeURIComponent('Please add me to the Riziki updates list: ' + em);
      }
    });
  }
})();

/* ===== Desktop dropdown menus ===== */
(function () {
  var items = document.querySelectorAll('.has-sub');
  function closeAll(except) { items.forEach(function (i) { if (i !== except) { i.classList.remove('open'); i.querySelector('.sub-toggle').setAttribute('aria-expanded', 'false'); } }); }
  items.forEach(function (i) {
    var b = i.querySelector('.sub-toggle');
    b.addEventListener('click', function () { var o = i.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); closeAll(i); });
    i.addEventListener('mouseenter', function () { b.setAttribute('aria-expanded', 'true'); });
    i.addEventListener('mouseleave', function () { b.setAttribute('aria-expanded', 'false'); i.classList.remove('open'); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.has-sub')) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
})();

/* ===== Character counter + YouTube facade ===== */
(function () {
  var ta = document.querySelector('textarea[data-counter]');
  if (ta) { var out = document.getElementById(ta.getAttribute('data-counter')); var upd = function () { out.textContent = ta.value.length; }; ta.addEventListener('input', upd); upd(); }
  var fr = document.getElementById('ytFrame');
  if (fr) {
    var btn = fr.querySelector('.yt-play');
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + fr.getAttribute('data-id') + '?autoplay=1&rel=0&playsinline=1';
      f.title = "Daisy's story - Riziki Nature Based Solutions";
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      fr.replaceChild(f, btn);
    });
  }
})();

/* ===== Enquiry buttons fill the subject ===== */
(function () {
  document.querySelectorAll('a[data-subject]').forEach(function (a) {
    a.addEventListener('click', function () {
      var s = document.getElementById('f-subject');
      if (s) s.value = a.getAttribute('data-subject');
    });
  });
})();

/* Open every page at the top unless the link points to a section */
(function(){
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e){}
  function top(){ if (!location.hash) window.scrollTo(0,0); }
  top();
  window.addEventListener('pageshow', top);
})();
