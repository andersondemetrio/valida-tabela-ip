// src/components/ValidationReport.jsx
import React from 'react';
import './ValidationReport.css';

const ValidationReport = ({ report, fileName }) => {
  // Verificação de segurança simples
  if (!report) {
    return null;
  }

  // Desestruturação direta, confiando na estrutura enviada pelo validator.js
  const {
    diagnosis,
    coverage,
    pricing,
    justification,
    rawHeaders
  } = report;

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
        <p style={{ margin: 0, color: 'var(--text-color-light)' }}>
          Arquivo: {fileName}
        </p>
      </div>

      <div className="report-body">
        <div className={`status-badge ${statusInfo.className}`}>
          {statusInfo.text}
        </div>

        <div className="details-grid">
          {/* Bloco de Análise de Abrangência */}
          <div className="detail-block">
            <h4>Análise de Abrangência</h4>
            <ul>
              {coverage.found.map(col => <li className="found-cols" key={col}>{col}</li>)}
              {coverage.missing.map(col => <li className="missing-cols" key={col}>{col}</li>)}
            </ul>
          </div>

          {/* Bloco de Análise de Precificação */}
          <div className="detail-block">
            <h4>Análise de Precificação</h4>
            <ul>
              {pricing.found ? (
                <li className="found-cols">{pricing.format}</li>
              ) : (
                <li className="missing-cols">Nenhum formato de preço reconhecido.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Bloco de Justificativa */}
        {justification && justification.length > 0 && (
          <div className="justification-block">
            <h4>Justificativa do Diagnóstico</h4>
            {justification.map((msg, index) => <p key={index}>{msg}</p>)}
          </div>
        )}

        {/* Bloco de Debug */}
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