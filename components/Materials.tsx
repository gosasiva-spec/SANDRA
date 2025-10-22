
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialMaterials, initialMaterialOrders } from '../constants';
import { Material, MaterialOrder } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';

const Materials: React.FC = () => {
    const [materials, setMaterials] = useLocalStorage<Material[]>('materials', initialMaterials);
    const [orders, setOrders] = useLocalStorage<MaterialOrder[]>('materialOrders', initialMaterialOrders);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState<Partial<Material>>({});
    const [isEditing, setIsEditing] = useState(false);

    const handleOpenModal = (material?: Material) => {
        if (material) {
            setCurrentMaterial(material);
            setIsEditing(true);
        } else {
            setCurrentMaterial({
                name: '',
                description: '',
                quantity: 0,
                unit: 'unidades',
                unitCost: 0,
                criticalStockLevel: 0
            });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentMaterial({});
    };

    const handleSave = () => {
        if (isEditing) {
            setMaterials(materials.map(m => m.id === currentMaterial.id ? currentMaterial as Material : m));
        } else {
            const newMaterial = { ...currentMaterial, id: `mat-${Date.now()}` } as Material;
            setMaterials([...materials, newMaterial]);
        }
        handleCloseModal();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentMaterial(prev => ({ ...prev, [name]: name === 'quantity' || name === 'unitCost' || name === 'criticalStockLevel' ? parseFloat(value) : value }));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-gray-800">Inventario de Materiales</h2>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                    Añadir Material
                </button>
            </div>

            <Card>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Cantidad</th>
                            <th className="p-3">Unidad</th>
                            <th className="p-3">Costo Unitario</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map(material => (
                            <tr key={material.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{material.name}</td>
                                <td className="p-3">{material.quantity}</td>
                                <td className="p-3">{material.unit}</td>
                                <td className="p-3">${material.unitCost.toFixed(2)}</td>
                                <td className="p-3">
                                    {material.quantity <= material.criticalStockLevel ? 
                                        (<span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Stock Bajo</span>) :
                                        (<span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">En Stock</span>)
                                    }
                                </td>
                                <td className="p-3">
                                    <button onClick={() => handleOpenModal(material)} className="text-primary-600 hover:text-primary-800">Editar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <div className="mt-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Pedidos de Materiales</h3>
                 <Card>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-3">Material</th>
                                <th className="p-3">Cantidad</th>
                                <th className="p-3">Fecha de Pedido</th>
                                <th className="p-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const material = materials.find(m => m.id === order.materialId);
                                return (
                                    <tr key={order.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{material?.name || 'N/A'}</td>
                                        <td className="p-3">{order.quantity}</td>
                                        <td className="p-3">{new Date(order.orderDate).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                order.status === 'Entregado' ? 'bg-green-200 text-green-800' :
                                                order.status === 'Enviado' ? 'bg-blue-200 text-blue-800' :
                                                order.status === 'Pendiente' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? 'Editar Material' : 'Añadir Nuevo Material'}>
                <div className="space-y-4">
                    <input name="name" value={currentMaterial.name || ''} onChange={handleChange} placeholder="Nombre" className="w-full p-2 border rounded" />
                    <input name="description" value={currentMaterial.description || ''} onChange={handleChange} placeholder="Descripción" className="w-full p-2 border rounded" />
                    <input name="quantity" type="number" value={currentMaterial.quantity || ''} onChange={handleChange} placeholder="Cantidad" className="w-full p-2 border rounded" />
                    <input name="unit" value={currentMaterial.unit || ''} onChange={handleChange} placeholder="Unidad (ej. sacos, m³)" className="w-full p-2 border rounded" />
                    <input name="unitCost" type="number" value={currentMaterial.unitCost || ''} onChange={handleChange} placeholder="Costo Unitario" className="w-full p-2 border rounded" />
                    <input name="criticalStockLevel" type="number" value={currentMaterial.criticalStockLevel || ''} onChange={handleChange} placeholder="Nivel Crítico de Stock" className="w-full p-2 border rounded" />
                    <button onClick={handleSave} className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Guardar</button>
                </div>
            </Modal>
        </div>
    );
};

export default Materials;
