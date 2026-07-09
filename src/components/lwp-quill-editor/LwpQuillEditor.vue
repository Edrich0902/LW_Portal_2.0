<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'

type LineHandle = {
  index: number
  centerTop: number
  height: number
  length: number
}

type QuillThemeTooltip = {
  show: () => void
  position: (reference: { top: number; left: number; bottom: number; width: number }) => void
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    variant?: 'default' | 'notion'
  }>(),
  {
    variant: 'default',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const shellRef = ref<HTMLElement | null>(null)
const editorRef = ref<HTMLElement | null>(null)
const lineHandles = ref<LineHandle[]>([])
const activeLineIndex = ref<number | null>(null)
const hoveredLineIndex = ref<number | null>(null)
const lockedLineIndex = ref<number | null>(null)

let quill: Quill | null = null
let isUpdatingFromProp = false

const defaultToolbar = [
  [{ header: [1, 2, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['clean'],
]

const notionToolbar = [
  [{ header: [1, 2, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'clean'],
]

const visibleGutterLine = computed<LineHandle | null>(() => {
  if (props.variant !== 'notion') return null

  const targetIndex =
    activeLineIndex.value ?? lockedLineIndex.value ?? hoveredLineIndex.value
  if (targetIndex === null) return null

  return lineHandles.value.find((line) => line.index === targetIndex) ?? null
})

const getThemeTooltip = (): QuillThemeTooltip | null => {
  if (!quill?.theme) return null
  const theme = quill.theme as { tooltip?: QuillThemeTooltip }
  return theme.tooltip ?? null
}

const resolveLineIndexAtY = (relativeY: number): number | null => {
  if (!lineHandles.value.length) return null

  let closest: { index: number; distance: number } | null = null

  for (const handle of lineHandles.value) {
    const distance = Math.abs(relativeY - handle.centerTop)
    if (!closest || distance < closest.distance) {
      closest = { index: handle.index, distance }
    }
  }

  return closest?.index ?? null
}

const setActiveLineFromSelection = () => {
  if (!quill) return

  const range = quill.getSelection()
  if (!range) return

  const [line, offset] = quill.getLine(range.index)
  if (!line) return

  activeLineIndex.value = range.index - offset
}

const updateLineHandles = () => {
  if (!quill || props.variant !== 'notion') {
    lineHandles.value = []
    return
  }

  const handles: LineHandle[] = []
  const docLength = quill.getLength()
  let index = 0

  while (index < docLength) {
    const [line, offset] = quill.getLine(index)
    if (!line) break

    const lineStart = index - offset
    const lineLength = line.length()
    const measureLength = Math.max(1, lineLength - 1)
    const bounds = quill.getBounds(lineStart, measureLength)

    if (bounds) {
      handles.push({
        index: lineStart,
        centerTop: bounds.top + bounds.height / 2,
        height: bounds.height,
        length: lineLength,
      })
    }

    const nextIndex = lineStart + lineLength
    index = nextIndex <= lineStart ? lineStart + 1 : nextIndex
  }

  lineHandles.value = handles

  if (
    activeLineIndex.value !== null &&
    !handles.some((handle) => handle.index === activeLineIndex.value)
  ) {
    activeLineIndex.value = null
  }
}

const showBubbleAtLine = (line: LineHandle) => {
  if (!quill) return

  quill.focus()
  const selectLength = line.length > 1 ? line.length - 1 : 0
  quill.setSelection(line.index, selectLength, Quill.sources.USER)

  if (selectLength > 0) return

  const bounds = quill.getBounds(line.index, 0)
  const tooltip = getThemeTooltip()
  if (!bounds || !tooltip) return

  tooltip.show()
  tooltip.position({
    top: bounds.top,
    left: bounds.left,
    bottom: bounds.bottom,
    width: bounds.width,
  })
}

const onGutterClick = (line: LineHandle) => {
  showBubbleAtLine(line)
  lockedLineIndex.value = null
}

const onShellMouseMove = (event: MouseEvent) => {
  if (!quill || props.variant !== 'notion') return

  const editorRect = quill.root.getBoundingClientRect()
  const relativeY = event.clientY - editorRect.top + quill.root.scrollTop
  hoveredLineIndex.value = resolveLineIndexAtY(relativeY)
}

const onShellMouseLeave = () => {
  hoveredLineIndex.value = null
  lockedLineIndex.value = null
}

const onGutterMouseEnter = (line: LineHandle) => {
  lockedLineIndex.value = line.index
  hoveredLineIndex.value = line.index
}

onMounted(() => {
  if (!editorRef.value) return

  quill = new Quill(editorRef.value, {
    theme: props.variant === 'notion' ? 'bubble' : 'snow',
    placeholder: props.placeholder ?? 'Write your post here...',
    bounds: props.variant === 'notion' ? document.body : undefined,
    modules: {
      toolbar: props.variant === 'notion' ? notionToolbar : defaultToolbar,
    },
  })

  if (props.modelValue) {
    try {
      quill.setContents(JSON.parse(props.modelValue))
    } catch {
      quill.setText(props.modelValue)
    }
  }

  const scheduleLineHandleUpdate = () => {
    nextTick(() => {
      requestAnimationFrame(() => updateLineHandles())
    })
  }

  quill.on('text-change', () => {
    if (isUpdatingFromProp) return
    const delta = quill?.getContents()
    emit('update:modelValue', JSON.stringify(delta))
    setActiveLineFromSelection()
    scheduleLineHandleUpdate()
  })

  if (props.variant === 'notion') {
    quill.on('selection-change', (range) => {
      lockedLineIndex.value = null
      if (range) {
        setActiveLineFromSelection()
      } else {
        activeLineIndex.value = null
      }
      scheduleLineHandleUpdate()
    })

    quill.root.addEventListener('scroll', updateLineHandles)
    window.addEventListener('resize', updateLineHandles)
    updateLineHandles()
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (!quill) return
    const current = JSON.stringify(quill.getContents())
    if (current === newValue) return
    isUpdatingFromProp = true
    try {
      quill.setContents(JSON.parse(newValue))
    } catch {
      quill.setText(newValue)
    }
    isUpdatingFromProp = false
    updateLineHandles()
  },
)

onBeforeUnmount(() => {
  if (quill && props.variant === 'notion') {
    quill.root.removeEventListener('scroll', updateLineHandles)
    window.removeEventListener('resize', updateLineHandles)
  }
  quill = null
})
</script>

<template>
  <div
    ref="shellRef"
    class="lwp-quill-editor"
    :class="{ 'lwp-quill-editor--notion': variant === 'notion' }"
    @mousemove="onShellMouseMove"
    @mouseleave="onShellMouseLeave"
  >
    <div v-if="variant === 'notion' && visibleGutterLine" class="notion-line-gutters" aria-hidden="true">
      <button
        type="button"
        class="notion-line-gutter-btn"
        :style="{ top: `${visibleGutterLine.centerTop}px` }"
        title="Text options"
        aria-label="Text options"
        @mouseenter="onGutterMouseEnter(visibleGutterLine)"
        @mousedown.prevent
        @click.stop="onGutterClick(visibleGutterLine)"
      >
        <span class="notion-grip" aria-hidden="true">
          <span v-for="dot in 6" :key="dot" class="notion-grip__dot" />
        </span>
      </button>
    </div>

    <div ref="editorRef" />
  </div>
</template>

<style scoped>
.lwp-quill-editor:not(.lwp-quill-editor--notion) :deep(.ql-toolbar) {
  border-radius: 0.5rem 0.5rem 0 0;
  border-color: var(--p-surface-300);
  background: var(--p-surface-50);
}

.lwp-quill-editor:not(.lwp-quill-editor--notion) :deep(.ql-container) {
  border-radius: 0 0 0.5rem 0.5rem;
  border-color: var(--p-surface-300);
  font-family: inherit;
  font-size: 0.9375rem;
  min-height: 16rem;
}

.lwp-quill-editor:not(.lwp-quill-editor--notion) :deep(.ql-editor) {
  min-height: 16rem;
  line-height: 1.6;
  color: var(--p-surface-900);
}

.lwp-quill-editor--notion {
  position: relative;
}

.lwp-quill-editor--notion :deep(.ql-container.ql-bubble) {
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 1.0625rem;
  min-height: 50vh;
  overflow: visible;
}

.lwp-quill-editor--notion :deep(.ql-editor) {
  min-height: 50vh;
  line-height: 1.85;
  padding: 0 0 0 2.25rem;
  color: var(--p-surface-900);
}

.lwp-quill-editor--notion :deep(.ql-editor.ql-blank::before) {
  left: 2.25rem;
  right: 0;
  font-style: normal;
  color: var(--p-surface-400);
}

.notion-line-gutters {
  position: absolute;
  top: 0;
  left: -0.5rem;
  width: 2.75rem;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.notion-line-gutter-btn {
  position: absolute;
  left: 0;
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.45rem;
  background: transparent;
  color: var(--p-surface-400);
  cursor: pointer;
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.notion-line-gutter-btn::before {
  content: '';
  position: absolute;
  inset: -0.35rem;
}

.notion-grip {
  display: grid;
  grid-template-columns: repeat(2, 3px);
  grid-template-rows: repeat(3, 3px);
  gap: 2px;
}

.notion-grip__dot {
  width: 3px;
  height: 3px;
  border-radius: 9999px;
  background: currentColor;
}

.notion-line-gutter-btn:hover,
.notion-line-gutter-btn:focus-visible {
  background: var(--p-surface-100);
  color: var(--p-surface-700);
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip) {
  border-radius: 0.75rem;
  overflow: visible;
  border: 1px solid var(--p-surface-200);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
  background: var(--p-surface-0);
  color: var(--p-surface-700);
  z-index: 40;
  font-family: inherit;
  font-size: 0.8125rem;
  line-height: 1.25;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip *:not(svg):not(path)) {
  font-size: inherit;
  line-height: inherit;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar) {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  white-space: nowrap;
  border: none !important;
  border-radius: 0.75rem !important;
  background: transparent !important;
  padding: 0.25rem 0.35rem;
  overflow: visible;
  font-size: 0.8125rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-formats) {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  margin-right: 0.1rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar button) {
  border-radius: 0.4rem;
  width: 1.625rem;
  height: 1.625rem;
  padding: 0;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar button svg) {
  width: 0.875rem;
  height: 0.875rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-stroke) {
  stroke-width: 1.75;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker) {
  height: 1.625rem;
  font-size: 0.8125rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-label) {
  border-radius: 0.4rem;
  padding: 0 0.3rem;
  font-size: 0.8125rem;
  line-height: 1.625rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-label::before) {
  line-height: 1.625rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-options) {
  border-radius: 0.65rem;
  border: 1px solid var(--p-surface-200);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
  background: var(--p-surface-0);
  z-index: 50;
  overflow: visible;
  margin-top: 0.25rem;
  padding: 0.25rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-options .ql-picker-item) {
  font-size: 0.8125rem !important;
  font-weight: 500 !important;
  line-height: 1.25 !important;
  padding: 0.35rem 0.65rem;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-options .ql-picker-item[data-value='1']),
.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-options .ql-picker-item[data-value='2']) {
  font-size: 0.8125rem !important;
}

.lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-item) {
  font-size: 0.8125rem;
  padding: 0.35rem 0.65rem;
}

.dark .lwp-quill-editor:not(.lwp-quill-editor--notion) :deep(.ql-toolbar) {
  border-color: var(--p-surface-600);
  background: var(--p-surface-800);
}

.dark .lwp-quill-editor:not(.lwp-quill-editor--notion) :deep(.ql-container) {
  border-color: var(--p-surface-600);
}

.dark .lwp-quill-editor--notion :deep(.ql-editor) {
  color: var(--p-surface-100);
}

.dark .lwp-quill-editor :deep(.ql-editor.ql-blank::before) {
  color: var(--p-surface-400);
}

.dark .lwp-quill-editor :deep(.ql-stroke) {
  stroke: var(--p-surface-300);
}

.dark .lwp-quill-editor :deep(.ql-fill) {
  fill: var(--p-surface-300);
}

.dark .lwp-quill-editor :deep(.ql-picker-label) {
  color: var(--p-surface-300);
}

.dark .notion-line-gutter-btn {
  color: var(--p-surface-500);
}

.dark .notion-line-gutter-btn:hover,
.dark .notion-line-gutter-btn:focus-visible {
  background: var(--p-surface-800);
  color: var(--p-surface-200);
}

.dark .lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip) {
  border-color: var(--p-surface-700);
  background: var(--p-surface-900);
  color: var(--p-surface-100);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.dark .lwp-quill-editor--notion :deep(.ql-bubble .ql-tooltip .ql-toolbar .ql-picker-options) {
  border-color: var(--p-surface-700);
  background: var(--p-surface-900);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}
</style>
