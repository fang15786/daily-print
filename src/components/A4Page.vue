<script setup lang="ts">
import type { GridStyleConfig, HeaderFooterConfig } from '../types';

defineProps<{
  pageIndex: number;
  totalPages: number;
  gridConfig: GridStyleConfig;
  headerConfig: HeaderFooterConfig;
  colsCount: number;
}>();
</script>

<template>
  <div class="a4-page-sheet">
    <!-- 装订裁切线 (左侧) -->
    <div v-if="headerConfig.showBindingGuide" class="binding-guide">
      <div class="binding-line"></div>
      <span class="binding-text">✂ 装 订 线 ✁</span>
    </div>

    <!-- 页面内容主体 -->
    <div
      class="a4-content-wrapper"
      :class="{
        'has-binding': headerConfig.showBindingGuide,
        'no-header': !headerConfig.showHeader,
        'no-footer': !headerConfig.showFooter && !headerConfig.showPageNumber
      }"
    >
      <!-- 页眉区域 (可选) -->
      <header v-if="headerConfig.showHeader" class="sheet-header">
        <div class="header-main-title">
          <h1 class="main-title">{{ headerConfig.title || '汉字田字格笔顺练字帖' }}</h1>
          <span v-if="headerConfig.subTitle" class="sub-title">{{ headerConfig.subTitle }}</span>
        </div>

        <!-- 学生信息与评分栏 -->
        <div v-if="headerConfig.showStudentInfo" class="student-info-bar">
          <div class="info-item">
            <span class="info-label">姓名：</span>
            <span class="info-underline"></span>
          </div>
          <div class="info-item">
            <span class="info-label">班级：</span>
            <span class="info-underline"></span>
          </div>
          <div class="info-item">
            <span class="info-label">日期：</span>
            <span class="info-underline date-line"></span>
          </div>
          <div class="info-item score-item">
            <span class="info-label">自评：</span>
            <span class="star-rating">☆☆☆☆☆</span>
          </div>
        </div>
      </header>

      <!-- 核心字帖网格行插槽 -->
      <main class="sheet-body">
        <slot />
      </main>

      <!-- 页脚区域 (可选) -->
      <footer v-if="headerConfig.showFooter || headerConfig.showPageNumber" class="sheet-footer">
        <div v-if="headerConfig.showFooter" class="footer-motto">
          {{ headerConfig.footerMotto || '端端正正写字，堂堂正正做人' }}
        </div>
        <div v-if="headerConfig.showPageNumber" class="footer-page-num">
          第 {{ pageIndex }} 页 / 共 {{ totalPages }} 页
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* 严格按照 A4 毫米级标准 */
.a4-page-sheet {
  position: relative;
  width: 210mm;
  height: 297mm;
  min-height: 297mm;
  max-height: 297mm;
  background-color: #ffffff;
  box-sizing: border-box;
  margin: 0 auto 28px auto;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 12px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}

/* 装订线 */
.binding-guide {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 14mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px dashed #d1d5db;
  user-select: none;
}

.binding-line {
  position: absolute;
  top: 15mm;
  bottom: 15mm;
  right: 0;
}

.binding-text {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 9px;
  letter-spacing: 4px;
  color: #9ca3af;
  font-family: system-ui, sans-serif;
}

/* 主内容区域内边距 */
.a4-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10mm 14mm 10mm 14mm;
  box-sizing: border-box;
}

.a4-content-wrapper.has-binding {
  padding-left: 18mm;
  padding-right: 10mm;
}

.a4-content-wrapper.no-header {
  padding-top: 1.5mm;
}

.a4-content-wrapper.no-footer {
  padding-bottom: 1.5mm;
}

/* 页眉 */
.sheet-header {
  margin-bottom: 5mm;
  border-bottom: 1.5px solid #1a1a1a;
  padding-bottom: 2.5mm;
}

.header-main-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 2mm;
}

.main-title {
  font-family: 'KaiTi', 'STKaiti', 'Songti SC', serif;
  font-size: 19pt;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: 2px;
}

.sub-title {
  font-family: 'KaiTi', 'STKaiti', sans-serif;
  font-size: 10pt;
  color: #64748b;
}

.student-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9.5pt;
  color: #334155;
  font-family: 'KaiTi', 'STKaiti', sans-serif;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: 600;
}

.info-underline {
  display: inline-block;
  width: 20mm;
  border-bottom: 1px solid #64748b;
  margin-left: 2px;
}

.info-underline.date-line {
  width: 25mm;
}

.score-item {
  margin-left: auto;
}

.star-rating {
  letter-spacing: 3px;
  font-size: 11pt;
  color: #c83c23;
}

/* 内容主体：上下格子紧密贴合无间距 */
.sheet-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 0;
  overflow: hidden;
}

/* 页脚 */
.sheet-footer {
  margin-top: auto;
  padding-top: 2.5mm;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8.5pt;
  color: #94a3b8;
  font-family: 'KaiTi', 'STKaiti', sans-serif;
}

.footer-motto {
  letter-spacing: 1px;
}

.footer-page-num {
  font-family: system-ui, sans-serif;
}

/* 打印精确适配 */
@media print {
  .a4-page-sheet {
    margin: 0;
    box-shadow: none;
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    page-break-after: always !important;
    break-after: page !important;
  }
}
</style>
