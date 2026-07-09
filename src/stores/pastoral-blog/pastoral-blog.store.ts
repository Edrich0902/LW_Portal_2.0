import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Status } from '@/types/status.ts'
import type { PastoralPost } from '@/types/pastoral-blog/pastoral-post.ts'
import {
  sbQueryPastoralPosts,
  sbCreatePastoralPost,
  sbUpdatePastoralPost,
  sbSetPastoralPostPublished,
  sbDeletePastoralPost,
} from '@services/pastoral-blog/pastoral-blog-service.ts'
import { useToast } from 'primevue/usetoast'
import {
  EMPTY_PASTORAL_CONTENT,
  normalizePastoralTitle,
} from '@/utils/pastoral-blog-content.ts'

export type PastoralAutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type PostPayload = {
  title: string
  content: string
  coverImageUrl?: string | null
  coverImagePublicId?: string | null
}

const normalizePayload = (payload: PostPayload): PostPayload => ({
  title: normalizePastoralTitle(payload.title),
  content: payload.content,
  coverImageUrl: payload.coverImageUrl ?? null,
  coverImagePublicId: payload.coverImagePublicId ?? null,
})

const upsertPostInList = (posts: PastoralPost[], updated: PastoralPost): PastoralPost[] => {
  const index = posts.findIndex((post) => post.id === updated.id)
  if (index === -1) {
    return [updated, ...posts]
  }

  const next = [...posts]
  next[index] = { ...next[index], ...updated }
  return next
}

export const usePastoralBlogStore = defineStore('pastoralBlogStore', () => {
  const toast = useToast()
  const postsStatus = ref<Status>(Status.UNINITIALIZED)
  const actionStatus = ref<Status>(Status.OK)
  const autosaveStatus = ref<PastoralAutosaveStatus>('idle')
  const lastSavedAt = ref<Date | null>(null)
  const posts = ref<PastoralPost[]>([])

  const loadPosts = async () => {
    postsStatus.value = Status.LOADING
    const response = await sbQueryPastoralPosts()

    if (response.error) {
      postsStatus.value = Status.ERROR
      return
    }

    posts.value = response.data
    postsStatus.value = Status.OK
  }

  const createDraftPost = async (): Promise<string | null> => {
    actionStatus.value = Status.LOADING
    const response = await sbCreatePastoralPost({
      title: 'Untitled',
      content: EMPTY_PASTORAL_CONTENT,
      coverImageUrl: null,
      coverImagePublicId: null,
    })

    if (response.error || !response.data) {
      actionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Could Not Create Draft', life: 3000 })
      return null
    }

    posts.value = upsertPostInList(posts.value, response.data)
    actionStatus.value = Status.OK
    autosaveStatus.value = 'saved'
    lastSavedAt.value = new Date()
    return response.data.id
  }

  const autosavePost = async (postId: string, payload: PostPayload): Promise<boolean> => {
    autosaveStatus.value = 'saving'
    const response = await sbUpdatePastoralPost(postId, normalizePayload(payload))

    if (response.error || !response.data) {
      autosaveStatus.value = 'error'
      return false
    }

    posts.value = upsertPostInList(posts.value, response.data)
    autosaveStatus.value = 'saved'
    lastSavedAt.value = new Date()
    return true
  }

  const markAutosaveSaved = () => {
    autosaveStatus.value = 'saved'
    lastSavedAt.value = new Date()
  }

  const createPost = async (payload: PostPayload): Promise<boolean> => {
    actionStatus.value = Status.LOADING
    const response = await sbCreatePastoralPost(normalizePayload(payload))

    if (response.error) {
      actionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Creating Post', life: 3000 })
      return false
    }

    if (response.data) {
      posts.value = upsertPostInList(posts.value, response.data)
    }

    actionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Post Created', life: 3000 })
    return true
  }

  const updatePost = async (postId: string, payload: PostPayload): Promise<boolean> => {
    actionStatus.value = Status.LOADING
    const response = await sbUpdatePastoralPost(postId, normalizePayload(payload))

    if (response.error) {
      actionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Post', life: 3000 })
      return false
    }

    if (response.data) {
      posts.value = upsertPostInList(posts.value, response.data)
    }

    actionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Post Updated', life: 3000 })
    return true
  }

  const setPublished = async (postId: string, shouldPublish: boolean): Promise<boolean> => {
    actionStatus.value = Status.LOADING
    const response = await sbSetPastoralPostPublished(postId, shouldPublish)

    if (response.error) {
      actionStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: shouldPublish ? 'Error Publishing Post' : 'Error Unpublishing Post',
        life: 3000,
      })
      return false
    }

    posts.value = posts.value.map((p) =>
      p.id === postId ? { ...p, is_published: shouldPublish } : p,
    )
    actionStatus.value = Status.OK
    toast.add({
      severity: 'success',
      summary: shouldPublish ? 'Post Published' : 'Post Unpublished',
      life: 3000,
    })
    return true
  }

  const deletePost = async (postId: string): Promise<boolean> => {
    actionStatus.value = Status.LOADING
    const response = await sbDeletePastoralPost(postId)

    if (response.error) {
      actionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Deleting Post', life: 3000 })
      return false
    }

    posts.value = posts.value.filter((p) => p.id !== postId)
    actionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Post Deleted', life: 3000 })
    return true
  }

  return {
    postsStatus,
    actionStatus,
    autosaveStatus,
    lastSavedAt,
    posts,
    loadPosts,
    createDraftPost,
    autosavePost,
    markAutosaveSaved,
    createPost,
    updatePost,
    setPublished,
    deletePost,
  }
})
