// lib/progressCalculator.ts
import Task from "@/lib/models/Task";
import Project from "@/lib/models/Project";

export async function updateProjectProgress(projectId: string) {
  try {
    // Get all tasks for this project
    const tasks = await Task.find({ project: projectId });

    const totalTasks = tasks.length;
    if (totalTasks === 0) {
      // If no tasks, set progress to 0
      await Project.findByIdAndUpdate(projectId, { progress: 0 });
      return;
    }

    // Count completed tasks
    const completedTasks = tasks.filter(
      (task) => task.status === "complete"
    ).length;

    // Calculate progress percentage
    const progress = Math.round((completedTasks / totalTasks) * 100);

    // Update the project
    await Project.findByIdAndUpdate(projectId, { progress });

    console.log(
      `Updated project ${projectId} progress: ${progress}% (${completedTasks}/${totalTasks} tasks completed)`
    );
  } catch (error) {
    console.error("Error updating project progress:", error);
  }
}

export async function calculateProjectProgress(
  projectId: string
): Promise<number> {
  try {
    const tasks = await Task.find({ project: projectId });
    const totalTasks = tasks.length;

    if (totalTasks === 0) return 0;

    const completedTasks = tasks.filter(
      (task) => task.status === "complete"
    ).length;
    return Math.round((completedTasks / totalTasks) * 100);
  } catch (error) {
    console.error("Error calculating project progress:", error);
    return 0;
  }
}
