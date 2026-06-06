<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
let quill: Quill | null = null
let isUpdatingFromProp = false

onMounted(() => {
  if (!editorRef.value) return

  quill = new Quill(editorRef.value, {
    theme: 'snow',
    placeholder: props.placeholder ?? 'Write your post here...',
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
      ],
    },
  })

  if (props.modelValue) {
    try {
      quill.setContents(JSON.parse(props.modelValue))
    } catch {
      quill.setText(props.modelValue)
    }
  }

  quill.on('text-change', () => {
    if (isUpdatingFromProp) return
    const delta = quill?.getContents()
    emit('update:modelValue', JSON.stringify(delta))
  })
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
  },
)

onBeforeUnmount(() => {
  quill = null
})
</script>

<template>
  <div class="lwp-quill-editor">
    <div ref="editorRef" />
  </div>
</template>

<style scoped>
.lwp-quill-editor :deep(.ql-toolbar) {
  border-radius: 0.5rem 0.5rem 0 0;
  border-color: var(--p-surface-300);
  background: var(--p-surface-50);
}

.lwp-quill-editor :deep(.ql-container) {
  border-radius: 0 0 0.5rem 0.5rem;
  border-color: var(--p-surface-300);
  font-family: inherit;
  font-size: 0.9375rem;
  min-height: 16rem;
}

.lwp-quill-editor :deep(.ql-editor) {
  min-height: 16rem;
  line-height: 1.6;
  color: var(--p-surface-900);
}

.dark .lwp-quill-editor :deep(.ql-toolbar) {
  border-color: var(--p-surface-600);
  background: var(--p-surface-800);
}

.dark .lwp-quill-editor :deep(.ql-container) {
  border-color: var(--p-surface-600);
}

.dark .lwp-quill-editor :deep(.ql-editor) {
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
</style>
