// src/components/FileUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// 1. Receber as novas props do App.jsx
const FileUploader = ({ onValidationComplete, setIsLoading, setValidationResult }) => {
  const [error, setError] = useState(null);

  const processFile = (file) => {
    // 2. Limpar o relatório antigo e INICIAR a animação
    setError(null);
    setValidationResult(null); // Garante que o relatório antigo suma
    setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let jsonData = null;

        if (file.name.endsWith('.csv')) {
          const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
          jsonData = parsed.data;
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

          if (!rows || rows.length === 0) {
            throw new Error("A planilha parece estar vazia.");
          }
          
          let headerIndex = -1;
          let headers = [];
          for (let i = 0; i < Math.min(rows.length, 10); i++) {
              const potentialHeader = (rows[i] || []).map(h => String(h || '').toUpperCase().trim());
              if (potentialHeader.includes('CEPI') && potentialHeader.includes('CEPF') && (potentialHeader.includes('PRAZO(DIAS ÚTEIS)') || potentialHeader.includes('PRAZO'))) {
                  headerIndex = i;
                  headers = rows[i];
                  break;
              }
          }

          if (headerIndex === -1) {
            throw new Error("Cabeçalho não encontrado. Verifique se a planilha contém as colunas 'CEPI', 'CEPF' e 'PRAZO'.");
          }
          
          const dataRows = rows.slice(headerIndex + 1);

          jsonData = dataRows
            .map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                if (header) {
                  obj[header] = row[index];
                }
              });
              return obj;
            })
            .filter(row => Object.values(row).some(cell => cell !== null && cell !== ''));
        }
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error("Nenhum dado válido foi encontrado na planilha após a leitura.");
        }

        onValidationComplete(jsonData, file.name);

      } catch (err) {
        console.error(err);
        setError(`Erro ao processar o arquivo: ${err.message}`);
        onValidationComplete(null, file.name);
      } finally {
        // 3. PARAR a animação no final, com sucesso ou erro
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
        setError('Falha ao ler o arquivo.');
        onValidationComplete(null, file.name);
        setIsLoading(false); // 4. Também parar a animação em caso de erro
    };

    reader.readAsBinaryString(file);
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]); // Adicionado 'processFile' ao array de dependências do useCallback

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? 'rgb(22, 163, 74)' : '#cccccc'}`,
        borderRadius: '10px',
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border .24s ease-in-out'
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Solte a tabela de frete aqui...</p>
      ) : (
        <p>Arraste e solte a tabela aqui, ou clique para selecionar</p>
      )}
       {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default FileUploader;