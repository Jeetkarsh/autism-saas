const RAG_BASE = process.env.RAG_SERVICE_URL || 'http://localhost:8100'

export async function GET() {
  try {
    const res = await fetch(`${RAG_BASE}/health`)
    const data = await res.json()
    return Response.json(data)
  } catch (error) {
    return Response.json(
      { status: 'error', message: 'Knowledge service unavailable' },
      { status: 502 }
    )
  }
}
