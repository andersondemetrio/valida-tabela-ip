// src/assets/components/FileUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './FileUploader.css';

const FileUploader = ({ onValidationComplete, setIsLoading, setValidationResult }) => {
  const [error, setError] = useState(null);

  const processFile = (file) => {
    setError(null);
    setValidationResult(null);
    setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let sheetsData = {}; // Usaremos um objeto para armazenar dados de múltiplas abas

        if (file.name.endsWith('.csv')) {
          const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
          sheetsData['Sheet1'] = parsed.data; // CSV é tratado como uma única aba
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Itera sobre TODAS as abas do arquivo
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            if (!rows || rows.length === 0) return; // Pula abas vazias

            // Encontra o cabeçalho dinamicamente
            let headerIndex = -1;
            let headers = [];
            for (let i = 0; i < Math.min(rows.length, 15); i++) {
                const currentRow = rows[i];
                if (currentRow && currentRow.some(cell => cell)) { // Encontra a primeira linha com algum conteúdo
                    headerIndex = i;
                    headers = rows[i];
                    break;
                }
            }

            if (headerIndex === -1) return; // Pula abas sem cabeçalho

            const dataRows = rows.slice(headerIndex + 1);
            const jsonData = dataRows
              .map(row => {
                if (!row) return null;
                const obj = {};
                headers.forEach((header, index) => {
                  if (header) obj[header] = row[index];
                });
                return obj;
              })
              .filter(row => row && Object.values(row).some(cell => cell !== null && cell !== ''));
            
            if (jsonData.length > 0) {
              sheetsData[sheetName] = jsonData;
            }
          });
        }
        
        if (Object.keys(sheetsData).length === 0) {
          throw new Error("Nenhuma aba com dados válidos foi encontrada no arquivo.");
        }
        
        onValidationComplete(sheetsData, file.name);

      } catch (err) {
        console.error(err);
        onValidationComplete(null, file.name, err.message); // Passa a mensagem de erro
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
        onValidationComplete(null, file.name, 'Falha ao ler o arquivo.');
        setIsLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'], },
    maxFiles: 1,
  });

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive ? ( <p>Solte a tabela de frete aqui...</p> ) : ( <p>Arraste e solte a tabela aqui, ou clique para selecionar</p> )}
      {error && <p className="dropzone-error">{error}</p>}
    </div>
  );
};

export default FileUploader;