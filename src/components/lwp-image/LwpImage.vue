<script setup lang="ts">
  import { AdvancedImage } from '@cloudinary/vue'
  import { Resize } from '@cloudinary/url-gen/actions/resize'
  import cloudinary from '@lib/cloudinaryClient'

  const {
    publicId = 'samples/cloudinary-icon',
    className,
    height,
    width
  } = defineProps<{
    publicId?: string,
    className?: string,
    height?: number,
    width?: number,
  }>()

  const image = cloudinary.image(publicId)
  const resizer = Resize.fit()

  if (height) resizer.height(height)
  if (width) resizer.width(width)

  // apply resizing
  image.resize(resizer)
</script>

<template>
  <AdvancedImage :cld-img="image" :class="className" />
</template>
