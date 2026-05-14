<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

const isLoaded = ref(false)

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

const handleLoad = () => {
  isLoaded.value = true
}

// Reset loading state when image changes
watch(
  () => props.publicId,
  () => {
    isLoaded.value = false
  },
)
const handleClick = (event: Event) => {
  if (props.preview) {
    event.stopPropagation()
  }
}
</script>

<template>
  <div
    :class="['relative overflow-hidden flex items-center justify-center', className]"
    @click="handleClick"
  >
    <Skeleton v-if="!isLoaded" class="absolute inset-0 w-full h-full" />
    <Image v-if="preview" :src="imageUrl" class="w-full h-full" preview>
      <template #image>
        <AdvancedImage
          :cld-img="image"
          class="w-full h-full object-cover transition-opacity duration-300"
          :class="isLoaded ? 'opacity-100' : 'opacity-0'"
          @load="handleLoad"
        />
      </template>
    </Image>
    <AdvancedImage
      v-else
      :cld-img="image"
      class="w-full h-full object-cover transition-opacity duration-300"
      :class="isLoaded ? 'opacity-100' : 'opacity-0'"
      @load="handleLoad"
    />
  </div>
</template>
