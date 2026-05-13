<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, onMounted } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: false,
    default: 'Upload',
  },
  cloudName: {
    type: String,
    required: false,
    default: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  },
  uploadPreset: {
    type: String,
    required: false,
    default: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  },
  modelValue: {
    type: String,
    default: '',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'uploaded', 'onError'])

const widget = ref(null)

onMounted(() => {
  if (!window.cloudinary) {
    console.error('Cloudinary widget script not loaded')
    return
  }

  widget.value = window.cloudinary.createUploadWidget(
    {
      cloudName: props.cloudName,
      uploadPreset: props.uploadPreset,
      multiple: props.multiple,
      sources: [
        'local',
        'url',
        'camera',
        'shutterstock',
        'gettyimages',
        'istock',
        'unsplash',
        'google_drive',
      ],
    },
    (error: any, result: any) => {
      if (error) {
        console.error(error);
        emit('onError', error);
      }
      if (!error && result?.event === 'success') {
        const url = result.info.secure_url

        emit('update:modelValue', url)
        emit('uploaded', result.info)
      }
    },
  )
})

const openWidget = () => {
  widget.value?.open()
}
</script>

<template>
  <Button :label="label" @click="openWidget" />
</template>
