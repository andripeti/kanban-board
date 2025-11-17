"use client"
import { useCallback, useEffect, useState } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import TaskForm from '../components/TaskForm'
import TaskList from '../components/TaskList'
import { getTasks } from '../lib/api/tasks'

export default function Page(){
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async ()=>{
    setLoading(true)
    try{
      const data = await getTasks()
      setTasks(data)
      setError(null)
    }catch(err){
      setError(err.message)
    }finally{setLoading(false)}
  },[])

  useEffect(()=>{ fetchTasks() }, [fetchTasks])

  return (
    <div>
      <TaskForm onCreated={(t)=>{
        // refresh
        fetchTasks()
      }} />

      <div style={{display:'flex',gap:12}}>
        <div style={{flex:1}}>
          <h2>All Tasks</h2>
          {loading && <div>Loading...</div>}
          {error && <div style={{color:'salmon'}}>{error}</div>}
          {!loading && <TaskList tasks={tasks} onUpdated={()=>fetchTasks()} />}
        </div>
        <div style={{flex:2}}>
          <h2>Kanban Board</h2>
          <KanbanBoard tasks={tasks} onMoved={()=>fetchTasks()} />
        </div>
      </div>
    </div>
  )
}
