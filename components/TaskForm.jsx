"use client"
import { useState, useEffect } from 'react'
import { createTask } from '../lib/api/tasks'
import { getTeams } from '../lib/api/teams'

export default function TaskForm({ onCreated, selectedTeamId }){
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [teamId, setTeamId] = useState(selectedTeamId || '')
  const [assignedTo, setAssignedTo] = useState('')
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      setTeamId(selectedTeamId)
    }
  }, [selectedTeamId])

  const fetchTeams = async () => {
    try {
      const { teams: fetchedTeams } = await getTeams()
      setTeams(fetchedTeams)
    } catch (err) {
      console.error('Failed to fetch teams:', err)
    }
  }

  const selectedTeam = teams.find(t => t._id === teamId)
  const teamMembers = selectedTeam?.members || []

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setLoading(true)
    try{
      const payload = {
        title,
        description,
        priority,
        status: 'todo',
        teamId: teamId || null,
        assignedTo: assignedTo || null
      }
      console.log('Creating task with payload:', payload)
      const created = await createTask(payload)
      console.log('Task created successfully:', created)
      setTitle('')
      setDescription('')
      setPriority('medium')
      setTeamId(selectedTeamId || '')
      setAssignedTo('')
      if (onCreated) {
        await onCreated(created)
      }
    }catch(err){
      console.error('Error creating task:', err)
      setError(err.message || 'Failed to create task. Please try again.')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--jira-bg-card)',
      border: '2px solid var(--jira-border)',
      borderRadius: '3px',
      padding: '16px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: '600',
        margin: '0 0 16px 0',
        color: 'var(--jira-text-primary)'
      }}>
        Create Issue
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '4px'
            }}>
              Summary *
            </label>
            <input
              className="input"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '4px'
            }}>
              Description
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Add more details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '4px'
            }}>
              Priority
            </label>
            <select
              className="input"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--jira-text-secondary)',
              marginBottom: '4px'
            }}>
              Team (optional)
            </label>
            <select
              className="input"
              value={teamId}
              onChange={e => {
                setTeamId(e.target.value)
                setAssignedTo('')
              }}
              style={{ width: '100%' }}
            >
              <option value="">No Team</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name} ({team.members?.length || 0} members)
                </option>
              ))}
            </select>
          </div>

          {teamId && teamMembers.length > 0 && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--jira-text-secondary)',
                marginBottom: '4px'
              }}>
                Assign to (optional)
              </label>
              <select
                className="input"
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Unassigned</option>
                {teamMembers.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.name} ({member.role}) - {member.email}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--jira-text-secondary)', marginTop: '4px' }}>
                💡 Assigned user will receive an email notification
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                minWidth: '120px'
              }}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
