// Small progressive enhancements shared by every page. The site works without them.

// Gentle fade-in for sections marked data-reveal (skipped for reduced motion via CSS).
const revealables = document.querySelectorAll<HTMLElement>('[data-reveal]');
if ('IntersectionObserver' in window && revealables.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add('is-visible'));
}

// Expandable footnotes: a footnote reference opens its note inline, after the
// paragraph, instead of jumping to the bottom of the page.
document.querySelectorAll<HTMLAnchorElement>('.prose a[data-footnote-ref]').forEach((ref) => {
  const id = decodeURIComponent(ref.hash.slice(1));
  const note = document.getElementById(id);
  if (!note) return;
  ref.setAttribute('role', 'button');
  ref.setAttribute('aria-expanded', 'false');
  ref.addEventListener('click', (e) => {
    e.preventDefault();
    const host = ref.closest('p, li, blockquote, td') ?? ref.parentElement!;
    const existing = host.nextElementSibling;
    if (existing?.classList.contains('footnote-inline') && existing.getAttribute('data-for') === id) {
      existing.remove();
      ref.setAttribute('aria-expanded', 'false');
      return;
    }
    const box = document.createElement('aside');
    box.className = 'footnote-inline';
    box.setAttribute('data-for', id);
    box.setAttribute('aria-label', `Note ${ref.textContent}`);
    box.innerHTML = note.innerHTML;
    host.after(box);
    ref.setAttribute('aria-expanded', 'true');
  });
});

// Copy-link buttons
document.querySelectorAll<HTMLButtonElement>('[data-copy-link]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const status = btn.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(btn.dataset.copyLink || location.href);
      if (status) status.textContent = 'Link copied';
    } catch {
      if (status) status.textContent = 'Copy failed — select the address bar to copy';
    }
    setTimeout(() => status && (status.textContent = 'Copy link'), 2500);
  });
});

// Native share sheet where supported
document.querySelectorAll<HTMLButtonElement>('[data-native-share]').forEach((btn) => {
  if (!('share' in navigator)) return;
  btn.hidden = false;
  btn.addEventListener('click', () => {
    navigator.share({ title: document.title, url: btn.dataset.nativeShare || location.href }).catch(() => {});
  });
});
