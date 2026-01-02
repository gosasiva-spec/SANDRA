
import React, { useState } from 'react';
import { Photo } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import ConfirmModal from './ui/ConfirmModal';
import { useProject } from '../contexts/ProjectContext';

const PhotoLog: React.FC = () => {
    const { currentUser, projectData, addItem, updateItem, deleteItem } = useProject();
    const canEdit = currentUser.role !== 'viewer';
    
    const photos = projectData.photos;
    const tasks = projectData.tasks;

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    const [newPhoto, setNewPhoto] = useState<Partial<Photo>>({ tags: [] });
    const [editingPhoto, setEditingPhoto] = useState<Partial<Photo>>({});
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [validationError, setValidationError] = useState<string>('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, id: string | null, name: string}>({isOpen: false, id: null, name: ''});

    const handleOpenUploadModal = () => {
        if (!canEdit) return;
        setValidationError('');
        setNewPhoto({ tags: [] });
        setIsUploadModalOpen(true);
    };

    const handleOpenEditModal = (photo: Photo) => {
        if (!canEdit) return;
        setValidationError('');
        setEditingPhoto({ ...photo });
        setIsEditModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                if (isEditing) {
                    setEditingPhoto(prev => ({ ...prev, url }));
                } else {
                    setNewPhoto(prev => ({ ...prev, url }));
                }
                setValidationError('');
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSavePhoto = async () => {
        if (!newPhoto.url) {
            setValidationError('Por favor, seleccione una imagen para subir.');
            return;
        }
        if (!newPhoto.description) {
             setValidationError('Por favor, ingrese una descripción para la foto.');
             return;
        }

        await addItem('photos', {
            id: `photo-${Date.now()}`,
            url: newPhoto.url,
            description: newPhoto.description,
            tags: newPhoto.tags || [],
            uploadDate: new Date().toISOString(),
        });
        setIsUploadModalOpen(false);
        setNewPhoto({ tags: [] });
        setValidationError('');
    };

    const handleUpdatePhoto = async () => {
        if (!editingPhoto.id) return;
        if (!editingPhoto.description) {
            setValidationError('La descripción es obligatoria.');
            return;
        }

        await updateItem('photos', editingPhoto.id, {
            description: editingPhoto.description,
            tags: editingPhoto.tags || [],
            url: editingPhoto.url // In case they changed the image too
        });
        setIsEditModalOpen(false);
        setEditingPhoto({});
    };

    const handleDeleteClick = (e: React.MouseEvent, photo: Photo) => {
        e.stopPropagation(); // Evitar que se abra la vista previa
        if (!canEdit) return;
        setDeleteConfirmation({
            isOpen: true,
            id: photo.id,
            name: photo.description
        });
    };

    const confirmDeletePhoto = async () => {
        if (deleteConfirmation.id) {
            await deleteItem('photos', deleteConfirmation.id);
        }
        setDeleteConfirmation({ isOpen: false, id: null, name: '' });
    };
    
    const handleViewPhoto = (photo: Photo) => {
        setSelectedPhoto(photo);
        setIsViewModalOpen(true);
    };

    const filteredPhotos = photos.filter(photo => 
        photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    
    const linkedTasks = selectedPhoto ? tasks.filter(task => task.photoIds?.includes(selectedPhoto.id)) : [];

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-semibold text-black">Bitácora de Fotos</h2>
                <div className="w-full md:w-auto flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Buscar por descripción o etiqueta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 p-2 border rounded-md"
                    />
                    {canEdit && (
                        <button onClick={handleOpenUploadModal} className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                            Subir Foto
                        </button>
                    )}
                </div>
            </div>

            <Card>
                {filteredPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredPhotos.map(photo => (
                            <div key={photo.id} className="relative group overflow-hidden rounded-lg cursor-pointer border hover:border-primary-500 transition-all" onClick={() => handleViewPhoto(photo)}>
                                <img src={photo.url} alt={photo.description} className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300" />
                                
                                {/* Overlay con descripción */}
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white text-xs truncate w-full">{photo.description}</p>
                                </div>

                                {/* Botones de acción (Edit/Delete) */}
                                {canEdit && (
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenEditModal(photo); }}
                                            className="p-1.5 bg-white text-gray-700 rounded-full hover:bg-blue-50 hover:text-blue-600 shadow-sm transition-colors"
                                            title="Editar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, photo)}
                                            className="p-1.5 bg-white text-gray-700 rounded-full hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors"
                                            title="Eliminar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-black">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="mt-4 text-lg">No se encontraron fotos.</p>
                        {canEdit && <p>Sube una foto para comenzar.</p>}
                    </div>
                )}
            </Card>

            {/* Modal de Subida */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Subir Nueva Foto">
                <div className="space-y-4">
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, false)} className="w-full p-2 border rounded bg-white text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                    {newPhoto.url && <img src={newPhoto.url} alt="Preview" className="max-h-48 rounded-md mx-auto object-cover" />}
                    <input type="text" placeholder="Descripción" value={newPhoto.description || ''} onChange={e => {setNewPhoto({...newPhoto, description: e.target.value}); setValidationError('');}} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input type="text" placeholder="Etiquetas (separadas por coma)" value={newPhoto.tags?.join(', ') || ''} onChange={e => setNewPhoto({...newPhoto, tags: e.target.value.split(',').map(t=>t.trim())})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    {validationError && <p className="text-red-600 text-sm">{validationError}</p>}
                    <button onClick={handleSavePhoto} className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors font-semibold">Guardar Foto</button>
                </div>
            </Modal>

            {/* Modal de Edición */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Foto">
                <div className="space-y-4">
                    <div className="relative group">
                        <img src={editingPhoto.url} alt="Edit preview" className="max-h-48 rounded-md mx-auto object-cover" />
                        <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center cursor-pointer">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium">Cambiar Imagen</span>
                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, true)} className="hidden" />
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <input type="text" placeholder="Descripción" value={editingPhoto.description || ''} onChange={e => {setEditingPhoto({...editingPhoto, description: e.target.value}); setValidationError('');}} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas (separadas por coma)</label>
                        <input type="text" placeholder="Etiquetas" value={editingPhoto.tags?.join(', ') || ''} onChange={e => setEditingPhoto({...editingPhoto, tags: e.target.value.split(',').map(t=>t.trim())})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    </div>
                    {validationError && <p className="text-red-600 text-sm">{validationError}</p>}
                    <button onClick={handleUpdatePhoto} className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors font-semibold">Actualizar Cambios</button>
                </div>
            </Modal>

            {/* Modal de Vista Previa */}
            {selectedPhoto && (
                 <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalles de la Foto">
                    <img src={selectedPhoto.url} alt={selectedPhoto.description} className="w-full max-h-[60vh] object-contain rounded-lg mb-4"/>
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-black">{selectedPhoto.description}</h3>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {selectedPhoto.id}</span>
                        </div>
                        <p className="text-sm text-gray-600">Subido el: {new Date(selectedPhoto.uploadDate).toLocaleString()}</p>
                        {selectedPhoto.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedPhoto.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">{tag}</span>
                                ))}
                            </div>
                        )}
                        {linkedTasks.length > 0 && (
                            <div className="pt-3 border-t">
                                <h4 className="font-semibold text-black flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    Vinculado a Tareas:
                                </h4>
                                <ul className="list-disc list-inside mt-1 text-sm text-gray-700">
                                    {linkedTasks.map(task => (
                                        <li key={task.id} className="hover:text-primary-600 cursor-default">{task.name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                 </Modal>
            )}

            <ConfirmModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, id: null, name: '' })}
                onConfirm={confirmDeletePhoto}
                title="Eliminar Foto"
                message={`¿Estás seguro de que quieres eliminar la foto "${deleteConfirmation.name}"? Esta acción no se puede deshacer y la foto se desvinculará de cualquier tarea.`}
                confirmText="Eliminar permanentemente"
                isDangerous={true}
            />
        </div>
    );
};

export default PhotoLog;
