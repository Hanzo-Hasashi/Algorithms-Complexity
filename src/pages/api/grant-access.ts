import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { userId, hasAccess, requestingUserId } = req.body

  if (!userId || !requestingUserId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Create admin client with service role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the requesting user is an admin
  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', requestingUserId)
    .single()

  if (!adminProfile?.is_admin) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  // Update user access
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ has_access: hasAccess })
    .eq('id', userId)

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ success: true })
}
