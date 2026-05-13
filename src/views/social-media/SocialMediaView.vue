<script setup lang="ts">
import { useSocialMediaStore } from '@stores/social-media/social-media.store.ts'
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue'
import { Status } from '@/types/status.ts'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'

const socialMediaStore = useSocialMediaStore()

onBeforeMount(async () => {
  await socialMediaStore.initSocialMedia()
})

const searchText = ref<string>(socialMediaStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await socialMediaStore.filterSocialMedia({
    ...socialMediaStore.filter,
    searchText: value,
  })

  await socialMediaStore.pageSocialMedia({
    ...socialMediaStore.pagination,
    from: 0,
    page: 0,
    to: socialMediaStore.pagination.limit - 1,
  })
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await socialMediaStore.pageSocialMedia({
    ...socialMediaStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await socialMediaStore.sortSocialMedia({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRefresh = async () => {
  await socialMediaStore.initSocialMedia()
}

watch(searchText, (value) => {
  onSearch(value)
})
</script>

<template>
  <PageWrapper show-toolbar title="Social Media" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search social media..." />
      </IconField>
    </template>
    <DataTable
      :loading="socialMediaStore.status === Status.LOADING"
      :value="socialMediaStore.data"
      :rows="socialMediaStore.pagination.limit"
      :first="socialMediaStore.pagination.from"
      :total-records="socialMediaStore.pagination.count"
      :sortField="socialMediaStore.sort.column"
      :sortOrder="socialMediaStore.sort.order === 'asc' ? 1 : -1"
      @page="onPage"
      @sort="onSort"
      data-key="id"
      lazy
      paginator
      striped-rows
      scrollable
      removableSort
      scroll-height="flex"
      class="flex-1"
    >
      <template #header>
        <div class="flex flex-row items-center justify-end">
          <Button @click="onRefresh" icon="pi pi-refresh" size="small" rounded raised />
        </div>
      </template>
      <template #empty>
        <p class="flex flex-row justify-center items-center text-primary-900 dark:text-white">
          No Social Media Found
        </p>
      </template>
      <Column
        v-for="col of socialMediaStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="true"
      >
        <template v-if="col.field === 'banner_public_id'" #body="slotProps">
          <Avatar shape="circle" size="large">
            <LwpImage
              :public-id="slotProps.data.banner_public_id"
              :height="50"
              :width="50"
              class-name="object-cover"
            />
          </Avatar>
        </template>
        <template v-else-if="col.field === 'created_at' || col.field === 'updated_at'" #body="slotProps">
          {{
            slotProps.data[col.field]
              ? moment(slotProps.data[col.field]).format('DD MMM YYYY HH:mm:ss')
              : 'N/A'
          }}
        </template>
      </Column>
    </DataTable>
  </PageWrapper>
</template>
