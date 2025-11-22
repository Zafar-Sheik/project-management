// app/tasks/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Task {
  _id: string;
  name: string;
  status: "complete" | "in progress";
  assignedTeamMember: any;
  project: any;
  created_at: string;
}

interface Project {
  _id: string;
  name: string;
}

interface TeamMember {
  _id: string;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "complete" | "in progress">(
    "all"
  );
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchTeamMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      const result = await response.json();

      if (result.success) {
        setTasks(result.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const deleteTask = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this task? This will also delete all associated todos."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setTasks(tasks.filter((task) => task._id !== id));
        // Refresh projects to update progress
        fetchProjects();
      } else {
        alert("Error deleting task: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error deleting task");
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: "complete" | "in progress"
  ) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: taskId,
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTasks(
          tasks.map((task) =>
            task._id === taskId ? { ...task, status: newStatus } : task
          )
        );

        // Refresh projects to update progress
        fetchProjects();
      } else {
        alert("Error updating task status: " + result.error);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Error updating task status");
    }
  };

  // Filter tasks based on all criteria
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (filter !== "all" && task.status !== filter) return false;

    // Project filter
    if (projectFilter !== "all" && task.project?._id !== projectFilter)
      return false;

    // Team member filter
    if (
      teamMemberFilter !== "all" &&
      task.assignedTeamMember?._id !== teamMemberFilter
    )
      return false;

    // Search term filter
    if (
      searchTerm &&
      !task.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !task.project?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !task.assignedTeamMember?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "complete"
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in progress"
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">
            {totalTasks} total tasks • {completedTasks} completed •{" "}
            {inProgressTasks} in progress
          </p>
        </div>
        <Link href="/tasks/new" className="btn btn-primary">
          Create New Task
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Tasks" value={totalTasks} color="blue" />
        <StatCard title="Completed" value={completedTasks} color="green" />
        <StatCard title="In Progress" value={inProgressTasks} color="yellow" />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input">
              <option value="all">All Status</option>
              <option value="in progress">In Progress</option>
              <option value="complete">Completed</option>
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label
              htmlFor="project"
              className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <select
              id="project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="input">
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Member Filter */}
          <div>
            <label
              htmlFor="teamMember"
              className="block text-sm font-medium text-gray-700 mb-2">
              Team Member
            </label>
            <select
              id="teamMember"
              value={teamMemberFilter}
              onChange={(e) => setTeamMemberFilter(e.target.value)}
              className="input">
              <option value="all">All Members</option>
              {teamMembers.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilter("all");
                setProjectFilter("all");
                setTeamMemberFilter("all");
                setSearchTerm("");
              }}
              className="btn btn-secondary w-full">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <TaskItem
            key={task._id}
            task={task}
            onDelete={deleteTask}
            onStatusChange={updateTaskStatus}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {tasks.length === 0
              ? "No tasks found"
              : "No tasks match your filters"}
          </div>
          {tasks.length === 0 ? (
            <Link href="/tasks/new" className="btn btn-primary">
              Create your first task
            </Link>
          ) : (
            <button
              onClick={() => {
                setFilter("all");
                setProjectFilter("all");
                setTeamMemberFilter("all");
                setSearchTerm("");
              }}
              className="btn btn-primary">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onStatusChange: (
    taskId: string,
    newStatus: "complete" | "in progress"
  ) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={task.status === "complete"}
            onChange={(e) => {
              const newStatus = e.target.checked ? "complete" : "in progress";
              onStatusChange(task._id, newStatus);
            }}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
          />

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3
                className={`text-lg font-medium truncate ${
                  task.status === "complete"
                    ? "text-gray-500 line-through"
                    : "text-gray-900"
                }`}>
                {task.name}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === "complete"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                {task.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Project: {task.project?.name || "No project"}</span>
              </div>

              <div className="flex items-center space-x-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>
                  Assigned: {task.assignedTeamMember?.name || "Unassigned"}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  Created: {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 ml-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            {isExpanded ? "Less" : "More"}
          </button>

          <Link
            href={`/tasks/${task._id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View
          </Link>

          <Link
            href={`/tasks/${task._id}/edit`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Edit
          </Link>

          <button
            onClick={() => onDelete(task._id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium">
            Delete
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Project Details
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Name:</strong> {task.project?.name || "No project"}
                </p>
                <p>
                  <strong>Client:</strong>{" "}
                  {task.project?.client?.name || "No client"}
                </p>
                {task.project && (
                  <p>
                    <strong>Progress:</strong>
                    <span className="ml-2 inline-flex items-center">
                      <span className="mr-2">
                        {task.project.progress || 0}%
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${task.project.progress || 0}%`,
                          }}></div>
                      </div>
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Assignment Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Assignment Details
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Assigned to:</strong>{" "}
                  {task.assignedTeamMember?.name || "Unassigned"}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  {task.assignedTeamMember?.role || "No role"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {task.assignedTeamMember?.email || "No email"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() =>
                onStatusChange(
                  task._id,
                  task.status === "complete" ? "in progress" : "complete"
                )
              }
              className={`btn text-sm ${
                task.status === "complete" ? "btn-secondary" : "btn-primary"
              }`}>
              Mark as {task.status === "complete" ? "In Progress" : "Complete"}
            </button>
            <Link
              href={`/tasks/${task._id}`}
              className="btn btn-secondary text-sm">
              Manage Todos
            </Link>
            <Link
              href={`/projects/${task.project?._id}`}
              className="btn btn-secondary text-sm">
              View Project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color: "blue" | "green" | "yellow" | "purple" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`card p-4 border-l-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium">{title}</div>
    </div>
  );
}
