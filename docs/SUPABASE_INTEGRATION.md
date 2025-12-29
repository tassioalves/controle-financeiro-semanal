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
  week_id TEXT NOT NULL, -- ID único da semana (não é timestamp)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Opcional: para multi-usuário
);

-- Índice para melhorar performance nas consultas por semana
CREATE INDEX idx_transactions_week_id ON transactions(week_id);
CREATE INDEX idx_transactions_date ON transactions(date);
```

### Tabela: `closed_weeks`
Armazena as semanas fechadas.

```sql
CREATE TABLE closed_weeks (
  week_id TEXT PRIMARY KEY, -- ID único da semana (não é timestamp)
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Opcional: para multi-usuário
);
```

### Tabela: `week_mapping`
Armazena o mapeamento entre IDs únicos de semanas e suas datas de início.
**Importante**: Esta tabela é essencial para o sistema de IDs únicos.

```sql
CREATE TABLE week_mapping (
  week_id TEXT PRIMARY KEY, -- ID único da semana (ex: 'week_abc123_xyz789')
  week_start_date DATE NOT NULL, -- Data de início da semana (yyyy-mm-dd)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Opcional: para multi-usuário
);

-- Índice para melhorar performance nas consultas por data
CREATE INDEX idx_week_mapping_date ON week_mapping(week_start_date);
```

### Tabela: `current_week`
Armazena informações da semana atual.

```sql
CREATE TABLE current_week (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Sempre 1 (singleton)
  week_id TEXT NOT NULL, -- ID único da semana atual
  week_start_date DATE NOT NULL, -- Data de início da semana atual
  next_close_date DATE, -- Data do próximo fechamento automático
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) -- Opcional: para multi-usuário
);

-- Constraint para garantir que só existe uma linha
CREATE UNIQUE INDEX idx_current_week_singleton ON current_week(id);
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
      weekMapping: 'week_mapping',
      currentWeek: 'current_week',
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
    
    try {
      // Mapeia chaves do storage para tabelas do Supabase
      if (key === 'finance_transactions') {
        // value é um array de transações
        if (Array.isArray(value) && value.length > 0) {
          const { error } = await this.client
            .from(AppConfig.SUPABASE.tables.transactions)
            .upsert(value, { onConflict: 'id' });
          return !error;
        }
        return true;
      }
      
      if (key === 'finance_closed_weeks') {
        // value é um array de weekIds
        if (Array.isArray(value)) {
          // Remove todos os registros existentes e insere os novos
          const { error: deleteError } = await this.client
            .from(AppConfig.SUPABASE.tables.closedWeeks)
            .delete()
            .neq('week_id', ''); // Deleta todos
          
          if (deleteError) return false;
          
          if (value.length > 0) {
            const closedWeeks = value.map(weekId => ({
              week_id: weekId,
              closed_at: new Date().toISOString()
            }));
            
            const { error: insertError } = await this.client
              .from(AppConfig.SUPABASE.tables.closedWeeks)
              .insert(closedWeeks);
            
            return !insertError;
          }
        }
        return true;
      }
      
      if (key === 'finance_week_id_mapping') {
        // value é um objeto { weekId: 'yyyy-mm-dd' }
        if (typeof value === 'object' && value !== null) {
          const mappings = Object.entries(value).map(([weekId, dateString]) => ({
            week_id: weekId,
            week_start_date: dateString
          }));
          
          const { error } = await this.client
            .from(AppConfig.SUPABASE.tables.weekMapping)
            .upsert(mappings, { onConflict: 'week_id' });
          
          return !error;
        }
        return true;
      }
      
      if (key === 'finance_current_week_start') {
        // value é uma data ISO string
        // Atualiza a tabela current_week
        const { data: currentWeek } = await this.client
          .from(AppConfig.SUPABASE.tables.currentWeek)
          .select('*')
          .eq('id', 1)
          .single();
        
        if (currentWeek) {
          const { error } = await this.client
            .from(AppConfig.SUPABASE.tables.currentWeek)
            .update({
              week_start_date: value.split('T')[0], // Converte ISO para DATE
              updated_at: new Date().toISOString()
            })
            .eq('id', 1);
          
          return !error;
        } else {
          // Cria o registro se não existir
          const { error } = await this.client
            .from(AppConfig.SUPABASE.tables.currentWeek)
            .insert({
              id: 1,
              week_start_date: value.split('T')[0],
              week_id: null // Será atualizado quando setCurrentWeekStart for chamado com weekId
            });
          
          return !error;
        }
      }
      
      if (key === 'finance_current_week_id') {
        // value é o weekId da semana atual
        const { data: currentWeek } = await this.client
          .from(AppConfig.SUPABASE.tables.currentWeek)
          .select('*')
          .eq('id', 1)
          .single();
        
        if (currentWeek) {
          const { error } = await this.client
            .from(AppConfig.SUPABASE.tables.currentWeek)
            .update({
              week_id: value,
              updated_at: new Date().toISOString()
            })
            .eq('id', 1);
          
          return !error;
        }
        return false;
      }
      
      if (key === 'finance_next_close_date') {
        // value é uma data ISO string ou null
        const { data: currentWeek } = await this.client
          .from(AppConfig.SUPABASE.tables.currentWeek)
          .select('*')
          .eq('id', 1)
          .single();
        
        if (currentWeek) {
          const { error } = await this.client
            .from(AppConfig.SUPABASE.tables.currentWeek)
            .update({
              next_close_date: value ? value.split('T')[0] : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', 1);
          
          return !error;
        }
        return false;
      }
      
      // Outras configurações vão para a tabela settings
      const { error } = await this.client
        .from(AppConfig.SUPABASE.tables.settings)
        .upsert({
          key: key,
          value: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      return !error;
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      return false;
    }
  },

  async get(key, defaultValue) {
    if (!this.client) await this.init();
    
    try {
      // Mapeia chaves do storage para queries do Supabase
      if (key === 'finance_transactions') {
        const { data, error } = await this.client
          .from(AppConfig.SUPABASE.tables.transactions)
          .select('*')
          .order('created_at', { ascending: false });
        
        return error ? defaultValue : (data || defaultValue);
      }
      
      if (key === 'finance_closed_weeks') {
        const { data, error } = await this.client
          .from(AppConfig.SUPABASE.tables.closedWeeks)
          .select('week_id');
        
        if (error) return defaultValue;
        
        return data ? data.map(row => row.week_id) : defaultValue;
      }
      
      if (key === 'finance_week_id_mapping') {
        const { data, error } = await this.client
          .from(AppConfig.SUPABASE.tables.weekMapping)
          .select('week_id, week_start_date');
        
        if (error) return defaultValue;
        
        const mapping = {};
        if (data) {
          data.forEach(row => {
            mapping[row.week_id] = row.week_start_date;
          });
        }
        
        return Object.keys(mapping).length > 0 ? mapping : defaultValue;
      }
      
      if (key === 'finance_current_week_start') {
        const { data, error } = await this.client
          .from(AppConfig.SUPABASE.tables.currentWeek)
          .select('week_start_date')
          .eq('id', 1)
          .single();
        
        if (error || !data || !data.week_start_date) return defaultValue;
        
        // Converte DATE para ISO string
        return new Date(data.week_start_date + 'T00:00:00').toISOString();
      }
      
      if (key === 'finance_current_week_id') {
        const { data, error } = await this.client
          .from(AppConfig.SUPABASE.tables.currentWeek)
          .select('week_id')
          .eq('id', 1)
          .single();
        
        if (error || !data) return defaultValue;
        
        return data.week_id || defaultValue;
      }
      
      if (key === 'finance_next_close_date') {
        const { data, error } = await this.client
          .from(AppConfig.SUPABASE.tables.currentWeek)
          .select('next_close_date')
          .eq('id', 1)
          .single();
        
        if (error || !data || !data.next_close_date) return defaultValue;
        
        // Converte DATE para ISO string
        return new Date(data.next_close_date + 'T00:00:00').toISOString();
      }
      
      // Outras configurações vêm da tabela settings
      const { data, error } = await this.client
        .from(AppConfig.SUPABASE.tables.settings)
        .select('value')
        .eq('key', key)
        .single();
      
      if (error || !data) return defaultValue;
      
      return data.value;
    } catch (error) {
      console.error('Erro ao ler do Supabase:', error);
      return defaultValue;
    }
  },

  async remove(key) {
    if (!this.client) await this.init();
    
    try {
      if (key === 'finance_transactions') {
        const { error } = await this.client
          .from(AppConfig.SUPABASE.tables.transactions)
          .delete()
          .neq('id', ''); // Deleta todos
        
        return !error;
      }
      
      // Para outras chaves, remove da tabela settings
      const { error } = await this.client
        .from(AppConfig.SUPABASE.tables.settings)
        .delete()
        .eq('key', key);
      
      return !error;
    } catch (error) {
      console.error('Erro ao remover do Supabase:', error);
      return false;
    }
  },

  async clear() {
    if (!this.client) await this.init();
    
    try {
      // CUIDADO: Isso apaga TODOS os dados!
      // Considere adicionar filtro por user_id se usar multi-usuário
      
      await this.client.from(AppConfig.SUPABASE.tables.transactions).delete().neq('id', '');
      await this.client.from(AppConfig.SUPABASE.tables.closedWeeks).delete().neq('week_id', '');
      await this.client.from(AppConfig.SUPABASE.tables.weekMapping).delete().neq('week_id', '');
      await this.client.from(AppConfig.SUPABASE.tables.currentWeek).delete().eq('id', 1);
      await this.client.from(AppConfig.SUPABASE.tables.settings).delete().neq('key', '');
      
      return true;
    } catch (error) {
      console.error('Erro ao limpar Supabase:', error);
      return false;
    }
  }
};
```

## 🔄 Migração de Dados

Para migrar dados do localStorage para o Supabase:

1. Exporte os dados do localStorage
2. Use um script de migração para inserir no Supabase
3. Valide os dados migrados

### Script de Migração (Exemplo)

Se você já tem dados com timestamps como `week_id`, será necessário migrar para IDs únicos:

```javascript
// Exemplo de script de migração
async function migrateToUniqueWeekIds() {
  // 1. Obter todas as transações
  const transactions = await getFromLocalStorage('finance_transactions');
  
  // 2. Agrupar por week_id antigo (timestamp)
  const weekGroups = {};
  transactions.forEach(t => {
    if (!weekGroups[t.week_id]) {
      weekGroups[t.week_id] = [];
    }
    weekGroups[t.week_id].push(t);
  });
  
  // 3. Criar novos IDs únicos e mapeamento
  const weekMapping = {};
  const newTransactions = [];
  
  for (const [oldWeekId, trans] of Object.entries(weekGroups)) {
    // Gera novo ID único
    const newWeekId = 'week_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    
    // Calcula data de início da semana (do timestamp antigo)
    const weekStartDate = new Date(parseInt(oldWeekId));
    const dateKey = weekStartDate.toISOString().split('T')[0];
    
    // Atualiza mapeamento
    weekMapping[newWeekId] = dateKey;
    
    // Atualiza transações
    trans.forEach(t => {
      newTransactions.push({
        ...t,
        week_id: newWeekId
      });
    });
  }
  
  // 4. Migrar closed_weeks
  const closedWeeks = await getFromLocalStorage('finance_closed_weeks');
  const newClosedWeeks = closedWeeks.map(oldWeekId => {
    // Encontra o novo weekId no mapeamento
    const weekStartDate = new Date(parseInt(oldWeekId));
    const dateKey = weekStartDate.toISOString().split('T')[0];
    
    // Procura no mapeamento
    for (const [newWeekId, date] of Object.entries(weekMapping)) {
      if (date === dateKey) {
        return newWeekId;
      }
    }
    
    // Se não encontrou, cria novo
    const newWeekId = 'week_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    weekMapping[newWeekId] = dateKey;
    return newWeekId;
  });
  
  // 5. Salvar no Supabase
  await supabase.from('transactions').upsert(newTransactions);
  await supabase.from('week_mapping').upsert(
    Object.entries(weekMapping).map(([weekId, date]) => ({
      week_id: weekId,
      week_start_date: date
    }))
  );
  await supabase.from('closed_weeks').upsert(
    newClosedWeeks.map(weekId => ({
      week_id: weekId,
      closed_at: new Date().toISOString()
    }))
  );
}
```

## 🔑 Sistema de IDs Únicos

**Importante**: O sistema agora usa IDs únicos aleatórios para semanas (ex: `week_abc123_xyz789`) em vez de timestamps. Isso resolve problemas de conflito quando múltiplas semanas começam na mesma data.

### Como funciona:

1. **week_id**: Cada semana tem um ID único gerado aleatoriamente
2. **week_mapping**: Tabela que mapeia `week_id` → `week_start_date`
3. **Validações**: Todas as validações usam `week_id`, não datas
4. **Exibição**: Datas são usadas apenas para exibição e cálculos de período

### Migração de dados existentes:

Se você já tem dados com timestamps como `week_id`, será necessário migrar:

```sql
-- Script de migração (exemplo)
-- 1. Criar novos IDs únicos para semanas existentes
-- 2. Atualizar week_mapping
-- 3. Atualizar transactions.week_id
-- 4. Atualizar closed_weeks.week_id
```

## ⚠️ Considerações Importantes

1. **Autenticação**: Se implementar multi-usuário, será necessário integrar autenticação do Supabase
2. **RLS**: Configure Row Level Security para proteger dados dos usuários
3. **Sincronização**: Dados no Supabase são assíncronos, pode ser necessário adaptar o código para usar async/await
4. **Offline**: Considere implementar cache local para funcionar offline
5. **IDs Únicos**: O sistema usa IDs únicos para semanas. Certifique-se de que a tabela `week_mapping` está sempre sincronizada
6. **Performance**: Índices foram adicionados nas tabelas para melhorar performance. Considere adicionar mais índices conforme necessário

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

