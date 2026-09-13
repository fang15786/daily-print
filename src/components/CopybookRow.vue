<script setup lang="ts">
import { computed } from 'vue';
import type { CharacterItem, GridStyleConfig } from '../types';
import GridSvg from './GridSvg.vue';

const props = defineProps<{
  mode: 'stroke_order' | 'continuous' | 'stroke_basic';
  charItem?: CharacterItem;
  // 连续模式下的单元格列表
  continuousCells?: {
    char: string;
    pinyin: string;
    strokes?: string[];
    isTracing: boolean;
    isBlank: boolean;
    isModel?: boolean;
  }[];
  colsCount: number;
  gridConfig: GridStyleConfig;
}>();

// 笔顺分解模式下的单元格生成
const strokeStepCells = computed(() => {
  if (props.mode !== 'stroke_order' || !props.charItem) return [];

  const item = props.charItem;
  const strokes = item.strokes || [];
  const strokeCount = strokes.length;
  const cells: {
    strokes?: string[];
    activeStrokeCount: number;
    highlightLatest: boolean;
    isTracing: boolean;
    isBlank: boolean;
    stepTag: string;
    charFallback?: string;
  }[] = [];

  // 第 1 格：完整范字（带拼音）
  cells.push({
    strokes,
    activeStrokeCount: -1,
    highlightLatest: false,
    isTracing: false,
    isBlank: false,
    stepTag: '范',
    charFallback: item.char
  });

  // 接下来分步展示笔画：第 1 笔，第 1+2 笔，一直到第 N 笔
  if (strokeCount > 0) {
    const maxSteps = Math.min(strokeCount, props.colsCount - 1);
    for (let i = 1; i <= maxSteps; i++) {
      cells.push({
        strokes,
        activeStrokeCount: i,
        highlightLatest: true,
        isTracing: false,
        isBlank: false,
        stepTag: `${i}`,
        charFallback: item.char
      });
    }
  }

  // 剩余格子分配：先给描红格，再给空白格
  const remaining = props.colsCount - cells.length;
  if (remaining > 0) {
    const tracingCount = Math.max(1, Math.floor(remaining / 2));
    const blankCount = remaining - tracingCount;

    for (let i = 0; i < tracingCount; i++) {
      cells.push({
        strokes,
        activeStrokeCount: -1,
        highlightLatest: false,
        isTracing: true,
        isBlank: false,
        stepTag: '',
        charFallback: item.char
      });
    }

    for (let i = 0; i < blankCount; i++) {
      cells.push({
        strokes: [],
        activeStrokeCount: 0,
        highlightLatest: false,
        isTracing: false,
        isBlank: true,
        stepTag: ''
      });
    }
  }

  return cells.slice(0, props.colsCount);
});
</script>

<template>
  <div class="copybook-row">
    <!-- 笔顺分步模式 -->
    <template v-if="mode === 'stroke_order'">
      <div class="cells-flex">
        <GridSvg
          v-for="(cell, cIdx) in strokeStepCells"
          :key="cIdx"
          :grid-type="gridConfig.gridType"
          :grid-line-color="gridConfig.gridLineColor"
          :inner-line-style="gridConfig.innerLineStyle"
          :size-mm="gridConfig.gridSizeMm"
          :show-pinyin="gridConfig.showPinyin && cIdx === 0"
          :pinyin="cIdx === 0 && charItem ? charItem.pinyin : ''"
          :pinyin-style="gridConfig.pinyinStyle"
          :strokes="cell.strokes"
          :active-stroke-count="cell.activeStrokeCount"
          :highlight-latest="cell.highlightLatest"
          :is-tracing="cell.isTracing"
          :is-blank="cell.isBlank"
          :char-fallback="cell.charFallback"
          :char-color="gridConfig.charColor"
          :tracing-color="gridConfig.tracingColor"
          :step-tag="cell.stepTag"
        />
      </div>
    </template>

    <!-- 连续/词语/古诗模式 -->
    <template v-else-if="mode === 'continuous'">
      <div class="cells-flex">
        <GridSvg
          v-for="(cell, cIdx) in (continuousCells || [])"
          :key="cIdx"
          :grid-type="gridConfig.gridType"
          :grid-line-color="gridConfig.gridLineColor"
          :inner-line-style="gridConfig.innerLineStyle"
          :size-mm="gridConfig.gridSizeMm"
          :show-pinyin="gridConfig.showPinyin && !cell.isBlank"
          :pinyin="cell.pinyin"
          :pinyin-style="gridConfig.pinyinStyle"
          :strokes="cell.strokes"
          :active-stroke-count="-1"
          :is-tracing="cell.isTracing"
          :is-blank="cell.isBlank"
          :char-fallback="cell.char"
          :char-color="gridConfig.charColor"
          :tracing-color="gridConfig.tracingColor"
          :step-tag="cell.isModel ? '范' : ''"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.copybook-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.cells-flex {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  gap: 0;
}
</style>
