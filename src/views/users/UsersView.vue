<script setup lang="ts">
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import { onBeforeMount, ref, watch } from 'vue'
import { useUsersStore } from '@stores/users/users.store.ts'
import { Status } from '@/types/status.ts'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import moment from 'moment'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue'
import { debounce } from 'lodash'

const userStore = useUsersStore()

onBeforeMount(async () => {
  await userStore.initUsers()
})

const searchText = ref<string>(userStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await userStore.filterUsers({
    ...userStore.filter,
    searchText: value,
  })

  await userStore.pageUsers({
    ...userStore.pagination,
    from: 0,
    page: 0,
    to: userStore.pagination.limit - 1,
  })
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await userStore.pageUsers({
    ...userStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await userStore.sortUsers({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRefresh = async () => {
  await userStore.initUsers()
}

watch(searchText, (value) => {
  onSearch(value)
})
</script>
<template>
  <PageWrapper show-toolbar title="Users" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search users..." />
      </IconField>
    </template>
    <DataTable
      :loading="userStore.status === Status.LOADING"
      :value="userStore.data"
      :rows="userStore.pagination.limit"
      :first="userStore.pagination.from"
      :total-records="userStore.pagination.count"
      :sortField="userStore.sort.column"
      :sortOrder="userStore.sort.order === 'asc' ? 1 : -1"
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
          No Users Found
        </p>
      </template>
      <Column
        v-for="col of userStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="true"
      >
        <template v-if="col.field === 'profile_public_id'" #body="slotProps">
          <Avatar shape="circle" size="large">
            <LwpImage
              :public-id="slotProps.data.profile_public_id"
              :height="50"
              :width="50"
              class-name="object-cover"
            />
          </Avatar>
        </template>
        <template
          v-else-if="col.field === 'is_baptized' || col.field === 'is_member'"
          #body="slotProps"
        >
          <i v-if="slotProps.data[col.field] === true" class="pi pi-check" style="color: green"></i>
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
      </Column>
    </DataTable>
  </PageWrapper>
</template>
