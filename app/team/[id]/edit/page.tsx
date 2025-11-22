// app/team/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface TeamMember {
  _id: string;
  name: string;
  role: "Project Manager" | "Backend Developer" | "Frontend Developer";
  email: string;
}

export default function EditTeamMemberPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchTeamMember();
  }, [params.id]);

  const fetchTeamMember = async () => {
    try {
      const response = await fetch("/api/team-members");
      const result = await response.json();
      if (result.success) {
        const teamMember = result.data.find(
          (tm: TeamMember) => tm._id === params.id
        );
        if (teamMember) {
          setFormData(teamMember);
        }
      }
    } catch (error) {
      console.error("Error fetching team member:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setLoading(true);

    try {
      const response = await fetch("/api/team-members", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/team");
      } else {
        alert("Error updating team member: " + result.error);
      }
    } catch (error) {
      console.error("Error updating team member:", error);
      alert("Error updating team member");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!formData) return;

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!formData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading team member...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Team Member</h1>
        <p className="text-gray-600 mt-2">Update team member details</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="input"
            required>
            <option value="">Select a role</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Frontend Developer">Frontend Developer</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Updating..." : "Update Team Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
