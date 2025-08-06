// src/utils/validator.js

// ... (as funções normalizeHeader, validateCoverage, e validatePricing continuam iguais às da versão anterior)
const normalizeHeader = (header) => {
  if (!header) return '';
  return header.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};
function validateCoverage(normalizedHeaders) {
    const REQUIRED_COLS = ['CEPI', 'CEPF', 'UF', 'CIDADE', 'PRAZO'];
    const found = [];
    const missing = [];
    REQUIRED_COLS.forEach(reqCol => {
        const variants = {
            'CEPI': ['CEPI', 'CEPINICIAL'],
            'CEPF': ['CEPF', 'CEPFINAL'],
            'UF': ['UF', 'UFDESTINO'],
            'CIDADE': ['CIDADE', 'LOCALIDADE', 'LOCALIDADEDESTINO', 'MUNICIPIO'],
            'PRAZO': ['PRAZO', 'PRAZODIAS', 'PRAZODIASUTEIS', 'PRAZOENTREGA', 'PREVISAODEENTREGA']
        };
        if (variants[reqCol].some(variant => normalizedHeaders.includes(variant))) {
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
    const weightCols = rawHeaders.filter(h => !isNaN(parseFloat(h)) && isFinite(h));
    if (weightCols.length > 5) {
        return { found: true, format: 'Precificação por faixa de peso (formato matricial)' };
    }
    const hasLinearRangeFormat = normalizedHeaders.includes('PESOINICIAL') && normalizedHeaders.includes('PESOFINAL') && (normalizedHeaders.includes('FRETE') || normalizedHeaders.includes('FRETERS'));
    if (hasLinearRangeFormat) {
        return { found: true, format: 'Precificação por faixa de peso (formato linear)' };
    }
    const hasMinPlusKg = (normalizedHeaders.includes('FRETEMINIMO') || normalizedHeaders.includes('FRETEMINIMORS')) && normalizedHeaders.includes('EXCEDENTEPORKG');
    if (hasMinPlusKg) {
        return { found: true, format: 'Precificação por Frete Mínimo + Kg Adicional' };
    }
    const hasSimpleLinearFormat = ['VALORFRETE', 'FRETEVALOR', 'PRECO'].some(p => normalizedHeaders.includes(p));
    if (hasSimpleLinearFormat) {
        return { found: true, format: 'Precificação por valor de frete (formato linear simples)' };
    }
    return { found: false, format: null };
}

// --- LÓGICA DE DIAGNÓSTICO CORRIGIDA ---
export const validateFreightTable = (data) => {
    if (!data || data.length === 0) {
        // ... (código de erro de arquivo vazio)
        return {
            diagnosis: '❌ Incompleto – não é possível seguir',
            coverage: { found: [], missing: ['CEPI', 'CEPF', 'UF', 'CIDADE', 'PRAZO'] },
            pricing: { found: false, format: null },
            justification: ['O arquivo está vazio ou não pôde ser lido.'],
            rawHeaders: []
        };
    }

    const rawHeaders = Object.keys(data[0]);
    const normalizedHeaders = rawHeaders.map(normalizeHeader);

    const coverageAnalysis = validateCoverage(normalizedHeaders);
    const pricingAnalysis = validatePricing(normalizedHeaders, rawHeaders);

    const justification = [];
    let diagnosis = '';

    // Estrutura de decisão reescrita para ser mais clara e sem bugs
    if (coverageAnalysis.missing.length === 0 && pricingAnalysis.found) {
        // Cenário 1: Tudo OK
        diagnosis = '✅ Apto para abertura de chamado';

    } else if (pricingAnalysis.found && coverageAnalysis.missing.length > 0) {
        // Cenário 2: Preço OK, mas falta Abrangência
        diagnosis = '⚠️ Requer ajustes';
        justification.push(`A precificação foi encontrada, mas faltam as seguintes colunas de abrangência: ${coverageAnalysis.missing.join(', ')}.`);

    } else if (!pricingAnalysis.found && coverageAnalysis.missing.length === 0) {
        // Cenário 3: Abrangência OK, mas falta Preço
        diagnosis = '❌ Incompleto – não é possível seguir';
        justification.push("A abrangência foi encontrada, mas a tabela de precificação está faltando ou seu formato não foi reconhecido.");

    } else { // !pricingAnalysis.found && coverageAnalysis.missing.length > 0
        // Cenário 4: Faltam os dois
        diagnosis = '❌ Incompleto – não é possível seguir';
        justification.push(`Faltam colunas de abrangência (${coverageAnalysis.missing.join(', ')}) e a tabela de precificação.`);
    }
    
    return {
        diagnosis,
        coverage: coverageAnalysis,
        pricing: pricingAnalysis,
        justification,
        rawHeaders
    };
};