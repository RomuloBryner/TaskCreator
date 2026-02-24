import OpenAI from "openai";
import { StructuredTask } from "./types";

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurado");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SYSTEM_PROMPT = `You are a technical task planner. You receive a user request and project context.
You must produce a single structured task as JSON — nothing else.

Rules:
- Use the project context to understand the stack, conventions and constraints.
- Do NOT invent architecture or tooling not mentioned in the context.
- Be precise and actionable.
- technicalTasks should be concrete development steps.
- Output ONLY valid JSON matching the schema below. No markdown fences, no explanation.

JSON Schema:
{
  "title": "string (max 70 chars)",
  "type": "feature" | "bug" | "refactor" | "infra",
  "priority": "low" | "medium" | "high",
  "scope": "minor" | "moderate" | "major",
  "description": "string — concise context of what needs to be done",
  "technicalTasks": ["string — concrete dev step", ...],
  "requiresMigration": boolean
}`;

export async function interpretTask(
  input: string,
  projectContext: string
): Promise<StructuredTask> {
  const client = getClient();

  const userMessage = `## Project Context\n${projectContext}\n\n## User Request\n${input}`;

  const response = await client.chat.completions.create({
    model: "gpt-5-nano-2025-08-07",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  const raw = response.choices[0].message.content?.trim();
  if (!raw) {
    throw new Error("GPT no devolvió contenido");
  }

  let parsed: StructuredTask;
  try {
    parsed = JSON.parse(raw) as StructuredTask;
  } catch {
    throw new Error(`GPT devolvió JSON inválido: ${raw.slice(0, 200)}`);
  }

  validate(parsed);
  return parsed;
}

function validate(task: StructuredTask): void {
  const validTypes = ["feature", "bug", "refactor", "infra"];
  const validPriorities = ["low", "medium", "high"];
  const validScopes = ["minor", "moderate", "major"];

  if (!task.title || typeof task.title !== "string") {
    throw new Error("StructuredTask: title es requerido");
  }
  if (!validTypes.includes(task.type)) {
    throw new Error(`StructuredTask: type inválido "${task.type}"`);
  }
  if (!validPriorities.includes(task.priority)) {
    throw new Error(`StructuredTask: priority inválida "${task.priority}"`);
  }
  if (!validScopes.includes(task.scope)) {
    throw new Error(`StructuredTask: scope inválido "${task.scope}"`);
  }
  if (!Array.isArray(task.technicalTasks)) {
    throw new Error("StructuredTask: technicalTasks debe ser un array");
  }
}
