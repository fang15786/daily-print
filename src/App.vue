<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { CopybookMode, GridStyleConfig, HeaderFooterConfig, CharacterItem } from './types';
import { extractChineseChars } from './utils/pinyinService';
import { batchLoadCharacters } from './utils/strokeService';
import { getDefaultGridConfig } from './utils/gridConfigStorage';
import { getDefaultInputText } from './utils/textConfigStorage';
import HeaderBar from './components/HeaderBar.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import A4Page from './components/A4Page.vue';
import CopybookRow from './components/CopybookRow.vue';
import { Printer, FileDown } from 'lucide-vue-next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 模式
const mode = ref<CopybookMode>('stroke_order');

// 输入文本默认值（优先读取自定义默认打开文字，出厂为一年级常用字）
const inputText = ref(getDefaultInputText());

// 缩放比例
const zoomLevel = ref(90);

// 移动端当前活动视图
const mobileActiveView = ref<'settings' | 'preview'>('settings');

// 打印份数（每次打印几张/几份）
const printCopies = ref(1);

// 加载状态
const isLoading = ref(false);

// 网格配置（优先读取用户偏好的默认格子，初始为系统出厂纯方格）
const gridConfig = ref<GridStyleConfig>(getDefaultGridConfig());

// 页眉页脚配置（默认不显示顶部标题栏、左侧装订线和底部寄语，纯净全纸排版）
const headerConfig = ref<HeaderFooterConfig>({
  showHeader: false,
  title: '汉字规范练字帖',
  subTitle: '每日十分钟 · 规范汉字书写',
  showStudentInfo: false,
  showBindingGuide: false,
  showFooter: false,
  footerMotto: '端端正正写字，堂堂正正做人',
  showPageNumber: true,
  marginLayout: 'binding'
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

// 计算每行容纳的格子数量（行数和列数各减少 2 个单位，留足装订与书写舒展边距）
const colsCount = computed(() => {
  const size = gridConfig.value.gridSizeMm || 14;
  if (size <= 14) return 12; // 14mm: 12 格 (原 14 格减少 2 个单位)
  if (size <= 16) return 10; // 16mm: 10 格 (原 12 格减少 2 个单位)
  if (size <= 18) return 9;  // 18mm: 9 格  (原 11 格减少 2 个单位)
  if (size >= 20) return 8;  // 20mm: 8 格  (原 10 格减少 2 个单位)
  return 9;
});

// 计算每页最大容纳行数（行数减少 2 个单位，预留底部页脚页码及舒展边距）
const rowsPerPage = computed(() => {
  const size = gridConfig.value.gridSizeMm || 14;
  const withPinyin = gridConfig.value.showPinyin;
  const rowHeightMm = withPinyin ? size * 1.55 : size;
  // A4 总高 297mm，底部页脚预留约 28mm（14mm 规格恰好为 19 行，减少 2 个单位）
  let reservedMargin = 28;
  if (headerConfig.value.showHeader) reservedMargin += 28;
  if (headerConfig.value.showFooter) reservedMargin += 12;
  const availableHeight = 297 - reservedMargin;
  return Math.max(4, Math.floor((availableHeight + 0.01) / rowHeightMm));
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

// 总页数（基础页数）
const totalPages = computed(() => {
  return strokeOrderPages.value.length;
});

// 最终渲染到纸张的页面列表（支持打印份数，生成多份逐份输出，打印机与 PDF 均可一次性输出指定张数）
const renderedPages = computed(() => {
  const basePages = strokeOrderPages.value;
  const copies = Math.max(1, Math.min(50, printCopies.value));
  const result: { pageChars: CharacterItem[]; pageIndex: number; copyIndex: number }[] = [];
  for (let c = 1; c <= copies; c++) {
    for (let p = 0; p < basePages.length; p++) {
      result.push({
        pageChars: basePages[p],
        pageIndex: p + 1,
        copyIndex: c
      });
    }
  }
  return result;
});

// 缩放后舞台实际高度（mm），根据实际渲染张数计算
const stageHeightMm = computed(() => {
  const pages = Math.max(1, renderedPages.value.length);
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

// 打印配置弹窗状态
const showPrintModal = ref(false);

function openPrintModal() {
  showPrintModal.value = true;
}

function confirmPrintAction(action: 'print' | 'pdf') {
  showPrintModal.value = false;
  if (action === 'print') {
    handlePrint();
  } else {
    handleExportPdf();
  }
}

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
  inputText.value = getDefaultInputText();
  gridConfig.value = getDefaultGridConfig();
  headerConfig.value = {
    showHeader: false,
    title: '汉字规范练字帖',
    subTitle: '每日十分钟 · 规范汉字书写',
    showStudentInfo: false,
    showBindingGuide: false,
    showFooter: false,
    footerMotto: '端端正正写字，堂堂正正做人',
    showPageNumber: true,
    marginLayout: 'binding'
  };
  printCopies.value = 1;
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
      :print-copies="printCopies"
      :total-pages="totalPages"
      @print="openPrintModal"
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
          v-model:print-copies="printCopies"
          :total-pages="totalPages"
          :is-loading="isLoading"
          @print="openPrintModal"
          @export-pdf="openPrintModal"
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
            <!-- 字帖排版渲染（支持多份打印，生成指定张数） -->
            <A4Page
              v-for="(pageItem, idx) in renderedPages"
              :key="idx"
              :page-index="pageItem.pageIndex"
              :total-pages="totalPages"
              :grid-config="gridConfig"
              :header-config="headerConfig"
              :cols-count="colsCount"
            >
              <CopybookRow
                v-for="(item, rIdx) in pageItem.pageChars"
                :key="rIdx"
                :mode="mode"
                :char-item="item"
                :cols-count="colsCount"
                :grid-config="gridConfig"
              />
            </A4Page>
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

    <!-- 打印与份数设置弹窗 -->
    <Teleport to="body">
      <div
        v-if="showPrintModal"
        class="modal-backdrop"
        @click.self="showPrintModal = false"
      >
        <div class="print-dialog-card">
          <div class="dialog-header">
            <div class="dialog-title-group">
              <Printer class="dialog-title-icon" :size="20" />
              <h3 class="dialog-title">打印配置</h3>
            </div>
            <button
              type="button"
              class="dialog-close-btn"
              @click="showPrintModal = false"
            >
              ✕
            </button>
          </div>

          <div class="dialog-body">
            <!-- 页面概览信息 -->
            <div class="print-info-badge">
              <span>📄 当前字帖共 <strong>{{ strokeOrderPages.length }}</strong> 页 A4 纸（{{ rawChineseChars.length }} 个汉字）</span>
            </div>

            <!-- 打印张数/份数设置 -->
            <div class="dialog-form-group">
              <label class="dialog-label">本次打印份数 / 张数</label>
              <div class="dialog-copies-control">
                <div class="dialog-stepper">
                  <button
                    type="button"
                    class="stepper-action-btn"
                    :disabled="printCopies <= 1"
                    @click="printCopies = Math.max(1, printCopies - 1)"
                  >
                    －
                  </button>
                  <span class="stepper-count">{{ printCopies }} 份</span>
                  <button
                    type="button"
                    class="stepper-action-btn"
                    :disabled="printCopies >= 50"
                    @click="printCopies = Math.min(50, printCopies + 1)"
                  >
                    ＋
                  </button>
                </div>

                <div class="dialog-chips">
                  <button
                    v-for="num in [1, 2, 3, 5]"
                    :key="num"
                    type="button"
                    class="dialog-chip-btn"
                    :class="{ active: printCopies === num }"
                    @click="printCopies = num"
                  >
                    {{ num }}份
                  </button>
                </div>
              </div>
              <p class="dialog-copies-tip">
                将一次性生成 <strong>{{ strokeOrderPages.length * printCopies }}</strong> 张 A4 纸（共 {{ printCopies }} 份练习帖）
              </p>
            </div>
          </div>

          <div class="dialog-footer">
            <button
              type="button"
              class="dialog-btn cancel-btn"
              @click="showPrintModal = false"
            >
              取消
            </button>
            <button
              type="button"
              class="dialog-btn secondary-action-btn"
              @click="confirmPrintAction('pdf')"
            >
              <FileDown :size="16" />
              <span>下载 PDF ({{ printCopies }}份)</span>
            </button>
            <button
              type="button"
              class="dialog-btn primary-action-btn"
              @click="confirmPrintAction('print')"
            >
              <Printer :size="16" />
              <span>立即打印 ({{ printCopies }}份)</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

  .modal-backdrop {
    display: none !important;
  }
}

/* 打印弹窗样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.18s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.print-dialog-card {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 14px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.dialog-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialog-title-icon {
  color: #c83c23;
}

.dialog-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

.dialog-close-btn {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.dialog-close-btn:hover {
  color: #334155;
  background: #f1f5f9;
}

.dialog-body {
  padding: 18px 20px;
}

.print-info-badge {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.88rem;
  color: #475569;
  margin-bottom: 16px;
}

.print-info-badge strong {
  color: #c83c23;
}

.dialog-form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialog-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
}

.dialog-copies-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dialog-stepper {
  display: flex;
  align-items: center;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.stepper-action-btn {
  width: 38px;
  height: 38px;
  background: #f8fafc;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.stepper-action-btn:hover:not(:disabled) {
  background: #e2e8f0;
}

.stepper-action-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper-count {
  min-width: 56px;
  text-align: center;
  font-size: 0.98rem;
  font-weight: 700;
  color: #1e293b;
}

.dialog-chips {
  display: flex;
  gap: 6px;
}

.dialog-chip-btn {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  border-radius: 6px;
  font-size: 0.84rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.dialog-chip-btn:hover {
  border-color: #94a3b8;
  color: #1e293b;
}

.dialog-chip-btn.active {
  background: #c83c23;
  color: #ffffff;
  border-color: #c83c23;
}

.dialog-copies-tip {
  margin: 6px 0 0 0;
  font-size: 0.82rem;
  color: #64748b;
}

.dialog-copies-tip strong {
  color: #c83c23;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
}

.dialog-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.cancel-btn {
  background: transparent;
  color: #64748b;
}

.cancel-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.secondary-action-btn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.secondary-action-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.primary-action-btn {
  background: #c83c23;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(200, 60, 35, 0.25);
}

.primary-action-btn:hover {
  background: #b3321b;
}
</style>
