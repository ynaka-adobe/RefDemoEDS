const CHECK_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PREV_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NEXT_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Parse the filter column into an array of trimmed, non-empty strings.
 * Handles: <ul>/<ol> lists, multiple <p> tags, and comma-separated plain text.
 */
function parseFilterValues(col) {
  if (!col) return [];
  const listItems = col.querySelectorAll('li');
  if (listItems.length) return [...listItems].map((li) => li.textContent.trim()).filter(Boolean);
  const paragraphs = col.querySelectorAll('p');
  if (paragraphs.length) return [...paragraphs].map((p) => p.textContent.trim()).filter(Boolean);
  return col.textContent.split(',').map((s) => s.trim()).filter(Boolean);
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  const filterOrder = [];

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    const imageCol = cols.find((col) => col.querySelector('picture'));
    const nonImageCols = cols.filter((col) => !col.querySelector('picture'));
    const bodyCol = nonImageCols[0] || null;
    const filterCol = nonImageCols[1] || null;

    const li = document.createElement('li');

    if (imageCol) imageCol.className = 'cards-model-card-image';
    if (bodyCol) bodyCol.className = 'cards-model-card-body';

    // Parse list of filter values from 3rd column
    const filterValues = parseFilterValues(filterCol);
    if (filterValues.length) {
      li.dataset.filters = filterValues.join(',');
      filterValues.forEach((v) => {
        if (!filterOrder.includes(v)) filterOrder.push(v);
      });
    }

    // Body on top, image on bottom
    if (bodyCol) li.append(bodyCol);
    if (imageCol) li.append(imageCol);

    ul.append(li);
  });

  block.textContent = '';

  // --- Toolbar row (filters + nav on same line) ---
  const toolbar = document.createElement('div');
  toolbar.className = 'cards-model-toolbar';

  // --- Filter bar ---
  if (filterOrder.length > 0) {
    const filterBar = document.createElement('div');
    filterBar.className = 'cards-model-filters';

    const allBtn = document.createElement('button');
    allBtn.className = 'cards-model-filter-btn active';
    allBtn.dataset.filter = 'all';
    allBtn.innerHTML = `<span class="cards-model-filter-check">${CHECK_ICON}</span>All models`;
    filterBar.append(allBtn);

    filterOrder.forEach((value) => {
      const btn = document.createElement('button');
      btn.className = 'cards-model-filter-btn';
      btn.dataset.filter = value;
      btn.innerHTML = `<span class="cards-model-filter-check">${CHECK_ICON}</span>${value}`;
      filterBar.append(btn);
    });

    toolbar.append(filterBar);

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.cards-model-filter-btn');
      if (!btn) return;
      const activeFilter = btn.dataset.filter;

      filterBar.querySelectorAll('.cards-model-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      ul.querySelectorAll('li').forEach((li) => {
        const cardFilters = (li.dataset.filters || '').split(',');
        // eslint-disable-next-line no-param-reassign
        li.hidden = activeFilter !== 'all' && !cardFilters.includes(activeFilter);
      });

      ul.scrollLeft = 0;
      updateNav();
    });
  }

  // --- Nav buttons ---
  const nav = document.createElement('div');
  nav.className = 'cards-model-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'cards-model-nav-btn';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.innerHTML = PREV_ICON;
  prevBtn.disabled = true;

  const nextBtn = document.createElement('button');
  nextBtn.className = 'cards-model-nav-btn';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.innerHTML = NEXT_ICON;

  nav.append(prevBtn, nextBtn);
  toolbar.append(nav);
  block.append(toolbar, ul);

  const getScrollAmount = () => {
    const card = ul.querySelector('li:not([hidden])');
    return card ? (card.offsetWidth + 16) * 3 : 720;
  };

  function updateNav() {
    prevBtn.disabled = ul.scrollLeft <= 0;
    nextBtn.disabled = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 1;
  }

  prevBtn.addEventListener('click', () => ul.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' }));
  nextBtn.addEventListener('click', () => ul.scrollBy({ left: getScrollAmount(), behavior: 'smooth' }));
  ul.addEventListener('scroll', updateNav);
  updateNav();
}
