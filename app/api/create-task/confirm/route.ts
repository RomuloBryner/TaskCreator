import { NextResponse } from "next/server";
import { createIssue } from "@/lib/linear";
import type { StructuredTask } from "@/lib/types";

/**
 * Step 2: Confirm and create the issue in Linear from a previously interpreted StructuredTask.
 */
export async function POST(request: Request) {
  try {
    const { task, teamId, projectId } = (await request.json()) as {
      task: StructuredTask;
      teamId: string;
      projectId: string;
    };

    if (!task || !teamId) {
      return NextResponse.json(
        { error: "task y teamId son requeridos" },
        { status: 400 }
      );
    }

    if (!task.title || !task.type || !task.priority) {
      return NextResponse.json(
        { error: "La tarea estructurada está incompleta" },
        { status: 400 }
      );
    }

    const issue = await createIssue(task, teamId, projectId);

    return NextResponse.json({ task, issue });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al crear issue en Linear: ${message}` },
      { status: 500 }
    );
  }
}
