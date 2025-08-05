// src/utils/validator.js

// Colunas obrigatórias de abrangência
const REQUIRED_COVERAGE_COLS = ['CEPI', 'CEPF', 'UF', 'CIDADE', 'PRAZO'];

// Função para normalizar nomes de colunas (remove acentos, espaços e deixa em maiúsculo)
const normalizeHeader = (header) => {
  if (!header) return '';
  return header
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
};

export const validateFreightTable = (data) => {
  if (!data || data.length === 0) {
    return {
      diagnosis: '❌ Incompleto – não é possível seguir',
      errors: ['O arquivo está vazio ou não pôde ser lido.'],
      foundCols: [],
      missingCols: REQUIRED_COVERAGE_COLS,
    };
  }

  const headers = Object.keys(data[0]);
  const normalizedHeaders = headers.map(normalizeHeader);

  // --- 1. Validação de Colunas de Abrangência ---
  const foundCols = [];
  const missingCols = [];

  REQUIRED_COVERAGE_COLS.forEach(reqCol => {
    const variants = {
      'CEPI': ['CEPI', 'CEPINICIAL'],
      'CEPF': ['CEPF', 'CEPFINAL'],
      'UF': ['UF', 'UFDESTINO'],
      'CIDADE': ['CIDADE', 'LOCALIDADE'],
      'PRAZO': ['PRAZO', 'PRAZODIAS', 'PRAZODIASUTEIS', 'PRAZOENTREGA']
    };

    const found = variants[reqCol].some(variant => normalizedHeaders.includes(variant));
    if (found) {
      foundCols.push(reqCol);
    } else {
      missingCols.push(reqCol);
    }
  });

  // --- 2. Validação de Precificação ---
  const errors = [];
  let hasPricing = false;

  // Verifica se é matricial (procura por colunas que são apenas números, representando pesos)
  const weightCols = headers.filter(h => !isNaN(parseFloat(h)) && isFinite(h));
  if (weightCols.length > 5) { // Heurística: mais de 5 colunas numéricas é provavelmente uma matriz de peso
    hasPricing = true;
    foundCols.push('Pesos (matricial)');
  } else {
    // Verifica por colunas de preço linearizadas
    const hasLinearPricing = ['VALORFRETE', 'FRETEVALOR', 'PRECO'].some(p => normalizedHeaders.includes(p));
    if (hasLinearPricing) {
        hasPricing = true;
        foundCols.push('Valor do Frete');
    }
  }

  if (!hasPricing) {
      errors.push('Não foi encontrada uma estrutura de precificação válida (nem matricial, nem colunas como "valor_frete").');
  }

  // --- 3. Diagnóstico Final ---
  let diagnosis = '✅ Apto para abertura de chamado';

  if (missingCols.length > 0 || errors.length > 0) {
    diagnosis = '⚠️ Requer ajustes';
  }

  if (missingCols.length === REQUIRED_COVERAGE_COLS.length || !hasPricing) {
    diagnosis = '❌ Incompleto – não é possível seguir';
  }

  return {
    diagnosis,
    errors,
    foundCols: [...new Set(foundCols)], // Remove duplicados
    missingCols,
  };
};