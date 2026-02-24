export type StructuredTask = {
  title: string;
  type: "feature" | "bug" | "refactor" | "infra";
  priority: "low" | "medium" | "high";
  scope: "minor" | "moderate" | "major";
  description: string;
  technicalTasks: string[];
  requiresMigration: boolean;
};

export interface LinearIssue {
  id: string;
  title: string;
  url: string;
  identifier: string;
}

export interface Team {
  id: string;
  name: string;
  key: string;
}

export interface Project {
  id: string;
  name: string;
  state: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CreateTaskRequest {
  projectId: string;
  teamId: string;
  text?: string;
}

export interface CreateTaskResponse {
  task: StructuredTask;
  issue: LinearIssue;
}
