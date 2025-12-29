# 🔌 Guia de Integração com Supabase

Este documento descreve como integrar o Supabase como provider de dados da aplicação.

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. URL e chave pública (anon key) do projeto

## 🗄️ Estrutura de Tabelas no Supabase

Crie as seguintes tabelas no Supabase:

### Tabela: `transactions`
Armazena os lançamentos financeiros.

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  week_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Opcional: para multi-usuário
);
```

### Tabela: `closed_weeks`
Armazena as semanas fechadas.

```sql
CREATE TABLE closed_weeks (
  week_id TEXT PRIMARY KEY,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Opcional: para multi-usuário
);
```

### Tabela: `settings`
Armazena configurações da aplicação (fechamento automático, limite semanal, etc).

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- Opcional: para multi-usuário
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Nota**: Se for implementar multi-usuário, adicione RLS (Row Level Security) nas tabelas.

## ⚙️ Configuração

1. Edite o arquivo `js/config.js`:

```javascript
const AppConfig = {
  DATA_PROVIDER: 'supabase', // Mude de 'localStorage' para 'supabase'
  
  SUPABASE: {
    url: 'https://seu-projeto.supabase.co',
    anonKey: 'sua-chave-publica-aqui',
    tables: {
      transactions: 'transactions',
      closedWeeks: 'closed_weeks',
      settings: 'settings'
    }
  }
};
```

2. Instale o cliente Supabase (via CDN ou npm):

**Via CDN** (adicionar no `index.html` antes dos outros scripts):
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Via npm** (se usar bundler):
```bash
npm install @supabase/supabase-js
```

## 🔧 Implementação do SupabaseProvider

Edite o arquivo `js/data-provider.js` e implemente o `SupabaseProvider`:

```javascript
const SupabaseProvider = {
  client: null,

  async init() {
    if (typeof supabase !== 'undefined') {
      this.client = supabase.createClient(
        AppConfig.SUPABASE.url,
        AppConfig.SUPABASE.anonKey
      );
    } else {
      console.error('Supabase client não encontrado. Verifique se o script foi carregado.');
    }
  },

  async set(key, value) {
    if (!this.client) await this.init();
    
    // Mapeia chaves do storage para tabelas do Supabase
    if (key === 'finance_transactions') {
      // Implementar lógica de upsert/insert
      const { error } = await this.client
        .from(AppConfig.SUPABASE.tables.transactions)
        .upsert(value, { onConflict: 'id' });
      return !error;
    }
    // ... outros mapeamentos
  },

  async get(key, defaultValue) {
    if (!this.client) await this.init();
    
    // Mapeia chaves do storage para queries do Supabase
    if (key === 'finance_transactions') {
      const { data, error } = await this.client
        .from(AppConfig.SUPABASE.tables.transactions)
        .select('*');
      return error ? defaultValue : data;
    }
    // ... outros mapeamentos
  },

  async remove(key) {
    // Implementar remoção
  },

  async clear() {
    // Implementar limpeza (cuidado com multi-usuário!)
  }
};
```

## 🔄 Migração de Dados

Para migrar dados do localStorage para o Supabase:

1. Exporte os dados do localStorage
2. Use um script de migração para inserir no Supabase
3. Valide os dados migrados

## ⚠️ Considerações Importantes

1. **Autenticação**: Se implementar multi-usuário, será necessário integrar autenticação do Supabase
2. **RLS**: Configure Row Level Security para proteger dados dos usuários
3. **Sincronização**: Dados no Supabase são assíncronos, pode ser necessário adaptar o código para usar async/await
4. **Offline**: Considere implementar cache local para funcionar offline

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

