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
      'home': 'pages/home.html',
      'dashboard': 'pages/dashboard.html',
      'admin': 'pages/admin.html',
      'pages/login.html': 'pages/login.html',
      'pages/home.html': 'pages/home.html',
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
      // Normaliza o pagePath para o nome simples
      let pageName = pagePath;
      if (pagePath.includes('/')) {
        pageName = pagePath.replace('pages/', '').replace('.html', '');
      } else if (pagePath.includes('.html')) {
        pageName = pagePath.replace('.html', '');
      }

      // Adiciona menu lateral se não for login
      if (pageName !== 'login' && AuthService.isAuthenticated()) {
        app.innerHTML = this.createSidebarLayout(content, pageName);
      } else {
        app.innerHTML = content;
      }

      this.currentPage = pagePath;
      // Usa requestAnimationFrame para garantir que o DOM esteja renderizado
      requestAnimationFrame(() => {
        // Remove qualquer header-actions que possa existir
        const headerActions = document.querySelectorAll('.header-actions');
        headerActions.forEach(el => el.remove());
        
        this.initializePage(pagePath);
        this.initializeSidebar(pageName);
      });
    }
  },

  /**
   * Navega para a página de login
   */
  async navigateToLogin() {
    await this.navigate('login', false);
  },

  /**
   * Navega para a home
   */
  async navigateToHome() {
    await this.navigate('home', true);
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
    let pageName = pagePath;
    if (pagePath.includes('/')) {
      pageName = pagePath.replace('pages/', '').replace('.html', '');
    } else if (pagePath.includes('.html')) {
      pageName = pagePath.replace('.html', '');
    }
    
    if (pageName === 'login') {
      this.initializeLoginPage();
    } else if (pageName === 'home') {
      this.initializeHomePage();
    } else if (pageName === 'dashboard') {
      this.initializeDashboardPage();
    } else if (pageName === 'admin') {
      this.initializeAdminPage();
    }
  },

  /**
   * Cria o layout com sidebar
   * @param {string} pageContent - Conteúdo HTML da página
   * @param {string} currentPage - Nome da página atual
   * @returns {string} HTML com sidebar e conteúdo
   */
  createSidebarLayout(pageContent, currentPage) {
    return `
      <button class="sidebar-toggle" id="sidebarToggle" aria-label="Abrir menu">
        ☰
      </button>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">💰 Controle Financeiro</h2>
        </div>
        <nav class="sidebar-nav">
          <a href="#" class="sidebar-link ${currentPage === 'home' ? 'active' : ''}" data-page="home">
            <span class="sidebar-link-icon">🏠</span>
            <span>Início</span>
          </a>
          <a href="#" class="sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
            <span class="sidebar-link-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a href="#" class="sidebar-link ${currentPage === 'admin' ? 'active' : ''}" data-page="admin">
            <span class="sidebar-link-icon">⚙️</span>
            <span>Administração</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button id="sidebarThemeToggle" class="btn btn-secondary" style="width: 100%;">
            <span id="sidebarThemeIcon">🌙</span> Alternar Tema
          </button>
          <button id="sidebarLogoutBtn" class="btn btn-secondary" style="width: 100%;">
            Sair
          </button>
        </div>
      </aside>
      <div class="content-with-sidebar">
        ${pageContent}
      </div>
    `;
  },

  /**
   * Inicializa o sidebar e seus eventos
   * @param {string} currentPage - Nome da página atual
   */
  initializeSidebar(currentPage) {
    // Toggle do sidebar (mobile)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle && sidebar && sidebarOverlay) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
      });

      sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      });
    }

    // Links de navegação
    const navLinks = document.querySelectorAll('.sidebar-link[data-page]');
    navLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        
        // Fecha o menu em mobile
        if (sidebar) {
          sidebar.classList.remove('open');
        }
        if (sidebarOverlay) {
          sidebarOverlay.classList.remove('active');
        }

        // Navega para a página
        if (page === 'home') {
          await this.navigateToHome();
        } else if (page === 'dashboard') {
          await this.navigateToDashboard();
        } else if (page === 'admin') {
          await this.navigateToAdmin();
        }
      });
    });

    // Botão de tema no sidebar
    const sidebarThemeToggle = document.getElementById('sidebarThemeToggle');
    if (sidebarThemeToggle) {
      sidebarThemeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Botão de logout no sidebar
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener('click', async () => {
        AuthService.logout();
        await this.navigateToLogin();
      });
    }

    // Atualiza o ícone do tema no sidebar
    this.updateSidebarThemeIcon();
  },

  /**
   * Atualiza ícone do tema no sidebar
   */
  updateSidebarThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const sidebarThemeIcon = document.getElementById('sidebarThemeIcon');
    if (sidebarThemeIcon) {
      sidebarThemeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
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
          await this.navigateToHome();
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
   * Inicializa eventos da página home
   */
  initializeHomePage() {
    this.initializeTheme();
    this.initializeFinanceFeatures();
  },

  /**
   * Inicializa eventos da página do dashboard
   */
  initializeDashboardPage() {
    this.initializeTheme();
    this.initializeStatsFeatures();
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
        this.showSuccessMessage('Semana fechada automaticamente! A nova semana está ativa.');
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

        this.showCloseWeekDialog();
      });
    }
  },

  /**
   * Exibe diálogo para fechamento manual da semana
   */
  showCloseWeekDialog() {
    // Cria o modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h2 class="modal-title">Fechar Semana</h2>
        <p class="modal-description">Deseja realmente fechar a semana atual? A nova semana será iniciada a partir de hoje.</p>
        <div id="closeWeekError" class="error-message" style="display: none;"></div>
        <div class="modal-actions">
          <button id="cancelCloseWeekBtn" class="btn btn-secondary">Cancelar</button>
          <button id="confirmCloseWeekBtn" class="btn btn-primary">Fechar Semana</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = document.getElementById('cancelCloseWeekBtn');
    const confirmBtn = document.getElementById('confirmCloseWeekBtn');
    const errorDiv = document.getElementById('closeWeekError');

    // Fecha o modal ao cancelar
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Confirma o fechamento
    confirmBtn.addEventListener('click', () => {
      try {
        const closed = FinanceService.closeWeek(null, null, true);
        if (closed) {
          document.body.removeChild(modal);
          this.updateDashboardData();
          this.showSuccessMessage('Semana fechada com sucesso! A nova semana está ativa.');
        } else {
          errorDiv.textContent = 'Não foi possível fechar a semana. A semana pode já estar fechada.';
          errorDiv.style.display = 'block';
        }
      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
      }
    });

    // Fecha o modal ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  },

  /**
   * Atualiza dados exibidos no dashboard
   */
  updateDashboardData() {
    this.updateSummary();
    this.updateTransactionsList();
    this.updateCloseWeekButton();
  },

  /**
   * Atualiza resumo (totais)
   */
  updateSummary() {
    const currentWeekPeriod = document.getElementById('currentWeekPeriod');
    const currentWeekTotal = document.getElementById('currentWeekTotal');
    const currentMonthTotal = document.getElementById('currentMonthTotal');

    const weekPeriod = FinanceService.getCurrentWeekPeriod();
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
    if (!historySection) {
      console.warn('weeksHistorySection não encontrado');
      return;
    }

    // Procura o template no documento inteiro
    let template = document.getElementById('weekHistoryItemTemplate');
    
    // Se não encontrou, tenta procurar dentro do app
    if (!template) {
      const app = document.getElementById('app');
      if (app) {
        template = app.querySelector('#weekHistoryItemTemplate');
      }
    }
    
    // Se ainda não encontrou, tenta procurar em qualquer lugar
    if (!template) {
      template = document.querySelector('#weekHistoryItemTemplate');
    }

    if (!template) {
      console.error('Template weekHistoryItemTemplate não encontrado. Verifique se o template está no dashboard.html');
      historySection.innerHTML = '<p class="empty-message">Erro ao carregar histórico. Template não encontrado.</p>';
      return;
    }

    const weeks = FinanceService.getWeeksHistory(10);
    
    if (weeks.length === 0) {
      historySection.innerHTML = '<p class="empty-message">Nenhum histórico disponível.</p>';
      return;
    }

    // Limpa o conteúdo anterior
    historySection.innerHTML = '';

    // Cria um item para cada semana usando o template
    weeks.forEach(week => {
      const item = template.content.cloneNode(true);
      const weekItem = item.querySelector('.week-history-item');
      const period = item.querySelector('.week-history-period');
      const closedBadge = item.querySelector('.closed-badge');
      const details = item.querySelector('.week-history-details');
      const total = item.querySelector('.week-history-total');
      const content = item.querySelector('.week-history-content');
      const transactionsContainer = item.querySelector('.week-history-transactions');

      if (!weekItem || !period || !details || !total || !content || !transactionsContainer) {
        console.error('Elementos do template não encontrados');
        return;
      }

      // Preenche os dados
      weekItem.setAttribute('data-week-id', week.weekId);
      if (week.isClosed) {
        weekItem.classList.add('week-closed');
        if (closedBadge) {
          closedBadge.style.display = 'inline-block';
        }
      }
      period.textContent = week.period;
      details.textContent = `${week.transactionCount} lançamento(s)`;
      total.textContent = FinanceService.formatCurrency(week.total);

      // Adiciona evento de clique para expandir/colapsar
      content.addEventListener('click', () => {
        const isExpanded = transactionsContainer.style.display !== 'none';
        
        if (isExpanded) {
          // Colapsa
          transactionsContainer.style.display = 'none';
          weekItem.classList.remove('expanded');
        } else {
          // Expande
          this.renderWeekTransactions(week.weekId, transactionsContainer);
          transactionsContainer.style.display = 'block';
          weekItem.classList.add('expanded');
        }
      });

      historySection.appendChild(item);
    });
  },

  /**
   * Renderiza as transações de uma semana específica
   * @param {string} weekId - ID da semana
   * @param {HTMLElement} container - Container onde renderizar as transações
   */
  renderWeekTransactions(weekId, container) {
    // Procura o template no documento inteiro
    let template = document.getElementById('weekTransactionItemTemplate');
    
    // Se não encontrou, tenta procurar dentro do app
    if (!template) {
      const app = document.getElementById('app');
      if (app) {
        template = app.querySelector('#weekTransactionItemTemplate');
      }
    }
    
    // Se ainda não encontrou, tenta procurar em qualquer lugar
    if (!template) {
      template = document.querySelector('#weekTransactionItemTemplate');
    }

    if (!template) {
      console.error('Template weekTransactionItemTemplate não encontrado. Verifique se o template está no dashboard.html');
      container.innerHTML = '<p class="empty-message" style="padding: 1rem; text-align: center; color: var(--text-secondary);">Erro ao carregar transações.</p>';
      return;
    }

    const transactions = FinanceService.getTransactionsByWeek(weekId);
    
    if (transactions.length === 0) {
      container.innerHTML = '<p class="empty-message" style="padding: 1rem; text-align: center; color: var(--text-secondary);">Nenhum lançamento nesta semana.</p>';
      return;
    }

    // Limpa o container
    container.innerHTML = '';

    // Ordena transações (mais recente primeiro)
    const sortedTransactions = transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Cria um item para cada transação usando o template
    sortedTransactions.forEach(transaction => {
      const item = template.content.cloneNode(true);
      const description = item.querySelector('.week-transaction-description');
      const date = item.querySelector('.week-transaction-date');
      const amount = item.querySelector('.week-transaction-amount');

      if (!description || !date || !amount) {
        console.error('Elementos do template de transação não encontrados');
        return;
      }

      // Preenche os dados
      description.textContent = transaction.description;
      date.textContent = DatesService.formatDate(new Date(transaction.date));
      amount.textContent = FinanceService.formatCurrency(transaction.amount);

      container.appendChild(item);
    });
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
  /**
   * Exibe uma mensagem de sucesso como toast
   * @param {string} message - Mensagem a exibir
   * @param {number} duration - Duração em milissegundos (padrão: 3000)
   */
  showSuccessMessage(message, duration = 3000) {
    // Cria ou obtém o container de toasts
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    // Cria o toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    toast.innerHTML = `
      <span class="toast-icon">✓</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Fechar">×</button>
    `;

    // Adiciona evento de fechar
    const closeBtn = toast.querySelector('.toast-close');
    const closeToast = () => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        toast.remove();
        // Remove o container se não houver mais toasts
        if (toastContainer && toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    };

    closeBtn.addEventListener('click', closeToast);

    // Adiciona o toast ao container
    toastContainer.appendChild(toast);

    // Remove automaticamente após a duração especificada
    setTimeout(() => {
      if (toast.parentNode) {
        closeToast();
      }
    }, duration);
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
    this.updateSidebarThemeIcon();
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
    // Atualiza também o ícone do sidebar
    this.updateSidebarThemeIcon();
  },


  /**
   * Inicializa funcionalidades da página de estatísticas
   */
  initializeStatsFeatures() {
    FinanceService.checkAndAutoCloseWeek();
    this.updateStatsData();
    
    setInterval(() => {
      if (FinanceService.checkAndAutoCloseWeek()) {
        this.updateStatsData();
      }
    }, 60000);
  },

  /**
   * Atualiza dados exibidos na página de estatísticas
   */
  updateStatsData() {
    this.updateStatsSummary();
    // Usa setTimeout para garantir que o DOM esteja completamente renderizado
    setTimeout(() => {
      this.updateWeeksHistory();
    }, 0);
  },

  /**
   * Atualiza resumo na página de estatísticas
   */
  updateStatsSummary() {
    const currentWeekPeriod = document.getElementById('currentWeekPeriod');
    const currentWeekTotal = document.getElementById('currentWeekTotal');
    const currentMonthTotal = document.getElementById('currentMonthTotal');
    const weeklyLimitDisplay = document.getElementById('weeklyLimitDisplay');
    const limitUsage = document.getElementById('limitUsage');

    const weekPeriod = FinanceService.getCurrentWeekPeriod();
    const weekTotal = FinanceService.getCurrentWeekTotal();
    const monthTotal = FinanceService.getCurrentMonthTotal();
    const limit = FinanceService.getWeeklyLimit();
    const limitUsagePercent = FinanceService.getWeeklyLimitUsage();

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

    if (weeklyLimitDisplay) {
      if (limit !== null) {
        weeklyLimitDisplay.textContent = FinanceService.formatCurrency(limit);
      } else {
        weeklyLimitDisplay.textContent = 'Não definido';
      }
    }

    if (limitUsage && limit !== null) {
      const usage = limitUsagePercent || 0;
      limitUsage.textContent = `${usage.toFixed(1)}% utilizado`;
      if (usage >= 100) {
        limitUsage.classList.add('limit-exceeded');
      } else {
        limitUsage.classList.remove('limit-exceeded');
      }
    }
  },

  /**
   * Inicializa eventos da página de administração
   */
  initializeAdminPage() {
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
