export const dynamic = 'force-dynamic'

import { createClient } from '../../../../lib/supabase/server'

const RAG_BASE = process.env.RAG_SERVICE_URL || 'http://localhost:8100'
const RAG_API_KEY = process.env.RAG_API_KEY || 'development_secret_key'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await fetch(`${RAG_BASE}/documents?user_id=${session.user.id}`, {
      headers: { 'Authorization': `Bearer ${RAG_API_KEY}` }
    })
    const data = await res.json()

    if (!res.ok) {
      return Response.json({ error: 'Failed to fetch documents' }, { status: res.status })
    }

    return Response.json(data)
  } catch (error) {
    return Response.json({ error: 'Failed to connect to knowledge service' }, { status: 502 })
  }
}

export async function DELETE(request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('id')

    if (!docId) {
      return Response.json({ error: 'Document ID is required' }, { status: 400 })
    }

    const res = await fetch(`${RAG_BASE}/documents/${docId}?user_id=${session.user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${RAG_API_KEY}` }
    })

    const data = await res.json()

    if (!res.ok) {
      return Response.json({ error: data.detail || 'Deletion failed' }, { status: res.status })
    }

    return Response.json(data)
  } catch (error) {
    return Response.json({ error: 'Failed to connect to knowledge service' }, { status: 502 })
  }
}
