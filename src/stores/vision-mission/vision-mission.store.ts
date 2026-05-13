import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { VisionMission } from '@/types/meta-data/meta-data.ts'
import { sbQueryVisionMission, sbUpdateVisionMission } from '@services/vision-mission/vision-mission-service.ts'

export const useVisionMissionStore = defineStore('visionMissionStore', () => {
  const toast = useToast()
  const status = ref<Status>(Status.UNINITIALIZED)
  const data = ref<VisionMission[]>([])

  const initVisionMission = async () => {
    status.value = Status.LOADING
    await queryVisionMission()
  }

  const queryVisionMission = async () => {
    status.value = Status.LOADING
    const response = await sbQueryVisionMission();
    data.value = response.data
    status.value = Status.OK
  }

  const updateVisionMission = async (visionMission: VisionMission[]) => {
    status.value = Status.LOADING;
    const response = await sbUpdateVisionMission(visionMission);

    if (response.error !== undefined) {
      data.value = [];
      status.value = Status.ERROR;
      toast.add({
        severity: 'error',
        summary: 'Update Error',
        detail: 'Error Updating Vision & Mission',
        life: 2000,
      })
    } else {
      data.value = response.data;
      status.value = Status.OK;
      toast.add({
        severity: 'success',
        summary: 'Data Updated',
        life: 2000,
      })
    }
  }

  return {
    status,
    data,
    initVisionMission,
    queryVisionMission,
    updateVisionMission,
  }
})
