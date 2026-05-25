<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment/moment'
import { Status } from '@/types/status.ts'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import { useDashboardStore } from '@stores/dashboard/dashboard.store.ts'
import { useUsersStore } from '@stores/users/users.store.ts'

const store = useDashboardStore()
const usersStore = useUsersStore()
const router = useRouter()

onBeforeMount(async () => {
  await store.init()
})

const quickActions = ref([
  {
    label: 'Add Announcement',
    icon: 'pi pi-megaphone',
    command: () => router.push('/announcements'),
    tooltip: 'Add Announcement',
  },
  {
    label: 'Add Event',
    icon: 'pi pi-calendar',
    command: () => router.push('/events'),
    tooltip: 'Add Event',
  },
  {
    label: 'Add Sermon',
    icon: 'pi pi-book',
    command: () => router.push('/sermons'),
    tooltip: 'Add Sermon',
  },
  {
    label: 'Users',
    icon: 'pi pi-users',
    command: () => router.push('/users'),
    tooltip: 'Manage Users',
  },
])
</script>

<template>
  <PageWrapper show-toolbar title="Dashboard">
    <div v-if="store.status === Status.LOADING" class="flex flex-col gap-8 p-4">
      <!-- Quick Stats Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div v-for="i in 5" :key="i" class="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-4">
            <Skeleton shape="circle" size="2rem" />
            <Skeleton width="6rem" height="1.5rem" />
          </div>
          <Skeleton width="4rem" height="2.5rem" />
        </div>
      </div>
      <!-- List Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div v-for="i in 2" :key="i" class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-center mb-6">
            <Skeleton width="12rem" height="2rem" />
            <Skeleton width="5rem" height="1.5rem" />
          </div>
          <div class="flex flex-col gap-4">
            <div v-for="j in 3" :key="j" class="flex items-center gap-4">
              <Skeleton shape="circle" size="3rem" />
              <div class="flex-1">
                <Skeleton width="100%" height="1.2rem" class="mb-2" />
                <Skeleton width="60%" height="1rem" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col gap-8 p-4 relative min-h-[calc(100vh-100px)]">
      <!-- Quick Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-primary-600">
              <i class="pi pi-users text-2xl"></i>
              <span class="text-lg font-medium">Total Users</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ usersStore.pagination.count }}</div>
          </template>
        </Card>

        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-orange-600">
              <i class="pi pi-calendar text-2xl"></i>
              <span class="text-lg font-medium">Events</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ store.activeEvents.length }}</div>
            <div class="text-sm text-gray-500">Upcoming/Active</div>
          </template>
        </Card>

        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-green-600">
              <i class="pi pi-megaphone text-2xl"></i>
              <span class="text-lg font-medium">Pending</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ store.pendingAnnouncementsCount }}</div>
            <div class="text-sm text-gray-500">Announcements</div>
          </template>
        </Card>

        <Card
          class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          @click="$router.push('/prayer-requests')"
        >
          <template #title>
            <div class="flex items-center gap-2 text-purple-600">
              <i class="pi pi-heart text-2xl"></i>
              <span class="text-lg font-medium">Pending</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ store.pendingPrayerCount }}</div>
            <div class="text-sm text-gray-500">Prayer Requests</div>
          </template>
        </Card>

        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-blue-600">
              <i class="pi pi-book text-2xl"></i>
              <span class="text-lg font-medium">Last Sermon</span>
            </div>
          </template>
          <template #content>
            <div v-if="store.latestSermon" class="flex flex-col gap-1">
              <div class="text-xl font-bold truncate" :title="store.latestSermon.title">{{ store.latestSermon.title }}</div>
              <div class="text-sm text-gray-500">by {{ store.latestSermon.pastor }}</div>
            </div>
            <div v-else class="text-gray-400 italic">No sermons found</div>
          </template>
        </Card>
      </div>

      <!-- User Analytics Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-indigo-600">
              <i class="pi pi-id-card text-2xl"></i>
              <span class="text-lg font-medium">Members</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ usersStore.userCounts.members }}</div>
            <div class="text-sm text-gray-500">Official Members</div>
          </template>
        </Card>

        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-slate-600">
              <i class="pi pi-user-minus text-2xl"></i>
              <span class="text-lg font-medium">Non-Members</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ usersStore.userCounts.nonMembers }}</div>
            <div class="text-sm text-gray-500">Visitors/Regulars</div>
          </template>
        </Card>

        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-cyan-600">
              <i class="pi pi-sun text-2xl"></i>
              <span class="text-lg font-medium">Baptized</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ usersStore.userCounts.baptized }}</div>
            <div class="text-sm text-gray-500">Users Baptized</div>
          </template>
        </Card>

        <Card class="shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <template #title>
            <div class="flex items-center gap-2 text-gray-600">
              <i class="pi pi-moon text-2xl"></i>
              <span class="text-lg font-medium">Not Baptized</span>
            </div>
          </template>
          <template #content>
            <div class="text-4xl font-bold">{{ usersStore.userCounts.nonBaptized }}</div>
            <div class="text-sm text-gray-500">Users Pending Baptism</div>
          </template>
        </Card>
      </div>

      <!-- Engagement Lists Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Latest Announcements -->
        <Card class="shadow-md flex-1">
          <template #title>
            <div class="flex justify-between items-center mb-4">
              <span class="text-xl font-bold">Latest Announcements</span>
              <Button label="View All" icon="pi pi-arrow-right" iconPos="right" size="small" variant="text" @click="$router.push('/announcements')" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <div
                v-for="announcement in store.latestAnnouncements"
                :key="announcement.id"
                class="flex items-center gap-4 p-3 border-b border-gray-100 last:border-0 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors cursor-pointer group"
                @click="$router.push('/announcements')"
              >
                <Avatar v-if="announcement.image_public_id" shape="circle" size="large">
                  <LwpImage :public-id="announcement.image_public_id" :height="40" :width="40" class-name="w-full h-full object-cover" />
                </Avatar>
                <div v-else class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <i class="pi pi-megaphone text-primary-500"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{{ announcement.title }}</div>
                  <div class="text-xs text-gray-500">{{ moment(announcement.created_at).fromNow() }}</div>
                </div>
                <LwpStatusTag :value="announcement.state" />
              </div>
              <div v-if="store.latestAnnouncements.length === 0" class="text-center py-8 text-gray-400">
                No announcements to show
              </div>
            </div>
          </template>
        </Card>

        <!-- Upcoming Events -->
        <Card class="shadow-md flex-1">
          <template #title>
            <div class="flex justify-between items-center mb-4">
              <span class="text-xl font-bold">Upcoming Events</span>
              <Button label="View All" icon="pi pi-arrow-right" iconPos="right" size="small" variant="text" @click="$router.push('/events')" />
            </div>
          </template>
          <template #content>
            <div class="flex flex-col gap-4">
              <div
                v-for="event in store.upcomingEvents"
                :key="event.id"
                class="flex items-center gap-4 p-3 border-b border-gray-100 last:border-0 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors cursor-pointer group"
                @click="$router.push('/events')"
              >
                <div class="flex flex-col items-center justify-center w-12 h-14 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg font-bold border border-orange-100 dark:border-orange-800">
                  <span class="text-[10px] uppercase leading-none mb-1">{{ event.nextOccurrenceDate.format('MMM') }}</span>
                  <span class="text-lg leading-none">{{ event.nextOccurrenceDate.format('DD') }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{{ event.title }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-gray-500">{{ event.day }}</span>
                    <LwpStatusTag :value="event.category" />
                  </div>
                </div>
                <div class="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                  {{ moment(event.time, 'HH:mm').format('HH:mm') }}
                </div>
              </div>
              <div v-if="store.upcomingEvents.length === 0" class="text-center py-8 text-gray-400">
                No upcoming events found
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Quick Actions SpeedDial -->
      <div class="fixed bottom-8 right-8 z-50">
        <SpeedDial
          :model="quickActions"
          direction="up"
          :transitionDelay="80"
          showIcon="pi pi-plus"
          hideIcon="pi pi-times"
          buttonClass="p-button-primary p-button-rounded p-button-lg shadow-xl"
          :tooltipOptions="{ position: 'left' }"
        />
      </div>
    </div>
  </PageWrapper>
</template>
