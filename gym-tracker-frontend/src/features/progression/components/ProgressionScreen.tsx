import { useEffect, useMemo, useState } from 'react'
import { getProgression } from '../api/progressionApi'
import type { ProgressionResponse, ProgressionTimeframe } from '../types'
import { VolumeChart } from './VolumeChart'

const timeframeLabels: Record<ProgressionTimeframe, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  all: 'All Time',
}

export function ProgressionScreen() {
  const [selected, setSelected] = useState<ProgressionTimeframe>('30d')
  const [progressionMap, setProgressionMap] = useState<Partial<Record<ProgressionTimeframe, ProgressionResponse>>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadProgression(): Promise<void> {
      try {
        setError(null)
        setIsLoading(true)

        const [week, month, all] = await Promise.all([
          getProgression('7d'),
          getProgression('30d'),
          getProgression('all'),
        ])

        setProgressionMap({
          '7d': week,
          '30d': month,
          all,
        })
      } catch {
        setError('Could not load progression data.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProgression()
  }, [])

  const active = progressionMap[selected]

  const frequencyBlocks = useMemo(() => {
    const keys: ProgressionTimeframe[] = ['7d', '30d', 'all']
    const maxCount = Math.max(...keys.map((key) => progressionMap[key]?.workoutFrequency.workoutCount ?? 0), 1)

    return keys.map((key) => {
      const count = progressionMap[key]?.workoutFrequency.workoutCount ?? 0
      return {
        key,
        count,
        ratio: count / maxCount,
      }
    })
  }, [progressionMap])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.28em] uppercase text-zinc-500">Progression</p>
        <h1 className="mt-2 text-2xl md:text-3xl">Volume and consistency</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {(['7d', '30d', 'all'] as ProgressionTimeframe[]).map((timeframe) => (
          <button
            key={timeframe}
            type="button"
            className={`border px-4 py-2 text-xs tracking-[0.18em] uppercase transition ${
              selected === timeframe
                ? 'border-white bg-white text-black'
                : 'border-zinc-700 text-zinc-300 hover:border-zinc-400 hover:text-white'
            }`}
            onClick={() => setSelected(timeframe)}
          >
            {timeframeLabels[timeframe]}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Loading progression data...</p>}
      {error && <p className="border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200">{error}</p>}

      {active && (
        <>
          <article className="space-y-3">
            <p className="text-xs tracking-[0.18em] uppercase text-zinc-500">Volume Trend</p>
            <VolumeChart data={active.volumeProgression} />
          </article>

          <article className="border border-zinc-800 bg-black p-4">
            <p className="text-xs tracking-[0.18em] uppercase text-zinc-500">Workout Frequency</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {frequencyBlocks.map((block) => (
                <div key={block.key} className="space-y-2">
                  <svg viewBox="0 0 100 130" className="h-28 w-full border border-zinc-800 bg-zinc-950 p-2">
                    <rect x="8" y="8" width="84" height="114" fill="none" stroke="#27272a" />
                    <rect
                      x="18"
                      y={18 + (1 - block.ratio) * 94}
                      width="64"
                      height={Math.max(8, block.ratio * 94)}
                      fill="#ffffff"
                    />
                  </svg>
                  <p className="text-center text-xs tracking-[0.18em] uppercase text-zinc-400">
                    {timeframeLabels[block.key]}
                  </p>
                  <p className="text-center text-sm text-zinc-100">{block.count} days</p>
                </div>
              ))}
            </div>
          </article>
        </>
      )}
    </section>
  )
}
