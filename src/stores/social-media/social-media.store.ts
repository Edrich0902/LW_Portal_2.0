import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { SocialMedia } from '@/types/social-media/social-media.ts'
import {
  sbCreateSocialMedia,
  sbDeleteSocialMedia,
  sbQuerySocialMedia,
  sbUpdateSocialMedia,
} from '@services/social-media/social-media-service.ts'

export const useSocialMediaStore = defineStore('socialMediaStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const modalStatus = ref<Status>(Status.OK)
  const data = ref<SocialMedia[]>([])
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
    { header: 'Link', field: 'link' },
    { header: 'Type', field: 'type' },
    { header: 'Created At', field: 'created_at' },
    { header: 'Updated At', field: 'updated_at' },
  ])

  const initSocialMedia = async () => {
    status.value = Status.LOADING
    await querySocialMedia()
  }

  const querySocialMedia = async () => {
    status.value = Status.LOADING
    const response = await sbQuerySocialMedia(pagination.value, sort.value, filter.value);

    data.value = response.data;
    pagination.value = {
      ...pagination.value,
      count: response.count,
      to: response.count < pagination.value.limit ? response.count : pagination.value.limit - 1,
    }
    status.value = Status.OK;
  }

  const createSocialMedia = async (socialMedia: SocialMedia) => {
    modalStatus.value = Status.LOADING
    const response = await sbCreateSocialMedia(socialMedia)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Creating Social Media', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Social Media Created', life: 2000 })
    }
  }

  const updateSocialMedia = async (socialMedia: SocialMedia) => {
    modalStatus.value = Status.LOADING
    const response = await sbUpdateSocialMedia(socialMedia)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Social Media', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Social Media Updated', life: 2000 })
    }
  }

  const deleteSocialMedia = async (socialMedia: SocialMedia) => {
    modalStatus.value = Status.LOADING
    const response = await sbDeleteSocialMedia(socialMedia)

    if (response.error !== undefined) {
      modalStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Deleting Social Media', life: 2000 })
    } else {
      modalStatus.value = Status.OK
      toast.add({ severity: 'success', summary: 'Social Media Deleted', life: 2000 })
    }
  }

  const pageSocialMedia = async (updatedPagination: LwpPagination) => {
    pagination.value = updatedPagination
    await querySocialMedia()
  }

  const sortSocialMedia = async (updatedSort: LwpSort) => {
    sort.value = updatedSort
    await querySocialMedia()
  }

  const filterSocialMedia = async (updatedFilter: LwpFilter) => {
    filter.value = updatedFilter
    pagination.value = {
      from: 0,
      to: 19,
      limit: 20,
      count: 0,
      page: 0,
    }
    await querySocialMedia()
  }

  return {
    status,
    modalStatus,
    data,
    filter,
    sort,
    pagination,
    tableColumns,
    initSocialMedia,
    querySocialMedia,
    createSocialMedia,
    updateSocialMedia,
    deleteSocialMedia,
    pageSocialMedia,
    sortSocialMedia,
    filterSocialMedia
  }
})
