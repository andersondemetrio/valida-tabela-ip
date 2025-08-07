// src/App.jsx
import React, { useState } from 'react';
import FileUploader from './assets/components/FileUploader.jsx';
import ValidationReport from './assets/components/ValidationReport.jsx';
import Loader from './assets/components/Loader.jsx';
import { validateWorkbook } from './utils/validator.js'; // Mudou para validateWorkbook
import './App.css';

function App() {
  const [validationResult, setValidationResult] = useState(null);
  const [currentFile, setCurrentFile] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleValidation = (sheetsData, fileName, errorMessage = null) => {
    setCurrentFile(fileName);
    if (errorMessage) {
        // Objeto de erro agora tem a estrutura correta
        setValidationResult({
            diagnosis: '❌ Incompleto – não é possível seguir',
            justification: [errorMessage],
            sheetReports: [],
        });
        return;
    }
    const report = validateWorkbook(sheetsData); // Chama a nova função
    setValidationResult(report);
  };

  return (
    <div className="container">
      <header>
        <h1>Validador de Tabelas de Frete Modelo Intelipost</h1>
        <p>Faça o upload de um arquivo (Excel ou CSV) para analisar se ele atende aos requisitos mínimos de implantação.</p>
      </header>
      <main>
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