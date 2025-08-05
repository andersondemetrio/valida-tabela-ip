// src/utils/validator.js

const REQUIRED_COVERAGE_COLS = ['CEPI', 'CEPF', 'UF', 'CIDADE', 'PRAZO'];

const normalizeHeader = (header) => {
  if (!header) return '';
  // Converte para maiúsculo, remove acentos e caracteres especiais
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
      rawHeaders: []
    };
  }

  const rawHeaders = Object.keys(data[0]);
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // --- 1. Validação de Colunas de Abrangência ---
  const foundCols = [];
  const missingCols = [];

  REQUIRED_COVERAGE_COLS.forEach(reqCol => {
    const variants = {
      'CEPI': ['CEPI', 'CEPINICIAL'],
      'CEPF': ['CEPF', 'CEPFINAL'],
      'UF': ['UF', 'UFDESTINO'],
      // AJUSTE 1: Adicionado LOCALIDADEDESTINO como variação válida para CIDADE
      'CIDADE': ['CIDADE', 'LOCALIDADE', 'LOCALIDADEDESTINO'],
      'PRAZO': ['PRAZO', 'PRAZODIAS', 'PRAZODIASUTEIS', 'PRAZOENTREGA']
    };

    const found = variants[reqCol].some(variant => normalizedHeaders.includes(variant));
    if (found) {
      foundCols.push(reqCol);
    } else {
      missingCols.push(reqCol);
    }
  });

  // --- 2. Validação de Precificação (com lógica melhorada) ---
  const errors = [];
  let hasPricing = false;

  // Verificação 1: Formato Matricial (ex: Jadlog, Azul Cargo)
  const weightCols = rawHeaders.filter(h => !isNaN(parseFloat(h)) && isFinite(h));
  if (weightCols.length > 5) {
    hasPricing = true;
    foundCols.push('Pesos (formato matricial)');
  } else {
    // AJUSTE 2: Adicionada verificação para formato Linear com faixas (ex: Rodonaves)
    const hasLinearRangeFormat = normalizedHeaders.includes('PESOINICIAL') &&
                                 normalizedHeaders.includes('PESOFINAL') &&
                                 (normalizedHeaders.includes('FRETE') || normalizedHeaders.includes('FRETERS')); // "Frete (R$)" vira "FRETERS"

    // Verificação 3: Formato Linear simples
    const hasSimpleLinearFormat = ['VALORFRETE', 'FRETEVALOR', 'PRECO'].some(p => normalizedHeaders.includes(p));

    if (hasLinearRangeFormat) {
      hasPricing = true;
      foundCols.push('Frete (formato linear com faixa de peso)');
    } else if (hasSimpleLinearFormat) {
      hasPricing = true;
      foundCols.push('Valor do Frete');
    }
  }
  
  if (!hasPricing) {
      errors.push('Não foi encontrada uma estrutura de precificação válida (nem matricial, nem linear).');
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
    foundCols: [...new Set(foundCols)],
    missingCols,
    rawHeaders: rawHeaders,
  };
};