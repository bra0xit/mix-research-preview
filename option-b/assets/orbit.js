(() => {
  const body = document.body;
  const nav = document.querySelector('.orbit-nav');
  const menuButton = document.querySelector('.menu-button');
  const menu = document.querySelector('.orbit-menu');
  const closeMenu = () => { body.classList.remove('menu-open'); menuButton?.setAttribute('aria-expanded','false'); menu?.setAttribute('aria-hidden','true'); };
  menuButton?.addEventListener('click', () => {
    const open = body.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-hidden', String(!open));
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 32);
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  document.querySelector('.hero-pulse')?.addEventListener('click', e => {
    document.querySelector('.orbit-hero')?.classList.toggle('still');
    e.currentTarget.classList.toggle('is-paused');
  });

  document.querySelectorAll('.ritual-step').forEach(btn => btn.addEventListener('click', () => {
    const state = Number(btn.dataset.state);
    document.querySelectorAll('.ritual-step').forEach(b => b.classList.toggle('is-active', b === btn));
    const field = document.querySelector('.particle-field');
    const label = document.querySelector('.ritual-state');
    const caption = document.querySelector('.ritual-caption');
    const lang = document.documentElement.lang === 'en';
    const labels = lang ? ['01 / SAMPLE','02 / SEQUENCE','03 / INTERPRET'] : ['01 / PROV','02 / ANALYS','03 / TOLKNING'];
    const copy = lang ? ['A sample holds a world of traces.','The signal becomes a readable pattern.','A pattern becomes a decision for a living system.'] : ['Ett prov bär en värld av spår.','Signalen blir ett mönster som går att läsa.','Ett mönster blir ett beslut för ett levande system.'];
    field?.setAttribute('data-state', String(state)); if(label) label.textContent = labels[state]; if(caption) caption.textContent = copy[state];
  }));

  document.querySelectorAll('#contact-form').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault(); const data = new FormData(form);
    const subject = encodeURIComponent('MIX Research project enquiry');
    const bodyText = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('message') || ''}`);
    window.location.href = `mailto:info@mixresearch.se?subject=${subject}&body=${bodyText}`;
    const status = form.querySelector('.form-status'); if(status) status.textContent = document.documentElement.lang === 'en' ? 'Opening your email client…' : 'Öppnar ditt e-postprogram…';
  }));

  const hero = document.querySelector('.orbit-hero');
  hero?.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); hero.style.setProperty('--mx', `${((e.clientX-r.left)/r.width-.5)*18}px`); hero.style.setProperty('--my', `${((e.clientY-r.top)/r.height-.5)*18}px`); });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && hero) { const orbit = hero.querySelector('.hero-orbit'); const move = () => { orbit?.style.setProperty('transform', `translate3d(var(--mx,0),var(--my,0),0)`); requestAnimationFrame(move); }; requestAnimationFrame(move); }
})();
