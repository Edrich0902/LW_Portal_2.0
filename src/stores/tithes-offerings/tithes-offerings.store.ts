import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { TithesOfferingsSettings } from '@/types/tithes-offerings/tithes-offerings.ts'
import {
  sbQueryTithesOfferingsSettings,
  sbUpsertTithesOfferingsSettings,
} from '@services/tithes-offerings/tithes-offerings-service.ts'

export const useTithesOfferingsStore = defineStore('tithesOfferingsStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const data = ref<TithesOfferingsSettings | null>(null)

  const initSettings = async () => {
    status.value = Status.LOADING
    const response = await sbQueryTithesOfferingsSettings()
    data.value = response.data
    status.value = Status.OK
  }

  const updateSettings = async (settings: TithesOfferingsSettings) => {
    status.value = Status.LOADING
    const response = await sbUpsertTithesOfferingsSettings(settings)

    if (response.error !== undefined) {
      status.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Opdatering Misluk',
        detail: 'Fout met die stoor van Tiendes & Offergawes instellings',
        life: 2000,
      })
    } else {
      data.value = response.data
      status.value = Status.OK
      toast.add({
        severity: 'success',
        summary: 'Instellings Gestoor',
        life: 2000,
      })
    }
  }

  return {
    status,
    data,
    initSettings,
    updateSettings,
  }
})
