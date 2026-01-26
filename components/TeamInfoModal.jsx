"use client";

import { useState } from "react";
import { removeTeamMember, updateTeamMemberRole } from "../lib/api/teams";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewOnly", label: "View Only" },
];

const ROLE_DISPLAY_NAMES = {
  admin: "Admin",
  member: "Member",
  viewOnly: "View Only",
};

export default function TeamInfoModal({ team, currentUserId, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentUserMember = team.members?.find(m => m.userId === currentUserId);
  const isCurrentUserAdmin = currentUserMember?.role === "admin";

  const handleRemoveMember = async (userId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedTeam = await removeTeamMember(team._id, userId);
      setSuccess("Member removed successfully");
      onUpdate?.(updatedTeam);
    } catch (err) {
      setError(err.message || "Failed to remove member");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedTeam = await updateTeamMemberRole(team._id, userId, newRole);
      setSuccess("Role updated successfully");
      setEditingMemberId(null);
      onUpdate?.(updatedTeam);
    } catch (err) {
      setError(err.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "#1e2936",
            borderRadius: "6px",
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
              padding: "16px 20px",
              borderBottom: "1px solid #2d3a4b",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "18px", color: "#fff" }}>
              Team: {team.name}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#8993a4",
                fontSize: "24px",
                cursor: "pointer",
                padding: "0 4px",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: "20px" }}>
            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "#d32f2f22",
                  border: "1px solid #d32f2f",
                  borderRadius: "4px",
                  color: "#ff6b6b",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "#4caf5022",
                  border: "1px solid #4caf50",
                  borderRadius: "4px",
                  color: "#81c784",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                {success}
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <h3 style={{ fontSize: "14px", color: "#8993a4", marginBottom: "12px" }}>
                Team Information
              </h3>
              <div style={{ fontSize: "13px", color: "#fff", lineHeight: "1.8" }}>
                <div>
                  <strong>Team Name:</strong> {team.name}
                </div>
                <div>
                  <strong>Total Members:</strong> {team.members?.length || 0}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "14px", color: "#8993a4", marginBottom: "12px" }}>
                Team Members ({team.members?.length || 0})
              </h3>
              {!team.members || team.members.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#8993a4",
                    fontSize: "13px",
                  }}
                >
                  No members yet. Use the "Add Member" button in the sidebar to invite team members.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {team.members.map((member) => {
                    const isEditingThis = editingMemberId === member.userId;
                    const canEditThis = isCurrentUserAdmin && member.userId !== currentUserId;
                    const canRemoveThis = isCurrentUserAdmin && member.userId !== currentUserId;
                    
                    return (
                      <div
                        key={member.userId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "#253858",
                          borderRadius: "4px",
                          border: "1px solid #2d3a4b",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "14px", color: "#fff", marginBottom: "2px" }}>
                            {member.name || "Unknown User"}
                            {member.userId === currentUserId && (
                              <span style={{ color: "#8993a4", marginLeft: "8px", fontSize: "12px" }}>(You)</span>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#8993a4" }}>
                            {member.email}
                          </div>
                        </div>
                        {isEditingThis ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                            disabled={loading}
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                              background: "#1e2936",
                              border: "1px solid #4a5f7f",
                              borderRadius: "4px",
                              color: "#ffffff",
                              marginRight: "12px",
                              cursor: loading ? "not-allowed" : "pointer",
                            }}
                            onBlur={() => setEditingMemberId(null)}
                          >
                            {ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div
                            onClick={() => canEditThis && setEditingMemberId(member.userId)}
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              background: member.role === "admin" ? "#4caf5033" : member.role === "viewOnly" ? "#ff980033" : "#0052cc33",
                              color: member.role === "admin" ? "#81c784" : member.role === "viewOnly" ? "#ffb74d" : "#4c9aff",
                              borderRadius: "12px",
                              marginRight: "12px",
                              cursor: canEditThis ? "pointer" : "default",
                            }}
                            title={canEditThis ? "Click to change role" : ""}
                          >
                            {ROLE_DISPLAY_NAMES[member.role] || member.role || "Member"}
                          </div>
                        )}
                        {canRemoveThis && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={loading}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              background: "transparent",
                              color: "#ff6b6b",
                              border: "1px solid #ff6b6b",
                              borderRadius: "4px",
                              cursor: loading ? "not-allowed" : "pointer",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
