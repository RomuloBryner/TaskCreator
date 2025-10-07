import os
import requests
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

LINEAR_API = "https://api.linear.app/graphql"
LINEAR_TOKEN = os.getenv("LINEAR_API_KEY")

def interpretar_tarea(texto):
    """
    Usa ChatGPT para transformar texto libre en una estructura de tarea para Linear.
    """
    prompt = f"""
Eres un asistente que organiza y planifica tareas en un formato texto estructurado.

Reglas:

Cada tarea debe llevar:
- Proyecto: nombre del proyecto al que pertenece (detecta o infiere del contexto, ej: "Sistema de Pagos", "App Mobile", "Backend API").
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
Proyecto: [Nombre del proyecto]  
Descripcion:  
[...]  

Criterios de aceptación:  
- Given [...] When [...] Then [...]  
- Given [...] When [...] Then [...]  

Priority: high  
Tags: frontend, strapi, ux-ui  

---

### Tarea 1.2 – [Título del hijo]  
Proyecto: [Nombre del proyecto]  
Descripcion:  
[...]  

Criterios de aceptación:  
- Given [...] When [...] Then [...]  

Priority: medium  
Tags: n8n, api, automation

---

Texto del usuario:
{texto}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    return response.choices[0].message.content.strip()

def parsear_tareas(texto_estructurado):
    """
    Parsea el texto estructurado y extrae las tareas individuales.
    Retorna una lista de diccionarios con la información de cada tarea.
    """
    import re
    
    tareas = []
    # Dividir por subtareas (###)
    bloques = re.split(r'\n### Tarea', texto_estructurado)
    
    for i, bloque in enumerate(bloques):
        if i == 0:  # El primer bloque contiene solo el título padre
            continue
            
        # Extraer título
        titulo_match = re.search(r'^[^\n]+–\s*(.+?)(?:\s*\n|$)', bloque)
        if not titulo_match:
            continue
        titulo = titulo_match.group(1).strip()
        
        # Extraer proyecto
        proyecto_match = re.search(r'Proyecto:\s*(.+?)(?:\s*\n|$)', bloque)
        proyecto = proyecto_match.group(1).strip() if proyecto_match else "General"
        
        # Extraer descripción
        desc_match = re.search(r'Descripcion:\s*\n(.*?)(?=\n\s*Criterios de aceptación:|$)', bloque, re.DOTALL)
        descripcion = desc_match.group(1).strip() if desc_match else ""
        
        # Extraer criterios de aceptación
        criterios_match = re.search(r'Criterios de aceptación:\s*\n((?:- .*?\n)+)', bloque, re.DOTALL)
        criterios = ""
        if criterios_match:
            criterios_list = re.findall(r'- (.+)', criterios_match.group(1))
            criterios = "\n".join(f"• {c}" for c in criterios_list)
        
        # Combinar descripción con criterios
        descripcion_completa = f"{descripcion}\n\n**Criterios de aceptación:**\n{criterios}" if criterios else descripcion
        
        # Extraer prioridad
        priority_match = re.search(r'Priority:\s*(urgent|high|medium|low)', bloque, re.IGNORECASE)
        priority = priority_match.group(1).lower() if priority_match else "medium"
        
        # Extraer tags
        tags_match = re.search(r'Tags:\s*(.+)', bloque)
        tags = []
        if tags_match:
            tags = [t.strip() for t in tags_match.group(1).split(',')]
        
        tareas.append({
            "title": titulo[:70],  # Limitar a 70 caracteres
            "description": descripcion_completa,
            "priority": priority,
            "tags": tags,
            "project": proyecto
        })
    
    return tareas

def obtener_equipos_linear():
    """
    Obtiene la lista de equipos disponibles en Linear.
    """
    headers = {
        "Authorization": f"{LINEAR_TOKEN}",
        "Content-Type": "application/json"
    }
    
    query = """
    query {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
    """
    
    data = {"query": query}
    res = requests.post(LINEAR_API, headers=headers, json=data)
    return res.json()

def obtener_proyectos_linear(team_id):
    """
    Obtiene la lista de proyectos disponibles en Linear para un equipo específico.
    """
    headers = {
        "Authorization": f"{LINEAR_TOKEN}",
        "Content-Type": "application/json"
    }
    
    query = """
    query ($teamId: String!) {
      projects(filter: { team: { id: { eq: $teamId } } }) {
        nodes {
          id
          name
          state
        }
      }
    }
    """
    
    data = {
        "query": query,
        "variables": {"teamId": team_id}
    }
    res = requests.post(LINEAR_API, headers=headers, json=data)
    return res.json()

def crear_proyecto_linear(nombre_proyecto, team_id):
    """
    Crea un nuevo proyecto en Linear.
    """
    headers = {
        "Authorization": f"{LINEAR_TOKEN}",
        "Content-Type": "application/json"
    }
    
    query = """
    mutation ($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success
        project {
          id
          name
        }
      }
    }
    """
    
    data = {
        "query": query,
        "variables": {
            "input": {
                "name": nombre_proyecto,
                "teamIds": [team_id]
            }
        }
    }
    
    res = requests.post(LINEAR_API, headers=headers, json=data)
    return res.json()

def crear_tarea_linear(tarea_json, team_id, project_id=None):
    """
    Crea una tarea en Linear usando la API GraphQL.
    """
    headers = {
        "Authorization": f"{LINEAR_TOKEN}",
        "Content-Type": "application/json"
    }

    query = """
    mutation ($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          title
          url
        }
      }
    }
    """

    issue_input = {
        "teamId": team_id,
        "title": tarea_json["title"],
        "description": tarea_json["description"],
        "priority": ["low", "medium", "high", "urgent"].index(tarea_json["priority"]) + 1,
        "labelIds": [],
    }
    
    # Agregar projectId si está disponible
    if project_id:
        issue_input["projectId"] = project_id

    data = {
        "query": query,
        "variables": {
            "input": issue_input
        }
    }

    res = requests.post(LINEAR_API, headers=headers, json=data)
    return res.json()

def main():
    import json
    
    # Obtener equipos disponibles
    print("🔍 Obteniendo equipos de Linear...")
    equipos_resp = obtener_equipos_linear()
    
    if 'errors' in equipos_resp:
        print(f"\n❌ Error al obtener equipos: {equipos_resp['errors']}")
        return
    
    equipos = equipos_resp.get('data', {}).get('teams', {}).get('nodes', [])
    
    if not equipos:
        print("\n❌ No se encontraron equipos disponibles.")
        return
    
    print("\n📋 Equipos disponibles:")
    for i, equipo in enumerate(equipos, 1):
        print(f"{i}. {equipo['name']} (key: {equipo['key']})")
    
    # Seleccionar equipo
    while True:
        try:
            opcion = int(input(f"\nSelecciona un equipo (1-{len(equipos)}): "))
            if 1 <= opcion <= len(equipos):
                team_id = equipos[opcion - 1]['id']
                break
            else:
                print(f"Por favor ingresa un número entre 1 y {len(equipos)}")
        except ValueError:
            print("Por favor ingresa un número válido")
    
    texto = input("\nPega aquí la conversación o descripción: ")

    print("\n🧠 Interpretando con ChatGPT...")
    texto_estructurado = interpretar_tarea(texto)
    
    print("\n" + "="*80)
    print("📋 TAREAS ESTRUCTURADAS")
    print("="*80)
    print(texto_estructurado)
    print("="*80 + "\n")
    
    # Parsear las tareas del texto estructurado
    tareas = parsear_tareas(texto_estructurado)
    
    if not tareas:
        print("⚠️ No se pudieron extraer tareas del texto. Revisa el formato.")
        return
    
    print(f"✅ Se encontraron {len(tareas)} tarea(s) para crear.\n")
    
    # Confirmar antes de crear
    confirmar = input("¿Deseas crear estas tareas en Linear? (s/n): ")
    if confirmar.lower() not in ['s', 'si', 'sí', 'yes', 'y']:
        print("❌ Operación cancelada.")
        return
    
    # Obtener proyectos existentes
    print("\n🔍 Obteniendo proyectos del equipo...")
    proyectos_resp = obtener_proyectos_linear(team_id)
    
    if 'errors' in proyectos_resp:
        print(f"⚠️ Advertencia al obtener proyectos: {proyectos_resp['errors']}")
        proyectos_existentes = {}
    else:
        proyectos_nodes = proyectos_resp.get('data', {}).get('projects', {}).get('nodes', [])
        # Crear diccionario de proyectos existentes (nombre -> id)
        proyectos_existentes = {p['name']: p['id'] for p in proyectos_nodes}
        print(f"   Encontrados {len(proyectos_existentes)} proyecto(s) existente(s)")
    
    # Cache de proyectos creados en esta sesión
    proyectos_cache = {}
    
    # Crear cada tarea en Linear
    print("\n📬 Creando tareas en Linear...\n")
    tareas_creadas = []
    
    for idx, tarea in enumerate(tareas, 1):
        nombre_proyecto = tarea.get('project', 'General')
        project_id = None
        
        # Buscar o crear proyecto
        if nombre_proyecto in proyectos_existentes:
            project_id = proyectos_existentes[nombre_proyecto]
        elif nombre_proyecto in proyectos_cache:
            project_id = proyectos_cache[nombre_proyecto]
        else:
            # Crear nuevo proyecto
            print(f"   📁 Creando proyecto: {nombre_proyecto}...")
            proyecto_resp = crear_proyecto_linear(nombre_proyecto, team_id)
            
            if 'errors' in proyecto_resp:
                print(f"      ⚠️ No se pudo crear el proyecto: {proyecto_resp['errors'][0].get('message', 'Error')}")
            elif proyecto_resp.get('data', {}).get('projectCreate', {}).get('success'):
                project_id = proyecto_resp['data']['projectCreate']['project']['id']
                proyectos_cache[nombre_proyecto] = project_id
                print(f"      ✅ Proyecto creado")
        
        # Crear tarea
        print(f"[{idx}/{len(tareas)}] Creando tarea: {tarea['title'][:50]}...")
        if project_id:
            print(f"   → Proyecto: {nombre_proyecto}")
        
        resp = crear_tarea_linear(tarea, team_id, project_id)
        
        if 'errors' in resp:
            print(f"   ❌ Error: {resp['errors'][0].get('message', 'Error desconocido')}")
        elif resp.get('data', {}).get('issueCreate', {}).get('success'):
            issue = resp['data']['issueCreate']['issue']
            tareas_creadas.append(issue)
            print(f"   ✅ Creada: {issue['url']}")
        else:
            print(f"   ⚠️ Respuesta inesperada")
    
    print(f"\n{'='*80}")
    print(f"🎉 Proceso completado: {len(tareas_creadas)}/{len(tareas)} tareas creadas exitosamente")
    print(f"{'='*80}")

if __name__ == "__main__":
    main()
