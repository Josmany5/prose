// ============================================
// NOTED - Design System
// Monospace/Terminal Aesthetic
// ============================================

export const FONTS = {
  // Using system monospace fonts
  regular: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '400' as const,
  },
  medium: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '500' as const,
  },
  bold: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '700' as const,
  },
  light: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: '300' as const,
  },
};

export const FONT_SIZES = {
  title: 22,
  subtitle: 18,
  header: 24,
  subheader: 20,
  body: 15,        // Entry content text stays the same
  bodyLarge: 18,   // For note titles and larger UI text
  timestamp: 15,
  meta: 14,
  small: 13,
  tiny: 11,
};

// ============================================
// Color Palette
// ============================================

export const COLORS = {
  // Light Mode
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#E0E0E0',
    text: '#1A1A1A',
    textSecondary: '#666666',
    accent: '#0066CC',
    accentLight: '#E6F2FF',
  },

  // Dark Mode
  dark: {
    background: '#1A1A1A',
    surface: '#2A2A2A',
    border: '#3A3A3A',
    text: '#E0E0E0',
    textSecondary: '#999999',
    accent: '#4A9EFF',
    accentLight: '#1A3A5A',
  },

  // Status Colors (same for both modes)
  urgency: {
    high: '#FF4444',
    medium: '#FFAA00',
    low: '#44CC44',
    none: '#999999',
  },

  // Pipeline Colors
  pipeline: {
    capture: '#9B59B6',   // 💭 Purple
    develop: '#3498DB',   // 🌱 Blue
    build: '#F39C12',     // 🔨 Orange
    execute: '#E74C3C',   // 🚀 Red
    complete: '#2ECC71',  // ✅ Green
  },

  // Importance (Stars)
  importance: {
    filled: '#FFD700',    // Gold
    empty: '#CCCCCC',
  },
};

// ============================================
// Spacing
// ============================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================
// Border Radius
// ============================================

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// ============================================
// Shadows (minimal for clean aesthetic)
// ============================================

export const SHADOWS = {
  light: {
    small: {
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      elevation: 1,
    },
    medium: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
      elevation: 2,
    },
  },
  dark: {
    small: {
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
      elevation: 1,
    },
    medium: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
      elevation: 2,
    },
  },
};

// ============================================
// Emoji Icons
// ============================================

export const ICONS = {
  urgency: {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
    none: '⚪',
  },
  pipeline: {
    capture: '💭',
    develop: '🌱',
    build: '🔨',
    execute: '🚀',
    complete: '✅',
  },
  general: {
    calendar: '📅',
    clock: '🕐',
    note: '📄',
    folder: '📁',
    link: '🔗',
    star: '⭐',
    starEmpty: '☆',
    deepwork: '⚡',
    location: '📍',
    voice: '🎤',
    search: '🔍',
    menu: '☰',
    back: '←',
    forward: '→',
    close: '×',
    add: '+',
    edit: '✏️',
    delete: '🗑️',
    navigator: '⌚',
  },
};

// ============================================
// Helper Functions
// ============================================

import { Platform } from 'react-native';

export const getThemedColors = (isDark: boolean) => {
  return isDark ? COLORS.dark : COLORS.light;
};

export const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'high':
      return COLORS.urgency.high;
    case 'medium':
      return COLORS.urgency.medium;
    case 'low':
      return COLORS.urgency.low;
    default:
      return COLORS.urgency.none;
  }
};

export const getPipelineColor = (stage: string) => {
  switch (stage) {
    case 'capture':
      return COLORS.pipeline.capture;
    case 'develop':
      return COLORS.pipeline.develop;
    case 'build':
      return COLORS.pipeline.build;
    case 'execute':
      return COLORS.pipeline.execute;
    case 'complete':
      return COLORS.pipeline.complete;
    default:
      return COLORS.urgency.none;
  }
};

export const getPipelineEmoji = (stage: string) => {
  switch (stage) {
    case 'capture':
      return ICONS.pipeline.capture;
    case 'develop':
      return ICONS.pipeline.develop;
    case 'build':
      return ICONS.pipeline.build;
    case 'execute':
      return ICONS.pipeline.execute;
    case 'complete':
      return ICONS.pipeline.complete;
    default:
      return '';
  }
};
