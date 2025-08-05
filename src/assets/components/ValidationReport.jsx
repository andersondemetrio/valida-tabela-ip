import React from 'react';
import './ValidationReport.css'; // Importe o novo CSS

const ValidationReport = ({ report, fileName }) => {
  if (!report) {
    return null;
  }

  const { diagnosis, foundCols, missingCols, errors, rawHeaders } = report;

  const getStatusInfo = () => {
    if (diagnosis.includes('✅')) return { text: 'Apto para abertura de chamado', className: 'success' };
    if (diagnosis.includes('⚠️')) return { text: 'Requer ajustes', className: 'warning' };
    if (diagnosis.includes('❌')) return { text: 'Incompleto – não é possível seguir', className: 'danger' };
    return { text: 'Indefinido', className: '' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="report-card">
      <div className="report-header">
        <h3>Diagnóstico da Tabela</h3>
        <p style={{ margin: 0, color: 'var(--text-color-light)' }}>Arquivo: {fileName}</p>
      </div>

      <div className="report-body">
        <div className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</div>

        <div className="details-grid">
          {foundCols.length > 0 && (
            <div className="detail-block">
              <h4>Colunas Encontradas</h4>
              <ul>
                {foundCols.map(col => <li className="found-cols" key={col}>{col}</li>)}
              </ul>
            </div>
          )}

          {missingCols.length > 0 && (
            <div className="detail-block">
              <h4>Colunas Faltantes</h4>
              <ul>
                {missingCols.map(col => <li className="missing-cols" key={col}>{col}</li>)}
              </ul>
            </div>
          )}

          {errors.length > 0 && (
            <div className="detail-block">
              <h4>Erros e Avisos</h4>
               <ul>
                {errors.map((err, index) => <li className="errors" key={index}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>

        {rawHeaders && rawHeaders.length > 0 && (
          <div className="debug-details">
            <details>
              <summary>Exibir todas as colunas lidas pelo programa (Debug)</summary>
              <pre>{JSON.stringify(rawHeaders, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationReport;