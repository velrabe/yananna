(function () {
  'use strict';

  // ========== Hero Images: pop-in + rapid cycling ==========
  const IMAGE_SETS = {
    't-l': ['assets/t-l/1.png', 'assets/t-l/2.png'],
    't-r': ['assets/t-r/1.png', 'assets/t-r/2.png'],
    'b-l': ['assets/b-l/1.png', 'assets/b-l/2.png'],
    'b-r': ['assets/b-r/1.png', 'assets/b-r/2.png', 'assets/b-r/3.png', 'assets/b-r/4.png', 'assets/b-r/5.png', 'assets/b-r/6.png', 'assets/b-r/7.png', 'assets/b-r/8.png']
  };

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function scheduleShow(container) {
    const delay = 5000 + Math.random() * 5000; // появление раз в 5–10 сек
    setTimeout(() => {
      container.classList.add('hero-img-visible');
      const cycleInterval = 400 + Math.random() * 300; // перелистывание картинок каждые 0.4–0.7 сек
      const intervalId = setInterval(() => {
        const images = IMAGE_SETS[container.dataset.folder];
        if (images && images.length) {
          const img = container.querySelector('img');
          if (img) img.src = pickRandom(images);
        }
      }, cycleInterval);
      const visibleTime = 3000 + Math.random() * 2000; // на экране 3–5 сек
      setTimeout(() => {
        clearInterval(intervalId);
        container.classList.remove('hero-img-visible');
        scheduleShow(container);
      }, visibleTime);
    }, delay);
  }

  document.querySelectorAll('.hero-img[data-folder]').forEach((container) => {
    const stagger = Math.random() * 1000; // случайная задержка 0–1 сек до старта
    setTimeout(() => scheduleShow(container), stagger);
  });

  // ========== Keyboard & Display (SVG font) ==========
  const FONT_PATH = 'assets/font/';
  const GLYPH_HEIGHT = 80;
  const SPACE_WIDTH = Math.round(37 * GLYPH_HEIGHT / 140);

  const displayArea = document.getElementById('displayArea');

  let text = '';
  let cursorPos = 0;

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
      const img = document.createElement('img');
      img.src = FONT_PATH + punct.file + '.svg?t=' + Date.now();
      img.alt = char;
      img.style.height = GLYPH_HEIGHT + 'px';
      span.appendChild(img);
      const s = getSpacing(punct, nextChar);
      const applySpacing = () => {
        const w = img.offsetWidth;
        span.style.marginLeft = (w * (s.left || 0) / 100) + 'px';
        span.style.marginRight = (w * (s.right || 0) / 100) + 'px';
      };
      img.onload = applySpacing;
      if (img.complete) applySpacing();
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
    const img = document.createElement('img');
    img.src = FONT_PATH + variant.file + '.svg?t=' + Date.now();
    img.alt = char;
    img.style.height = GLYPH_HEIGHT + 'px';
    span.appendChild(img);
    const s = getSpacing(variant, nextChar);
    const applySpacing = () => {
      const w = img.offsetWidth;
      span.style.marginLeft = (w * (s.left || 0) / 100) + 'px';
      span.style.marginRight = (w * (s.right || 0) / 100) + 'px';
    };
    img.onload = applySpacing;
    if (img.complete) applySpacing();
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

  document.querySelectorAll('.key[data-char]').forEach(btn => {
    btn.addEventListener('click', () => insertChar(btn.dataset.char));
  });

  document.querySelector('.key-backspace').addEventListener('click', backspace);
  document.querySelector('.key-clear').addEventListener('click', clearAll);

  updateDisplay();

  // ========== Tension Scroll (Section 3) ==========
  const content = document.querySelector('.content');
  const sectionKeyboard = document.querySelector('.section-keyboard');
  const sectionHidden = document.getElementById('sectionHidden');

  if (!content || !sectionKeyboard || !sectionHidden) return;

  const TENSION_THRESHOLD = 50; // px to overcome for snap to section 3
  const RESISTANCE = 0.6;      // scroll delta multiplier in tension zone (выше = легче прокрутить)

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
})();
