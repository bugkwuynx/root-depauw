/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Well-being Growth Game — pastel green palette
export const GameColors = {
  bgLight: '#F3FAED',    // main screen background
  bgSection: '#E1F0E3',  // section / card background
  accent: '#83BF99',     // mid green — borders, subtle accents
  primary: '#5FAD89',    // darker green — buttons, badges
  textDark: '#2D5A3D',   // headings and body text
  textMid: '#6B9E82',    // secondary text
  white: '#FFFFFF',
  crossBg: '#FEF0F0',    // dismiss button background
  crossBorder: '#F9C8C8',
  crossText: '#E07070',
  coinBg: '#FFFBEB',
  coinBorder: '#FDE68A',
  coinText: '#92710A',
};

export const Colors = {
  light: {
    text: '#2D5A3D',
    background: '#F3FAED',
    tint: '#5FAD89',
    icon: '#83BF99',
    tabIconDefault: '#83BF99',
    tabIconSelected: '#5FAD89',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#83BF99',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#83BF99',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
