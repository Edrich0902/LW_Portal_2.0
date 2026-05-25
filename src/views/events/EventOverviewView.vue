<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import moment from 'moment'
import { Status } from '@/types/status.ts'
import type { EventRsvpSummaryRow } from '@/types/event-rsvp/event-rsvp.ts'
import { useEventOverviewStore } from '@stores/event-overview/event-overview.store.ts'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'

const store = useEventOverviewStore()

const searchText = ref('')
const showDetail = ref(false)
const selectedEvent = ref<EventRsvpSummaryRow | null>(null)
const detailSearch = ref('')

const filteredSummaries = computed(() => {
  if (!searchText.value.trim()) return store.summaries
  const q = searchText.value.toLowerCase()
  return store.summaries.filter((s) => s.title.toLowerCase().includes(q))
})

const filteredDetails = computed(() => {
  if (!detailSearch.value.trim()) return store.details
  const q = detailSearch.value.toLowerCase()
  return store.details.filter(
    (d) =>
      fullName(d.first_name, d.last_name).toLowerCase().includes(q) ||
      (d.email ?? '').toLowerCase().includes(q),
  )
})

const detailAttending = computed(() =>
  filteredDetails.value.filter((d) => d.status === 'attending'),
)
const detailInterested = computed(() =>
  filteredDetails.value.filter((d) => d.status === 'interested'),
)
const detailNotAttending = computed(() =>
  filteredDetails.value.filter((d) => d.status === 'not_attending'),
)

const dtAttending = ref()
const dtInterested = ref()
const dtNotAttending = ref()

onBeforeMount(async () => {
  await store.loadSummaries()
})

const onRefresh = async () => {
  await store.loadSummaries()
}

const onRowClick = async (event: { data: EventRsvpSummaryRow }) => {
  selectedEvent.value = event.data
  showDetail.value = true
  await store.loadDetails(event.data.id)
}

const onDetailClose = () => {
  showDetail.value = false
  detailSearch.value = ''
  store.clearDetails()
}

const capacityLabel = (row: EventRsvpSummaryRow) => {
  if (!row.capacity) return '—'
  return `${row.attending_count} / ${row.capacity}`
}

const capacitySeverity = (row: EventRsvpSummaryRow): 'success' | 'warn' | 'danger' | undefined => {
  if (!row.capacity) return undefined
  const pct = row.attending_count / row.capacity
  if (pct >= 1) return 'danger'
  if (pct >= 0.8) return 'warn'
  return 'success'
}

const fullName = (first?: string, last?: string) => {
  return [first, last].filter(Boolean).join(' ') || '—'
}
</script>

<template>
  <PageWrapper show-toolbar title="Event Overview" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search events..." />
      </IconField>
    </template>

    <LwpSkeletonTable
      v-if="store.status === Status.LOADING"
      :columns="6"
      :rows="10"
    />

    <template v-else>
      <LwpEmptyState
        v-if="store.status === Status.EMPTY"
        title="No Upcoming Events"
        description="There are no upcoming once-off events at this time."
        icon="pi pi-calendar"
      />

      <DataTable
        v-else
        :value="filteredSummaries"
        row-hover
        :row-class="() => 'cursor-pointer'"
        @row-click="onRowClick"
        striped-rows
        scrollable
        scroll-height="flex"
        class="flex-1"
      >
        <template #header>
          <div class="flex flex-row items-center justify-end gap-2">
            <Button
              @click="onRefresh"
              icon="pi pi-refresh"
              size="small"
              rounded
              raised
            />
          </div>
        </template>

        <template #empty>
          <LwpEmptyState
            title="No Events Found"
            description="Try adjusting your search."
            icon="pi pi-search"
          />
        </template>

        <Column field="title" header="Name" sortable />

        <Column field="start_date" header="Date" sortable>
          <template #body="{ data }">
            {{ data.start_date ? moment(data.start_date).format('DD MMM YYYY') : '—' }}
          </template>
        </Column>

        <Column field="attending_count" header="Yes" sortable>
          <template #body="{ data }">
            <Tag :value="String(data.attending_count)" severity="success" rounded />
          </template>
        </Column>

        <Column field="interested_count" header="Maybe" sortable>
          <template #body="{ data }">
            <Tag :value="String(data.interested_count)" severity="warn" rounded />
          </template>
        </Column>

        <Column field="not_attending_count" header="No" sortable>
          <template #body="{ data }">
            <Tag :value="String(data.not_attending_count)" severity="danger" rounded />
          </template>
        </Column>

        <Column field="capacity" header="Capacity" sortable>
          <template #body="{ data }">
            <Tag
              v-if="data.capacity"
              :value="capacityLabel(data)"
              :severity="capacitySeverity(data)"
              rounded
            />
            <span v-else class="text-muted-color">—</span>
          </template>
        </Column>
      </DataTable>
    </template>

    <!-- RSVP Detail Dialog -->
    <Dialog
      v-model:visible="showDetail"
      modal
      :header="selectedEvent?.title ?? 'RSVP Details'"
      class="w-2/3"
      @hide="onDetailClose"
    >
      <!-- Banner image -->
      <div
        v-if="selectedEvent?.banner_public_id"
        class="w-full h-48 rounded-xl overflow-hidden mb-4"
      >
        <LwpImage
          :public-id="selectedEvent.banner_public_id"
          :height="192"
          class-name="w-full h-full object-cover"
        />
      </div>

      <!-- Event meta -->
      <div class="flex flex-wrap gap-3 mb-5">
        <div class="flex items-center gap-2 text-sm text-surface-500">
          <i class="pi pi-calendar" />
          <span>{{ selectedEvent?.start_date ? moment(selectedEvent.start_date).format('DD MMMM YYYY') : '—' }}</span>
        </div>
        <div v-if="selectedEvent?.end_date && selectedEvent.end_date !== selectedEvent.start_date" class="flex items-center gap-2 text-sm text-surface-500">
          <i class="pi pi-arrow-right" />
          <span>{{ moment(selectedEvent.end_date).format('DD MMMM YYYY') }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <Tag :value="`${selectedEvent?.attending_count ?? 0} Yes`" severity="success" rounded />
          <Tag :value="`${selectedEvent?.interested_count ?? 0} Maybe`" severity="warn" rounded />
          <Tag :value="`${selectedEvent?.not_attending_count ?? 0} No`" severity="danger" rounded />
        </div>
        <div v-if="selectedEvent?.capacity" class="flex items-center gap-2 text-sm text-surface-500">
          <i class="pi pi-users" />
          <span>{{ selectedEvent.attending_count }} / {{ selectedEvent.capacity }} capacity</span>
        </div>
      </div>

      <div
        v-if="store.detailStatus === Status.LOADING"
        class="flex justify-center py-8"
      >
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>

      <template v-else>
        <IconField class="mb-4">
          <InputIcon class="pi pi-search" />
          <InputText v-model="detailSearch" placeholder="Search by name or email..." fluid />
        </IconField>

        <TabView>
        <!-- Yes tab -->
        <TabPanel>
          <template #header>
            <span>Yes ({{ detailAttending.length }})</span>
          </template>

          <LwpEmptyState
            v-if="detailAttending.length === 0"
            title="No Attendees Yet"
            description="Nobody has confirmed attendance for this event."
            icon="pi pi-check-circle"
          />
          <template v-else>
            <div class="flex justify-end mb-2">
              <Button
                icon="pi pi-download"
                label="Export"
                size="small"
                severity="secondary"
                rounded
                raised
                @click="dtAttending?.exportCSV()"
              />
            </div>
            <DataTable
              ref="dtAttending"
              :value="detailAttending"
              :export-filename="`yes-${selectedEvent?.title}`"
              scrollable
              scroll-height="300px"
            >
              <Column field="first_name" header="Name">
                <template #body="{ data }">
                  {{ fullName(data.first_name, data.last_name) }}
                </template>
              </Column>
              <Column field="email" header="Email" />
              <Column field="created_at" header="RSVP Date">
                <template #body="{ data }">
                  {{ moment(data.created_at).format('DD MMM YYYY HH:mm') }}
                </template>
              </Column>
            </DataTable>
          </template>
        </TabPanel>

        <!-- Maybe tab -->
        <TabPanel>
          <template #header>
            <span>Maybe ({{ detailInterested.length }})</span>
          </template>

          <LwpEmptyState
            v-if="detailInterested.length === 0"
            title="No Interested Responses"
            description="Nobody has marked themselves as interested yet."
            icon="pi pi-star"
          />
          <template v-else>
            <div class="flex justify-end mb-2">
              <Button
                icon="pi pi-download"
                label="Export"
                size="small"
                severity="secondary"
                rounded
                raised
                @click="dtInterested?.exportCSV()"
              />
            </div>
            <DataTable
              ref="dtInterested"
              :value="detailInterested"
              :export-filename="`maybe-${selectedEvent?.title}`"
              scrollable
              scroll-height="300px"
            >
              <Column field="first_name" header="Name">
                <template #body="{ data }">
                  {{ fullName(data.first_name, data.last_name) }}
                </template>
              </Column>
              <Column field="email" header="Email" />
              <Column field="created_at" header="RSVP Date">
                <template #body="{ data }">
                  {{ moment(data.created_at).format('DD MMM YYYY HH:mm') }}
                </template>
              </Column>
            </DataTable>
          </template>
        </TabPanel>

        <!-- No tab -->
        <TabPanel>
          <template #header>
            <span>No ({{ detailNotAttending.length }})</span>
          </template>

          <LwpEmptyState
            v-if="detailNotAttending.length === 0"
            title="No Declines"
            description="Nobody has declined this event yet."
            icon="pi pi-times-circle"
          />
          <template v-else>
            <div class="flex justify-end mb-2">
              <Button
                icon="pi pi-download"
                label="Export"
                size="small"
                severity="secondary"
                rounded
                raised
                @click="dtNotAttending?.exportCSV()"
              />
            </div>
            <DataTable
              ref="dtNotAttending"
              :value="detailNotAttending"
              :export-filename="`no-${selectedEvent?.title}`"
              scrollable
              scroll-height="300px"
            >
              <Column field="first_name" header="Name">
                <template #body="{ data }">
                  {{ fullName(data.first_name, data.last_name) }}
                </template>
              </Column>
              <Column field="email" header="Email" />
              <Column field="created_at" header="RSVP Date">
                <template #body="{ data }">
                  {{ moment(data.created_at).format('DD MMM YYYY HH:mm') }}
                </template>
              </Column>
            </DataTable>
          </template>
        </TabPanel>
        </TabView>
      </template>
    </Dialog>
  </PageWrapper>
</template>
