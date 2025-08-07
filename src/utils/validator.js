// src/utils/validator.js

const COLUMN_VARIANTS = {
    CEPI: ['CEPI', 'CEPINICIAL', 'CEPINI'],
    CEPF: ['CEPF', 'CEPFINAL', 'CEPFIM'],
    UF: ['UF', 'UFDESTINO'],
    CIDADE: ['CIDADE', 'LOCALIDADE', 'LOCALIDADEDESTINO', 'MUNICIPIO'],
    PRAZO: ['PRAZO', 'PRAZODIAS', 'PRAZODIASUTEIS', 'PRAZOENTREGA', 'PREVISAODEENTREGA'],
};

const normalizeHeader = (header) => {
  if (!header) return '';
  return header.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

function validateCoverage(normalizedHeaders) {
    const found = [];
    const missing = [];
    Object.keys(COLUMN_VARIANTS).forEach(reqCol => {
        const variants = COLUMN_VARIANTS[reqCol];
        if (variants.some(variant => normalizedHeaders.includes(variant))) {
            found.push(reqCol);
        } else {
            missing.push(reqCol);
        }
    });
    if (normalizedHeaders.includes('ORIGEM')) {
        found.push('ORIGEM');
    }
    return { found, missing };
}

function validatePricing(normalizedHeaders, rawHeaders) {
    if (rawHeaders.filter(h => !isNaN(parseFloat(h)) && isFinite(h)).length > 5) {
        return { found: true, format: 'Precificação por faixa de peso (formato matricial)' };
    }
    if (rawHeaders.filter(h => h.toLowerCase().includes('kg')).length >= 3 && normalizedHeaders.includes('FRETEMINIMO')) {
        return { found: true, format: 'Precificação por faixa de peso (formato texto)' };
    }
    if (normalizedHeaders.includes('PESOINICIAL') && normalizedHeaders.includes('PESOFINAL') && (normalizedHeaders.includes('FRETE') || normalizedHeaders.includes('FRETERS'))) {
        return { found: true, format: 'Precificação por faixa de peso (formato linear)' };
    }
    if ((normalizedHeaders.includes('FRETEMINIMO') || normalizedHeaders.includes('FRETEMINIMORS')) && normalizedHeaders.includes('EXCEDENTEPORKG')) {
        return { found: true, format: 'Precificação por Frete Mínimo + Kg Adicional' };
    }
    if (['VALORFRETE', 'FRETEVALOR', 'PRECO'].some(p => normalizedHeaders.includes(p))) {
        return { found: true, format: 'Precificação por valor de frete (formato linear simples)' };
    }
    return { found: false, format: null };
}

// Função principal agora analisa um objeto com múltiplas abas
export const validateWorkbook = (sheetsData) => {
    const sheetReports = [];
    let overallCoverageFound = false;
    let overallPricingFound = false;

    for (const sheetName in sheetsData) {
        const data = sheetsData[sheetName];
        if (!data || data.length === 0) continue;

        const rawHeaders = Object.keys(data[0]);
        const normalizedHeaders = rawHeaders.map(normalizeHeader);
        
        const coverageAnalysis = validateCoverage(normalizedHeaders);
        const pricingAnalysis = validatePricing(normalizedHeaders, rawHeaders);

        // Só adiciona ao relatório se encontrar algo de útil na aba
        if (coverageAnalysis.found.length > 0 || pricingAnalysis.found) {
            sheetReports.push({
                sheetName,
                coverage: coverageAnalysis,
                pricing: pricingAnalysis,
            });
            if (coverageAnalysis.missing.length === 0) overallCoverageFound = true;
            if (pricingAnalysis.found) overallPricingFound = true;
        }
    }

    // Monta o diagnóstico final consolidado
    let diagnosis = '';
    const justification = [];

    if (sheetReports.length === 0) {
        diagnosis = '❌ Incompleto – não é possível seguir';
        justification.push("Nenhuma aba com colunas de abrangência ou precificação reconhecidas foi encontrada.");
    } else if (overallCoverageFound && overallPricingFound) {
        diagnosis = '✅ Apto para abertura de chamado';
        justification.push("O arquivo contém abas com abrangência completa e precificação válida.");
    } else if (!overallCoverageFound && overallPricingFound) {
        diagnosis = '⚠️ Requer ajustes';
        justification.push("Encontramos precificação, mas nenhuma aba contém todas as colunas de abrangência necessárias.");
    } else if (overallCoverageFound && !overallPricingFound) {
        diagnosis = '❌ Incompleto – não é possível seguir';
        justification.push("Encontramos abrangência completa, mas nenhuma aba contém uma tabela de precificação válida.");
    } else {
        diagnosis = '❌ Incompleto – não é possível seguir';
        justification.push("As abas contêm informações parciais. Verifique os detalhes abaixo para ver o que falta.");
    }

    return {
        diagnosis,
        justification,
        sheetReports, // Retorna os relatórios detalhados por aba
    };
};
