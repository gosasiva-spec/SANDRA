import React, { useState, useRef, useMemo, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialTasks, initialWorkers, initialPhotos } from '../constants';
import { Task, Worker, Photo } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import ProgressBar from './ui/ProgressBar';
import { useProject } from '../contexts/ProjectContext';

const GanttChart: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const ganttContainerRef = useRef<HTMLDivElement>(null);
    const todayRef = useRef<HTMLDivElement>(null);
    const [taskPositions, setTaskPositions] = useState<Record<string, { top: number, height: number, left: number, width: number }>>({});

    const sortedTasks = useMemo(() => [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [tasks]);

    const { startDate, endDate, totalDays } = useMemo(() => {
        if (sortedTasks.length === 0) {
            const now = new Date();
            const start = new Date(now);
            const end = new Date(now);
            end.setDate(end.getDate() + 30);
            return { startDate: start, endDate: end, totalDays: 30 };
        }
        const startDates = sortedTasks.map(t => new Date(t.startDate).getTime());
        const endDates = sortedTasks.map(t => new Date(t.endDate).getTime());
        const minTime = Math.min(...startDates);
        const maxTime = Math.max(...endDates);
        const startDate = new Date(minTime);
        const endDate = new Date(maxTime);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
        return { startDate, endDate, totalDays: totalDays <= 0 ? 1 : totalDays };
    }, [sortedTasks]);

    useEffect(() => {
        if (todayRef.current) {
            todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }, [startDate]); // Scroll to today on initial load

    useEffect(() => {
        const calculatePositions = () => {
            if (!ganttContainerRef.current) return;
            const newPositions: Record<string, { top: number, height: number, left: number, width: number }> = {};
            const taskElements = ganttContainerRef.current.querySelectorAll('.gantt-task-row');
            taskElements.forEach((el, index) => {
                const taskId = el.getAttribute('data-task-id');
                if (taskId) {
                    const rect = el.getBoundingClientRect();
                    const containerRect = ganttContainerRef.current!.getBoundingClientRect();
                    
                    const task = sortedTasks.find(t => t.id === taskId);
                    if (task) {
                        const taskStart = new Date(task.startDate);
                        const taskEnd = new Date(task.endDate);
                        const startOffsetDays = (taskStart.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                        const durationDays = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 3600 * 24) + 1;
                        
                        const left = (startOffsetDays / totalDays) * 100;
                        const width = (durationDays / totalDays) * 100;

                        newPositions[taskId] = {
                            top: el.offsetTop,
                            height: rect.height,
                            left,
                            width,
                        };
                    }
                }
            });
            setTaskPositions(newPositions);
        };
        calculatePositions();
        window.addEventListener('resize', calculatePositions);
        return () => window.removeEventListener('resize', calculatePositions);
    }, [sortedTasks, startDate, totalDays]);

    const days = Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date;
    });

    const today = new Date();
    const todayOffset = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    
    return (
        <Card title="Diagrama de Gantt">
            <div className="relative overflow-x-auto" ref={ganttContainerRef}>
                <div className="grid" style={{ gridTemplateColumns: `150px repeat(${totalDays}, minmax(40px, 1fr))`, width: `${150 + totalDays * 40}px` }}>
                    {/* Header */}
                    <div className="sticky left-0 bg-white z-10 border-b border-r font-semibold p-2 text-sm text-black">Tarea</div>
                    {days.map((day, i) => (
                        <div key={i} className="border-b border-r text-center text-xs p-1">
                            <span className="text-black">{day.getDate()}</span>
                            <span className="block text-gray-500">{day.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        </div>
                    ))}

                    {/* Task Rows */}
                    {sortedTasks.map((task, index) => (
                        <React.Fragment key={task.id}>
                            <div 
                                data-task-id={task.id}
                                className="gantt-task-row sticky left-0 bg-white z-10 border-b border-r p-2 text-sm font-medium truncate text-black"
                            >
                                {task.name}
                            </div>
                            <div className="col-span-full" style={{ gridColumn: `2 / span ${totalDays}` }}>
                                {(() => {
                                    const startOffset = (new Date(task.startDate).getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                                    const duration = (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 3600 * 24) + 1;
                                    const progress = task.completedVolume && task.totalVolume ? (task.completedVolume / task.totalVolume) * 100 : task.status === 'Completado' ? 100 : 0;
                                    const statusColor = task.status === 'Completado' ? 'bg-green-500' : task.status === 'En Progreso' ? 'bg-blue-500' : task.status === 'Retrasado' ? 'bg-red-500' : 'bg-gray-400';
                                    
                                    return (
                                        <div className="relative h-full border-b">
                                            <div
                                                title={`${task.name}: ${new Date(task.startDate).toLocaleDateString()} - ${new Date(task.endDate).toLocaleDateString()}`}
                                                className={`absolute my-2 rounded-md h-6 ${statusColor} opacity-70`}
                                                style={{ left: `${(startOffset / totalDays) * 100}%`, width: `${(duration / totalDays) * 100}%` }}
                                            >
                                                <div className={`${statusColor} h-full rounded-md`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
                 {/* Today Marker */}
                {todayOffset >= 0 && todayOffset <= totalDays && (
                    <div 
                        ref={todayRef}
                        className="absolute top-0 bottom-0 border-r-2 border-red-500 z-20" 
                        style={{ left: `calc(150px + ${todayOffset * 40}px)`, width: '40px' }}
                        title={`Hoy: ${today.toLocaleDateString()}`}
                    >
                         <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-1 rounded-sm">Hoy</div>
                    </div>
                )}
                 {/* Dependency Lines */}
                 <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                        </marker>
                    </defs>
                    {sortedTasks.map(task => {
                        if (!task.dependsOn || !taskPositions[task.id]) return null;
                        return task.dependsOn.map(depId => {
                            const fromTaskPos = taskPositions[depId];
                            const toTaskPos = taskPositions[task.id];
                            if (!fromTaskPos || !toTaskPos) return null;

                            const fromX = `calc(${fromTaskPos.left}% + ${fromTaskPos.width}%)`;
                            const fromY = fromTaskPos.top + fromTaskPos.height / 2;
                            const toX = `${toTaskPos.left}%`;
                            const toY = toTaskPos.top + toTaskPos.height / 2;

                            return <path key={`${depId}-${task.id}`} d={`M ${fromX} ${fromY} L ${toX} ${toY}`} stroke="#333" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />;
                        });
                    })}
                </svg>
            </div>
        </Card>
    );
};


const Planning: React.FC = () => {
    const { activeProjectId } = useProject();

    const [tasks, setTasks] = useLocalStorage<Task[]>(`constructpro_project_${activeProjectId}_tasks`, initialTasks);
    const [workers] = useLocalStorage<Worker[]>(`constructpro_project_${activeProjectId}_workers`, initialWorkers);
    const [photos] = useLocalStorage<Photo[]>(`constructpro_project_${activeProjectId}_photos`, initialPhotos);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [isPhotoManagerOpen, setIsPhotoManagerOpen] = useState(false);
    const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

    const handleOpenModal = (task?: Task) => {
        if (task) {
            setCurrentTask(task);
            setIsEditing(true);
        } else {
            setCurrentTask({ status: 'No Iniciado', startDate: new Date().toISOString().split('T')[0], photoIds: [], dependsOn: [] });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const taskToSave: Partial<Task> = { ...currentTask };
    
        // Automatic status update based on progress volume
        if (typeof taskToSave.totalVolume === 'number' && taskToSave.totalVolume > 0) {
            const completedVolume = taskToSave.completedVolume || 0;
            const totalVolume = taskToSave.totalVolume;
    
            if (completedVolume >= totalVolume) {
                // If volume indicates completion, set status accordingly
                if (taskToSave.status !== 'Completado') {
                    taskToSave.status = 'Completado';
                }
            } else if (completedVolume > 0) {
                // If there's some progress, ensure it's 'En Progreso'
                if (taskToSave.status === 'No Iniciado' || taskToSave.status === 'Completado') {
                    taskToSave.status = 'En Progreso';
                }
            }
        }
        
        // Centralized logic for handling completionDate based on the final status
        if (taskToSave.status === 'Completado') {
            // If the task is being marked as complete, set the completion date if it doesn't have one.
            if (!taskToSave.completionDate) {
                taskToSave.completionDate = new Date().toISOString().split('T')[0];
            }
        } else {
            // If the task is not complete, ensure the completion date is cleared.
            taskToSave.completionDate = undefined;
        }
    
        if (isEditing) {
            setTasks(tasks.map(t => t.id === taskToSave.id ? taskToSave as Task : t));
        } else {
            setTasks([...tasks, { ...taskToSave, id: `tsk-${Date.now()}` } as Task]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (taskId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea? También se eliminará como dependencia de otras tareas.')) {
            setTasks(prevTasks => {
                const newTasks = prevTasks.filter(t => t.id !== taskId);
                // Remove the deleted task from other tasks' dependencies
                return newTasks.map(t => {
                    if (t.dependsOn?.includes(taskId)) {
                        return { ...t, dependsOn: t.dependsOn.filter(depId => depId !== taskId) };
                    }
                    return t;
                });
            });
        }
    };
    
    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'Completado': return 'bg-green-500';
            case 'En Progreso': return 'bg-blue-500';
            case 'Retrasado': return 'bg-red-500';
            case 'No Iniciado': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };
    
    const getTaskProgress = (task: Task) => {
        if (task.totalVolume && task.totalVolume > 0) {
            return Math.min(100, ((task.completedVolume || 0) / task.totalVolume) * 100);
        }
        if (task.status === 'Completado') return 100;
        return 0;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-black">Planificación del Proyecto</h2>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                        Añadir Tarea
                    </button>
                </div>
            </div>
            
            <div className="mb-6">
                <GanttChart tasks={tasks} />
            </div>

            <Card title="Lista de Tareas">
                <div className="space-y-4">
                    {tasks.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(task => {
                        const attachedPhotos = task.photoIds ? photos.filter(p => task.photoIds!.includes(p.id)) : [];
                        const dependencies = task.dependsOn ? tasks.filter(t => task.dependsOn!.includes(t.id)) : [];
                        const progress = getTaskProgress(task);
                        return (
                        <div key={task.id} className="p-4 border rounded-lg hover:shadow-lg transition-shadow">
                           <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg text-black">{task.name}</h4>
                                    <p className="text-sm text-black">{task.description}</p>
                                    <p className="text-xs text-black mt-1">Asignado a: {workers.find(w => w.id === task.assignedWorkerId)?.name || 'Sin asignar'}</p>
                                     {dependencies.length > 0 && (
                                        <p className="text-xs text-black mt-1">
                                            Depende de: <span className="font-semibold">{dependencies.map(d => d.name).join(', ')}</span>
                                        </p>
                                     )}
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                     <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${getStatusColor(task.status)}`}>{task.status}</span>
                                    <p className="text-sm text-black mt-1">{new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}</p>
                                     <button onClick={() => handleOpenModal(task)} className="text-sm text-black hover:text-gray-600 mt-1">Editar</button>
                                     <button onClick={() => handleDelete(task.id)} className="text-sm text-red-600 hover:text-red-800 mt-1 ml-2 font-medium">Eliminar</button>
                                </div>
                           </div>
                           <div className="mt-3">
                               <div className="flex items-center">
                                   <div className="flex-grow">
                                       <ProgressBar value={progress} color={task.status === 'Retrasado' ? 'red' : task.status === 'Completado' ? 'green' : 'blue'} />
                                   </div>
                                   <span className="ml-4 w-12 text-right text-sm font-semibold text-black">{progress.toFixed(0)}%</span>
                               </div>
                           </div>
                        </div>
                    )})}
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Editar Tarea' : 'Añadir Nueva Tarea'}>
                <div className="space-y-4 max-h-[80vh] overflow-y-auto p-2">
                    <input type="text" placeholder="Nombre de la Tarea" value={currentTask.name || ''} onChange={e => setCurrentTask({...currentTask, name: e.target.value})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <textarea placeholder="Descripción" value={currentTask.description || ''} onChange={e => setCurrentTask({...currentTask, description: e.target.value})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" rows={2}></textarea>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-black block text-sm font-medium">Fecha de Inicio</label>
                            <input type="date" value={currentTask.startDate || ''} onChange={e => setCurrentTask({...currentTask, startDate: e.target.value})} className="w-full p-2 border rounded bg-white text-black" />
                        </div>
                        <div>
                            <label className="text-black block text-sm font-medium">Fecha de Fin</label>
                            <input type="date" value={currentTask.endDate || ''} onChange={e => setCurrentTask({...currentTask, endDate: e.target.value})} className="w-full p-2 border rounded bg-white text-black" />
                        </div>
                    </div>

                    <div>
                        <label className="text-black block text-sm font-medium">Dependencias (Tareas que deben completarse antes)</label>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                            {tasks.filter(t => t.id !== currentTask.id).map(potentialDep => (
                                <div key={potentialDep.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`dep-${potentialDep.id}`}
                                        checked={currentTask.dependsOn?.includes(potentialDep.id) || false}
                                        onChange={e => {
                                            const selectedId = potentialDep.id;
                                            const isChecked = e.target.checked;
                                            setCurrentTask(prev => {
                                                const currentDeps = prev.dependsOn || [];
                                                if (isChecked) {
                                                    return { ...prev, dependsOn: [...currentDeps, selectedId] };
                                                } else {
                                                    return { ...prev, dependsOn: currentDeps.filter(id => id !== selectedId) };
                                                }
                                            });
                                        }}
                                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor={`dep-${potentialDep.id}`} className="ml-2 text-sm text-black">{potentialDep.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <select value={currentTask.assignedWorkerId || ''} onChange={e => setCurrentTask({...currentTask, assignedWorkerId: e.target.value})} className="w-full p-2 border rounded bg-white text-black">
                        <option value="">Asignar Trabajador</option>
                        {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <select value={currentTask.status || ''} onChange={e => setCurrentTask({...currentTask, status: e.target.value as Task['status']})} className="w-full p-2 border rounded bg-white text-black">
                        <option>No Iniciado</option><option>En Progreso</option><option>Completado</option><option>Retrasado</option>
                    </select>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="text-black block text-sm font-medium">Volumen Total</label>
                            <input type="number" placeholder="Ej. 100" value={currentTask.totalVolume || ''} onChange={e => setCurrentTask({...currentTask, totalVolume: parseFloat(e.target.value) || undefined})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                        </div>
                        <div>
                            <label className="text-black block text-sm font-medium">Unidad</label>
                            <input type="text" placeholder="Ej. m³" value={currentTask.volumeUnit || ''} onChange={e => setCurrentTask({...currentTask, volumeUnit: e.target.value})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                        </div>
                    </div>
                    <div>
                        <label className="text-black block text-sm font-medium">Volumen de Avance</label>
                        <input type="number" placeholder="Ej. 25" value={currentTask.completedVolume || ''} onChange={e => setCurrentTask({...currentTask, completedVolume: parseFloat(e.target.value) || undefined})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    </div>

                    <button onClick={handleSave} className="w-full mt-2 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Guardar Tarea</button>
                </div>
            </Modal>
        </div>
    );
};

export default Planning;