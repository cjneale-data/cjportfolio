// Vercel serverless function (Node runtime). Mirrors podcasts/api.py's
// GET /api/filter-options route so the deployed player.html can hit this
// same-origin instead of http://127.0.0.1:5000 (which only exists on the
// author's machine). Needs DATABASE_URL (Neon's pooled connection string)
// pointed at the podflow-db project, whose schema/data is kept current by
// the ingestion pipeline documented in podcasts/RUNBOOK.md — see DEPLOYMENT.md.

const { Pool } = require('pg')

let pool
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }
  return pool
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: 'Podcast data is not configured yet.' })
    return
  }

  const client = await getPool().connect()
  try {
    const genreRows = await client.query(
      'SELECT DISTINCT genre FROM podcasts WHERE genre IS NOT NULL ORDER BY genre'
    )
    const genres = genreRows.rows.map((r) => r.genre)

    const topicRows = await client.query(
      'SELECT topics FROM podcasts WHERE topics IS NOT NULL'
    )
    const uniqueTopics = new Set()
    for (const row of topicRows.rows) {
      if (row.topics) {
        row.topics.split(',').forEach((t) => uniqueTopics.add(t.trim()))
      }
    }

    res.status(200).json({
      genres,
      topics: Array.from(uniqueTopics).sort(),
    })
  } catch (err) {
    console.error('filter-options error:', err)
    res.status(500).json({ error: 'Database error' })
  } finally {
    client.release()
  }
}
