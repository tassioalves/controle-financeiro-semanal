# 📊 Plano de Desenvolvimento — Aplicação de Controle Financeiro Semanal

## 🎯 Objetivo Geral
Criar uma aplicação web (HTML, CSS e JS puro) para controle financeiro pessoal, com foco em **fechamento semanal automático**, controle de limite de gastos, visualização mensal e persistência dos dados no `localStorage`.

---

## 🧱 Fase 1 — Estrutura Base do Projeto
- [x] Criar estrutura de pastas (`/css`, `/js`, `/pages`, `/assets`)
- [x] Criar arquivo `index.html` base
- [x] Definir layout principal (header, content, footer)
- [x] Criar separação de responsabilidades no JS (modules)
- [x] Garantir carregamento correto dos scripts JS separados

---

## 🔐 Fase 2 — Autenticação Simples (Login)
- [x] Criar tela de login com usuário e senha fixos
- [x] Validar login no JavaScript
- [x] Salvar sessão de login no `localStorage`
- [x] Redirecionar usuário logado automaticamente
- [x] Criar função de logout
- [x] Proteger rotas (bloquear acesso sem login)

---

## 💸 Fase 3 — Lançamentos Financeiros
- [x] Criar formulário de lançamento de gastos
- [x] Campos: descrição, valor, data (calendário)
- [x] Validação de campos obrigatórios
- [x] Salvar lançamentos no `localStorage`
- [x] Associar cada lançamento a uma semana automaticamente
- [x] Criar botão para **forçar fechamento da semana atual**

---

## 📅 Fase 4 — Controle de Semanas e Fechamento
- [x] Implementar lógica de semana ativa
- [x] Definir fechamento automático semanal (default: domingo às 12h)
- [x] Criar verificação de data/hora para troca automática de semana
- [x] Garantir que lançamentos após o fechamento entrem na próxima semana
- [x] Permitir fechamento manual via botão
- [x] Persistir histórico de semanas fechadas

---

## 📋 Fase 5 — Listagens e Totais
- [x] Criar listagem de gastos da semana atual
- [x] Calcular soma total da semana
- [x] Calcular soma total do mês
- [x] Atualizar totais em tempo real
- [x] Exibir histórico semanal (opcional)
- [x] Destacar visualmente semanas fechadas

---

## 🚨 Fase 6 — Limite Semanal e Alertas
- [x] Criar configuração de valor máximo semanal
- [x] Comparar total semanal com limite definido
- [x] Alterar cor do total para vermelho ao ultrapassar limite
- [x] Garantir atualização automática do alerta
- [x] Persistir limite no `localStorage`

---

## ⚙️ Fase 7 — Tela de Administração
- [x] Criar tela/admin page separada
- [x] Permitir alterar dia e hora do fechamento semanal
- [x] Permitir alterar valor máximo semanal
- [x] Salvar configurações no `localStorage`
- [x] Aplicar novas regras sem perder dados existentes

---

## 🎨 Fase 8 — UI/UX e Estilo Visual
- [x] Criar layout estilo **dashboard moderno**
- [x] Garantir 100% responsividade (mobile-first)
- [x] Boa usabilidade no desktop
- [x] Criar sistema de cores via CSS variables
- [x] Facilitar troca de cores principais
- [x] Implementar modo **Dark / Light**
- [x] Salvar preferência de tema no `localStorage`

---

## 🧠 Fase 9 — Organização e Manutenção do Código
- [x] Separar JS por responsabilidade (auth, storage, dates, finance, ui)
- [x] Criar funções reutilizáveis
- [x] Evitar código duplicado
- [x] Comentar trechos críticos
- [x] Padronizar nomes de variáveis e funções

---

## 🧪 Fase 10 — Testes e Ajustes Finais
- [x] Testar fluxo completo de login
- [x] Testar fechamento automático
- [x] Testar fechamento manual
- [x] Testar troca de semana e mês
- [x] Testar limite semanal
- [x] Testar comportamento em mobile
- [x] Validar persistência dos dados após reload

---

## 🚀 Fase 11 — Preparação para Integração Futura
- [x] Centralizar lógica de persistência (storage service)
- [x] Evitar dependência direta do `localStorage`
- [x] Preparar estrutura para futura integração com Supabase
- [x] Garantir fácil substituição da camada de dados

---

## ✅ Resultado Esperado
Aplicação funcional, moderna, responsiva, organizada, com controle financeiro semanal robusto, pronta para evoluir com backend no futuro.
