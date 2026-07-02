import { supabase, hasSupabase } from './supabase'

// ====== 写入使用日志（Supabase 不可达时静默跳过） ======
export async function logUsage(params: {
  userId: string
  scene: string
  success: boolean
}): Promise<void> {
  if (!hasSupabase) {
    console.log(`[ANALYTICS] user_id=${params.userId} scene=${params.scene} success=${params.success}`)
    return
  }

  try {
    const { error } = await supabase!.from('usage_logs').insert({
      user_id: params.userId,
      scene: params.scene,
      success: params.success,
    })

    if (error) {
      console.error(`[ANALYTICS] 写入失败: ${error.message}`)
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[ANALYTICS] Supabase 不可达，跳过日志: ${reason}`)
    console.log(`[ANALYTICS] user_id=${params.userId} scene=${params.scene} success=${params.success}`)
  }
}