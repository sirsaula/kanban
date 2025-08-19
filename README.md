# Kanban by Saula

<img width="647" height="412" alt="Screenshot 2025-08-19 at 11 27 01 AM" src="https://github.com/user-attachments/assets/abe171f0-c62e-464d-8cf4-91cd23330105" />

## Running App
You must have node installed and/or yarn

```bash
# (Node)
npm install && npm run dev
# (Yarn)
yarn install && npm run dev
```
Navigate to [localhost:](http://localhost:5173/)


---

## State Flow

```text
User action 
                 ↓
            dispatch(Action)
                 ↓
     reducer(BoardState, Action)  ──►  new BoardState
                 ↓
        Context Provider updates
                 ↓
   useEffect persists to localStorage
```

* Actions originate from UI events in `KanbanBoard`, `Column`, or `TaskCard` (clicking Add, dragging a card etc).
* The reducer in `BoardContext.tsx` to compute the next `BoardState` .
* The Provider re-renders subscribed components with the new state.
*  (`useEffect`) writes the latest state to `localStorage` under `personal-kanban-state-v1`.

## How it all renders

1. Vite serves `index.html` (dev) or the files in `dist/` (prod build).
2. **`src/main.tsx`** mounts React in StrictMode and renders `<App />` into the `#root` element.
3. **`src/App.tsx`** shows the page header and the `<KanbanBoard />` feature.
4. **`KanbanBoard.tsx`** sets up the `BoardProvider` (Context + `useReducer`), loads any saved board from `localStorage`, and composes the UI:
   * Add Task input, Filter box, and three Columns (`todo`, `inprogress`, `done`).
   * A simple istory feed showing recent actions.
5. **Drag & Drop:**

   * `TaskCard` sets `draggable` and writes the task id via `dataTransfer` on drag start.
   * `Column` listens for `onDragOver`/`onDrop` and dispatches a `move` action.
6. **State changes** trigger a re-render via Context; `useEffect` persists updates to `localStorage`.


---


    
### Drag & Drop
Uses ative HTML5 drag-and-drop.
- `TaskCard` sets `draggable` and writes the task id in `dataTransfer` during `onDragStart`.
- `Column` handles `onDragOver` (prevent default) and `onDrop`, then dispatches a `move` action.

  
**Stack:**
1. Styling: Tailwind CSS
2. SPA: React 19
3. State Management: React Context
4. Persistence: Local storage
