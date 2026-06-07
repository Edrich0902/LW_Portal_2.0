import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import moment from 'moment'
import { Status } from '@/types/status.ts'
import type { Event } from '@/types/event/event.ts'
import type { Announcement } from '@/types/announcement/announcement.ts'
import type { Sermon } from '@/types/sermon/sermon.ts'
import type { PastoralPost } from '@/types/pastoral-blog/pastoral-post.ts'
import { sbFetchAllEvents } from '@services/events/events-service.ts'
import {
  sbGetLatestAnnouncements,
  sbGetPendingAnnouncementsCount,
} from '@services/announcements/announcement-service.ts'
import { sbGetLatestSermon } from '@services/sermons/sermon-service.ts'
import { sbGetLatestPastoralPost } from '@services/pastoral-blog/pastoral-blog-service.ts'
import { sbGetPrayerRequestCounts } from '@services/prayer-requests/prayer-requests-service.ts'
import { useUsersStore } from '@stores/users/users.store.ts'

export const useDashboardStore = defineStore('dashboardStore', () => {
  const usersStore = useUsersStore()

  const status = ref<Status>(Status.UNINITIALIZED)
  const events = ref<Event[]>([])
  const latestAnnouncements = ref<Announcement[]>([])
  const latestSermon = ref<Sermon | null>(null)
  const latestBlogPost = ref<PastoralPost | null>(null)
  const pendingAnnouncementsCount = ref(0)
  const pendingPrayerCount = ref(0)

  const activeEvents = computed(() => {
    const today = moment().startOf('day')
    return events.value.filter((event) => {
      if (event.end_date) return moment(event.end_date).isSameOrAfter(today)
      if (event.type === 'once' && event.start_date) return moment(event.start_date).isSameOrAfter(today)
      return true
    })
  })

  const upcomingEvents = computed(() => {
    return activeEvents.value
      .map((event) => ({
        ...event,
        nextOccurrenceDate: getNextOccurrence(event.day, event.start_date),
      }))
      .sort((a, b) => a.nextOccurrenceDate.diff(b.nextOccurrenceDate))
      .slice(0, 5)
  })

  const init = async () => {
    status.value = Status.LOADING

    const results = await Promise.allSettled([
      usersStore.initUsers(),
      sbFetchAllEvents(),
      sbGetLatestAnnouncements(5),
      sbGetLatestSermon(),
      sbGetPendingAnnouncementsCount(),
      sbGetPrayerRequestCounts(),
      sbGetLatestPastoralPost(),
    ])

    if (results[1].status === 'fulfilled') events.value = results[1].value
    if (results[2].status === 'fulfilled') latestAnnouncements.value = results[2].value
    if (results[3].status === 'fulfilled') latestSermon.value = results[3].value
    if (results[4].status === 'fulfilled') pendingAnnouncementsCount.value = results[4].value
    if (results[5].status === 'fulfilled') pendingPrayerCount.value = results[5].value.pending
    if (results[6].status === 'fulfilled') latestBlogPost.value = results[6].value

    status.value = Status.OK
  }

  return {
    status,
    latestAnnouncements,
    latestSermon,
    latestBlogPost,
    pendingAnnouncementsCount,
    pendingPrayerCount,
    activeEvents,
    upcomingEvents,
    init,
  }
})

function getNextOccurrence(dayName: string, startDate?: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const targetDay = days.indexOf(dayName)
  const today = moment().startOf('day')
  const baseDate =
    startDate && moment(startDate).isAfter(today) ? moment(startDate).startOf('day') : today
  let daysUntil = targetDay - baseDate.day()
  if (daysUntil < 0) daysUntil += 7
  return baseDate.clone().add(daysUntil, 'days')
}
