// ── LIGHTBOX ──────────────────────────────────────
function lb(src, cap, src2) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb-cap-p').textContent = cap;
  document.getElementById('lb-cap-s').textContent = src2;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function lbClose(e) {
  if (!e || e.target === document.getElementById('lightbox') ||
      (e.target && e.target.classList.contains('lb-close'))) {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') lbClose({ target: document.getElementById('lightbox') });
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
