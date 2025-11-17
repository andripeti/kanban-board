"use client"
import { updateTask } from '../lib/api/tasks'

export default function KanbanBoard({ tasks = [], onMoved }){
  const columns = [
    { key: 'todo', title: 'To Do' },
    { key: 'in-progress', title: 'In Progress' },
    { key: 'done', title: 'Done' }
  ]

  async function move(task, toStatus){
    try{
      const updated = await updateTask(task._id, { status: toStatus })
      if (onMoved) onMoved(updated)
    }catch(err){
      alert(err.message)
    }
  }

  return (
    <div className="kanban">
      {columns.map(col => (
        <div key={col.key} className="column">
          <h3>{col.title}</h3>
          {tasks.filter(t=>t.status === col.key).map(t=> (
            <div key={t._id} className="card">
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <strong>{t.title}</strong>
                <span style={{fontSize:12,color:'#9aa6b8'}}>{t.priority}</span>
              </div>
              <div style={{marginTop:6,color:'#9aa6b8'}}>{t.description}</div>
              <div style={{marginTop:8,display:'flex',gap:8}}>
                {col.key !== 'todo' && <button className="btn secondary" onClick={()=>move(t,'todo')}>To Do</button>}
                {col.key !== 'in-progress' && <button className="btn" onClick={()=>move(t,'in-progress')}>In Progress</button>}
                {col.key !== 'done' && <button className="btn" onClick={()=>move(t,'done')}>Done</button>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
