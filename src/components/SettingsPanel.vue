<script setup lang="ts">
import { ref } from 'vue';
import type { CopybookMode, GridStyleConfig, HeaderFooterConfig, GridType, TracingColor } from '../types';
import { PRESET_CATEGORIES } from '../utils/presets';
import {
  BookOpen,
  Palette,
  Layout,
  FileText,
  Sparkles,
  Printer,
  FileDown,
  RefreshCw
} from 'lucide-vue-next';

const props = defineProps<{
  mode: CopybookMode;
  inputText: string;
  gridConfig: GridStyleConfig;
  headerConfig: HeaderFooterConfig;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:mode', val: CopybookMode): void;
  (e: 'update:inputText', val: string): void;
  (e: 'update:gridConfig', val: GridStyleConfig): void;
  (e: 'update:headerConfig', val: HeaderFooterConfig): void;
  (e: 'print'): void;
  (e: 'exportPdf'): void;
  (e: 'reset'): void;
}>();

// 当前活动设置选项卡
const activeTab = ref<'content' | 'style' | 'page' | 'presets'>('content');

// 常用网格线条颜色选项
const colorOptions = [
  { label: '经典朱砂', value: '#c83c23' },
  { label: '柔和浅红', value: '#e06a55' },
  { label: '典雅墨灰', value: '#94a3b8' },
  { label: '水墨深青', value: '#334155' },
  { label: '松石翠绿', value: '#0f766e' },
  { label: '暖秋焦糖', value: '#b45309' }
];

// 格型选项
const gridTypeOptions: { label: string; value: GridType; desc: string }[] = [
  { label: '米字格', value: 'mi', desc: '十字+对角，最利于掌握结构' },
  { label: '田字格', value: 'tian', desc: '经典十字横竖基准' },
  { label: '回宫格', value: 'hui', desc: '内外双框，练习重心聚敛' },
  { label: '九宫格', value: 'jiu', desc: '三等分井字，结构比例精准' },
  { label: '纯方格', value: 'fang', desc: '无内辅助线，自主控笔' }
];

// 尺寸选项
const sizeOptions = [
  { label: '大格 (20mm / 9字)', value: 20 },
  { label: '标准 (18mm / 10字)', value: 18 },
  { label: '精细 (15mm / 12字)', value: 15 }
];

// 描红颜色选项
const tracingOptions: { label: string; value: TracingColor }[] = [
  { label: '浅朱砂 (传统描红)', value: 'cinnabar' },
  { label: '铅笔浅灰 (仿真铅笔)', value: 'gray' },
  { label: '淡水墨 (浅墨痕)', value: 'ink_light' }
];

// 快捷应用预设
function applyPreset(text: string, presetMode?: CopybookMode) {
  emit('update:inputText', text);
  if (presetMode) {
    emit('update:mode', presetMode);
  }
}
</script>

<template>
  <aside class="settings-panel">
    <!-- 面板顶部：模式切换 Pill 控件 -->
    <div class="panel-header-section">
      <div class="mode-switcher">
        <button
          type="button"
          class="mode-btn"
          :class="{ active: mode === 'stroke_order' }"
          @click="emit('update:mode', 'stroke_order')"
        >
          <Sparkles class="btn-icon" :size="15" />
          <span>笔顺分步</span>
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ active: mode === 'continuous' }"
          @click="emit('update:mode', 'continuous')"
        >
          <BookOpen class="btn-icon" :size="15" />
          <span>全文/古诗</span>
        </button>
      </div>
    </div>

    <!-- 设置选项卡导航 -->
    <nav class="settings-tabs">
      <button
        type="button"
        class="tab-nav-btn"
        :class="{ active: activeTab === 'content' }"
        @click="activeTab = 'content'"
      >
        <FileText :size="14" />
        <span>文本</span>
      </button>
      <button
        type="button"
        class="tab-nav-btn"
        :class="{ active: activeTab === 'style' }"
        @click="activeTab = 'style'"
      >
        <Palette :size="14" />
        <span>格型外观</span>
      </button>
      <button
        type="button"
        class="tab-nav-btn"
        :class="{ active: activeTab === 'page' }"
        @click="activeTab = 'page'"
      >
        <Layout :size="14" />
        <span>页面信息</span>
      </button>
      <button
        type="button"
        class="tab-nav-btn"
        :class="{ active: activeTab === 'presets' }"
        @click="activeTab = 'presets'"
      >
        <Sparkles :size="14" />
        <span>生字预设</span>
      </button>
    </nav>

    <!-- 选项卡内容区 -->
    <div class="tab-content-scroll">
      <!-- 选项卡 1：文本内容 -->
      <div v-show="activeTab === 'content'" class="tab-pane">
        <div class="form-group">
          <div class="label-row">
            <label class="field-label">输入练习汉字</label>
            <span class="text-count-tag">{{ inputText.length }} 个字</span>
          </div>
          <textarea
            :value="inputText"
            @input="emit('update:inputText', ($event.target as HTMLTextAreaElement).value)"
            rows="5"
            placeholder="请输入想要练写的汉字、词语或古诗（例如：天地人你我他）"
            class="custom-textarea"
          ></textarea>
          <p class="field-hint">
            支持直接输入或粘贴长文。系统会自动识别有效汉字并提取矢量分步笔画与四线拼音。
          </p>
        </div>

        <!-- 常用快捷生字按钮 -->
        <div class="form-group">
          <label class="field-label">快捷填入常用组</label>
          <div class="quick-chips">
            <button
              type="button"
              class="chip-btn"
              @click="emit('update:inputText', '天地人你我他')"
            >
              天地人你我他
            </button>
            <button
              type="button"
              class="chip-btn"
              @click="emit('update:inputText', '一二三四五上下')"
            >
              一二三四五上下
            </button>
            <button
              type="button"
              class="chip-btn"
              @click="emit('update:inputText', '永国水木福学书法')"
            >
              永字八法精选
            </button>
            <button
              type="button"
              class="chip-btn"
              @click="applyPreset('床前明月光疑是地上霜举头望明月低头思故乡', 'continuous')"
            >
              唐诗《静夜思》
            </button>
          </div>
        </div>
      </div>

      <!-- 选项卡 2：格型与外观样式 -->
      <div v-show="activeTab === 'style'" class="tab-pane">
        <!-- 格型选择 -->
        <div class="form-group">
          <label class="field-label">格型样式</label>
          <div class="grid-type-grid">
            <button
              v-for="opt in gridTypeOptions"
              :key="opt.value"
              type="button"
              class="grid-type-card"
              :class="{ active: gridConfig.gridType === opt.value }"
              @click="emit('update:gridConfig', { ...gridConfig, gridType: opt.value })"
            >
              <div class="card-name">{{ opt.label }}</div>
              <div class="card-desc">{{ opt.desc }}</div>
            </button>
          </div>
        </div>

        <!-- 格子尺寸 -->
        <div class="form-group">
          <label class="field-label">每行格子尺寸</label>
          <div class="button-group-row">
            <button
              v-for="size in sizeOptions"
              :key="size.value"
              type="button"
              class="sub-btn"
              :class="{ active: gridConfig.gridSizeMm === size.value }"
              @click="emit('update:gridConfig', { ...gridConfig, gridSizeMm: size.value })"
            >
              {{ size.label }}
            </button>
          </div>
        </div>

        <!-- 线条颜色 -->
        <div class="form-group">
          <label class="field-label">网格线条颜色</label>
          <div class="color-palette-row">
            <button
              v-for="c in colorOptions"
              :key="c.value"
              type="button"
              class="color-dot-btn"
              :class="{ active: gridConfig.gridLineColor === c.value }"
              :style="{ backgroundColor: c.value }"
              :title="c.label"
              @click="emit('update:gridConfig', { ...gridConfig, gridLineColor: c.value })"
            ></button>
          </div>
        </div>

        <!-- 描红颜色 -->
        <div class="form-group">
          <label class="field-label">描红引导色</label>
          <div class="button-group-row">
            <button
              v-for="t in tracingOptions"
              :key="t.value"
              type="button"
              class="sub-btn"
              :class="{ active: gridConfig.tracingColor === t.value }"
              @click="emit('update:gridConfig', { ...gridConfig, tracingColor: t.value })"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <!-- 拼音配置 -->
        <div class="form-group toggle-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="gridConfig.showPinyin"
              @change="emit('update:gridConfig', { ...gridConfig, showPinyin: ($event.target as HTMLInputElement).checked })"
              class="custom-checkbox"
            />
            <span class="toggle-text">显示拼音（含四线三格基准线）</span>
          </label>
        </div>
      </div>

      <!-- 选项卡 3：页面与辅助元素 -->
      <div v-show="activeTab === 'page'" class="tab-pane">
        <!-- 顶部页眉开关 -->
        <div class="form-group toggle-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="headerConfig.showHeader"
              @change="emit('update:headerConfig', { ...headerConfig, showHeader: ($event.target as HTMLInputElement).checked })"
              class="custom-checkbox"
            />
            <span class="toggle-text"><strong>显示顶部标题与页眉</strong></span>
          </label>
        </div>

        <div v-if="headerConfig.showHeader" class="sub-form-block">
          <div class="form-group">
            <label class="field-label">字帖主标题</label>
            <input
              type="text"
              :value="headerConfig.title"
              @input="emit('update:headerConfig', { ...headerConfig, title: ($event.target as HTMLInputElement).value })"
              class="custom-input"
              placeholder="如：汉字笔顺描红字帖"
            />
          </div>

          <div class="form-group">
            <label class="field-label">副标题 / 说明</label>
            <input
              type="text"
              :value="headerConfig.subTitle"
              @input="emit('update:headerConfig', { ...headerConfig, subTitle: ($event.target as HTMLInputElement).value })"
              class="custom-input"
              placeholder="如：一年级每日规范练字"
            />
          </div>

          <div class="form-group toggle-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                :checked="headerConfig.showStudentInfo"
                @change="emit('update:headerConfig', { ...headerConfig, showStudentInfo: ($event.target as HTMLInputElement).checked })"
                class="custom-checkbox"
              />
              <span class="toggle-text">包含姓名、班级、日期与自评五星</span>
            </label>
          </div>
        </div>

        <!-- 左侧装订线开关 -->
        <div class="form-group toggle-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="headerConfig.showBindingGuide"
              @change="emit('update:headerConfig', { ...headerConfig, showBindingGuide: ($event.target as HTMLInputElement).checked })"
              class="custom-checkbox"
            />
            <span class="toggle-text"><strong>显示左侧装订裁切线</strong></span>
          </label>
        </div>

        <!-- 底部寄语页脚开关 -->
        <div class="form-group toggle-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="headerConfig.showFooter"
              @change="emit('update:headerConfig', { ...headerConfig, showFooter: ($event.target as HTMLInputElement).checked })"
              class="custom-checkbox"
            />
            <span class="toggle-text"><strong>显示底部励志寄语</strong></span>
          </label>
        </div>

        <div v-if="headerConfig.showFooter" class="sub-form-block">
          <div class="form-group">
            <label class="field-label">寄语内容</label>
            <input
              type="text"
              :value="headerConfig.footerMotto"
              @input="emit('update:headerConfig', { ...headerConfig, footerMotto: ($event.target as HTMLInputElement).value })"
              class="custom-input"
              placeholder="如：端端正正写字，堂堂正正做人"
            />
          </div>
        </div>

        <!-- 页脚页码开关 -->
        <div class="form-group toggle-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="headerConfig.showPageNumber"
              @change="emit('update:headerConfig', { ...headerConfig, showPageNumber: ($event.target as HTMLInputElement).checked })"
              class="custom-checkbox"
            />
            <span class="toggle-text">显示页脚页码（第 X 页 / 共 Y 页）</span>
          </label>
        </div>
      </div>

      <!-- 选项卡 4：统编教材字库预设 -->
      <div v-show="activeTab === 'presets'" class="tab-pane">
        <div
          v-for="cat in PRESET_CATEGORIES"
          :key="cat.id"
          class="preset-category-block"
        >
          <h3 class="category-title">{{ cat.name }}</h3>
          <div class="preset-items-grid">
            <button
              v-for="(item, idx) in cat.items"
              :key="idx"
              type="button"
              class="preset-card-btn"
              @click="applyPreset(item.text, item.mode)"
            >
              <span class="preset-item-label">{{ item.label }}</span>
              <span class="preset-item-preview">{{ item.text.slice(0, 8) }}{{ item.text.length > 8 ? '...' : '' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定动作栏：打印与导出 -->
    <div class="panel-footer-actions">
      <button
        type="button"
        class="action-btn primary-print"
        @click="emit('print')"
      >
        <Printer :size="18" />
        <span>打印 / 另存为 PDF</span>
      </button>

      <div class="action-secondary-row">
        <button
          type="button"
          class="action-btn secondary-btn"
          @click="emit('exportPdf')"
          title="直接生成并下载 PDF 文件"
        >
          <FileDown :size="16" />
          <span>下载 PDF</span>
        </button>
        <button
          type="button"
          class="action-btn icon-only-btn"
          @click="emit('reset')"
          title="重置为默认设置"
        >
          <RefreshCw :size="16" />
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.settings-panel {
  width: 380px;
  min-width: 360px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  z-index: 10;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.03);
}

.panel-header-section {
  padding: 14px 16px 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.mode-switcher {
  display: flex;
  background: #e2e8f0;
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #64748b;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn.active {
  background: #ffffff;
  color: #c83c23;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.settings-tabs {
  display: flex;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 8px;
}

.tab-nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 11px 4px;
  font-size: 0.84rem;
  color: #64748b;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-nav-btn:hover {
  color: #334155;
}

.tab-nav-btn.active {
  color: #c83c23;
  border-bottom-color: #c83c23;
  font-weight: 600;
}

.tab-content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.text-count-tag {
  font-size: 0.75rem;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 10px;
}

.custom-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.custom-textarea:focus,
.custom-input:focus {
  outline: none;
  border-color: #c83c23;
  box-shadow: 0 0 0 3px rgba(200, 60, 35, 0.12);
}

.custom-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 0.88rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  box-sizing: border-box;
}

.field-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.4;
  margin: 0;
}

.quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  font-size: 0.78rem;
  padding: 5px 10px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.grid-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.grid-type-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 9px 11px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.grid-type-card:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.grid-type-card.active {
  border-color: #c83c23;
  background: #fff8f7;
}

.card-name {
  font-size: 0.86rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.card-desc {
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.2;
}

.button-group-row {
  display: flex;
  gap: 6px;
}

.sub-btn {
  flex: 1;
  padding: 7px 8px;
  font-size: 0.78rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sub-btn.active {
  border-color: #c83c23;
  background: #fff8f7;
  color: #c83c23;
  font-weight: 600;
}

.color-palette-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.color-dot-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  outline: 1.5px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-dot-btn.active {
  outline: 2.5px solid #c83c23;
  transform: scale(1.15);
}

.toggle-group {
  padding: 6px 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.custom-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #c83c23;
  cursor: pointer;
}

.sub-form-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 12px;
  border-left: 2px solid #e2e8f0;
  margin: 2px 0 6px 6px;
}

.toggle-text {
  font-size: 0.84rem;
  color: #334155;
  user-select: none;
}

/* 预设字库样式 */
.preset-category-block {
  margin-bottom: 16px;
}

.category-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
  padding-left: 6px;
  border-left: 3px solid #c83c23;
}

.preset-items-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.preset-card-btn {
  display: flex;
  flex-direction: column;
  padding: 7px 9px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-card-btn:hover {
  background: #ffffff;
  border-color: #c83c23;
}

.preset-item-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
}

.preset-item-preview {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
}

/* 底部操作按钮 */
.panel-footer-actions {
  padding: 14px 16px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
}

.primary-print {
  width: 100%;
  padding: 12px;
  background: #c83c23;
  color: #ffffff;
  font-size: 0.95rem;
  box-shadow: 0 3px 8px rgba(200, 60, 35, 0.25);
}

.primary-print:hover {
  background: #b3321b;
  box-shadow: 0 4px 12px rgba(200, 60, 35, 0.35);
}

.action-secondary-row {
  display: flex;
  gap: 8px;
}

.secondary-btn {
  flex: 1;
  padding: 9px;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.85rem;
  border: 1px solid #e2e8f0;
}

.secondary-btn:hover {
  background: #e2e8f0;
}

.icon-only-btn {
  padding: 9px 12px;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.icon-only-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

@media (max-width: 900px) {
  .settings-panel {
    width: 100%;
    min-width: 100%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
}
</style>
