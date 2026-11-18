/* 活動紀錄：讀取頁面裡的相簿清單，依年份分組（新的在前），畫成卡片，按鈕連到 Google 相簿。
 * 清單寫在 <script type="text/plain" id="albums"> 裡，一個相簿一行，欄位用 | 隔開：
 *   日期 | 活動名稱 | Google 相簿網址 | 封面圖路徑（選填） | 簡介（選填）
 * 日期可以寫 2026/12/20，連續幾天寫 2027/02/01-03；沒有封面或簡介就留空（但 | 要保留，最後面的空欄可以省略）。
 * 星期幾會自動算出來。以 # 開頭的行會被忽略。
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

  const al = src.textContent.split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#').map(l => {
    const f = l.split('|').map(x => x.trim());
    const m = (f[0] || '').match(/^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?:\s*[-–~]\s*(?:(\d{1,2})[\/.\-])?(\d{1,2}))?$/);
    if (!m || !f[1]) return null;
    const y = +m[1], mo = +m[2], d1 = +m[3], d = new Date(y, mo - 1, d1);
    const em = m[4] ? +m[4] : mo, d2 = m[5] ? +m[5] : d1;
    const range = (em !== mo || d2 !== d1);
    const date = `${y}/${pad(mo)}/${pad(d1)}` + (range ? `–${em !== mo ? pad(em) + '/' : ''}${pad(d2)}` : `（${WD[d.getDay()]}）`);
    return { d, y, date, title: f[1], link: url(f[2]), cover: img(f[3]), note: f[4] || '' };
  }).filter(Boolean).sort((a, b) => b.d - a.d);

  const card = a => `<article class="al-card">
      ${a.link ? `<a class="al-cover" href="${esc(a.link)}" target="_blank" rel="noopener" aria-label="開啟「${esc(a.title)}」相簿">` : '<div class="al-cover">'}
        ${a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy">` : '<span class="al-ph">Bee Kids</span>'}
      ${a.link ? '</a>' : '</div>'}
      <div class="al-body">
        <p class="al-date">${esc(a.date)}</p>
        <h3>${esc(a.title)}</h3>
        ${a.note ? `<p class="al-note">${esc(a.note)}</p>` : ''}
        ${a.link ? `<a class="btn solid" href="${esc(a.link)}" target="_blank" rel="noopener">查看相簿</a>` : '<span class="al-soon">相簿整理中</span>'}
      </div>
    </article>`;

  const years = [...new Set(al.map(a => a.y))];
  box.innerHTML = years.length
    ? years.map(y => `<h2>${y} 年</h2><div class="al-grid">${al.filter(a => a.y === y).map(card).join('')}</div>`).join('')
    : '<p class="callout">目前還沒有活動紀錄。</p>';
})();
