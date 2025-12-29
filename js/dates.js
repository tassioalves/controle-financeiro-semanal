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
   * Obtém o período da semana em formato legível
   * @param {string} weekId - ID da semana
   * @returns {string} Período formatado (ex: "01/12/2024 - 07/12/2024")
   */
  getWeekPeriod(weekId) {
    const weekStart = new Date(parseInt(weekId));
    const weekEnd = this.getWeekEnd(weekStart);
    return `${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;
  }
};

