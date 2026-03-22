/**
 * Модель данных шрифта.
 * GLYPH_WIDTHS: ширина SVG при высоте 140 (для расчёта без задержки onload).
 */
const GLYPH_WIDTHS = {
  'а1': 27, 'а2': 22, 'б1': 60, 'б2': 56, 'в1': 63, 'в2': 73, 'г1': 17, 'г2': 19,
  'д1': 89, 'д2': 179, 'е1': 13, 'е2': 17, 'ё1': 20, 'ё2': 18, 'ж': 33,
  'з1': 87, 'з2': 72, 'и1': 26, 'и2': 35, 'й': 41, 'к1': 33, 'к2': 27, 'л': 40,
  'м1': 44, 'м2': 38, 'н1': 30, 'н2': 30, 'н3': 29, 'о1': 15, 'о2': 15, 'о3': 70,
  'п1': 22, 'п2': 28, 'р1': 92, 'р2': 84, 'с1': 17, 'с2': 14, 'т1': 42, 'т2': 62, 'т3': 55,
  'у1': 80, 'у2': 73, 'ф': 101, 'х': 27, 'ц': 27, 'ч1': 20, 'ч2': 20,
  'ш': 34, 'щ': 34, 'ъ': 16, 'ы': 22, 'ь': 15, 'э1': 18, 'э2': 16, 'ю': 36,
  'я1': 32, 'я2': 25, 'дефис': 14, 'тире': 22, 'dot': 6, 'comma-1': 16,
  'воскл': 17, 'вопр': 19, 'двоеточ': 9
};

/**
 * spacing: left/right в % от ширины глифа. Отрицательное = "кроп", соседний символ подтягивается ближе.
 * nextOverrides: при комбинации с следующим символом — переопределённый spacing.right.
 * selectVariant: функция выбора варианта по контексту. Порядок проверок = приоритет.
 */
const FONT_GLYPHS = {
  'а': {
    name: 'а',
    variants: {
      'а1': { file: 'а1', spacing: { left: 0, right: 0 } },
      'а2': { file: 'а2', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => ctx.wordStart ? 'а1' : 'а2'
  },
  'б': {
    name: 'бэ',
    variants: {
      'б1': {
        file: 'б1',
        spacing: { left: -2, right: -50 },
        nextOverrides: { 'г': { right: -30 } }
      },
      'б2': { file: 'б2', spacing: { left: -2, right: -50 } }
    },
    selectVariant: (ctx) => ctx.wordStart ? 'б1' : 'б2'
  },
  'в': {
    name: 'вэ',
    variants: {
      'в1': { file: 'в1', spacing: { left: -5, right: -70 } },
      'в2': { file: 'в2', spacing: { left: -5, right: -70 } }
    },
    selectVariant: (ctx) => (ctx.prevGlyphVariantId === 'т2' ? 'в1' : 'в2')
  },
  'г': {
    name: 'гэ',
    variants: {
      'г1': { file: 'г1', spacing: { left: 0, right: 0 } },
      'г2': { file: 'г2', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => 'г1'
  },
  'д': {
    name: 'дэ',
    variants: {
      'д1': { file: 'д1', spacing: { left: -70, right: 0 } },
      'д2': { file: 'д2', spacing: { left: -80, right: -10 } }
    },
    selectVariant: (ctx) => (ctx.positionInWord >= 6 ? 'д2' : 'д1')
  },
  'е': {
    name: 'е',
    variants: {
      'е1': { file: 'е1', spacing: { left: -10, right: -10 } },
      'е2': { file: 'е2', spacing: { left: -10, right: -10 } }
    },
    selectVariant: (ctx) => 'е1'
  },
  'ё': {
    name: 'ё',
    variants: {
      'ё1': { file: 'ё1', spacing: { left: -10, right: -10 } },
      'ё2': { file: 'ё2', spacing: { left: -10, right: -10 } }
    },
    selectVariant: (ctx) => 'ё1'
  },
  'ж': {
    name: 'жэ',
    variants: { 'ж': { file: 'ж', spacing: { left: 0, right: -10 } } },
    selectVariant: () => 'ж'
  },
  'з': {
    name: 'зэ',
    variants: {
      'з1': { file: 'з1', spacing: { left: -80, right: 0 } },
      'з2': { file: 'з2', spacing: { left: -80, right: 0 } }
    },
    selectVariant: (ctx) => (ctx.prevChar === 'у' ? 'з2' : 'з1')  // У-З: з2; З-У: з1
  },
  'и': {
    name: 'и',
    variants: {
      'и1': { file: 'и1', spacing: { left: 0, right: -10 } },
      'и2': { file: 'и2', spacing: { left: 0, right: -10 } }
    },
    selectVariant: (ctx) => 'и1'
  },
  'й': {
    name: 'й',
    variants: { 'й': { file: 'й', spacing: { left: 0, right: 0 } } },
    selectVariant: () => 'й'
  },
  'к': {
    name: 'ка',
    variants: {
      'к1': { file: 'к1', spacing: { left: 0, right: 0 } },
      'к2': { file: 'к2', spacing: { left: -10, right: 0 } }
    },
    selectVariant: (ctx) => (ctx.wordStart ? 'к1' : 'к2')
  },
  'л': {
    name: 'эль',
    variants: { 'л': { file: 'л', spacing: { left: -10, right: -20 } } },
    selectVariant: () => 'л'
  },
  'м': {
    name: 'эм',
    variants: {
      'м1': { file: 'м1', spacing: { left: 0, right: 0 } },
      'м2': { file: 'м2', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => 'м1'
  },
  'н': {
    name: 'эн',
    variants: {
      'н1': { file: 'н1', spacing: { left: -10, right: 0 } },
      'н2': { file: 'н2', spacing: { left: 0, right: 0 } },
      'н3': { file: 'н3', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => 'н1'
  },
  'о': {
    name: 'о',
    variants: {
      'о1': { file: 'о1', spacing: { left: 0, right: 0 } },
      'о2': { file: 'о2', spacing: { left: 0, right: 0 } },
      'о3': { file: 'о3', spacing: { left: 0, right: -80 } }
    },
    selectVariant: (ctx) => (ctx.isStandaloneWord ? 'о3' : 'о1')
  },
  'п': {
    name: 'пэ',
    variants: {
      'п1': { file: 'п1', spacing: { left: 0, right: 0 } },
      'п2': { file: 'п2', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => 'п1'
  },
  'р': {
    name: 'эр',
    variants: {
      'р1': { file: 'р1', spacing: { left: -30, right: -40 } },
      'р2': { file: 'р2', spacing: { left: -30, right: -30 } }
    },
    selectVariant: (ctx) => 'р1'
  },
  'с': {
    name: 'эс',
    variants: {
      'с1': { file: 'с1', spacing: { left: 0, right: 0 } },
      'с2': { file: 'с2', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => 'с1'
  },
  'т': {
    name: 'тэ',
    variants: {
      'т1': { file: 'т1', spacing: { left: 0, right: -10 } },
      'т2': { file: 'т2', spacing: { left: 0, right: -40 } },
      'т3': { file: 'т3', spacing: { left: 0, right: -30 } }
    },
    selectVariant: (ctx) => (ctx.nextChar === 'в' ? 'т2' : 'т1')
  },
  'у': {
    name: 'у',
    variants: {
      'у1': { file: 'у1', spacing: { left: -70, right: 0 } },
      'у2': { file: 'у2', spacing: { left: -70, right: 0 } }
    },
    selectVariant: (ctx) => (ctx.prevChar === 'з' ? 'у2' : 'у1')
  },
  'ф': {
    name: 'эф',
    variants: { 'ф': { file: 'ф', spacing: { left: -20, right: -50 } } },
    selectVariant: () => 'ф'
  },
  'х': {
    name: 'ха',
    variants: { 'х': { file: 'х', spacing: { left: 0, right: 0 } } },
    selectVariant: () => 'х'
  },
  'ц': {
    name: 'цэ',
    variants: { 'ц': { file: 'ц', spacing: { left: 0, right: 0 } } },
    selectVariant: () => 'ц'
  },
  'ч': {
    name: 'че',
    variants: {
      'ч1': { file: 'ч1', spacing: { left: 0, right: 0 } },
      'ч2': { file: 'ч2', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => 'ч1'
  },
  'ш': {
    name: 'ша',
    variants: { 'ш': { file: 'ш', spacing: { left: 0, right: 0 } } },
    selectVariant: () => 'ш'
  },
  'щ': {
    name: 'ща',
    variants: { 'щ': { file: 'щ', spacing: { left: 0, right: 0 } } },
    selectVariant: () => 'щ'
  },
  'ъ': {
    name: 'твёрдый знак',
    variants: { 'ъ': { file: 'ъ', spacing: { left: -20, right: -10 } } },
    selectVariant: () => 'ъ'
  },
  'ы': {
    name: 'ы',
    variants: { 'ы': { file: 'ы', spacing: { left: -20, right: 0 } } },
    selectVariant: () => 'ы'
  },
  'ь': {
    name: 'мягкий знак',
    variants: { 'ь': { file: 'ь', spacing: { left: 0, right: 0 } } },
    selectVariant: () => 'ь'
  },
  'э': {
    name: 'э',
    variants: {
      'э1': { file: 'э1', spacing: { left: 0, right: 0 } },
      'э2': { file: 'э2', spacing: { left: 0, right: 0 } }
    },
    selectVariant: (ctx) => 'э1'
  },
  'ю': {
    name: 'ю',
    variants: { 'ю': { file: 'ю', spacing: { left: 0, right: 0 } } },
    selectVariant: () => 'ю'
  },
  'я': {
    name: 'я',
    variants: {
      'я1': { file: 'я1', spacing: { left: -30, right: -10 } },
      'я2': { file: 'я2', spacing: { left: -30, right: -10 } }
    },
    selectVariant: (ctx) => (ctx.wordStart ? 'я1' : 'я2')
  }
};

/** SVG-пунктуация (один файл на символ) */
const FONT_PUNCTUATION = {
  '-': { file: 'дефис', spacing: { left: 0, right: 0 } },
  '—': { file: 'тире', spacing: { left: 0, right: 0 } },
  '.': { file: 'dot', spacing: { left: 0, right: 0 } },
  ',': { file: 'comma-1', spacing: { left: 0, right: 0 } },
  '!': { file: 'воскл', spacing: { left: 0, right: 0 } },
  '?': { file: 'вопр', spacing: { left: 0, right: 0 } },
  ':': { file: 'двоеточ', spacing: { left: 0, right: 0 } }
};
