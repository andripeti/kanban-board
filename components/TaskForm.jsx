"use client"
import { useState } from 'react'
import { createTask } from '../lib/api/tasks'

export default function TaskForm({ onCreated }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if (!title.trim()) return setError('Title is required')
    setLoading(true)
    try{
      const created = await createTask({ title, description, priority, status: 'todo' })
      setTitle('')
      setDescription('')
      setPriority('medium')
      if (onCreated) onCreated(created)
    }catch(err){
      setError(err.message)
    }finally{setLoading(false)}
  }

  return (
    <form onSubmit={handleSubmit} style={{marginBottom:12}}>
      <div className="form-row">
        <input className="input" placeholder="Task title" value={title} onChange={e=>setTitle(e.target.value)} />
        <select className="input" value={priority} onChange={e=>setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn" disabled={loading}>{loading? 'Adding...' : 'Add'}</button>
      </div>
      <div style={{marginTop:8}}>
        <textarea className="input" rows={2} placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>
      {error && <div style={{color:'salmon',marginTop:8}}>{error}</div>}
    </form>
  )
}
