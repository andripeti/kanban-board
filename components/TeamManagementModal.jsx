"use client";

import { useState } from "react";
import { addTeamMember, removeTeamMember } from "@/lib/api/teams";

export default function TeamManagementModal({ team, onClose, onUpdate }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setLoading(true);
      await addTeamMember(team._id, { email: email.trim(), role });
      setEmail("");
      setRole("member");
      await onUpdate();
      alert("Member added successfully! They will receive an email notification.");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      setLoading(true);
      await removeTeamMember(team._id, userId);
      await onUpdate();
    } catch (error) {
      alert(error.message);
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: "20px" }}>
            Manage Team: {team.name}
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

        {/* Add Member Form */}
        <div
          style={{
            background: "#253858",
            padding: "16px",
            borderRadius: "6px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "16px" }}>
            Add Team Member
          </h3>
          <form onSubmit={handleAddMember}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#8993a4", fontSize: "13px", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  background: "#1e2a3a",
                  border: "1px solid #4a5f7f",
                  borderRadius: "4px",
                  color: "#fff",
                  outline: "none",
                }}
              />
              <div style={{ fontSize: "12px", color: "#8993a4", marginTop: "4px" }}>
                User must be registered in the system first
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", color: "#8993a4", fontSize: "13px", marginBottom: "6px" }}>
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "14px",
                  background: "#1e2a3a",
                  border: "1px solid #4a5f7f",
                  borderRadius: "4px",
                  color: "#fff",
                  outline: "none",
                }}
              >
                <option value="member">Member</option>
                <option value="po">Product Owner</option>
                <option value="admin">Admin</option>
              </select>
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
                  marginBottom: "12px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
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
              {loading ? "Adding..." : "Add Member"}
            </button>
          </form>
        </div>

        {/* Team Members List */}
        <div>
          <h3 style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "16px" }}>
            Team Members ({team.members?.length || 0})
          </h3>
          <div>
            {team.members && team.members.length > 0 ? (
              team.members.map((member) => (
                <div
                  key={member.userId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "#253858",
                    borderRadius: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <div style={{ color: "#fff", fontSize: "14px", fontWeight: "500" }}>
                      {member.name}
                    </div>
                    <div style={{ color: "#8993a4", fontSize: "12px" }}>
                      {member.email}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        background: member.role === "admin" ? "#0052cc" : member.role === "po" ? "#6554c0" : "#42526e",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: "3px",
                        textTransform: "uppercase",
                        fontWeight: "600",
                      }}
                    >
                      {member.role}
                    </span>
                    {member.role !== "admin" && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={loading}
                        style={{
                          background: "transparent",
                          border: "1px solid #8b3434",
                          color: "#ff6b6b",
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: loading ? "not-allowed" : "pointer",
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#8993a4" }}>
                No members yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
