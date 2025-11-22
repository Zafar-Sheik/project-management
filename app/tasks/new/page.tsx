// app/tasks/new/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import TaskForm from "./TaskForm";

// Loading component for suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Main page component wrapped in Suspense
export default function NewTaskPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewTaskContent />
    </Suspense>
  );
}

// The actual content component that uses useSearchParams
function NewTaskContent() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
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

  const handleSubmit = async (formData: any) => {
    setLoading(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/tasks");
      } else {
        alert("Error creating task: " + result.error);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
        <p className="text-gray-600 mt-2">Add a new task to your project</p>
      </div>

      <TaskForm
        projects={projects}
        teamMembers={teamMembers}
        loading={loading}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
}
