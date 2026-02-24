'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import type { StructuredTask, LinearIssue } from '@/lib/types';

type InputMode = 'text' | 'record' | 'upload';

type FlowStep = 'input' | 'preview' | 'done';

export default function ProjectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.id as string;
  const teamId = searchParams.get('teamId');

  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [texto, setTexto] = useState('');
  const [flowStep, setFlowStep] = useState<FlowStep>('input');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Interpreted task (Step 2: preview)
  const [interpretedTask, setInterpretedTask] = useState<StructuredTask | null>(null);
  const [transcribedText, setTranscribedText] = useState('');

  // Created issue (Step 3: done)
  const [createdIssue, setCreatedIssue] = useState<LinearIssue | null>(null);

  // ---- Audio Recording ----

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setUploadedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setAudioBlob(null);
    }
  };

  // ---- Step 1: Interpret ----

  const handleInterpret = async () => {
    if (!teamId) return;
    setProcessing(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('teamId', teamId);

      if (inputMode === 'record' && audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      } else if (inputMode === 'upload' && uploadedFile) {
        formData.append('audio', uploadedFile);
      } else {
        formData.append('text', texto);
      }

      const response = await fetch('/api/create-task', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al interpretar');
      }

      setInterpretedTask(data.task);
      setTranscribedText(data.transcribedText || texto);
      setFlowStep('preview');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Error al interpretar');
    } finally {
      setProcessing(false);
    }
  };

  // ---- Step 2: Confirm & Create ----

  const handleConfirm = async () => {
    if (!teamId || !interpretedTask) return;
    setProcessing(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/create-task/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: interpretedTask,
          teamId,
          projectId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear en Linear');
      }

      setCreatedIssue(data.issue);
      setFlowStep('done');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Error al crear en Linear');
    } finally {
      setProcessing(false);
    }
  };

  // ---- Reset ----

  const handleReset = () => {
    setFlowStep('input');
    setInterpretedTask(null);
    setCreatedIssue(null);
    setTranscribedText('');
    setTexto('');
    setErrorMsg('');
    clearAudio();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBackToEdit = () => {
    setFlowStep('input');
    setInterpretedTask(null);
    setErrorMsg('');
  };

  const canSubmit =
    (inputMode === 'text' && texto.trim()) ||
    (inputMode === 'record' && audioBlob) ||
    (inputMode === 'upload' && uploadedFile);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver a proyectos</span>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Crear Nueva Tarea
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Describe lo que necesitas con texto o voz y la IA lo convertirá en una tarea estructurada
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center space-x-4">
          {(['input', 'preview', 'done'] as FlowStep[]).map((step, idx) => {
            const labels = ['Entrada', 'Revisar', 'Creada'];
            const isActive = step === flowStep;
            const isPast = ['input', 'preview', 'done'].indexOf(flowStep) > idx;
            return (
              <div key={step} className="flex items-center space-x-2">
                {idx > 0 && (
                  <div className={`w-8 h-0.5 ${isPast || isActive ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                )}
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : isPast
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isPast
                      ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {isPast ? '✓' : idx + 1}
                  </span>
                  <span>{labels[idx]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
          </div>
        )}

        {/* ============ STEP 1: INPUT ============ */}
        {flowStep === 'input' && (
          <div className="space-y-6">
            {/* Input Mode Selector */}
            <div className="flex space-x-2">
              <button
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  inputMode === 'text'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Texto</span>
                </span>
              </button>
              <button
                onClick={() => { setInputMode('record'); clearAudio(); }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  inputMode === 'record'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Grabar Audio</span>
                </span>
              </button>
              <button
                onClick={() => { setInputMode('upload'); clearAudio(); }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  inputMode === 'upload'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Subir Archivo</span>
                </span>
              </button>
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describe la tarea o funcionalidad
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Ej: Necesito implementar un sistema de cierre de caja que muestre el detalle de efectivo, transferencias y tarjetas..."
                  className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>
            )}

            {/* Record Audio */}
            {inputMode === 'record' && (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                {!isRecording && !audioBlob && (
                  <>
                    <button
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </button>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      Presiona para grabar
                    </p>
                  </>
                )}

                {isRecording && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                      </span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Grabando...</p>
                    <button
                      onClick={stopRecording}
                      className="px-6 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
                    >
                      Detener
                    </button>
                  </div>
                )}

                {audioBlob && !isRecording && (
                  <div className="flex flex-col items-center space-y-4 w-full">
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">Audio grabado</span>
                    </div>
                    <audio controls className="w-full max-w-sm">
                      <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
                    </audio>
                    <button
                      onClick={clearAudio}
                      className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                    >
                      Descartar y grabar de nuevo
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upload Audio */}
            {inputMode === 'upload' && (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-primary-500 transition-colors"
                >
                  {!uploadedFile ? (
                    <>
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Haz clic para seleccionar un archivo</p>
                      <p className="text-xs text-gray-400">Audio: MP3, WAV, M4A, OGG | Video: MP4, WEBM, MOV (max 25MB)</p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Archivo seleccionado</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-400">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*,.mp3,.wav,.webm,.m4a,.ogg,.mp4,.mpeg,.mov"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleInterpret}
              disabled={!canSubmit || processing}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {processing ? (
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
        )}

        {/* ============ STEP 2: PREVIEW ============ */}
        {flowStep === 'preview' && interpretedTask && (
          <div className="space-y-6">
            {/* Transcribed text (if audio) */}
            {transcribedText && inputMode !== 'text' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase mb-1">Texto transcrito</p>
                <p className="text-sm text-blue-800 dark:text-blue-200">{transcribedText}</p>
              </div>
            )}

            {/* Task Preview Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 space-y-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Revisa la tarea antes de crearla
              </h3>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Título</span>
                <p className="text-lg text-gray-900 dark:text-white font-semibold">{interpretedTask.title}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</span>
                  <span className={`block mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    interpretedTask.type === 'feature' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    interpretedTask.type === 'bug' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    interpretedTask.type === 'refactor' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {interpretedTask.type}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prioridad</span>
                  <span className={`block mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    interpretedTask.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    interpretedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {interpretedTask.priority}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Alcance</span>
                  <span className="block mt-1 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {interpretedTask.scope}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descripción</span>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{interpretedTask.description}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tareas Técnicas</span>
                <ul className="mt-1 space-y-1">
                  {interpretedTask.technicalTasks.map((task, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="text-primary-500 mt-0.5">-</span>
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Requiere Migración</span>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {interpretedTask.requiresMigration ? 'Sí' : 'No'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleBackToEdit}
                disabled={processing}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Volver a editar
              </button>
              <button
                onClick={handleConfirm}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creando en Linear...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirmar y Crear en Linear</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============ STEP 3: DONE ============ */}
        {flowStep === 'done' && createdIssue && interpretedTask && (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                Tarea creada exitosamente
              </h3>
              <p className="text-green-700 dark:text-green-300 font-medium">{interpretedTask.title}</p>
              <a
                href={createdIssue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <span>Ver en Linear: {createdIssue.identifier}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Crear otra tarea</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
