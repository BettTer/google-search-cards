// ==UserScript==
// @name           Google Search Cards
// @name:zh-CN     Google 搜索卡片
// @namespace      https://github.com/BettTer/google-search-cards
// @version        2026.11.19.4
// @description    View Google Search results in two columns, with support for the collapsible sidebar and Google Lens.
// @description:zh-CN 将 Google 搜索结果排成两列，支持可折叠侧栏和 Google Lens。
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
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    [data-gcards] #rcnt [data-gcards-chain] {
      margin-inline: 0;
    }

    [data-gcards] [data-gcards-list] {
      columns: 2;
      column-gap: 20px;
    }

    [data-gcards][data-gcards-narrow] [data-gcards-list] {
      columns: 1;
    }

    [data-gcards] [data-gcards-list] > [data-gcards-item] {
      box-sizing: border-box;
      min-inline-size: 0;
      max-inline-size: 100%;
      break-inside: avoid;
    }

    [data-gcards] [data-gcards-list] > .ULSxyf {
      margin-block-end: 0;
      padding: 5px;
    }

    [data-gcards] [data-gcards-list] > [data-gcards-wide] {
      column-span: all;
    }

    [data-gcards] [data-gcards-card] {
      display: inline-block;
      box-sizing: border-box;
      inline-size: 100%;
      min-inline-size: 0;
      max-inline-size: 100%;
      margin-block: 5px 10px;
      padding-block: 15px;
      padding-inline: 20px;
      border-radius: 5px;
      box-shadow: 1px 1px 5px rgb(0 0 0 / 30%);
      vertical-align: top;
    }

    [data-gcards] [data-gcards-rank] {
      position: relative;
    }

    [data-gcards] [data-gcards-rank]::after {
      content: attr(data-gcards-rank) / "";
      position: absolute;
      inset-block-start: 12px;
      inset-inline-end: 12px;
      padding: 2px 6px;
      border-radius: 6px;
      background: color-mix(in srgb, CanvasText 7%, Canvas);
      color: color-mix(in srgb, CanvasText 65%, Canvas);
      font: 600 12px/1.4 system-ui, sans-serif;
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
    const p = url.searchParams, mode = p.get('udm');
    if (mode === '48') return 'exact';
    if (mode === '26') return 'lens';
    // Other tabs, especially Images and Visual matches, keep Google's own layout.
    if (mode && mode !== '14') return '';
    if (p.has('tbm')) return '';
    if (p.has('lns_mode') || p.has('vsrid')) return 'lens';
    return 'web';
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
    const mode = modeFor(new URL(location.href));
    style.media = mode ? 'all' : 'not all';
    if (mode !== lastMode) { clear(); lastMode = mode; }
    if (!mode) {
      root.removeAttribute('data-gcards');
      watchLayout(null, null);
      return;
    }
    root.setAttribute('data-gcards', mode);
    // Drop detached references when Google replaces a whole results subtree.
    for (const node of marks) if (!node.isConnected) marks.delete(node);
    const list = document.querySelector('#rso');
    const outer = document.querySelector('#rcnt');
    if (!list || !outer || !outer.contains(list)) {
      watchLayout(null, null);
      return;
    }
    for (let node = list.parentElement; node && node !== outer; node = node.parentElement) {
      mark(node, 'data-gcards-chain');
    }
    mark(outer, 'data-gcards-results');
    mark(list, 'data-gcards-list');
    watchLayout(outer, list);
    let rank = 0;
    for (const item of list.children) {
      if (['STYLE','SCRIPT','LINK'].includes(item.tagName)) continue;
      const empty = !item.querySelector('a,img,video,iframe,canvas,h2,h3,[role=heading],[role=button]') && !hasText(item);
      if (empty) {
        mark(item, 'data-gcards-empty');
        item.removeAttribute('data-gcards-rank');
        continue;
      }
      item.removeAttribute('data-gcards-empty');
      mark(item, 'data-gcards-item');
      const card = item.matches('.g, .ts, .vt6azd') ? item : item.querySelector('.g, .ts, .vt6azd');
      if (card) mark(card, 'data-gcards-card');
      const pack = findImagePack(item);
      const resultTitle = item.querySelector('a[href] h3, a[href] .LC20lb');
      const exactMatch = mode === 'exact' && (item.matches('.YxbOwd') || item.querySelector('.YxbOwd'));
      if (!pack && (resultTitle || exactMatch)) {
        item.setAttribute('data-gcards-rank', String(++rank));
      } else {
        item.removeAttribute('data-gcards-rank');
      }
      // Re-evaluate when Google replaces a crop's results in the same wrapper.
      for (const node of item.querySelectorAll('[data-gcards-pack-chain]')) {
        node.removeAttribute('data-gcards-pack-chain');
      }
      if (pack) {
        mark(item, 'data-gcards-wide');
        for (let node = pack.parentElement; node && node !== item; node = node.parentElement) {
          mark(node, 'data-gcards-pack-chain');
        }
      } else item.removeAttribute('data-gcards-wide');

    }
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
