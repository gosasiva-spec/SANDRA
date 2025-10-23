
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialMaterials, initialMaterialOrders } from '../constants';
import { Material, MaterialOrder } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import { GoogleGenAI, Type } from "@google/genai";

interface Supplier {
    name: string;
    description: string;
}

const Materials: React.FC = () => {
    const [materials, setMaterials] = useLocalStorage<Material[]>('materials', initialMaterials);
    const [orders, setOrders] = useLocalStorage<MaterialOrder[]>('materialOrders', initialMaterialOrders);
    
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState<Partial<Material>>({});
    const [isEditingMaterial, setIsEditingMaterial] = useState(false);

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Partial<MaterialOrder>>({});
    const [isEditingOrder, setIsEditingOrder] = useState(false);

    const [isSuppliersModalOpen, setIsSuppliersModalOpen] = useState(false);
    const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
    const [suppliersError, setSuppliersError] = useState<string | null>(null);
    const [selectedMaterialForSuppliers, setSelectedMaterialForSuppliers] = useState<Material | null>(null);


    const handleOpenMaterialModal = (material?: Material) => {
        if (material) {
            setCurrentMaterial(material);
            setIsEditingMaterial(true);
        } else {
            setCurrentMaterial({
                name: '',
                description: '',
                quantity: 0,
                unit: 'unidades',
                unitCost: 0,
                criticalStockLevel: 0,
                location: ''
            });
            setIsEditingMaterial(false);
        }
        setIsMaterialModalOpen(true);
    };
    
    const handleCloseMaterialModal = () => {
        setIsMaterialModalOpen(false);
        setCurrentMaterial({});
    };

    const handleSaveMaterial = () => {
        if (isEditingMaterial) {
            setMaterials(materials.map(m => m.id === currentMaterial.id ? currentMaterial as Material : m));
        } else {
            const newMaterial = { ...currentMaterial, id: `mat-${Date.now()}` } as Material;
            setMaterials([...materials, newMaterial]);
        }
        handleCloseMaterialModal();
    };

    const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentMaterial(prev => ({ ...prev, [name]: name === 'quantity' || name === 'unitCost' || name === 'criticalStockLevel' ? parseFloat(value) : value }));
    };

    const handleOpenOrderModal = (order?: MaterialOrder) => {
        if (order) {
            setCurrentOrder(order);
            setIsEditingOrder(true);
        } else {
            setCurrentOrder({
                materialId: materials.length > 0 ? materials[0].id : '',
                quantity: 1,
                orderDate: new Date().toISOString().split('T')[0],
                status: 'Pendiente'
            });
            setIsEditingOrder(false);
        }
        setIsOrderModalOpen(true);
    };

    const handleCloseOrderModal = () => {
        setIsOrderModalOpen(false);
        setCurrentOrder({});
    };

    const handleSaveOrder = () => {
        if (!currentOrder.materialId || !currentOrder.quantity || !currentOrder.orderDate || !currentOrder.status) return;
        if (isEditingOrder) {
            setOrders(orders.map(o => o.id === currentOrder.id ? currentOrder as MaterialOrder : o));
        } else {
            const newOrder = { ...currentOrder, id: `ord-${Date.now()}` } as MaterialOrder;
            setOrders([...orders, newOrder]);
        }
        handleCloseOrderModal();
    };

    const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentOrder(prev => ({ ...prev, [name]: name === 'quantity' ? parseFloat(value) : value }));
    };

    const handleFindSuppliers = async (material: Material) => {
        if (!material.location) return;
        setSelectedMaterialForSuppliers(material);
        setIsSuppliersModalOpen(true);
        setIsLoadingSuppliers(true);
        setSuppliersList([]);
        setSuppliersError(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Encuentra al menos 3 proveedores de '${material.name}' cerca de '${material.location}'.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: {
                                    type: Type.STRING,
                                    description: 'El nombre del proveedor.'
                                },
                                description: {
                                    type: Type.STRING,
                                    description: 'Una breve descripción, dirección o información de contacto del proveedor.'
                                }
                            },
                            required: ['name', 'description']
                        }
                    }
                }
            });
            
            const jsonStr = response.text.trim();
            const parsedSuppliers = JSON.parse(jsonStr) as Supplier[];
            setSuppliersList(parsedSuppliers);

        } catch (error) {
            console.error("Error al buscar proveedores:", error);
            setSuppliersError('No se pudieron encontrar proveedores en este momento. Inténtelo de nuevo más tarde.');
        } finally {
            setIsLoadingSuppliers(false);
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-black">Inventario de Materiales</h2>
                <button onClick={() => handleOpenMaterialModal()} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                    Añadir Material
                </button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Cantidad</th>
                                <th className="p-3">Ubicación</th>
                                <th className="p-3">Costo Unitario</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(material => (
                                <tr key={material.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{material.name}</td>
                                    <td className="p-3">{material.quantity} {material.unit}</td>
                                    <td className="p-3">{material.location || 'N/A'}</td>
                                    <td className="p-3">${material.unitCost.toFixed(2)}</td>
                                    <td className="p-3">
                                        {material.quantity <= material.criticalStockLevel ? 
                                            (<span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">Stock Bajo</span>) :
                                            (<span className="px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">En Stock</span>)
                                        }
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                        <button onClick={() => handleOpenMaterialModal(material)} className="text-black hover:text-gray-600 font-medium">Editar</button>
                                        <button 
                                            onClick={() => handleFindSuppliers(material)} 
                                            className="ml-4 text-primary-600 hover:text-primary-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                                            disabled={!material.location}
                                            title={!material.location ? "Añadir ubicación para buscar proveedores" : "Buscar proveedores cercanos"}
                                        >
                                            Buscar Proveedores
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-2xl font-semibold text-black">Pedidos de Materiales</h3>
                     <button onClick={() => handleOpenOrderModal()} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                        Añadir Pedido
                    </button>
                </div>
                 <Card>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-3">Material</th>
                                <th className="p-3">Cantidad</th>
                                <th className="p-3">Fecha de Pedido</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const material = materials.find(m => m.id === order.materialId);
                                return (
                                    <tr key={order.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{material?.name || 'N/A'}</td>
                                        <td className="p-3">{order.quantity} {material?.unit}</td>
                                        <td className="p-3">{new Date(order.orderDate).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                order.status === 'Entregado' ? 'bg-green-500 text-white' :
                                                order.status === 'Enviado' ? 'bg-blue-500 text-white' :
                                                order.status === 'Pendiente' ? 'bg-yellow-400 text-black' :
                                                order.status === 'Cancelado' ? 'bg-gray-500 text-white' : ''
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => handleOpenOrderModal(order)} className="text-black hover:text-gray-600 font-medium">Editar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            </div>

            <Modal isOpen={isMaterialModalOpen} onClose={handleCloseMaterialModal} title={isEditingMaterial ? 'Editar Material' : 'Añadir Nuevo Material'}>
                <div className="space-y-4">
                    <input name="name" value={currentMaterial.name || ''} onChange={handleMaterialChange} placeholder="Nombre" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input name="description" value={currentMaterial.description || ''} onChange={handleMaterialChange} placeholder="Descripción" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input name="location" value={currentMaterial.location || ''} onChange={handleMaterialChange} placeholder="Ubicación (ej. Ciudad, Dirección)" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input name="quantity" type="number" value={currentMaterial.quantity ?? ''} onChange={handleMaterialChange} placeholder="Cantidad" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input name="unit" value={currentMaterial.unit || ''} onChange={handleMaterialChange} placeholder="Unidad (ej. sacos, m³)" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input name="unitCost" type="number" value={currentMaterial.unitCost ?? ''} onChange={handleMaterialChange} placeholder="Costo Unitario" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input name="criticalStockLevel" type="number" value={currentMaterial.criticalStockLevel ?? ''} onChange={handleMaterialChange} placeholder="Nivel Crítico de Stock" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <button onClick={handleSaveMaterial} className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Guardar</button>
                </div>
            </Modal>

            <Modal isOpen={isOrderModalOpen} onClose={handleCloseOrderModal} title={isEditingOrder ? 'Editar Pedido de Material' : 'Añadir Nuevo Pedido'}>
                <div className="space-y-4">
                    <select name="materialId" value={currentOrder.materialId || ''} onChange={handleOrderChange} className="w-full p-2 border rounded bg-white text-black" disabled={isEditingOrder}>
                        <option value="" disabled>Seleccionar Material</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input name="quantity" type="number" min="1" value={currentOrder.quantity ?? ''} onChange={handleOrderChange} placeholder="Cantidad" className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input name="orderDate" type="date" value={currentOrder.orderDate || ''} onChange={handleOrderChange} className="w-full p-2 border rounded bg-white text-black" />
                    <select name="status" value={currentOrder.status || 'Pendiente'} onChange={handleOrderChange} className="w-full p-2 border rounded bg-white text-black">
                        <option value="Pendiente">Pendiente</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Cancelado">Cancelado</option>
                    </select>
                    <button onClick={handleSaveOrder} className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Guardar Pedido</button>
                </div>
            </Modal>

            <Modal 
              isOpen={isSuppliersModalOpen} 
              onClose={() => setIsSuppliersModalOpen(false)} 
              title={`Proveedores para ${selectedMaterialForSuppliers?.name}`}
            >
                {isLoadingSuppliers ? (
                    <div className="text-center p-8">
                        <p className="text-black">Buscando proveedores cercanos...</p>
                    </div>
                ) : suppliersError ? (
                    <div className="p-4 bg-red-100 text-red-800 rounded-md">
                        {suppliersError}
                    </div>
                ) : suppliersList.length > 0 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                        {suppliersList.map((supplier, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-bold text-black">{supplier.name}</h4>
                                <p className="text-black mt-1">{supplier.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8">
                        <p className="text-black">No se encontraron proveedores para este material y ubicación.</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Materials;
