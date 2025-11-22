// app/components/Dashboard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  teamMembers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch projects and tasks to calculate stats
      const [projectsRes, tasksRes, teamRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/team-members"),
      ]);

      const projects = await projectsRes.json();
      const tasks = await tasksRes.json();
      const teamMembers = await teamRes.json();

      if (projects.success && tasks.success && teamMembers.success) {
        const totalProjects = projects.data.length;
        const activeProjects = projects.data.filter(
          (p: any) => new Date(p.endDate) > new Date()
        ).length;
        const totalTasks = tasks.data.length;
        const completedTasks = tasks.data.filter(
          (t: any) => t.status === "complete"
        ).length;

        setStats({
          totalProjects,
          activeProjects,
          totalTasks,
          completedTasks,
          teamMembers: teamMembers.data.length,
        });

        setRecentProjects(projects.data.slice(0, 5));
        setRecentTasks(tasks.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-4">
          <Link href="/projects/new" className="btn btn-primary">
            New Project
          </Link>
          <Link href="/tasks/new" className="btn btn-secondary">
            New Task
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          description={`${stats.activeProjects} active`}
          color="blue"
        />
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          description={`${stats.completedTasks} completed`}
          color="green"
        />
        <StatCard
          title="Team Members"
          value={stats.teamMembers}
          description="Active team"
          color="purple"
        />
        <StatCard
          title="Completion Rate"
          value={`${
            stats.totalTasks > 0
              ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
              : 0
          }%`}
          description="Overall progress"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Tasks</h2>
            <Link
              href="/tasks"
              className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="card p-6">
      <div
        className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function ProjectCard({ project }: any) {
  const progress = project.progress || 0;

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{project.name}</h4>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            progress === 100
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}>
          {progress}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-sm text-gray-600">
        {new Date(project.startDate).toLocaleDateString()} -{" "}
        {new Date(project.endDate).toLocaleDateString()}
      </p>
    </div>
  );
}

function TaskCard({ task }: any) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{task.name}</h4>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            task.status === "complete"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}>
          {task.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        Project: {task.project?.name}
      </p>
      <p className="text-sm text-gray-600">
        Assigned to: {task.assignedTeamMember?.name}
      </p>
    </div>
  );
}
