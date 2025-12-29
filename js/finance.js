/**
 * Finance Service
 * Gerencia lançamentos financeiros e controle de semanas
 */

const FINANCE_STORAGE_KEY = 'finance_transactions';
const CLOSED_WEEKS_KEY = 'finance_closed_weeks';
const AUTO_CLOSE_CONFIG_KEY = 'finance_auto_close_config';
const WEEKLY_LIMIT_KEY = 'finance_weekly_limit';

const FinanceService = {
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
    let weekId = DatesService.getWeekId(date);

    // Se a semana da data está fechada, usar a próxima semana
    if (this.isWeekClosed(weekId)) {
      // Avança para a próxima semana
      const nextWeekStart = new Date(parseInt(weekId));
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      weekId = DatesService.getWeekId(nextWeekStart);
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
    return transactions.filter(t => t.weekId === weekId);
  },

  /**
   * Obtém lançamentos da semana atual
   * @returns {Array} Lista de lançamentos da semana atual
   */
  getCurrentWeekTransactions() {
    const currentWeekId = DatesService.getWeekId();
    return this.getTransactionsByWeek(currentWeekId);
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
   * Obtém lista de semanas fechadas
   * @returns {Array} Lista de IDs de semanas fechadas
   */
  getClosedWeeks() {
    return StorageService.get(CLOSED_WEEKS_KEY, []);
  },

  /**
   * Fecha uma semana (marca como fechada)
   * @param {string} weekId - ID da semana (opcional, usa semana atual se não informado)
   * @returns {boolean} True se fechada com sucesso
   */
  closeWeek(weekId = null) {
    const targetWeekId = weekId || DatesService.getWeekId();
    
    if (this.isWeekClosed(targetWeekId)) {
      return false; // Semana já está fechada
    }

    const closedWeeks = this.getClosedWeeks();
    closedWeeks.push(targetWeekId);
    StorageService.set(CLOSED_WEEKS_KEY, closedWeeks);
    return true;
  },

  /**
   * Verifica se a semana atual está fechada
   * @returns {boolean}
   */
  isCurrentWeekClosed() {
    const currentWeekId = DatesService.getWeekId();
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
      // Obtém a semana anterior (que deve ser fechada)
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekId = DatesService.getWeekId(lastWeekStart);

      // Fecha a semana anterior se ainda não estiver fechada
      if (!this.isWeekClosed(lastWeekId)) {
        return this.closeWeek(lastWeekId);
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
        
        return {
          weekId,
          period: DatesService.getWeekPeriod(weekId),
          total,
          transactionCount: transactions.length,
          isClosed,
          weekStart: new Date(parseInt(weekId))
        };
      })
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
    const weekId = DatesService.getWeekId(date);
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

