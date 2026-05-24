<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import moment from 'moment'
import PageWrapper from '@components/page-wrapper/PageWrapper.vue'
import LwpEmptyState from '@components/lwp-empty-state/LwpEmptyState.vue'
import LwpSkeletonTable from '@components/lwp-skeleton-table/LwpSkeletonTable.vue'
import LwpStatusTag from '@components/lwp-status-tag/LwpStatusTag.vue'
import { Status } from '@/types/status.ts'
import { useRolesStore } from '@stores/roles/roles.store.ts'
import RolesModal from '@views/roles/RolesModal.vue'

const rolesStore = useRolesStore()
const dt = ref()
const showModal = ref(false)

onBeforeMount(async () => {
  await rolesStore.initRoles()
})

const onRefresh = async () => {
  await rolesStore.initRoles()
}

const exportCSV = () => {
  dt.value.exportCSV()
}

const handleModalClose = async (refresh = false) => {
  if (refresh) await onRefresh()
}
</script>

<template>
  <PageWrapper show-toolbar title="Roles" class="flex flex-col">
    <LwpSkeletonTable v-if="rolesStore.status === Status.LOADING" :columns="3" :rows="8" />

    <DataTable
      v-else
      ref="dt"
      :value="rolesStore.data"
      data-key="id"
      striped-rows
      scrollable
      resizable-columns
      column-resize-mode="fit"
      scroll-height="flex"
      class="flex-1"
    >
      <template #header>
        <div class="flex flex-row items-center justify-end gap-2">
          <Button @click="showModal = true" icon="pi pi-plus" label="Add" size="small" rounded raised />
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
          title="No Roles Found"
          description="Create a role to make it available for user assignment."
        >
          <template #action>
            <Button label="Create Role" icon="pi pi-plus" @click="showModal = true" />
          </template>
        </LwpEmptyState>
      </template>

      <Column field="role" header="Role">
        <template #body="slotProps">
          <LwpStatusTag :value="slotProps.data.role" />
        </template>
      </Column>
      <Column field="id" header="ID">
        <template #body="slotProps">
          <div class="max-w-xs truncate font-mono text-xs" :title="slotProps.data.id">
            {{ slotProps.data.id }}
          </div>
        </template>
      </Column>
      <Column field="created_at" header="Created At">
        <template #body="slotProps">
          {{
            slotProps.data.created_at
              ? moment(slotProps.data.created_at).format('DD MMM YYYY HH:mm:ss')
              : 'N/A'
          }}
        </template>
      </Column>
    </DataTable>

    <RolesModal v-model:visible="showModal" @close="handleModalClose" />
  </PageWrapper>
</template>
