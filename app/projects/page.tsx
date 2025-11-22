// app/projects/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  client: any;
  tasks: any[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This will also delete all associated tasks and todos."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setProjects(projects.filter((project) => project._id !== id));
      } else {
        alert("Error deleting project: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Link href="/projects/new" className="btn btn-primary">
          Create New Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectItem
            key={project._id}
            project={project}
            onDelete={deleteProject}
          />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No projects found</div>
          <Link href="/projects/new" className="btn btn-primary">
            Create your first project
          </Link>
        </div>
      )}
    </div>
  );
}

function ProjectItem({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const progress = project.progress || 0;
  const daysLeft = Math.ceil(
    (new Date(project.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
        <div className="flex space-x-2">
          <Link
            href={`/projects/${project._id}/edit`}
            className="text-blue-600 hover:text-blue-800 text-sm">
            Edit
          </Link>
          <button
            onClick={() => onDelete(project._id)}
            className="text-red-600 hover:text-red-800 text-sm">
            Delete
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Start Date:</span>
          <span>{new Date(project.startDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>End Date:</span>
          <span>{new Date(project.endDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Days Left:</span>
          <span
            className={
              daysLeft < 0
                ? "text-red-600"
                : daysLeft < 7
                ? "text-orange-600"
                : "text-green-600"
            }>
            {daysLeft} days
          </span>
        </div>
        <div className="flex justify-between">
          <span>Client:</span>
          <span>{project.client?.name || "No client"}</span>
        </div>
        <div className="flex justify-between">
          <span>Tasks:</span>
          <span>{project.tasks?.length || 0}</span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Link
          href={`/projects/${project._id}`}
          className="btn btn-primary flex-1 text-center">
          View Details
        </Link>
      </div>
    </div>
  );
}
