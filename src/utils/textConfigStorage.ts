/**
 * 系统出厂默认文本（统编版小学语文一年级上册核心生字，共 19 字，恰好完整排满一页 14mm 方格）
 * 包含：识字一《天地人你我他》、识字二《一二三四五上下》、识字四《日月水火山石》
 */
export const FACTORY_DEFAULT_TEXT = '天地人你我他一二三四五上下日月水火山石';

export const DEFAULT_INPUT_TEXT_STORAGE_KEY = 'daily_print_default_input_text';

/**
 * 获取当前生效的默认打开文字
 * 优先读取用户在 localStorage 中保存的自定义偏好，若未设置则返回系统出厂一年级常用字
 */
export function getDefaultInputText(): string {
  if (typeof localStorage === 'undefined') {
    return FACTORY_DEFAULT_TEXT;
  }
  try {
    const saved = localStorage.getItem(DEFAULT_INPUT_TEXT_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
    return FACTORY_DEFAULT_TEXT;
  } catch (e) {
    console.error('读取默认文字配置异常:', e);
    return FACTORY_DEFAULT_TEXT;
  }
}

/**
 * 将当前文本保存为默认打开文字
 */
export function saveDefaultInputText(text: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEFAULT_INPUT_TEXT_STORAGE_KEY, text);
  } catch (e) {
    console.error('保存默认文字配置异常:', e);
  }
}

/**
 * 恢复系统出厂默认文字（一年级常用字）
 */
export function restoreFactoryInputText(): string {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(DEFAULT_INPUT_TEXT_STORAGE_KEY);
    } catch (e) {
      console.error('清除默认文字配置异常:', e);
    }
  }
  return FACTORY_DEFAULT_TEXT;
}

/**
 * 检查用户是否自定义了默认打开文字
 */
export function hasCustomDefaultInputText(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem(DEFAULT_INPUT_TEXT_STORAGE_KEY);
}
