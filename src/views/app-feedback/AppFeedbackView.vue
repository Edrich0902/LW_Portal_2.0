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
  FeedbackCategory,
  FeedbackStatus,
  feedbackCategoryLabels,
  feedbackStatusLabels,
} from '@/types/app-feedback/app-feedback.ts'
import type { AppFeedback } from '@/types/app-feedback/app-feedback.ts'
import { useAppFeedbackStore } from '@stores/app-feedback/app-feedback.store.ts'
import AppFeedbackModal from '@views/app-feedback/AppFeedbackModal.vue'

const store = useAppFeedbackStore()

const dt = ref()
const showModal = ref(false)
const selectedItem = ref<AppFeedback>()

onBeforeMount(async () => {
  await store.initAppFeedback()
})

const searchText = ref(store.filter.searchText)
const selectedStatus = ref(store.filter.status)
const selectedCategory = ref(store.filter.category)

const statusOptions = [
  { label: 'All Statuses', value: '' },
  ...Object.values(FeedbackStatus).map((value) => ({
    label: feedbackStatusLabels[value as FeedbackStatus],
    value,
  })),
]

const categoryOptions = [
  { label: 'All Categories', value: '' },
  ...Object.values(FeedbackCategory).map((value) => ({
    label: feedbackCategoryLabels[value as FeedbackCategory],
    value,
  })),
]

const applyFilters = async () => {
  await store.filterAppFeedback({
    searchText: searchText.value,
    status: selectedStatus.value,
    category: selectedCategory.value,
  })
}

const onSearch = debounce(async () => {
  await applyFilters()
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await store.pageAppFeedback({
    ...store.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await store.sortAppFeedback({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRowClick = (event: DataTableRowClickEvent) => {
  selectedItem.value = event.data as AppFeedback
  showModal.value = true
}

const onRefresh = async () => {
  await store.initAppFeedback()
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
  <PageWrapper show-toolbar title="App Feedback" class="flex flex-col">
    <template #search>
      <IconField class="w-full">
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search feedback..." fluid />
      </IconField>
    </template>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      <Card>
        <template #content>
          <div class="text-sm text-surface-500">Open</div>
          <div class="text-2xl font-semibold">{{ store.counts[FeedbackStatus.OPEN] }}</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-sm text-surface-500">Under Review</div>
          <div class="text-2xl font-semibold">{{ store.counts[FeedbackStatus.UNDER_REVIEW] }}</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-sm text-surface-500">Planned</div>
          <div class="text-2xl font-semibold">{{ store.counts[FeedbackStatus.PLANNED] }}</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-sm text-surface-500">Resolved</div>
          <div class="text-2xl font-semibold">{{ store.counts[FeedbackStatus.RESOLVED] }}</div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="text-sm text-surface-500">Closed</div>
          <div class="text-2xl font-semibold">{{ store.counts[FeedbackStatus.CLOSED] }}</div>
        </template>
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

    <LwpSkeletonTable v-if="store.status === Status.LOADING" :columns="6" :rows="10" />

    <DataTable
      v-else
      ref="dt"
      :value="store.data"
      :rows="store.pagination.limit"
      :first="store.pagination.from"
      :total-records="store.pagination.count"
      :sortField="store.sort.column"
      :sortOrder="store.sort.order === 'asc' ? 1 : -1"
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
          title="No Feedback Found"
          description="Try adjusting your filters or wait for users to submit feedback."
        />
      </template>

      <Column
        v-for="col of store.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable"
      >
        <template v-if="col.field === 'title'" #body="slotProps">
          <div class="font-medium max-w-xs truncate" :title="slotProps.data.title">
            {{ slotProps.data.title }}
          </div>
        </template>
        <template v-else-if="col.field === 'first_name'" #body="slotProps">
          <div class="font-medium">
            {{ `${slotProps.data.first_name ?? ''} ${slotProps.data.last_name ?? ''}`.trim() || 'Unknown User' }}
          </div>
        </template>
        <template v-else-if="col.field === 'category'" #body="slotProps">
          <LwpStatusTag
            :value="feedbackCategoryLabels[slotProps.data.category as FeedbackCategory] || slotProps.data.category"
          />
        </template>
        <template v-else-if="col.field === 'status'" #body="slotProps">
          <LwpStatusTag :value="slotProps.data[col.field]" />
        </template>
        <template
          v-else-if="col.field === 'created_at'"
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

    <AppFeedbackModal
      :key="JSON.stringify(selectedItem)"
      v-model:visible="showModal"
      :feedback="selectedItem"
      @close="handleModalClose"
    />
  </PageWrapper>
</template>
