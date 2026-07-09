import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { usePastoralBlogStore } from '@stores/pastoral-blog/pastoral-blog.store.ts'
import {
  EMPTY_PASTORAL_CONTENT,
  isPastoralContentEmpty,
  normalizePastoralTitle,
} from '@/utils/pastoral-blog-content.ts'

type SaveSnapshot = {
  title: string
  content: string
  coverImageUrl: string | null
  coverImagePublicId: string | null
}

type AutosaveFields = {
  postId: Ref<string | undefined>
  title: Ref<string>
  content: Ref<string>
  coverImageUrl: Ref<string | null>
  coverImagePublicId: Ref<string | null>
  isHydrated: Ref<boolean>
}

const AUTOSAVE_DELAY_MS = 1500

const buildSnapshot = (fields: AutosaveFields): SaveSnapshot => ({
  title: normalizePastoralTitle(fields.title.value),
  content: isPastoralContentEmpty(fields.content.value)
    ? EMPTY_PASTORAL_CONTENT
    : fields.content.value,
  coverImageUrl: fields.coverImageUrl.value,
  coverImagePublicId: fields.coverImagePublicId.value,
})

const snapshotsEqual = (left: SaveSnapshot, right: SaveSnapshot): boolean =>
  left.title === right.title &&
  left.content === right.content &&
  left.coverImageUrl === right.coverImageUrl &&
  left.coverImagePublicId === right.coverImagePublicId

export const usePastoralBlogAutosave = (fields: AutosaveFields) => {
  const store = usePastoralBlogStore()
  const lastSavedSnapshot = ref<SaveSnapshot | null>(null)
  let autosaveTimer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let pendingSave = false

  const hasUnsavedChanges = (): boolean => {
    if (!lastSavedSnapshot.value) return false
    return !snapshotsEqual(lastSavedSnapshot.value, buildSnapshot(fields))
  }

  const runAutosave = async () => {
    const postId = fields.postId.value
    if (!postId || !fields.isHydrated.value) return

    const snapshot = buildSnapshot(fields)
    if (lastSavedSnapshot.value && snapshotsEqual(lastSavedSnapshot.value, snapshot)) return

    if (inFlight) {
      pendingSave = true
      return
    }

    inFlight = true
    const success = await store.autosavePost(postId, snapshot)
    if (success) {
      lastSavedSnapshot.value = snapshot
    }
    inFlight = false

    if (pendingSave) {
      pendingSave = false
      await runAutosave()
    }
  }

  const scheduleAutosave = () => {
    if (autosaveTimer) clearTimeout(autosaveTimer)
    autosaveTimer = setTimeout(() => {
      void runAutosave()
    }, AUTOSAVE_DELAY_MS)
  }

  const flushAutosave = async () => {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer)
      autosaveTimer = null
    }
    await runAutosave()
  }

  const markSnapshotSaved = (snapshot: SaveSnapshot) => {
    lastSavedSnapshot.value = snapshot
    store.markAutosaveSaved()
  }

  watch(
    () => [
      fields.title.value,
      fields.content.value,
      fields.coverImageUrl.value,
      fields.coverImagePublicId.value,
    ],
    () => {
      if (!fields.isHydrated.value || !fields.postId.value) return
      if (store.autosaveStatus !== 'saving') {
        store.autosaveStatus = 'idle'
      }
      scheduleAutosave()
    },
  )

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges() || store.autosaveStatus === 'saving') {
      event.preventDefault()
      event.returnValue = ''
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    if (autosaveTimer) clearTimeout(autosaveTimer)
    void flushAutosave()
  })

  onBeforeRouteLeave(async () => {
    await flushAutosave()
    return true
  })

  return {
    flushAutosave,
    markSnapshotSaved,
    hasUnsavedChanges,
  }
}
