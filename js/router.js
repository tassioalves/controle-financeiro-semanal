/**
 * Router Service
 * Gerencia navegação e proteção de rotas
 */

const Router = {
  currentPage: null,

  /**
   * Cache de páginas carregadas
   */
  pageCache: {},

  /**
   * Carrega uma página HTML de arquivo
   * @param {string} pagePath - Nome da página (login, dashboard, admin) ou caminho completo
   * @returns {Promise<string>}
   */
  async loadPage(pagePath) {
    // Mapeia nomes de páginas para caminhos de arquivos
    const pageMap = {
      'login': 'pages/login.html',
      'dashboard': 'pages/dashboard.html',
      'admin': 'pages/admin.html',
      'pages/login.html': 'pages/login.html',
      'pages/dashboard.html': 'pages/dashboard.html',
      'pages/admin.html': 'pages/admin.html'
    };

    const filePath = pageMap[pagePath] || pagePath;

    // Verifica cache primeiro
    if (this.pageCache[filePath]) {
      return this.pageCache[filePath];
    }

    try {
      // Usa XMLHttpRequest para carregar arquivos HTML
      const html = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              const content = xhr.responseText;
              if (!content || content.trim().length === 0) {
                reject(new Error('Arquivo HTML está vazio'));
              } else {
                resolve(content);
              }
            } else {
              reject(new Error(`Erro HTTP ${xhr.status} ao carregar página`));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Erro ao carregar a página. Certifique-se de estar usando um servidor HTTP (não file://)'));
        };
        
        xhr.open('GET', filePath, true);
        xhr.send();
      });
      
      // Armazena no cache
      this.pageCache[filePath] = html;
      
      return html;
    } catch (error) {
      console.error('Erro ao carregar página:', error);
      const errorHtml = `<div style="padding: 2rem; text-align: center;"><h2>Erro ao Carregar Página</h2><p>Erro ao carregar: ${filePath}</p><p><strong>${error.message}</strong></p><p style="margin-top: 1rem;">⚠️ Este aplicativo requer um servidor HTTP local.</p><p>Execute no terminal: <code>python3 -m http.server 8000</code></p><p>Depois acesse: <code>http://localhost:8000</code></p></div>`;
      return errorHtml;
    }
  },

  /**
   * Navega para uma página
   * @param {string} pagePath - Nome da página (login, dashboard, admin)
   * @param {boolean} requireAuth - Se a página requer autenticação
   */
  async navigate(pagePath, requireAuth = false) {
    if (requireAuth && !AuthService.isAuthenticated()) {
      await this.navigateToLogin();
      return;
    }

    const content = await this.loadPage(pagePath);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = content;
      this.currentPage = pagePath;
      this.initializePage(pagePath);
    }
  },

  /**
   * Navega para a página de login
   */
  async navigateToLogin() {
    await this.navigate('login', false);
  },

  /**
   * Navega para o dashboard
   */
  async navigateToDashboard() {
    await this.navigate('dashboard', true);
  },

  /**
   * Navega para a página de administração
   */
  async navigateToAdmin() {
    await this.navigate('admin', true);
  },

  /**
   * Inicializa eventos específicos da página
   * @param {string} pagePath - Nome da página
   */
  initializePage(pagePath) {
    // Normaliza o pagePath para o nome simples
    const pageName = pagePath.replace('pages/', '').replace('.html', '');
    
    if (pageName === 'login') {
      this.initializeLoginPage();
    } else if (pageName === 'dashboard') {
      this.initializeDashboardPage();
    } else if (pageName === 'admin') {
      this.initializeAdminPage();
    }
  },

  /**
   * Inicializa eventos da página de login
   */
  initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('loginError');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (errorMessage) {
          errorMessage.style.display = 'none';
        }

        if (AuthService.login(username, password)) {
          await this.navigateToDashboard();
        } else {
          if (errorMessage) {
            errorMessage.textContent = 'Usuário ou senha incorretos';
            errorMessage.style.display = 'block';
          }
        }
      });
    }
  },

  /**
   * Inicializa eventos da página do dashboard
   */
  initializeDashboardPage() {
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('themeToggle');
    const adminBtn = document.getElementById('adminBtn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        AuthService.logout();
        await this.navigateToLogin();
      });
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    if (adminBtn) {
      adminBtn.addEventListener('click', async () => {
        await this.navigateToAdmin();
      });
    }

    this.initializeTheme();
    this.initializeFinanceFeatures();
  },

  /**
   * Inicializa funcionalidades financeiras do dashboard
   */
  initializeFinanceFeatures() {
    FinanceService.checkAndAutoCloseWeek();
    
    this.initializeTransactionForm();
    this.initializeCloseWeekButton();
    this.updateDashboardData();
    this.setDefaultDate();
    
    setInterval(() => {
      if (FinanceService.checkAndAutoCloseWeek()) {
        this.updateDashboardData();
        this.showSuccessMessage('Semana fechada automaticamente!');
      }
    }, 60000);
  },

  /**
   * Inicializa formulário de lançamentos
   */
  initializeTransactionForm() {
    const form = document.getElementById('transactionForm');
    const errorMessage = document.getElementById('formError');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (errorMessage) {
          errorMessage.style.display = 'none';
        }

        const description = document.getElementById('description').value.trim();
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        try {
          FinanceService.createTransaction(description, amount, date);
          form.reset();
          this.setDefaultDate();
          this.updateDashboardData();
          this.showSuccessMessage('Lançamento adicionado com sucesso!');
        } catch (error) {
          if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
          }
        }
      });
    }
  },

  /**
   * Inicializa botão de fechar semana
   */
  initializeCloseWeekButton() {
    const closeWeekBtn = document.getElementById('closeWeekBtn');

    if (closeWeekBtn) {
      closeWeekBtn.addEventListener('click', () => {
        if (FinanceService.isCurrentWeekClosed()) {
          alert('A semana atual já está fechada.');
          return;
        }

        if (confirm('Deseja realmente fechar a semana atual? Esta ação não pode ser desfeita.')) {
          FinanceService.closeWeek();
          this.updateDashboardData();
          this.showSuccessMessage('Semana fechada com sucesso!');
        }
      });
    }
  },

  /**
   * Atualiza dados exibidos no dashboard
   */
  updateDashboardData() {
    this.updateSummary();
    this.updateTransactionsList();
    this.updateCloseWeekButton();
    this.updateWeeksHistory();
  },

  /**
   * Atualiza resumo (totais)
   */
  updateSummary() {
    const currentWeekPeriod = document.getElementById('currentWeekPeriod');
    const currentWeekTotal = document.getElementById('currentWeekTotal');
    const currentMonthTotal = document.getElementById('currentMonthTotal');

    const currentWeekId = DatesService.getWeekId();
    const weekPeriod = DatesService.getWeekPeriod(currentWeekId);
    const weekTotal = FinanceService.getCurrentWeekTotal();
    const monthTotal = FinanceService.getCurrentMonthTotal();

    if (currentWeekPeriod) {
      currentWeekPeriod.textContent = weekPeriod;
    }

    if (currentWeekTotal) {
      currentWeekTotal.textContent = FinanceService.formatCurrency(weekTotal);
      
      const isExceeded = FinanceService.isWeeklyLimitExceeded();
      if (isExceeded) {
        currentWeekTotal.classList.add('limit-exceeded');
      } else {
        currentWeekTotal.classList.remove('limit-exceeded');
      }
    }

    if (currentMonthTotal) {
      currentMonthTotal.textContent = FinanceService.formatCurrency(monthTotal);
    }
  },

  /**
   * Atualiza lista de transações
   */
  updateTransactionsList() {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;

    const transactions = FinanceService.getCurrentWeekTransactions();

    if (transactions.length === 0) {
      transactionsList.innerHTML = '<p class="empty-message">Nenhum lançamento registrado nesta semana.</p>';
      return;
    }

    transactionsList.innerHTML = transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(transaction => {
        const date = DatesService.formatDate(new Date(transaction.date));
        return `
          <div class="transaction-item">
            <div class="transaction-info">
              <span class="transaction-description">${this.escapeHtml(transaction.description)}</span>
              <span class="transaction-date">${date}</span>
            </div>
            <div class="transaction-amount">${FinanceService.formatCurrency(transaction.amount)}</div>
            <div class="transaction-actions">
              <button class="btn btn-danger" data-transaction-id="${transaction.id}">Excluir</button>
            </div>
          </div>
        `;
      })
      .join('');

    transactionsList.querySelectorAll('.btn-danger').forEach(button => {
      button.addEventListener('click', (e) => {
        const transactionId = e.target.getAttribute('data-transaction-id');
        if (transactionId) {
          this.removeTransaction(transactionId);
        }
      });
    });
  },

  /**
   * Remove uma transação
   * @param {string} transactionId - ID da transação
   */
  removeTransaction(transactionId) {
    if (confirm('Deseja realmente excluir este lançamento?')) {
      FinanceService.removeTransaction(transactionId);
      this.updateDashboardData();
      this.showSuccessMessage('Lançamento excluído com sucesso!');
    }
  },

  /**
   * Atualiza estado do botão de fechar semana
   */
  updateCloseWeekButton() {
    const closeWeekBtn = document.getElementById('closeWeekBtn');
    if (closeWeekBtn) {
      if (FinanceService.isCurrentWeekClosed()) {
        closeWeekBtn.disabled = true;
        closeWeekBtn.textContent = 'Semana Fechada';
        closeWeekBtn.classList.add('btn-secondary');
      } else {
        closeWeekBtn.disabled = false;
        closeWeekBtn.textContent = 'Fechar Semana';
      }
    }
  },

  /**
   * Atualiza histórico de semanas
   */
  updateWeeksHistory() {
    const historySection = document.getElementById('weeksHistorySection');
    if (!historySection) return;

    const weeks = FinanceService.getWeeksHistory(10);
    
    if (weeks.length === 0) {
      historySection.innerHTML = '<p class="empty-message">Nenhum histórico disponível.</p>';
      return;
    }

    historySection.innerHTML = weeks
      .map(week => {
        const closedClass = week.isClosed ? 'week-closed' : '';
        const closedBadge = week.isClosed ? '<span class="closed-badge">Fechada</span>' : '';
        
        return `
          <div class="week-history-item ${closedClass}">
            <div class="week-history-info">
              <div class="week-history-header">
                <span class="week-history-period">${week.period}</span>
                ${closedBadge}
              </div>
              <span class="week-history-details">${week.transactionCount} lançamento(s)</span>
            </div>
            <div class="week-history-total">${FinanceService.formatCurrency(week.total)}</div>
          </div>
        `;
      })
      .join('');
  },

  /**
   * Define data padrão no campo de data (hoje)
   */
  setDefaultDate() {
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
      dateInput.value = DatesService.formatDateForInput();
    }
  },

  /**
   * Exibe mensagem de sucesso temporária
   * @param {string} message - Mensagem a exibir
   */
  showSuccessMessage(message) {
    const formSection = document.querySelector('.form-section');
    if (!formSection) return;

    const existingMessage = formSection.querySelector('.success-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    formSection.insertBefore(successDiv, formSection.firstChild);

    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  },

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text - Texto a escapar
   * @returns {string} Texto escapado
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Inicializa tema salvo
   */
  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  },

  /**
   * Alterna entre tema dark e light
   */
  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeIcon(newTheme);
  },

  /**
   * Atualiza ícone do tema
   * @param {string} theme - Tema atual
   */
  updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  },

  /**
   * Inicializa eventos da página de administração
   */
  initializeAdminPage() {
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('themeToggle');
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        AuthService.logout();
        await this.navigateToLogin();
      });
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    if (backToDashboardBtn) {
      backToDashboardBtn.addEventListener('click', async () => {
        await this.navigateToDashboard();
      });
    }

    this.initializeTheme();
    this.initializeAdminFeatures();
  },

  /**
   * Inicializa funcionalidades da página de administração
   */
  initializeAdminFeatures() {
    this.loadAutoCloseConfig();
    this.loadWeeklyLimit();
    this.updateCurrentConfig();
    this.initializeAutoCloseForm();
    this.initializeWeeklyLimitForm();
  },

  /**
   * Carrega configuração de fechamento automático nos campos
   */
  loadAutoCloseConfig() {
    const config = FinanceService.getAutoCloseConfig();
    const enabledCheckbox = document.getElementById('autoCloseEnabled');
    const daySelect = document.getElementById('autoCloseDay');
    const hourInput = document.getElementById('autoCloseHour');

    if (enabledCheckbox) {
      enabledCheckbox.checked = config.enabled;
    }

    if (daySelect) {
      daySelect.value = config.dayOfWeek.toString();
    }

    if (hourInput) {
      hourInput.value = config.hour.toString();
    }
  },

  /**
   * Carrega limite semanal no campo
   */
  loadWeeklyLimit() {
    const limit = FinanceService.getWeeklyLimit();
    const limitInput = document.getElementById('weeklyLimit');

    if (limitInput) {
      limitInput.value = limit !== null ? limit.toString() : '';
    }
  },

  /**
   * Atualiza informações de configurações atuais
   */
  updateCurrentConfig() {
    const config = FinanceService.getAutoCloseConfig();
    const limit = FinanceService.getWeeklyLimit();

    const statusEl = document.getElementById('currentAutoCloseStatus');
    const dayEl = document.getElementById('currentAutoCloseDay');
    const hourEl = document.getElementById('currentAutoCloseHour');
    const limitEl = document.getElementById('currentWeeklyLimit');

    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    if (statusEl) {
      statusEl.textContent = config.enabled ? 'Habilitado' : 'Desabilitado';
    }

    if (dayEl) {
      dayEl.textContent = days[config.dayOfWeek] || '-';
    }

    if (hourEl) {
      hourEl.textContent = config.enabled ? `${config.hour}h` : '-';
    }

    if (limitEl) {
      limitEl.textContent = limit !== null ? FinanceService.formatCurrency(limit) : 'Não definido';
    }
  },

  /**
   * Inicializa formulário de fechamento automático
   */
  initializeAutoCloseForm() {
    const form = document.getElementById('autoCloseForm');
    const errorMessage = document.getElementById('autoCloseError');
    const successMessage = document.getElementById('autoCloseSuccess');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (errorMessage) {
          errorMessage.style.display = 'none';
        }
        if (successMessage) {
          successMessage.style.display = 'none';
        }

        const enabled = document.getElementById('autoCloseEnabled').checked;
        const dayOfWeek = parseInt(document.getElementById('autoCloseDay').value);
        const hour = parseInt(document.getElementById('autoCloseHour').value);

        if (isNaN(hour) || hour < 0 || hour > 23) {
          if (errorMessage) {
            errorMessage.textContent = 'Hora deve ser um número entre 0 e 23';
            errorMessage.style.display = 'block';
          }
          return;
        }

        try {
          FinanceService.setAutoCloseConfig({
            enabled,
            dayOfWeek,
            hour
          });

          this.updateCurrentConfig();

          if (successMessage) {
            successMessage.textContent = 'Configuração de fechamento automático salva com sucesso!';
            successMessage.style.display = 'block';
          }

          setTimeout(() => {
            if (successMessage) {
              successMessage.style.display = 'none';
            }
          }, 3000);
        } catch (error) {
          if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
          }
        }
      });
    }
  },

  /**
   * Inicializa formulário de limite semanal
   */
  initializeWeeklyLimitForm() {
    const form = document.getElementById('weeklyLimitForm');
    const errorMessage = document.getElementById('weeklyLimitError');
    const successMessage = document.getElementById('weeklyLimitSuccess');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (errorMessage) {
          errorMessage.style.display = 'none';
        }
        if (successMessage) {
          successMessage.style.display = 'none';
        }

        const limitInput = document.getElementById('weeklyLimit');
        const limitValue = limitInput.value.trim();

        let limit = null;
        if (limitValue && limitValue !== '0') {
          limit = parseFloat(limitValue);
          if (isNaN(limit) || limit <= 0) {
            if (errorMessage) {
              errorMessage.textContent = 'Limite deve ser um número maior que zero';
              errorMessage.style.display = 'block';
            }
            return;
          }
        }

        try {
          FinanceService.setWeeklyLimit(limit);
          this.updateCurrentConfig();

          if (successMessage) {
            successMessage.textContent = 'Limite semanal salvo com sucesso!';
            successMessage.style.display = 'block';
          }

          setTimeout(() => {
            if (successMessage) {
              successMessage.style.display = 'none';
            }
          }, 3000);
        } catch (error) {
          if (errorMessage) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
          }
        }
      });
    }
  }
};
