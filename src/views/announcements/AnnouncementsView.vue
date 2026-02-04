<script setup lang="ts">
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import { useAnnouncementsStore } from '@stores/announcements/announcements.store.ts'
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import { type DataTablePageEvent, type DataTableSortEvent, useConfirm } from 'primevue'
import { Status } from '@/types/status.ts'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import moment from 'moment/moment'
import { type Announcement, AnnouncementState } from '@/types/announcement/announcement.ts'

const announcementsStore = useAnnouncementsStore()
const confirm = useConfirm()

onBeforeMount(async () => {
  await announcementsStore.initAnnouncements()
})

const searchText = ref<string>(announcementsStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await announcementsStore.filterAnnouncements({
    ...announcementsStore.filter,
    searchText: value,
  })

  await announcementsStore.pageAnnouncements({
    ...announcementsStore.pagination,
    from: 0,
    page: 0,
    to: announcementsStore.pagination.limit - 1,
  })
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await announcementsStore.pageAnnouncements({
    ...announcementsStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await announcementsStore.sortAnnouncements({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRefresh = async () => {
  await announcementsStore.initAnnouncements()
}

const confirmAnnouncementSend = async (event: MouseEvent, announcement: Announcement) => {
  confirm.require({
    target: event.target as HTMLElement,
    message: 'Are you sure you want to send announcement?',
    icon: 'pi pi-info-circle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Confirm',
      severity: 'success',
    },
    accept: async () => {
      await announcementsStore.sendAnnouncement(announcement)
    },
    reject: () => {},
  })
}

watch(searchText, (value) => {
  onSearch(value)
})
</script>

<template>
  <PageWrapper show-toolbar title="Announcements" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search announcements..." />
      </IconField>
    </template>
    <DataTable
      :loading="announcementsStore.status === Status.LOADING"
      :value="announcementsStore.data"
      :rows="announcementsStore.pagination.limit"
      :first="announcementsStore.pagination.from"
      :total-records="announcementsStore.pagination.count"
      :sortField="announcementsStore.sort.column"
      :sortOrder="announcementsStore.sort.order === 'asc' ? 1 : -1"
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
          No Announcements Found
        </p>
      </template>
      <Column
        v-for="col of announcementsStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable"
      >
        <template v-if="col.field === 'image_public_id'" #body="slotProps">
          <Avatar shape="circle" size="large">
            <LwpImage
              :public-id="slotProps.data.image_public_id"
              :height="50"
              :width="50"
              class-name="object-cover"
            />
          </Avatar>
        </template>
        <template v-else-if="col.field === 'state'" #body="slotProps">
          <i
            v-if="slotProps.data[col.field] === AnnouncementState.SENT"
            class="pi pi-check"
            style="color: green"
          ></i>
          <i v-else class="pi pi-times" style="color: red"></i>
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
        <template v-else-if="col.field === ''" #body="slotProps">
          <div class="flex flex-row items-center justify-end">
            <Button
              :label="slotProps.data.state === AnnouncementState.SENT ? 'Already Sent' : 'Send'"
              :disabled="slotProps.data.state === AnnouncementState.SENT"
              @click="(event) => confirmAnnouncementSend(event, slotProps.data)"
              icon="pi pi-send"
              size="small"
              raised
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </PageWrapper>
</template>
