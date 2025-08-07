// src/assets/components/ValidationReport.jsx
import React from 'react';
import './ValidationReport.css';

const ValidationReport = ({ report, fileName }) => {
  if (!report) {
    return null;
  }

  const { diagnosis, justification, sheetReports } = report;

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
        <h3>Diagnóstico Geral do Arquivo</h3>
        <p style={{ margin: 0, color: 'var(--text-color-light)' }}>
          Arquivo: {fileName}
        </p>
      </div>

      <div className="report-body">
        <div className={`status-badge ${statusInfo.className}`}>
          {statusInfo.text}
        </div>

        {/* Bloco de Justificativa Consolidada */}
        {justification && justification.length > 0 && (
          <div className="justification-block">
            <h4>Resumo da Análise</h4>
            {justification.map((msg, index) => <p key={index}>{msg}</p>)}
          </div>
        )}

        {/* Detalhes por Aba */}
        {sheetReports && sheetReports.length > 0 && (
          <div className="sheets-container">
            <h4 className="sheets-title">Detalhes por Aba da Planilha</h4>
            {sheetReports.map((sheetReport, index) => (
              <div key={index} className="sheet-detail-card">
                <h5>Aba: "{sheetReport.sheetName}"</h5>
                <div className="details-grid">
                  <div className="detail-block">
                    <h6>Análise de Abrangência</h6>
                    <ul>
                      {sheetReport.coverage.found.map(col => <li className="found-cols" key={col}>{col}</li>)}
                      {sheetReport.coverage.missing.map(col => <li className="missing-cols" key={col}>{col}</li>)}
                    </ul>
                  </div>
                  <div className="detail-block">
                    <h6>Análise de Precificação</h6>
                    <ul>
                      {sheetReport.pricing.found ? (
                        <li className="found-cols">{sheetReport.pricing.format}</li>
                      ) : (
                        <li className="missing-cols">Nenhum formato de preço reconhecido.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationReport;
