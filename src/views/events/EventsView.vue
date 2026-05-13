<script setup lang="ts">
import { useEventsStore } from '@stores/events/events.store.ts'
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue'
import { Status } from '@/types/status.ts'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'

const eventsStore = useEventsStore()

onBeforeMount(async () => {
  await eventsStore.initEvents()
})

const searchText = ref<string>(eventsStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await eventsStore.filterEvents({
    ...eventsStore.filter,
    searchText: value,
  })

  await eventsStore.pageEvents({
    ...eventsStore.pagination,
    from: 0,
    page: 0,
    to: eventsStore.pagination.limit - 1,
  })
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await eventsStore.pageEvents({
    ...eventsStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await eventsStore.sortEvents({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRefresh = async () => {
  await eventsStore.initEvents()
}

watch(searchText, (value) => {
  onSearch(value)
})
</script>

<template>
  <PageWrapper show-toolbar title="Events" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search events..." />
      </IconField>
    </template>
    <DataTable
      :loading="eventsStore.status === Status.LOADING"
      :value="eventsStore.data"
      :rows="eventsStore.pagination.limit"
      :first="eventsStore.pagination.from"
      :total-records="eventsStore.pagination.count"
      :sortField="eventsStore.sort.column"
      :sortOrder="eventsStore.sort.order === 'asc' ? 1 : -1"
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
          No Events Found
        </p>
      </template>
      <Column
        v-for="col of eventsStore.tableColumns"
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
