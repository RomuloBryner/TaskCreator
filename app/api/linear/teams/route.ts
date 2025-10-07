import { NextResponse } from 'next/server';

const LINEAR_API = 'https://api.linear.app/graphql';
const LINEAR_TOKEN = process.env.LINEAR_API_KEY;

export async function GET() {
  try {
    // Verificar que el token esté configurado
    if (!LINEAR_TOKEN) {
      return NextResponse.json(
        { error: 'LINEAR_API_KEY no está configurado en las variables de entorno' },
        { status: 500 }
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
          query {
            teams {
              nodes {
                id
                name
                key
              }
            }
          }
        `,
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

    if (!data.data || !data.data.teams || !data.data.teams.nodes) {
      console.error('Estructura de respuesta inesperada:', data);
      return NextResponse.json(
        { error: 'Estructura de respuesta inesperada de Linear' },
        { status: 500 }
      );
    }

    return NextResponse.json(data.data.teams.nodes);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    return NextResponse.json(
      { error: 'Error al obtener equipos: ' + (error instanceof Error ? error.message : 'Error desconocido') },
      { status: 500 }
    );
  }
}
