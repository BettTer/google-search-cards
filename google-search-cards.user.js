// ==UserScript==
// @name           Google Search Cards
// @name:zh-CN     Google 搜索卡片
// @namespace      https://github.com/BettTer/google-search-cards
// @version        2026.11.19.16
// @description    View Google web, news, video, and Lens results in two columns, with support for the collapsible sidebar.
// @description:zh-CN 将 Google 网页、新闻、视频和 Lens 搜索结果排成两列，支持可折叠侧栏。
// @license        MIT
// @homepageURL    https://github.com/BettTer/google-search-cards
// @supportURL     https://github.com/BettTer/google-search-cards/issues
// @match          https://www.google.com/*
// @match          https://www.google.ca/*
// @match          https://www.google.co.uk/*
// @match          https://www.google.com.hk/*
// @run-at         document-start
// @grant          none
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  const STYLE_ID = 'google-cards-local-style';
  if (document.getElementById(STYLE_ID)) return;

  const CSS = `
    [data-gcards] body {
      --gcards-card-surface: light-dark(transparent, #2b2d32);
      --gcards-card-outline: light-dark(transparent, #555961);
      --gcards-rank-color: light-dark(#70757a, #e6e9ef);
      --gcards-rank-opacity: .8;
      /* Distance from a right-docked thumbnail to the card's inline-end edge. A
         constant, so thumbnails of rows with different heights line up; the
         card's text sits 20px from the other edge. */
      --gcards-thumb-inset: 20px;
      /* Soft halo in the card's tone, so the digits stay readable where they
         overlap a thumbnail of their own brightness (white headshots, dark photos). */
      --gcards-rank-halo: light-dark(rgb(255 255 255 / .85), rgb(0 0 0 / .6));
      /* Inline-end padding of every numbered card. The rank is centred in the
         rail-sized square at the top of it, so neither a thumbnail nor text can
         cover it. The digits shrink to fit this width (see ::after). */
      --gcards-rank-rail: 60px;
    }

    [data-gcards] body[data-dt="1"],
    html[data-gcards][data-dt="1"] body {
      --gcards-card-surface: #2b2d32;
      --gcards-card-outline: #555961;
      --gcards-rank-color: #e6e9ef;
      --gcards-rank-halo: rgb(0 0 0 / .6);
    }

    [data-gcards] #rcnt[data-gcards-results] {
      display: block;
      box-sizing: border-box;
      inline-size: 100%;
      min-inline-size: 0;
      max-inline-size: 100%;
      margin-inline: 0;
      padding-inline: 40px;
    }

    [data-gcards][data-gcards-sidebar] #rcnt[data-gcards-results] {
      max-inline-size: min(100%, var(--gcards-results-limit));
    }

    [data-gcards][data-gcards-sidebar-overlap] #rcnt[data-gcards-results] {
      padding-left: calc(var(--gcards-sidebar-overlap) + 40px);
    }

    [data-gcards] :is([data-gcards-chain], [data-gcards-pack-chain], [data-gcards-list]) {
      box-sizing: border-box;
      inline-size: 100% !important;
      min-inline-size: 0 !important;
      max-inline-size: 100% !important;
    }

    [data-gcards] #rcnt [data-gcards-chain] {
      margin-inline: 0;
    }

    /* Row-major grid: 1 | 2, 3 | 4, ... (multi-column layout would fill column by column). */
    [data-gcards] #rcnt [data-gcards-list] {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      grid-auto-rows: auto;
      align-items: stretch;
      column-gap: 20px;
    }

    [data-gcards][data-gcards-narrow] #rcnt [data-gcards-list] {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    [data-gcards] [data-gcards-list] > [data-gcards-item] {
      box-sizing: border-box;
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    /* A wrapper item passes the row height on so both cards of a row match. */
    [data-gcards] [data-gcards-list] > [data-gcards-item]:has(> [data-gcards-card]) {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: 1fr;
    }

    [data-gcards] [data-gcards-list] > .ULSxyf {
      margin-block-end: 0;
      padding: 5px;
    }

    [data-gcards] [data-gcards-list] > [data-gcards-wide] {
      grid-column: 1 / -1;
    }

    [data-gcards] [data-gcards-card] {
      display: inline-block;
      box-sizing: border-box;
      inline-size: 100% !important;
      min-inline-size: 0 !important;
      max-inline-size: 100% !important;
      margin-block: 5px 10px;
      padding-block: 15px;
      padding-inline: 20px var(--gcards-rank-rail);
      border-radius: 5px;
      box-shadow: 1px 1px 5px rgb(0 0 0 / 30%);
      vertical-align: top;
    }

    /* Web thumbnails (.LnCrMe is the grid item beside the text) and any other
       right-docked thumbnail found by findThumbnail. */
    [data-gcards] [data-gcards-card] .srKDX > .LnCrMe,
    [data-gcards] [data-gcards-rank] [data-gcards-thumb] {
      align-self: center;
    }

    /* Set per card by thumbShift(): centres the thumbnail vertically and moves it
       towards the rank until it is --gcards-thumb-inset from the edge. A transform
       changes no layout, so the card keeps its size and the text its wrapping; the
       rank (z-index 1) overlaps the thumbnail's corner. */
    [data-gcards] [data-gcards-rank] [data-gcards-thumb] {
      translate: var(--gcards-thumb-shift, none);
    }

    [data-gcards] :is([data-gcards-card], [data-gcards-rank]) {
      background-color: var(--gcards-card-surface);
      padding-inline-end: var(--gcards-rank-rail);
    }

    [data-gcards] :is([data-gcards-card], [data-gcards-rank]):not(:focus-visible) {
      outline: 1px solid var(--gcards-card-outline);
      outline-offset: -1px;
    }

    [data-gcards] [data-gcards-rank] {
      position: relative;
      /* Own stacking context, so the rank's z-index competes only with this card's
         content: it is drawn over the thumbnail's corner, never over another card. */
      isolation: isolate;
    }

    [data-gcards] [data-gcards-rank-digits="3"] { --gcards-rank-digits: 3; }
    [data-gcards] [data-gcards-rank-digits="4"] { --gcards-rank-digits: 4; }

    /* Centred in the rail-sized square at the top inline-end corner. */
    [data-gcards] [data-gcards-rank]::after {
      content: attr(data-gcards-rank) / "";
      position: absolute;
      z-index: 1;
      inset-block-start: 0;
      inset-inline-end: 0;
      inline-size: var(--gcards-rank-rail);
      line-height: var(--gcards-rank-rail);
      text-align: center;
      color: var(--gcards-rank-color);
      opacity: var(--gcards-rank-opacity);
      text-shadow: 0 0 4px var(--gcards-rank-halo);
      font-family: Arial, sans-serif;
      /* Sized for two Arial digits (.556em each) with 8px kept clear, so one- and
         two-digit ranks share a height; three or more digits shrink to fit. */
      font-size: calc((var(--gcards-rank-rail) - 8px) / (.556 * max(2, var(--gcards-rank-digits, 2))));
      font-variant-numeric: tabular-nums;
      pointer-events: none;
    }

    [data-gcards] [data-gcards-list] > [data-gcards-empty] {
      display: none !important;
    }
  `;
  const marks = new Set();
  let lastMode = '', timer;
  let results, resultList, sidebar, layoutFrame;
  let waitingForInitialSidebarClose;
  const layoutObserver = new ResizeObserver(scheduleLayout);
  // Numbered cards: a height change moves the centred thumbnail (see thumbShift).
  const cardObserver = new ResizeObserver(schedule);
  const observedCards = new WeakSet();
  const MEDIA_CARDS = { news: '.WCv1we', videos: '.PmEWq.vt6azd' };
  const sidebarLabels = ['Open sidebar', 'Close sidebar', 'AI Mode history'];
  const sidebarSelector = sidebarLabels.flatMap(label =>
    [`[aria-label="${label}" i]`, `[title="${label}" i]`, `[data-tooltip="${label}" i]`]).join(',');

  function findSidebar(outer) {
    const root = document.documentElement;
    let panel = null, edge = 0;
    for (const control of document.querySelectorAll(sidebarSelector)) {
      if (!control.getClientRects().length || control.closest('[aria-hidden="true"]') ||
          getComputedStyle(control).visibility !== 'visible') continue;
      for (let node = control; node && node !== document.body; node = node.parentElement) {
        if (node.contains(outer)) break;
        const rect = node.getBoundingClientRect();
        if (rect.left <= 12 && rect.right > edge &&
            rect.right <= root.clientWidth * 0.65 &&
            rect.height >= Math.min(240, root.clientHeight / 2)) {
          panel = node;
          edge = rect.right;
        }
      }
    }
    return panel;
  }

  function syncInitialSidebarLogo(root) {
    if (waitingForInitialSidebarClose === false) return;
    const rail = document.querySelector('.aim-lhs-panel-container .UIizDd > .qEn1od');
    if (!rail) return;

    const expanded = rail.parentElement.classList.contains('sSuaFc');
    const railHidden = rail.getAttribute('aria-hidden');
    const collapsed = !expanded && railHidden === 'false' && !rail.hasAttribute('inert');
    if (waitingForInitialSidebarClose === undefined) {
      const initialLogoExpanded = root.hasAttribute('data-lhsxi');
      if (collapsed && !initialLogoExpanded) waitingForInitialSidebarClose = false;
      if (expanded && railHidden === 'true' && initialLogoExpanded) {
        waitingForInitialSidebarClose = true;
      }
      return;
    }
    if (!collapsed) return;

    // Clear Google's initial expanded state once its controller exposes the closed rail.
    waitingForInitialSidebarClose = false;
    root.removeAttribute('data-lhsxi');
    for (const logo of document.querySelectorAll('.LZ2xrf[jsname="yeSxwc"][data-lhsx]')) {
      logo.removeAttribute('data-lhsx');
    }
  }

  function scheduleLayout() {
    if (layoutFrame !== undefined) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = undefined;
      const root = document.documentElement;
      if (root.hasAttribute('data-gcards')) syncInitialSidebarLogo(root);
      const hasSidebar = Boolean(results?.isConnected && sidebar?.isConnected);
      let overlap = 0;
      if (hasSidebar) {
        const left = results.getBoundingClientRect().left;
        const right = sidebar.getBoundingClientRect().right;
        // Only reserve the part that Google hasn't already left clear.
        overlap = Math.max(0, Math.ceil(right - left));
        root.style.setProperty('--gcards-sidebar-overlap', `${overlap}px`);
        root.style.setProperty('--gcards-results-limit', `${Math.max(0, Math.floor(root.clientWidth - left))}px`);
      }
      root.toggleAttribute('data-gcards-sidebar', hasSidebar);
      root.toggleAttribute('data-gcards-sidebar-overlap', overlap > 0);
      root.toggleAttribute('data-gcards-narrow', Boolean(resultList?.isConnected && resultList.clientWidth <= 700));
    });
  }

  function watchLayout(outer, list) {
    const panel = outer ? findSidebar(outer) : null;
    scheduleLayout();
    if (outer === results && list === resultList && panel === sidebar) return;
    layoutObserver.disconnect();
    results = outer;
    resultList = list;
    sidebar = panel;
    for (const node of [outer, list, panel]) if (node) layoutObserver.observe(node);
  }
  function mark(node, name) {
    if (!node.hasAttribute(name)) node.setAttribute(name, '');
    marks.add(node);
  }
  function clear() {
    for (const node of marks) {
      for (const name of [...node.getAttributeNames()]) {
        if (name.startsWith('data-gcards-')) node.removeAttribute(name);
      }
    }
    marks.clear();
  }
  function modeFor(url) {
    if (url.pathname !== '/search') return '';
    const p = url.searchParams, mode = p.get('udm'), tab = p.get('tbm');
    if (mode === '48') return 'exact';
    if (mode === '26') return 'lens';
    if (mode === 'vids' || (!mode && tab === 'vid')) return 'videos';
    if (!mode && tab === 'nws') return 'news';
    // Other tabs, especially Images and Visual matches, keep Google's own layout.
    if (mode && mode !== '14') return '';
    if (p.has('tbm')) return '';
    if (p.has('lns_mode') || p.has('vsrid')) return 'lens';
    return 'web';
  }
  function findResultLists(outer, root, mediaCard) {
    if (!root) return [];
    if (!mediaCard) return [root];
    const cards = [...outer.querySelectorAll(mediaCard)].filter(card => !card.closest('#rhs'));
    if (!cards.length) return [];
    // News and Videos keep each page of entries inside one results module, and
    // continuous scrolling appends further modules. Take the first card's module
    // (its nearest ancestor holding at least two entries) as the template and put
    // every card into the ancestor at that same depth.
    const holdsCard = node => node.matches(mediaCard) || node.querySelector(mediaCard);
    let depth = 1;
    for (let node = cards[0].parentElement; node !== root && node !== outer && node.parentElement;
         node = node.parentElement) {
      if ([...node.children].filter(holdsCard).length >= 2) break;
      depth++;
    }
    const lists = new Set();
    for (const card of cards) {
      let list = card;
      for (let i = 0; i < depth && list.parentElement && list.parentElement !== outer; i++) {
        list = list.parentElement;
      }
      lists.add(list);
    }
    // Nested lists would lay whole modules out in columns; the earlier list wins.
    const kept = [];
    for (const list of lists) {
      if (!kept.some(other => other.contains(list) || list.contains(other))) kept.push(list);
    }
    return kept;
  }
  function findThumbnail(card) {
    // A thumbnail docked at the inline-end edge. Favicons are too small to
    // count; video thumbnails sit on the other side. Returns the wrapper that
    // sits beside the text (the flex or grid item) and the image's current box.
    const box = card.getBoundingClientRect();
    const rtl = getComputedStyle(card).direction === 'rtl';
    for (const img of card.querySelectorAll('img')) {
      const rect = img.getBoundingClientRect();
      const gap = rtl ? rect.left - box.left : box.right - rect.right;
      if (rect.width < 40 || rect.height < 40 || gap > 100) continue;
      let node = img;
      while (node.parentElement !== card &&
             node.parentElement.getBoundingClientRect().width <= rect.width + 24) {
        node = node.parentElement;
      }
      return { node, rect };
    }
    return null;
  }
  function thumbShift(card, { node, rect }) {
    // Centre the thumbnail vertically and align its inline-end edge to the fixed
    // inset, so thumbnails of rows with different heights line up. It never
    // moves inward past its natural position, so it cannot overlap the text.
    const box = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const inset = parseFloat(style.getPropertyValue('--gcards-thumb-inset')) || 20;
    // `rect` includes the shift already applied; take it off to get the natural box.
    const applied = getComputedStyle(node).translate;
    const [dx = 0, dy = 0] = applied === 'none' ? [] : applied.split(' ').map(parseFloat);
    const y = box.top + (box.height - rect.height) / 2 - (rect.top - dy);
    const x = style.direction === 'rtl'
      ? Math.min(0, box.left + inset - (rect.left - dx))
      : Math.max(0, box.right - inset - (rect.right - dx));
    return `${Math.round(x)}px ${Math.round(y)}px`;
  }
  function findImagePack(item) {
    const known = item.querySelector('.sSsjz');
    if (known) return known;
    // Lens can omit the heading and the sSsjz wrapper after changing the crop.
    // Require repeated image-link tiles; a web result's title/snippet grid
    // must not be mistaken for an image collection merely because it uses srKDX.
    return [...item.querySelectorAll('.srKDX')].find(grid => {
      const tiles = [...grid.children].filter(node =>
        !['SCRIPT', 'STYLE'].includes(node.tagName));
      return tiles.length >= 3 && tiles.every(tile =>
        tile.querySelector('img') &&
        (tile.matches('a[href]') || tile.querySelector('a[href]')));
    });
  }
  function hasText(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3 && child.textContent.trim()) return true;
      if (child.nodeType === 1 && !['SCRIPT','STYLE','NOSCRIPT'].includes(child.tagName) && hasText(child)) return true;
    }
    return false;
  }
  function update() {
    timer = undefined;
    const root = document.documentElement;
    if (!root) return;
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID; style.textContent = CSS;
      (document.head || root).append(style);
    }
    const url = new URL(location.href);
    const mode = modeFor(url);
    style.media = mode ? 'all' : 'not all';
    if (mode !== lastMode) { clear(); lastMode = mode; }
    if (!mode) {
      root.removeAttribute('data-gcards');
      watchLayout(null, null);
      return;
    }
    root.setAttribute('data-gcards', mode);
    // Drop detached references when Google replaces a whole results subtree.
    for (const node of marks) {
      if (node.isConnected) continue;
      marks.delete(node);
      if (observedCards.delete(node)) cardObserver.unobserve(node);
    }
    const mediaCard = MEDIA_CARDS[mode];
    const outer = document.querySelector('#rcnt');
    const lists = outer ? findResultLists(outer, document.querySelector('#rso'), mediaCard) : [];
    const list = lists[0];
    if (resultList && resultList !== list) clear();
    if (!list || !outer.contains(list)) {
      watchLayout(null, null);
      return;
    }
    for (const node of lists) {
      for (let chain = node.parentElement; chain && chain !== outer; chain = chain.parentElement) {
        mark(chain, 'data-gcards-chain');
      }
      mark(node, 'data-gcards-list');
    }
    mark(outer, 'data-gcards-results');
    watchLayout(outer, list);
    const cardSelector = mediaCard || '.g, .ts, .vt6azd';
    // Paginated tabs carry the offset of the first result in `start` (page 2 is
    // start=10), so numbering continues from the previous page. Modules appended
    // by continuous scrolling are counted on through the single `rank` below.
    let rank = Math.max(0, Number.parseInt(url.searchParams.get('start'), 10) || 0);
    const numbered = [];
    for (const item of lists.flatMap(node => [...node.children])) {
      if (['STYLE','SCRIPT','LINK'].includes(item.tagName)) continue;
      const previousRank = item.hasAttribute('data-gcards-rank') ? item : item.querySelector('[data-gcards-rank]');
      const empty = !item.querySelector('a,img,video,iframe,canvas,h2,h3,[role=heading],[role=button]') && !hasText(item);
      if (empty) {
        mark(item, 'data-gcards-empty');
        if (previousRank) unrank(previousRank);
        continue;
      }
      item.removeAttribute('data-gcards-empty');
      mark(item, 'data-gcards-item');
      const card = item.matches(cardSelector) ? item : item.querySelector(cardSelector);
      if (card) mark(card, 'data-gcards-card');
      const pack = mediaCard && card ? null : findImagePack(item);
      const resultTitle = item.querySelector('a[href] h3, a[href] .LC20lb');
      const exactMatch = mode === 'exact' && (item.matches('.YxbOwd') || item.querySelector('.YxbOwd'));
      const numberedCard = !pack && (resultTitle || exactMatch || (mediaCard && card)) ? card || item : null;
      if (previousRank && previousRank !== numberedCard) unrank(previousRank);
      if (numberedCard) {
        const number = String(++rank);
        numberedCard.setAttribute('data-gcards-rank', number);
        numberedCard.setAttribute('data-gcards-rank-digits', String(number.length));
        numbered.push(numberedCard);
      }
      // Re-evaluate when Google replaces a crop's results in the same wrapper.
      for (const node of item.querySelectorAll('[data-gcards-pack-chain]')) {
        node.removeAttribute('data-gcards-pack-chain');
      }
      // Blocks without a rank (People also ask, carousels, stat tables, image
      // packs) are tall or wide; spanning both columns keeps them from leaving a
      // hole beside themselves and from pushing the numbered cards out of step.
      if (pack || !numberedCard) mark(item, 'data-gcards-wide');
      else item.removeAttribute('data-gcards-wide');
      if (pack) {
        for (let node = pack.parentElement; node && node !== item; node = node.parentElement) {
          mark(node, 'data-gcards-pack-chain');
        }
      }
    }
    // Measure every card first, then write, so the layout is forced only once.
    const thumbs = [];
    for (const card of numbered) {
      const thumb = findThumbnail(card);
      if (thumb) thumbs.push({ ...thumb, shift: thumbShift(card, thumb) });
      // Row heights change with the neighbour's content; follow them.
      if (!observedCards.has(card)) {
        observedCards.add(card);
        cardObserver.observe(card);
      }
    }
    for (const { node, shift } of thumbs) {
      mark(node, 'data-gcards-thumb');
      if (node.style.getPropertyValue('--gcards-thumb-shift') !== shift) {
        node.style.setProperty('--gcards-thumb-shift', shift);
      }
    }
  }
  function unrank(node) {
    node.removeAttribute('data-gcards-rank');
    node.removeAttribute('data-gcards-rank-digits');
  }
  function schedule() {
    if (timer === undefined) timer = setTimeout(update, 100);
  }
  new MutationObserver(schedule).observe(document, {
    childList: true, subtree: true,
    attributeFilter: ['aria-expanded', 'aria-label', 'aria-hidden', 'title', 'data-tooltip', 'data-lhsxi', 'inert']
  });
  document.addEventListener('transitionend', event => {
    if (sidebar && (sidebar.contains(event.target) || event.target.contains(sidebar))) schedule();
  }, true);
  // Lazy thumbnails only get their size once loaded; re-run so they can be marked.
  document.addEventListener('load', event => {
    if (event.target instanceof HTMLImageElement && event.target.closest('[data-gcards-rank]')) schedule();
  }, true);
  addEventListener('resize', schedule);
  addEventListener('popstate', schedule);
  addEventListener('hashchange', schedule);
  // pushState can change the tab mode without a DOM mutation.
  let lastURL = location.href;
  setInterval(() => {
    if (location.href !== lastURL) { lastURL = location.href; schedule(); }
  }, 500);
  update();
})();