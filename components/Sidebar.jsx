"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getTeams, createTeam, deleteTeam } from "@/lib/api/teams";
import { getProjects, createProject, deleteProject } from "@/lib/api/projects";
import TeamManagementModal from "./TeamManagementModal";
import ProjectDetailsModal from "./ProjectDetailsModal";

export default function Sidebar({ onTeamChange }) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [showTeamInput, setShowTeamInput] = useState(false);
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTeams, setNewProjectTeams] = useState([]);
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState(null);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load teams and projects from database on mount or when user changes
  useEffect(() => {
    if (!session?.user?.email) {
      setTeams([]);
      setProjects([]);
      setActiveTeam(null);
      return;
    }

    fetchTeams();
    fetchProjects();
  }, [session?.user?.email]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { teams: fetchedTeams } = await getTeams();
      setTeams(fetchedTeams);

      const activeTeamKey = `kanban-active-team-${session.user.email}`;
      const savedActiveTeamId = localStorage.getItem(activeTeamKey);

      if (savedActiveTeamId) {
        const teamExists = fetchedTeams.find(t => t._id === savedActiveTeamId);
        if (teamExists) {
          setActiveTeam(savedActiveTeamId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { projects: fetchedProjects } = await getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  // Save active team to localStorage whenever it changes
  useEffect(() => {
    if (!session?.user?.email) return;

    const activeTeamKey = `kanban-active-team-${session.user.email}`;

    if (activeTeam !== null) {
      localStorage.setItem(activeTeamKey, activeTeam);
    } else {
      localStorage.removeItem(activeTeamKey);
    }
  }, [activeTeam, session?.user?.email]);

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      try {
        await createProject({
          name: newProjectName.trim(),
          teamIds: newProjectTeams,
        });
        await fetchProjects();
        setNewProjectName("");
        setNewProjectTeams([]);
        setShowProjectInput(false);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(projectId);
      await fetchProjects();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddTeam = async () => {
    if (newTeamName.trim()) {
      try {
        const { team } = await createTeam({ name: newTeamName.trim() });
        await fetchTeams();
        setNewTeamName("");
        setShowTeamInput(false);
        setActiveTeam(team._id);
        if (onTeamChange) {
          onTeamChange(team._id);
        }
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      await deleteTeam(teamId);
      await fetchTeams();
      if (activeTeam === teamId) {
        setActiveTeam(null);
        if (onTeamChange) {
          onTeamChange(null);
        }
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSelectTeam = (teamId) => {
    setActiveTeam(teamId);
    if (onTeamChange) {
      onTeamChange(teamId);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">K</div>
          <span className="logo-text">Kanban Board</span>
          <button className="dropdown-btn" type="button">
            ▼
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        <button className="sidebar-item sidebar-item-primary" type="button">
          <span className="sidebar-icon">👤</span>
          <span>My work</span>
        </button>

        {/* Teams section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>▼</span>
            <span>Teams</span>
            <button
              className="add-btn"
              type="button"
              onClick={() => setShowTeamInput(true)}
            >
              +
            </button>
          </div>

          <div className="sidebar-section-content">
            {showTeamInput && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  margin: "4px 0",
                  borderRadius: "3px",
                }}
              >
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTeam();
                    } else if (e.key === "Escape") {
                      setShowTeamInput(false);
                      setNewTeamName("");
                    }
                  }}
                  placeholder="Team name"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "13px",
                    background: "#253858",
                    border: "1px solid #4a5f7f",
                    borderRadius: "3px",
                    color: "#ffffff",
                    outline: "none",
                    marginBottom: "8px",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeamInput(false);
                      setNewTeamName("");
                    }}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      background: "transparent",
                      color: "#8993a4",
                      border: "1px solid #4a5f7f",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTeam}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      background: "#0052cc",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            {loading && (
              <div style={{ padding: "8px 12px", color: "#8993a4", fontSize: "13px" }}>
                Loading teams...
              </div>
            )}
            {teams.map((team) => (
              <div
                key={team._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 12px",
                }}
              >
                <button
                  className={`sidebar-item ${
                    activeTeam === team._id ? "active" : ""
                  }`}
                  type="button"
                  onClick={() => handleSelectTeam(team._id)}
                  style={{ flex: 1, padding: "6px 8px", justifyContent: "flex-start" }}
                >
                  <span>{team.name}</span>
                  <span style={{ fontSize: "11px", color: "#8993a4", marginLeft: "8px" }}>
                    ({team.members?.length || 0})
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTeamForManagement(team);
                  }}
                  style={{
                    background: "#0052cc",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderRadius: "3px",
                    fontWeight: "500",
                  }}
                  title="Add team members"
                >
                  Add Member
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTeam(team._id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--jira-text-secondary)",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "0 4px",
                  }}
                  title="Delete team"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Projects section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>▼</span>
            <span>Projects</span>
            <button
              className="add-btn"
              type="button"
              onClick={() => setShowProjectInput(true)}
            >
              +
            </button>
          </div>

          <div className="sidebar-section-content">
            {showProjectInput && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  margin: "4px 0",
                  borderRadius: "3px",
                }}
              >
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddProject();
                    } else if (e.key === "Escape") {
                      setShowProjectInput(false);
                      setNewProjectName("");
                      setNewProjectTeams([]);
                    }
                  }}
                  placeholder="Project name"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "13px",
                    background: "#253858",
                    border: "1px solid #4a5f7f",
                    borderRadius: "3px",
                    color: "#ffffff",
                    outline: "none",
                    marginBottom: "8px",
                    fontFamily: "inherit",
                  }}
                />
                <select
                  multiple
                  value={newProjectTeams}
                  onChange={(e) =>
                    setNewProjectTeams(
                      Array.from(e.target.selectedOptions, (option) => option.value)
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    fontSize: "12px",
                    background: "#1e2a3a",
                    border: "1px solid #4a5f7f",
                    borderRadius: "3px",
                    color: "#ffffff",
                    outline: "none",
                    marginBottom: "8px",
                    fontFamily: "inherit",
                    minHeight: "60px",
                  }}
                >
                  <option value="" disabled style={{ color: "#8993a4" }}>Select teams (optional)</option>
                  {teams.map((team) => (
                    <option
                      key={team._id}
                      value={team._id}
                      style={{
                        background: "#1e2a3a",
                        color: "#ffffff",
                        padding: "8px",
                      }}
                    >
                      {team.name}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: "11px", color: "#8993a4", marginBottom: "8px" }}>
                  💡 Hold Ctrl/Cmd to select multiple teams
                </div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectInput(false);
                      setNewProjectName("");
                      setNewProjectTeams([]);
                    }}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      background: "transparent",
                      color: "#8993a4",
                      border: "1px solid #4a5f7f",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    style={{
                      padding: "4px 12px",
                      fontSize: "12px",
                      background: "#0052cc",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            {projects.map((project) => (
              <div
                key={project._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 12px",
                }}
              >
                <button
                  className="sidebar-item sidebar-subitem"
                  type="button"
                  onClick={() => setSelectedProjectForDetails(project)}
                  style={{ flex: 1, padding: "6px 8px", justifyContent: "flex-start" }}
                >
                  <span className="project-icon">{project.icon || "📋"}</span>
                  <span>{project.name}</span>
                  {project.teamIds && project.teamIds.length > 0 && (
                    <span style={{ fontSize: "10px", color: "#8993a4", marginLeft: "6px" }}>
                      ({project.teamIds.length} teams)
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project._id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--jira-text-secondary)",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "0 4px",
                  }}
                  title="Delete project"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedTeamForManagement && (
        <TeamManagementModal
          team={selectedTeamForManagement}
          onClose={() => setSelectedTeamForManagement(null)}
          onUpdate={fetchTeams}
        />
      )}

      {selectedProjectForDetails && (
        <ProjectDetailsModal
          project={selectedProjectForDetails}
          onClose={() => setSelectedProjectForDetails(null)}
          onUpdate={fetchProjects}
        />
      )}
    </aside>
  );
}
