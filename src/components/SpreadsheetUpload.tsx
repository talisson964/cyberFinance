import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { useCaixa } from '../context/CaixaContext';
import type { MovementType } from '../types';
import { capitalizeText } from '../utils/textFormat';
import styles from './SpreadsheetUpload.module.css';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportedData {
  date: string;
  description: string;
  type: 'entrada' | 'saida';
  value: number;
  paymentMethod: string;
  category?: string;
  bank?: string;  // Banco do cartão
  totalInstallments: number;
  installmentValue: number;
  paidInstallments: number;
}

interface GroupedData {
  items: ImportedData[];
  totalValue: number;
}

interface MovementToImport {
  type: 'entrada' | 'saida';
  movementType: MovementType;
  amount: number;
  category: string;
  description: string;
  classification: 'fixo' | 'temporario' | 'nenhum';
  date?: string;
  priority?: 'alta' | 'média' | 'baixa';
  totalInstallments?: number;
  purchaseItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  firstInstallmentDate?: string;
  notes?: string;
  paidInstallments?: number;
  shouldMarkAsPaid?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: ImportedData[];
}

export const SpreadsheetUpload: React.FC = () => {
  const { addMultipleMovements } = useCaixa();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Agrupar itens similares (mesma data, categoria, forma de pagamento, banco, parcelas)
  const groupSimilarItems = (items: ImportedData[]): GroupedData[] => {
    const groups: GroupedData[] = [];
    const processed = new Set<number>();

    items.forEach((item, index) => {
      if (processed.has(index)) return;

      // Iniciar novo grupo com este item
      const group: GroupedData = {
        items: [item],
        totalValue: item.value,
      };

      // Procurar itens similares nas posições seguintes
      for (let i = index + 1; i < items.length; i++) {
        if (processed.has(i)) continue;

        const nextItem = items[i];
        
        // Verificar se são similares (mesmos critérios de agrupamento)
        // IMPORTANTE: Banco deve ser igual OU ambos undefined (usar comparação estrita)
        const sameBank = (item.bank === nextItem.bank) || 
                         ((!item.bank || item.bank === '') && (!nextItem.bank || nextItem.bank === ''));
        
        const isSimilar = 
          item.date === nextItem.date &&
          item.category === nextItem.category &&
          item.paymentMethod.toLowerCase().trim() === nextItem.paymentMethod.toLowerCase().trim() &&
          sameBank &&
          item.totalInstallments === nextItem.totalInstallments &&
          item.paidInstallments === nextItem.paidInstallments &&
          item.type === nextItem.type;

        if (isSimilar) {
          group.items.push(nextItem);
          group.totalValue += nextItem.value;
          processed.add(i);
        }
      }

      processed.add(index);
      groups.push(group);
    });

    return groups;
  };

  const validateHeaders = (headers: string[]): boolean => {
    // Colunas obrigatórias (padrões regex para ser flexível)
    const requiredPatterns = [
      /data|date|dados/i,  // "data", "datas", "dados", "date"
      /descri/i,  // "descrição"
      /tipo/i,  // "tipo"
      /valor(?!.*parcel)/i,  // "valor" (mas não "valor por parcela")
      /forma.*pag|pag.*forma|^pagamento$/i,  // "forma de pagamento"
      /quant.*parcel|parcel.*quant|^parcelas$|n[uº].*parcel/i,  // "quantidade de parcelas", "quantidades de parcelas", "parcelas"
      /valor.*parcel|parcel.*valor/i,  // "valor por parcela"
      /pag.*parcel|parcel.*pag/i,  // "parcelas pagas"
    ];

    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    // Verificar se cada padrão obrigatório encontra uma coluna
    return requiredPatterns.every(pattern => 
      normalizedHeaders.some(h => pattern.test(h))
    );
  };

  const shouldMarkAsPaid = (movementType: MovementType): boolean => {
    // PIX, Débito e Crédito à Vista devem ser marcados como pagos automaticamente
    return movementType === 'pix' || movementType === 'debito' || movementType === 'credito_avista';
  };

  const mapPaymentMethodToMovementType = (method: string, totalInstallments: number = 1): MovementType => {
    const normalized = method.toLowerCase().trim();
    
    if (normalized.includes('pix')) return 'pix';
    if (normalized.includes('débito') || normalized.includes('debito') || normalized.includes('cartao debito')) return 'debito';
    if (normalized.includes('crédito') || normalized.includes('credito')) {
      // Se tem mais de uma parcela, é crédito parcelado
      return totalInstallments > 1 ? 'parcelado' : 'credito_avista';
    }
    if (normalized.includes('parcelado')) return 'parcelado';
    if (normalized.includes('dinheiro')) return 'dinheiro';
    if (normalized.includes('transferência') || normalized.includes('transferencia')) return 'transferencia';
    if (normalized.includes('boleto')) return 'boleto';
    
    // Padrão: se mencionar parcel, é parcelado
    if (normalized.includes('parcel')) return 'parcelado';
    
    return 'dinheiro'; // Padrão
  };

  const mapCategoryName = (category: string, type: 'entrada' | 'saida'): string => {
    if (!category) {
      return type === 'entrada' ? 'outra_entrada' : 'outra_saida';
    }

    const normalized = category.toLowerCase().trim();

    // Categorias de Entrada
    if (type === 'entrada') {
      if (normalized.includes('venda')) return 'Venda';
      if (normalized.includes('serviço') || normalized.includes('servico')) return 'Serviço';
      if (normalized.includes('aluguel')) return 'Aluguel';
      if (normalized.includes('comissão') || normalized.includes('comissao')) return 'Comissão';
      if (normalized.includes('bônus') || normalized.includes('bonus')) return 'Bônus';
      if (normalized.includes('juros')) return 'Juros';
      if (normalized.includes('devolução') || normalized.includes('devolucao')) return 'Devolução';
      return category; // Usar a categoria como está se não encontrar correspondência
    }

    // Categorias de Saída
    if (type === 'saida') {
      if (normalized.includes('alimentação') || normalized.includes('alimentacao')) return 'Alimentação';
      if (normalized.includes('combustível') || normalized.includes('combustivel')) return 'Combustível';
      if (normalized.includes('transporte')) return 'Transporte';
      if (normalized.includes('medicamento') || normalized.includes('medicação') || normalized.includes('medicacao')) return 'Medicamentos';
      if (normalized.includes('serviço') || normalized.includes('servico')) return 'Serviços';
      if (normalized.includes('aluguel')) return 'Aluguel';
      if (normalized.includes('conta') || normalized.includes('utilidade') || normalized.includes('agua') || normalized.includes('agua') || normalized.includes('eletricidade') || normalized.includes('internet')) return 'Contas';
      if (normalized.includes('venda')) return 'Venda';
      return category; // Usar a categoria como está se não encontrar correspondência
    }

    return category;
  };

  const parseDate = (dateValue: any): string => {
    // Se for undefined ou null, lançar erro específico
    if (dateValue === undefined || dateValue === null || dateValue === '') {
      throw new Error('Data não encontrada ou vazia');
    }

    // Se for número (Excel serial date number)
    if (typeof dateValue === 'number') {
      // Excel serial number (dias desde 1/1/1900)
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Se for objeto Date do JavaScript
    if (dateValue instanceof Date) {
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Converter para string e limpar
    let dateStr = String(dateValue).trim();
    
    // Remover possíveis aspas ou outros caracteres
    dateStr = dateStr.replace(/['"]/g, '');
    
    // Mapeamento de meses em português/inglês (abreviações de 3 letras e nomes completos)
    const monthMap: Record<string, string> = {
      'jan': '01', 'janeiro': '01', 'january': '01',
      'fev': '02', 'fevereiro': '02', 'feb': '02', 'february': '02',
      'mar': '03', 'março': '03', 'marco': '03', 'march': '03',
      'abr': '04', 'abril': '04', 'apr': '04', 'april': '04',
      'mai': '05', 'maio': '05', 'may': '05',
      'jun': '06', 'junho': '06', 'june': '06',
      'jul': '07', 'julho': '07', 'july': '07',
      'ago': '08', 'agosto': '08', 'aug': '08', 'august': '08',
      'set': '09', 'setembro': '09', 'sep': '09', 'sept': '09', 'september': '09',
      'out': '10', 'outubro': '10', 'oct': '10', 'october': '10',
      'novembro': '11', 'nov': '11', 'november': '11',
      'dez': '12', 'dezembro': '12', 'dec': '12', 'december': '12',
    };

    // Try DD-MMM format (como "13-Oct", "01-Jan", etc) - case insensitive
    // Aceita: "13-Oct", "13 Oct", "13Oct", etc
    const ddmmmMatch = dateStr.match(/^(\d{1,2})[\s-]?([a-z]+)\.?$/i);
    if (ddmmmMatch) {
      const [, day, monthName] = ddmmmMatch;
      const monthLower = monthName.toLowerCase().replace('.', '');
      const month = monthMap[monthLower];
      if (month) {
        const currentYear = new Date().getFullYear();
        const paddedDay = day.padStart(2, '0');
        return `${currentYear}-${month}-${paddedDay}`;
      }
    }

    // Try DD-MMM-YYYY format (como "13-Oct-2025") - case insensitive
    const ddmmmyyyyMatch = dateStr.match(/^(\d{1,2})[\s-]?([a-z]+)\.?[\s-]?(\d{4})$/i);
    if (ddmmmyyyyMatch) {
      const [, day, monthName, year] = ddmmmyyyyMatch;
      const monthLower = monthName.toLowerCase().replace('.', '');
      const month = monthMap[monthLower];
      if (month) {
        const paddedDay = day.padStart(2, '0');
        return `${year}-${month}-${paddedDay}`;
      }
    }

    // Try DD/MMM/YYYY format (como "13/Oct/2025") - case insensitive
    const ddmmmyyyySlashMatch = dateStr.match(/^(\d{1,2})\/([a-z]+)\.?\/(\d{4})$/i);
    if (ddmmmyyyySlashMatch) {
      const [, day, monthName, year] = ddmmmyyyySlashMatch;
      const monthLower = monthName.toLowerCase().replace('.', '');
      const month = monthMap[monthLower];
      if (month) {
        const paddedDay = day.padStart(2, '0');
        return `${year}-${month}-${paddedDay}`;
      }
    }
    
    // Try formato curto com ano de 2 dígitos: M/D/YY ou MM/DD/YY ou D/M/YY ou DD/MM/YY
    const shortYearMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (shortYearMatch) {
      const [, firstPart, secondPart, shortYear] = shortYearMatch;
      const first = parseInt(firstPart);
      const second = parseInt(secondPart);
      
      // Converter ano de 2 dígitos para 4 dígitos
      // Assumir 2000+ para anos 00-99 (2000-2099)
      const fullYear = `20${shortYear}`;
      
      // Determinar se é dia/mês ou mês/dia usando lógica clara
      let day: string, month: string;
      
      if (first > 12 && second <= 12) {
        // Primeiro número > 12, segundo <= 12: formato DD/MM/YY (brasileiro)
        day = firstPart.padStart(2, '0');
        month = secondPart.padStart(2, '0');
      } else if (second > 12 && first <= 12) {
        // Segundo número > 12, primeiro <= 12: formato MM/DD/YY (americano)
        month = firstPart.padStart(2, '0');
        day = secondPart.padStart(2, '0');
      } else if (first > 12 && second > 12) {
        // Ambos > 12: inválido
        throw new Error(`Data inválida: ${dateStr}. Dia e mês não podem ser maiores que 12 simultaneamente.`);
      } else {
        // Ambos <= 12: assumir formato brasileiro (DD/MM/YY) como padrão
        day = firstPart.padStart(2, '0');
        month = secondPart.padStart(2, '0');
      }
      
      // Validar dia e mês
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        return `${fullYear}-${month}-${day}`;
      } else {
        throw new Error(`Data inválida: ${dateStr}. Dia deve estar entre 1-31 e mês entre 1-12.`);
      }
    }
    
    // Try DD/MM/YYYY format (Brazilian)
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      // Validar se é formato brasileiro (dia entre 01-31, mês entre 01-12)
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        return `${year}-${paddedMonth}-${paddedDay}`;
      }
    }

    // Try MM/DD/YYYY format (American) - detectar pelo dia > 12
    const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyyMatch) {
      const [, firstPart, secondPart, year] = mmddyyyyMatch;
      const first = parseInt(firstPart);
      const second = parseInt(secondPart);
      
      const paddedFirst = firstPart.padStart(2, '0');
      const paddedSecond = secondPart.padStart(2, '0');
      
      // Se primeiro > 12, é certamente dia/mês (brasileiro)
      if (first > 12) {
        return `${year}-${paddedSecond}-${paddedFirst}`;
      }
      
      // Se segundo > 12, é certamente mês/dia (americano)
      if (second > 12) {
        return `${year}-${paddedFirst}-${paddedSecond}`;
      }
      
      // Se ambos <= 12, assumir formato brasileiro (DD/MM/YYYY) como padrão
      return `${year}-${paddedSecond}-${paddedFirst}`;
    }

    // Try YYYY-MM-DD format
    const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try formato DD-MM-YYYY com traço
    const ddmmyyyyDashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyDashMatch) {
      const [, day, month, year] = ddmmyyyyDashMatch;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    throw new Error(`Data inválida: ${dateStr}. Formatos aceitos: DD/MM/YYYY, M/D/YY, DD-MMM, YYYY-MM-DD`);
  };

  const parseNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    
    const strValue = String(value).trim();
    if (!strValue) return NaN;
    
    // Remover formatação de moeda e símbolos
    let normalized = strValue
      .replace(/R\$\s*/g, '') // Remove R$
      .replace(/\$\s*/g, '') // Remove $
      .replace(/\s/g, ''); // Remove espaços
    
    // Detectar formato: americano usa . para decimais, brasileiro usa ,
    // Se houver virgula, é formato brasileiro (1.234,56)
    // Se houver apenas ponto e mais de um, pode ser americano com milhar (1,234.56)
    
    if (normalized.includes(',')) {
      // Formato brasileiro: remover pontos de milhar, converter vírgula para ponto
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if ((normalized.match(/\./g) || []).length > 1) {
      // Formato americano com múltiplos pontos (ex: 1.234.567.89)
      // Manter apenas o último como decimal
      const lastDotIndex = normalized.lastIndexOf('.');
      normalized = normalized.substring(0, lastDotIndex).replace(/\./g, '') + '.' + normalized.substring(lastDotIndex + 1);
    }
    // Se houver um único ponto, deixar como está (decimal americano)
    
    const parsed = parseFloat(normalized);
    return parsed;
  };

  const validateAndParseData = (rows: any[]): ValidationResult => {
    if (rows.length === 0) {
      return {
        isValid: false,
        errors: ['Nenhuma linha de dados encontrada na planilha'],
      };
    }

    const headers = Object.keys(rows[0]) as string[];
    if (!validateHeaders(headers)) {
      return {
        isValid: false,
        errors: [
          'Colunas obrigatórias não encontradas. Verifique se a planilha possui as colunas:',
          'Data (ou Datas), Descrição, Tipo, Valor, Forma de Pagamento, Quantidade de Parcelas (ou Quantidades de Parcelas), Valor por Parcela, Parcelas Pagas',
          '',
          'Suas colunas: ' + headers.join(', '),
        ],
      };
    }

    const errors: string[] = [];
    const data: ImportedData[] = [];

    // Mapear colunas pelos nomes (case-insensitive)
    const getColumnValue = (row: any, pattern: RegExp): any => {
      const key = headers.find(h => {
        const normalized = h.toLowerCase().trim();
        return pattern.test(normalized);
      });
      return key ? row[key] : undefined;
    };

    rows.forEach((row, index) => {
      try {
        const values = Object.values(row);
        if (values.every(v => v === undefined || v === null || v === '')) {
          return; // Skip empty rows
        }

        const date = parseDate(getColumnValue(row, /data|date|dados/i));
        const description = capitalizeText(String(getColumnValue(row, /descri/i) || '').trim());
        const type = String(getColumnValue(row, /tipo/i) || '').toLowerCase().trim();
        const rawValue = getColumnValue(row, /^valor$|^valores$/i);  // "valor" exato (não "valor por parcela")
        const value = parseNumber(rawValue);
        const rawPaymentMethod = String(getColumnValue(row, /forma.*pag|pag.*forma|^pagamento$/i) || '').trim();
        const paymentMethod = capitalizeText(rawPaymentMethod);  // Normalizar capitalização
        const category = capitalizeText(String(getColumnValue(row, /categ/i) || '').trim());
        const rawBankColumn = String(getColumnValue(row, /banco/i) || '').trim();
        const bankColumn = rawBankColumn ? capitalizeText(rawBankColumn) : '';  // Normalizar banco (vazio se não existe)
        const totalInstallments = parseNumber(getColumnValue(row, /quant.*parcel|parcel.*quant|^parcelas$|n[uº].*parcel/i)) || 1;
        const installmentValue = parseNumber(getColumnValue(row, /valor.*parcel|parcel.*valor/i));
        let paidInstallments = parseNumber(getColumnValue(row, /pag.*parcel|parcelas.*pag|parcel.*pag/i)) || 0;
        
        // Se for à vista (1 parcela) ou método de pagamento indica à vista, marcar como pago
        const isAvista = totalInstallments === 1 || 
                         paymentMethod.toLowerCase().includes('vista') ||
                         paymentMethod.toLowerCase().includes('dinheiro') ||
                         paymentMethod.toLowerCase().includes('pix');
        
        if (isAvista) {
          paidInstallments = totalInstallments; // Marca todas as parcelas como pagas (neste caso, apenas 1)
        }

        // Validações
        if (!description) {
          throw new Error('Descrição vazia');
        }

        if (type !== 'entrada' && type !== 'saida') {
          throw new Error(`Tipo inválido: ${type}. Use 'entrada' ou 'saida'`);
        }

        if (isNaN(value) || value <= 0) {
          throw new Error(`Valor inválido: ${value}`);
        }

        if (!paymentMethod) {
          throw new Error('Forma de pagamento vazia');
        }

        if (isNaN(totalInstallments) || totalInstallments < 1) {
          throw new Error(`Quantidade de parcelas inválida: ${totalInstallments}`);
        }

        if (isNaN(installmentValue) || installmentValue <= 0) {
          throw new Error(`Valor por parcela inválido: ${installmentValue}`);
        }

        if (isNaN(paidInstallments) || paidInstallments < 0 || paidInstallments > totalInstallments) {
          throw new Error(`Parcelas pagas inválido: ${paidInstallments} (deve estar entre 0 e ${totalInstallments})`);
        }

        data.push({
          date,
          description,
          type: type as 'entrada' | 'saida',
          value,
          paymentMethod,
          category: category || undefined,
          bank: bankColumn || undefined,  // Incluir banco se existir
          totalInstallments,
          installmentValue,
          paidInstallments,
        });
      } catch (error) {
        errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : 'Erro ao processar linha'}`);
      }
    });

    if (errors.length > 0) {
      return {
        isValid: false,
        errors: errors.slice(0, 10), // Mostrar apenas os primeiros 10 erros
      };
    }

    return {
      isValid: true,
      errors: [],
      data,
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSuccessMessage('');
    setValidationResult(null);
    setIsProcessing(true);

    try {
      // Validar tipo de arquivo
      const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'text/plain'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
        setValidationResult({
          isValid: false,
          errors: [`Tipo de arquivo inválido: ${file.type || file.name}. Use Excel (.xlsx, .xls) ou CSV (.csv)`],
        });
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            throw new Error('Arquivo vazio');
          }

          const workbook = XLSX.read(data, { type: 'array' });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Nenhuma planilha encontrada no arquivo');
          }

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Ler dados mantendo tipos originais (números de série do Excel para datas)
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,  // Retorna array de arrays
            defval: '',
            blankrows: false,
            raw: true  // Mantém tipos originais (importante para datas)
          }) as any[][];

          if (rawRows.length < 2) {
            throw new Error('Nenhuma linha de dados encontrada. O arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados.');
          }

          // Primeira linha é o cabeçalho - normalizar os nomes
          const headers = rawRows[0].map((h: any) => 
            String(h || '').trim()
          );
          
          // Converter o restante em objetos usando o cabeçalho da primeira linha
          const dataRows = rawRows.slice(1)
            .filter(row => row.some(cell => cell !== '' && cell != null)) // Ignora linhas completamente vazias
            .map((row: any[]) => {
              const obj: any = {};
              headers.forEach((header, index) => {
                // Manter o valor original (não converter para string ainda)
                // A conversão será feita no parseDate/parseNumber conforme necessário
                obj[header] = row[index] != null ? row[index] : '';
              });
              return obj;
            });

          const validation = validateAndParseData(dataRows);
          setValidationResult(validation);
        } catch (error) {
          console.error('Erro ao ler arquivo:', error);
          setValidationResult({
            isValid: false,
            errors: [
              'Erro ao ler o arquivo:',
              error instanceof Error ? error.message : 'Erro desconhecido',
            ],
          });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        console.error('Erro ao ler arquivo');
        setValidationResult({
          isValid: false,
          errors: ['Erro ao ler o arquivo. Verifique se o arquivo está acessível.'],
        });
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setValidationResult({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Erro ao processar arquivo'],
      });
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!validationResult?.isValid || !validationResult.data) return;

    setIsProcessing(true);
    try {
      // Agrupar itens similares antes de importar
      const groupedData = groupSimilarItems(validationResult.data);
      
      // Preparar todos os movimentos para importação
      const movementsToImport: MovementToImport[] = groupedData.map(group => {
        const firstItem = group.items[0];
        const movementType = mapPaymentMethodToMovementType(firstItem.paymentMethod, firstItem.totalInstallments);
        
        // Se houver parcelas, use a primeira data de vencimento
        const firstInstallmentDate = firstItem.totalInstallments > 1 
          ? new Date(new Date(firstItem.date).getTime() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          : undefined;

        // Adicionar banco nas notas se for cartão de crédito
        let notes = `Importado de planilha. ${firstItem.paidInstallments}/${firstItem.totalInstallments} parcelas pagas.`;
        if (firstItem.bank && (movementType === 'cartao_credito' || firstItem.paymentMethod.toLowerCase().includes('crédito') || firstItem.paymentMethod.toLowerCase().includes('credito'))) {
          notes += `\n\nBanco: ${firstItem.bank}`;
        }

        // Se houver múltiplos itens, preparar para compra agrupada
        const purchaseItems = group.items.length > 1 ? group.items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          name: item.description,
          quantity: 1,
          unitPrice: item.value,
          total: item.value,
        })) : undefined;

        // Determinar se deve marcar como pago:
        // 1. Se for método de pagamento à vista (PIX, Débito, Crédito à Vista)
        // 2. Se não tem parcelas (à vista)
        // 3. Se todas as parcelas estão pagas (paidInstallments == totalInstallments)
        const allInstallmentsPaid = firstItem.totalInstallments === firstItem.paidInstallments;
        const isVista = firstItem.totalInstallments === 1;
        const shouldBePaid = shouldMarkAsPaid(movementType) || isVista || allInstallmentsPaid;

        return {
          type: firstItem.type,
          movementType,
          amount: group.totalValue,
          category: mapCategoryName(firstItem.category || '', firstItem.type),
          description: group.items.length > 1 
            ? `Compra agrupada (${group.items.length} itens)` 
            : firstItem.description,
          classification: firstItem.totalInstallments > 1 ? 'temporario' : 'nenhum' as 'fixo' | 'temporario' | 'nenhum',
          date: firstItem.date,
          priority: 'média' as const,
          totalInstallments: firstItem.totalInstallments > 1 ? firstItem.totalInstallments : undefined,
          firstInstallmentDate,
          notes,
          paidInstallments: firstItem.paidInstallments > 0 ? firstItem.paidInstallments : undefined,
          shouldMarkAsPaid: shouldBePaid,
          purchaseItems,
        };
      });

      // Importar todos os movimentos de uma vez
      addMultipleMovements(movementsToImport);

      const groupedCount = groupedData.length;
      const totalItems = validationResult.data.length;
      const message = groupedCount < totalItems 
        ? `✅ ${totalItems} itens importados e agrupados em ${groupedCount} movimentação(ões)!`
        : `✅ ${totalItems} movimentação(ões) importada(s) com sucesso!`;
      
      setSuccessMessage(message);
      setValidationResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Erro ao importar dados'],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.uploadSection}>
        <h3>📤 Importar Movimentações via Planilha</h3>

        <div className={styles.uploadArea}>
          <Upload size={32} />
          <p>Selecione um arquivo Excel ou CSV com as seguintes colunas:</p>
          <div className={styles.columnsList}>
            <ul>
              <li><strong>Data</strong> (ou Datas) - formatos aceitos:
                <ul style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <li>DD/MM/YYYY (ex: 15/09/2025)</li>
                  <li>DD-MMM (ex: 15-Set, 01-Jan) - assume ano atual</li>
                  <li>DD-MMM-YYYY (ex: 15-Set-2025)</li>
                  <li>DD/MMM/YYYY (ex: 15/Set/2025)</li>
                  <li>YYYY-MM-DD (ex: 2025-09-15)</li>
                </ul>
              </li>
              <li><strong>Descrição</strong></li>
              <li><strong>Tipo</strong> - entrada ou saida</li>
              <li><strong>Categoria</strong> (opcional)</li>
              <li><strong>Valor</strong></li>
              <li><strong>Forma de Pagamento</strong></li>
              <li><strong>Banco</strong> (opcional - para cartões de crédito)</li>
              <li><strong>Quantidade de Parcelas</strong> (ou Quantidades de Parcelas)</li>
              <li><strong>Valor por Parcela</strong></li>
              <li><strong>Parcelas Pagas</strong></li>
            </ul>
          </div>

          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className={styles.fileInput}
          />
          <label 
            className={styles.fileLabel} 
            htmlFor="file-input"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                if (fileInputRef.current) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  fileInputRef.current.files = dataTransfer.files;
                  const event = new Event('change', { bubbles: true });
                  fileInputRef.current.dispatchEvent(event);
                }
              }
            }}
          >
            📁 Clique para selecionar arquivo ou arraste aqui
          </label>
        </div>

        {successMessage && (
          <div className={styles.successMessage}>
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {validationResult && (
          <div className={`${styles.validationResult} ${validationResult.isValid ? styles.success : styles.error}`}>
            <div className={styles.resultHeader}>
              {validationResult.isValid ? (
                <>
                  <CheckCircle size={20} />
                  <span>{validationResult.data?.length || 0} registros validados com sucesso!</span>
                </>
              ) : (
                <>
                  <AlertCircle size={20} />
                  <span>Erros encontrados:</span>
                </>
              )}
            </div>

            {validationResult.isValid ? (
              <div className={styles.resultContent}>
                <p>Clique em "Importar" para adicionar as movimentações ao histórico.</p>
                <div className={styles.resultActions}>
                  <button
                    onClick={handleImport}
                    disabled={isProcessing}
                    className={styles.importBtn}
                  >
                    {isProcessing ? '⏳ Importando...' : '✅ Importar'}
                  </button>
                  <button
                    onClick={() => setValidationResult(null)}
                    disabled={isProcessing}
                    className={styles.cancelBtn}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.errorList}>
                {validationResult.errors.map((error, idx) => (
                  <p key={idx} className={styles.errorItem}>
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
