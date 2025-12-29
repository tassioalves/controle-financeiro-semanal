# 💰 Controle Financeiro Semanal

Aplicação web para controle financeiro pessoal com foco em gerenciamento semanal de gastos. Desenvolvida com HTML, CSS e JavaScript puro (sem frameworks), oferece uma solução simples e eficiente para monitorar despesas com fechamento automático semanal.

## 📋 Sobre o Projeto

O **Controle Financeiro Semanal** é uma aplicação web que permite gerenciar gastos pessoais de forma organizada, com destaque para o controle semanal. A aplicação foi projetada para ser leve, rápida e totalmente funcional sem dependências externas, utilizando apenas tecnologias nativas do navegador.

### Objetivo

Criar uma solução completa para controle financeiro pessoal que:

- Facilite o registro de gastos diários
- Organize automaticamente os gastos por semana
- Permita fechamento automático e manual de semanas
- Forneça visão clara dos gastos semanais e mensais
- Alerte quando o limite semanal for ultrapassado
- Ofereça interface moderna e responsiva

## ✨ Funcionalidades

### ✅ Implementadas

- **Autenticação simples**: Sistema de login com credenciais fixas
- **Proteção de rotas**: Acesso restrito apenas para usuários autenticados
- **Persistência de sessão**: Login mantido mesmo após fechar o navegador
- **Tema Dark/Light**: Alternância entre temas com persistência da preferência
- **Interface responsiva**: Layout adaptável para mobile e desktop
- **Arquitetura modular**: Código organizado em módulos separados por responsabilidade
- **Lançamento de gastos**: Formulário para registrar gastos com descrição, valor e data
- **Controle semanal**: Associação automática de lançamentos a semanas
- **Fechamento manual de semana**: Botão para fechar a semana atual
- **Fechamento automático**: Fechamento automático de semanas (domingo às 12h por padrão)
- **Verificação automática**: Sistema verifica periodicamente se deve fechar semanas automaticamente
- **Proteção de semanas fechadas**: Lançamentos em semanas fechadas são automaticamente direcionados para a próxima semana
- **Cálculo de totais**: Soma automática de gastos semanais e mensais
- **Listagem de transações**: Visualização de todos os gastos da semana atual
- **Histórico semanal**: Visualização do histórico de semanas anteriores
- **Destaque visual**: Semanas fechadas são destacadas visualmente no histórico
- **Limite semanal**: Sistema de limite semanal com alerta visual quando ultrapassado
- **Alerta visual**: Total da semana fica vermelho quando o limite é ultrapassado
- **Persistência de limite**: Limite semanal salvo no localStorage
- **Página inicial (Home)**: Interface principal para registro de gastos e visualização da semana atual
- **Dashboard de estatísticas**: Página dedicada para visualização de estatísticas, histórico e limites
- **Navegação entre páginas**: Sistema de roteamento para navegação fluida entre as páginas
- **Tela de administração**: Página dedicada para configurações do sistema
- **Configuração de fechamento automático**: Interface para alterar dia e hora do fechamento semanal
- **Configuração de limite semanal**: Interface para definir e alterar o limite semanal
- **Visualização de configurações atuais**: Exibição das configurações ativas na tela de admin

## 🛠️ Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização com variáveis CSS para temas
- **JavaScript (ES6+)**: Lógica da aplicação com scripts tradicionais
- **LocalStorage API**: Persistência de dados no navegador

## 📁 Estrutura do Projeto

```text
controle-financeiro-semanal/
├── index.html              # Ponto de entrada da aplicação
├── css/
│   └── styles.css          # Estilos globais com suporte a temas
├── js/
│   ├── main.js             # Inicialização da aplicação
│   ├── config.js           # Configurações da aplicação e providers
│   ├── data-provider.js    # Abstração de provedores de dados (localStorage/Supabase)
│   ├── auth.js             # Serviço de autenticação
│   ├── storage.js          # Serviço de gerenciamento de dados
│   ├── dates.js            # Serviço de cálculos de datas e semanas
│   ├── finance.js          # Serviço de lançamentos financeiros
│   └── router.js           # Gerenciamento de rotas e navegação
├── docs/
│   └── SUPABASE_INTEGRATION.md  # Guia de integração com Supabase
├── pages/
│   ├── login.html          # Página de autenticação (template)
│   ├── home.html           # Página inicial (template)
│   ├── dashboard.html      # Dashboard de estatísticas (template)
│   └── admin.html          # Página de administração (template)
├── assets/                 # Recursos estáticos (imagens, ícones)
├── plan.md                 # Plano de desenvolvimento detalhado
└── README.md               # Este arquivo
```

## 🚀 Como Usar

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Instalação

1. Clone ou baixe o repositório
2. Abra o arquivo `index.html` diretamente no navegador (duplo clique no arquivo)

A aplicação funciona completamente offline, sem necessidade de servidor ou conexão com a internet. Os templates HTML estão embutidos no JavaScript, permitindo que funcione diretamente com protocolo `file://`.

### Credenciais de Acesso

- **Usuário**: `admin`
- **Senha**: `admin123`

## 🎨 Características da Interface

### Estrutura de Páginas

A aplicação possui uma estrutura de navegação clara e intuitiva:

- **Página Inicial (Home)**: Interface principal onde o usuário registra novos gastos, visualiza os gastos da semana atual e pode fechar a semana manualmente
- **Dashboard**: Página de estatísticas com visão geral dos gastos, histórico de semanas anteriores e informações sobre limites semanais
- **Administração**: Página de configurações para gerenciar fechamento automático e limites semanais
- **Login**: Página de autenticação para acesso à aplicação

### Tema Dark/Light

A aplicação suporta dois temas visuais que podem ser alternados a qualquer momento:

- **Light Theme**: Tema claro padrão
- **Dark Theme**: Tema escuro para uso noturno

A preferência é salva automaticamente e mantida entre sessões.

### Responsividade

Interface desenvolvida com abordagem **mobile-first**, garantindo:

- Experiência otimizada em dispositivos móveis
- Layout adaptável para tablets
- Interface completa e funcional em desktops

## 🔐 Segurança

- Autenticação simples com credenciais fixas (adequado para uso pessoal)
- Proteção de rotas: páginas protegidas não são acessíveis sem autenticação
- Sessão persistente no `localStorage` do navegador

**Nota**: Para uso em produção, recomenda-se implementar autenticação mais robusta e backend seguro.

## 📊 Arquitetura

### Módulos JavaScript

- **`main.js`**: Ponto de entrada, inicializa a aplicação e verifica autenticação
- **`config.js`**: Configurações da aplicação, incluindo tipo de provider de dados
- **`data-provider.js`**: Abstração de provedores de dados, permite trocar entre localStorage e Supabase
- **`auth.js`**: Gerencia autenticação, validação de credenciais e sessão
- **`storage.js`**: Serviço de gerenciamento de dados usando o provider configurado
- **`dates.js`**: Gerencia cálculos de datas e semanas
- **`finance.js`**: Gerencia lançamentos financeiros e controle de semanas
- **`router.js`**: Sistema de roteamento SPA (Single Page Application), carregamento dinâmico de páginas, proteção de rotas e inicialização de eventos específicos de cada página

### Páginas HTML

- **`login.html`**: Template da página de autenticação
- **`home.html`**: Template da página inicial com formulário de lançamentos e lista de gastos da semana
- **`dashboard.html`**: Template do dashboard de estatísticas com histórico e informações detalhadas
- **`admin.html`**: Template da página de administração com configurações do sistema

### Padrões Utilizados

- **Separação de responsabilidades**: Cada módulo tem uma função específica
- **Service Pattern**: Serviços isolados para operações específicas
- **Provider Pattern**: Abstração de provedores de dados para fácil substituição
- **Module Pattern**: Código organizado em scripts separados por responsabilidade
- **Single Responsibility**: Cada função tem uma única responsabilidade

## 🗺️ Roadmap

O desenvolvimento está dividido em 11 fases principais:

1. ✅ **Estrutura Base** - Concluída
2. ✅ **Autenticação** - Concluída
3. ✅ **Lançamentos Financeiros** - Concluída
4. ✅ **Controle de Semanas** - Concluída
5. ✅ **Listagens e Totais** - Concluída
6. ✅ **Limite Semanal e Alertas** - Concluída
7. ✅ **Tela de Administração** - Concluída
8. ✅ **UI/UX e Estilo Visual** - Concluída
9. ✅ **Organização e Manutenção** - Concluída
10. ✅ **Testes e Ajustes Finais** - Concluída
11. ✅ **Preparação para Integração** - Concluída

Para mais detalhes, consulte o arquivo `plan.md`.

## 🔮 Futuras Melhorias

- **Integração com Supabase**: Estrutura preparada para integração com Supabase (veja `docs/SUPABASE_INTEGRATION.md`)
- Suporte a múltiplos usuários
- Exportação de relatórios (PDF, Excel)
- Gráficos e visualizações de gastos
- Categorização de gastos
- Metas financeiras personalizadas
- Notificações de fechamento semanal

## 🔌 Integração com Supabase

A aplicação está preparada para integração futura com Supabase. A estrutura de providers permite trocar facilmente entre localStorage e Supabase através da configuração em `js/config.js`. Para mais detalhes sobre como implementar a integração, consulte o guia em `docs/SUPABASE_INTEGRATION.md`.

## 🤝 Contribuindo

Este é um projeto pessoal em desenvolvimento. Sugestões e melhorias são bem-vindas!

## 📝 Licença

Este projeto é de uso pessoal e educacional.

## 👤 Autor

Desenvolvido para controle financeiro pessoal.

---

**Versão**: 1.0.0  
**Status**: Funcional  
**Última atualização**: 2024
