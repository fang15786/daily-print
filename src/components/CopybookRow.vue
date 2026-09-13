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

// 单元格数据计算（支持笔顺分步模式与全文完整笔画模式）
const rowCells = computed(() => {
  if (!props.charItem) return [];

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

  const isLightTracing = props.gridConfig.strokePracticeStyle !== 'solid_highlight';

  // 第 1 格：完整范字（默认使用浅色描红，避免上层黑色字体）
  cells.push({
    strokes,
    activeStrokeCount: -1,
    highlightLatest: false,
    isTracing: isLightTracing,
    isBlank: false,
    stepTag: '范',
    charFallback: item.char
  });

  if (props.mode === 'stroke_order') {
    // 笔顺分步模式：分步展示笔画（第 1 笔，第 1+2 笔，直到第 N 笔）
    if (strokeCount > 0) {
      const maxSteps = Math.min(strokeCount, props.colsCount - 1);
      for (let i = 1; i <= maxSteps; i++) {
        // 若总笔画数超过了当前行能容纳的最大步数，确保最后一个格子展示完整字形（所有笔画），不被腰斩
        const isLastStepCell = i === props.colsCount - 1 && strokeCount > props.colsCount - 1;
        cells.push({
          strokes,
          activeStrokeCount: isLastStepCell ? strokeCount : i,
          highlightLatest: !isLightTracing,
          isTracing: isLightTracing,
          isBlank: false,
          stepTag: isLastStepCell ? `${strokeCount}` : `${i}`,
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
  } else {
    // 全文/全笔画模式（全文和分步布局完全一样，只有笔画展示完整字形而不做拆解）
    // 剩余格子：前一半为完整字浅色描红，后一半为空白自写格
    const remaining = props.colsCount - 1;
    const tracingCount = Math.ceil(remaining / 2);
    const blankCount = remaining - tracingCount;

    for (let i = 0; i < tracingCount; i++) {
      cells.push({
        strokes,
        activeStrokeCount: -1, // 全部完整笔画
        highlightLatest: false,
        isTracing: true, // 浅色描红
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

  const py = props.charItem?.pinyin || '';
  const cells = rowCells.value;
  const isLightTracing = props.gridConfig.strokePracticeStyle !== 'solid_highlight';
  return cells.map((cell, idx) => {
    if (idx === 0) {
      // 范字拼音
      return { pinyin: py, isTracing: isLightTracing, isBlank: false };
    } else if (cell.isTracing) {
      // 描红格上方：浅色描红拼音，供学生描读
      return { pinyin: py, isTracing: true, isBlank: false };
    } else {
      // 空白练字格：干净的标准四线三格，供学生自写拼音
      return { pinyin: '', isTracing: false, isBlank: false };
    }
  });
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

    <!-- 下方汉字田字格/米字格行：格子紧密贴合无空隙 -->
    <div class="cells-flex">
      <GridSvg
        v-for="(cell, cIdx) in rowCells"
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
  justify-content: center;
  width: fit-content;
  margin: 0 auto;
  gap: 0;
}
</style>
