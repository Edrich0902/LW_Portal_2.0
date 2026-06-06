<script setup lang="ts">
import { onBeforeMount, ref, watch } from 'vue'
import { debounce } from 'lodash'
import type { DataTablePageEvent, DataTableRowClickEvent, DataTableSortEvent } from 'primevue'
import { Status } from '@/types/status.ts'
import moment from 'moment'
import { useRoute, useRouter } from 'vue-router'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpImage from '@components/lwp-image/LwpImage.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpStatusTag from '@components/lwp-status-tag/LwpStatusTag.vue'
import { useConnectServeStore } from '@stores/connect-serve/connect-serve.store.ts'
import ConnectServeModal from '@views/connect-serve/ConnectServeModal.vue'
import type { Group } from '@/types/group/group.ts'

const connectServeStore = useConnectServeStore()
const route = useRoute()
const router = useRouter()

const dt = ref()
const showModal = ref<boolean>(false)
const selectedItem = ref<Group>()

onBeforeMount(async () => {
  await connectServeStore.initConnectServeGroups()

  const editId = typeof route.query.edit === 'string' ? route.query.edit : ''
  if (!editId) return

  selectedItem.value = connectServeStore.data.find((group) => group.id === editId)
  if (!selectedItem.value) {
    await connectServeStore.loadConnectServeGroup(editId)
    selectedItem.value = connectServeStore.currentGroup ?? undefined
  }

  if (selectedItem.value) {
    showModal.value = true
    await router.replace({ query: { ...route.query, edit: undefined } })
  }
})

const searchText = ref<string>(connectServeStore.filter.searchText)

const onSearch = debounce(async (value: string) => {
  await connectServeStore.filterConnectServeGroups({
    ...connectServeStore.filter,
    searchText: value,
  })

  await connectServeStore.pageConnectServeGroups({
    ...connectServeStore.pagination,
    from: 0,
    page: 0,
    to: connectServeStore.pagination.limit - 1,
  })
}, 400)

const onPage = async (event: DataTablePageEvent) => {
  await connectServeStore.pageConnectServeGroups({
    ...connectServeStore.pagination,
    from: event.first,
    limit: event.rows,
    page: event.page,
    to: event.first + event.rows - 1,
  })
}

const onSort = async (event: DataTableSortEvent) => {
  if (typeof event.sortField !== 'string') return
  await connectServeStore.sortConnectServeGroups({
    column: event.sortField,
    order: event.sortOrder === 1 ? 'asc' : 'desc',
  })
}

const onRowClick = (event: DataTableRowClickEvent) => {
  selectedItem.value = event.data as Group
  showModal.value = true
}

const onAdd = () => {
  selectedItem.value = undefined
  showModal.value = true
}

const onManage = async (event: MouseEvent, group: Group) => {
  event.stopPropagation()
  await router.push(`/connect-serve/${group.id}/manage`)
}

const onRefresh = async () => {
  await connectServeStore.initConnectServeGroups()
}

const exportCSV = () => {
  dt.value.exportCSV()
}

const handleModalClose = (refresh: boolean = false) => {
  if (refresh) onRefresh()
}

watch(searchText, (value) => {
  onSearch(value)
})
</script>

<template>
  <PageWrapper show-toolbar title="Connect & Serve" class="flex flex-col">
    <template #search>
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchText" placeholder="Search connect & serve groups..." />
      </IconField>
    </template>

    <LwpSkeletonTable v-if="connectServeStore.status === Status.LOADING" :columns="5" :rows="10" />

    <DataTable
      v-else
      ref="dt"
      :value="connectServeStore.data"
      :rows="connectServeStore.pagination.limit"
      :first="connectServeStore.pagination.from"
      :total-records="connectServeStore.pagination.count"
      :sortField="connectServeStore.sort.column"
      :sortOrder="connectServeStore.sort.order === 'asc' ? 1 : -1"
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
          <Button @click="onAdd" icon="pi pi-plus" label="Add" size="small" rounded raised />
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
          title="No Connect & Serve Groups Found"
          description="Try adjusting your search or add a new group to get started."
        >
          <template #action>
            <Button label="Create Group" icon="pi pi-plus" @click="onAdd" />
          </template>
        </LwpEmptyState>
      </template>
      <Column
        v-for="col of connectServeStore.tableColumns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="true"
      >
        <template v-if="col.field === 'banner_public_id'" #body="slotProps">
          <LwpImage
            :public-id="slotProps.data.banner_public_id"
            :height="40"
            :width="40"
            class-name="w-10 h-10 object-cover rounded-full shadow-sm"
            preview
          />
        </template>
        <template v-else-if="col.field === 'type'" #body="slotProps">
          <LwpStatusTag :value="slotProps.data[col.field]" />
        </template>
        <template
          v-else-if="
            col.field === 'leader_count' ||
            col.field === 'member_count' ||
            col.field === 'pending_count'
          "
          #body="slotProps"
        >
          <Tag severity="secondary">{{ slotProps.data[col.field] ?? 0 }}</Tag>
        </template>
        <template v-else-if="col.field === 'description'" #body="slotProps">
          <div class="max-w-xs truncate" :title="slotProps.data[col.field]">
            {{ slotProps.data[col.field] }}
          </div>
        </template>
        <template
          v-else-if="col.field === 'whatsappLink' || col.field === 'location'"
          #body="slotProps"
        >
          <div class="max-w-xs truncate" :title="slotProps.data[col.field]">
            {{ slotProps.data[col.field] || 'N/A' }}
          </div>
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
      <Column header="Manage" :exportable="false" style="width: 8rem">
        <template #body="slotProps">
          <Button
            label="Manage"
            icon="pi pi-users"
            size="small"
            severity="secondary"
            variant="outlined"
            @click="onManage($event, slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <ConnectServeModal
      :key="JSON.stringify(selectedItem)"
      v-model:visible="showModal"
      :group="selectedItem"
      @close="handleModalClose"
    />
  </PageWrapper>
</template>
