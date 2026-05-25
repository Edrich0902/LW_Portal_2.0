import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { EventRsvpDetail, EventRsvpSummaryRow } from '@/types/event-rsvp/event-rsvp.ts'
import {
  sbGetEventRsvpDetails,
  sbGetEventRsvpSummary,
} from '@services/event-rsvp/event-rsvp-service.ts'

export const useEventOverviewStore = defineStore('eventOverviewStore', () => {
  const status = ref<Status>(Status.UNINITIALIZED)
  const summaries = ref<EventRsvpSummaryRow[]>([])

  const selectedEventId = ref<string | null>(null)
  const detailStatus = ref<Status>(Status.UNINITIALIZED)
  const details = ref<EventRsvpDetail[]>([])

  const loadSummaries = async () => {
    status.value = Status.LOADING
    const data = await sbGetEventRsvpSummary()
    summaries.value = data
    status.value = data.length === 0 ? Status.EMPTY : Status.OK
  }

  const loadDetails = async (eventId: string) => {
    selectedEventId.value = eventId
    detailStatus.value = Status.LOADING
    const data = await sbGetEventRsvpDetails(eventId)
    details.value = data
    detailStatus.value = Status.OK
  }

  const clearDetails = () => {
    selectedEventId.value = null
    details.value = []
    detailStatus.value = Status.UNINITIALIZED
  }

  return {
    status,
    summaries,
    selectedEventId,
    detailStatus,
    details,
    loadSummaries,
    loadDetails,
    clearDetails,
  }
})
