import { NextResponse } from 'next/server';

const LINEAR_API = 'https://api.linear.app/graphql';
const LINEAR_TOKEN = process.env.LINEAR_API_KEY;

const priorityMap: { [key: string]: number } = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export async function POST(request: Request) {
  try {
    if (!LINEAR_TOKEN) {
      return NextResponse.json(
        { error: 'LINEAR_API_KEY no está configurado' },
        { status: 500 }
      );
    }

    const { title, description, priority, teamId, projectId } = await request.json();

    if (!title || !teamId) {
      return NextResponse.json(
        { error: 'title y teamId son requeridos' },
        { status: 400 }
      );
    }

    const issueInput: any = {
      teamId,
      title,
      description: description || '',
      priority: priorityMap[priority] || 2,
      labelIds: [],
    };

    if (projectId) {
      issueInput.projectId = projectId;
    }

    const response = await fetch(LINEAR_API, {
      method: 'POST',
      headers: {
        'Authorization': LINEAR_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation ($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue {
                id
                title
                url
                identifier
              }
            }
          }
        `,
        variables: { input: issueInput },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0].message },
        { status: 400 }
      );
    }

    if (!data.data.issueCreate.success) {
      return NextResponse.json(
        { error: 'No se pudo crear la tarea' },
        { status: 400 }
      );
    }

    return NextResponse.json(data.data.issueCreate.issue);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}
