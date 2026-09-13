<script setup lang="ts">
import { Printer, ZoomIn, ZoomOut, Smartphone, Monitor } from 'lucide-vue-next';

defineProps<{
  zoomLevel: number;
  mobileActiveView: 'settings' | 'preview';
  printCopies?: number;
  totalPages?: number;
}>();

const emit = defineEmits<{
  (e: 'update:zoomLevel', val: number): void;
  (e: 'update:mobileActiveView', val: 'settings' | 'preview'): void;
  (e: 'print'): void;
}>();
</script>

<template>
  <header class="app-header-bar">
    <div class="header-brand">
      <div class="seal-icon">
        <span>帖</span>
      </div>
      <div class="brand-text">
        <span class="brand-title">汉字田字格笔顺字帖生成器</span>
        <span class="brand-badge">A4 矢量打印 · 支持打包 APK</span>
        <span v-if="totalPages" class="page-count-tag" title="当前排版总页数">共 {{ totalPages }} 页</span>
      </div>
    </div>

    <!-- 移动端视图切换 Tabs -->
    <div class="mobile-view-tabs">
      <button
        type="button"
        class="mobile-tab-btn"
        :class="{ active: mobileActiveView === 'settings' }"
        @click="emit('update:mobileActiveView', 'settings')"
      >
        <Smartphone :size="14" />
        <span>参数配置</span>
      </button>
      <button
        type="button"
        class="mobile-tab-btn"
        :class="{ active: mobileActiveView === 'preview' }"
        @click="emit('update:mobileActiveView', 'preview')"
      >
        <Monitor :size="14" />
        <span>字帖预览<template v-if="totalPages"> ({{ totalPages }}页)</template></span>
      </button>
    </div>

    <!-- 右侧工具栏 -->
    <div class="header-tools">
      <!-- 缩放控制（仅桌面预览显示） -->
      <div class="zoom-controls">
        <button
          type="button"
          class="tool-btn"
          title="缩小"
          :disabled="zoomLevel <= 50"
          @click="emit('update:zoomLevel', Math.max(50, zoomLevel - 10))"
        >
          <ZoomOut :size="15" />
        </button>
        <span class="zoom-text">{{ zoomLevel }}%</span>
        <button
          type="button"
          class="tool-btn"
          title="放大"
          :disabled="zoomLevel >= 130"
          @click="emit('update:zoomLevel', Math.min(130, zoomLevel + 10))"
        >
          <ZoomIn :size="15" />
        </button>
      </div>

      <!-- 快捷打印按钮 -->
      <button
        type="button"
        class="header-print-btn"
        @click="emit('print')"
      >
        <Printer :size="15" />
        <span>打印 / 导出</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header-bar {
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-sizing: border-box;
  z-index: 20;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.seal-icon {
  width: 32px;
  height: 32px;
  background: #c83c23;
  color: #ffffff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'KaiTi', 'STKaiti', serif;
  font-size: 1.25rem;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(200, 60, 35, 0.3);
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
}

.brand-badge {
  font-size: 0.72rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 7px;
  border-radius: 4px;
}

.page-count-tag {
  font-size: 0.74rem;
  color: #c83c23;
  background: #fff8f7;
  border: 1px solid #fed7d2;
  padding: 1.5px 8px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

/* 移动端视图切换 */
.mobile-view-tabs {
  display: none;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
  gap: 3px;
}

.mobile-tab-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 0.8rem;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
}

.mobile-tab-btn.active {
  background: #ffffff;
  color: #c83c23;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 14px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2px;
}

.tool-btn {
  background: transparent;
  border: none;
  padding: 5px 7px;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.tool-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1e293b;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-text {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  min-width: 44px;
  text-align: center;
}

.header-print-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #c83c23;
  color: #ffffff;
  border: none;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.header-print-btn:hover {
  background: #b3321b;
}

@media (max-width: 860px) {
  .app-header-bar {
    padding: 0 10px;
    height: 52px;
  }
  .brand-text {
    display: none;
  }
  .seal-icon {
    width: 28px;
    height: 28px;
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .mobile-view-tabs {
    display: flex;
    flex-shrink: 0;
  }
  .mobile-tab-btn {
    padding: 5px 9px;
    font-size: 0.8rem;
    white-space: nowrap;
  }
  .header-tools {
    gap: 8px;
  }
  .header-print-btn {
    padding: 6px 11px;
    font-size: 0.8rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .zoom-controls {
    display: none;
  }
  .brand-badge {
    display: none;
  }
}
</style>
