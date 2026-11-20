// ==UserScript==
// @name           Google Search: More Results at a Glance
// @name:zh-CN     Google 搜索：一屏多看
// @namespace      https://github.com/BettTer/google-search-cards
// @version        2026.11.20.5
// @description    See more Google results at once with numbered, two-column cards. Compare results with less scrolling.
// @description:zh-CN 把 Google 搜索结果排成带编号的两列卡片，一屏多看几条，少滚几下。
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
      --gcards-thumb-inset: 20px;
      --gcards-thumb-gap: 12px;
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

    [data-gcards] [data-gcards-list] > [data-gcards-group] {
      display: contents !important;
    }

    [data-gcards] :is([data-gcards-list], [data-gcards-group]) > [data-gcards-item] {
      box-sizing: border-box;
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    /* A wrapper item passes the row height on so both cards of a row match. */
    [data-gcards] :is([data-gcards-list], [data-gcards-group]) > [data-gcards-item]:has(> [data-gcards-card]) {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: 1fr;
    }

    [data-gcards] :is([data-gcards-list], [data-gcards-group]) > .ULSxyf:not([data-gcards-card]) {
      margin-block-end: 0;
      padding: 5px;
    }

    [data-gcards] :is([data-gcards-list], [data-gcards-group]) > [data-gcards-wide] {
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

    [data-gcards="exact"] [data-gcards-card] .YxbOwd {
      padding-inline: 0;
      background: transparent;
    }

    /* Visual matches uses a Google-generated masonry grid. Reuse its tiles in
       the shared row layout, with a frame that shows the entire thumbnail. */
    [data-gcards="visual"] [data-gcards-list] {
      grid-auto-rows: auto !important;
      justify-content: stretch;
    }

    [data-gcards="visual"] [data-gcards-list] > [data-snf] {
      grid-area: auto !important;
      block-size: auto !important;
    }

    [data-gcards="visual"] [data-gcards-list] .R8rd3e {
      aspect-ratio: 16 / 9;
      block-size: auto;
    }

    [data-gcards="visual"] [data-gcards-list] .R8rd3e img {
      object-fit: contain;
    }

    [data-gcards] :is([data-gcards-card], [data-gcards-rank]) {
      background-color: var(--gcards-card-surface);
      padding-inline-end: var(--gcards-rank-rail);
    }

    [data-gcards] [data-gcards-card] .srKDX > .LnCrMe:not([data-gcards-thumb]) {
      align-self: center;
    }

    /* Reserve one lane for the thumbnail. Its top offset is independent of row height. */
    [data-gcards] [data-gcards-rank][data-gcards-thumb-side] {
      --gcards-thumb-lane: calc(var(--gcards-thumb-width) + var(--gcards-thumb-inset) + var(--gcards-thumb-gap));
      min-block-size: calc(var(--gcards-thumb-top) + var(--gcards-thumb-height) + 15px);
    }

    [data-gcards] [data-gcards-rank][data-gcards-thumb-side="end"] {
      padding-inline-end: max(var(--gcards-rank-rail), var(--gcards-thumb-lane));
    }

    [data-gcards] [data-gcards-rank][data-gcards-thumb-side="start"] {
      padding-inline-start: var(--gcards-thumb-lane);
    }

    /* The original wrapper stays in the result link, but no longer takes a second lane. */
    [data-gcards] [data-gcards-rank][data-gcards-thumb-side] [data-gcards-thumb] {
      position: absolute;
      inset: 0 auto auto 0;
      box-sizing: border-box;
      inline-size: var(--gcards-thumb-box-width) !important;
      margin: 0 !important;
      translate: var(--gcards-thumb-shift, none);
    }

    /* Google's compact News template already reserves space beside its summary. */
    [data-gcards] [data-gcards-thumb-side] .aI5QMe .SoAPf .UqSP2b {
      margin-inline-end: 0;
    }

    [data-gcards] :is([data-gcards-card], [data-gcards-rank]):not(:focus-visible) {
      outline: 1px solid var(--gcards-card-outline);
      outline-offset: -1px;
    }

    [data-gcards] [data-gcards-rank] {
      position: relative;
      /* Keep the rank's stacking order local to its own card. */
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

    [data-gcards] :is([data-gcards-list], [data-gcards-group]) > [data-gcards-empty] {
      display: none !important;
    }
  `;
  const marks = new Set();
  let lastMode = '', timer;
  let results, resultList, sidebar, layoutFrame;
  let waitingForInitialSidebarClose;
  const layoutObserver = new ResizeObserver(scheduleLayout);
  // Reposition thumbnails when a card's native content reflows.
  const cardObserver = new ResizeObserver(schedule);
  const observedCards = new WeakSet();
  const MEDIA_CARDS = { news: '.WCv1we', videos: '.PmEWq.vt6azd' };
  const DEFAULT_THUMBNAIL_LAYOUT = { side: 'end', top: 'var(--gcards-rank-rail)' };
  const TAB_THUMBNAIL_LAYOUT = { videos: { side: 'start', top: '15px' } };
  const THUMBNAIL_SLOT = '.srKDX > .LnCrMe, .lSfe4c > .gpjNTe';
  const NON_RESULTS = 'style, script, link';
  const SEARCH_FILTERS = ['q', 'udm', 'tbm', 'tbs', 'lr', 'cr', 'filter', 'safe', 'nfpr', 'hl', 'gl', 'vsrid'];
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
    if (mode === '44') return 'visual';
    if (mode === '26') return 'lens';
    if (mode === 'vids' || (!mode && tab === 'vid')) return 'videos';
    if (!mode && tab === 'nws') return 'news';
    // Other tabs, including regular Google Images, keep Google's own layout.
    if (mode && mode !== '14') return '';
    if (p.has('tbm')) return '';
    if (p.has('lns_mode') || p.has('vsrid')) return 'lens';
    return 'web';
  }
  function findResultLists(outer, root, mode, mediaCard) {
    if (!root) return [];
    if (mode === 'visual') {
      return [...root.querySelectorAll('.srKDX[data-snc]:has(> [data-snf] .R8rd3e [role="button"] img)')];
    }
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
  function findWebResultGroups(list) {
    return [...list.children].filter(node => {
      if (!node.matches('div:not([class], [id], [role], [jscontroller])')) return false;
      const children = [...node.children].filter(child => !child.matches(NON_RESULTS));
      return children.every(child => child.matches('.MjjYud, .ULSxyf')) &&
        children.filter(child => child.matches('.MjjYud') && child.querySelector('a[href] h3, a[href] .LC20lb')).length >= 2;
    });
  }
  function pageOffset(url) {
    const start = Number(url.searchParams.get('start'));
    return Number.isSafeInteger(start) && start >= 0 ? start : 0;
  }
  function pageNumbering(url, mode) {
    const params = url.searchParams;
    const filters = [...params].filter(([name]) => SEARCH_FILTERS.includes(name) || name.startsWith('as_'));
    filters.sort(([left], [right]) => left.localeCompare(right));
    const key = `google-cards:page-counts:${JSON.stringify([mode, params.get('num') || '10', filters])}`;
    const offset = pageOffset(url);
    let pages = {};
    try {
      pages = JSON.parse(sessionStorage.getItem(key)) || {};
    } catch {
      // Storage can be disabled. Fall back to the requested offset.
    }
    let previous = offset;
    let count = 0;
    // Each saved page links to the actual next page and records how many cards it showed.
    while (Array.isArray(pages[previous])) {
      const [start, cards] = pages[previous];
      if (!Number.isSafeInteger(start) || start < 0 || start >= previous ||
          !Number.isSafeInteger(cards) || cards < 0) break;
      previous = start;
      count += cards;
    }
    return { key, pages, offset, rank: previous + count };
  }
  function savePageCount({ key, pages, offset }, count) {
    const nextLink = document.querySelector('a#pnnext[href]');
    if (!nextLink) return;
    const next = pageOffset(new URL(nextLink.href, location.href));
    if (next <= offset || (pages[next]?.[0] === offset && pages[next]?.[1] === count)) return;
    pages[next] = [offset, count];
    try {
      sessionStorage.setItem(key, JSON.stringify(pages));
    } catch {
      // Number this page even if the browser cannot save its count.
    }
  }
  function findThumbnail(card, current, { side }) {
    const images = [];
    for (const img of card.querySelectorAll('img')) {
      const rect = img.getBoundingClientRect();
      const slot = img.closest(THUMBNAIL_SLOT);
      const visibleThumbnail = rect.width >= 40 && rect.height >= 40;
      const reservedSize = (!rect.width || !rect.height) &&
        (Number(img.getAttribute('width')) >= 40 && Number(img.getAttribute('height')) >= 40);
      // Native media slots also count when their images are small or still loading.
      if (visibleThumbnail || reservedSize || (slot && card.contains(slot))) {
        images.push({ img, rect, slot });
      }
    }
    // A pair or any larger gallery keeps its original grid space and order.
    if (images.length !== 1) return null;
    const [{ img, rect, slot }] = images;
    if (rect.width < 40 || rect.height < 40) return null;
    const box = card.getBoundingClientRect();
    if (box.width - rect.width < 190) return null;
    const left = (side === 'start') !== (getComputedStyle(card).direction === 'rtl');
    let node = current?.contains(img) ? current : slot;
    if (!node || !card.contains(node)) {
      const gap = left ? rect.left - box.left : box.right - rect.right;
      if (gap < -12 || gap > 100) return null;
      node = img;
      while (node.parentElement !== card &&
             node.parentElement.getBoundingClientRect().width <= rect.width + 24 &&
             !node.parentElement.querySelector('h3, .LC20lb, [role="heading"]')) {
        node = node.parentElement;
      }
    }
    // Keep unfamiliar wrappers in flow if they contain other image elements.
    if (!slot && node.querySelectorAll('img').length > 1) return null;
    return { card, img, node, left, rect };
  }
  function thumbShift({ card, img, node, left }) {
    const box = card.getBoundingClientRect();
    const rect = img.getBoundingClientRect();
    const style = getComputedStyle(card);
    const inset = parseFloat(style.getPropertyValue('--gcards-thumb-inset')) || 20;
    const top = parseFloat(style.getPropertyValue('--gcards-thumb-top'));
    // `rect` includes the shift already applied; take it off to get the natural box.
    const applied = getComputedStyle(node).translate;
    const [dx = 0, dy = 0] = applied === 'none' ? [] : applied.split(' ').map(parseFloat);
    const y = box.top + top - rect.top + dy;
    const x = left ? box.left + inset - rect.left + dx : box.right - inset - rect.right + dx;
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
    let mode = modeFor(url);
    if (mode === 'visual' && document.querySelector('#main[data-wide-viewer="1"]')) mode = '';
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
    const lists = outer ? findResultLists(outer, document.querySelector('#rso'), mode, mediaCard) : [];
    const list = lists[0];
    if (resultList && resultList !== list) clear();
    if (!list || !outer.contains(list)) {
      watchLayout(null, null);
      return;
    }
    const groups = new Set(mode === 'web' ? findWebResultGroups(list) : []);
    if ([...list.children].some(node => node.hasAttribute('data-gcards-group') !== groups.has(node))) clear();
    for (const group of groups) mark(group, 'data-gcards-group');
    for (const node of lists) {
      for (let chain = node.parentElement; chain && chain !== outer; chain = chain.parentElement) {
        mark(chain, 'data-gcards-chain');
      }
      mark(node, 'data-gcards-list');
    }
    mark(outer, 'data-gcards-results');
    watchLayout(outer, list);
    if (mode === 'visual') return;
    const cardSelector = mediaCard || '.g, .ts, .vt6azd';
    const pagination = pageNumbering(url, mode);
    let rank = pagination.rank;
    const numbered = [];
    const items = lists.flatMap(node => [...node.children]).flatMap(node => groups.has(node) ? [...node.children] : [node]);
    for (const item of items) {
      if (item.matches(NON_RESULTS)) continue;
      const previousRank = item.hasAttribute('data-gcards-rank') ? item : item.querySelector('[data-gcards-rank]');
      const empty = !item.querySelector('a,img,video,iframe,canvas,h2,h3,[role=heading],[role=button]') && !hasText(item);
      if (empty) {
        mark(item, 'data-gcards-empty');
        if (previousRank) unrank(previousRank);
        continue;
      }
      item.removeAttribute('data-gcards-empty');
      mark(item, 'data-gcards-item');
      const exactMatch = mode === 'exact' && (item.matches('.YxbOwd') || item.querySelector('.YxbOwd'));
      const card = exactMatch || item.matches(cardSelector) ? item : item.querySelector(cardSelector);
      if (card) mark(card, 'data-gcards-card');
      const pack = mediaCard && card ? null : findImagePack(item);
      const resultTitle = item.querySelector('a[href] h3, a[href] .LC20lb');
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
    savePageCount(pagination, numbered.length);
    if (mode === 'exact') return;
    const thumbnailLayout = { ...DEFAULT_THUMBNAIL_LAYOUT, ...TAB_THUMBNAIL_LAYOUT[mode] };
    // Read native dimensions before reserving space and taking thumbnails out of the flow.
    const thumbnails = numbered.map(card => {
      const current = card.querySelector('[data-gcards-thumb]');
      const thumb = findThumbnail(card, current, thumbnailLayout);
      const width = thumb && Math.max(thumb.rect.width, thumb.node.getBoundingClientRect().width);
      return { card, current, thumb, width };
    });
    for (const { card, current, thumb, width } of thumbnails) {
      if (!observedCards.has(card)) {
        observedCards.add(card);
        cardObserver.observe(card);
      }
      if (current && current !== thumb?.node) current.removeAttribute('data-gcards-thumb');
      if (!thumb) {
        card.removeAttribute('data-gcards-thumb-side');
        continue;
      }
      mark(card, 'data-gcards-thumb-side');
      card.setAttribute('data-gcards-thumb-side', thumbnailLayout.side);
      card.style.setProperty('--gcards-thumb-top', thumbnailLayout.top);
      card.style.setProperty('--gcards-thumb-width', `${Math.ceil(thumb.rect.width)}px`);
      card.style.setProperty('--gcards-thumb-height', `${Math.ceil(thumb.rect.height)}px`);
      mark(thumb.node, 'data-gcards-thumb');
      thumb.node.style.setProperty('--gcards-thumb-box-width', `${Math.ceil(width)}px`);
    }
    const shifts = thumbnails.filter(({ thumb }) => thumb).map(({ thumb }) => [thumb.node, thumbShift(thumb)]);
    for (const [node, shift] of shifts) {
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
    attributeFilter: ['aria-expanded', 'aria-label', 'aria-hidden', 'title', 'data-tooltip', 'data-lhsxi', 'data-wide-viewer', 'inert']
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
  addEventListener('pageshow', schedule);
  addEventListener('hashchange', schedule);
  // pushState can change the tab mode without a DOM mutation.
  let lastURL = location.href;
  setInterval(() => {
    if (location.href !== lastURL) { lastURL = location.href; schedule(); }
  }, 500);
  update();
})();
