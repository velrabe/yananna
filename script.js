(function () {
  'use strict';

  // ========== iOS viewport fix (100vh игнорирует нижнюю панель Safari) ==========
  function setVh() {
    const h = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--vh', (h * 0.01) + 'px');
  }
  setVh();
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVh);
  }

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
      const cycleInterval = 1000; // смена фото раз в секунду
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

  let text = 'С днем рождения!';
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
    const items = [];
    let i = 0;

    while (i <= chars.length) {
      if (i === cursorPos) items.push({ type: 'cursor' });
      if (i >= chars.length) break;

      if (chars[i] === ' ') {
        items.push({ type: 'space' });
        i++;
      } else if (chars[i] === '\n') {
        items.push({ type: 'newline' });
        i++;
      } else {
        const wordChars = [];
        const start = i;
        while (i < chars.length && chars[i] !== ' ' && chars[i] !== '\n') {
          wordChars.push({ char: chars[i], index: i });
          i++;
        }
        const end = i;
        if (cursorPos > start && cursorPos < end) {
          const part1 = wordChars.filter(w => w.index < cursorPos);
          const part2 = wordChars.filter(w => w.index >= cursorPos);
          if (part1.length) items.push({ type: 'word', chars: part1 });
          items.push({ type: 'cursor' });
          if (part2.length) items.push({ type: 'word', chars: part2 });
        } else {
          items.push({ type: 'word', chars: wordChars });
        }
      }
    }

    items.forEach((item) => {
      if (item.type === 'cursor') {
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        cursor.textContent = '|';
        displayArea.appendChild(cursor);
        return;
      }
      if (item.type === 'space') {
        const sp = document.createElement('span');
        sp.className = 'display-space';
        sp.style.width = SPACE_WIDTH + 'px';
        displayArea.appendChild(sp);
        return;
      }
      if (item.type === 'newline') {
        const br = document.createElement('span');
        br.className = 'display-newline';
        displayArea.appendChild(br);
        return;
      }
      if (item.type === 'word') {
        const wordWrap = document.createElement('span');
        wordWrap.className = 'display-word';
        item.chars.forEach(({ char, index }) => {
          const ctx = getContext(text, index, lastVariantId);
          const next = chars[index + 1] ? chars[index + 1].toLowerCase() : null;
          const ctxWithNext = { ...ctx, nextChar: ctx.nextChar ?? next };
          const el = renderGlyph(char, ctxWithNext, next);
          wordWrap.appendChild(el);
          const lower = char.toLowerCase();
          if (char !== ' ' && FONT_GLYPHS[lower] && el.querySelector && el.querySelector('img')) {
            lastVariantId = FONT_GLYPHS[lower].selectVariant(ctxWithNext);
          } else {
            lastVariantId = null;
          }
        });
        displayArea.appendChild(wordWrap);
      }
    });
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
  const content = document.querySelector('.content');
  const keyboardModal = document.getElementById('keyboardModal');
  const keyboardModalClose = document.getElementById('keyboardModalClose');
  const keyboardToggleBtn = document.getElementById('keyboardToggleBtn');
  function openKeyboardModal() {
    if (keyboardModal) {
      keyboardModal.classList.add('is-open');
      keyboardModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('keyboard-open');
    }
  }
  function closeKeyboardModal() {
    if (keyboardModal) {
      keyboardModal.classList.remove('is-open');
      keyboardModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('keyboard-open');
    }
  }

  function scrollToDisplayAndOpenKeyboard() {
    const sectionHero = document.querySelector('.section-hero');
    const targetScroll = sectionHero ? sectionHero.offsetHeight : 0;
    if (content && content.scrollTop > targetScroll + 50) {
      content.scrollTo({ top: targetScroll, behavior: 'smooth' });
      setTimeout(openKeyboardModal, 400);
    } else {
      openKeyboardModal();
    }
  }

  if (keyboardToggleBtn) {
    keyboardToggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToDisplayAndOpenKeyboard();
    });
  }
  if (keyboardModalClose) {
    keyboardModalClose.addEventListener('click', closeKeyboardModal);
  }

  // ========== Section 3: Slides ==========
  const sectionHidden = document.getElementById('sectionHidden');
  const hiddenText = document.getElementById('hiddenText');
  const hiddenSlides = document.getElementById('hiddenSlides');
  const hiddenBonya = sectionHidden ? sectionHidden.querySelector('.hidden-bonya') : null;
  const SLIDES = ['assets/slides/1.png', 'assets/slides/2.png', 'assets/slides/3.png', 'assets/slides/4.png', 'assets/slides/5.png', 'assets/slides/6.png', 'assets/slides/7.png', 'assets/slides/8.png', 'assets/slides/9.png', 'assets/slides/10.png', 'assets/slides/11.png'];
  const INITIAL_DELAY_MS = 5000;
  const STAGGER_MS = 3000;
  const SLIDE_LIFETIME_MS = 10000;
  const CLICK_REAPPEAR_MS = 5000;

  if (sectionHidden && hiddenText && hiddenSlides) {
    let timers = [];
    let inSection = false;

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const nowIn = entry.isIntersecting;
        if (nowIn !== inSection) {
          inSection = nowIn;
          if (inSection) {
            if (hiddenBonya) hiddenBonya.classList.add('hidden-bonya-up');
            hiddenSlides.innerHTML = '';
            addTimer(startSlides, INITIAL_DELAY_MS);
          } else {
            if (hiddenBonya) hiddenBonya.classList.remove('hidden-bonya-up');
            timers.forEach(clearTimeout);
            timers = [];
            hiddenSlides.innerHTML = '';
          }
        }
      });
    }, { threshold: 0.5 });

    observer.observe(sectionHidden);

    function addTimer(fn, delay) {
      timers.push(setTimeout(fn, delay));
    }

    const ZONES = ['top', 'center', 'bottom'];
    function createSlide(src, onShow, onHide) {
      const zone = ZONES[Math.floor(Math.random() * 3)];
      const img = document.createElement('img');
      img.className = 'hidden-slide hidden-slide-' + zone;
      img.src = src;
      img.alt = '';
      const offsetX = (Math.random() - 0.5) * 60;
      const rot = (Math.random() - 0.5) * 28;
      img.style.transform = `translate(calc(-50% + ${offsetX}%), -50%) rotate(${rot}deg)`;
      img.addEventListener('click', () => {
        if (!img.classList.contains('slide-visible')) return;
        img.classList.remove('slide-visible');
        if (onHide) onHide();
        addTimer(() => {
          if (!inSection) return;
          requestAnimationFrame(() => img.classList.add('slide-visible'));
          if (onShow) onShow();
        }, CLICK_REAPPEAR_MS);
      });
      return img;
    }

    function startSlides() {
      if (!inSection) return;
      hiddenSlides.innerHTML = '';

      const order = shuffle(SLIDES);
      order.forEach((src, i) => {
        const showAt = i * STAGGER_MS;
        let hideTimer = null;

        const scheduleHide = () => {
          if (hideTimer) clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            if (!img.parentNode) return;
            img.classList.remove('slide-visible');
          }, SLIDE_LIFETIME_MS);
        };

        const img = createSlide(src, scheduleHide, () => {
          if (hideTimer) clearTimeout(hideTimer);
        });

        hiddenSlides.appendChild(img);

        addTimer(() => {
          if (!inSection || !img.parentNode) return;
          requestAnimationFrame(() => img.classList.add('slide-visible'));
          scheduleHide();
        }, showAt);
      });

      const lastShowAt = (SLIDES.length - 1) * STAGGER_MS;
      const totalCycleMs = lastShowAt + SLIDE_LIFETIME_MS + 2000;
      addTimer(() => {
        if (!inSection) return;
        runCycle();
      }, totalCycleMs);
    }

    function runCycle() {
      if (!inSection) return;
      [...hiddenSlides.children].forEach(el => el.classList.remove('slide-visible'));
      addTimer(startSlides, 2000);
    }

  }

})();
