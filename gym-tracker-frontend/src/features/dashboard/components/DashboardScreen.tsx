import { useEffect, useMemo, useState } from 'react'
import { getMe } from '../../auth/api/authApi'
import { getProgression } from '../../progression/api/progressionApi'
import { getLastVisit } from '../../visits/api/visitsApi'
import type { ProgressionResponse } from '../../progression/types'

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'No workouts logged yet'
  }

  return new Date(value).toLocaleString()
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-zinc-800 bg-black p-4">
      <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-lg text-zinc-100">{value}</p>
    </article>
  )
}

export function DashboardScreen() {
  const [profileEmail, setProfileEmail] = useState<string>('Loading...')
  const [lastVisit, setLastVisit] = useState<string | null>(null)
  const [progression, setProgression] = useState<ProgressionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard(): Promise<void> {
      try {
        setError(null)
        const [me, visit, progressionData] = await Promise.all([
          getMe(),
          getLastVisit(),
          getProgression('30d'),
        ])

        setProfileEmail(me.user.email)
        setLastVisit(visit.lastVisit)
        setProgression(progressionData)
      } catch {
        setError('Could not load dashboard data.')
      }
    }

    loadDashboard()
  }, [])

  const totalVolume = useMemo(() => {
    if (!progression) {
      return 0
    }

    return progression.volumeProgression.reduce((sum, point) => sum + point.totalVolume, 0)
  }, [progression])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.28em] uppercase text-zinc-500">Dashboard</p>
        <h1 className="mt-2 text-2xl md:text-3xl">Your training pulse</h1>
      </header>

      {error && <p className="border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Profile" value={profileEmail} />
        <MetricCard label="Last Visit" value={formatDateTime(lastVisit)} />
        <MetricCard
          label="Workout Days (30d)"
          value={String(progression?.workoutFrequency.workoutCount ?? 0)}
        />
        <MetricCard label="Total Volume (30d)" value={Math.round(totalVolume).toLocaleString()} />
      </div>
    </section>
  )
}
