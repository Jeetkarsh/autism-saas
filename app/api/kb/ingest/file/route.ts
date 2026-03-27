export const dynamic = 'force-dynamic'

import { createClient } from '../../../../../lib/supabase/server'

const RAG_BASE = process.env.RAG_SERVICE_URL || 'http://localhost:8100'
const RAG_API_KEY = process.env.RAG_API_KEY || 'development_secret_key'

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // RBAC: Only explicitly flagged admins can ingest data
    if (session.user.user_metadata?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    // Forward file to Python service
    const pyFormData = new FormData()
    pyFormData.append('file', file)
    pyFormData.append('user_id', session.user.id)

    const res = await fetch(`${RAG_BASE}/ingest/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAG_API_KEY}`
      },
      body: pyFormData,
    })

    const data = await res.json()

    if (!res.ok) {
      return Response.json({ error: data.detail || 'Ingestion failed' }, { status: res.status })
    }

    return Response.json(data)
  } catch (error) {
    return Response.json({ error: 'Failed to connect to knowledge service' }, { status: 502 })
  }
}
