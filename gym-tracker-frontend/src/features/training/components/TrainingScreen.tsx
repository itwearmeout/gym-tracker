import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createExercise,
  getExercises,
  getWorkoutLogs,
  logWorkout,
} from '../../exercises/api/exercisesApi'
import type { Exercise, WorkoutLog } from '../../exercises/types'
import {
  getOneRepMaxTargets,
  setOneRepMaxTarget,
  updateOneRepMaxTarget,
} from '../../one-rep-max/api/oneRepMaxApi'
import type { OneRepMaxTarget } from '../../one-rep-max/types'
import { ApiError } from '../../../utils/api'

type OneRepMode = 'set' | 'update'

function sortExercisesByName(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => a.name.localeCompare(b.name))
}

export function TrainingScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [targets, setTargets] = useState<OneRepMaxTarget[]>([])
  const [filterExerciseId, setFilterExerciseId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [exerciseName, setExerciseName] = useState('')
  const [exerciseCategory, setExerciseCategory] = useState('')

  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState(20)

  const [oneRepMode, setOneRepMode] = useState<OneRepMode>('set')
  const [targetExerciseId, setTargetExerciseId] = useState('')
  const [targetWeight, setTargetWeight] = useState(60)

  const sortedExercises = useMemo(() => sortExercisesByName(exercises), [exercises])

  const loadCoreData = useCallback(
    async (exerciseIdFilter?: string): Promise<void> => {
      const [exerciseData, targetData, logsData] = await Promise.all([
        getExercises(),
        getOneRepMaxTargets(),
        getWorkoutLogs(exerciseIdFilter),
      ])

      setExercises(exerciseData)
      setTargets(targetData)
      setLogs(logsData)

      if (!selectedExerciseId && exerciseData[0]) {
        setSelectedExerciseId(exerciseData[0].id)
        setTargetExerciseId(exerciseData[0].id)
      }
    },
    [selectedExerciseId],
  )

  useEffect(() => {
    async function initialize(): Promise<void> {
      try {
        setIsLoading(true)
        setError(null)
        await loadCoreData()
      } catch {
        setError('Could not load training data.')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [loadCoreData])

  async function handleCreateExercise(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)

    try {
      await createExercise({ name: exerciseName, category: exerciseCategory })
      setExerciseName('')
      setExerciseCategory('')
      await loadCoreData(filterExerciseId || undefined)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create exercise.')
    }
  }

  async function handleLogWorkout(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)

    try {
      await logWorkout({
        exerciseId: selectedExerciseId,
        sets,
        reps,
        weight,
      })
      await loadCoreData(filterExerciseId || undefined)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log workout.')
    }
  }

  async function handleOneRepTarget(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)

    try {
      if (oneRepMode === 'set') {
        await setOneRepMaxTarget({
          exerciseId: targetExerciseId,
          weight: targetWeight,
        })
      } else {
        await updateOneRepMaxTarget(targetExerciseId, {
          weight: targetWeight,
        })
      }

      await loadCoreData(filterExerciseId || undefined)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update 1RM target.')
    }
  }

  async function handleFilterChange(nextExerciseId: string): Promise<void> {
    setFilterExerciseId(nextExerciseId)

    try {
      const nextLogs = await getWorkoutLogs(nextExerciseId || undefined)
      setLogs(nextLogs)
    } catch {
      setError('Could not filter workout logs.')
    }
  }

  const exerciseById = useMemo(() => {
    return Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise]))
  }, [exercises])

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs tracking-[0.28em] uppercase text-zinc-500">Training</p>
        <h1 className="mt-2 text-2xl md:text-3xl">Exercises, logs and 1RM</h1>
      </header>

      {error && <p className="border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200">{error}</p>}
      {isLoading && <p className="text-sm text-zinc-500">Loading training data...</p>}

      <div className="grid gap-4 xl:grid-cols-3">
        <form className="space-y-3 border border-zinc-800 bg-black p-4" onSubmit={handleCreateExercise}>
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">Create Exercise</p>
          <input
            required
            value={exerciseName}
            onChange={(event) => setExerciseName(event.target.value)}
            placeholder="Exercise name"
            className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
          />
          <input
            required
            value={exerciseCategory}
            onChange={(event) => setExerciseCategory(event.target.value)}
            placeholder="Category"
            className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
          />
          <button className="w-full border border-white bg-white px-3 py-2 text-xs tracking-[0.2em] uppercase text-black transition hover:bg-black hover:text-white">
            Save exercise
          </button>
        </form>

        <form className="space-y-3 border border-zinc-800 bg-black p-4" onSubmit={handleLogWorkout}>
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">Log Workout</p>
          <select
            required
            value={selectedExerciseId}
            onChange={(event) => setSelectedExerciseId(event.target.value)}
            className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
          >
            {sortedExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <input
              required
              type="number"
              min={1}
              value={sets}
              onChange={(event) => setSets(Number(event.target.value))}
              className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
            />
            <input
              required
              type="number"
              min={1}
              value={reps}
              onChange={(event) => setReps(Number(event.target.value))}
              className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
            />
            <input
              required
              type="number"
              min={0.5}
              step={0.5}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
              className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
            />
          </div>
          <button className="w-full border border-white bg-white px-3 py-2 text-xs tracking-[0.2em] uppercase text-black transition hover:bg-black hover:text-white">
            Save log
          </button>
        </form>

        <form className="space-y-3 border border-zinc-800 bg-black p-4" onSubmit={handleOneRepTarget}>
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">One-Rep Max</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`border px-2 py-2 text-xs tracking-[0.18em] uppercase ${
                oneRepMode === 'set' ? 'border-white bg-white text-black' : 'border-zinc-700 text-zinc-300'
              }`}
              onClick={() => setOneRepMode('set')}
            >
              Set
            </button>
            <button
              type="button"
              className={`border px-2 py-2 text-xs tracking-[0.18em] uppercase ${
                oneRepMode === 'update' ? 'border-white bg-white text-black' : 'border-zinc-700 text-zinc-300'
              }`}
              onClick={() => setOneRepMode('update')}
            >
              Update
            </button>
          </div>

          <select
            required
            value={targetExerciseId}
            onChange={(event) => setTargetExerciseId(event.target.value)}
            className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
          >
            {sortedExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>

          <input
            required
            type="number"
            min={0.5}
            step={0.5}
            value={targetWeight}
            onChange={(event) => setTargetWeight(Number(event.target.value))}
            className="w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
          />

          <button className="w-full border border-white bg-white px-3 py-2 text-xs tracking-[0.2em] uppercase text-black transition hover:bg-black hover:text-white">
            {oneRepMode === 'set' ? 'Set target' : 'Update target'}
          </button>
        </form>
      </div>

      <article className="border border-zinc-800 bg-black p-4">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-xs tracking-[0.2em] uppercase text-zinc-500">Workout Logs</p>
          <select
            value={filterExerciseId}
            onChange={(event) => {
              void handleFilterChange(event.target.value)
            }}
            className="border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-white"
          >
            <option value="">All exercises</option>
            {sortedExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {logs.length === 0 && <p className="text-sm text-zinc-500">No logs yet.</p>}
          {logs.map((log) => (
            <div key={log.id} className="grid gap-1 border border-zinc-900 bg-zinc-950 p-3 text-sm md:grid-cols-5">
              <p>{exerciseById[log.exerciseId]?.name ?? 'Unknown exercise'}</p>
              <p>{log.sets} sets</p>
              <p>{log.reps} reps</p>
              <p>{log.weight} kg</p>
              <p className="text-zinc-400">{new Date(log.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="border border-zinc-800 bg-black p-4">
        <p className="mb-3 text-xs tracking-[0.2em] uppercase text-zinc-500">1RM Targets</p>
        <div className="space-y-2">
          {targets.length === 0 && <p className="text-sm text-zinc-500">No 1RM targets set yet.</p>}
          {targets.map((target) => (
            <div
              key={target.id}
              className="grid gap-1 border border-zinc-900 bg-zinc-950 p-3 text-sm md:grid-cols-3"
            >
              <p>{exerciseById[target.exerciseId]?.name ?? target.exerciseId}</p>
              <p>{target.weight} kg</p>
              <p className="text-zinc-400">{new Date(target.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
