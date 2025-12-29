/**
 * Dates Service
 * Gerencia cálculos de datas e semanas
 */

const DatesService = {
  /**
   * Obtém o início da semana (domingo) para uma data
   * @param {Date} date - Data de referência
   * @returns {Date} Data do início da semana (domingo)
   */
  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Diferença até domingo
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  /**
   * Obtém o fim da semana (sábado) para uma data
   * @param {Date} date - Data de referência
   * @returns {Date} Data do fim da semana (sábado)
   */
  getWeekEnd(date = new Date()) {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  },

  /**
   * Obtém o identificador único da semana (timestamp do início)
   * @param {Date} date - Data de referência
   * @returns {string} ID da semana (timestamp)
   */
  getWeekId(date = new Date()) {
    return this.getWeekStart(date).getTime().toString();
  },

  /**
   * Formata data para exibição
   * @param {Date} date - Data a ser formatada
   * @returns {string} Data formatada (dd/mm/yyyy)
   */
  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Formata data para input type="date" (yyyy-mm-dd)
   * @param {Date} date - Data a ser formatada
   * @returns {string} Data formatada (yyyy-mm-dd)
   */
  formatDateForInput(date = new Date()) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Converte string de data (yyyy-mm-dd) para Date
   * @param {string} dateString - String de data
   * @returns {Date} Objeto Date
   */
  parseDate(dateString) {
    return new Date(dateString + 'T00:00:00');
  },

  /**
   * Verifica se uma data está dentro de uma semana
   * @param {Date} date - Data a verificar
   * @param {string} weekId - ID da semana
   * @returns {boolean}
   */
  isDateInWeek(date, weekId) {
    const weekStart = new Date(parseInt(weekId));
    const weekEnd = this.getWeekEnd(weekStart);
    return date >= weekStart && date <= weekEnd;
  },

  /**
   * Verifica se uma data está dentro do período da semana atual
   * @param {Date} date - Data a verificar
   * @param {Date} weekStart - Data de início da semana atual
   * @param {Date} weekEnd - Data de fim da semana atual
   * @returns {boolean}
   */
  isDateInCurrentWeekPeriod(date, weekStart, weekEnd) {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(weekEnd);
    end.setHours(23, 59, 59, 999);
    return dateToCheck >= start && dateToCheck <= end;
  },

  /**
   * Obtém o período da semana em formato legível
   * @param {string} weekId - ID da semana
   * @returns {string} Período formatado (ex: "01/12/2024 - 07/12/2024")
   */
  getWeekPeriod(weekId) {
    const weekStart = new Date(parseInt(weekId));
    const weekEnd = this.getWeekEnd(weekStart);
    return `${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;
  },

  /**
   * Verifica se uma data é domingo
   * @param {Date} date - Data a verificar
   * @returns {boolean} True se for domingo
   */
  isSunday(date) {
    return date.getDay() === 0;
  },

  /**
   * Encontra o próximo domingo a partir de uma data
   * Se a data já for domingo, retorna a própria data
   * @param {Date} date - Data de referência
   * @returns {Date} Próximo domingo
   */
  getNextSunday(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 0 : 7 - day; // Se já é domingo, não muda
    d.setDate(d.getDate() + diff);
    d.setHours(12, 0, 0, 0); // Meio dia
    return d;
  },

  /**
   * Encontra o próximo domingo após uma data
   * Sempre retorna um domingo futuro (nunca a mesma data, mesmo que seja domingo)
   * @param {Date} date - Data de referência
   * @returns {Date} Próximo domingo futuro
   */
  getNextSundayAfter(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 7 : 7 - day; // Sempre avança pelo menos 7 dias se for domingo
    d.setDate(d.getDate() + diff);
    d.setHours(12, 0, 0, 0); // Meio dia
    return d;
  },

  /**
   * Verifica se uma data corresponde a um dia da semana específico
   * @param {Date} date - Data a verificar
   * @param {number} dayOfWeek - Dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
   * @returns {boolean} True se corresponder ao dia
   */
  isDayOfWeek(date, dayOfWeek) {
    return date.getDay() === dayOfWeek;
  },

  /**
   * Encontra o próximo dia da semana após uma data
   * @param {Date} date - Data de referência
   * @param {number} dayOfWeek - Dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
   * @returns {Date} Próximo dia da semana futuro
   */
  getNextDayOfWeekAfter(date, dayOfWeek) {
    const d = new Date(date);
    const currentDay = d.getDay();
    let diff = dayOfWeek - currentDay;
    
    // Se o dia já passou ou é hoje, avança para a próxima semana
    if (diff <= 0) {
      diff += 7;
    }
    
    d.setDate(d.getDate() + diff);
    d.setHours(12, 0, 0, 0);
    return d;
  },

  /**
   * Calcula o início da semana atual baseado na data de próximo fechamento
   * A semana atual começa 7 dias após o início da última semana fechada
   * @param {Date} nextCloseDate - Data do próximo fechamento
   * @param {Date} lastCloseDate - Data de início da última semana fechada (opcional)
   * @returns {Date} Data de início da semana atual
   */
  getCurrentWeekStart(nextCloseDate, lastCloseDate = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!nextCloseDate) {
      // Se não há próxima data de fechamento, usa início da semana padrão (domingo)
      return this.getWeekStart(today);
    }
    
    const nextClose = new Date(nextCloseDate);
    nextClose.setHours(0, 0, 0, 0);
    
    // Se há uma data de último fechamento (início da última semana fechada)
    if (lastCloseDate) {
      const lastWeekStart = new Date(lastCloseDate);
      lastWeekStart.setHours(0, 0, 0, 0);
      
      // A semana atual começa 7 dias após o início da última semana fechada
      // Exemplo: se última semana começou em 22/12/2025, a atual começa em 29/12/2025
      const weekStart = new Date(lastWeekStart);
      weekStart.setDate(weekStart.getDate() + 7);
      weekStart.setHours(0, 0, 0, 0);
      
      // A semana atual não pode começar antes de hoje
      // Mas também não pode começar depois ou igual ao próximo fechamento
      if (weekStart >= nextClose) {
        // Se houver inconsistência (weekStart >= nextClose), calcula retroativamente
        // A semana atual deve começar 7 dias antes do próximo fechamento
        const calculatedStart = new Date(nextClose);
        calculatedStart.setDate(calculatedStart.getDate() - 7);
        calculatedStart.setHours(0, 0, 0, 0);
        
        // Usa o maior entre o cálculo correto e hoje
        return calculatedStart > today ? calculatedStart : today;
      }
      
      // Usa o maior entre o cálculo correto e hoje
      return weekStart > today ? weekStart : today;
    }
    
    // Se não há último fechamento, calcula a partir da data de próximo fechamento
    // A semana atual começa 7 dias antes do próximo fechamento
    const weekStart = new Date(nextClose);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    
    // Mas não pode começar antes de hoje
    return weekStart > today ? weekStart : today;
  },

  /**
   * Calcula o fim da semana atual baseado na data de próximo fechamento
   * @param {Date} nextCloseDate - Data do próximo fechamento
   * @returns {Date} Data de fim da semana atual
   */
  getCurrentWeekEnd(nextCloseDate) {
    if (!nextCloseDate) {
      return this.getWeekEnd(new Date());
    }
    
    const nextClose = new Date(nextCloseDate);
    nextClose.setHours(23, 59, 59, 999);
    return nextClose;
  },

  /**
   * Obtém o período da semana atual em formato legível
   * @param {Date} weekStart - Data de início da semana
   * @param {Date} weekEnd - Data de fim da semana
   * @returns {string} Período formatado (ex: "01/12/2024 - 07/12/2024")
   */
  getCurrentWeekPeriod(weekStart, weekEnd) {
    return `${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;
  }
};

