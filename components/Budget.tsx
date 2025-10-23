
import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { initialBudgetCategories, initialExpenses } from '../constants';
import { BudgetCategory, Expense } from '../types';
import Card from './ui/Card';
import Modal from './ui/Modal';
import ProgressBar from './ui/ProgressBar';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Budget: React.FC = () => {
    const [budgetCategories, setBudgetCategories] = useLocalStorage<BudgetCategory[]>('budgetCategories', initialBudgetCategories);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialExpenses);
    
    // State for expense modal
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({date: new Date().toISOString().split('T')[0]});

    // State for category modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<BudgetCategory>>({});
    const [isEditingCategory, setIsEditingCategory] = useState(false);


    const totalAllocated = budgetCategories.reduce((acc, cat) => acc + cat.allocated, 0);
    const totalSpent = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    const expenseChartData = budgetCategories.map(cat => ({
        name: cat.name,
        value: expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0)
    })).filter(d => d.value > 0);

    const handleSaveExpense = () => {
        if (newExpense.description && newExpense.amount && newExpense.categoryId) {
            setExpenses([...expenses, { ...newExpense, id: `exp-${Date.now()}` } as Expense]);
            setIsExpenseModalOpen(false);
            setNewExpense({date: new Date().toISOString().split('T')[0]});
        }
    };
    
    // Handlers for category modal
    const handleOpenCategoryModal = (category?: BudgetCategory) => {
        if (category) {
            setCurrentCategory(category);
            setIsEditingCategory(true);
        } else {
            setCurrentCategory({ name: '', allocated: 0 });
            setIsEditingCategory(false);
        }
        setIsCategoryModalOpen(true);
    };

    const handleCloseCategoryModal = () => {
        setIsCategoryModalOpen(false);
        setCurrentCategory({});
    };

    const handleSaveCategory = () => {
        if (currentCategory.name && currentCategory.allocated !== undefined && currentCategory.allocated >= 0) {
            if (isEditingCategory) {
                setBudgetCategories(budgetCategories.map(c => c.id === currentCategory.id ? currentCategory as BudgetCategory : c));
            } else {
                const newCategory: BudgetCategory = { id: `cat-${Date.now()}`, name: currentCategory.name, allocated: currentCategory.allocated };
                setBudgetCategories([...budgetCategories, newCategory]);
            }
            handleCloseCategoryModal();
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-black">Control de Presupuesto</h2>
                <button onClick={() => setIsExpenseModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                    Añadir Gasto
                </button>
            </div>
            
            <Card className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                    <div className="mb-4 md:mb-0">
                        <p className="text-black">Presupuesto Total</p>
                        <p className="text-4xl font-bold text-black">${totalAllocated.toLocaleString()}</p>
                    </div>
                     <div className="mb-4 md:mb-0">
                        <p className="text-black">Total Gastado</p>
                        <p className="text-4xl font-bold text-black">${totalSpent.toLocaleString()}</p>
                    </div>
                     <div>
                        <p className="text-black">Restante</p>
                        <p className="text-4xl font-bold text-black">${(totalAllocated - totalSpent).toLocaleString()}</p>
                    </div>
                </div>
                 <div className="mt-4">
                    <ProgressBar value={totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0} color={ totalAllocated > 0 && (totalSpent/totalAllocated) > 0.9 ? 'red' : totalAllocated > 0 && (totalSpent/totalAllocated) > 0.75 ? 'yellow' : 'blue'} />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Registro de Gastos">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Descripción</th>
                                    <th className="p-3">Categoría</th>
                                    <th className="p-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                                    <tr key={exp.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 text-sm text-black">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="p-3 font-medium">{exp.description}</td>
                                        <td className="p-3">{budgetCategories.find(c => c.id === exp.categoryId)?.name}</td>
                                        <td className="p-3 text-right font-semibold">${exp.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card title="Gasto por Categoría">
                        <div style={{ width: '100%', height: 300 }}>
                           <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={expenseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                        {expenseChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <Card title="Gestionar Categorías de Presupuesto">
                        <div className="space-y-2 mb-4">
                            {budgetCategories.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                        <p className="font-medium text-black">{cat.name}</p>
                                        <p className="text-sm text-black">${cat.allocated.toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => handleOpenCategoryModal(cat)} className="text-sm text-black hover:text-gray-600 font-semibold">Editar</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleOpenCategoryModal()} className="w-full py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">
                            Añadir Categoría
                        </button>
                    </Card>
                </div>
            </div>

            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Añadir Nuevo Gasto">
                <div className="space-y-4">
                    <input type="text" placeholder="Descripción" value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input type="number" placeholder="Monto" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <select value={newExpense.categoryId || ''} onChange={e => setNewExpense({...newExpense, categoryId: e.target.value})} className="w-full p-2 border rounded bg-white text-black">
                        <option value="">Seleccionar Categoría</option>
                        {budgetCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <input type="date" value={newExpense.date || ''} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="w-full p-2 border rounded bg-white text-black" />
                    <button onClick={handleSaveExpense} className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Guardar Gasto</button>
                </div>
            </Modal>
            
            <Modal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} title={isEditingCategory ? 'Editar Categoría' : 'Añadir Nueva Categoría'}>
                <div className="space-y-4">
                    <input type="text" placeholder="Nombre de la Categoría" value={currentCategory.name || ''} onChange={e => setCurrentCategory({...currentCategory, name: e.target.value})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <input type="number" placeholder="Monto Asignado" value={currentCategory.allocated || ''} onChange={e => setCurrentCategory({...currentCategory, allocated: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded bg-white text-black placeholder-gray-500" />
                    <button onClick={handleSaveCategory} className="w-full py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Guardar</button>
                </div>
            </Modal>
        </div>
    );
};

export default Budget;
