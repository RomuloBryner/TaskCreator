import { NextResponse } from 'next/server';

const LINEAR_API = 'https://api.linear.app/graphql';
const LINEAR_TOKEN = process.env.LINEAR_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json(
      { error: 'teamId es requerido' },
      { status: 400 }
    );
  }

  if (!LINEAR_TOKEN) {
    return NextResponse.json(
      { error: 'LINEAR_API_KEY no está configurado' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(LINEAR_API, {
      method: 'POST',
      headers: {
        'Authorization': LINEAR_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($teamId: String!) {
            team(id: $teamId) {
              projects {
                nodes {
                  id
                  name
                  state
                  description
                  icon
                  color
                }
              }
            }
          }
        `,
        variables: { teamId },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Error de Linear API:', data.errors);
      return NextResponse.json(
        { error: data.errors[0].message },
        { status: 400 }
      );
    }

    if (!data.data || !data.data.team || !data.data.team.projects) {
      console.error('Estructura de respuesta inesperada:', data);
      return NextResponse.json(
        { error: 'No se pudieron obtener proyectos del equipo' },
        { status: 500 }
      );
    }

    return NextResponse.json(data.data.team.projects.nodes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, teamId } = await request.json();

    if (!name || !teamId) {
      return NextResponse.json(
        { error: 'name y teamId son requeridos' },
        { status: 400 }
      );
    }

    const response = await fetch(LINEAR_API, {
      method: 'POST',
      headers: {
        'Authorization': LINEAR_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation ($input: ProjectCreateInput!) {
            projectCreate(input: $input) {
              success
              project {
                id
                name
              }
            }
          }
        `,
        variables: {
          input: {
            name,
            teamIds: [teamId],
          },
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0].message },
        { status: 400 }
      );
    }

    if (!data.data.projectCreate.success) {
      return NextResponse.json(
        { error: 'No se pudo crear el proyecto' },
        { status: 400 }
      );
    }

    return NextResponse.json(data.data.projectCreate.project);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
