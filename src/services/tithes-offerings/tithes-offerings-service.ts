import supabase from '@lib/supabaseClient.ts'
import type { SingleSupabaseResponse } from '@/types/supabase-response.ts'
import type { TithesOfferingsSettings } from '@/types/tithes-offerings/tithes-offerings.ts'

export const sbQueryTithesOfferingsSettings = async (): Promise<SingleSupabaseResponse<TithesOfferingsSettings>> => {
  const { data, error } = await supabase
    .from('tithes_offerings_settings')
    .select('*')
    .maybeSingle()
    .returns<TithesOfferingsSettings>()

  if (error) {
    console.error(error.code, error.message)
    return { data: null, error }
  }

  return { data, error: undefined }
}

export const sbUpsertTithesOfferingsSettings = async (
  settings: TithesOfferingsSettings,
): Promise<SingleSupabaseResponse<TithesOfferingsSettings>> => {
  const { data, error } = await supabase
    .from('tithes_offerings_settings')
    .upsert(settings)
    .select()
    .maybeSingle()
    .returns<TithesOfferingsSettings>()

  if (error) {
    console.error(error.code, error.message)
    return { data: null, error }
  }

  return { data, error: undefined }
}
