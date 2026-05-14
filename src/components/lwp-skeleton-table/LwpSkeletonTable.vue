<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    columns?: number
    rows?: number
  }>(),
  {
    columns: 5,
    rows: 5,
  },
)

const skeletonItems = ref(new Array(props.rows).fill({}))
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
    <DataTable :value="skeletonItems" class="w-full">
      <Column v-for="i in columns" :key="i" header="">
        <template #header>
          <Skeleton width="60%" height="1rem" />
        </template>
        <template #body>
          <div class="flex items-center gap-2">
            <Skeleton v-if="i === 1" shape="circle" size="2rem" />
            <Skeleton width="100%" height="1.2rem" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
