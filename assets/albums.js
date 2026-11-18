/* 活動紀錄：讀取頁面裡的相簿清單，依年份分組（新的在前），畫成卡片，按鈕連到 Google 相簿。可依 Hashtag 分類篩選。
 * 清單寫在 <script type="text/plain" id="albums"> 裡，一個相簿一行，欄位用 | 隔開：
 *   日期 | 活動名稱 | Google 相簿網址 | 封面圖路徑（選填） | 簡介（選填） | #標籤 #標籤（選填）
 * 以 # 開頭的欄位一律當作標籤，可以放在第 4 欄之後的任何位置，所以沒有封面和簡介時可以直接寫：
 *   2026/12/20 | 聖誕節 Bee Day | 相簿網址 | #BeeDay #聖誕節
 * 標籤之間用空白、逗號或頓號隔開；標籤本身不能有空白。日期可寫 2026/12/20，連續幾天寫 2027/02/01-03。
 * 星期幾會自動算出來。以 # 開頭的「整行」會被忽略（所以標籤一定要放在 | 後面）。
 */
(() => {
  const box = document.querySelector('[data-albums]');
  const src = document.getElementById('albums');
  if (!box || !src) return;
  const WD = '日一二三四五六';
  const pad = n => String(n).padStart(2, '0');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const url = s => /^https?:\/\//i.test(s || '') ? s : '';           // 相簿網址只接受真的網址
  const img = s => /^(https?:\/\/|\.{0,2}\/|[\w-])/.test(s || '') && /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(s) ? s : '';
  const key = t => t.toLowerCase();

  const al = src.textContent.split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#').map(l => {
    const f = l.split('|').map(x => x.trim());
    const m = (f[0] || '').match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?:\s*[-–~]\s*(?:(\d{1,2})[\/.\-])?(\d{1,2}))?$/);
    if (!m || !f[1]) return null;
    const y = +m[1], mo = +m[2], d1 = +m[3], d = new Date(y, mo - 1, d1);
    const em = m[4] ? +m[4] : mo, d2 = m[5] ? +m[5] : d1;
    const date = `${y}/${pad(mo)}/${pad(d1)}` + ((em !== mo || d2 !== d1) ? `–${em !== mo ? pad(em) + '/' : ''}${pad(d2)}` : `（${WD[d.getDay()]}）`);
    const rest = f.slice(3);
    const tags = rest.filter(x => x[0] === '#').flatMap(x => x.split(/[\s,，、]+/)).map(t => t.replace(/^#+/, '')).filter(Boolean);
    const plain = rest.filter(x => x[0] !== '#');                       // 其餘欄位維持原本順序：封面、簡介
    const seen = new Set(), uniq = tags.filter(t => !seen.has(key(t)) && seen.add(key(t)));
    return { d, y, date, title: f[1], link: url(f[2]), cover: img(plain[0]), note: plain[1] || '', tags: uniq };
  }).filter(Boolean).sort((a, b) => b.d - a.d);

  // 標籤統計：次數多的排前面，次數一樣就依出現順序
  const stat = new Map();
  al.forEach(a => a.tags.forEach(t => { const s = stat.get(key(t)) || { label: t, n: 0 }; s.n++; stat.set(key(t), s); }));
  const tagList = [...stat.entries()].sort((a, b) => b[1].n - a[1].n);

  const card = a => `<article class="al-card" data-tags="${esc(a.tags.map(key).join('|'))}">
      ${a.link ? `<a class="al-cover" href="${esc(a.link)}" target="_blank" rel="noopener" aria-label="開啟「${esc(a.title)}」相簿">` : '<div class="al-cover">'}
        ${a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy">` : '<span class="al-ph">Bee Kids</span>'}
      ${a.link ? '</a>' : '</div>'}
      <div class="al-body">
        <p class="al-date">${esc(a.date)}</p>
        <h3>${esc(a.title)}</h3>
        ${a.note ? `<p class="al-note">${esc(a.note)}</p>` : ''}
        ${a.tags.length ? `<ul class="al-tags">${a.tags.map(t => `<li><button type="button" class="al-tag" data-tag="${esc(key(t))}">#${esc(t)}</button></li>`).join('')}</ul>` : ''}
        ${a.link ? `<a class="btn solid" href="${esc(a.link)}" target="_blank" rel="noopener">活動報名中</a>` : '<span class="al-soon"></span>'}
      </div>
    </article>`;

  const years = [...new Set(al.map(a => a.y))];
  const bar = tagList.length ? `<div class="al-filter" role="group" aria-label="依分類篩選">
      <button type="button" data-tag="" aria-pressed="true">全部<small>${al.length}</small></button>
      ${tagList.map(([k, s]) => `<button type="button" data-tag="${esc(k)}" aria-pressed="false">#${esc(s.label)}<small>${s.n}</small></button>`).join('')}
    </div>` : '';
  box.innerHTML = years.length
    ? bar + years.map(y => `<section class="al-year"><h2>${y} 年</h2><div class="al-grid">${al.filter(a => a.y === y).map(card).join('')}</div></section>`).join('')
    : '<p class="callout">目前還沒有活動紀錄。</p>';

  // 篩選：點上方按鈕或卡片上的標籤；再點一次同一個標籤，回到全部
  let cur = '';
  const apply = k => {
    cur = k;
    box.querySelectorAll('.al-filter button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tag === k)));
    box.querySelectorAll('.al-card').forEach(c => { c.hidden = !!k && !c.dataset.tags.split('|').includes(k); });
    box.querySelectorAll('.al-year').forEach(s => { s.hidden = ![...s.querySelectorAll('.al-card')].some(c => !c.hidden); });
    const label = k && stat.get(k) ? stat.get(k).label : '';
    history.replaceState(null, '', label ? '#' + encodeURIComponent(label) : location.pathname + location.search);
  };
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-tag]'); if (!b) return;
    const k = b.dataset.tag;
    apply(k === cur ? '' : k);
    if (b.classList.contains('al-tag')) box.querySelector('.al-filter')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  const h = decodeURIComponent(location.hash.slice(1)).toLowerCase();    // 網址帶 #標籤，就直接篩選好（例如 records.html#BeeDay）
  if (h && stat.has(h)) apply(h);
})();
