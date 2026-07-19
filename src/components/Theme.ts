// FILE-PATH: src/components/theme.ts
/**
 * STANDALONE (+ picocolors)
 * DRACULA INSPIRED
 *
 * Chainable Theme
 */
import pc from 'picocolors';

/**
 * CONSTANTS (Official Dracula Color Palette ANSI Mappings)
 * Dracula hex colors translated to closest standard/bright ANSI equivalents.
 */
const DRACULA = {
  background: pc.bgBlack, //: #282a36
  currentLine: pc.bgBlackBright, //: #44475a
  foreground: pc.white, //: #f8f8f2
  comment: pc.gray, //: #6272a4
  cyan: pc.cyan, //: #8be9fd
  green: pc.green, //: #50fa7b
  orange: pc.yellow, //: #ffb86c
  pink: pc.magenta, //: #ff79c6
  purple: pc.magentaBright, //: #bd93f9
  red: pc.red, //: #ff5555
  yellow: pc.yellowBright, //: #f1fa8c
};

/**
 * Dracula Dark
 * Adapts elements for dark terminal backgrounds.
 */
const DARK_THEME: DefaultTheme = {
  primary: (txt) => DRACULA.purple(txt),
  secondary: (txt) => DRACULA.pink(txt),
  success: (txt) => DRACULA.green(txt),
  warning: (txt) => DRACULA.orange(txt),
  error: (txt) => DRACULA.red(txt),
  info: (txt) => DRACULA.cyan(txt),
  muted: (txt) => DRACULA.comment(txt),
  title: (txt) => pc.bgMagentaBright(pc.bold(pc.whiteBright(` ${txt} `))),
  subtitle: (txt) => pc.dim(pc.white(txt)),
  color: (txt) => DRACULA.foreground(txt),
  backgroundColor: (txt) => DRACULA.background(` ${txt} `),
  bold: (txt) => pc.bold(txt),
  italic: (txt) => pc.italic(txt),
  textDecoration: (txt) => pc.underline(txt),
  textTransform: (txt) => txt.toUpperCase(),
};

/**
 * Dracula Light (Inverse Variant)
 * Adapts high-contrast elements for white/light terminal backgrounds.
 */
const LIGHT_THEME: DefaultTheme = {
  primary: (txt) => pc.magenta(txt),
  secondary: (txt) => pc.magentaBright(txt),
  success: (txt) => pc.green(txt),
  warning: (txt) => pc.yellow(txt),
  error: (txt) => pc.red(txt),
  info: (txt) => pc.cyan(txt),
  muted: (txt) => pc.blackBright(txt),
  title: (txt) => pc.bgMagenta(pc.bold(pc.whiteBright(` ${txt} `))),
  subtitle: (txt) => pc.dim(pc.white(txt)),
  color: (txt) => pc.black(txt),
  backgroundColor: (txt) => pc.bgWhite(` ${txt} `),
  bold: (txt) => pc.bold(txt),
  italic: (txt) => pc.italic(txt),
  textDecoration: (txt) => pc.underline(txt),
  textTransform: (txt) => txt.toUpperCase(),
};

/**
 * TYPES
 * Inspired by CSS properties.
 */
export type ThemeMode = 'dark' | 'light';
export type Theme = ChainableTheme & string;

export interface DefaultTheme {
  // CSS Semantic Utilities
  primary(text: string): string; // Accent/Brand color
  secondary(text: string): string; // Supporting color
  success(text: string): string; // Positive states
  warning(text: string): string; // Cautionary states
  error(text: string): string; // Destructive states
  info(text: string): string; // Neutral information
  muted(text: string): string; // De-emphasized metadata

  // Typography Styles
  title(text: string): string; // Primary bg + Bold White text
  subtitle(text: string): string; // Dimmed White text

  // CSS Styles
  color(text: string): string; // color (Foreground body text)
  backgroundColor(text: string): string; // background-color (Block wrapper)
  bold(text: string): string; // font-weight: bold
  italic(text: string): string; // font-style: italic
  textDecoration(text: string): string; // text-decoration: underline
  textTransform(text: string): string; // text-transform: uppercase (Simulated)
}

export type DefaultThemeKeys = Array<keyof DefaultTheme>;

/**
 * THEME INTERFACE
 * Hybrid structure matching
 * - string
 * - direct text constructor function
 * - recursive chain attributes
 */
export interface ChainableTheme {
  (txt?: string): ChainableTheme & string;
  // CSS Semantic Utilities
  primary: ChainableTheme & string;
  secondary: ChainableTheme & string;
  success: ChainableTheme & string;
  warning: ChainableTheme & string;
  error: ChainableTheme & string;
  info: ChainableTheme & string;
  muted: ChainableTheme & string;
  // Typography Styles
  title: ChainableTheme & string;
  subtitle: ChainableTheme & string;
  // CSS Styles
  color: ChainableTheme & string;
  backgroundColor: ChainableTheme & string;
  bold: ChainableTheme & string;
  italic: ChainableTheme & string;
  textDecoration: ChainableTheme & string;
  textTransform: ChainableTheme & string;
  toString(): string;
}

// Concrete array list to type guard the Proxy lookup property cleanly
const VALID_KEYS: DefaultThemeKeys = [
  'primary', 'secondary', 'success', 'warning', 'error', 'info', 'muted',
  'title', 'subtitle', 'color', 'backgroundColor', 'bold', 'italic',
  'textDecoration', 'textTransform'
];

// Global proxy helper
export const useTheme = (activeTheme: DefaultTheme, initialTxt: string = '', pendingStyles: DefaultThemeKeys = []) => {
  // Computes styles on the text whenever string conversion is triggered or new text is supplied
  const compile = (textToStyle: string): string => {
    return pendingStyles.reduce((result, styleKey) => activeTheme[styleKey](result), textToStyle);
  };

  // The handler function allows calling the chain instance like a function: theme('TEXT') or theme.bold('TEXT')
  const targetFunction = (txt?: string) => {
    const textToProcess = txt || initialTxt || '';
    const compiledText = compile(textToProcess);
    // Return a fresh theme node so operations can keep chaining off the outcome
    return useTheme(activeTheme, compiledText, []);
  };

  return new Proxy(targetFunction, {
    get(_, prop) {
      // These symbols/methods intercept conversions to primitives (strings) automatically
      if (prop === 'toString' || prop === 'valueOf' || prop === Symbol.toPrimitive) {
        return () => compile(initialTxt);
      }

      // Type-safe guard to ensure the parameter matches a key on our active theme before executing it
      if (typeof prop === 'string' && VALID_KEYS.includes(prop as keyof DefaultTheme)) {
        const styleKey = prop as keyof DefaultTheme;

        // If text is already present, apply style eagerly; otherwise, stack it up
        if (initialTxt) {
          const nextText = activeTheme[styleKey](initialTxt);
          return useTheme(activeTheme, nextText, pendingStyles);
        }

        return useTheme(activeTheme, initialTxt, [...pendingStyles, styleKey]);
      }

      return undefined;
    }
  }) as unknown as ChainableTheme & string;
};

// Global factory helpers
export const DarkTheme = useTheme(DARK_THEME);
export const LightTheme = useTheme(LIGHT_THEME);
