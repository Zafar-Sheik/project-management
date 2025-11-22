// app/projects/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch("/api/projects");
      const result = await response.json();

      if (result.success) {
        const foundProject = result.data.find(
          (p: Project) => p._id === params.id
        );
        setProject(foundProject);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This will also delete all associated tasks and todos."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects?id=${params.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        router.push("/projects");
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
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">Project not found</div>
        <Link href="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const daysLeft = Math.ceil(
    (new Date(project.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const completedTasks =
    project.tasks?.filter((task) => task.status === "complete").length || 0;
  const totalTasks = project.tasks?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-2">Client: {project.client?.name}</p>
        </div>
        <div className="flex space-x-4">
          <Link
            href={`/projects/${project._id}/edit`}
            className="btn btn-secondary">
            Edit Project
          </Link>
          <button onClick={deleteProject} className="btn btn-danger">
            Delete Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Section */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Project Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Overall Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {completedTasks}
                  </div>
                  <div className="text-gray-600">Tasks Completed</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalTasks}
                  </div>
                  <div className="text-gray-600">Total Tasks</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <Link
                href={`/tasks/new?project=${project._id}`}
                className="btn btn-primary">
                Add Task
              </Link>
            </div>
            <div className="space-y-3">
              {project.tasks?.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        task.status === "complete"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}></div>
                    <span
                      className={
                        task.status === "complete"
                          ? "line-through text-gray-500"
                          : ""
                      }>
                      {task.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {task.assignedTeamMember?.name}
                    </span>
                    <Link
                      href={`/tasks/${task._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </Link>
                  </div>
                </div>
              ))}
              {(!project.tasks || project.tasks.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No tasks yet.{" "}
                  <Link
                    href={`/tasks/new?project=${project._id}`}
                    className="text-blue-600 hover:text-blue-800">
                    Create the first task
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Project Details */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">
                  {new Date(project.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium">
                  {new Date(project.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days Left:</span>
                <span
                  className={`font-medium ${
                    daysLeft < 0
                      ? "text-red-600"
                      : daysLeft < 7
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}>
                  {daysLeft} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{project.client?.name}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/tasks/new?project=${project._id}`}
                className="block w-full btn btn-primary text-center">
                Add New Task
              </Link>
              <Link
                href={`/projects/${project._id}/edit`}
                className="block w-full btn btn-secondary text-center">
                Edit Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
