<script setup lang="ts">
import { computed } from 'vue'
import { AdvancedImage } from '@cloudinary/vue'
import { Resize } from '@cloudinary/url-gen/actions/resize'
import cloudinary from '@lib/cloudinaryClient'

const props = withDefaults(
  defineProps<{
    publicId?: string
    className?: string
    height?: number
    width?: number
  }>(),
  {
    publicId: 'samples/cloudinary-icon',
  },
)

const image = computed(() => {
  const img = cloudinary.image(props.publicId ?? 'samples/cloudinary-icon')
  const resizer = Resize.fit()

  if (props.height) resizer.height(props.height)
  if (props.width) resizer.width(props.width)

  // apply resizing
  img.resize(resizer)
  return img
})
</script>

<template>
  <AdvancedImage :cld-img="image" :class="className" />
</template>
