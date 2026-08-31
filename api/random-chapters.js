// Vercel serverless function (Node runtime). Mirrors podcasts/api.py's
// GET /api/random-chapters route — same DATABASE_URL requirement and
// schema dependency as api/filter-options.js. See DEPLOYMENT.md.

const { Pool } = require('pg')

const LOOKBACK_DAYS = 7

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

  const genreFilter = req.query.genre || null
  const topicFilter = req.query.topic || null
  const topicParam = topicFilter ? `%${topicFilter}%` : null
  const sevenDaysAgo = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)

  const client = await getPool().connect()
  try {
    const episodeResult = await client.query(
      `
      WITH RecentEpisodesWithChapters AS (
        SELECT DISTINCT e.id
        FROM episodes e
        JOIN chapters c ON e.id = c.episode_id
        JOIN podcasts p ON e.podcast_id = p.id
        WHERE e.pub_date >= $1
        AND ($2::text IS NULL OR p.genre = $2)
        AND ($3::text IS NULL OR p.topics ILIKE $3)
      )
      SELECT e.id, p.title AS podcast_title, e.title AS episode_title,
             e.audio_url, p.artwork_url, e.pub_date
      FROM episodes e
      JOIN podcasts p ON e.podcast_id = p.id
      JOIN RecentEpisodesWithChapters rec ON e.id = rec.id
      ORDER BY RANDOM()
      LIMIT 1;
      `,
      [sevenDaysAgo, genreFilter, topicParam]
    )

    if (episodeResult.rows.length === 0) {
      res.status(200).json([])
      return
    }

    const ep = episodeResult.rows[0]

    const chaptersResult = await client.query(
      `SELECT start_time, end_time, title, confidence, description
       FROM chapters WHERE episode_id = $1 ORDER BY start_time;`,
      [ep.id]
    )

    const chapters = chaptersResult.rows.map((c) => ({
      id: ep.id,
      podcast_title: ep.podcast_title,
      episode_title: ep.episode_title,
      chapter_title: c.title,
      chapter_description: c.description,
      artwork_url: ep.artwork_url,
      audio_url: ep.audio_url,
      pub_date: ep.pub_date ? new Date(ep.pub_date).toISOString() : null,
      start_time: c.start_time,
      end_time: c.end_time,
      confidence: c.confidence,
    }))

    res.status(200).json(chapters)
  } catch (err) {
    console.error('random-chapters error:', err)
    res.status(500).json({ error: 'Database error' })
  } finally {
    client.release()
  }
}
