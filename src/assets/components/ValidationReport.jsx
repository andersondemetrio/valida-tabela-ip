// src/components/ValidationReport.jsx
import React from 'react';
import './ValidationReport.css';

const ValidationReport = ({ report, fileName }) => {
  // Verificação de segurança principal
  if (!report || typeof report !== 'object') {
    return null;
  }

  try {
    // Desestruturação segura com valores padrão
    const {
      diagnosis = '',
      coverage = { found: [], missing: [] },
      pricing = { found: false, format: '' },
      justification = [],
      rawHeaders = []
    } = report;

    const getStatusInfo = () => {
      try {
        if (typeof diagnosis !== 'string') {
          return { text: 'Erro no diagnóstico', className: 'danger' };
        }

        if (diagnosis.includes('✅')) {
          return { text: 'Apto para abertura de chamado', className: 'success' };
        }
        if (diagnosis.includes('⚠️')) {
          return { text: 'Requer ajustes', className: 'warning' };
        }
        if (diagnosis.includes('❌')) {
          return { text: 'Incompleto – não é possível seguir', className: 'danger' };
        }
        
        return { text: 'Indefinido', className: '' };
      } catch (error) {
        console.error('Erro ao determinar status:', error);
        return { text: 'Erro no diagnóstico', className: 'danger' };
      }
    };

    const statusInfo = getStatusInfo();
    const safeFileName = fileName || 'Arquivo não identificado';

    // Verificação segura para coverage
    const safeCoverage = {
      found: Array.isArray(coverage?.found) ? coverage.found : [],
      missing: Array.isArray(coverage?.missing) ? coverage.missing : []
    };

    // Verificação segura para pricing
    const safePricing = {
      found: Boolean(pricing?.found),
      format: typeof pricing?.format === 'string' ? pricing.format : 'Formato não identificado'
    };

    // Verificação segura para justification
    const safeJustification = Array.isArray(justification) ? justification : [];

    // Verificação segura para rawHeaders
    const safeRawHeaders = Array.isArray(rawHeaders) ? rawHeaders : [];

    return (
      <div className="report-card">
        <div className="report-header">
          <h3>Diagnóstico da Tabela</h3>
          <p style={{ margin: 0, color: 'var(--text-color-light)' }}>
            Arquivo: {safeFileName}
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
                {safeCoverage.found.length > 0 ? (
                  safeCoverage.found.map((col, index) => (
                    <li className="found-cols" key={`found-${index}`}>
                      {typeof col === 'string' ? col : String(col)}
                    </li>
                  ))
                ) : null}
                
                {safeCoverage.missing.length > 0 ? (
                  safeCoverage.missing.map((col, index) => (
                    <li className="missing-cols" key={`missing-${index}`}>
                      {typeof col === 'string' ? col : String(col)}
                    </li>
                  ))
                ) : null}

                {safeCoverage.found.length === 0 && safeCoverage.missing.length === 0 && (
                  <li className="missing-cols">Nenhuma informação de abrangência disponível</li>
                )}
              </ul>
            </div>

            {/* Bloco de Análise de Precificação */}
            <div className="detail-block">
              <h4>Análise de Precificação</h4>
              <ul>
                {safePricing.found ? (
                  <li className="found-cols">{safePricing.format}</li>
                ) : (
                  <li className="missing-cols">Nenhum formato de preço reconhecido.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Bloco de Justificativa */}
          {safeJustification.length > 0 && (
            <div className="justification-block">
              <h4>Justificativa do Diagnóstico</h4>
              {safeJustification.map((msg, index) => (
                <p key={`justification-${index}`}>
                  {typeof msg === 'string' ? msg : String(msg)}
                </p>
              ))}
            </div>
          )}

          {/* Bloco de Debug */}
          {safeRawHeaders.length > 0 && (
            <div className="debug-details">
              <details>
                <summary>Exibir todas as colunas lidas pelo programa (Debug)</summary>
                <pre>
                  {(() => {
                    try {
                      return JSON.stringify(safeRawHeaders, null, 2);
                    } catch (jsonError) {
                      console.error('Erro ao serializar rawHeaders:', jsonError);
                      return 'Erro ao exibir dados de debug';
                    }
                  })()}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    );

  } catch (error) {
    console.error('Erro no componente ValidationReport:', error);
    
    // Fallback em caso de erro
    return (
      <div className="report-card">
        <div className="report-header">
          <h3>Erro no Diagnóstico</h3>
          <p style={{ margin: 0, color: 'var(--text-color-light)' }}>
            Arquivo: {fileName || 'Não identificado'}
          </p>
        </div>
        <div className="report-body">
          <div className="status-badge danger">
            Erro ao processar relatório
          </div>
          <div className="justification-block">
            <h4>Detalhes do Erro</h4>
            <p>Ocorreu um erro ao processar o relatório de validação. Verifique os dados fornecidos.</p>
            {process.env.NODE_ENV === 'development' && (
              <p style={{ color: 'red', fontSize: '0.8em' }}>
                Erro técnico: {error.message}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default ValidationReport;