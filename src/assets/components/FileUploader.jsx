// src/components/FileUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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
        let jsonData = null;

        if (file.name.endsWith('.csv')) {
          const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
          jsonData = parsed.data;
        } else {
          // --- LÓGICA MELHORADA PARA LIDAR COM MÚLTIPLAS ABAS NO EXCEL ---
          const workbook = XLSX.read(data, { type: 'binary' });
          let targetSheet = null;

          // 1. Procura em todas as abas por uma que pareça ser uma tabela de frete
          for (const sheetName of workbook.SheetNames) {
              const worksheet = workbook.Sheets[sheetName];
              const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
              if (!rows || rows.length === 0) continue;

              // Verificação rápida: a aba tem colunas CEPI e CEPF?
              let isFreightTable = false;
              for (let i = 0; i < Math.min(rows.length, 15); i++) { // Procura nas primeiras 15 linhas
                  const potentialHeader = (rows[i] || []).map(h => String(h || '').toUpperCase().trim());
                  if (potentialHeader.includes('CEPI') && potentialHeader.includes('CEPF')) {
                      isFreightTable = true;
                      break;
                  }
              }
              if (isFreightTable) {
                  targetSheet = worksheet; // Encontramos a aba correta!
                  break;
              }
          }

          if (!targetSheet) {
            throw new Error("Nenhuma aba com dados de frete (colunas CEPI e CEPF) foi encontrada no arquivo Excel.");
          }

          // 2. Agora que temos a aba certa (targetSheet), processamos ela
          const rows = XLSX.utils.sheet_to_json(targetSheet, { header: 1, defval: null });
          let headerIndex = -1;
          let headers = [];
          for (let i = 0; i < Math.min(rows.length, 15); i++) {
              const potentialHeader = (rows[i] || []).map(h => String(h || '').toUpperCase().trim());
              if (potentialHeader.includes('CEPI') && potentialHeader.includes('CEPF')) {
                  headerIndex = i;
                  headers = rows[i];
                  break;
              }
          }

          if (headerIndex === -1) throw new Error("O cabeçalho não foi encontrado na aba de dados, um erro inesperado ocorreu.");

          const dataRows = rows.slice(headerIndex + 1);
          jsonData = dataRows
            .map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                if (header) obj[header] = row[index];
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
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
        setError('Falha ao ler o arquivo.');
        onValidationComplete(null, file.name);
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
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  return (
    <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'rgb(22, 163, 74)' : '#cccccc'}`, borderRadius: '10px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border .24s ease-in-out' }}>
      <input {...getInputProps()} />
      {isDragActive ? ( <p>Solte a tabela de frete aqui...</p> ) : ( <p>Arraste e solte a tabela aqui, ou clique para selecionar</p> )}
       {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default FileUploader;