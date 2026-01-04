"use client";
import { useEffect, useMemo, useState } from "react";
import { getProjects } from "../lib/api/projects";
import { createTask } from "../lib/api/tasks";
import { getTeams } from "../lib/api/teams";

export default function TaskModal({ isOpen, onClose, initialTeam, initialProject, onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(initialTeam || "");
  const [selectedProject, setSelectedProject] = useState(initialProject || "");
  const [metaLoading, setMetaLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let cancelled = false;
      async function loadCollections() {
        setMetaLoading(true);
        try {
          const [teamsData, projectsData] = await Promise.all([getTeams(), getProjects()]);
          if (cancelled) return;
          setTeams(teamsData);
          setProjects(projectsData);
        } catch (err) {
          if (!cancelled) {
            setError(err.message || "Failed to load teams or projects");
          }
        } finally {
          if (!cancelled) {
            setMetaLoading(false);
          }
        }
      }

      loadCollections();
      return () => {
        cancelled = true;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialTeam) setSelectedTeam(initialTeam);
  }, [initialTeam]);

  useEffect(() => {
    if (initialProject) setSelectedProject(initialProject);
  }, [initialProject]);

  useEffect(() => {
    if (!selectedTeam) return;
    if (!teams.some((team) => team._id === selectedTeam)) {
      setSelectedTeam("");
    }
  }, [selectedTeam, teams]);

  useEffect(() => {
    if (!selectedProject) return;
    const project = projects.find((item) => item._id === selectedProject);
    if (!project) {
      setSelectedProject("");
      return;
    }
    if (!selectedTeam) {
      if ((project.teamIds || []).length === 1) {
        setSelectedTeam(project.teamIds[0]);
        return;
      }
      if ((project.teamIds || []).length > 0) {
        setSelectedProject("");
      }
      return;
    }
    if (project.teamIds?.length && !project.teamIds.includes(selectedTeam)) {
      setSelectedProject("");
    }
  }, [selectedProject, projects, selectedTeam]);

  const availableProjects = useMemo(() => {
    if (!selectedTeam) {
      return projects.filter((project) => (project.teamIds || []).length === 0);
    }
    return projects.filter((project) => {
      const ids = Array.isArray(project.teamIds) ? project.teamIds : [];
      return ids.length === 0 || ids.includes(selectedTeam);
    });
  }, [projects, selectedTeam]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setLoading(true);
    try {
      await createTask({
        title,
        description,
        priority,
        status: "todo",
        teamId: selectedTeam || null,
        projectId: selectedProject || null
      });
      
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedTeam(initialTeam || "");
      setSelectedProject(initialProject || "");
      setError(null);
      
      if (onTaskCreated) {
        onTaskCreated();
      }
      onClose();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err.message || "Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleClose = () => {
    // Reset form
    setTitle("");
    setDescription("");
    setPriority("medium");
    setSelectedTeam(initialTeam || "");
    setSelectedProject(initialProject || "");
    setError(null);
    setShowPriorityDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "var(--radius-lg)",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "var(--shadow-xl)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              margin: 0,
              color: "var(--jira-text-primary)",
            }}
          >
            Create New Task
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "24px",
              color: "var(--jira-text-secondary)",
              cursor: "pointer",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-md)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Title Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--jira-text-primary)",
                  marginBottom: "8px",
                }}
              >
                Summary *
              </label>
              <input
                className="task-input"
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: "100%",
                  fontSize: "16px",
                }}
              />
            </div>

            {/* Description Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--jira-text-primary)",
                  marginBottom: "8px",
                }}
              >
                Description
              </label>
              <textarea
                className="task-textarea"
                rows={4}
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Priority Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--jira-text-primary)",
                  marginBottom: "8px",
                }}
              >
                Priority
              </label>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                  className="task-select"
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>
                      {priority === "high" ? "🔴" : priority === "medium" ? "🟠" : "🔵"}
                    </span>
                    <span>
                      {priority === "high" ? "High" : priority === "medium" ? "Medium" : "Low"}
                    </span>
                  </span>
                  <span>▼</span>
                </button>

                {showPriorityDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: "0",
                      width: "100%",
                      background: "#ffffff",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      boxShadow: "var(--shadow-lg)",
                      zIndex: 1000,
                    }}
                  >
                    <div style={{ padding: "4px 0" }}>
                      {["high", "medium", "low"].map((p) => (
                        <div
                          key={p}
                          onClick={() => {
                            setPriority(p);
                            setShowPriorityDropdown(false);
                          }}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            background: priority === p ? "#f1f5f9" : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (priority !== p) {
                              e.currentTarget.style.background = "transparent";
                            } else {
                              e.currentTarget.style.background = "#f1f5f9";
                            }
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>
                            {p === "high" ? "🔴" : p === "medium" ? "🟠" : "🔵"}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              color: "var(--jira-text-primary)",
                              fontWeight: priority === p ? "600" : "400",
                            }}
                          >
                            {p === "high" ? "High" : p === "medium" ? "Medium" : "Low"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--jira-text-primary)",
                  marginBottom: "8px",
                }}
              >
                Team
              </label>
              <select
                className="task-select"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "14px",
                }}
              >
                <option value="">Unassigned</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "var(--jira-text-primary)",
                  marginBottom: "8px",
                }}
              >
                Project (optional)
              </label>
              <select
                className="task-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "14px",
                }}
                disabled={metaLoading}
              >
                <option value="">Unassigned</option>
                {availableProjects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {selectedTeam && availableProjects.length === 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--jira-text-secondary)",
                    marginTop: "6px",
                  }}
                >
                  No projects for this team yet.
                </div>
              )}
              {!selectedTeam && availableProjects.length === 0 && projects.length > 0 && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--jira-text-secondary)",
                    marginTop: "6px",
                  }}
                >
                  Select a team to see its projects.
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "20px 32px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              style={{
                padding: "10px 20px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: "10px 24px",
              }}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
