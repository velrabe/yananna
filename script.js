(function () {
  'use strict';

  // ========== Hero Images: pop-in + rapid cycling ==========
  const IMAGE_SETS = {
    't-l': ['assets/t-l/1.png', 'assets/t-l/2.png'],
    't-r': ['assets/t-r/1.png', 'assets/t-r/2.png'],
    'b-l': ['assets/b-l/1.png', 'assets/b-l/2.png'],
    'b-r': ['assets/b-r/1.png', 'assets/b-r/2.png', 'assets/b-r/3.png', 'assets/b-r/4.png', 'assets/b-r/5.png', 'assets/b-r/6.png', 'assets/b-r/7.png', 'assets/b-r/8.png']
  };

  const MAX_VISIBLE = 2; // не больше двух слоёв одновременно

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getVisibleCount() {
    return document.querySelectorAll('.hero-img.hero-img-visible').length;
  }

  function scheduleShow(container, isFirst = false, isRetry = false) {
    let delay;
    if (isRetry) {
      delay = 800 + Math.random() * 1700; // слот занят — ретрай через 0.8–2.5 сек
    } else if (isFirst) {
      delay = Math.random() * 5000;       // первый показ 0–5 сек
    } else {
      delay = 4000 + Math.random() * 10000; // между показами 4–14 сек
    }
    setTimeout(() => {
      if (getVisibleCount() >= MAX_VISIBLE) {
        scheduleShow(container, false, true);
        return;
      }
      container.classList.add('hero-img-visible');
      const cycleInterval = 350 + Math.random() * 400; // 0.35–0.75 сек между сменами
      const intervalId = setInterval(() => {
        const images = IMAGE_SETS[container.dataset.folder];
        if (images && images.length) {
          const img = container.querySelector('img');
          if (img) img.src = pickRandom(images);
        }
      }, cycleInterval);
      const visibleTime = 2000 + Math.random() * 4000; // на экране 2–6 сек
      setTimeout(() => {
        clearInterval(intervalId);
        container.classList.remove('hero-img-visible');
        scheduleShow(container, false, false);
      }, visibleTime);
    }, delay);
  }

  // Старт с разбросом: каждый контейнер свой случайный первый показ (0–6 сек)
  document.querySelectorAll('.hero-img[data-folder]').forEach((container) => {
    scheduleShow(container, true);
  });

  // ========== Keyboard & Display (SVG font) ==========
  const FONT_PATH = 'assets/font/';
  const GLYPH_HEIGHT = 80;
  const SVG_HEIGHT = 140;
  const SPACE_WIDTH = Math.round(37 * GLYPH_HEIGHT / SVG_HEIGHT);
  const DEFAULT_WIDTH = 25;

  const displayArea = document.getElementById('displayArea');

  let text = 'Спасибо за вдохновение!';
  let cursorPos = text.length;

  function isLetterOrPunct(char) {
    return (char && (FONT_GLYPHS[(char || '').toLowerCase()] || FONT_PUNCTUATION[char])) || char === ' ';
  }

  function getContext(str, i, lastVariantId) {
    const prev = i > 0 ? str[i - 1] : null;
    const next = i < str.length - 1 ? str[i + 1] : null;
    const wordStart = !prev || prev === ' ' || !isLetterOrPunct(prev);
    let wordStartIdx = i;
    while (wordStartIdx > 0 && str[wordStartIdx - 1] !== ' ') wordStartIdx--;
    let wordEndIdx = i;
    while (wordEndIdx < str.length && str[wordEndIdx] !== ' ') wordEndIdx++;
    let positionInWord = 0;
    let letterCountInWord = 0;
    for (let k = wordStartIdx; k < wordEndIdx; k++) {
      if (FONT_GLYPHS[(str[k] || '').toLowerCase()]) {
        letterCountInWord++;
        if (k <= i) positionInWord++;
      }
    }
    return { wordStart, prevChar: prev ? prev.toLowerCase() : null, nextChar: next ? next.toLowerCase() : null, positionInWord, prevGlyphVariantId: lastVariantId, isStandaloneWord: letterCountInWord === 1 };
  }

  function getSpacing(glyphData, nextChar) {
    const base = glyphData.spacing || { left: 0, right: 0 };
    if (nextChar && glyphData.nextOverrides && glyphData.nextOverrides[nextChar])
      return { left: base.left, right: glyphData.nextOverrides[nextChar].right !== undefined ? glyphData.nextOverrides[nextChar].right : base.right };
    return base;
  }

  function renderGlyph(char, ctx, nextChar) {
    if (char === '\n') {
      const br = document.createElement('span');
      br.className = 'display-newline';
      return br;
    }
    if (char === ' ') {
      const sp = document.createElement('span');
      sp.className = 'display-space';
      sp.style.width = SPACE_WIDTH + 'px';
      return sp;
    }
    const span = document.createElement('span');
    span.className = 'display-char';
    const punct = FONT_PUNCTUATION[char];
    if (punct) {
      const w140 = (typeof GLYPH_WIDTHS !== 'undefined' && GLYPH_WIDTHS[punct.file]) ? GLYPH_WIDTHS[punct.file] : DEFAULT_WIDTH;
      const glyphW = Math.round(w140 * GLYPH_HEIGHT / SVG_HEIGHT);
      const img = document.createElement('img');
      span.classList.add('loading');
      img.src = FONT_PATH + punct.file + '.svg';
      img.onload = () => span.classList.remove('loading');
      if (img.complete) img.onload();
      img.alt = char;
      img.style.width = glyphW + 'px';
      img.style.height = GLYPH_HEIGHT + 'px';
      img.style.flexShrink = '0';
      span.appendChild(img);
      const s = getSpacing(punct, nextChar);
      span.style.marginLeft = (glyphW * (s.left || 0) / 100) + 'px';
      span.style.marginRight = (glyphW * (s.right || 0) / 100) + 'px';
      return span;
    }
    const lower = char.toLowerCase();
    const glyph = FONT_GLYPHS[lower];
    if (!glyph) {
      const fallback = document.createElement('span');
      fallback.className = 'display-fallback';
      fallback.textContent = char;
      span.appendChild(fallback);
      return span;
    }
    const variantId = glyph.selectVariant(ctx);
    const variant = glyph.variants[variantId];
    if (!variant) return span;
    const w140 = (typeof GLYPH_WIDTHS !== 'undefined' && GLYPH_WIDTHS[variant.file]) ? GLYPH_WIDTHS[variant.file] : DEFAULT_WIDTH;
    const glyphW = Math.round(w140 * GLYPH_HEIGHT / SVG_HEIGHT);
    const img = document.createElement('img');
    span.classList.add('loading');
    img.src = FONT_PATH + variant.file + '.svg';
    img.onload = () => span.classList.remove('loading');
    if (img.complete) img.onload();
    img.alt = char;
    img.style.width = glyphW + 'px';
    img.style.height = GLYPH_HEIGHT + 'px';
    img.style.flexShrink = '0';
    span.appendChild(img);
    const s = getSpacing(variant, nextChar);
    span.style.marginLeft = (glyphW * (s.left || 0) / 100) + 'px';
    span.style.marginRight = (glyphW * (s.right || 0) / 100) + 'px';
    return span;
  }

  function updateDisplay() {
    displayArea.innerHTML = '';
    let lastVariantId = null;
    const chars = [...text];
    for (let i = 0; i <= chars.length; i++) {
      if (i === cursorPos) {
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.textContent = '|';
        displayArea.appendChild(cursor);
      }
      if (i < chars.length) {
        const ctx = getContext(text, i, lastVariantId);
        const next = chars[i + 1] ? chars[i + 1].toLowerCase() : null;
        const el = renderGlyph(chars[i], ctx, next);
        displayArea.appendChild(el);
        const lower = chars[i].toLowerCase();
        if (chars[i] !== ' ' && FONT_GLYPHS[lower] && el.querySelector('img')) {
          lastVariantId = FONT_GLYPHS[lower].selectVariant(ctx);
        } else {
          lastVariantId = null;
        }
      }
    }
  }

  function insertChar(char) {
    text = text.slice(0, cursorPos) + char + text.slice(cursorPos);
    cursorPos++;
    updateDisplay();
  }

  function backspace() {
    if (cursorPos > 0) {
      text = text.slice(0, cursorPos - 1) + text.slice(cursorPos);
      cursorPos--;
      updateDisplay();
    }
  }

  function clearAll() {
    text = '';
    cursorPos = 0;
    updateDisplay();
  }

  function insertNewline() {
    text = text.slice(0, cursorPos) + '\n' + text.slice(cursorPos);
    cursorPos++;
    updateDisplay();
  }

  // Long-press: secondary char (iOS-style), popup above key
  const LONG_PRESS_MS = 450;
  let longPressTimer = null;
  let longPressHandled = false;
  let activeKeyBtn = null;
  let popoverEl = null;

  function showPopover(btn, char) {
    hidePopover();
    popoverEl = document.createElement('div');
    popoverEl.className = 'key-popover';
    popoverEl.textContent = char;
    document.body.appendChild(popoverEl);
    const rect = btn.getBoundingClientRect();
    popoverEl.style.left = rect.left + 'px';
    popoverEl.style.top = (rect.top - 4) + 'px';
    popoverEl.style.width = rect.width + 'px';
    popoverEl.style.transform = 'translateY(-100%)';
  }
  function hidePopover() {
    if (popoverEl && popoverEl.parentNode) popoverEl.parentNode.removeChild(popoverEl);
    popoverEl = null;
  }

  function cancelLongPress() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
    activeKeyBtn = null;
    hidePopover();
  }

  function handleKeyPress(btn, useSecondary) {
    const char = useSecondary ? (btn.dataset.secondary || btn.dataset.char) : btn.dataset.char;
    insertChar(char);
  }

  document.querySelectorAll('.key[data-char]').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      activeKeyBtn = btn;
      const secondary = btn.dataset.secondary;
      longPressHandled = false;
      longPressTimer = setTimeout(() => {
        longPressHandled = true;
        if (secondary) showPopover(btn, secondary);
      }, secondary ? LONG_PRESS_MS : 99999);
    });
    btn.addEventListener('pointerup', (e) => {
      var btnEl = e.target.closest('.key[data-char]');
      if (!btnEl || btnEl !== activeKeyBtn) {
        cancelLongPress();
        return;
      }
      clearTimeout(longPressTimer);
      longPressTimer = null;
      var sec = activeKeyBtn.dataset.secondary;
      if (longPressHandled && sec) {
        handleKeyPress(activeKeyBtn, true);
      } else {
        handleKeyPress(activeKeyBtn, false);
      }
      hidePopover();
      activeKeyBtn = null;
    });
    btn.addEventListener('pointerleave', cancelLongPress);
    btn.addEventListener('pointercancel', cancelLongPress);
  });

  document.querySelector('.key-backspace').addEventListener('click', backspace);
  document.querySelector('.key-clear').addEventListener('click', clearAll);
  document.querySelector('.key-enter').addEventListener('click', insertNewline);

  updateDisplay();

  // ========== Keyboard Modal ==========
  const keyboardTeaser = document.getElementById('keyboardTeaser');
  const keyboardModal = document.getElementById('keyboardModal');
  const keyboardModalClose = document.getElementById('keyboardModalClose');

  function openKeyboardModal() {
    keyboardModal.classList.add('is-open');
    keyboardModal.setAttribute('aria-hidden', 'false');
  }
  function closeKeyboardModal() {
    keyboardModal.classList.remove('is-open');
    keyboardModal.setAttribute('aria-hidden', 'true');
  }

  if (keyboardTeaser) keyboardTeaser.addEventListener('click', openKeyboardModal);
  if (keyboardTeaser) keyboardTeaser.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openKeyboardModal(); } });
  if (keyboardModalClose) keyboardModalClose.addEventListener('click', closeKeyboardModal);

  // ========== Tension Scroll (Section 3) ==========
  const content = document.querySelector('.content');
  const sectionKeyboard = document.querySelector('.section-keyboard');
  const sectionHidden = document.getElementById('sectionHidden');

  if (!content || !sectionKeyboard || !sectionHidden) return;

  const TENSION_THRESHOLD = 50; // px to overcome for snap to section 3
  const RESISTANCE = 0.5;      // 60px скролла → ~30px движения (параллакс: тянешь сильно, идёт слабо)

  let touchStartY = 0;
  let scrollStartTop = 0;

  function getSection2End() {
    const sectionHero = document.querySelector('.section-hero');
    return sectionHero.offsetHeight + sectionKeyboard.offsetHeight - content.clientHeight;
  }

  content.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    scrollStartTop = content.scrollTop;
  }, { passive: true });

  content.addEventListener('touchmove', (e) => {
    const section2End = getSection2End();
    const deltaY = touchStartY - e.touches[0].clientY;
    if (content.scrollTop >= section2End - 2 && deltaY > 0) {
      e.preventDefault();
      const newScroll = scrollStartTop + deltaY * RESISTANCE;
      const maxScroll = content.scrollHeight - content.clientHeight;
      content.scrollTop = Math.min(newScroll, maxScroll);
    }
  }, { passive: false });

  content.addEventListener('touchend', () => {
    const section2End = getSection2End();
    const threshold = section2End + TENSION_THRESHOLD;

    if (content.scrollTop > section2End && content.scrollTop < threshold) {
      content.scrollTo({ top: section2End, behavior: 'smooth' });
    } else if (content.scrollTop >= threshold) {
      content.scrollTo({ top: content.scrollHeight - content.clientHeight, behavior: 'smooth' });
    }
  });

  // Mouse wheel resistance (desktop)
  content.addEventListener('wheel', (e) => {
    const section2End = getSection2End();
    if (content.scrollTop >= section2End - 2 && e.deltaY > 0) {
      e.preventDefault();
      content.scrollTop = Math.min(
        content.scrollTop + e.deltaY * RESISTANCE,
        content.scrollHeight - content.clientHeight
      );
    }
  }, { passive: false });

  // TikTok-style snapping: 10% потянул — автоматом на след. экран
  const SNAP_THRESHOLD = 0.1;
  let snapTimeout = null;

  function getSectionTops() {
    const hero = document.querySelector('.section-hero');
    const keyboard = document.querySelector('.section-keyboard');
    const hidden = document.getElementById('sectionHidden');
    return {
      s1: 0,
      s2: hero ? hero.offsetHeight : content.clientHeight,
      s3: hero && keyboard ? hero.offsetHeight + keyboard.offsetHeight : content.clientHeight * 2
    };
  }

  function findSnapTarget() {
    const tops = getSectionTops();
    const scrollTop = content.scrollTop;
    const vh = content.clientHeight;

    if (scrollTop < tops.s2 * SNAP_THRESHOLD) return tops.s1;
    if (scrollTop < tops.s2 + (tops.s3 - tops.s2) * (1 - SNAP_THRESHOLD)) return tops.s2;
    return content.scrollHeight - content.clientHeight;
  }

  function applySnap() {
    const target = findSnapTarget();
    if (Math.abs(content.scrollTop - target) > 5) {
      content.scrollTo({ top: target, behavior: 'smooth' });
    }
  }

  function scheduleSnap() {
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(applySnap, 150);
  }

  content.addEventListener('scroll', () => {
    const section2End = getSection2End();
    if (content.scrollTop < section2End) scheduleSnap();
  }, { passive: true });

  content.addEventListener('touchend', () => {
    if (content.scrollTop < getSection2End()) scheduleSnap();
  }, { passive: true });
})();
