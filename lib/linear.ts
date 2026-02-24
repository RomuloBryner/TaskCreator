import { StructuredTask, LinearIssue } from "./types";

const LINEAR_API = "https://api.linear.app/graphql";

function getToken(): string {
  const token = process.env.LINEAR_API_KEY;
  if (!token) throw new Error("LINEAR_API_KEY no está configurado");
  return token;
}

async function linearQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      Authorization: getToken(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message ?? "Error en Linear GraphQL");
  }

  return data.data as T;
}

// --------------- Cache in-memory ---------------

const contextCache = new Map<string, { data: string; timestamp: number }>();
const stateCache = new Map<string, { stateId: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedContext(projectId: string): string | null {
  const entry = contextCache.get(projectId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    contextCache.delete(projectId);
    return null;
  }
  return entry.data;
}

// --------------- Funciones públicas ---------------

export async function getProjectContext(projectId: string): Promise<string> {
  const cached = getCachedContext(projectId);
  if (cached) return cached;

  const result = await linearQuery<{
    project: { name: string; description: string | null } | null;
  }>(
    `query ($id: String!) {
      project(id: $id) {
        name
        description
      }
    }`,
    { id: projectId }
  );

  if (!result.project) {
    throw new Error(`Proyecto con ID "${projectId}" no encontrado en Linear`);
  }

  const description = result.project.description ?? "";
  const context = `Project: ${result.project.name}\n\n${description}`;

  contextCache.set(projectId, { data: context, timestamp: Date.now() });

  return context;
}

async function getApprovedStateId(teamId: string): Promise<string | undefined> {
  const cached = stateCache.get(teamId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.stateId;
  }

  const result = await linearQuery<{
    team: { states: { nodes: { id: string; name: string }[] } } | null;
  }>(
    `query ($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes {
            id
            name
          }
        }
      }
    }`,
    { teamId }
  );

  const approvedState = result.team?.states.nodes.find(
    (s) => s.name.toLowerCase() === "approved"
  );

  if (approvedState) {
    stateCache.set(teamId, { stateId: approvedState.id, timestamp: Date.now() });
  }

  return approvedState?.id;
}

const priorityMap: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

function formatIssueDescription(task: StructuredTask): string {
  const lines: string[] = [
    `# ${task.title}`,
    "",
    "## Context",
    task.description,
    "",
    "## Technical Breakdown",
    ...task.technicalTasks.map((t) => `- ${t}`),
    "",
    "## Metadata",
    `**Type:** ${task.type}`,
    `**Scope:** ${task.scope}`,
    `**Requires Migration:** ${task.requiresMigration ? "Yes" : "No"}`,
  ];

  return lines.join("\n");
}

export async function createIssue(
  task: StructuredTask,
  teamId: string,
  projectId?: string
): Promise<LinearIssue> {
  const input: Record<string, unknown> = {
    teamId,
    title: task.title,
    description: formatIssueDescription(task),
    priority: priorityMap[task.priority] ?? 2,
  };

  if (projectId) {
    input.projectId = projectId;
  }

  const approvedStateId = await getApprovedStateId(teamId);
  if (approvedStateId) {
    input.stateId = approvedStateId;
  }

  const result = await linearQuery<{
    issueCreate: {
      success: boolean;
      issue: LinearIssue;
    };
  }>(
    `mutation ($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          title
          url
          identifier
        }
      }
    }`,
    { input }
  );

  if (!result.issueCreate.success) {
    throw new Error("No se pudo crear la issue en Linear");
  }

  return result.issueCreate.issue;
}
