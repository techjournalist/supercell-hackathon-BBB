// UI Constants - responsive styling and layout values
// Call getUIConstants(width, height) to get values scaled for the current screen

import { isMobile } from './MobileUtils.js';

export function getUIConstants(width, height) {
  const mobile = isMobile() && width < 1000;
  const short = height < 500; // iPhone XR landscape is ~414px tall

  return {
    // Top bar
    TOP_BAR_HEIGHT: mobile ? (short ? 44 : 56) : 70,
    TOP_BAR_BG_COLOR: 0x000000,
    TOP_BAR_BG_ALPHA: 0.8,

    // Button sizing
    BUTTON_SIZE: mobile ? (short ? 38 : 44) : 50,
    BUTTON_SPACING: mobile ? 5 : 8,
    BUTTON_PADDING: mobile ? 12 : 20,

    // Typography - all responsive
    FONTS: {
      TITLE: {
        fontSize: `${Math.max(24, Math.min(width * 0.05, 72))}px`,
        fontFamily: 'Press Start 2P',
      },
      BUTTON: {
        fontSize: `${Math.max(10, Math.min(width * 0.014, 14))}px`,
        fontFamily: 'Press Start 2P',
      },
      RESOURCE: {
        fontSize: `${Math.max(11, Math.min(width * 0.016, 16))}px`,
        fontFamily: 'Press Start 2P',
      },
      COST: {
        fontSize: `${Math.max(8, Math.min(width * 0.01, 10))}px`,
        fontFamily: 'Press Start 2P',
      },
      HOTKEY: {
        fontSize: `${Math.max(7, Math.min(width * 0.009, 9))}px`,
        fontFamily: 'Press Start 2P',
      },
      COOLDOWN: {
        fontSize: `${Math.max(12, Math.min(width * 0.018, 18))}px`,
        fontFamily: 'Press Start 2P',
      },
      TOOLTIP: {
        fontSize: `${Math.max(9, Math.min(width * 0.012, 12))}px`,
        fontFamily: 'Press Start 2P',
      },
      LABEL: {
        fontSize: `${Math.max(9, Math.min(width * 0.013, 13))}px`,
        fontFamily: 'Press Start 2P',
      },
    },

    // Minimap - responsive
    MINIMAP: {
      WIDTH: Math.min(220, width * 0.22),
      HEIGHT: Math.min(35, height * 0.07),
      BOTTOM_MARGIN: mobile ? 10 : 20,
      RIGHT_MARGIN: mobile ? 10 : 20,
      BG_COLOR: 0x000000,
      BG_ALPHA: 0.6,
      BORDER_COLOR: 0x444444,
      BORDER_WIDTH: 2,
    },

    // Safe area margins
    SAFE_AREA: {
      TOP: 0.05,
      BOTTOM: 0.04,
      LEFT: 0.03,
      RIGHT: 0.03,
    },
  };
}

// Keep static color constants (these don't need to be responsive)
export const UI_COLORS = {
  BUTTON_BG: 0x2C2C2C,
  BUTTON_BG_HOVER: 0x3C3C3C,
  BUTTON_BORDER_ROMAN: 0xDC143C,
  BUTTON_BORDER_ALIEN: 0x9C27B0,
  GOLD: 0xFFD700,
  GOLD_BORDER: 0xFF8C00,
  MANA: 0x00FFFF,
  MANA_BORDER: 0x0099CC,
  HEALTH_CRITICAL: 0xFF3333,
  HEALTH_WARNING: 0xFFAA33,
  HEALTH_NORMAL: 0x33FF33,
};

// Legacy: keep the old export for backwards compatibility with UIManager.js
export const UI_CONSTANTS = {
  COLORS: UI_COLORS,
};
