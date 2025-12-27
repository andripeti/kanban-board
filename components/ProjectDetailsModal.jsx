"use client";

import { useState, useEffect } from "react";
import { updateProject } from "@/lib/api/projects";
import { getTeams } from "@/lib/api/teams";

export default function ProjectDetailsModal({ project, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [icon, setIcon] = useState(project.icon || "");
  const [selectedTeams, setSelectedTeams] = useState(project.teamIds || []);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { teams } = await getTeams();
      setAllTeams(teams);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  const handleSave = async () => {
    setError("");
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setLoading(true);
      await updateProject(project._id, {
        name: name.trim(),
        icon,
        teamIds: selectedTeams,
      });
      await onUpdate();
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignedTeams = allTeams.filter((team) =>
    selectedTeams.includes(team._id)
  );

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
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1e2a3a",
          borderRadius: "8px",
          padding: "24px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0, color: "#fff", fontSize: "20px" }}>
            {isEditing ? "Edit Project" : "Project Details"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#8993a4",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
            }}
          >
            ×
          </button>
        </div>

        {isEditing ? (
          /* Edit Mode */
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#8993a4",
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  background: "#253858",
                  border: "1px solid #4a5f7f",
                  borderRadius: "4px",
                  color: "#fff",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#8993a4",
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                Icon (emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📋"
                maxLength={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  background: "#253858",
                  border: "1px solid #4a5f7f",
                  borderRadius: "4px",
                  color: "#fff",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  color: "#8993a4",
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                Assigned Teams
              </label>
              <select
                multiple
                value={selectedTeams}
                onChange={(e) =>
                  setSelectedTeams(
                    Array.from(e.target.selectedOptions, (option) => option.value)
                  )
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "13px",
                  background: "#1e2a3a",
                  border: "1px solid #4a5f7f",
                  borderRadius: "4px",
                  color: "#fff",
                  outline: "none",
                  minHeight: "120px",
                }}
              >
                {allTeams.map((team) => (
                  <option
                    key={team._id}
                    value={team._id}
                    style={{
                      background: "#1e2a3a",
                      color: "#ffffff",
                      padding: "8px",
                    }}
                  >
                    {team.name} ({team.members?.length || 0} members)
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontSize: "11px",
                  color: "#8993a4",
                  marginTop: "4px",
                }}
              >
                💡 Hold Ctrl/Cmd to select multiple teams
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#5a1f1f",
                  border: "1px solid #8b3434",
                  borderRadius: "4px",
                  color: "#ff6b6b",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setIsEditing(false);
                  setName(project.name);
                  setIcon(project.icon || "");
                  setSelectedTeams(project.teamIds || []);
                  setError("");
                }}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  background: "transparent",
                  color: "#8993a4",
                  border: "1px solid #4a5f7f",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  background: "#0052cc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div>
            <div
              style={{
                background: "#253858",
                padding: "16px",
                borderRadius: "6px",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "32px" }}>{project.icon || "📋"}</span>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>
                  {project.name}
                </h3>
              </div>
              <div style={{ color: "#8993a4", fontSize: "13px" }}>
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>
              {project.updatedAt !== project.createdAt && (
                <div style={{ color: "#8993a4", fontSize: "13px" }}>
                  Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4
                style={{
                  margin: "0 0 12px 0",
                  color: "#fff",
                  fontSize: "16px",
                }}
              >
                Assigned Teams ({assignedTeams.length})
              </h4>
              {assignedTeams.length > 0 ? (
                <div>
                  {assignedTeams.map((team) => (
                    <div
                      key={team._id}
                      style={{
                        background: "#253858",
                        padding: "12px",
                        borderRadius: "4px",
                        marginBottom: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>
                          {team.name}
                        </div>
                        <div style={{ color: "#8993a4", fontSize: "12px" }}>
                          {team.members?.length || 0} members
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#8993a4",
                    background: "#253858",
                    borderRadius: "4px",
                  }}
                >
                  No teams assigned to this project
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  background: "#0052cc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Edit Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
