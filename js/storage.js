/**
 * Storage Service
 * Gerencia persistência de dados usando o DataProvider
 * Atualmente usa localStorage, mas pode ser facilmente trocado para Supabase
 * através da configuração em config.js
 * 
 * Nota: Por enquanto mantém interface síncrona para compatibilidade.
 * No futuro, quando Supabase for implementado, pode ser necessário migrar para async/await.
 */

const StorageService = {
  /**
   * Salva dados usando o provider configurado
   * @param {string} key - Chave para armazenar
   * @param {any} value - Valor a ser armazenado
   * @returns {boolean}
   */
  set(key, value) {
    // Por enquanto usa LocalStorageProvider diretamente (síncrono)
    // No futuro, quando Supabase for implementado, pode ser necessário
    // converter para async/await e usar DataProvider.set(key, value)
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return false;
    }
  },

  /**
   * Recupera dados usando o provider configurado
   * @param {string} key - Chave para recuperar
   * @param {any} defaultValue - Valor padrão se não existir
   * @returns {any}
   */
  get(key, defaultValue = null) {
    // Por enquanto usa LocalStorageProvider diretamente (síncrono)
    // No futuro, quando Supabase for implementado, pode ser necessário
    // converter para async/await e usar DataProvider.get(key, defaultValue)
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error('Erro ao ler dados:', error);
      return defaultValue;
    }
  },

  /**
   * Remove item usando o provider configurado
   * @param {string} key - Chave para remover
   * @returns {boolean}
   */
  remove(key) {
    // Por enquanto usa LocalStorageProvider diretamente (síncrono)
    // No futuro, quando Supabase for implementado, pode ser necessário
    // converter para async/await e usar DataProvider.remove(key)
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover dados:', error);
      return false;
    }
  },

  /**
   * Limpa dados usando o provider configurado
   * @returns {boolean}
   */
  clear() {
    // Por enquanto usa LocalStorageProvider diretamente (síncrono)
    // No futuro, quando Supabase for implementado, pode ser necessário
    // converter para async/await e usar DataProvider.clear()
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      return false;
    }
  }
};

