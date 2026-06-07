<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment/moment'
import { Status } from '@/types/status.ts'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
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
      <!-- Operational Queue Skeleton -->
      <div class="flex flex-col gap-3">
        <Skeleton width="8rem" height="1.5rem" />
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="p-4 bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md border border-surface-200 dark:border-surface-700">
            <div class="flex items-center gap-2 mb-4">
              <Skeleton shape="circle" size="2rem" />
              <Skeleton width="6rem" height="1.5rem" />
            </div>
            <Skeleton width="4rem" height="2.5rem" />
          </div>
        </div>
      </div>
      <!-- Featured Content Skeleton -->
      <div class="flex flex-col gap-3">
        <Skeleton width="8rem" height="1.5rem" />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div v-for="i in 2" :key="i" class="p-4 bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md border border-surface-200 dark:border-surface-700">
            <div class="flex items-center gap-2 mb-4">
              <Skeleton shape="circle" size="2rem" />
              <Skeleton width="6rem" height="1.5rem" />
            </div>
            <Skeleton width="10rem" height="2rem" />
          </div>
        </div>
      </div>
      <!-- User Registry Skeleton -->
      <div class="flex flex-col gap-3">
        <Skeleton width="8rem" height="1.5rem" />
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div class="p-4 bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md border border-surface-200 dark:border-surface-700 col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <Skeleton shape="circle" size="2rem" />
              <Skeleton width="6rem" height="1.5rem" />
            </div>
            <Skeleton width="4rem" height="2.5rem" />
          </div>
          <div class="p-4 bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md border border-surface-200 dark:border-surface-700 col-span-1 lg:col-span-3">
            <div class="flex items-center gap-2 mb-4">
              <Skeleton shape="circle" size="2rem" />
              <Skeleton width="6rem" height="1.5rem" />
            </div>
            <div class="grid grid-cols-4 gap-4">
              <Skeleton v-for="i in 4" :key="i" height="3rem" />
            </div>
          </div>
        </div>
      </div>
      <!-- List Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div v-for="i in 2" :key="i" class="p-6 bg-surface-0 dark:bg-surface-900 rounded-xl shadow-md border border-surface-200 dark:border-surface-700">
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
      <!-- Section 1: Active Queues (Action Required) -->
      <div class="flex flex-col gap-3">
        <h2 class="text-base font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
          <i class="pi pi-bell text-sm"></i> Operational Queue
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Pending Announcements Card -->
          <Card
            class="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border-l-4 border-l-amber-500"
            @click="$router.push('/announcements')"
          >
            <template #title>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <i class="pi pi-megaphone text-xl text-amber-600 dark:text-amber-400"></i>
                </div>
                <span class="text-base font-medium">Pending Announcements</span>
              </div>
            </template>
            <template #content>
              <div class="text-4xl font-bold">{{ store.pendingAnnouncementsCount }}</div>
              <div class="text-xs text-surface-500 mt-1">Require moderation review</div>
            </template>
          </Card>

          <!-- Pending Prayer Requests Card -->
          <Card
            class="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border-l-4 border-l-purple-500"
            @click="$router.push('/prayer-requests')"
          >
            <template #title>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <i class="pi pi-heart text-xl text-purple-600 dark:text-purple-400"></i>
                </div>
                <span class="text-base font-medium">Pending Prayer Requests</span>
              </div>
            </template>
            <template #content>
              <div class="text-4xl font-bold">{{ store.pendingPrayerCount }}</div>
              <div class="text-xs text-surface-500 mt-1">Awaiting leadership action</div>
            </template>
          </Card>

          <!-- Upcoming/Active Events Card -->
          <Card
            class="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border-l-4 border-l-orange-500"
            @click="$router.push('/events')"
          >
            <template #title>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                  <i class="pi pi-calendar text-xl text-orange-600 dark:text-orange-400"></i>
                </div>
                <span class="text-base font-medium">Active & Upcoming Events</span>
              </div>
            </template>
            <template #content>
              <div class="text-4xl font-bold">{{ store.activeEvents.length }}</div>
              <div class="text-xs text-surface-500 mt-1">Scheduled on the calendar</div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Section 2: Featured Ministry Content -->
      <div class="flex flex-col gap-3">
        <h2 class="text-base font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
          <i class="pi pi-star text-sm"></i> Featured Content
        </h2>
        <div :class="['grid gap-4 grid-cols-1', store.latestBlogPost ? 'lg:grid-cols-2' : 'lg:grid-cols-1']">
          <!-- Last Sermon Card -->
          <Card
            class="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-blue-500/10"
            @click="$router.push('/sermons')"
          >
            <template #title>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <i class="pi pi-book text-xl text-blue-600 dark:text-blue-400"></i>
                </div>
                <span class="text-base font-medium">Last Sermon</span>
              </div>
            </template>
            <template #content>
              <div v-if="store.latestSermon" class="flex flex-col gap-1 mt-1">
                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 truncate" :title="store.latestSermon.title">
                  {{ store.latestSermon.title }}
                </div>
                <div class="text-sm text-surface-500">by {{ store.latestSermon.pastor }}</div>
              </div>
              <div v-else class="text-surface-400 italic">No sermons found</div>
            </template>
          </Card>

          <!-- Latest Blog Card -->
          <Card
            v-if="store.latestBlogPost"
            class="relative overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-emerald-500/20 group min-h-[110px]"
            @click="$router.push('/pastoral-blog')"
          >
            <!-- Cover Image Background Underlay -->
            <div v-if="store.latestBlogPost.cover_image_public_id" class="absolute inset-0 z-0">
              <LwpImage
                :public-id="store.latestBlogPost.cover_image_public_id"
                :height="200"
                :width="400"
                class-name="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20"></div>
            </div>
            
            <!-- Modern Gradient Background (Fallback) -->
            <div v-else class="absolute inset-0 z-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-surface-0 dark:to-surface-900"></div>

            <template #title>
              <div class="relative z-10 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div 
                    :class="[
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                      store.latestBlogPost.cover_image_public_id
                        ? 'bg-white/20 backdrop-blur-sm text-white'
                        : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    ]"
                  >
                    <i class="pi pi-pen-to-square text-xl"></i>
                  </div>
                  <span :class="['text-base font-medium', store.latestBlogPost.cover_image_public_id ? 'text-white' : '']">
                    Latest Blog Post
                  </span>
                </div>
                
                <!-- Attention Pulsing Badge -->
                <span class="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500 text-white rounded-full shadow-sm animate-pulse">
                  New
                </span>
              </div>
            </template>

            <template #content>
              <div class="relative z-10 flex flex-col gap-1 mt-1">
                <div 
                  :class="[
                    'text-2xl font-bold truncate transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400', 
                    store.latestBlogPost.cover_image_public_id ? 'text-white group-hover:!text-emerald-300' : ''
                  ]"
                  :title="store.latestBlogPost.title"
                >
                  {{ store.latestBlogPost.title }}
                </div>
                <div 
                  :class="[
                    'text-sm',
                    store.latestBlogPost.cover_image_public_id ? 'text-white/70' : 'text-surface-500'
                  ]"
                >
                  by {{ store.latestBlogPost.author_full_name || 'Pastor' }}
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Section 3: User Register & Demographics -->
      <div class="flex flex-col gap-3">
        <h2 class="text-base font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-2">
          <i class="pi pi-users text-sm"></i> User Directory
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <!-- Total Users Card -->
          <Card
            class="shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer col-span-1 border border-primary-500/10"
            @click="$router.push('/users')"
          >
            <template #title>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <i class="pi pi-users text-xl text-primary-600 dark:text-primary-400"></i>
                </div>
                <span class="text-base font-medium">Total Register</span>
              </div>
            </template>
            <template #content>
              <div class="text-4xl font-bold">{{ usersStore.pagination.count }}</div>
              <div class="text-xs text-surface-500 mt-1">Registered accounts</div>
            </template>
          </Card>

          <!-- Demographics Card -->
          <Card class="shadow-md col-span-1 lg:col-span-3 border border-surface-200 dark:border-surface-700">
            <template #title>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-surface-50 dark:bg-surface-800 flex items-center justify-center">
                  <i class="pi pi-chart-bar text-xl text-surface-600 dark:text-surface-400"></i>
                </div>
                <span class="text-base font-medium">Registry Breakdown</span>
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="p-3 bg-surface-50 dark:bg-surface-800/40 rounded-lg border border-surface-100 dark:border-surface-800 hover:border-indigo-500/30 transition-all cursor-pointer" @click="$router.push('/users')">
                  <div class="text-xs text-surface-500 font-medium uppercase tracking-wider">Members</div>
                  <div class="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
                    {{ usersStore.userCounts.members }}
                  </div>
                </div>
                <div class="p-3 bg-surface-50 dark:bg-surface-800/40 rounded-lg border border-surface-100 dark:border-surface-800 hover:border-surface-500/30 transition-all cursor-pointer" @click="$router.push('/users')">
                  <div class="text-xs text-surface-500 font-medium uppercase tracking-wider">Regulars</div>
                  <div class="text-2xl font-bold mt-1 text-surface-700 dark:text-surface-300">
                    {{ usersStore.userCounts.nonMembers }}
                  </div>
                </div>
                <div class="p-3 bg-surface-50 dark:bg-surface-800/40 rounded-lg border border-surface-100 dark:border-surface-800 hover:border-cyan-500/30 transition-all cursor-pointer" @click="$router.push('/users')">
                  <div class="text-xs text-surface-500 font-medium uppercase tracking-wider">Baptized</div>
                  <div class="text-2xl font-bold mt-1 text-cyan-600 dark:text-cyan-400">
                    {{ usersStore.userCounts.baptized }}
                  </div>
                </div>
                <div class="p-3 bg-surface-50 dark:bg-surface-800/40 rounded-lg border border-surface-100 dark:border-surface-800 hover:border-amber-500/30 transition-all cursor-pointer" @click="$router.push('/users')">
                  <div class="text-xs text-surface-500 font-medium uppercase tracking-wider">Pending Baptism</div>
                  <div class="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                    {{ usersStore.userCounts.nonBaptized }}
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
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
                class="flex items-center gap-4 p-3 border-b border-surface-200 dark:border-surface-700 last:border-0 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors cursor-pointer group"
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
                  <div class="text-xs text-surface-500">{{ moment(announcement.created_at).fromNow() }}</div>
                </div>
                <LwpStatusTag :value="announcement.state" />
              </div>
              <LwpEmptyState
                v-if="store.latestAnnouncements.length === 0"
                compact
                icon="pi pi-megaphone"
                title="No announcements yet"
                description="Published announcements will appear here."
              />
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
                class="flex items-center gap-4 p-3 border-b border-surface-200 dark:border-surface-700 last:border-0 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors cursor-pointer group"
                @click="$router.push('/events')"
              >
                <div class="flex flex-col items-center justify-center w-12 h-14 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg font-bold border border-orange-100 dark:border-orange-800">
                  <span class="text-[10px] uppercase leading-none mb-1">{{ event.nextOccurrenceDate.format('MMM') }}</span>
                  <span class="text-lg leading-none">{{ event.nextOccurrenceDate.format('DD') }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">{{ event.title }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs text-surface-500">{{ event.day }}</span>
                    <LwpStatusTag :value="event.category" />
                  </div>
                </div>
                <div class="text-xs font-medium px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded text-surface-600 dark:text-surface-400">
                  {{ moment(event.time, 'HH:mm').format('HH:mm') }}
                </div>
              </div>
              <LwpEmptyState
                v-if="store.upcomingEvents.length === 0"
                compact
                icon="pi pi-calendar"
                title="No upcoming events"
                description="Scheduled events will appear here."
              />
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
