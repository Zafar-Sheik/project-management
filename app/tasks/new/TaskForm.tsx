// app/tasks/new/TaskForm.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface TaskFormProps {
  projects: any[];
  teamMembers: any[];
  loading: boolean;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

export default function TaskForm({
  projects,
  teamMembers,
  loading,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    project: searchParams.get("project") || "",
    assignedTeamMember: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2">
          Task Name
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
          htmlFor="project"
          className="block text-sm font-medium text-gray-700 mb-2">
          Project
        </label>
        <select
          id="project"
          name="project"
          value={formData.project}
          onChange={handleChange}
          className="input"
          required>
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="assignedTeamMember"
          className="block text-sm font-medium text-gray-700 mb-2">
          Assign To
        </label>
        <select
          id="assignedTeamMember"
          name="assignedTeamMember"
          value={formData.assignedTeamMember}
          onChange={handleChange}
          className="input"
          required>
          <option value="">Select a team member</option>
          {teamMembers.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}
