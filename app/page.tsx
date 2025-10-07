'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  id: string;
  name: string;
  key: string;
}

interface Project {
  id: string;
  name: string;
  state: string;
  description?: string;
  icon?: string;
  color?: string;
}

export default function Home() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchProjects(selectedTeam);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/linear/teams');
      const data = await response.json();
      
      // Verificar si hay error en la respuesta
      if (data.error) {
        console.error('Error de API:', data.error);
        setTeams([]);
        return;
      }
      
      // Asegurar que data es un array
      if (Array.isArray(data)) {
        setTeams(data);
        if (data.length > 0) {
          setSelectedTeam(data[0].id);
        }
      } else {
        console.error('Respuesta no es un array:', data);
        setTeams([]);
      }
    } catch (error) {
      console.error('Error al obtener equipos:', error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (teamId: string) => {
    setLoadingProjects(true);
    try {
      const response = await fetch(`/api/linear/projects?teamId=${teamId}`);
      const data = await response.json();
      
      // Verificar si hay error en la respuesta
      if (data.error) {
        console.error('Error de API:', data.error);
        setProjects([]);
        return;
      }
      
      // Asegurar que data es un array
      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('Respuesta no es un array:', data);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !selectedTeam) return;

    setCreatingProject(true);
    try {
      const response = await fetch('/api/linear/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName,
          teamId: selectedTeam,
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        // Actualizar la lista de proyectos
        setProjects([...projects, newProject]);
        // Limpiar y cerrar modal
        setNewProjectName('');
        setShowCreateModal(false);
        alert('✅ Proyecto creado exitosamente');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      alert('❌ Error al crear el proyecto');
    } finally {
      setCreatingProject(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Task Creator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crea tareas en Linear usando IA
          </p>
        </div>

        {/* Team Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selecciona un equipo
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} ({team.key})
              </option>
            ))}
          </select>
        </div>

        {/* Create Project Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Crear Nuevo Proyecto</span>
          </button>
        </div>

        {/* Projects Grid */}
        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/project/${project.id}?teamId=${selectedTeam}`)}
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {project.icon && (
                      <span className="text-2xl">{project.icon}</span>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {project.name}
                      </h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        project.state === 'started'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {project.state === 'started' ? 'Activo' : project.state}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No hay proyectos disponibles en este equipo
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Nuevo Proyecto
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del proyecto
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  placeholder="Ej: Sistema de Pagos"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || creatingProject}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {creatingProject ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <span>Crear Proyecto</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
