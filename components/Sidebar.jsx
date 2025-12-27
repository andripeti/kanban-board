"use client";

import { useSession } from "next-auth/react";
import { getTeams, createTeam, deleteTeam } from "@/lib/api/teams";
import { getProjects, createProject, deleteProject } from "@/lib/api/projects";
import TeamManagementModal from "./TeamManagementModal";
import ProjectDetailsModal from "./ProjectDetailsModal";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createProject, deleteProject, getProjects } from "../lib/api/projects";
import { createTeam, deleteTeam, getTeams } from "../lib/api/teams";

export const SHOW_ALL_TEAMS = "__SHOW_ALL_TEAMS__";
const UNASSIGNED_SENTINEL = "__UNASSIGNED_TEAM__";

function resolveActiveTeam(savedValue, teams) {
  if (!savedValue) return SHOW_ALL_TEAMS;
  if (savedValue === SHOW_ALL_TEAMS) return SHOW_ALL_TEAMS;
  if (savedValue === UNASSIGNED_SENTINEL) return null;
  return teams.some((team) => team._id === savedValue) ? savedValue : SHOW_ALL_TEAMS;
}

function projectMatchesTeam(project, teamFilter) {
  const projectTeams = Array.isArray(project.teamIds) ? project.teamIds : [];
  if (teamFilter === SHOW_ALL_TEAMS) return true;
  if (teamFilter === null) return projectTeams.length === 0;
  return projectTeams.includes(teamFilter);
}

const sortByName = (items) => items.slice().sort((a, b) => a.name.localeCompare(b.name));

export default function Sidebar({ onTeamChange, onProjectChange }) {
  const { data: session } = useSession();
  const router = useRouter();
  const email = session?.user?.email;

  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [activeTeam, setActiveTeam] = useState(SHOW_ALL_TEAMS);
  const [activeProject, setActiveProject] = useState(null);
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
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTeams, setNewProjectTeams] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchCollections = useCallback(
    async ({ silent } = { silent: false }) => {
      if (!email) {
        setTeams([]);
        setProjects([]);
        return { teams: [], projects: [] };
      }
      if (!silent) setLoadingCollections(true);
      try {
        const [teamsData, projectsData] = await Promise.all([getTeams(), getProjects()]);
        setTeams(sortByName(teamsData));
        setProjects(sortByName(projectsData));
        return { teams: teamsData, projects: projectsData };
      } catch (err) {
        const message = err.message || "Failed to load workspace data";
        setFormError(message);
        setTeams([]);
        setProjects([]);
        return { teams: [], projects: [] };
      } finally {
        if (!silent) setLoadingCollections(false);
      }
    },
    [email]
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!email) {
        setTeams([]);
        setProjects([]);
        setActiveTeam(SHOW_ALL_TEAMS);
        setActiveProject(null);
        setHydrated(false);
        return;
      }

      const result = await fetchCollections();
      if (cancelled) return;

      const activeTeamKey = `kanban-active-team-${email}`;
      const activeProjectKey = `kanban-active-project-${email}`;
      const savedTeamValue =
        typeof window !== "undefined" ? localStorage.getItem(activeTeamKey) : null;
      const savedProjectValue =
        typeof window !== "undefined" ? localStorage.getItem(activeProjectKey) : null;

      setActiveTeam(resolveActiveTeam(savedTeamValue, result.teams));
      const initialProject = result.projects.some((project) => project._id === savedProjectValue)
        ? savedProjectValue
        : null;
      setActiveProject(initialProject);
      setHydrated(true);
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [email, fetchCollections]);

  useEffect(() => {
    if (!email || !hydrated) return;
    const key = `kanban-active-team-${email}`;
    const value =
      activeTeam === SHOW_ALL_TEAMS
        ? SHOW_ALL_TEAMS
        : activeTeam === null
        ? UNASSIGNED_SENTINEL
        : activeTeam;
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    }
    onTeamChange?.(activeTeam);
  }, [activeTeam, email, hydrated, onTeamChange]);

  useEffect(() => {
    if (!email || !hydrated) return;
    const key = `kanban-active-project-${email}`;
    if (typeof window !== "undefined") {
      if (activeProject) {
        localStorage.setItem(key, activeProject);
      } else {
        localStorage.removeItem(key);
      }
    }
    onProjectChange?.(activeProject);
  }, [activeProject, email, hydrated, onProjectChange]);

  const visibleProjects = useMemo(() => {
    return projects.filter((project) => projectMatchesTeam(project, activeTeam));
  }, [projects, activeTeam]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeProject && !visibleProjects.some((project) => project._id === activeProject)) {
      setActiveProject(null);
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
  }, [visibleProjects, activeProject, hydrated]);

  const handleAddTeam = async () => {
    setFormError(null);
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    try {
      const team = await createTeam({ name: trimmed });
      setTeams((prev) => sortByName([...prev, team]));
      setActiveTeam(team._id);
      setNewTeamName("");
      setShowTeamInput(false);
    } catch (err) {
      setFormError(err.message || "Failed to create team");
    }
  };

  const handleDeleteTeam = async (team) => {
    setFormError(null);
    try {
      await deleteTeam(team._id);
      setTeams((prev) => prev.filter((item) => item._id !== team._id));
      setProjects((prev) =>
        prev.map((project) => ({
          ...project,
          teamIds: (project.teamIds || []).filter((teamId) => teamId !== team._id),
        }))
      );
      if (activeTeam === team._id) {
        setActiveTeam(SHOW_ALL_TEAMS);
        setActiveProject(null);
      }
    } catch (err) {
      setFormError(err.message || "Failed to delete team");
    }
  };

  const handleSelectTeam = (teamId) => {
    setActiveTeam(teamId);
    if (teamId !== SHOW_ALL_TEAMS) {
      setActiveProject((current) =>
        current &&
        projects.some(
          (project) => project._id === current && projectMatchesTeam(project, teamId)
        )
          ? current
          : null
      );
    }
  };

  const handleShowAll = () => {
    setActiveTeam(SHOW_ALL_TEAMS);
    setActiveProject(null);
  };

  const handleSelectUnassigned = () => {
    setActiveTeam(null);
    setActiveProject(null);
  };

  const toggleProjectTeamSelection = (teamId) => {
    setNewProjectTeams((prev) =>
      prev.includes(teamId) ? prev.filter((value) => value !== teamId) : [...prev, teamId]
    );
  };

  const handleAddProject = async () => {
    setFormError(null);
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const assignedTeams = newProjectTeams.filter((teamId) =>
      teams.some((team) => team._id === teamId)
    );
    try {
      const project = await createProject({ name: trimmed, teamIds: assignedTeams });
      setProjects((prev) => sortByName([...prev, project]));
      setActiveProject(project._id);
      setShowProjectInput(false);
      setNewProjectName("");
      setNewProjectTeams(
        activeTeam && activeTeam !== SHOW_ALL_TEAMS && activeTeam !== null ? [activeTeam] : []
      );
    } catch (err) {
      setFormError(err.message || "Failed to create project");
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
  const handleDeleteProject = async (project) => {
    setFormError(null);
    try {
      await deleteProject(project._id);
      setProjects((prev) => prev.filter((item) => item._id !== project._id));
      if (activeProject === project._id) {
        setActiveProject(null);
      }
    } catch (err) {
      setFormError(err.message || "Failed to delete project");
    }
  };

  const handleSelectProject = (projectId) => {
    setActiveProject(projectId);
  };

  const handleCreateProjectTask = (projectId) => {
    const project = projects.find((p) => p._id === projectId);
    if (!project) return;
    const params = new URLSearchParams();
    params.set("project", projectId);

    if (activeTeam && activeTeam !== SHOW_ALL_TEAMS) {
      params.set("team", activeTeam);
    } else if ((project.teamIds || []).length > 0) {
      params.set("team", project.teamIds[0]);
    }

    const query = params.toString();
    router.push(`/new-task${query ? `?${query}` : ""}`);
  };

  const resetTeamInput = () => {
    setShowTeamInput(false);
    setNewTeamName("");
  };

  const resetProjectInput = () => {
    setShowProjectInput(false);
    setNewProjectName("");
    setNewProjectTeams(
      activeTeam && activeTeam !== SHOW_ALL_TEAMS && activeTeam !== null ? [activeTeam] : []
    );
  };

  useEffect(() => {
    if (showProjectInput) {
      setNewProjectTeams(
        activeTeam && activeTeam !== SHOW_ALL_TEAMS && activeTeam !== null ? [activeTeam] : []
      );
    }
  }, [showProjectInput, activeTeam]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">K</div>
          <span className="logo-text">Kanban Workspace</span>
        </div>
      </div>

      <div className="sidebar-content">
        {formError && (
          <div className="error-message" style={{ margin: "0 12px 12px" }}>
            {formError}
          </div>
        )}

        <button className="sidebar-item sidebar-item-primary" type="button">
          <span className="sidebar-icon">👤</span>
          <span>My work</span>
        </button>

        <div style={{ padding: "8px 12px 0" }}>
          <button
            className={`sidebar-item ${activeTeam === SHOW_ALL_TEAMS ? "active" : ""}`}
            type="button"
            onClick={handleShowAll}
            style={{ width: "100%", justifyContent: "flex-start" }}
          >
            <span>Show all</span>
          </button>
        </div>

        {/* Teams section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>▼</span>
            <span>Teams</span>
            <button className="add-btn" type="button" onClick={() => setShowTeamInput(true)}>
              +
            </button>
          </div>
          <div className="sidebar-section-content">
            <button
              className={`sidebar-item ${activeTeam === null ? "active" : ""}`}
              type="button"
              onClick={handleSelectUnassigned}
              style={{ padding: "6px 12px", width: "100%", justifyContent: "flex-start" }}
            >
              <span>Unassigned</span>
            </button>

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
                      resetTeamInput();
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
                    onClick={resetTeamInput}
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

            {loadingCollections && teams.length === 0 ? (
              <div
                style={{ padding: "8px 12px", fontSize: "12px", color: "var(--jira-text-secondary)" }}
              >
                Loading teams...
              </div>
            ) : (
              teams.map((team) => (
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
                    className={`sidebar-item ${activeTeam === team._id ? "active" : ""}`}
                    type="button"
                    onClick={() => handleSelectTeam(team._id)}
                    style={{ flex: 1, padding: "6px 8px", justifyContent: "flex-start" }}
                  >
                    <span>{team.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTeam(team);
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
              ))
            )}
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
            <button className="add-btn" type="button" onClick={() => setShowProjectInput(true)}>
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
                      resetProjectInput();
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--jira-text-secondary)" }}>
                    Assign to team(s)
                  </span>
                  {teams.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "var(--jira-text-secondary)" }}>
                      Add a team first or leave unassigned.
                    </span>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        maxHeight: "120px",
                        overflowY: "auto",
                      }}
                    >
                      {teams.map((team) => (
                        <label
                          key={team._id}
                          style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px" }}
                        >
                          <input
                            type="checkbox"
                            checked={newProjectTeams.includes(team._id)}
                            onChange={() => toggleProjectTeamSelection(team._id)}
                          />
                          <span>{team.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={resetProjectInput}
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

            {loadingCollections && visibleProjects.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "var(--jira-text-secondary)",
                }}
              >
                Loading projects...
              </div>
            ) : visibleProjects.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "var(--jira-text-secondary)",
                }}
              >
                {projects.length === 0 ? "No projects yet" : "No projects for this team"}
              </div>
            ) : (
              visibleProjects.map((project) => (
                <div
                  key={project._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                  }}
                >
                  <button
                    className={`sidebar-item sidebar-subitem ${
                      activeProject === project._id ? "active" : ""
                    }`}
                    type="button"
                    onClick={() => handleSelectProject(project._id)}
                    style={{ flex: 1, padding: "6px 8px", justifyContent: "flex-start" }}
                  >
                    <span className="project-icon">{project.icon || "📁"}</span>
                    <span>{project.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateProjectTask(project._id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--jira-text-secondary)",
                      cursor: "pointer",
                      fontSize: "16px",
                      padding: "0 4px",
                    }}
                    title="Create task in this project"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project);
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
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
