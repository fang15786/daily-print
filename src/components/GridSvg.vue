<script setup lang="ts">
import { computed } from 'vue';
import type { GridType, TracingColor } from '../types';
import { getCharTransform } from '../utils/strokeService';

const props = withDefaults(
  defineProps<{
    gridType?: GridType;
    gridLineColor?: string;
    innerLineStyle?: 'dashed' | 'dotted' | 'solid';
    pinyin?: string;
    showPinyin?: boolean;
    pinyinStyle?: 'four_lines' | 'clean';
    sizeMm?: number;
    // 字符内容渲染
    strokes?: string[]; // 汉字完整笔画
    activeStrokeCount?: number; // 当前步展示前 N 笔
    highlightLatest?: boolean; // 最新一笔标红
    isTracing?: boolean; // 是否是描红模式（浅色）
    isBlank?: boolean; // 是否为空白格
    charFallback?: string; // 若无 SVG 笔画，后备使用的楷体文字
    charColor?: string;
    tracingColor?: TracingColor;
    stepTag?: string; // 步骤标识，如 "1" 或 "范"
  }>(),
  {
    gridType: 'fang',
    gridLineColor: '#e06a55',
    innerLineStyle: 'dashed',
    pinyin: '',
    showPinyin: false,
    pinyinStyle: 'four_lines',
    sizeMm: 18,
    strokes: () => [],
    activeStrokeCount: -1, // -1 表示全部展示
    highlightLatest: false,
    isTracing: false,
    isBlank: false,
    charFallback: '',
    charColor: '#1a1a1a',
    tracingColor: 'gray',
    stepTag: ''
  }
);

const svgTransform = computed(() => getCharTransform(1024, 100));

// 确定可见笔画
const visibleStrokes = computed(() => {
  if (props.isBlank) return [];
  if (!props.strokes || props.strokes.length === 0) return [];
  if (props.activeStrokeCount < 0 || props.activeStrokeCount >= props.strokes.length) {
    return props.strokes;
  }
  return props.strokes.slice(0, props.activeStrokeCount);
});

// 计算描红颜色与透明度
const strokeColorStyle = computed(() => {
  if (props.isTracing) {
    switch (props.tracingColor) {
      case 'cinnabar':
        return { fill: '#c83c23', opacity: 0.32 };
      case 'ink_light':
        return { fill: '#334155', opacity: 0.28 };
      case 'gray':
      default:
        return { fill: '#94a3b8', opacity: 0.45 };
    }
  }
  return { fill: props.charColor, opacity: 1 };
});

// 虚线样式计算
const dashArray = computed(() => {
  if (props.innerLineStyle === 'dotted') return '12,16';
  if (props.innerLineStyle === 'dashed') return '24,20';
  return 'none';
});
</script>

<template>
  <div
    class="grid-cell-container"
    :style="{
      width: `${sizeMm}mm`,
      minWidth: `${sizeMm}mm`
    }"
  >

    <!-- 核心田字格/米字格 SVG -->
    <div
      class="grid-square"
      :style="{
        height: `${sizeMm}mm`,
        width: `${sizeMm}mm`
      }"
    >
      <svg
        viewBox="0 0 1024 1024"
        class="grid-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 背景外边框 -->
        <rect
          x="12"
          y="12"
          width="1000"
          height="1000"
          fill="none"
          :stroke="gridLineColor"
          stroke-width="24"
        />

        <!-- 内部辅助线 -->
        <!-- 田字格基础线 (十字准星) -->
        <g v-if="gridType === 'tian' || gridType === 'mi'" :stroke="gridLineColor" stroke-width="12" :stroke-dasharray="dashArray" opacity="0.75">
          <line x1="512" y1="12" x2="512" y2="1012" />
          <line x1="12" y1="512" x2="1012" y2="512" />
        </g>

        <!-- 米字格对角线 -->
        <g v-if="gridType === 'mi'" :stroke="gridLineColor" stroke-width="10" :stroke-dasharray="dashArray" opacity="0.65">
          <line x1="12" y1="12" x2="1012" y2="1012" />
          <line x1="1012" y1="12" x2="12" y2="1012" />
        </g>

        <!-- 回宫格 (内回字方框) -->
        <g v-if="gridType === 'hui'" :stroke="gridLineColor" stroke-width="12" :stroke-dasharray="dashArray" opacity="0.8">
          <rect x="256" y="256" width="512" height="512" fill="none" />
        </g>

        <!-- 九宫格 (井字线) -->
        <g v-if="gridType === 'jiu'" :stroke="gridLineColor" stroke-width="12" :stroke-dasharray="dashArray" opacity="0.75">
          <line x1="341" y1="12" x2="341" y2="1012" />
          <line x1="683" y1="12" x2="683" y2="1012" />
          <line x1="12" y1="341" x2="1012" y2="341" />
          <line x1="12" y1="683" x2="1012" y2="683" />
        </g>

        <!-- 汉字笔画 SVG 渲染 -->
        <g
          v-if="!isBlank && visibleStrokes.length > 0"
          :transform="svgTransform"
        >
          <path
            v-for="(pathD, idx) in visibleStrokes"
            :key="idx"
            :d="pathD"
            :fill="
              !isTracing && highlightLatest && idx === visibleStrokes.length - 1
                ? '#c83c23'
                : strokeColorStyle.fill
            "
            :opacity="
              !isTracing && highlightLatest && idx === visibleStrokes.length - 1
                ? 1
                : strokeColorStyle.opacity
            "
          />
        </g>

        <!-- 汉字后备渲染（如果矢量笔画尚未就绪） -->
        <text
          v-else-if="!isBlank && charFallback"
          x="512"
          y="680"
          text-anchor="middle"
          class="fallback-font"
          :fill="strokeColorStyle.fill"
          :opacity="strokeColorStyle.opacity"
        >
          {{ charFallback }}
        </text>

        <!-- 左上角步骤角标 -->
        <text
          v-if="stepTag"
          x="48"
          y="100"
          class="step-badge"
          fill="#94a3b8"
          font-size="68"
          font-family="system-ui, sans-serif"
          opacity="0.85"
        >
          {{ stepTag }}
        </text>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.grid-cell-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  box-sizing: border-box;
}


.grid-square {
  position: relative;
  box-sizing: border-box;
}

.grid-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.fallback-font {
  font-family: 'KaiTi', 'STKaiti', 'SimSun', 'Songti SC', serif;
  font-size: 680px;
  font-weight: 500;
}

@media print {
  .grid-cell-container {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
