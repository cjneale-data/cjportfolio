#!/usr/bin/env node
// Offline eval harness for the resume-chat RAG endpoint.
// Scores grounded (factual) questions and refusal (out-of-scope) questions
// against api/chat.js, so retrieval/prompt changes get a pass-rate instead
// of a vibe check.
//
//   node eval/run-eval.js [baseUrl]      (default http://localhost:3000)

const fs = require('fs')
const path = require('path')

const baseUrl = process.argv[2] || process.env.EVAL_BASE_URL || 'http://localhost:3000'
const testset = JSON.parse(fs.readFileSync(path.join(__dirname, 'testset.json'), 'utf8'))

async function ask(question) {
  const start = Date.now()
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: question }] })
  })
  const data = await res.json().catch(() => ({}))
  return { reply: (data.reply || '').toLowerCase(), latencyMs: Date.now() - start, ok: res.ok }
}

function checkGrounded(reply, mustContain) {
  return mustContain.every(phrase => reply.includes(phrase.toLowerCase()))
}

function checkRefusal(reply, mustContainOneOf) {
  return mustContainOneOf.some(phrase => reply.includes(phrase.toLowerCase()))
}

async function runCategory(name, cases, checkFn, extractExpected) {
  console.log(`\n=== ${name} (${cases.length} cases) ===`)
  let passed = 0
  const latencies = []
  for (const c of cases) {
    const { reply, latencyMs, ok } = await ask(c.question)
    latencies.push(latencyMs)
    const pass = ok && checkFn(reply, extractExpected(c))
    if (pass) passed++
    console.log(`[${pass ? 'PASS' : 'FAIL'}] (${latencyMs}ms) ${c.question}`)
    if (!pass) console.log(`       reply: ${reply.slice(0, 140)}${reply.length > 140 ? '...' : ''}`)
  }
  const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
  console.log(`--- ${name}: ${passed}/${cases.length} passed, avg ${avgLatency}ms ---`)
  return { passed, total: cases.length }
}

async function main() {
  console.log(`Running chat eval against ${baseUrl}`)
  const grounded = await runCategory('Grounded (factual)', testset.grounded, checkGrounded, c => c.mustContain)
  const refusal = await runCategory('Refusal (out-of-scope)', testset.refusal, checkRefusal, c => c.mustContainOneOf)

  const totalPassed = grounded.passed + refusal.passed
  const totalCases = grounded.total + refusal.total
  const pct = Math.round((totalPassed / totalCases) * 100)

  console.log(`\n=== SUMMARY ===`)
  console.log(`Grounded: ${grounded.passed}/${grounded.total}`)
  console.log(`Refusal:  ${refusal.passed}/${refusal.total}`)
  console.log(`Overall:  ${totalPassed}/${totalCases} (${pct}%)`)

  if (totalPassed < totalCases) process.exitCode = 1
}

main().catch(err => {
  console.error('Eval run failed:', err)
  process.exitCode = 1
})
