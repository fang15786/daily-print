import { pinyin } from 'pinyin-pro';

/**
 * 格式化为标准小学语文教材手写规范（将印刷体单字符 a 与 g 转为标准单层 ɑ 与单环 ɡ）
 */
export function formatStandardPinyin(py: string): string {
  if (!py) return '';
  return py.replace(/a/g, 'ɑ').replace(/g/g, 'ɡ');
}

/**
 * 获取单个汉字的拼音（带声调符号并转为教材规范拼音体）
 */
export function getCharPinyin(char: string): string {
  if (!char || !isChineseChar(char)) return '';
  const raw = pinyin(char, { toneType: 'symbol' });
  return formatStandardPinyin(raw);
}

/**
 * 批量获取一串字符的拼音数组
 */
export function getTextPinyins(text: string): string[] {
  const chars = Array.from(text);
  return chars.map(c => (isChineseChar(c) ? getCharPinyin(c) : ''));
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
