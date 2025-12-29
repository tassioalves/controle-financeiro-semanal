/**
 * Config Service
 * Gerencia configurações da aplicação e provedores de dados
 */

const AppConfig = {
  /**
   * Tipo de provider de dados
   * Valores possíveis: 'localStorage' | 'supabase'
   */
  DATA_PROVIDER: 'localStorage',

  /**
   * Configurações do Supabase (será usado quando DATA_PROVIDER = 'supabase')
   * Para habilitar o Supabase, defina:
   * - DATA_PROVIDER: 'supabase'
   * - Configure as credenciais abaixo
   */
  SUPABASE: {
    url: '', // URL do projeto Supabase
    anonKey: '', // Chave pública do Supabase
    // Nomes das tabelas no Supabase
    tables: {
      transactions: 'transactions',
      closedWeeks: 'closed_weeks',
      settings: 'settings'
    }
  },

  /**
   * Verifica se está usando Supabase
   * @returns {boolean}
   */
  isUsingSupabase() {
    return this.DATA_PROVIDER === 'supabase';
  },

  /**
   * Verifica se está usando localStorage
   * @returns {boolean}
   */
  isUsingLocalStorage() {
    return this.DATA_PROVIDER === 'localStorage';
  }
};

