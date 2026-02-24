import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/whisper";
import { getProjectContext } from "@/lib/linear";
import { extractOpenClawContext } from "@/lib/context";
import { interpretTask } from "@/lib/taskInterpreter";

/**
 * Step 1: Interpret input (text or audio) into a StructuredTask.
 * Does NOT create an issue in Linear — that happens in /confirm.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let text: string;
    let projectId: string | undefined;
    let teamId: string | undefined;
    let onlyTranscription = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      projectId = (formData.get("projectId") as string) || undefined;
      teamId = (formData.get("teamId") as string) || undefined;
      const audioFile = formData.get("audio") as File | null;
      const textField = formData.get("text") as string | null;
      onlyTranscription = formData.get("onlyTranscription") === "true";

      if (audioFile && audioFile.size > 0) {
        try {
          text = await transcribeAudio(audioFile);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error desconocido";
          return NextResponse.json(
            { error: `Error en transcripción de audio: ${msg}` },
            { status: 500 }
          );
        }
      } else if (textField) {
        text = textField;
      } else {
        return NextResponse.json(
          { error: "Se requiere un archivo de audio o texto" },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      projectId = body.projectId;
      teamId = body.teamId;
      text = body.text;
      onlyTranscription = Boolean(body.onlyTranscription);
    }

    if (onlyTranscription) {
      return NextResponse.json({
        transcribedText: text.trim(),
      });
    }

    if (!projectId || !teamId) {
      return NextResponse.json(
        { error: "projectId y teamId son requeridos" },
        { status: 400 }
      );
    }

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "No se obtuvo texto para interpretar" },
        { status: 400 }
      );
    }

    let projectDescription: string;
    try {
      projectDescription = await getProjectContext(projectId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      return NextResponse.json(
        { error: `Error al obtener contexto del proyecto: ${msg}` },
        { status: 500 }
      );
    }

    let openClawContext: string;
    try {
      openClawContext = extractOpenClawContext(projectDescription);
    } catch {
      openClawContext = projectDescription;
    }

    let task;
    try {
      task = await interpretTask(text.trim(), openClawContext);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      return NextResponse.json(
        { error: `Error al interpretar la tarea: ${msg}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      task,
      transcribedText: text.trim(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
