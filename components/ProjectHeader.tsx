import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import Modal from './ui/Modal';

const ProjectHeader: React.FC = () => {
    const { activeProject, projects, switchProject, createProject, deleteProject, activeProjectId } = useProject();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            createProject(newProjectName.trim());
            setNewProjectName('');
        }
    };

    return (
        <>
            <div className="bg-white shadow-md p-4 flex justify-between items-center no-print sticky top-0 z-10">
                <div>
                    <span className="text-sm text-gray-500">Proyecto Actual:</span>
                    <h2 className="text-xl font-bold text-black">{activeProject?.name || 'Cargando...'}</h2>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                    Gestionar Proyectos
                </button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gestionar Proyectos">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-black mb-2">Crear Nuevo Proyecto</h3>
                        <form onSubmit={handleCreateProject} className="flex gap-2">
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Nombre del nuevo proyecto"
                                className="w-full p-2 border rounded bg-white text-black placeholder-gray-500"
                                required
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex-shrink-0"
                            >
                                Crear
                            </button>
                        </form>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-black mb-2">Proyectos Existentes</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto p-1 border rounded-md">
                            {projects.length > 0 ? projects.map(project => (
                                <div key={project.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-black">{project.name}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { switchProject(project.id); setIsModalOpen(false); }}
                                            disabled={project.id === activeProjectId}
                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {project.id === activeProjectId ? 'Activo' : 'Cambiar'}
                                        </button>
                                         <button
                                            onClick={() => deleteProject(project.id)}
                                            disabled={projects.length <= 1}
                                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-500 p-4">No hay proyectos. ¡Crea uno para empezar!</p>}
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ProjectHeader;
