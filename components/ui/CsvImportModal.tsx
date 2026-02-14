
import React, { useState, useRef } from 'react';
import Modal from './Modal';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  title: string;
  expectedColumns: string[];
  templateFileName?: string;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport, 
  title, 
  expectedColumns,
  templateFileName = 'plantilla_catalogo.csv'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("El archivo está vacío o le faltan datos.");

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const missing = expectedColumns.filter(col => !headers.includes(col));
    
    if (missing.length > 0) {
      throw new Error(`Faltan las columnas: ${missing.join(', ')}`);
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError('');
    }
  };

  const handleImportClick = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCsv(text);
        await onImport(data);
        setSuccessMessage(`Se importaron ${data.length} conceptos con éxito.`);
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
          setFileName('');
        }, 2000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + expectedColumns.join(',') + "\nEjemplo de Trabajo,2024-05-01,2024-05-15,100,m2,150,no";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", templateFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
          <strong>Formato requerido:</strong> Archivo CSV delimitado por comas. Las columnas deben ser exactamente: {expectedColumns.join(', ')}.
        </div>

        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <p className="text-sm font-bold text-black">{fileName || "Seleccionar archivo CSV"}</p>
          <p className="text-xs text-gray-500 mt-1">Haga clic para buscar en su equipo</p>
        </div>

        <div className="flex justify-between items-center">
          <button onClick={downloadTemplate} className="text-primary-600 text-xs font-bold hover:underline">Descargar Plantilla CSV</button>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 text-xs rounded font-bold">{error}</div>}
        {successMessage && <div className="p-3 bg-green-100 text-green-700 text-xs rounded font-bold">{successMessage}</div>}

        <button 
          onClick={handleImportClick} 
          disabled={!fileName || isProcessing}
          className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold disabled:bg-gray-400 shadow-lg"
        >
          {isProcessing ? "Procesando..." : "Importar Catálogo"}
        </button>
      </div>
    </Modal>
  );
};

export default CsvImportModal;
