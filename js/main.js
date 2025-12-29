/**
 * Main Entry Point
 * Inicializa a aplicação e valida a sessão do usuário
 */

/**
 * Inicializa a aplicação
 */
async function init() {
  try {
    // Verifica se os elementos necessários existem
    const app = document.getElementById('app');
    if (!app) {
      console.error('Elemento #app não encontrado no DOM');
      document.body.innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>Erro</h2><p>Elemento #app não encontrado.</p></div>';
      return;
    }

    // Verifica se as dependências estão disponíveis
    if (typeof Router === 'undefined') {
      console.error('Router não está definido');
      app.innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>Erro</h2><p>Router não está definido. Verifique se os arquivos JavaScript estão sendo carregados corretamente.</p></div>';
      return;
    }

    if (typeof AuthService === 'undefined') {
      console.error('AuthService não está definido');
      app.innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>Erro</h2><p>AuthService não está definido. Verifique se os arquivos JavaScript estão sendo carregados corretamente.</p></div>';
      return;
    }

    // Valida a sessão do usuário e renderiza o conteúdo apropriado
    if (AuthService.isAuthenticated()) {
      await Router.navigateToDashboard();
    } else {
      await Router.navigateToLogin();
    }
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <h2>Erro ao inicializar aplicação</h2>
          <p style="margin: 1rem 0;">${error.message}</p>
          <p style="margin: 1rem 0;">Verifique o console do navegador para mais detalhes.</p>
        </div>
      `;
    }
  }
}

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

