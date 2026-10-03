'use client'

import { useState } from 'react'

const WEBHOOK_URL =
  'https://services.leadconnectorhq.com/hooks/g3M6UdOmooTotmJzsT6a/webhook-trigger/857e42f4-aca2-4f20-9df2-a01317a7b7fa'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function UpdatesSignup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="not-prose my-8 rounded-3xl bg-sky-50 p-6 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10">
        <p className="font-display text-xl text-sky-900 dark:text-sky-400">
          You&apos;re on the list
        </p>
        <p className="mt-2 text-sky-800 dark:text-slate-300">
          When we publish a major update we&apos;ll send you an AI spec you can
          drop into your agent to intelligently upgrade your codebase.
        </p>
      </div>
    )
  }

  return (
    <div className="not-prose my-8 rounded-3xl bg-sky-50 p-6 dark:bg-slate-800/60 dark:ring-1 dark:ring-slate-300/10">
      <p className="font-display text-xl text-sky-900 dark:text-sky-400">
        Stay up to date
      </p>
      <p className="mt-2 text-sm text-sky-800 dark:text-slate-300">
        Nestled evolves over time — auth changes, security patches, new
        patterns. Because everyone&apos;s codebase diverges, we publish{' '}
        <strong>AI upgrade specs</strong> for major updates: drop the spec into
        your AI agent and it will intelligently reconcile the changes with your
        existing code.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="min-w-0 flex-1 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
          />
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="min-w-0 flex-1 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="rounded-full bg-sky-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-200 active:bg-sky-500 disabled:opacity-60"
          >
            {status === 'loading' ? 'Subscribing…' : 'Get AI upgrade specs'}
          </button>
          {status === 'error' && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Something went wrong — please try again.
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
