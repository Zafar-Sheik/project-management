// app/team/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TeamMember {
  _id: string;
  name: string;
  role: "Project Manager" | "Backend Developer" | "Frontend Developer";
  email: string;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team-members");
      const result = await response.json();

      if (result.success) {
        setTeamMembers(result.data);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeamMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/team-members?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setTeamMembers(teamMembers.filter((member) => member._id !== id));
      } else {
        alert("Error deleting team member: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting team member:", error);
      alert("Error deleting team member");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Project Manager":
        return "bg-purple-100 text-purple-800";
      case "Backend Developer":
        return "bg-blue-100 text-blue-800";
      case "Frontend Developer":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
        <Link href="/team/new" className="btn btn-primary">
          Add Team Member
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <div key={member._id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {member.name}
              </h3>
              <div className="flex space-x-2">
                <Link
                  href={`/team/${member._id}/edit`}
                  className="text-blue-600 hover:text-blue-800 text-sm">
                  Edit
                </Link>
                <button
                  onClick={() => deleteTeamMember(member._id)}
                  className="text-red-600 hover:text-red-800 text-sm">
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                    member.role
                  )}`}>
                  {member.role}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {member.email}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            No team members found
          </div>
          <Link href="/team/new" className="btn btn-primary">
            Add your first team member
          </Link>
        </div>
      )}
    </div>
  );
}
