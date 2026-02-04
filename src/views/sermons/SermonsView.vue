<script setup lang="ts">
import { useSermonsStore } from '@stores/sermons/sermons.store.ts'
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue'
import { Status } from '@/types/status.ts'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'

const sermonsStore = useSermonsStore()

onBeforeMount(async () => {
  await sermonsStore.initSermons()
})

const searchText = ref<string>(sermonsStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await sermonsStore.filterSermons({
    ...sermonsStore.filter,
    searchText: value,
  })

  await sermonsStore.pageSermons({
    ...sermonsStore.pagination,
    from: 0,
    page: 0,
    to: sermonsStore.pagination.limit - 1,
  })
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await sermonsStore.pageSermons({
    ...sermonsStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await sermonsStore.sortSermons({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRefresh = async () => {
  await sermonsStore.initSermons()
}

watch(searchText, (value) => {
  onSearch(value)
})
</script>

<template>
  <PageWrapper show-toolbar title="Sermons" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search sermons..." />
      </IconField>
    </template>
    <DataTable
      :loading="sermonsStore.status === Status.LOADING"
      :value="sermonsStore.data"
      :rows="sermonsStore.pagination.limit"
      :first="sermonsStore.pagination.from"
      :total-records="sermonsStore.pagination.count"
      :sortField="sermonsStore.sort.column"
      :sortOrder="sermonsStore.sort.order === 'asc' ? 1 : -1"
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
          No Sermons Found
        </p>
      </template>
      <Column
        v-for="col of sermonsStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="true"
      >
        <template
          v-if="col.field === 'created_at' || col.field === 'updated_at'"
          #body="slotProps"
        >
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
