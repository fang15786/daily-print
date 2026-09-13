import { pinyin } from 'pinyin-pro';

/**
 * 获取单个汉字的拼音（带声调符号）
 */
export function getCharPinyin(char: string): string {
  if (!char || !isChineseChar(char)) return '';
  return pinyin(char, { toneType: 'symbol' });
}

/**
 * 批量获取一串字符的拼音数组
 */
export function getTextPinyins(text: string): string[] {
  const chars = Array.from(text);
  return chars.map(c => isChineseChar(c) ? pinyin(c, { toneType: 'symbol' }) : '');
}

/**
 * 判断是否为汉字字符
 */
export function isChineseChar(str: string): boolean {
  return /^[\u4e00-\u9fa5]$/.test(str);
}

/**
 * 过滤文本，只保留有效汉字（去除非汉字标点，或者保留换行排版）
 */
export function extractChineseChars(text: string): string[] {
  return Array.from(text).filter(c => isChineseChar(c));
}
