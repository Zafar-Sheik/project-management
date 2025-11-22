// app/tasks/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Project {
  _id: string;
  name: string;
}

interface TeamMember {
  _id: string;
  name: string;
}

interface Task {
  _id: string;
  name: string;
  status: "complete" | "in progress";
  project: string;
  assignedTeamMember: string;
}

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Task | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
    fetchTask();
  }, [params.id]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/team-members");
      const result = await response.json();
      if (result.success) {
        setTeamMembers(result.data);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchTask = async () => {
    try {
      const response = await fetch("/api/tasks");
      const result = await response.json();
      if (result.success) {
        const task = result.data.find((t: Task) => t._id === params.id);
        if (task) {
          setFormData({
            _id: task._id,
            name: task.name,
            status: task.status,
            project: task.project?._id || task.project,
            assignedTeamMember:
              task.assignedTeamMember?._id || task.assignedTeamMember,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setLoading(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/tasks");
      } else {
        alert("Error updating task: " + result.error);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Error updating task");
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
        <div className="text-lg">Loading task...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
        <p className="text-gray-600 mt-2">Update task details</p>
      </div>

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
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
            required>
            <option value="in progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
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
            onClick={() => router.back()}
            className="btn btn-secondary"
            disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Updating..." : "Update Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
