import React from 'react';
import { View } from '../App';
import { ICONS } from '../constants';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems: View[] = ['Panel', 'Materiales', 'Mano de Obra', 'Presupuesto', 'Cronograma', 'Bitácora de Fotos', 'CRM / Clientes', 'Reportes'];

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg no-print">
      <div className="flex items-center justify-center h-20 border-b">
        <h1 className="text-2xl font-bold text-black">ConstructPro</h1>
      </div>
      <nav className="flex-1 px-2 py-4">
        {navItems.map((item) => (
          <a
            key={item}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView(item);
            }}
            className={`flex items-center px-4 py-2 mt-2 text-black rounded-md hover:bg-primary-100 transition-colors duration-200 ${
              currentView === item ? 'bg-primary-100' : ''
            }`}
          >
            {ICONS[item]}
            <span className="mx-4 font-medium">{item}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;