import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no está configurado' },
        { status: 500 }
      );
    }

    const { texto } = await request.json();

    if (!texto) {
      return NextResponse.json(
        { error: 'texto es requerido' },
        { status: 400 }
      );
    }

    const prompt = `
Eres un asistente que organiza y planifica tareas en un formato texto estructurado.

Reglas:

Cada tarea debe llevar:
- Titulo (≤70 caracteres, claro y directo).
- Descripcion: detallada, con contexto técnico, lo que se debe lograr y pasos clave.
- Criterios de aceptación: en formato Given/When/Then, mínimo 2 y máximo 5.
- Priority: urgent | high | medium | low.
- Tags: entre 3–6 en kebab-case (ej: frontend, strapi, n8n, ux-ui, api, render, vercel, video-tools, ai-automation).

Si hay varias tareas relacionadas, identifica una Tarea Padre y enumera las subtareas (hijos) como Tarea 1.1, 1.2, etc.
Cada hijo debe tener sus propias propiedades completas (Titulo, Descripcion, Criterios de aceptación, Priority, Tags).
Si el usuario pide varias cosas sin relación, organízalas en varias tareas padre separadas.
La salida debe ser texto plano (con títulos, subtítulos y bullets como en un documento).
El tono debe ser claro, accionable y técnico.

Formato de salida esperado:

## Tarea Padre 1: [Nombre de la tarea padre]

### Tarea 1.1 – [Título del hijo]  
Descripcion:  
[...]  

Criterios de aceptación:  
- Given [...] When [...] Then [...]  
- Given [...] When [...] Then [...]  

Priority: high  
Tags: frontend, strapi, ux-ui  

---

### Tarea 1.2 – [Título del hijo]  
Descripcion:  
[...]  

Criterios de aceptación:  
- Given [...] When [...] Then [...]  

Priority: medium  
Tags: n8n, api, automation

---

Texto del usuario:
${texto}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const textoEstructurado = response.choices[0].message.content?.trim() || '';

    // Parsear tareas
    const tareas = parsearTareas(textoEstructurado);

    return NextResponse.json({
      textoEstructurado,
      tareas,
    });
  } catch (error) {
    console.error('Error al interpretar tarea:', error);
    return NextResponse.json(
      { error: 'Error al interpretar tarea' },
      { status: 500 }
    );
  }
}

function parsearTareas(textoEstructurado: string) {
  const tareas: any[] = [];
  const bloques = textoEstructurado.split(/\n### Tarea/);

  for (let i = 1; i < bloques.length; i++) {
    const bloque = bloques[i];

    // Extraer título
    const tituloMatch = bloque.match(/^[^\n]+–\s*(.+?)(?:\s*\n|$)/);
    if (!tituloMatch) continue;
    const titulo = tituloMatch[1].trim();

    // Extraer descripción
    const descMatch = bloque.match(/Descripcion:\s*\n(.*?)(?=\n\s*Criterios de aceptación:|$)/s);
    const descripcion = descMatch ? descMatch[1].trim() : '';

    // Extraer criterios de aceptación
    const criteriosMatch = bloque.match(/Criterios de aceptación:\s*\n((?:- .*?\n)+)/s);
    let criterios = '';
    if (criteriosMatch) {
      const criteriosList = criteriosMatch[1].match(/- (.+)/g) || [];
      criterios = criteriosList.map(c => `• ${c.substring(2)}`).join('\n');
    }

    // Combinar descripción con criterios
    const descripcionCompleta = criterios
      ? `${descripcion}\n\n**Criterios de aceptación:**\n${criterios}`
      : descripcion;

    // Extraer prioridad
    const priorityMatch = bloque.match(/Priority:\s*(urgent|high|medium|low)/i);
    const priority = priorityMatch ? priorityMatch[1].toLowerCase() : 'medium';

    // Extraer tags
    const tagsMatch = bloque.match(/Tags:\s*(.+)/);
    const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];

    tareas.push({
      title: titulo.substring(0, 70),
      description: descripcionCompleta,
      priority,
      tags,
    });
  }

  return tareas;
}
