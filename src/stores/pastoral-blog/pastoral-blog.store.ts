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

export const usePastoralBlogStore = defineStore('pastoralBlogStore', () => {
  const toast = useToast()
  const postsStatus = ref<Status>(Status.UNINITIALIZED)
  const actionStatus = ref<Status>(Status.OK)
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

  const createPost = async (payload: {
    title: string
    content: string
    coverImageUrl?: string | null
    coverImagePublicId?: string | null
  }): Promise<boolean> => {
    actionStatus.value = Status.LOADING
    const response = await sbCreatePastoralPost(payload)

    if (response.error) {
      actionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Creating Post', life: 3000 })
      return false
    }

    actionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Post Created', life: 3000 })
    await loadPosts()
    return true
  }

  const updatePost = async (
    postId: string,
    payload: {
      title: string
      content: string
      coverImageUrl?: string | null
      coverImagePublicId?: string | null
    },
  ): Promise<boolean> => {
    actionStatus.value = Status.LOADING
    const response = await sbUpdatePastoralPost(postId, payload)

    if (response.error) {
      actionStatus.value = Status.ERROR
      toast.add({ severity: 'error', summary: 'Error Updating Post', life: 3000 })
      return false
    }

    actionStatus.value = Status.OK
    toast.add({ severity: 'success', summary: 'Post Updated', life: 3000 })
    await loadPosts()
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
    posts,
    loadPosts,
    createPost,
    updatePost,
    setPublished,
    deletePost,
  }
})
