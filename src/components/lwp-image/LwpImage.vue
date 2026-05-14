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
    preview?: boolean
  }>(),
  {
    publicId: 'samples/cloudinary-icon',
    preview: false,
  },
)

const image = computed(() => {
  const img = cloudinary.image(props.publicId ?? 'samples/cloudinary-icon')
  const resizer = Resize.fill()

  if (props.height) resizer.height(props.height)
  if (props.width) resizer.width(props.width)

  // apply resizing
  img.resize(resizer)
  return img
})

const imageUrl = computed(() => {
  return cloudinary.image(props.publicId ?? 'samples/cloudinary-icon').toURL()
})
</script>

<template>
  <div :class="['overflow-hidden flex items-center justify-center', className]">
    <Image v-if="preview" :src="imageUrl" class="w-full h-full" preview>
      <template #image>
        <AdvancedImage :cld-img="image" class="w-full h-full object-cover" />
      </template>
    </Image>
    <AdvancedImage v-else :cld-img="image" class="w-full h-full object-cover" />
  </div>
</template>
