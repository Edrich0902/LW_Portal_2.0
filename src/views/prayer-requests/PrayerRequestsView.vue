<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import moment from 'moment'
import type { DataTablePageEvent, DataTableRowClickEvent, DataTableSortEvent } from 'primevue'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpStatusTag from '@components/lwp-status-tag/LwpStatusTag.vue'
import { Status } from '@/types/status.ts'
import {
  PrayerCategory,
  PrayerRequestStatus,
  prayerCategoryLabels,
} from '@/types/prayer-request/prayer-request.ts'
import type { PrayerRequest } from '@/types/prayer-request/prayer-request.ts'
import { usePrayerRequestsStore } from '@stores/prayer-requests/prayer-requests.store.ts'
import PrayerRequestsModal from '@views/prayer-requests/PrayerRequestsModal.vue'

const prayerRequestsStore = usePrayerRequestsStore()

const dt = ref()
const showModal = ref(false)
const selectedItem = ref<PrayerRequest>()

onBeforeMount(async () => {
  await prayerRequestsStore.initPrayerRequests()
})

const searchText = ref(prayerRequestsStore.filter.searchText)
const selectedStatus = ref(prayerRequestsStore.filter.status)
const selectedCategory = ref(prayerRequestsStore.filter.category)

const statusOptions = [
  { label: 'All Statuses', value: '' },
  ...Object.values(PrayerRequestStatus).map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    value,
  })),
]

const categoryOptions = [
  { label: 'All Categories', value: '' },
  ...Object.values(PrayerCategory).map((value) => ({
    label: prayerCategoryLabels[value as PrayerCategory],
    value,
  })),
]

const applyFilters = async () => {
  await prayerRequestsStore.filterPrayerRequests({
    searchText: searchText.value,
    status: selectedStatus.value,
    category: selectedCategory.value,
  })
}

const onSearch = debounce(async () => {
  await applyFilters()
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await prayerRequestsStore.pagePrayerRequests({
    ...prayerRequestsStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await prayerRequestsStore.sortPrayerRequests({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRowClick = (event: DataTableRowClickEvent) => {
  selectedItem.value = event.data as PrayerRequest
  showModal.value = true
}

const onRefresh = async () => {
  await prayerRequestsStore.initPrayerRequests()
}

const exportCSV = () => {
  dt.value.exportCSV()
}

const handleModalClose = async (refresh = false) => {
  if (refresh) await onRefresh()
}

watch(searchText, () => {
  onSearch()
})

watch([selectedStatus, selectedCategory], async () => {
  await applyFilters()
})
</script>

<template>
  <PageWrapper show-toolbar title="Prayer Requests" class="flex flex-col">
    <template #search>
      <IconField class="w-full">
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search prayer requests..." fluid />
      </IconField>
    </template>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card>
        <template #content><div class="text-sm text-surface-500">Pending</div><div class="text-2xl font-semibold">{{ prayerRequestsStore.counts.pending }}</div></template>
      </Card>
      <Card>
        <template #content><div class="text-sm text-surface-500">Approved</div><div class="text-2xl font-semibold">{{ prayerRequestsStore.counts.approved }}</div></template>
      </Card>
      <Card>
        <template #content><div class="text-sm text-surface-500">Rejected</div><div class="text-2xl font-semibold">{{ prayerRequestsStore.counts.rejected }}</div></template>
      </Card>
      <Card>
        <template #content><div class="text-sm text-surface-500">Resolved</div><div class="text-2xl font-semibold">{{ prayerRequestsStore.counts.resolved }}</div></template>
      </Card>
    </div>

    <div class="mb-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="min-w-0 md:w-36">
          <p class="text-sm font-medium text-surface-500">Filters</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 flex-1">
          <Select
            v-model="selectedStatus"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter by status"
            class="w-full sm:flex-1"
            size="small"
          />
          <Select
            v-model="selectedCategory"
            :options="categoryOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filter by category"
            class="w-full sm:flex-1"
            size="small"
          />
        </div>
      </div>
    </div>

    <LwpSkeletonTable
      v-if="prayerRequestsStore.status === Status.LOADING"
      :columns="6"
      :rows="10"
    />

    <DataTable
      v-else
      ref="dt"
      :value="prayerRequestsStore.data"
      :rows="prayerRequestsStore.pagination.limit"
      :first="prayerRequestsStore.pagination.from"
      :total-records="prayerRequestsStore.pagination.count"
      :sortField="prayerRequestsStore.sort.column"
      :sortOrder="prayerRequestsStore.sort.order === 'asc' ? 1 : -1"
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
          title="No Prayer Requests Found"
          description="Try adjusting your filters or wait for new requests to be submitted."
        />
      </template>

      <Column
        v-for="col of prayerRequestsStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable"
      >
        <template v-if="col.field === 'first_name'" #body="slotProps">
          <div class="font-medium">
            {{ `${slotProps.data.first_name ?? ''} ${slotProps.data.last_name ?? ''}`.trim() || 'Unknown User' }}
          </div>
        </template>
        <template v-else-if="col.field === 'category'" #body="slotProps">
          <LwpStatusTag
            :value="prayerCategoryLabels[slotProps.data.category as PrayerCategory] || slotProps.data.category"
          />
        </template>
        <template v-else-if="col.field === 'status'" #body="slotProps">
          <LwpStatusTag :value="slotProps.data[col.field]" />
        </template>
        <template v-else-if="col.field === 'is_anonymous'" #body="slotProps">
          {{ slotProps.data[col.field] ? 'Yes' : 'No' }}
        </template>
        <template v-else-if="col.field === 'email'" #body="slotProps">
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

    <PrayerRequestsModal
      :key="JSON.stringify(selectedItem)"
      v-model:visible="showModal"
      :prayer-request="selectedItem"
      @close="handleModalClose"
    />
  </PageWrapper>
</template>
