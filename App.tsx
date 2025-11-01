import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Materials from './components/Materials';
import Labor from './components/Labor';
import Budget from './components/Budget';
import Schedule from './components/Schedule';
import PhotoLog from './components/PhotoLog';
import Reports from './components/Reports';
import CRM from './components/CRM';
import { ProjectProvider } from './contexts/ProjectContext';
import ProjectHeader from './components/ProjectHeader';

export type View = 'Panel' | 'Materiales' | 'Mano de Obra' | 'Presupuesto' | 'Cronograma' | 'Bitácora de Fotos' | 'Reportes' | 'CRM / Clientes';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('Panel');

  const renderView = () => {
    switch (currentView) {
      case 'Panel':
        return <Dashboard />;
      case 'Materiales':
        return <Materials />;
      case 'Mano de Obra':
        return <Labor />;
      case 'Presupuesto':
        return <Budget />;
      case 'Cronograma':
        return <Schedule />;
      case 'Bitácora de Fotos':
        return <PhotoLog />;
      case 'Reportes':
        return <Reports />;
      case 'CRM / Clientes':
        return <CRM />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ProjectProvider>
      <div className="flex h-screen bg-gray-100 font-sans print:block print:h-auto">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
        <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
          <ProjectHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 print:overflow-visible print:block">
            <div className="container mx-auto px-6 py-8">
              {renderView()}
            </div>
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
};

export default App;