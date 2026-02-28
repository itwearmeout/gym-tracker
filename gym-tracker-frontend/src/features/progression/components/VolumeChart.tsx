import type { VolumeProgressionPoint } from '../types'

interface ChartPoint {
  x: number
  y: number
  label: string
  value: number
}

const WIDTH = 640
const HEIGHT = 240
const PADDING_X = 28
const PADDING_Y = 24

function buildPoints(data: VolumeProgressionPoint[]): ChartPoint[] {
  if (!data.length) {
    return []
  }

  const volumes = data.map((entry) => entry.totalVolume)
  const minVolume = Math.min(...volumes)
  const maxVolume = Math.max(...volumes)
  const range = maxVolume - minVolume || 1
  const usableWidth = WIDTH - PADDING_X * 2
  const usableHeight = HEIGHT - PADDING_Y * 2

  return data.map((entry, index) => {
    const x = PADDING_X + (index / Math.max(1, data.length - 1)) * usableWidth
    const y = HEIGHT - PADDING_Y - ((entry.totalVolume - minVolume) / range) * usableHeight

    return {
      x,
      y,
      label: new Date(entry.periodStart).toLocaleDateString(),
      value: entry.totalVolume,
    }
  })
}

function buildPath(points: ChartPoint[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

export function VolumeChart({ data }: { data: VolumeProgressionPoint[] }) {
  const points = buildPoints(data)

  if (!points.length) {
    return (
      <div className="flex h-56 items-center justify-center border border-zinc-800 bg-black text-sm text-zinc-500">
        No workout volume data yet.
      </div>
    )
  }

  return (
    <div className="border border-zinc-800 bg-black p-3">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-56 w-full" role="img" aria-label="Volume progression chart">
        <line x1={PADDING_X} y1={HEIGHT - PADDING_Y} x2={WIDTH - PADDING_X} y2={HEIGHT - PADDING_Y} stroke="#3f3f46" strokeWidth={1} />
        <line x1={PADDING_X} y1={PADDING_Y} x2={PADDING_X} y2={HEIGHT - PADDING_Y} stroke="#3f3f46" strokeWidth={1} />
        <path d={buildPath(points)} fill="none" stroke="white" strokeWidth={2} />

        {points.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r={3.5} fill="white" />
            <title>{`${point.label}: ${Math.round(point.value).toLocaleString()}`}</title>
          </g>
        ))}
      </svg>
    </div>
  )
}
