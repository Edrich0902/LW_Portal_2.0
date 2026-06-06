<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.core.css'

const props = defineProps<{
  content: string
}>()

const editorRef = ref<HTMLElement | null>(null)
let quill: Quill | null = null

function parseDelta(raw: string) {
  try {
    return JSON.parse(raw)
  } catch {
    return { ops: [{ insert: raw }] }
  }
}

onMounted(() => {
  if (!editorRef.value) return
  quill = new Quill(editorRef.value, {
    readOnly: true,
    modules: { toolbar: false },
  })
  quill.setContents(parseDelta(props.content))
})

watch(
  () => props.content,
  (newContent) => {
    quill?.setContents(parseDelta(newContent))
  },
)

onBeforeUnmount(() => {
  quill = null
})
</script>

<template>
  <div ref="editorRef" class="lwp-quill-viewer" />
</template>

<style scoped>
.lwp-quill-viewer :deep(.ql-container) {
  border: none;
  font-family: inherit;
  font-size: inherit;
}

.lwp-quill-viewer :deep(.ql-editor) {
  padding: 0;
  color: inherit;
  line-height: 1.6;
}

.lwp-quill-viewer :deep(.ql-editor p) {
  margin-bottom: 0.5rem;
}
</style>
