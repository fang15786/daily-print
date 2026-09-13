import HanziWriter from 'hanzi-writer';
import type { CharacterItem } from '../types';
import { getCharPinyin } from './pinyinService';

export interface HanziCharData {
  strokes: string[];
  medians: number[][][];
  radStrokes?: number[];
}

// 内存缓存
const charDataMemoryCache = new Map<string, HanziCharData>();
const loadingPromises = new Map<string, Promise<HanziCharData | null>>();

// LocalStorage 缓存前缀
const CACHE_PREFIX = 'hanzi_char_v1_';

/**
 * 获取 HanziWriter SVG 矢量缩放变换矩阵
 */
export function getCharTransform(viewSize = 1024, padding = 100): string {
  try {
    const transformInfo = HanziWriter.getScalingTransform(viewSize, viewSize, padding);
    return transformInfo.transform;
  } catch {
    return 'translate(100, 824) scale(0.804, -0.804)';
  }
}

/**
 * 带有本地持久化缓存 + 多 CDN 降级的汉字笔画数据加载器
 */
export async function loadCharacterStrokeData(char: string): Promise<HanziCharData | null> {
  if (!char) return null;

  // 1. 检查内存缓存
  if (charDataMemoryCache.has(char)) {
    return charDataMemoryCache.get(char)!;
  }

  // 2. 避免并发重复请求同一字符
  if (loadingPromises.has(char)) {
    return loadingPromises.get(char)!;
  }

  // 3. 检查浏览器持久化缓存（移动端离线支持关键）
  try {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(CACHE_PREFIX + char);
      if (cached) {
        const parsed = JSON.parse(cached) as HanziCharData;
        if (parsed.strokes && parsed.strokes.length > 0) {
          charDataMemoryCache.set(char, parsed);
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('读取本地缓存失败', e);
  }

  // 4. 多 CDN 容灾策略
  const cdnList = [
    `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`,
    `https://unpkg.com/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`,
    `https://cdn.bootcdn.net/ajax/libs/hanzi-writer-data/2.0.1/${encodeURIComponent(char)}.json`
  ];

  const fetchPromise = (async () => {
    for (const url of cdnList) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data: HanziCharData = await res.json();
          if (data && Array.isArray(data.strokes) && data.strokes.length > 0) {
            charDataMemoryCache.set(char, data);
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(CACHE_PREFIX + char, JSON.stringify(data));
              }
            } catch (e) {
              // 忽略 LocalStorage 容量超限错误
            }
            return data;
          }
        }
      } catch {
        // 尝试下一个 CDN
      }
    }
    return null;
  })();

  loadingPromises.set(char, fetchPromise);

  try {
    const result = await fetchPromise;
    return result;
  } finally {
    loadingPromises.delete(char);
  }
}

/**
 * 批量加载汉字笔画信息
 */
export async function batchLoadCharacters(chars: string[]): Promise<Map<string, CharacterItem>> {
  const result = new Map<string, CharacterItem>();
  const uniqueChars = Array.from(new Set(chars));

  await Promise.all(
    uniqueChars.map(async (char) => {
      const pinyin = getCharPinyin(char);
      try {
        const data = await loadCharacterStrokeData(char);
        if (data) {
          result.set(char, {
            char,
            pinyin,
            strokes: data.strokes,
            strokeCount: data.strokes.length,
            radStrokes: data.radStrokes,
            error: false
          } as CharacterItem);
        } else {
          result.set(char, {
            char,
            pinyin,
            strokes: [],
            strokeCount: 0,
            error: true
          });
        }
      } catch {
        result.set(char, {
          char,
          pinyin,
          strokes: [],
          strokeCount: 0,
          error: true
        });
      }
    })
  );

  return result;
}
