import { useMemo, useRef, useState } from 'react'
import type { ColumnId, TaskItem } from './types'
import { BoardProvider, useBoard } from './BoardContext'

const columns: { id: ColumnId; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
]

export function KanbanBoard() {
  return (
    <BoardProvider>
      <BoardInner />
    </BoardProvider>
  )
}

function BoardInner() {
  const { state, dispatch } = useBoard()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filteredColumns = useMemo(() => {
    const keyword = state.filter.trim().toLowerCase()
    if (!keyword) return state.columns
    return {
      todo: state.columns.todo.filter(t => t.title.toLowerCase().includes(keyword) || t.description?.toLowerCase().includes(keyword)),
      inprogress: state.columns.inprogress.filter(t => t.title.toLowerCase().includes(keyword) || t.description?.toLowerCase().includes(keyword)),
      done: state.columns.done.filter(t => t.title.toLowerCase().includes(keyword) || t.description?.toLowerCase().includes(keyword)),
    }
  }, [state.columns, state.filter])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    dispatch({ type: 'add', columnId: 'todo', title: trimmed, description })
    setTitle('')
    setDescription('')
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <form onSubmit={onSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task title"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button type="submit" className="rounded-md bg-sky-600 text-white px-3 py-2 text-sm hover:bg-sky-700">Add</button>
        </form>
        <input
          value={state.filter}
          onChange={(e) => dispatch({ type: 'filter', value: e.target.value })}
          placeholder="Filter tasks"
          className="w-full md:w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <Column key={col.id} columnId={col.id} title={col.title} tasks={filteredColumns[col.id]} />
        ))}
      </div>

      <HistoryLog />
    </div>
  )
}

function Column({ columnId, title, tasks }: { columnId: ColumnId; title: string; tasks: TaskItem[] }) {
  const { dispatch } = useBoard()

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  function onDrop(e: React.DragEvent) {
    const taskId = e.dataTransfer.getData('text/plain')
    const indexAttr = (e.currentTarget as HTMLElement).getAttribute('data-drop-index')
    const toIndex = indexAttr ? parseInt(indexAttr) : tasks.length
    if (taskId) {
      dispatch({ type: 'move', taskId, toColumn: columnId, toIndex })
    }
  }

  return (
    <div className="bg-slate-100 rounded-lg p-3 min-h-64">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-slate-700">{title}</h2>
        <span className="text-xs text-slate-500">{tasks.length}</span>
      </div>
      <div className="space-y-2" onDragOver={onDragOver} onDrop={onDrop}>
        {tasks.map((task, index) => (
          <TaskCard key={task.id} task={task} columnId={columnId} index={index} />
        ))}
        {/* Drop zone at end of column */}
        <div className="h-6" data-drop-index={tasks.length} />
      </div>
    </div>
  )
}

function TaskCard({ task, columnId, index }: { task: TaskItem; columnId: ColumnId; index: number }) {
  const { dispatch } = useBoard()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function onDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function onDrop(e: React.DragEvent) {
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId && taskId !== task.id) {
      dispatch({ type: 'move', taskId, toColumn: columnId, toIndex: index })
    }
  }

  function onEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.title) {
      dispatch({ type: 'editTitle', taskId: task.id, title: trimmed })
    }
    setIsEditing(false)
  }

  function onDelete() {
    dispatch({ type: 'delete', taskId: task.id })
  }

  return (
    <div
      className="bg-white rounded-md border border-slate-200 p-3 shadow-sm"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {isEditing ? (
        <form onSubmit={onEditSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={onEditSubmit}
            autoFocus
          />
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium text-slate-800 text-sm">{task.title}</div>
            {task.description && (
              <div className="text-xs text-slate-500 mt-0.5">{task.description}</div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function HistoryLog() {
  const { state } = useBoard()
  if (state.history.length === 0) return null
  return (
    <div className="mt-2">
      <h3 className="text-sm font-semibold text-slate-600 mb-1">Recent actions</h3>
      <ul className="text-xs text-slate-500 list-disc pl-5 space-y-0.5">
        {state.history.map((h, i) => (
          <li key={i}>{h}</li>
        ))}
      </ul>
    </div>
  )
}

