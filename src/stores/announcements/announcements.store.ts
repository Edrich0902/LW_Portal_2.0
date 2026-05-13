import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { Announcement } from '@/types/announcement/announcement.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import {
  sbCreateAnnouncement,
  sbDeleteAnnouncement,
  sbQueryAnnouncements,
  sbUpdateAnnouncement,
} from '@services/announcements/announcement-service.ts'
import { AnnouncementState } from '@/types/announcement/announcement.ts';
import { useToast } from 'primevue/usetoast'

export const useAnnouncementsStore = defineStore('announcementsStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED);
  const modalStatus = ref<Status>(Status.OK);
  const data = ref<Announcement[]>([]);
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

  const tableColumns = ref<{ header: string; field: string; sortable?: boolean }[]>([
    { header: 'Image', field: 'image_public_id', sortable: true },
    { header: 'Sent', field: 'state', sortable: true },
    { header: 'Title', field: 'title', sortable: true },
    { header: 'Created At', field: 'created_at', sortable: true },
    { header: 'Updated At', field: 'updated_at', sortable: true },
    { header: '', field: '', sortable: false },
  ]);

  const initAnnouncements = async () => {
    status.value = Status.LOADING;
    await queryAnnouncements();
  }

  const queryAnnouncements = async () => {
    status.value = Status.LOADING
    const response = await sbQueryAnnouncements(pagination.value, sort.value, filter.value)

    data.value = response.data
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK;
  }

  const createAnnouncement = async (announcement: Announcement) => {
    modalStatus.value = Status.LOADING;
    const response = await sbCreateAnnouncement(announcement);

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR;
      toast.add({ severity: 'error', summary: 'Error Creating Announcement', life: 2000 })
    } else {
      modalStatus.value = Status.OK;
      toast.add({ severity: 'success', summary: 'Announcement Created', life: 2000 })
    }
  }

  const updateAnnouncement = async (announcement: Announcement) => {
    modalStatus.value = Status.LOADING;
    const response = await sbUpdateAnnouncement(announcement);

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR;
      toast.add({ severity: 'error', summary: 'Error Updating Announcement', life: 2000 })
    } else {
      modalStatus.value = Status.OK;
      toast.add({ severity: 'success', summary: 'Announcement Updated', life: 2000 })
    }
  }

  const deleteAnnouncement = async (announcement: Announcement) => {
    modalStatus.value = Status.LOADING;
    const response = await sbDeleteAnnouncement(announcement);

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR;
      toast.add({ severity: 'error', summary: 'Error Deleting Announcement', life: 2000 })
    } else {
      modalStatus.value = Status.OK;
      toast.add({ severity: 'success', summary: 'Announcement Deleted', life: 2000 })
    }
  }

  const sendAnnouncement = async (announcement: Announcement) => {
    status.value = Status.LOADING;
    announcement.state = AnnouncementState.SENT
    const response = await sbUpdateAnnouncement(announcement);

    if (response.error) {
      status.value = Status.ERROR;
      toast.add({
        severity: 'error',
        summary: 'Announcement Failed',
        detail: 'Could not send announcement',
        life: 2000,
      })
    } else {
      toast.add({ severity: 'success', summary: 'Announcement Sent', life: 2000 });
    }

    await queryAnnouncements()
  }

  const pageAnnouncements = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await queryAnnouncements()
  }

  const sortAnnouncements = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await queryAnnouncements()
  }

  const filterAnnouncements = async (updatedFilter: LwpFilter) => {
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await queryAnnouncements()
  }

  return {
    status,
    modalStatus,
    data,
    filter,
    sort,
    pagination,
    tableColumns,
    initAnnouncements,
    queryAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    sendAnnouncement,
    pageAnnouncements,
    sortAnnouncements,
    filterAnnouncements
  }
});
