/**
 * Data Provider
 * Abstração para provedores de dados (localStorage ou Supabase)
 * Permite trocar facilmente entre diferentes fontes de dados
 */

/**
 * Provider LocalStorage
 * Implementação usando localStorage do navegador
 */
const LocalStorageProvider = {
  /**
   * Salva dados no localStorage
   * @param {string} key - Chave para armazenar
   * @param {any} value - Valor a ser armazenado
   * @returns {Promise<boolean>}
   */
  async set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  },

  /**
   * Recupera dados do localStorage
   * @param {string} key - Chave para recuperar
   * @param {any} defaultValue - Valor padrão se não existir
   * @returns {Promise<any>}
   */
  async get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error('Erro ao ler do localStorage:', error);
      return defaultValue;
    }
  },

  /**
   * Remove item do localStorage
   * @param {string} key - Chave para remover
   * @returns {Promise<boolean>}
   */
  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
      return false;
    }
  },

  /**
   * Limpa todo o localStorage
   * @returns {Promise<boolean>}
   */
  async clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return false;
    }
  }
};

/**
 * Provider Supabase (placeholder para implementação futura)
 * 
 * Para implementar:
 * 1. Instalar @supabase/supabase-js: npm install @supabase/supabase-js
 * 2. Criar cliente Supabase usando AppConfig.SUPABASE.url e AppConfig.SUPABASE.anonKey
 * 3. Implementar os métodos set, get, remove e clear usando as operações do Supabase
 * 4. Mapear as chaves do storage para as tabelas definidas em AppConfig.SUPABASE.tables
 * 
 * Exemplo de estrutura:
 * 
 * const SupabaseProvider = {
 *   client: null,
 *   
 *   async init() {
 *     const { createClient } = await import('@supabase/supabase-js');
 *     this.client = createClient(AppConfig.SUPABASE.url, AppConfig.SUPABASE.anonKey);
 *   },
 *   
 *   async set(key, value) {
 *     // Implementar salvamento no Supabase
 *   },
 *   
 *   async get(key, defaultValue) {
 *     // Implementar leitura do Supabase
 *   },
 *   
 *   async remove(key) {
 *     // Implementar remoção no Supabase
 *   },
 *   
 *   async clear() {
 *     // Implementar limpeza no Supabase
 *   }
 * };
 */
const SupabaseProvider = {
  async set(key, value) {
    console.warn('SupabaseProvider não implementado. Usando LocalStorageProvider.');
    return LocalStorageProvider.set(key, value);
  },

  async get(key, defaultValue) {
    console.warn('SupabaseProvider não implementado. Usando LocalStorageProvider.');
    return LocalStorageProvider.get(key, defaultValue);
  },

  async remove(key) {
    console.warn('SupabaseProvider não implementado. Usando LocalStorageProvider.');
    return LocalStorageProvider.remove(key);
  },

  async clear() {
    console.warn('SupabaseProvider não implementado. Usando LocalStorageProvider.');
    return LocalStorageProvider.clear();
  }
};

/**
 * DataProvider Factory
 * Retorna o provider correto baseado na configuração
 */
const DataProvider = {
  /**
   * Obtém o provider ativo
   * @returns {object} Provider (LocalStorageProvider ou SupabaseProvider)
   */
  getProvider() {
    // Verifica se AppConfig está disponível e se está configurado para usar Supabase
    if (typeof AppConfig !== 'undefined' && AppConfig.isUsingSupabase()) {
      return SupabaseProvider;
    }
    return LocalStorageProvider;
  },

  /**
   * Salva dados usando o provider ativo
   * @param {string} key - Chave para armazenar
   * @param {any} value - Valor a ser armazenado
   * @returns {Promise<boolean>}
   */
  async set(key, value) {
    const provider = this.getProvider();
    return provider.set(key, value);
  },

  /**
   * Recupera dados usando o provider ativo
   * @param {string} key - Chave para recuperar
   * @param {any} defaultValue - Valor padrão se não existir
   * @returns {Promise<any>}
   */
  async get(key, defaultValue = null) {
    const provider = this.getProvider();
    return provider.get(key, defaultValue);
  },

  /**
   * Remove item usando o provider ativo
   * @param {string} key - Chave para remover
   * @returns {Promise<boolean>}
   */
  async remove(key) {
    const provider = this.getProvider();
    return provider.remove(key);
  },

  /**
   * Limpa dados usando o provider ativo
   * @returns {Promise<boolean>}
   */
  async clear() {
    const provider = this.getProvider();
    return provider.clear();
  }
};

