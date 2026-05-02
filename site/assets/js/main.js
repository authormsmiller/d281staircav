// ── SLIDESHOW LIGHTBOX ────────────────────────────
let _slides = [];
let _slideIdx = 0;

function lbOpen(idx, slides) {
  _slides = slides;
  _slideIdx = idx;
  _lbRender();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _lbRender() {
  const s = _slides[_slideIdx];
  document.getElementById('lb-img').src = s.src;
  document.getElementById('lb-cap-p').textContent = s.caption || '';
  document.getElementById('lb-cap-s').textContent = s.credit || '';
  document.getElementById('lb-cap-date').textContent = s.date || '';
  document.getElementById('lb-counter').textContent =
    _slides.length > 1 ? `${_slideIdx + 1} of ${_slides.length}` : '';
  document.getElementById('lb-prev').style.display = _slides.length > 1 ? '' : 'none';
  document.getElementById('lb-next').style.display = _slides.length > 1 ? '' : 'none';
}

function lbNext() {
  _slideIdx = (_slideIdx + 1) % _slides.length;
  _lbRender();
}

function lbPrev() {
  _slideIdx = (_slideIdx - 1 + _slides.length) % _slides.length;
  _lbRender();
}

function lbClose(e) {
  if (!e || e.target === document.getElementById('lightbox') ||
      (e.target && e.target.classList.contains('lb-close'))) {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
    _slides = [];
  }
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') lbClose({ target: document.getElementById('lightbox') });
  if (e.key === 'ArrowRight') lbNext();
  if (e.key === 'ArrowLeft') lbPrev();
});
// ── TOAST ─────────────────────────────────────────
function toast(msg) {
  const t = document.getElementById('toastEl');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4500);
}

// ── FORM MATERIAL TOGGLES ─────────────────────────
function toggleMat(card) {
  const cb = card.querySelector('input[type="checkbox"]');
  cb.checked = !cb.checked;
  card.classList.toggle('on', cb.checked);
}

// ── TIMELINE SCROLL REVEAL ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.tl-entry').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`;
    obs.observe(el);
  });
});

// ── NETLIFY IDENTITY (for /admin login) ───────────
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', user => {
    if (!user) {
      window.netlifyIdentity.on('login', () => {
        document.location.href = '/admin/';
      });
    }
  });
}
