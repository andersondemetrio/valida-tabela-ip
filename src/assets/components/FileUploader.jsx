// src/components/FileUploader.jsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import './FileUploader.css';

const FileUploader = ({ onValidationComplete, setIsLoading, setValidationResult }) => {
  const [error, setError] = useState(null);

  const processFile = (file) => {
    // Verificação de segurança para as props
    if (typeof setIsLoading === 'function') {
      setIsLoading(true);
    }
    if (typeof setValidationResult === 'function') {
      setValidationResult(null);
    }
    
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        let jsonData = null;

        if (file.name.endsWith('.csv')) {
          const parsed = Papa.parse(data, { 
            header: true, 
            skipEmptyLines: true,
            transformHeader: (header) => header.trim() // Remove espaços em branco dos headers
          });
          
          if (parsed.errors && parsed.errors.length > 0) {
            console.warn('Avisos durante o parsing do CSV:', parsed.errors);
          }
          
          jsonData = parsed.data.filter(row => {
            // Filtra linhas vazias ou com todos os valores nulos/vazios
            return Object.values(row).some(value => 
              value !== null && value !== undefined && value !== ''
            );
          });

        } else {
          // Processamento de arquivos Excel
          const workbook = XLSX.read(data, { type: 'binary' });
          let targetSheet = null;

          // Busca pela aba com dados de frete
          for (const sheetName of workbook.SheetNames) {
            try {
              const worksheet = workbook.Sheets[sheetName];
              if (!worksheet) continue;

              const rows = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, 
                defval: null,
                blankrows: false
              });
              
              if (!rows || rows.length === 0) continue;

              let isFreightTable = false;
              
              // Verifica nas primeiras 15 linhas
              for (let i = 0; i < Math.min(rows.length, 15); i++) {
                const currentRow = rows[i];
                
                // Verificação robusta da linha
                if (!currentRow || !Array.isArray(currentRow) || currentRow.length === 0) {
                  continue;
                }

                try {
                  const potentialHeader = currentRow.map(cell => {
                    if (cell === null || cell === undefined) return '';
                    return String(cell).toUpperCase().trim();
                  });

                  if (potentialHeader.includes('CEPI') && potentialHeader.includes('CEPF')) {
                    isFreightTable = true;
                    break;
                  }
                } catch (headerError) {
                  console.warn(`Erro ao processar linha ${i}:`, headerError);
                  continue;
                }
              }

              if (isFreightTable) {
                targetSheet = worksheet;
                break;
              }
            } catch (sheetError) {
              console.warn(`Erro ao processar aba ${sheetName}:`, sheetError);
              continue;
            }
          }

          if (!targetSheet) {
            throw new Error("Nenhuma aba com dados de frete (colunas CEPI e CEPF) foi encontrada no arquivo Excel.");
          }

          // Processa a aba encontrada
          const rows = XLSX.utils.sheet_to_json(targetSheet, { 
            header: 1, 
            defval: null,
            blankrows: false
          });
          
          let headerIndex = -1;
          let headers = [];

          // Encontra o índice do cabeçalho
          for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const currentRow = rows[i];
            
            if (!currentRow || !Array.isArray(currentRow) || currentRow.length === 0) {
              continue;
            }

            try {
              const potentialHeader = currentRow.map(cell => {
                if (cell === null || cell === undefined) return '';
                return String(cell).toUpperCase().trim();
              });

              if (potentialHeader.includes('CEPI') && potentialHeader.includes('CEPF')) {
                headerIndex = i;
                headers = currentRow.map(header => {
                  if (header === null || header === undefined) return '';
                  return String(header).trim();
                });
                break;
              }
            } catch (headerError) {
              console.warn(`Erro ao processar potencial header na linha ${i}:`, headerError);
              continue;
            }
          }

          if (headerIndex === -1) {
            throw new Error("O cabeçalho com colunas CEPI e CEPF não foi encontrado na aba de dados.");
          }

          // Extrai os dados após o cabeçalho
          const dataRows = rows.slice(headerIndex + 1);
          
          jsonData = dataRows
            .map((row, index) => {
              if (!row || !Array.isArray(row)) return null;
              
              try {
                const obj = {};
                headers.forEach((header, headerIndex) => {
                  if (header && header.trim() !== '') {
                    const cellValue = row[headerIndex];
                    obj[header] = cellValue === undefined ? null : cellValue;
                  }
                });
                return obj;
              } catch (rowError) {
                console.warn(`Erro ao processar linha de dados ${index}:`, rowError);
                return null;
              }
            })
            .filter(row => {
              // Filtra linhas nulas e linhas com todos os valores vazios
              if (!row) return false;
              return Object.values(row).some(cell => 
                cell !== null && cell !== undefined && cell !== ''
              );
            });
        }
        
        if (!jsonData || jsonData.length === 0) {
          throw new Error("Nenhum dado válido foi encontrado na planilha após a leitura.");
        }

        console.log(`Arquivo processado com sucesso: ${jsonData.length} linhas de dados`);
        
        if (typeof onValidationComplete === 'function') {
          onValidationComplete(jsonData, file.name);
        }

      } catch (err) {
        console.error('Erro durante o processamento do arquivo:', err);
        setError(`Erro ao processar o arquivo: ${err.message}`);
        
        if (typeof onValidationComplete === 'function') {
          onValidationComplete(null, file.name);
        }
      } finally {
        if (typeof setIsLoading === 'function') {
          setIsLoading(false);
        }
      }
    };

    reader.onerror = (err) => {
      console.error('Erro na leitura do arquivo:', err);
      setError('Falha ao ler o arquivo. Verifique se o arquivo não está corrompido.');
      
      if (typeof onValidationComplete === 'function') {
        onValidationComplete(null, file.name);
      }
      if (typeof setIsLoading === 'function') {
        setIsLoading(false);
      }
    };

    // Verificação adicional antes de tentar ler o arquivo
    if (!file) {
      setError('Arquivo inválido selecionado.');
      if (typeof setIsLoading === 'function') {
        setIsLoading(false);
      }
      return;
    }

    try {
      reader.readAsBinaryString(file);
    } catch (readError) {
      console.error('Erro ao iniciar leitura do arquivo:', readError);
      setError('Não foi possível iniciar a leitura do arquivo.');
      if (typeof setIsLoading === 'function') {
        setIsLoading(false);
      }
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file) {
        processFile(file);
      } else {
        setError('Arquivo selecionado é inválido.');
      }
    } else {
      setError('Nenhum arquivo válido foi selecionado.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/vnd.ms-excel': ['.xls'], 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 
      'text/csv': ['.csv'] 
    },
    maxFiles: 1,
    onDropRejected: (fileRejections) => {
      console.log('Arquivos rejeitados:', fileRejections);
      setError('Tipo de arquivo não suportado. Use apenas arquivos .xlsx, .xls ou .csv');
    }
  });

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Solte a tabela de frete aqui...</p>
      ) : (
        <p>Arraste e solte a tabela aqui, ou clique para selecionar</p>
      )}
      {error && <p className="dropzone-error">{error}</p>}
    </div>
  );
};

export default FileUploader;