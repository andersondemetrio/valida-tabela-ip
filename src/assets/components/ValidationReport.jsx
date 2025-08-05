// src/components/ValidationReport.jsx
import React from 'react';

const ValidationReport = ({ report, fileName }) => {
  if (!report) {
    return null;
  }

  const { diagnosis, foundCols, missingCols, errors } = report;

  const getEmoji = (diag) => {
    if (diag.includes('✅')) return '✅';
    if (diag.includes('⚠️')) return '⚠️';
    if (diag.includes('❌')) return '❌';
    return '📁';
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h3>{getEmoji(diagnosis)} Diagnóstico da Tabela</h3>
      <p><strong>Arquivo:</strong> {fileName}</p>
      <hr />

      <h4><strong>Status:</strong> {diagnosis}</h4>

      {foundCols.length > 0 && (
        <div>
          <strong>📊 Colunas Encontradas:</strong>
          <p>{foundCols.join(', ')}</p>
        </div>
      )}

      {missingCols.length > 0 && (
        <div style={{ color: 'orange' }}>
          <strong>❌ Colunas Faltantes:</strong>
          <p>{missingCols.join(', ')}</p>
        </div>
      )}

      {errors.length > 0 && (
        <div style={{ color: 'red' }}>
          <strong>⚠️ Erros e Avisos:</strong>
          <ul>
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationReport;