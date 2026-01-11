"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

export default function Dashboard({ tasks = [], teams = [] }) {
  const { data: session } = useSession();

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "done" || t.status === "completed").length;
    const inProgress = tasks.filter(t => t.status === "in-progress").length;
    const todo = tasks.filter(t => t.status === "todo").length;
    const scheduled = tasks.filter(t => t.status === "todo" && t.scheduled).length;
    
    const highPriority = tasks.filter(t => t.priority === "high").length;
    const mediumPriority = tasks.filter(t => t.priority === "medium").length;
    const lowPriority = tasks.filter(t => t.priority === "low").length;
    
    const assignedToMe = tasks.filter(t => 
      t.assignedTo?._id === session?.user?.id || t.assignedTo === session?.user?.id
    ).length;
    
    const unassigned = tasks.filter(t => !t.assignedTo).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      inProgress,
      todo,
      scheduled,
      highPriority,
      mediumPriority,
      lowPriority,
      assignedToMe,
      unassigned,
      completionRate
    };
  }, [tasks, session?.user?.id]);

  const recentTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== "done" && t.status !== "completed")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="dashboard">
      {/* Overview Stats */}
      <div className="dashboard-card">
        <h3 className="dashboard-card-title">Overview</h3>
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat">
            <div className="dashboard-stat-value">{stats.total}</div>
            <div className="dashboard-stat-label">Total Tasks</div>
          </div>
          <div className="dashboard-stat">
            <div className="dashboard-stat-value">{stats.assignedToMe}</div>
            <div className="dashboard-stat-label">Assigned to Me</div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="dashboard-card">
        <h3 className="dashboard-card-title">Status</h3>
        <div className="dashboard-progress">
          <div className="dashboard-progress-bar">
            <div 
              className="dashboard-progress-fill" 
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
          <div className="dashboard-progress-label">{stats.completionRate}% Complete</div>
        </div>
        <div className="dashboard-stats-list">
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-dot" style={{ background: "#91d5ff" }}></span>
            <span className="dashboard-stat-item-label">To Do</span>
            <span className="dashboard-stat-item-value">{stats.todo}</span>
          </div>
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-dot" style={{ background: "#ffc069" }}></span>
            <span className="dashboard-stat-item-label">In Progress</span>
            <span className="dashboard-stat-item-value">{stats.inProgress}</span>
          </div>
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-dot" style={{ background: "#95de64" }}></span>
            <span className="dashboard-stat-item-label">Completed</span>
            <span className="dashboard-stat-item-value">{stats.completed}</span>
          </div>
          {stats.scheduled > 0 && (
            <div className="dashboard-stat-item">
              <span className="dashboard-stat-dot" style={{ background: "#b37feb" }}></span>
              <span className="dashboard-stat-item-label">Scheduled</span>
              <span className="dashboard-stat-item-value">{stats.scheduled}</span>
            </div>
          )}
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="dashboard-card">
        <h3 className="dashboard-card-title">Priority</h3>
        <div className="dashboard-stats-list">
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-dot" style={{ background: "#ff7875" }}></span>
            <span className="dashboard-stat-item-label">High</span>
            <span className="dashboard-stat-item-value">{stats.highPriority}</span>
          </div>
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-dot" style={{ background: "#ffc069" }}></span>
            <span className="dashboard-stat-item-label">Medium</span>
            <span className="dashboard-stat-item-value">{stats.mediumPriority}</span>
          </div>
          <div className="dashboard-stat-item">
            <span className="dashboard-stat-dot" style={{ background: "#91d5ff" }}></span>
            <span className="dashboard-stat-item-label">Low</span>
            <span className="dashboard-stat-item-value">{stats.lowPriority}</span>
          </div>
        </div>
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">Teams</h3>
          <div className="dashboard-stats-list">
            {teams.slice(0, 5).map((team) => {
              const teamTasks = tasks.filter(t => t.teamId === team._id);
              return (
                <div key={team._id} className="dashboard-stat-item">
                  <span className="dashboard-stat-dot" style={{ background: "#597ef7" }}>👥</span>
                  <span className="dashboard-stat-item-label">{team.name}</span>
                  <span className="dashboard-stat-item-value">{teamTasks.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      {recentTasks.length > 0 && (
        <div className="dashboard-card">
          <h3 className="dashboard-card-title">Recent Tasks</h3>
          <div className="dashboard-tasks-list">
            {recentTasks.map((task) => (
              <div key={task._id} className="dashboard-task-item">
                <div 
                  className="dashboard-task-priority" 
                  style={{
                    background: task.priority === "high" 
                      ? "#ff7875" 
                      : task.priority === "medium" 
                      ? "#ffc069" 
                      : "#91d5ff"
                  }}
                />
                <div className="dashboard-task-content">
                  <div className="dashboard-task-title">{task.title}</div>
                  <div className="dashboard-task-meta">
                    <span className="dashboard-task-status">
                      {task.status === "in-progress" ? "In Progress" : 
                       task.status === "todo" && task.scheduled ? "Scheduled" : 
                       "To Do"}
                    </span>
                    {task.assignedTo && (
                      <>
                        <span className="dashboard-task-separator">•</span>
                        <span className="dashboard-task-assigned">
                          {task.assignedTo.name || task.assignedTo.email}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
