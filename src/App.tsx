import './App.css'
import { KanbanBoard } from './kanban/KanbanBoard'

function App() {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Personal Kanban</h1>
      <KanbanBoard />
    </div>
  )
}

export default App
