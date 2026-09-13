<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { CopybookMode, GridStyleConfig, HeaderFooterConfig, CharacterItem } from './types';
import { extractChineseChars } from './utils/pinyinService';
import { batchLoadCharacters } from './utils/strokeService';
import HeaderBar from './components/HeaderBar.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import A4Page from './components/A4Page.vue';
import CopybookRow from './components/CopybookRow.vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 模式
const mode = ref<CopybookMode>('stroke_order');

// 输入文本默认值（精选生字）
const inputText = ref('天地人你我他一二三四五上下');

// 缩放比例
const zoomLevel = ref(90);

// 移动端当前活动视图
const mobileActiveView = ref<'settings' | 'preview'>('settings');

// 加载状态
const isLoading = ref(false);

// 网格配置
const gridConfig = ref<GridStyleConfig>({
  gridType: 'mi',
  gridSizeMm: 14, // 默认精细 14mm (13字/行)
  gridLineColor: '#e06a55',
  gridLineWidth: 1,
  innerLineStyle: 'dashed',
  charColor: '#1a1a1a',
  tracingColor: 'cinnabar',
  tracingOpacity: 0.35,
  showPinyin: false,
  pinyinStyle: 'four_lines',
  showMeta: true
});

// 页眉页脚配置（默认不显示顶部标题栏、左侧装订线和底部寄语，纯净全纸排版）
const headerConfig = ref<HeaderFooterConfig>({
  showHeader: false,
  title: '汉字笔顺田字格描红帖',
  subTitle: '每日十分钟 · 规范汉字书写',
  showStudentInfo: false,
  showBindingGuide: false,
  showFooter: false,
  footerMotto: '端端正正写字，堂堂正正做人',
  showPageNumber: false
});

// 字符数据缓存
const loadedCharsMap = ref<Map<string, CharacterItem>>(new Map());

// 提取当前输入的有效汉字列表
const rawChineseChars = computed(() => {
  const list = extractChineseChars(inputText.value);
  return list.length > 0 ? list : ['永'];
});

// 异步加载笔画数据
async function loadStrokesForCurrentText() {
  if (rawChineseChars.value.length === 0) return;
  isLoading.value = true;
  try {
    const map = await batchLoadCharacters(rawChineseChars.value);
    loadedCharsMap.value = new Map([...loadedCharsMap.value, ...map]);
  } catch (e) {
    console.error('加载笔画数据出错', e);
  } finally {
    isLoading.value = false;
  }
}

// 监听输入文本变化防抖加载
let timer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => inputText.value,
  () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      loadStrokesForCurrentText();
    }, 400);
  },
  { immediate: true }
);

// 计算每行容纳的格子数量 (以 182mm 净宽计算，14mm 恰好容纳 13 格)
const colsCount = computed(() => {
  const size = gridConfig.value.gridSizeMm || 14;
  if (size <= 14) return 13;
  if (size <= 16) return 12;
  if (size >= 20) return 9;
  return 10;
});

// 计算每页最大容纳行数（根据是否开启页眉/页脚动态释放纸张高度空间，行间距已紧密贴合）
const rowsPerPage = computed(() => {
  const size = gridConfig.value.gridSizeMm || 14;
  const withPinyin = gridConfig.value.showPinyin;
  const rowHeightMm = withPinyin ? size * 1.55 : size;
  // A4 总高 297mm，基准上下边距约 26mm
  let availableHeight = 297 - 26;
  if (headerConfig.value.showHeader) availableHeight -= 28;
  if (headerConfig.value.showFooter || headerConfig.value.showPageNumber) availableHeight -= 15;
  return Math.max(4, Math.floor(availableHeight / rowHeightMm));
});

// 页面数据结构：模式 1（笔顺模式）分页
const strokeOrderPages = computed(() => {
  const chars = rawChineseChars.value;
  const perPage = rowsPerPage.value;
  const pages: CharacterItem[][] = [];

  for (let i = 0; i < chars.length; i += perPage) {
    const pageChars = chars.slice(i, i + perPage).map((c) => {
      return (
        loadedCharsMap.value.get(c) || {
          char: c,
          pinyin: '',
          strokes: [],
          strokeCount: 0
        }
      );
    });
    pages.push(pageChars);
  }

  return pages.length > 0 ? pages : [[]];
});

// 页面数据结构：模式 2（连续排版模式）分页
const continuousPages = computed(() => {
  const chars = rawChineseChars.value;
  const cols = colsCount.value;
  const rows = rowsPerPage.value;

  // 将字符切分成行，每行附带 1 行范字 + 1 行描红 + 1 行自写（经典三行临摹法）
  interface ContinuousCell {
    char: string;
    pinyin: string;
    strokes?: string[];
    isTracing: boolean;
    isBlank: boolean;
    isModel?: boolean;
  }

  const allRows: ContinuousCell[][] = [];

  // 按每 cols 个字切分输入内容
  for (let i = 0; i < chars.length; i += cols) {
    const slice = chars.slice(i, i + cols);

    // 行 1：范字
    const modelRow: ContinuousCell[] = [];
    // 行 2：描红
    const traceRow: ContinuousCell[] = [];
    // 行 3：自主练写空白格
    const blankRow: ContinuousCell[] = [];

    slice.forEach((char) => {
      const item = loadedCharsMap.value.get(char);
      const strokes = item?.strokes || [];
      const pinyin = item?.pinyin || '';

      modelRow.push({
        char,
        pinyin,
        strokes,
        isTracing: false,
        isBlank: false,
        isModel: true
      });

      traceRow.push({
        char,
        pinyin,
        strokes,
        isTracing: true,
        isBlank: false
      });

      blankRow.push({
        char: '',
        pinyin: '',
        strokes: [],
        isTracing: false,
        isBlank: true
      });
    });

    // 补齐行尾空白格
    while (modelRow.length < cols) {
      modelRow.push({ char: '', pinyin: '', isTracing: false, isBlank: true });
      traceRow.push({ char: '', pinyin: '', isTracing: false, isBlank: true });
      blankRow.push({ char: '', pinyin: '', isTracing: false, isBlank: true });
    }

    allRows.push(modelRow);
    allRows.push(traceRow);
    allRows.push(blankRow);
  }

  // 分页划分
  const pages: ContinuousCell[][][] = [];
  for (let i = 0; i < allRows.length; i += rows) {
    pages.push(allRows.slice(i, i + rows));
  }

  return pages.length > 0 ? pages : [[]];
});

// 总页数
const totalPages = computed(() => {
  return mode.value === 'stroke_order'
    ? strokeOrderPages.value.length
    : continuousPages.value.length;
});

// 缩放后舞台实际高度（mm），避免缩放后容器高度过高产生多余空白
const stageHeightMm = computed(() => {
  const pages = Math.max(1, totalPages.value);
  const totalUnscaledMm = pages * 297 + (pages - 1) * 7.4;
  return Math.round((totalUnscaledMm * zoomLevel.value) / 100);
});

// 移动端检测与自适应缩放
const isMobile = ref(false);

function checkMobile() {
  if (typeof window === 'undefined') return;
  isMobile.value = window.innerWidth <= 860;
}

function initAutoZoom() {
  if (typeof window === 'undefined') return;
  const screenW = window.innerWidth;
  if (screenW <= 860) {
    // 移动端：根据屏幕可用宽度自适应缩放（A4 宽度 210mm 在 96dpi 下约为 794px）
    // 左右内边距各留 8px
    const padding = 16;
    const availableW = Math.max(280, screenW - padding);
    const fitZoom = Math.floor((availableW / 794) * 100);
    zoomLevel.value = Math.max(30, Math.min(100, fitZoom));
  } else {
    zoomLevel.value = 90;
  }
}

watch(
  () => mobileActiveView.value,
  (val) => {
    if (val === 'preview' && isMobile.value) {
      if (zoomLevel.value >= 85) {
        initAutoZoom();
      }
    }
  }
);

// 打印功能（电脑端调用浏览器打印预览，手机 APK 内调用 Android 原生 PrintManager）
function handlePrint() {
  // 若在移动端且当前在设置面板，先切换至字帖预览再唤起系统打印
  if (mobileActiveView.value !== 'preview') {
    mobileActiveView.value = 'preview';
  }

  setTimeout(() => {
    if (typeof window !== 'undefined' && window.AndroidPrinter && typeof window.AndroidPrinter.print === 'function') {
      window.AndroidPrinter.print();
    } else {
      window.print();
    }
  }, 120);
}

// 导出 PDF 功能
async function handleExportPdf() {
  // 如果是在移动端 APK 原生环境中，系统 PrintManager 原生支持“另存为 PDF”及连接所有打印机，直接调起原生打印
  if (typeof window !== 'undefined' && window.AndroidPrinter && typeof window.AndroidPrinter.print === 'function') {
    handlePrint();
    return;
  }

  const sheets = document.querySelectorAll<HTMLElement>('.a4-page-sheet');
  if (!sheets || sheets.length === 0) return;

  isLoading.value = true;
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }

    pdf.save(`${headerConfig.value.title || '汉字田字格字帖'}.pdf`);
  } catch (err) {
    console.error('导出 PDF 异常', err);
    // 降级使用原生打印
    window.print();
  } finally {
    isLoading.value = false;
  }
}

// 重置默认配置
function handleReset() {
  inputText.value = '天地人你我他一二三四五上下';
  gridConfig.value = {
    gridType: 'mi',
    gridSizeMm: 14,
    gridLineColor: '#e06a55',
    gridLineWidth: 1,
    innerLineStyle: 'dashed',
    charColor: '#1a1a1a',
    tracingColor: 'cinnabar',
    tracingOpacity: 0.35,
    showPinyin: false,
    pinyinStyle: 'four_lines',
    showMeta: true
  };
  headerConfig.value = {
    showHeader: false,
    title: '汉字笔顺田字格描红帖',
    subTitle: '每日十分钟 · 规范汉字书写',
    showStudentInfo: false,
    showBindingGuide: false,
    showFooter: false,
    footerMotto: '端端正正写字，堂堂正正做人',
    showPageNumber: false
  };
}

onMounted(() => {
  checkMobile();
  initAutoZoom();
  window.addEventListener('resize', () => {
    checkMobile();
  });
  loadStrokesForCurrentText();
});
</script>

<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <HeaderBar
      v-model:zoom-level="zoomLevel"
      v-model:mobile-active-view="mobileActiveView"
      @print="handlePrint"
    />

    <!-- 主体区域 -->
    <div class="app-main-content">
      <!-- 左侧设置面板 -->
      <div
        class="panel-container"
        :class="{ 'mobile-hidden': mobileActiveView !== 'settings' }"
      >
        <SettingsPanel
          v-model:mode="mode"
          v-model:input-text="inputText"
          v-model:grid-config="gridConfig"
          v-model:header-config="headerConfig"
          :is-loading="isLoading"
          @print="handlePrint"
          @export-pdf="handleExportPdf"
          @reset="handleReset"
        />
      </div>

      <!-- 右侧 A4 字帖预览视口 -->
      <main
        class="preview-viewport"
        :class="{ 'mobile-hidden': mobileActiveView !== 'preview' }"
      >
        <!-- 舞台容器：计算缩放后的实际占位，通过 margin: 0 auto 居中，彻底杜绝负坐标截断左侧格子的问题 -->
        <div
          class="canvas-stage"
          :style="{
            width: `${(210 * zoomLevel) / 100}mm`,
            minWidth: `${(210 * zoomLevel) / 100}mm`,
            height: `${stageHeightMm}mm`
          }"
        >
          <!-- 缩放画布包装器：原点设为 top left，与舞台左边界严格对其 -->
          <div
            class="canvas-scale-wrapper"
            :style="{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
              width: '210mm'
            }"
          >
            <!-- 笔顺分步模式渲染 -->
            <template v-if="mode === 'stroke_order'">
              <A4Page
                v-for="(pageChars, pIdx) in strokeOrderPages"
                :key="pIdx"
                :page-index="pIdx + 1"
                :total-pages="totalPages"
                :grid-config="gridConfig"
                :header-config="headerConfig"
                :cols-count="colsCount"
              >
                <CopybookRow
                  v-for="(item, rIdx) in pageChars"
                  :key="rIdx"
                  :mode="'stroke_order'"
                  :char-item="item"
                  :cols-count="colsCount"
                  :grid-config="gridConfig"
                />
              </A4Page>
            </template>

            <!-- 连续课文/唐诗模式渲染 -->
            <template v-else-if="mode === 'continuous'">
              <A4Page
                v-for="(pageRows, pIdx) in continuousPages"
                :key="pIdx"
                :page-index="pIdx + 1"
                :total-pages="totalPages"
                :grid-config="gridConfig"
                :header-config="headerConfig"
                :cols-count="colsCount"
              >
                <CopybookRow
                  v-for="(rowCells, rIdx) in pageRows"
                  :key="rIdx"
                  :mode="'continuous'"
                  :continuous-cells="rowCells"
                  :cols-count="colsCount"
                  :grid-config="gridConfig"
                />
              </A4Page>
            </template>
          </div>
        </div>

        <!-- 移动端悬浮缩放控制栏（方便手机端一键自适应或微调） -->
        <div
          v-if="isMobile && mobileActiveView === 'preview'"
          class="mobile-floating-zoom"
        >
          <button
            type="button"
            class="zoom-float-btn"
            title="缩小"
            :disabled="zoomLevel <= 30"
            @click="zoomLevel = Math.max(30, zoomLevel - 5)"
          >
            －
          </button>
          <button
            type="button"
            class="zoom-float-btn zoom-fit-btn"
            title="自适应手机宽度"
            @click="initAutoZoom"
          >
            {{ zoomLevel }}% 适应全屏
          </button>
          <button
            type="button"
            class="zoom-float-btn"
            title="放大"
            :disabled="zoomLevel >= 120"
            @click="zoomLevel = Math.min(120, zoomLevel + 5)"
          >
            ＋
          </button>
        </div>
      </main>
    </div>

    <!-- 加载遮罩提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-card">
        <div class="spinner"></div>
        <span>正在生成矢量字帖笔画...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f1f5f9;
}

.app-main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.panel-container {
  height: 100%;
  flex-shrink: 0;
}

.preview-viewport {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
  padding: 24px 16px;
  box-sizing: border-box;
  display: block;
  position: relative;
  background: #e2e8f0;
}

.canvas-stage {
  margin: 0 auto;
  position: relative;
}

.canvas-scale-wrapper {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mobile-floating-zoom {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(30, 41, 59, 0.9);
  backdrop-filter: blur(12px);
  padding: 6px 10px;
  border-radius: 30px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.24);
}

.zoom-float-btn {
  background: rgba(255, 255, 255, 0.16);
  border: none;
  color: #ffffff;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.zoom-float-btn:active {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0.95);
}

.zoom-float-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-fit-btn {
  background: #c83c23;
  color: #ffffff;
  padding: 5px 14px;
  font-size: 0.82rem;
}

.loading-overlay {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

.loading-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(30, 41, 59, 0.9);
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 30px;
  font-size: 0.84rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式移动端适配 */
@media (max-width: 860px) {
  .app-main-content {
    flex-direction: column;
  }
  .panel-container.mobile-hidden {
    display: none;
  }
  .preview-viewport.mobile-hidden {
    display: none;
  }
  .preview-viewport {
    padding: 12px 6px 70px 6px; /* 底部预留空间给浮动栏 */
  }
}

/* 打印样式：只打印 A4 字帖 */
@media print {
  .app-header-bar,
  .panel-container,
  .panel-container.mobile-hidden,
  .loading-overlay,
  .mobile-floating-zoom {
    display: none !important;
  }

  .app-layout,
  .app-main-content,
  .preview-viewport,
  .preview-viewport.mobile-hidden {
    display: block !important;
    overflow: visible !important;
    height: auto !important;
    width: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
  }

  .canvas-stage {
    width: auto !important;
    min-width: auto !important;
    height: auto !important;
    margin: 0 !important;
  }

  .canvas-scale-wrapper {
    transform: none !important;
    width: auto !important;
  }
}
</style>
