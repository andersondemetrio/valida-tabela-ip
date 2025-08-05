// src/App.jsx
import React, { useState } from 'react';
import FileUploader from './assets/components/FileUploader.jsx';
import ValidationReport from './assets/components/ValidationReport.jsx';
import { validateFreightTable } from './utils/validator.js';
import './App.css'; // Vamos adicionar um pouco de estilo

function App() {
  const [validationResult, setValidationResult] = useState(null);
  const [currentFile, setCurrentFile] = useState('');

  const handleValidation = (data, fileName) => {
    setCurrentFile(fileName);
    if (!data) {
        // Lida com erro na leitura do arquivo
        setValidationResult({
            diagnosis: '❌ Incompleto – não é possível seguir',
            errors: [`Não foi possível ler os dados do arquivo "${fileName}". Verifique se o formato é válido e se não está corrompido.`],
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
        <h1>Validador de Tabelas de Frete</h1>
        <p>Faça o upload de um arquivo (Excel ou CSV) para analisar se ele atende aos requisitos mínimos de implantação.</p>
      </header>
      <main>
        <FileUploader onValidationComplete={handleValidation} />
        {validationResult && (
          <ValidationReport report={validationResult} fileName={currentFile} />
        )}
      </main>
      <footer>
        <p>Desenvolvido com React + Vite</p>
      </footer>
    </div>
  );
}

export default App;