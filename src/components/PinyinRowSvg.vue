<script setup lang="ts">
import { computed } from 'vue';
import type { TracingColor } from '../types';

interface PinyinSlot {
  pinyin: string;
  isTracing?: boolean;
  isBlank?: boolean;
}

const props = withDefaults(
  defineProps<{
    colsCount: number;
    colWidthMm: number;
    gridLineColor?: string;
    items: PinyinSlot[];
    charColor?: string;
    tracingColor?: TracingColor;
  }>(),
  {
    gridLineColor: '#e06a55',
    charColor: '#1a1a1a',
    tracingColor: 'gray',
    items: () => []
  }
);

// 标准小学语文拼音四线三格高度（通常约为田字格宽度的 55%，18mm 田字格对应约 10mm 拼音格）
const pinyinHeightMm = computed(() => {
  return Math.round(props.colWidthMm * 0.55 * 10) / 10;
});

// SVG 总宽度坐标系
const totalSvgWidth = computed(() => props.colsCount * 100);

// 计算描红文字样式
const tracingStyle = computed(() => {
  switch (props.tracingColor) {
    case 'cinnabar':
      return { fill: '#c83c23', opacity: 0.35 };
    case 'ink_light':
      return { fill: '#334155', opacity: 0.3 };
    case 'gray':
    default:
      return { fill: '#94a3b8', opacity: 0.45 };
  }
});
</script>

<template>
  <div
    class="pinyin-row-wrapper"
    :style="{
      width: `${colsCount * colWidthMm}mm`,
      height: `${pinyinHeightMm}mm`
    }"
  >
    <svg
      :viewBox="`0 0 ${totalSvgWidth} 60`"
      preserveAspectRatio="none"
      class="pinyin-row-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- 四条标准基准线（严格 1:1:1 三等分） -->
      <!-- 第一线（上边界） -->
      <line
        x1="0"
        y1="6"
        :x2="totalSvgWidth"
        y2="6"
        :stroke="gridLineColor"
        stroke-width="1.4"
      />
      <!-- 第二线（中格上线） -->
      <line
        x1="0"
        y1="22"
        :x2="totalSvgWidth"
        y2="22"
        :stroke="gridLineColor"
        stroke-width="1.0"
        stroke-dasharray="3,2"
        opacity="0.8"
      />
      <!-- 第三线（基准线 / 中格下线） -->
      <line
        x1="0"
        y1="38"
        :x2="totalSvgWidth"
        y2="38"
        :stroke="gridLineColor"
        stroke-width="1.0"
        stroke-dasharray="3,2"
        opacity="0.8"
      />
      <!-- 第四线（下边界） -->
      <line
        x1="0"
        y1="54"
        :x2="totalSvgWidth"
        y2="54"
        :stroke="gridLineColor"
        stroke-width="1.4"
      />

      <!-- 左右两侧封口线 -->
      <line
        x1="0"
        y1="6"
        x2="0"
        y2="54"
        :stroke="gridLineColor"
        stroke-width="1.4"
      />
      <line
        :x1="totalSvgWidth"
        y1="6"
        :x2="totalSvgWidth"
        y2="54"
        :stroke="gridLineColor"
        stroke-width="1.4"
      />

      <!-- 列与列之间的垂直辅助分割虚线（与下方田字格严格对应） -->
      <line
        v-for="colIdx in colsCount - 1"
        :key="`divider-${colIdx}`"
        :x1="colIdx * 100"
        y1="6"
        :x2="colIdx * 100"
        y2="54"
        :stroke="gridLineColor"
        stroke-width="0.8"
        stroke-dasharray="2,2"
        opacity="0.45"
      />

      <!-- 各列拼音文字渲染（基准线严格落于 y=38 的第三线） -->
      <template v-for="(slot, idx) in items" :key="`py-${idx}`">
        <text
          v-if="!slot.isBlank && slot.pinyin"
          :x="(idx + 0.5) * 100"
          y="38"
          text-anchor="middle"
          class="pinyin-svg-text"
          :fill="slot.isTracing ? tracingStyle.fill : charColor"
          :opacity="slot.isTracing ? tracingStyle.opacity : 1"
        >
          {{ slot.pinyin }}
        </text>
      </template>
    </svg>
  </div>
</template>

<style scoped>
.pinyin-row-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  user-select: none;
  overflow: hidden;
  margin-bottom: -0.2mm; /* 与下方田字格边框自然贴合 */
}

.pinyin-row-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.pinyin-svg-text {
  font-family: 'Century Gothic', 'KaiTi', 'STKaiti', 'Arial', sans-serif;
  font-size: 23px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

@media print {
  .pinyin-row-wrapper {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
