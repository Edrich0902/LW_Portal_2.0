<script setup lang="ts">
import { useSermonsStore } from '@stores/sermons/sermons.store.ts'
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import type { DataTablePageEvent, DataTableRowClickEvent, DataTableSortEvent } from 'primevue'
import { Status } from '@/types/status.ts'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import SermonModal from '@views/sermons/SermonModal.vue'
import type { Sermon } from '@/types/sermon/sermon.ts'

const sermonsStore = useSermonsStore()

const dt = ref();

onBeforeMount(async () => {
  await sermonsStore.initSermons()
})

const searchText = ref<string>(sermonsStore.filter.searchText)
const showModal = ref<boolean>(false);
const selectedItem = ref<Sermon>();

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

const onRowClick = (event: DataTableRowClickEvent) => {
  selectedItem.value = event.data as Sermon;
  showModal.value = true
}

const onAdd = () => {
  selectedItem.value = undefined;
  showModal.value = true;
}

const onRefresh = async () => {
  await sermonsStore.initSermons()
}

const exportCSV = () => {
  dt.value.exportCSV()
}

const handleModalClose = (refresh: boolean = false) => {
  if (refresh) onRefresh();
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

    <LwpSkeletonTable v-if="sermonsStore.status === Status.LOADING" :columns="4" :rows="10" />

    <DataTable
      v-else
      ref="dt"
      :value="sermonsStore.data"
      :rows="sermonsStore.pagination.limit"
      :first="sermonsStore.pagination.from"
      :total-records="sermonsStore.pagination.count"
      :sortField="sermonsStore.sort.column"
      :sortOrder="sermonsStore.sort.order === 'asc' ? 1 : -1"
      @page="onPage"
      @sort="onSort"
      @row-click="onRowClick"
      data-key="id"
      lazy
      paginator
      striped-rows
      scrollable
      resizable-columns
      column-resize-mode="fit"
      removableSort
      row-hover
      :row-class="() => 'cursor-pointer'"
      scroll-height="flex"
      class="flex-1"
    >
      <template #header>
        <div class="flex flex-row items-center justify-end gap-2">
          <Button @click="onAdd" icon="pi pi-plus" label="Add" size="small" rounded raised />
          <Button
            @click="exportCSV"
            icon="pi pi-download"
            label="Export"
            size="small"
            severity="secondary"
            rounded
            raised
          />
          <Button @click="onRefresh" icon="pi pi-refresh" size="small" rounded raised />
        </div>
      </template>
      <template #empty>
        <LwpEmptyState
          title="No Sermons Found"
          description="Try adjusting your search or add a new sermon to get started."
        >
          <template #action>
            <Button label="Create Sermon" icon="pi pi-plus" @click="onAdd" />
          </template>
        </LwpEmptyState>
      </template>
      <Column
        v-for="col of sermonsStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="true"
      >
        <template v-if="col.field === 'description'" #body="slotProps">
          <div class="max-w-xs truncate" :title="slotProps.data[col.field]">
            {{ slotProps.data[col.field] }}
          </div>
        </template>
        <template
          v-else-if="col.field === 'created_at' || col.field === 'updated_at'"
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

    <SermonModal
      :key="JSON.stringify(selectedItem)"
      v-model:visible="showModal"
      :sermon="selectedItem"
      @close="handleModalClose"
    />
  </PageWrapper>
</template>
