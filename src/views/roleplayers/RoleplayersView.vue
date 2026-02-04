<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue'
import { Status } from '@/types/status.ts'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import { useRoleplayersStore } from '@stores/roleplayers/roleplayers.store.ts'
import LwpImage from '@components/lwp-image/LwpImage.vue'

const roleplayersStore = useRoleplayersStore()

onBeforeMount(async () => {
  await roleplayersStore.initRoleplayers()
})

const searchText = ref<string>(roleplayersStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await roleplayersStore.filterRoleplayers({
    ...roleplayersStore.filter,
    searchText: value,
  })

  await roleplayersStore.pageRoleplayers({
    ...roleplayersStore.pagination,
    from: 0,
    page: 0,
    to: roleplayersStore.pagination.limit - 1,
  })
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await roleplayersStore.pageRoleplayers({
    ...roleplayersStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await roleplayersStore.sortRoleplayers({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRefresh = async () => {
  await roleplayersStore.initRoleplayers()
}

watch(searchText, (value) => {
  onSearch(value)
})
</script>

<template>
  <PageWrapper show-toolbar title="Roleplayers" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search roleplayers..." />
      </IconField>
    </template>
    <DataTable
      :loading="roleplayersStore.status === Status.LOADING"
      :value="roleplayersStore.data"
      :rows="roleplayersStore.pagination.limit"
      :first="roleplayersStore.pagination.from"
      :total-records="roleplayersStore.pagination.count"
      :sortField="roleplayersStore.sort.column"
      :sortOrder="roleplayersStore.sort.order === 'asc' ? 1 : -1"
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
          No Roleplayers Found
        </p>
      </template>
      <Column
        v-for="col of roleplayersStore.tableColumns"
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
