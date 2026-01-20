import { NextResponse } from 'next/server';

const LINEAR_API = 'https://api.linear.app/graphql';
const LINEAR_TOKEN = process.env.LINEAR_API_KEY;

interface MilestonePayload {
  id: string;
  identifier: string;
  url: string;
}

interface IssuePayload {
  id: string;
  identifier: string;
  url: string;
  originalDescription?: string;
}

export async function POST(request: Request) {
  try {
    if (!LINEAR_TOKEN) {
      return NextResponse.json(
        { error: 'LINEAR_API_KEY no está configurado' },
        { status: 500 }
      );
    }

    const { milestone, issues } = (await request.json()) as {
      milestone?: MilestonePayload;
      issues?: IssuePayload[];
    };

    if (!milestone || !issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: 'milestone e issues son requeridos' },
        { status: 400 }
      );
    }

    const results = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const previous = i > 0 ? issues[i - 1] : null;

      const baseDescription = (issue.originalDescription || '').trim();

      const parts: string[] = [];
      if (baseDescription) {
        parts.push(baseDescription);
      }

      // Enlazar milestone
      parts.push(
        `Milestone: [${milestone.identifier}](${milestone.url})`
      );

      // Encadenar dependencias simples (cada tarea depende de la anterior)
      if (previous) {
        parts.push(
          `Depende de: [${previous.identifier}](${previous.url})`
        );
      }

      const newDescription = parts.join('\n\n');

      const response = await fetch(LINEAR_API, {
        method: 'POST',
        headers: {
          Authorization: LINEAR_TOKEN as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation ($id: String!, $input: IssueUpdateInput!) {
              issueUpdate(id: $id, input: $input) {
                success
                issue {
                  id
                }
              }
            }
          `,
          variables: {
            id: issue.id,
            input: {
              description: newDescription,
            },
          },
        }),
      });

      const data = await response.json();

      if (data.errors || !data.data?.issueUpdate?.success) {
        // Si falla, registramos el error pero continuamos con el resto
        console.error('Error al actualizar issue en Linear:', data.errors || data);
        results.push({
          issueId: issue.id,
          success: false,
          error:
            data.errors?.[0]?.message ||
            'No se pudo actualizar la descripción de la tarea',
        });
        continue;
      }

      results.push({
        issueId: issue.id,
        success: true,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error en link de issues Linear:', error);
    return NextResponse.json(
      { error: 'Error al enlazar tareas con milestone y dependencias' },
      { status: 500 }
    );
  }
}

