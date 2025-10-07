'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface Task {
  title: string;
  description: string;
  priority: string;
  tags: string[];
}

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id as string;
  const teamId = searchParams.get('teamId');

  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [textoEstructurado, setTextoEstructurado] = useState('');
  const [tareas, setTareas] = useState<Task[]>([]);
  const [tareasCreadas, setTareasCreadas] = useState<any[]>([]);

  const handleInterpret = async () => {
    if (!texto.trim()) return;

    setInterpreting(true);
    try {
      const response = await fetch('/api/tasks/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });

      const data = await response.json();
      setTextoEstructurado(data.textoEstructurado);
      setTareas(data.tareas);
    } catch (error) {
      console.error('Error al interpretar:', error);
      alert('Error al interpretar las tareas');
    } finally {
      setInterpreting(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!teamId || tareas.length === 0) return;

    setLoading(true);
    const creadas = [];

    try {
      for (const tarea of tareas) {
        const response = await fetch('/api/linear/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...tarea,
            teamId,
            projectId,
          }),
        });

        if (response.ok) {
          const issue = await response.json();
          creadas.push(issue);
        }
      }

      setTareasCreadas(creadas);
      setTexto('');
      setTextoEstructurado('');
      setTareas([]);
      
      alert(`¡${creadas.length} tarea(s) creadas exitosamente!`);
    } catch (error) {
      console.error('Error al crear tareas:', error);
      alert('Error al crear algunas tareas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Volver a proyectos</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Crear Nueva Tarea
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Describe lo que necesitas y la IA lo convertirá en tareas estructuradas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe la tarea o funcionalidad
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ej: Necesito implementar un sistema de cierre de caja que muestre el detalle de efectivo, transferencias y tarjetas. Debe permitir contar el efectivo real, identificar el banco de cada depósito..."
                className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <button
              onClick={handleInterpret}
              disabled={!texto.trim() || interpreting}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {interpreting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Interpretando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Interpretar con IA</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {textoEstructurado && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vista Previa de Tareas
                  </label>
                  <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 shadow-sm max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                      {textoEstructurado}
                    </pre>
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
                  <p className="text-sm text-primary-800 dark:text-primary-200">
                    <strong>{tareas.length}</strong> tarea(s) detectada(s)
                  </p>
                </div>

                <button
                  onClick={handleCreateTasks}
                  disabled={loading || tareas.length === 0}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creando tareas...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Crear en Linear</span>
                    </>
                  )}
                </button>
              </>
            )}

            {tareasCreadas.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ Tareas creadas exitosamente
                </h3>
                <ul className="space-y-2">
                  {tareasCreadas.map((tarea, idx) => (
                    <li key={idx}>
                      <a
                        href={tarea.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-700 dark:text-green-300 hover:underline"
                      >
                        {tarea.identifier}: {tarea.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
