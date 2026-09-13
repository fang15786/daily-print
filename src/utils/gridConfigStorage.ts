import type { GridStyleConfig } from '../types';

/**
 * 系统出厂默认格子配置（默认纯方格，14mm紧凑排版）
 */
export const FACTORY_GRID_CONFIG: GridStyleConfig = {
  gridType: 'fang', // 默认纯方格
  gridSizeMm: 14,
  gridLineColor: '#e06a55',
  gridLineWidth: 1,
  innerLineStyle: 'dashed',
  charColor: '#000000',
  tracingColor: 'gray',
  tracingOpacity: 0.45,
  strokePracticeStyle: 'light_tracing',
  showPinyin: false,
  pinyinStyle: 'four_lines',
  showMeta: true
};

export const DEFAULT_GRID_CONFIG_STORAGE_KEY = 'daily_print_default_grid_config';

/**
 * 获取当前生效的默认格子配置
 * 优先读取用户在 localStorage 中保存的偏好，若未设置则返回系统出厂纯方格
 */
export function getDefaultGridConfig(): GridStyleConfig {
  if (typeof localStorage === 'undefined') {
    return { ...FACTORY_GRID_CONFIG };
  }
  try {
    const raw = localStorage.getItem(DEFAULT_GRID_CONFIG_STORAGE_KEY);
    if (!raw) {
      return { ...FACTORY_GRID_CONFIG };
    }
    const parsed = JSON.parse(raw);
    return {
      ...FACTORY_GRID_CONFIG,
      ...parsed
    };
  } catch (e) {
    console.error('读取默认格子配置异常:', e);
    return { ...FACTORY_GRID_CONFIG };
  }
}

/**
 * 将当前指定的格子配置保存为默认格子
 */
export function saveDefaultGridConfig(config: GridStyleConfig): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEFAULT_GRID_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('保存默认格子配置异常:', e);
  }
}

/**
 * 恢复系统出厂默认格子配置（纯方格）
 */
export function restoreFactoryGridConfig(): GridStyleConfig {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(DEFAULT_GRID_CONFIG_STORAGE_KEY);
    } catch (e) {
      console.error('清除默认格子配置异常:', e);
    }
  }
  return { ...FACTORY_GRID_CONFIG };
}

/**
 * 检查用户是否自定义了默认格子
 */
export function hasCustomDefaultGrid(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem(DEFAULT_GRID_CONFIG_STORAGE_KEY);
}
