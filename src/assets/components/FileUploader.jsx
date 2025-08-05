// src/components/FileUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const FileUploader = ({ onValidationComplete }) => {
  const [error, setError] = useState(null);

  const processFile = (file) => {
    setError(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let jsonData = null;

        if (file.name.endsWith('.csv')) {
          // Lógica para CSV continua a mesma
          const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
          jsonData = parsed.data;
        } else {
          // --- LÓGICA CORRIGIDA E MELHORADA PARA EXCEL ---
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Converte a planilha para um array de arrays (linhas e colunas)
          // Isso nos dá mais controle do que a conversão direta para JSON
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

          if (!rows || rows.length === 0) {
            throw new Error("A planilha parece estar vazia.");
          }

          // Procura dinamicamente pela linha do cabeçalho (procura nas 10 primeiras linhas)
          let headerIndex = -1;
          let headers = [];
          for (let i = 0; i < Math.min(rows.length, 10); i++) {
              // Converte a linha para strings e maiúsculas para uma busca robusta
              const potentialHeader = (rows[i] || []).map(h => String(h || '').toUpperCase().trim());
              
              // Verifica se a linha contém colunas essenciais
              if (potentialHeader.includes('CEPI') && potentialHeader.includes('CEPF') && (potentialHeader.includes('PRAZO(DIAS ÚTEIS)') || potentialHeader.includes('PRAZO'))) {
                  headerIndex = i;
                  headers = rows[i]; // Usa os nomes originais
                  break;
              }
          }

          if (headerIndex === -1) {
            throw new Error("Cabeçalho não encontrado. Verifique se a planilha contém as colunas 'CEPI', 'CEPF' e 'PRAZO'.");
          }
          
          // As linhas de dados são todas as que vêm depois do cabeçalho
          const dataRows = rows.slice(headerIndex + 1);

          // Constrói o JSON manualmente usando os cabeçalhos encontrados
          jsonData = dataRows
            .map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                if (header) { // Ignora colunas sem nome de cabeçalho
                  obj[header] = row[index];
                }
              });
              return obj;
            })
            .filter(row => Object.values(row).some(cell => cell !== null && cell !== '')); // Remove linhas totalmente vazias
        }
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error("Nenhum dado válido foi encontrado na planilha após a leitura.");
        }

        onValidationComplete(jsonData, file.name);

      } catch (err) {
        console.error(err);
        setError(`Erro ao processar o arquivo: ${err.message}`);
        onValidationComplete(null, file.name);
      }
    };

    reader.onerror = () => {
        setError('Falha ao ler o arquivo.');
        onValidationComplete(null, file.name);
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