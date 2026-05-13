import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { Event } from '@/types/event/event.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import {
  sbCreateEvent,
  sbDeleteEvent,
  sbQueryEvents,
  sbUpdateEvent,
} from '@services/events/events-service.ts'

export const useEventsStore = defineStore('eventsStore', () => {
  const toast = useToast();
  const status = ref<Status>(Status.UNINITIALIZED);
  const modalStatus = ref<Status>(Status.OK);
  const data = ref<Event[]>([]);
  const filter = ref<LwpFilter>({
    searchText: '',
  })
  const pagination = ref<LwpPagination>({
    from: 0,
    to: 19,
    limit: 20,
    count: 0,
    page: 0,
  })
  const sort = ref<LwpSort>({
    column: 'updated_at',
    order: 'desc',
  })

  const tableColumns = ref<{ header: string; field: string }[]>([
    { header: 'Banner', field: 'banner_public_id' },
    { header: 'Title', field: 'title' },
    { header: 'Description', field: 'description' },
    { header: 'Category', field: 'category' },
    { header: 'Type', field: 'type' },
    { header: 'Day', field: 'day' },
    { header: 'Time', field: 'time' },
    { header: 'Created At', field: 'created_at' },
    { header: 'Updated At', field: 'updated_at' },
  ]);

  const initEvents = async () => {
    status.value = Status.LOADING
    await queryEvents()
  }

  const queryEvents = async () => {
    status.value = Status.LOADING
    const response = await sbQueryEvents(pagination.value, sort.value, filter.value)

    data.value = response.data
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK
  }

  const createEvent = async (event: Event) => {
    modalStatus.value = Status.LOADING
    const response = await sbCreateEvent(event)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Creating Event', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Event Created', life: 2000 })
    }
  }

  const updateEvent = async (event: Event) => {
    modalStatus.value = Status.LOADING
    const response = await sbUpdateEvent(event)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Event', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Event Updated', life: 2000 })
    }
  }

  const deleteEvent = async (event: Event) => {
    modalStatus.value = Status.LOADING
    const response = await sbDeleteEvent(event)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Deleting Event', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Event Deleted', life: 2000 })
    }
  }

  const pageEvents = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await queryEvents()
  }

  const sortEvents = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await queryEvents()
  }

  const filterEvents = async (updatedFilter: LwpFilter) => {
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await queryEvents()
  }

  return {
    status,
    modalStatus,
    data,
    filter,
    sort,
    pagination,
    tableColumns,
    initEvents,
    queryEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    pageEvents,
    sortEvents,
    filterEvents
  }
})
