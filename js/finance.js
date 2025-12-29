/**
 * Finance Service
 * Gerencia lançamentos financeiros e controle de semanas
 */

const FINANCE_STORAGE_KEY = 'finance_transactions';
const CLOSED_WEEKS_KEY = 'finance_closed_weeks';
const AUTO_CLOSE_CONFIG_KEY = 'finance_auto_close_config';
const WEEKLY_LIMIT_KEY = 'finance_weekly_limit';
const NEXT_CLOSE_DATE_KEY = 'finance_next_close_date';
const CURRENT_WEEK_START_KEY = 'finance_current_week_start';
const WEEK_ID_MAPPING_KEY = 'finance_week_id_mapping'; // Mapeamento weekId -> dataInicio
const CURRENT_WEEK_ID_KEY = 'finance_current_week_id'; // ID único da semana atual

const FinanceService = {
  /**
   * Gera um ID único para uma semana
   * @returns {string} ID único gerado
   */
  generateWeekId() {
    return 'week_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Obtém o mapeamento de weekId para data de início
   * @returns {object} Objeto com weekId como chave e data de início (ISO string) como valor
   */
  getWeekIdMapping() {
    return StorageService.get(WEEK_ID_MAPPING_KEY, {});
  },

  /**
   * Define o mapeamento de weekId para data de início
   * @param {object} mapping - Objeto com weekId como chave e data de início como valor
   */
  setWeekIdMapping(mapping) {
    StorageService.set(WEEK_ID_MAPPING_KEY, mapping);
  },

  /**
   * Obtém ou cria um weekId para uma data de início
   * @param {Date} weekStartDate - Data de início da semana
   * @returns {string} ID único da semana
   */
  getOrCreateWeekId(weekStartDate) {
    const dateKey = weekStartDate.toISOString().split('T')[0]; // yyyy-mm-dd
    const mapping = this.getWeekIdMapping();
    
    // Procura se já existe um weekId para esta data
    for (const [weekId, date] of Object.entries(mapping)) {
      if (date === dateKey) {
        return weekId;
      }
    }
    
    // Se não existe, cria um novo
    const newWeekId = this.generateWeekId();
    mapping[newWeekId] = dateKey;
    this.setWeekIdMapping(mapping);
    
    return newWeekId;
  },

  /**
   * Obtém a data de início de uma semana baseado no weekId
   * @param {string} weekId - ID da semana
   * @returns {Date|null} Data de início da semana ou null se não encontrada
   */
  getWeekStartDateById(weekId) {
    const mapping = this.getWeekIdMapping();
    const dateString = mapping[weekId];
    if (!dateString) {
      return null;
    }
    return new Date(dateString + 'T00:00:00');
  },

  /**
   * Cria um novo lançamento financeiro
   * @param {string} description - Descrição do gasto
   * @param {number} amount - Valor do gasto
   * @param {string} dateString - Data no formato yyyy-mm-dd
   * @returns {object|null} Lançamento criado ou null em caso de erro
   */
  createTransaction(description, amount, dateString) {
    if (!description || !description.trim()) {
      throw new Error('Descrição é obrigatória');
    }

    if (!amount || amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!dateString) {
      throw new Error('Data é obrigatória');
    }

    const date = DatesService.parseDate(dateString);
    let weekId;

    // Verifica se a data está na semana atual
    const currentWeekStart = this.getCurrentWeekStartDate();
    const currentWeekEnd = this.getCurrentWeekEndDate();
    const currentWeekId = this.getCurrentWeekId();

    // Verifica se a semana atual está fechada
    if (this.isWeekClosed(currentWeekId)) {
      throw new Error('A semana atual está fechada. Não é possível adicionar lançamentos.');
    }

    // Calcula a data de início da semana padrão (domingo) para esta data
    const standardWeekStart = DatesService.getWeekStart(date);
    
    // Obtém ou cria o weekId para a semana padrão desta data
    const standardWeekId = this.getOrCreateWeekId(standardWeekStart);
    
    // Verifica se a data está no período da semana atual
    const isInCurrentWeekPeriod = DatesService.isDateInCurrentWeekPeriod(date, currentWeekStart, currentWeekEnd);
    
    // Verifica se o weekId padrão da data está fechado
    const isStandardWeekClosed = this.isWeekClosed(standardWeekId);
    
    // Verifica se a data é hoje ou futura
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    const isTodayOrFuture = dateToCheck >= today;

    // REGRA PRINCIPAL: Se a data é hoje ou futura E a semana atual não está fechada,
    // sempre usa a semana atual (independente do período calculado)
    // Isso garante que após fechar uma semana, novas transações vão para a nova semana
    if (isTodayOrFuture && !this.isWeekClosed(currentWeekId)) {
      weekId = currentWeekId;
    } else if (isInCurrentWeekPeriod) {
      // A data está no período da semana atual
      weekId = currentWeekId;
    } else if (isStandardWeekClosed) {
      // O weekId padrão está fechado → redireciona para semana atual
      weekId = currentWeekId;
    } else {
      // A data não está na semana atual e o weekId padrão não está fechado
      // Usa o weekId padrão da data
      weekId = standardWeekId;
    }

    const transaction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      description: description.trim(),
      amount: parseFloat(amount),
      date: date.toISOString(),
      weekId: weekId,
      createdAt: new Date().toISOString()
    };

    const transactions = this.getAllTransactions();
    transactions.push(transaction);
    StorageService.set(FINANCE_STORAGE_KEY, transactions);

    return transaction;
  },

  /**
   * Obtém todos os lançamentos
   * @returns {Array} Lista de lançamentos
   */
  getAllTransactions() {
    return StorageService.get(FINANCE_STORAGE_KEY, []);
  },

  /**
   * Obtém lançamentos de uma semana específica
   * @param {string} weekId - ID da semana
   * @returns {Array} Lista de lançamentos da semana
   */
  getTransactionsByWeek(weekId) {
    const transactions = this.getAllTransactions();
    // Para a semana atual, também verifica pelo período (caso haja transações antigas com weekId diferente)
    if (weekId === this.getCurrentWeekId()) {
      const currentWeekStart = this.getCurrentWeekStartDate();
      const currentWeekEnd = this.getCurrentWeekEndDate();
      
      return transactions.filter(t => {
        // PRIMEIRO: Se o weekId da transação corresponde ao weekId da semana atual,
        // sempre inclui (mesmo que o weekId padrão da data esteja fechado)
        // Isso garante que transações criadas na semana atual sejam sempre exibidas
        if (t.weekId === weekId) {
          // Verifica apenas se o weekId da transação não está fechado diretamente
          // (não verifica o weekId padrão da data, pois a transação foi criada com weekId customizado)
          if (this.isWeekClosed(t.weekId)) {
            return false;
          }
          return true;
        }
        
        // SEGUNDO: Para transações com weekId diferente, verifica se pertencem a semana fechada
        // Se sim, exclui
        if (this.isTransactionInClosedWeek(t)) {
          return false;
        }
        
        // TERCEIRO: Verifica se estão no período da semana atual
        const transactionDate = new Date(t.date);
        if (DatesService.isDateInCurrentWeekPeriod(transactionDate, currentWeekStart, currentWeekEnd)) {
          // Verifica novamente se a transação pertence a uma semana fechada
          if (this.isTransactionInClosedWeek(t)) {
            return false;
          }
          
          return true;
        }
        
        return false;
      });
    }
    return transactions.filter(t => t.weekId === weekId);
  },

  /**
   * Obtém a data do próximo fechamento
   * @returns {Date|null} Data do próximo fechamento ou null se não definida
   */
  getNextCloseDate() {
    const dateString = StorageService.get(NEXT_CLOSE_DATE_KEY, null);
    if (!dateString) {
      return null;
    }
    return new Date(dateString);
  },

  /**
   * Obtém a data do último fechamento (data de fim da última semana fechada)
   * Esta é a data após a qual começa a semana atual
   * @returns {Date|null} Data do último fechamento ou null se não houver
   */
  getLastCloseDate() {
    // Se não há próxima data de fechamento, não há último fechamento
    const nextCloseDate = this.getNextCloseDate();
    if (!nextCloseDate) {
      return null;
    }
    
    // A data de último fechamento é a data de próximo fechamento anterior
    // Para obter isso, precisamos verificar quando foi definida a próxima data de fechamento
    // Por enquanto, vamos usar uma abordagem: a última semana fechada mais recente
    
    const closedWeeks = this.getClosedWeeks();
    if (closedWeeks.length === 0) {
      return null;
    }
    
    // Ordena as semanas fechadas e pega a mais recente
    // Converte weekIds para datas e ordena por data
    const weeksWithDates = closedWeeks
      .map(weekId => {
        const weekStart = this.getWeekStartDateById(weekId);
        return { weekId, weekStart: weekStart || new Date(0) };
      })
      .filter(w => w.weekStart.getTime() > 0)
      .sort((a, b) => b.weekStart - a.weekStart);
    
    if (weeksWithDates.length === 0) {
      return null;
    }
    
    // A data de início da última semana fechada
    const lastWeekStart = weeksWithDates[0].weekStart;
    
    // A data de fim da última semana fechada é aproximadamente 7 dias depois
    // Mas na prática, quando uma semana é fechada, ela termina "agora"
    // Então vamos usar hoje como referência, mas retrocedendo da data de próximo fechamento
    // Se a próxima data de fechamento existe, o último fechamento foi quando essa data foi definida
    // Por simplicidade, vamos calcular: se próximo fechamento é dia X, último fechamento foi aproximadamente X-7 dias atrás
    // Mas isso não é preciso. Vamos usar a data de início da última semana fechada como referência
    // e considerar que a semana atual começa no dia após essa data
    
    // Retorna a data de início da última semana fechada
    // A semana atual começa no dia após essa data
    return lastWeekStart;
  },

  /**
   * Define a data do próximo fechamento
   * @param {Date} date - Data do próximo fechamento (deve corresponder ao dia configurado e ser futura)
   */
  setNextCloseDate(date) {
    const config = this.getAutoCloseConfig();
    const dayOfWeek = config.dayOfWeek || 0; // Padrão: domingo
    
    if (!DatesService.isDayOfWeek(date, dayOfWeek)) {
      const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      throw new Error(`A data do próximo fechamento deve ser ${days[dayOfWeek]}`);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToSet = new Date(date);
    dateToSet.setHours(0, 0, 0, 0);
    
    if (dateToSet <= today) {
      throw new Error('A data do próximo fechamento deve ser futura');
    }
    
    StorageService.set(NEXT_CLOSE_DATE_KEY, date.toISOString());
  },

  /**
   * Define a data de início da semana atual
   * @param {Date} date - Data de início da semana atual
   * @param {string} weekId - ID único da semana (opcional, será gerado se não fornecido)
   */
  setCurrentWeekStart(date, weekId = null) {
    const dateToSet = new Date(date);
    dateToSet.setHours(0, 0, 0, 0);
    StorageService.set(CURRENT_WEEK_START_KEY, dateToSet.toISOString());
    
    // Obtém ou cria o weekId para esta data
    const finalWeekId = weekId || this.getOrCreateWeekId(dateToSet);
    StorageService.set(CURRENT_WEEK_ID_KEY, finalWeekId);
  },

  /**
   * Obtém a data de início da semana atual
   * @returns {Date|null} Data de início da semana atual ou null se não definida
   */
  getCurrentWeekStart() {
    const dateString = StorageService.get(CURRENT_WEEK_START_KEY, null);
    if (!dateString) {
      return null;
    }
    return new Date(dateString);
  },

  /**
   * Obtém o ID único da semana atual
   * @returns {string} ID único da semana atual
   */
  getCurrentWeekId() {
    // Primeiro tenta obter o ID armazenado
    const storedWeekId = StorageService.get(CURRENT_WEEK_ID_KEY, null);
    if (storedWeekId) {
      // Verifica se o ID ainda é válido (existe no mapeamento)
      const weekStart = this.getWeekStartDateById(storedWeekId);
      if (weekStart) {
        const currentWeekStart = this.getCurrentWeekStartDate();
        // Se a data de início corresponde, retorna o ID armazenado
        if (weekStart.getTime() === currentWeekStart.getTime()) {
          return storedWeekId;
        }
      }
    }
    
    // Se não há ID armazenado ou é inválido, cria/obtém um novo baseado na data atual
    const weekStart = this.getCurrentWeekStartDate();
    const weekId = this.getOrCreateWeekId(weekStart);
    StorageService.set(CURRENT_WEEK_ID_KEY, weekId);
    return weekId;
  },

  /**
   * Obtém a data de início da semana atual (armazenada ou calculada)
   * @returns {Date} Data de início da semana atual
   */
  getCurrentWeekStartDate() {
    // Primeiro tenta usar a data armazenada
    const storedStart = this.getCurrentWeekStart();
    if (storedStart) {
      return storedStart;
    }

    // Se não há data armazenada, calcula baseado no próximo fechamento
    const nextCloseDate = this.getNextCloseDate();
    if (!nextCloseDate) {
      // Se não há próximo fechamento, usa início da semana padrão (domingo)
      return DatesService.getWeekStart(new Date());
    }

    // Calcula retroativamente: semana atual começa 7 dias antes do próximo fechamento
    const weekStart = new Date(nextCloseDate);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Não pode começar antes de hoje
    return weekStart > today ? weekStart : today;
  },

  /**
   * Obtém lançamentos da semana atual
   * Retorna vazio se a semana atual estiver fechada
   * @returns {Array} Lista de lançamentos da semana atual
   */
  getCurrentWeekTransactions() {
    const currentWeekId = this.getCurrentWeekId();
    
    // Se a semana atual está fechada, retorna vazio (semana zerada no dashboard)
    if (this.isWeekClosed(currentWeekId)) {
      return [];
    }
    
    // Obtém transações da semana atual, excluindo automaticamente as de semanas fechadas
    const transactions = this.getTransactionsByWeek(currentWeekId);
    
    // IMPORTANTE: Se uma transação tem o weekId correto da semana atual,
    // ela já foi incluída em getTransactionsByWeek e não deve ser filtrada novamente
    // Apenas filtra transações que podem ter sido incluídas por período mas pertencem a semanas fechadas
    return transactions.filter(t => {
      // Se o weekId da transação corresponde ao currentWeekId, sempre inclui
      // (já foi verificado em getTransactionsByWeek que não está fechado)
      if (t.weekId === currentWeekId) {
        return true;
      }
      
      // Para transações com weekId diferente, verifica se pertencem a semana fechada
      return !this.isTransactionInClosedWeek(t);
    });
  },

  /**
   * Obtém o período da semana atual em formato legível
   * @returns {string} Período formatado (ex: "01/12/2024 - 07/12/2024")
   */
  getCurrentWeekPeriod() {
    const weekStart = this.getCurrentWeekStartDate();
    // Usa a mesma lógica do histórico: fim da semana é sábado (6 dias depois do início)
    // Isso garante consistência entre semana atual e histórico
    const weekEnd = DatesService.getWeekEnd(weekStart);
    return DatesService.getCurrentWeekPeriod(weekStart, weekEnd);
  },

  /**
   * Obtém a data de fim da semana atual
   * @returns {Date} Data de fim da semana atual
   * Usa a próxima data de fechamento se disponível, senão calcula o fim da semana padrão
   */
  getCurrentWeekEndDate() {
    const nextCloseDate = this.getNextCloseDate();
    if (!nextCloseDate) {
      return DatesService.getWeekEnd(new Date());
    }
    
    // Usa a próxima data de fechamento como fim da semana atual
    // Mas garante que não seja antes do início da semana atual
    const weekStart = this.getCurrentWeekStartDate();
    const nextClose = new Date(nextCloseDate);
    nextClose.setHours(23, 59, 59, 999);
    
    // Se a próxima data de fechamento for antes do início da semana atual,
    // usa o fim da semana padrão calculado a partir do início
    if (nextClose < weekStart) {
      return DatesService.getWeekEnd(weekStart);
    }
    
    return nextClose;
  },

  /**
   * Calcula o total de uma lista de lançamentos
   * @param {Array} transactions - Lista de lançamentos
   * @returns {number} Total calculado
   */
  calculateTotal(transactions) {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  },

  /**
   * Calcula o total da semana atual
   * Retorna 0 se a semana atual estiver fechada
   * @returns {number} Total da semana atual
   */
  getCurrentWeekTotal() {
    const transactions = this.getCurrentWeekTransactions();
    return this.calculateTotal(transactions);
  },

  /**
   * Calcula o total do mês atual
   * @returns {number} Total do mês atual
   */
  getCurrentMonthTotal() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const transactions = this.getAllTransactions();
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    return this.calculateTotal(monthTransactions);
  },

  /**
   * Remove um lançamento
   * @param {string} transactionId - ID do lançamento
   * @returns {boolean} True se removido com sucesso
   */
  removeTransaction(transactionId) {
    const transactions = this.getAllTransactions();
    const filtered = transactions.filter(t => t.id !== transactionId);
    StorageService.set(FINANCE_STORAGE_KEY, filtered);
    return filtered.length < transactions.length;
  },

  /**
   * Verifica se uma semana está fechada
   * @param {string} weekId - ID da semana
   * @returns {boolean}
   */
  isWeekClosed(weekId) {
    const closedWeeks = this.getClosedWeeks();
    return closedWeeks.includes(weekId);
  },

  /**
   * Verifica se uma transação pertence a uma semana fechada
   * Considera tanto o weekId da transação quanto o weekId padrão calculado da data
   * @param {object} transaction - Transação a verificar
   * @returns {boolean} True se a transação pertence a uma semana fechada
   */
  isTransactionInClosedWeek(transaction) {
    // Verifica se o weekId da transação está fechado
    if (this.isWeekClosed(transaction.weekId)) {
      return true;
    }
    
    // Verifica se o weekId padrão calculado da data da transação está fechado
    // Isso é importante porque quando uma semana é fechada manualmente,
    // o targetWeekId pode ser diferente do weekId das transações
    const transactionDate = new Date(transaction.date);
    const standardWeekStart = DatesService.getWeekStart(transactionDate);
    const standardWeekId = this.getOrCreateWeekId(standardWeekStart);
    if (this.isWeekClosed(standardWeekId)) {
      return true;
    }
    
    return false;
  },

  /**
   * Obtém lista de semanas fechadas
   * @returns {Array} Lista de IDs de semanas fechadas
   */
  getClosedWeeks() {
    return StorageService.get(CLOSED_WEEKS_KEY, []);
  },

  /**
   * Fecha uma semana (marca como fechada)
   * @param {string} weekId - ID da semana (opcional, usa semana atual se não informado)
   * @param {Date} nextCloseDate - Data do próximo fechamento (opcional, calcula automaticamente se não informado)
   * @param {boolean} isManual - Se é fechamento manual (padrão: false)
   * @returns {boolean} True se fechada com sucesso
   */
  closeWeek(weekId = null, nextCloseDate = null, isManual = false) {
    // Determina qual semana fechar
    let targetWeekId;
    if (isManual && !weekId) {
      // Para fechamento manual, sempre fecha a semana atual
      // Isso garante que mesmo com semanas customizadas, sempre fecha a semana correta
      targetWeekId = this.getCurrentWeekId();
      
      // Verifica se a semana atual já está fechada
      if (this.isWeekClosed(targetWeekId)) {
        throw new Error('A semana atual já está fechada.');
      }
    } else {
      // Para fechamento automático ou quando weekId é especificado
      targetWeekId = weekId || this.getCurrentWeekId();
      
      if (this.isWeekClosed(targetWeekId)) {
        return false; // Semana já está fechada
      }
    }

    const closedWeeks = this.getClosedWeeks();
    
    // Garante que o targetWeekId seja uma string para comparação consistente
    const weekIdToClose = String(targetWeekId);
    
    // Verifica novamente se já está fechada (pode ter mudado entre a verificação anterior e agora)
    if (closedWeeks.includes(weekIdToClose)) {
      if (isManual) {
        throw new Error('A semana atual já está fechada.');
      }
      return false;
    }
    
    closedWeeks.push(weekIdToClose);
    StorageService.set(CLOSED_WEEKS_KEY, closedWeeks);
    
    // Verifica se foi realmente salva
    const savedWeeks = this.getClosedWeeks();
    if (!savedWeeks.includes(weekIdToClose)) {
      throw new Error('Erro ao salvar o fechamento da semana. Tente novamente.');
    }

    const now = new Date();
    const closeDate = new Date(now);
    closeDate.setHours(0, 0, 0, 0);

    const config = this.getAutoCloseConfig();
    const dayOfWeek = config.dayOfWeek || 0; // Padrão: domingo

    // Define a próxima data de fechamento e início da nova semana
    if (isManual) {
      // Fechamento manual
      // A nova semana começa no dia do fechamento
      const currentNextCloseDate = this.getNextCloseDate();
      
      // Calcula o próximo dia da semana configurado para o próximo fechamento
      const newNextDay = DatesService.getNextDayOfWeekAfter(now, dayOfWeek);
      
      // Define a nova semana para começar hoje (dia do fechamento)
      let newWeekStartDate = new Date(closeDate);
      newWeekStartDate.setHours(0, 0, 0, 0);
      
      // Gera um novo ID único para a nova semana
      // Como usamos IDs únicos aleatórios, não precisamos verificar se é igual ao targetWeekId
      const newWeekId = this.generateWeekId();
      
      // Atualiza o mapeamento com o novo weekId
      const mapping = this.getWeekIdMapping();
      mapping[newWeekId] = newWeekStartDate.toISOString().split('T')[0];
      this.setWeekIdMapping(mapping);
      
      if (currentNextCloseDate) {
        const nextClose = new Date(currentNextCloseDate);
        nextClose.setHours(0, 0, 0, 0);
        
        // Se está fechando antes do dia de próximo fechamento automático
        if (closeDate < nextClose) {
          // Mantém a data de próximo fechamento
          this.setCurrentWeekStart(newWeekStartDate, newWeekId);
        } else {
          // Se está fechando no dia do próximo fechamento ou depois
          // Atualiza a próxima data de fechamento
          this.setNextCloseDate(newNextDay);
          this.setCurrentWeekStart(newWeekStartDate, newWeekId);
        }
      } else {
        // Não há próxima data de fechamento configurada
        this.setNextCloseDate(newNextDay);
        this.setCurrentWeekStart(newWeekStartDate, newWeekId);
      }
      
      // Verificação final: garante que a nova semana não está fechada
      const finalWeekId = this.getCurrentWeekId();
      if (this.isWeekClosed(finalWeekId)) {
        // Se por algum motivo a nova semana estiver fechada, gera um novo ID
        const adjustedDate = new Date(newWeekStartDate);
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        const adjustedWeekId = this.generateWeekId();
        this.setCurrentWeekStart(adjustedDate, adjustedWeekId);
      }
    } else {
      // Fechamento automático (já tratado em checkAndAutoCloseWeek)
      // Se nextCloseDate foi informado, usa ele
      if (nextCloseDate) {
        this.setNextCloseDate(nextCloseDate);
      } else {
        const nextDay = DatesService.getNextDayOfWeekAfter(now, dayOfWeek);
        this.setNextCloseDate(nextDay);
      }
      // O início da nova semana já foi definido em checkAndAutoCloseWeek
    }

    return true;
  },

  /**
   * Verifica se a semana atual está fechada
   * @returns {boolean}
   */
  isCurrentWeekClosed() {
    const currentWeekId = this.getCurrentWeekId();
    return this.isWeekClosed(currentWeekId);
  },

  /**
   * Formata valor monetário
   * @param {number} value - Valor a formatar
   * @returns {string} Valor formatado (R$ X.XXX,XX)
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  /**
   * Obtém configuração de fechamento automático
   * @returns {object} Configuração {enabled: boolean, dayOfWeek: number, hour: number}
   */
  getAutoCloseConfig() {
    return StorageService.get(AUTO_CLOSE_CONFIG_KEY, {
      enabled: true,
      dayOfWeek: 0, // 0 = Domingo
      hour: 12 // 12h
    });
  },

  /**
   * Define configuração de fechamento automático
   * @param {object} config - Configuração {enabled: boolean, dayOfWeek: number, hour: number}
   */
  setAutoCloseConfig(config) {
    StorageService.set(AUTO_CLOSE_CONFIG_KEY, config);
  },

  /**
   * Verifica e executa fechamento automático de semana
   * @returns {boolean} True se alguma semana foi fechada
   */
  checkAndAutoCloseWeek() {
    const config = this.getAutoCloseConfig();
    if (!config.enabled) {
      return false;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();

    // Verifica se é o dia e hora configurados para fechamento
    if (currentDay === config.dayOfWeek && currentHour >= config.hour) {
      // Obtém a semana atual que deve ser fechada
      const currentWeekId = this.getCurrentWeekId();

      // Fecha a semana atual se ainda não estiver fechada
      if (!this.isWeekClosed(currentWeekId)) {
        // No fechamento automático, a nova semana atual começa no dia do fechamento
        // (porque o fechamento ocorre ao meio dia)
        const closeDate = new Date(now);
        closeDate.setHours(0, 0, 0, 0);
        
        // Define o próximo fechamento como próximo dia da semana configurado
        const nextDay = DatesService.getNextDayOfWeekAfter(now, config.dayOfWeek);
        
        // Gera um novo ID único para a nova semana
        const newWeekId = this.generateWeekId();
        
        // Fecha a semana e atualiza o início da nova semana atual
        const closed = this.closeWeek(currentWeekId, nextDay);
        if (closed) {
          // Define o início da nova semana atual como o dia do fechamento
          this.setCurrentWeekStart(closeDate, newWeekId);
        }
        return closed;
      }
    }

    return false;
  },

  /**
   * Obtém histórico de semanas com informações
   * @param {number} limit - Número máximo de semanas a retornar (padrão: 10)
   * @returns {Array} Lista de semanas com informações
   */
  getWeeksHistory(limit = 10) {
    const closedWeeks = this.getClosedWeeks();
    const allTransactions = this.getAllTransactions();
    
    // Obtém todas as semanas únicas (fechadas e não fechadas)
    const allWeekIds = new Set();
    
    // Adiciona semanas fechadas
    closedWeeks.forEach(weekId => allWeekIds.add(weekId));
    
    // Adiciona semanas com transações
    allTransactions.forEach(t => allWeekIds.add(t.weekId));
    
    // Converte para array e ordena (mais recente primeiro)
    const weeks = Array.from(allWeekIds)
      .map(weekId => {
        const transactions = this.getTransactionsByWeek(weekId);
        const total = this.calculateTotal(transactions);
        const isClosed = this.isWeekClosed(weekId);
        const weekStart = this.getWeekStartDateById(weekId);
        
        // Se não encontrou a data, tenta usar a primeira transação da semana
        let period = 'Data não disponível';
        if (weekStart) {
          const weekEnd = DatesService.getWeekEnd(weekStart);
          period = DatesService.getCurrentWeekPeriod(weekStart, weekEnd);
        } else if (transactions.length > 0) {
          // Fallback: usa a data da primeira transação
          const firstDate = new Date(transactions[0].date);
          const weekStartFallback = DatesService.getWeekStart(firstDate);
          const weekEndFallback = DatesService.getWeekEnd(weekStartFallback);
          period = DatesService.getCurrentWeekPeriod(weekStartFallback, weekEndFallback);
        }
        
        return {
          weekId,
          period,
          total,
          transactionCount: transactions.length,
          isClosed,
          weekStart: weekStart || new Date(0)
        };
      })
      .filter(w => w.weekStart.getTime() > 0) // Remove semanas sem data válida
      .sort((a, b) => b.weekStart - a.weekStart)
      .slice(0, limit);
    
    return weeks;
  },

  /**
   * Verifica se uma data está em uma semana fechada
   * @param {Date} date - Data a verificar
   * @returns {boolean}
   */
  isDateInClosedWeek(date) {
    const weekStart = DatesService.getWeekStart(date);
    const weekId = this.getOrCreateWeekId(weekStart);
    return this.isWeekClosed(weekId);
  },

  /**
   * Obtém o limite semanal configurado
   * @returns {number|null} Limite semanal ou null se não configurado
   */
  getWeeklyLimit() {
    const limit = StorageService.get(WEEKLY_LIMIT_KEY, null);
    return limit !== null ? parseFloat(limit) : null;
  },

  /**
   * Define o limite semanal
   * @param {number} limit - Valor do limite semanal
   */
  setWeeklyLimit(limit) {
    if (limit !== null && (isNaN(limit) || limit <= 0)) {
      throw new Error('Limite deve ser um número maior que zero');
    }
    StorageService.set(WEEKLY_LIMIT_KEY, limit);
  },

  /**
   * Verifica se o total da semana atual ultrapassou o limite
   * @returns {boolean} True se ultrapassou o limite
   */
  isWeeklyLimitExceeded() {
    const limit = this.getWeeklyLimit();
    if (limit === null) {
      return false;
    }
    const currentTotal = this.getCurrentWeekTotal();
    return currentTotal > limit;
  },

  /**
   * Obtém o percentual de uso do limite semanal
   * @returns {number|null} Percentual (0-100) ou null se não houver limite
   */
  getWeeklyLimitUsage() {
    const limit = this.getWeeklyLimit();
    if (limit === null) {
      return null;
    }
    const currentTotal = this.getCurrentWeekTotal();
    return Math.min((currentTotal / limit) * 100, 100);
  }
};

