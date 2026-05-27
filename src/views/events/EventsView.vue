<script setup lang="ts">
import { useEventsStore } from '@stores/events/events.store.ts'
import { useEventOverviewStore } from '@stores/event-overview/event-overview.store.ts'
import { onBeforeMount, ref, computed, watch } from 'vue'
import { debounce } from 'lodash'
import type { DataTablePageEvent, DataTableRowClickEvent, DataTableSortEvent } from 'primevue'
import { Status } from '@/types/status.ts'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpStatusTag from '@components/lwp-status-tag/LwpStatusTag.vue'
import LwpEventCalendar from '@components/lwp-event-calendar/LwpEventCalendar.vue'
import EventsModal from '@views/events/EventsModal.vue'
import type { Event } from '@/types/event/event.ts'
import type { EventRsvpSummaryRow } from '@/types/event-rsvp/event-rsvp.ts'
import { Weekday } from '@/types/weekday.ts'

type ViewMode = 'table' | 'calendar'

const eventsStore = useEventsStore()
const eventOverviewStore = useEventOverviewStore()

const dt = ref()
const showModal = ref<boolean>(false)
const selectedItem = ref<Event>()
const defaultEventData = ref<Partial<Event> | undefined>(undefined)
const modalOpenCount = ref<number>(0)
const viewMode = ref<ViewMode>('table')
const viewPopover = ref()

const rsvpSummaryMap = computed<Map<string, EventRsvpSummaryRow>>(
  () => new Map(eventOverviewStore.summaries.map((s) => [s.id, s])),
)

const viewOptions: Array<{ value: ViewMode; icon: string; label: string }> = [
  { value: 'table', icon: 'pi pi-list', label: 'Table' },
  { value: 'calendar', icon: 'pi pi-calendar', label: 'Calendar' },
]

const currentViewIcon = computed(
  () => viewOptions.find((o) => o.value === viewMode.value)?.icon ?? 'pi pi-list',
)

onBeforeMount(async () => {
  await eventsStore.initEvents()
})

const searchText = ref<string>(eventsStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await eventsStore.filterEvents({ ...eventsStore.filter, searchText: value })
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

const openModal = (eventItem?: Event, defaults?: Partial<Event>) => {
  selectedItem.value = eventItem
  defaultEventData.value = defaults
  modalOpenCount.value += 1
  showModal.value = true
}

const onRowClick = (event: DataTableRowClickEvent) => {
  openModal(event.data as Event)
}

const onAdd = () => {
  openModal()
}

const onCalendarDateClick = (payload: { date: string; day: Weekday; time?: string }) => {
  openModal(undefined, {
    start_date: payload.date,
    day: payload.day,
    ...(payload.time ? { time: payload.time } : {}),
  })
}

const onCalendarEventClick = (event: Event) => {
  openModal(event)
}

const onRefresh = async () => {
  await eventsStore.initEvents()
  if (viewMode.value === 'calendar') {
    eventsStore.calendarStatus = Status.UNINITIALIZED
    await Promise.all([eventsStore.loadCalendarEvents(), eventOverviewStore.loadSummaries()])
  }
}

const exportCSV = () => {
  dt.value.exportCSV()
}

const handleModalClose = (refresh = false) => {
  if (refresh) onRefresh()
}

const selectView = async (mode: ViewMode) => {
  viewPopover.value.hide()
  viewMode.value = mode
  if (mode === 'calendar') {
    await Promise.all([eventsStore.loadCalendarEvents(), eventOverviewStore.loadSummaries()])
  }
}

watch(searchText, (value) => onSearch(value))
</script>

<template>
  <PageWrapper show-toolbar title="Events" class="flex flex-col">
    <template #search>
      <IconField v-if="viewMode === 'table'">
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search events..." />
      </IconField>

      <!-- View toggle — matches theme toggle pattern -->
      <Button
        :icon="currentViewIcon"
        severity="secondary"
        text
        rounded
        aria-label="Switch view"
        @click="viewPopover.toggle($event)"
      />
      <Popover ref="viewPopover">
        <div class="flex flex-col gap-0.5 min-w-36">
          <p class="text-xs text-surface-400 font-semibold uppercase px-2 pt-1 pb-2">View</p>
          <button
            v-for="option in viewOptions"
            :key="option.value"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left transition-colors cursor-pointer"
            :class="viewMode === option.value
              ? 'bg-primary/10 text-primary font-semibold'
              : 'hover:bg-surface-100 dark:hover:bg-surface-800'"
            @click="selectView(option.value)"
          >
            <i :class="option.icon" class="text-sm" />
            {{ option.label }}
          </button>
        </div>
      </Popover>
    </template>

    <!-- TABLE VIEW -->
    <template v-if="viewMode === 'table'">
      <LwpSkeletonTable v-if="eventsStore.status === Status.LOADING" :columns="5" :rows="10" />

      <DataTable
        v-else
        ref="dt"
        :value="eventsStore.data"
        :rows="eventsStore.pagination.limit"
        :first="eventsStore.pagination.from"
        :total-records="eventsStore.pagination.count"
        :sortField="eventsStore.sort.column"
        :sortOrder="eventsStore.sort.order === 'asc' ? 1 : -1"
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
            title="No Events Found"
            description="Try adjusting your search or add a new event to get started."
          >
            <template #action>
              <Button label="Create Event" icon="pi pi-plus" @click="onAdd" />
            </template>
          </LwpEmptyState>
        </template>
        <Column
          v-for="col of eventsStore.tableColumns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :sortable="true"
        >
          <template v-if="col.field === 'banner_public_id'" #body="slotProps">
            <LwpImage
              :public-id="slotProps.data.banner_public_id"
              :height="40"
              :width="40"
              class-name="w-10 h-10 object-cover rounded-full shadow-sm"
              preview
            />
          </template>
          <template v-else-if="col.field === 'category'" #body="slotProps">
            <LwpStatusTag :value="slotProps.data[col.field]" />
          </template>
          <template v-else-if="col.field === 'type'" #body="slotProps">
            <LwpStatusTag :value="slotProps.data[col.field]" />
          </template>
          <template v-else-if="col.field === 'description'" #body="slotProps">
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
    </template>

    <!-- CALENDAR VIEW -->
    <template v-else>
      <div class="flex justify-between items-center px-1 py-2">
        <div class="flex items-center gap-3 text-sm text-surface-500">
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-full bg-blue-500"></span> General
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-full bg-orange-500"></span> Once-off
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-3 h-3 rounded-full bg-green-500"></span> Course
          </span>
        </div>
        <div class="flex gap-2">
          <Button @click="onAdd" icon="pi pi-plus" label="Add" size="small" rounded raised />
          <Button @click="onRefresh" icon="pi pi-refresh" size="small" rounded raised />
        </div>
      </div>

      <div
        v-if="eventsStore.calendarStatus === Status.LOADING || eventsStore.calendarStatus === Status.UNINITIALIZED"
        class="flex justify-center py-16"
      >
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>

      <LwpEventCalendar
        v-else
        :events="eventsStore.calendarEvents"
        :rsvp-summaries="rsvpSummaryMap"
        @event-click="onCalendarEventClick"
        @date-click="onCalendarDateClick"
      />
    </template>

    <EventsModal
      :key="modalOpenCount"
      v-model:visible="showModal"
      :eventItem="selectedItem"
      :defaultEventData="defaultEventData"
      @close="handleModalClose"
    />
  </PageWrapper>
</template>
