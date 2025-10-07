# Task Creator - Linear Integration

Una aplicación Next.js moderna que permite crear tareas en Linear usando inteligencia artificial para interpretar descripciones en lenguaje natural.

## 🚀 Características

- **Interpretación con IA**: Convierte descripciones en lenguaje natural a tareas estructuradas
- **Integración con Linear**: Crea tareas directamente en tus proyectos de Linear
- **Detección automática de proyectos**: Identifica y organiza tareas por proyecto
- **UI Moderna**: Interfaz elegante con Tailwind CSS y modo oscuro
- **Tareas estructuradas**: Genera automáticamente criterios de aceptación Given/When/Then

## 📋 Requisitos previos

- Node.js 18+ 
- Cuenta de Linear con API Key
- Cuenta de OpenAI con API Key

## 🔧 Instalación

1. **Clona el repositorio** (o usa los archivos existentes)

2. **Instala las dependencias**:
```bash
npm install
```

3. **Configura las variables de entorno**:
Crea un archivo `.env.local` en la raíz del proyecto:

```env
OPENAI_API_KEY=tu_api_key_de_openai
LINEAR_API_KEY=tu_api_key_de_linear
```

Para obtener tus API keys:
- **OpenAI**: https://platform.openai.com/api-keys
- **Linear**: Settings → API → Personal API keys

4. **Inicia el servidor de desarrollo**:
```bash
npm run dev
```

5. **Abre tu navegador** en [http://localhost:3000](http://localhost:3000)

## 📖 Cómo usar

1. **Selecciona un equipo** de Linear en la página principal
2. **Elige un proyecto** de la lista mostrada
3. **Describe la tarea** que necesitas en lenguaje natural
4. **Presiona "Interpretar con IA"** para que GPT genere las tareas estructuradas
5. **Revisa la vista previa** de las tareas generadas
6. **Presiona "Crear en Linear"** para crear las tareas en tu proyecto

## 🎨 Tecnologías utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **OpenAI API** - Interpretación de tareas con IA
- **Linear API** - Integración con Linear

## 📁 Estructura del proyecto

```
task-creator/
├── app/
│   ├── api/
│   │   ├── linear/          # API routes para Linear
│   │   │   ├── teams/
│   │   │   ├── projects/
│   │   │   └── issues/
│   │   └── tasks/           # API route para interpretar tareas
│   ├── project/[id]/        # Página de proyecto individual
│   ├── globals.css          # Estilos globales
│   ├── layout.tsx           # Layout principal
│   └── page.tsx             # Página principal (lista de proyectos)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🌟 Características de las tareas generadas

Cada tarea incluye automáticamente:
- **Título** (≤70 caracteres)
- **Descripción detallada** con contexto técnico
- **Criterios de aceptación** en formato Given/When/Then
- **Prioridad** (urgent, high, medium, low)
- **Tags** en kebab-case

## 🚀 Deploy

Para deployar en Vercel:

```bash
npm run build
```

O conecta tu repositorio a Vercel para deployment automático.

No olvides configurar las variables de entorno en Vercel:
- `OPENAI_API_KEY`
- `LINEAR_API_KEY`

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

