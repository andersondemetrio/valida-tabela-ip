// src/App.jsx
import React, { useState } from 'react';
import FileUploader from './assets/components/FileUploader.jsx';
import ValidationReport from './assets/components/ValidationReport.jsx';
import Loader from './assets/components/Loader.jsx'; // 1. Importar o Loader
import { validateFreightTable } from './utils/validator.js';
import './App.css';

function App() {
  const [validationResult, setValidationResult] = useState(null);
  const [currentFile, setCurrentFile] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 2. Adicionar estado de loading

  const handleValidation = (data, fileName) => {
    setCurrentFile(fileName);
    if (!data) {
        setValidationResult({
            diagnosis: '❌ Incompleto – não é possível seguir',
            errors: [`Não foi possível ler os dados do arquivo "${fileName}". Verifique se o formato é válido ou não está corrompido.`],
            foundCols: [],
            missingCols: [],
        });
        return;
    }
    const report = validateFreightTable(data);
    setValidationResult(report);
  };

  return (
    <div className="container">
      <header>
        <h1>Validador de Tabelas de Frete Modelo Intelipost</h1>
        <p>Faça o upload de um arquivo (Excel ou CSV) para analisar se ele atende aos requisitos mínimos de implantação.</p>
      </header>
      <main>
        {/* 3. Lógica para exibir o Loader ou o conteúdo principal */}
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <FileUploader
              onValidationComplete={handleValidation}
              setIsLoading={setIsLoading}
              setValidationResult={setValidationResult}
            />
            {validationResult && (
              <ValidationReport report={validationResult} fileName={currentFile} />
            )}
          </>
        )}
      </main>
      <footer>
        <p>Desenvolvido Anderson, Rafa e Renan</p>
      </footer>
    </div>
  );
}

export default App;