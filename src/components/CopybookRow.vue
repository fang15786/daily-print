<script setup lang="ts">
import { computed } from 'vue';
import type { CharacterItem, GridStyleConfig } from '../types';
import GridSvg from './GridSvg.vue';
import PinyinRowSvg from './PinyinRowSvg.vue';

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

  // 第 1 格：完整范字
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

// 计算整排四线三格拼音槽数据
const pinyinSlots = computed(() => {
  if (!props.gridConfig.showPinyin) return [];

  if (props.mode === 'stroke_order') {
    const py = props.charItem?.pinyin || '';
    const cells = strokeStepCells.value;
    return cells.map((cell, idx) => {
      if (idx === 0) {
        // 范字：黑色标准拼音
        return { pinyin: py, isTracing: false, isBlank: false };
      } else if (cell.isTracing) {
        // 描红格上方：浅色描红拼音，供学生描读
        return { pinyin: py, isTracing: true, isBlank: false };
      } else {
        // 笔顺步骤与空白练字格：干净的标准四线三格，供学生自写拼音
        return { pinyin: '', isTracing: false, isBlank: false };
      }
    });
  } else if (props.mode === 'continuous') {
    return (props.continuousCells || []).map((cell) => ({
      pinyin: cell.pinyin,
      isTracing: cell.isTracing,
      isBlank: cell.isBlank
    }));
  }

  return [];
});
</script>

<template>
  <div class="copybook-row">
    <!-- 整排贯穿的标准拼音四线三格（与下方田字格严格对应） -->
    <PinyinRowSvg
      v-if="gridConfig.showPinyin"
      :cols-count="colsCount"
      :col-width-mm="gridConfig.gridSizeMm"
      :grid-line-color="gridConfig.gridLineColor"
      :items="pinyinSlots"
      :char-color="gridConfig.charColor"
      :tracing-color="gridConfig.tracingColor"
    />

    <!-- 下方汉字田字格/米字格行 -->
    <div class="cells-flex">
      <!-- 笔顺分步模式 -->
      <template v-if="mode === 'stroke_order'">
        <GridSvg
          v-for="(cell, cIdx) in strokeStepCells"
          :key="cIdx"
          :grid-type="gridConfig.gridType"
          :grid-line-color="gridConfig.gridLineColor"
          :inner-line-style="gridConfig.innerLineStyle"
          :size-mm="gridConfig.gridSizeMm"
          :show-pinyin="false"
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
      </template>

      <!-- 连续/词语/古诗模式 -->
      <template v-else-if="mode === 'continuous'">
        <GridSvg
          v-for="(cell, cIdx) in (continuousCells || [])"
          :key="cIdx"
          :grid-type="gridConfig.gridType"
          :grid-line-color="gridConfig.gridLineColor"
          :inner-line-style="gridConfig.innerLineStyle"
          :size-mm="gridConfig.gridSizeMm"
          :show-pinyin="false"
          :strokes="cell.strokes"
          :active-stroke-count="-1"
          :is-tracing="cell.isTracing"
          :is-blank="cell.isBlank"
          :char-fallback="cell.char"
          :char-color="gridConfig.charColor"
          :tracing-color="gridConfig.tracingColor"
          :step-tag="cell.isModel ? '范' : ''"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.copybook-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.cells-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0;
}
</style>
