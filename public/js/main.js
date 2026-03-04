// Auto-dismiss flash messages after 4 seconds
document.querySelectorAll('.flash').forEach(el => {
  setTimeout(() => {
    el.style.transition = 'opacity .4s, transform .4s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 400);
  }, 4000);
});

// Confirm on all delete forms that don't have inline onsubmit
document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', e => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});
