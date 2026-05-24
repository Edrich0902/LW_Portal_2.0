<script setup lang="ts">
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import { onBeforeMount, ref, watch } from 'vue'
import { useUsersStore } from '@stores/users/users.store.ts'
import { Status } from '@/types/status.ts'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpStatusTag from '@components/lwp-status-tag/LwpStatusTag.vue'
import moment from 'moment'
import type { DataTablePageEvent, DataTableRowClickEvent, DataTableSortEvent } from 'primevue'
import { debounce } from 'lodash'
import type { User } from '@/types/user/user.ts'
import UserRoleModal from '@views/users/UserRoleModal.vue'
import { formatRoleLabel } from '@lib/role.utils.ts'

const userStore = useUsersStore()

const dt = ref()
const showModal = ref(false)
const selectedItem = ref<User>()

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

const onRowClick = (event: DataTableRowClickEvent) => {
  selectedItem.value = event.data as User
  showModal.value = true
}

const onRefresh = async () => {
  await userStore.initUsers()
}

const exportCSV = () => {
  dt.value.exportCSV()
}

watch(searchText, (value) => {
  onSearch(value)
})

const handleModalClose = async (refresh = false) => {
  if (refresh) await onRefresh()
}
</script>
<template>
  <PageWrapper show-toolbar title="Users" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search users..." />
      </IconField>
    </template>

    <LwpSkeletonTable v-if="userStore.status === Status.LOADING" :columns="6" :rows="10" />

    <DataTable
      v-else
      ref="dt"
      :value="userStore.data"
      :rows="userStore.pagination.limit"
      :first="userStore.pagination.from"
      :total-records="userStore.pagination.count"
      :sortField="userStore.sort.column"
      :sortOrder="userStore.sort.order === 'asc' ? 1 : -1"
      @page="onPage"
      @sort="onSort"
      @row-click="onRowClick"
      data-key="id"
      lazy
      paginator
      striped-rows
      scrollable
      resizable-columns
      column-resize-mode="fit"
      removableSort
      row-hover
      :row-class="() => 'cursor-pointer'"
      scroll-height="flex"
      class="flex-1"
    >
      <template #header>
        <div class="flex flex-row items-center justify-end gap-2">
          <Button
            @click="exportCSV"
            icon="pi pi-download"
            label="Export"
            size="small"
            severity="secondary"
            rounded
            raised
          />
          <Button @click="onRefresh" icon="pi pi-refresh" size="small" rounded raised />
        </div>
      </template>
      <template #empty>
        <LwpEmptyState
          title="No Users Found"
          description="Try adjusting your search filters to find what you are looking for."
        />
      </template>
      <Column
        v-for="col of userStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="true"
      >
        <template v-if="col.field === 'profile_public_id'" #body="slotProps">
          <LwpImage
            :public-id="slotProps.data.profile_public_id"
            :height="40"
            :width="40"
            class-name="w-10 h-10 object-cover rounded-full shadow-sm"
            preview
          />
        </template>
        <template v-else-if="col.field === 'email' || col.field === 'address'" #body="slotProps">
          <div class="max-w-xs truncate" :title="slotProps.data[col.field]">
            {{ slotProps.data[col.field] }}
          </div>
        </template>
        <template v-else-if="col.field === 'role'" #body="slotProps">
          <LwpStatusTag :value="formatRoleLabel(slotProps.data.role)" />
        </template>
        <template
          v-else-if="col.field === 'is_baptized' || col.field === 'is_member'"
          #body="slotProps"
        >
          <LwpStatusTag :value="slotProps.data[col.field] ? 'OK' : 'PENDING'" />
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

    <UserRoleModal
      :key="JSON.stringify(selectedItem)"
      v-model:visible="showModal"
      :user="selectedItem"
      @close="handleModalClose"
    />
  </PageWrapper>
</template>
