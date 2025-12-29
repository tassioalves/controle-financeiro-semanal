/**
 * Auth Service
 * Gerencia autenticação e sessão do usuário
 */

const AUTH_STORAGE_KEY = 'auth_session';
const CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const AuthService = {
  /**
   * Valida credenciais do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {boolean}
   */
  validateCredentials(username, password) {
    return username === CREDENTIALS.username && password === CREDENTIALS.password;
  },

  /**
   * Realiza login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {boolean}
   */
  login(username, password) {
    if (this.validateCredentials(username, password)) {
      const session = {
        username,
        loggedIn: true,
        loginTime: new Date().toISOString()
      };
      StorageService.set(AUTH_STORAGE_KEY, session);
      return true;
    }
    return false;
  },

  /**
   * Realiza logout do usuário
   */
  logout() {
    StorageService.remove(AUTH_STORAGE_KEY);
  },

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    const session = StorageService.get(AUTH_STORAGE_KEY);
    return session && session.loggedIn === true;
  },

  /**
   * Obtém informações da sessão atual
   * @returns {object|null}
   */
  getSession() {
    if (this.isAuthenticated()) {
      return StorageService.get(AUTH_STORAGE_KEY);
    }
    return null;
  }
};

