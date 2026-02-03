import type { LwpPagination } from '@/types/lwpPagination.ts'
import type { LwpSort } from '@/types/lwpSort.ts'
import type { LwpFilter } from '@/types/lwpFilter.ts'
import type { User } from '@/types/user/user.ts'
import type { SupabaseResponse } from '@/types/supabase-response.ts'
import supabase from '@lib/supabaseClient.ts'

export const sbQueryUsers = async (pagination: LwpPagination, sort: LwpSort, filter?: LwpFilter): Promise<SupabaseResponse<User>> => {
  const query = supabase.from('user_profile_view').select('*', {count: "exact"});

  if (filter) {
    if (filter.searchText.trim()) query.textSearch('first_name', formatSearchText(filter.searchText), { type: 'websearch', config: 'english' });
  }

  const { data, error, count } = await query.range(pagination.from, pagination.to)
    .order(sort.column, {ascending: sort.order == 'asc'})
    .returns<User[]>();

  if (error) {
    console.error(error.code, error.message);
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

const formatSearchText = (searchText: string, and = false) => {
  const split = searchText.split(' ');
  const quotedParts = split.map(part => `'${part.trim()}'`);

  if (and) return quotedParts.join(' & ')
  else return quotedParts.join(' | ')
}
