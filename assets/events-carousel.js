/* 首頁活動輪播：從 parents/events.html 自動抓取 */
(() => {
  const box = document.querySelector('[data-events-carousel]');
  if (!box) return;
  const ROOT = new URL('../', document.currentScript.src);
  const evUrl = new URL('parents/events.html', ROOT);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  fetch(evUrl).then(r => r.ok ? r.text() : Promise.reject()).then(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const items = [...doc.querySelectorAll('section.ev-sec')].map(s => {
      const h2 = s.querySelector('h2');
      const main = h2.querySelector('span:not(.ev-sub)');
      const facts = {};
      s.querySelectorAll('.facts dt').forEach(dt => {
        const k = /日期/.test(dt.textContent) ? '日期' : /時間/.test(dt.textContent) ? '時間'
                : /地點/.test(dt.textContent) ? '地點' : null;
        if (k && !facts[k]) facts[k] = dt.nextElementSibling.textContent.trim();
      });
      const img = s.querySelector('.ev-hero img');
      return {
        href: evUrl.href + '#' + s.id,
        img: img ? new URL(img.getAttribute('src'), evUrl).href : '',
        alt: img ? img.alt : '',
        tag: (s.querySelector('.ev-tag') || {}).textContent || '',
        title: (main || h2).textContent.trim(),
        sub: (h2.querySelector('.ev-sub') || {}).textContent || '',
        facts
      };
    });
    if (!items.length) return;

    const slide = (it, i) => `
      <a class="ev-slide" href="${esc(it.href)}" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${items.length}">
        <figure>${it.img ? `<img src="${esc(it.img)}" alt="${esc(it.alt)}" loading="lazy">` : ''}</figure>
        <div class="ev-body">
          ${it.tag ? `<span class="ev-chip">${esc(it.tag)}</span>` : ''}
          <h3>${esc(it.title)}</h3>
          ${it.sub ? `<p class="ev-s">${esc(it.sub)}</p>` : ''}
          <dl class="facts">${Object.entries(it.facts).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          <span class="ev-go">了解詳情 →</span>
        </div>
      </a>`;

    const mount = box.querySelector('.ev-car-mount');
    mount.innerHTML = `
      <div class="ev-car" role="region" aria-roledescription="carousel" aria-label="精彩活動">
        <div class="ev-track" tabindex="0">${items.map(slide).join('')}</div>
        ${items.length > 1 ? `
          <button class="ev-nav-btn prev" aria-label="上一個活動">‹</button>
          <button class="ev-nav-btn next" aria-label="下一個活動">›</button>
          <div class="ev-dots">${items.map((_, i) => `<button aria-label="第 ${i + 1} 個活動"></button>`).join('')}</div>` : ''}
      </div>`;
    box.hidden = false;
    if (items.length < 2) return;

    const track = mount.querySelector('.ev-track');
    const dots = [...mount.querySelectorAll('.ev-dots button')];
    const idx = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = i => track.scrollTo({ left: ((i + items.length) % items.length) * track.clientWidth, behavior: 'smooth' });
    const mark = () => dots.forEach((d, i) => d.setAttribute('aria-current', i === idx() ? 'true' : 'false'));
    track.addEventListener('scroll', mark, { passive: true }); mark();
    mount.querySelector('.prev').onclick = () => go(idx() - 1);
    mount.querySelector('.next').onclick = () => go(idx() + 1);
    dots.forEach((d, i) => d.onclick = () => go(i));

    // 自動播放（滑鼠停留／鍵盤聚焦時暫停；系統設定減少動態時不自動播放）
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer; const stop = () => clearInterval(timer);
    const start = () => { stop(); timer = setInterval(() => go(idx() + 1), 5000); };
    const car = mount.querySelector('.ev-car');
    ['mouseenter', 'focusin', 'touchstart'].forEach(e => car.addEventListener(e, stop, { passive: true }));
    ['mouseleave', 'focusout'].forEach(e => car.addEventListener(e, start));
    start();
  }).catch(() => {});   // 抓取失敗（例如本機 file:// 開啟）就維持隱藏
})();
