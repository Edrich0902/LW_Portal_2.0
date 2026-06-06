import supabase from '@lib/supabaseClient.ts'
import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { SupabaseResponse, SingleSupabaseResponse } from '@/types/supabase-response.ts'
import type { Group } from '@/types/group/group.ts'
import type { GroupMembership } from '@/types/group/group-membership.ts'
import type { GroupPost } from '@/types/group/group-post.ts'

export const sbQueryConnectServeGroups = async (
  pagination: LwpPagination,
  sort: LwpSort,
  filter?: LwpFilter,
): Promise<SupabaseResponse<Group>> => {
  const query = supabase.from('groups_admin_view').select('*', { count: 'exact' })

  if (filter) {
    if (filter.searchText.trim())
      query.textSearch('title', formatSearchText(filter.searchText), {
        type: 'websearch',
        config: 'english',
      })
  }

  const { data, error, count } = await query
    .range(pagination.from, pagination.to)
    .order(sort.column, { ascending: sort.order == 'asc' })
    .returns<Group[]>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: [],
      error: error,
      count: count ?? 0,
    }
  }

  return {
    data: data,
    error: undefined,
    count: count ?? 0,
  }
}

export const sbQueryGroupMemberships = async (
  groupId: string,
): Promise<SupabaseResponse<GroupMembership>> => {
  const { data, error, count } = await supabase
    .from('group_memberships_view')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)
    .order('status', { ascending: true })
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })
    .returns<GroupMembership[]>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: [],
      error,
      count: count ?? 0,
    }
  }

  return {
    data: data ?? [],
    error: undefined,
    count: count ?? 0,
  }
}

export const sbGetConnectServeGroup = async (
  groupId: string,
): Promise<SingleSupabaseResponse<Group>> => {
  const { data, error } = await supabase
    .from('groups_admin_view')
    .select('*')
    .eq('id', groupId)
    .single<Group>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data,
    error: undefined,
  }
}

export const sbCreateConnectServeGroup = async (
  group: Group,
): Promise<SingleSupabaseResponse<Group>> => {
  const { data, error } = await supabase.from('groups').insert(group).single<Group>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error: error,
    }
  }

  return {
    data: data,
    error: undefined,
  }
}

export const sbUpdateConnectServeGroup = async (
  group: Group,
): Promise<SingleSupabaseResponse<Group>> => {
  const { data, error } = await supabase
    .from('groups')
    .update(group)
    .eq('id', group.id)
    .single<Group>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error: error,
    }
  }

  return {
    data: data,
    error: undefined,
  }
}

export const sbDeleteConnectServeGroup = async (
  group: Group,
): Promise<SingleSupabaseResponse<Group>> => {
  const { data, error } = await supabase.from('groups').delete().eq('id', group.id).single<Group>()

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error: error,
    }
  }

  return {
    data: data,
    error: undefined,
  }
}

export const sbApproveGroupMembership = async (
  groupId: string,
  userId: string,
): Promise<SingleSupabaseResponse<GroupMembership>> => {
  const { data, error } = await supabase.rpc('approve_group_membership', {
    target_group_id: groupId,
    target_user_id: userId,
  })

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data: data as GroupMembership,
    error: undefined,
  }
}

export const sbDeclineGroupMembership = async (
  groupId: string,
  userId: string,
): Promise<SingleSupabaseResponse<GroupMembership>> => {
  const { data, error } = await supabase.rpc('decline_group_membership', {
    target_group_id: groupId,
    target_user_id: userId,
  })

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data: data as GroupMembership,
    error: undefined,
  }
}

export const sbRemoveGroupMember = async (
  groupId: string,
  userId: string,
): Promise<SingleSupabaseResponse<GroupMembership>> => {
  const { data, error } = await supabase.rpc('remove_group_member', {
    target_group_id: groupId,
    target_user_id: userId,
  })

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data: data as GroupMembership,
    error: undefined,
  }
}

export const sbSetGroupLeader = async (
  groupId: string,
  userId: string,
  shouldBeLeader: boolean,
): Promise<SingleSupabaseResponse<GroupMembership>> => {
  const { data, error } = await supabase.rpc('set_group_leader', {
    target_group_id: groupId,
    target_user_id: userId,
    should_be_leader: shouldBeLeader,
  })

  if (error) {
    console.error(error.code, error.message)
    return {
      data: null,
      error,
    }
  }

  return {
    data: data as GroupMembership,
    error: undefined,
  }
}

export const sbQueryGroupPosts = async (
  groupId: string,
): Promise<SupabaseResponse<GroupPost>> => {
  const { data, error, count } = await supabase
    .from('group_posts_view')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<GroupPost[]>()

  if (error) {
    return { data: [], count: 0, error }
  }

  return { data: data ?? [], count: count ?? 0, error: undefined }
}

export const sbSetGroupPostPinned = async (
  postId: string,
  shouldPin: boolean,
): Promise<SingleSupabaseResponse<void>> => {
  const { error } = await supabase.rpc('set_group_post_pinned', {
    target_post_id: postId,
    should_pin: shouldPin,
  })

  if (error) {
    return { data: null, error }
  }

  return { data: undefined, error: undefined }
}

export const sbDeleteGroupPost = async (
  postId: string,
): Promise<SingleSupabaseResponse<void>> => {
  const { error } = await supabase.rpc('delete_group_post', {
    target_post_id: postId,
  })

  if (error) {
    return { data: null, error }
  }

  return { data: undefined, error: undefined }
}

const formatSearchText = (searchText: string, and = false) => {
  const split = searchText.split(' ')
  const quotedParts = split.map((part) => `'${part.trim()}'`)

  if (and) return quotedParts.join(' & ')
  else return quotedParts.join(' | ')
}
