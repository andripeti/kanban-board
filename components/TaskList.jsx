"use client"
import { useState } from 'react'
import { deleteTask as apiDelete, updateTask as apiUpdate } from '../lib/api/tasks'

export default function TaskList({ tasks = [], onUpdated }){
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})

  function startEdit(task){
    setEditingId(task._id)
    setEditValues({ title: task.title, description: task.description || '', priority: task.priority })
  }

  function cancel(){ setEditingId(null); setEditValues({}) }

  async function save(id){
    try{
      const updated = await apiUpdate(id, editValues)
      if (onUpdated) onUpdated(updated)
      cancel()
    }catch(err){
      alert(err.message)
    }
  }

  async function remove(id){
    if (!confirm('Delete this task?')) return
    try{
      await apiDelete(id)
      if (onUpdated) onUpdated()
    }catch(err){ alert(err.message) }
  }

  return (
    <div>
      {tasks.map(t=> (
        <div key={t._id} className="card">
          {editingId === t._id ? (
            <div>
              <input className="input" value={editValues.title} onChange={e=>setEditValues({...editValues,title:e.target.value})} />
              <textarea className="input" rows={2} value={editValues.description} onChange={e=>setEditValues({...editValues,description:e.target.value})} />
              <div className="form-row" style={{marginTop:8}}>
                <select className="input" value={editValues.priority} onChange={e=>setEditValues({...editValues,priority:e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button className="btn" onClick={()=>save(t._id)}>Save</button>
                <button className="btn secondary" onClick={cancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <strong>{t.title}</strong>
                <span style={{fontSize:12,color:'#9aa6b8'}}>{t.priority}</span>
              </div>
              <div style={{marginTop:6,color:'#9aa6b8'}}>{t.description}</div>
              <div style={{marginTop:8,display:'flex',gap:8}}>
                <button className="btn secondary" onClick={()=>startEdit(t)}>Edit</button>
                <button className="btn" onClick={()=>remove(t._id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
