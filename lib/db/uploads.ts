import type { TypedSupabaseClient, DataUploadRow, DataUploadInsert, UploadStatus } from '@/types/database'

export interface UploadStatusUpdate {
  status: UploadStatus
  records_total?: number
  records_imported?: number
  records_skipped?: number
  records_errored?: number
  error_log?: Record<string, unknown>[]
  completed_at?: string
}

export async function createUpload(
  client: TypedSupabaseClient,
  payload: Omit<DataUploadInsert, 'status'>
): Promise<DataUploadRow> {
  const { data, error } = await client
    .from('data_uploads')
    .insert({ ...payload, status: 'processing' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUploadStatus(
  client: TypedSupabaseClient,
  uploadId: string,
  update: UploadStatusUpdate
): Promise<DataUploadRow> {
  const { data, error } = await client
    .from('data_uploads')
    .update(update)
    .eq('id', uploadId)
    .select()
    .single()

  if (error) throw error
  return data
}
