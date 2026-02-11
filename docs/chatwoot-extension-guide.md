# 🚀 Chatwoot Extension Guide - Complete Implementation

## 📋 Overview
Chatwoot é altamente extensível através de múltiplas abordagens. Este guia cobre todas as estratégias para adicionar novas funcionalidades.

## 🏗️ Arquitetura do Chatwoot

### Estrutura Principal
```
app/
├── controllers/          # Controllers MVC
├── models/              # Models ActiveRecord
├── views/               # Views ERB
├── helpers/             # Helper methods
├── services/            # Business logic
├── jobs/                # Background jobs
├── channels/            # ActionCable/WebSocket
├── assets/              # Frontend assets
└── frontend/            # Vue.js components
```

### Frontend (Vue.js)
```
frontend/
├── components/          # Vue components
├── stores/              # Pinia stores
├── router/              # Vue Router
├── widgets/             # Dashboard widgets
└── shared/              # Shared components
```

## 🎯 Estratégias de Extensão

### 1. 📱 Plugins (Recomendado para Produção)
**Vantagens:**
- Mantém código separado do core
- Atualizações fáceis
- Distribuição independente
- Menor risco de conflitos

**Estrutura de Plugin:**
```
plugins/
└── meu_plugin/
    ├── app/
    │   ├── controllers/
    │   ├── models/
    │   └── views/
    ├── db/
    │   └── migrate/
    ├── config/
    │   └── routes.rb
    ├── lib/
    │   └── meu_plugin.rb
    ├── package.json
    └── README.md
```

**Exemplo de Plugin:**
```ruby
# plugins/meu_plugin/lib/meu_plugin.rb
module MeuPlugin
  class Engine < Rails::Engine
    isolate_namespace MeuPlugin
    
    config.after_initialize do
      Chatwoot::Application.routes.append do
        mount MeuPlugin::Engine => "/meu_plugin"
      end
    end
  end
end
```

### 2. 🔧 Custom Extensions (Para Customizações Específicas)
**Vantagens:**
- Integração profunda com o core
- Acesso total às APIs internas
- Performance otimizada

**Estrutura:**
```
app/
├── custom/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   └── widgets/
└── config/
    └── custom_routes.rb
```

### 3. 🎨 Frontend Extensions (Vue.js)
**Componentes Customizados:**
```javascript
// frontend/src/components/MeuComponente.vue
<template>
  <div class="meu-componente">
    <h1>{{ title }}</h1>
    <button @click="acao">Executar Ação</button>
  </div>
</template>

<script>
export default {
  name: 'MeuComponente',
  data() {
    return {
      title: 'Meu Componente Customizado'
    }
  },
  methods: {
    acao() {
      this.$emit('custom-action', { data: 'custom' });
    }
  }
}
</script>
```

## 🛠️ Implementação Passo a Passo

### Passo 1: Novas Entidades (Models)

```ruby
# app/models/custom_entity.rb
class CustomEntity < ApplicationRecord
  self.table_name = 'custom_entities'
  
  belongs_to :account
  belongs_to :created_by, class_name: 'User'
  
  validates :name, presence: true
  validates :description, presence: true
  
  # Scopes para filtros
  scope :active, -> { where(status: 'active') }
  scope :by_priority, ->(priority) { where(priority: priority) }
  
  # Callbacks
  after_create :log_creation
  after_update :log_update
  
  private
  
  def log_creation
    Rails.logger.info "CustomEntity created: #{name}"
  end
  
  def log_update
    Rails.logger.info "CustomEntity updated: #{name}"
  end
end
```

**Migration:**
```ruby
# db/migrate/20260210000001_create_custom_entities.rb
class CreateCustomEntities < ActiveRecord::Migration[7.1]
  def change
    create_table :custom_entities do |t|
      t.references :account, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: 'users' }
      
      t.string :name, null: false
      t.text :description
      t.string :status, default: 'active'
      t.string :priority
      t.json :custom_fields
      
      t.timestamps
    end
    
    add_index :custom_entities, :status
    add_index :custom_entities, :priority
    add_index :custom_entities, :name
  end
end
```

### Passo 2: Controllers

```ruby
# app/controllers/custom_entities_controller.rb
class CustomEntitiesController < ApplicationController
  before_action :set_custom_entity, only: [:show, :edit, :update, :destroy]
  before_action :authorize_custom_entity
  
  def index
    @custom_entities = current_account.custom_entities
                                   .includes(:created_by)
                                   .filter(params.slice(:status, :priority))
                                   .page(params[:page])
                                   .per(20)
  end
  
  def show
    render json: @custom_entity
  end
  
  def create
    @custom_entity = current_account.custom_entities.build(custom_entity_params)
    @custom_entity.created_by = current_user
    
    if @custom_entity.save
      render json: @custom_entity, status: :created
    else
      render json: @custom_entity.errors, status: :unprocessable_entity
    end
  end
  
  def update
    if @custom_entity.update(custom_entity_params)
      render json: @custom_entity
    else
      render json: @custom_entity.errors, status: :unprocessable_entity
    end
  end
  
  def destroy
    @custom_entity.destroy
    head :no_content
  end
  
  private
  
  def set_custom_entity
    @custom_entity = current_account.custom_entities.find(params[:id])
  end
  
  def custom_entity_params
    params.require(:custom_entity).permit(:name, :description, :status, :priority, custom_fields: {})
  end
  
  def authorize_custom_entity
    authorize! :manage, @custom_entity
  end
end
```

### Passo 3: Routes

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # ... rotas existentes
  
  # Namespace para customizações
  namespace :custom do
    resources :custom_entities do
      member do
        post :activate
        post :deactivate
      end
      
      collection do
        get :export
        post :import
      end
    end
  end
  
  # API Routes
  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      namespace :custom do
        resources :custom_entities, only: [:index, :show, :create, :update, :destroy]
      end
    end
  end
end
```

### Passo 4: Frontend Components

```javascript
// frontend/src/components/custom/CustomEntityList.vue
<template>
  <div class="custom-entity-list">
    <div class="header">
      <h2>Custom Entities</h2>
      <button @click="showCreateModal" class="btn btn-primary">
        Add New Entity
      </button>
    </div>
    
    <div class="filters">
      <select v-model="filters.status" @change="loadEntities">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      
      <select v-model="filters.priority" @change="loadEntities">
        <option value="">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
    
    <div class="entities-grid">
      <div v-for="entity in entities" :key="entity.id" class="entity-card">
        <h3>{{ entity.name }}</h3>
        <p>{{ entity.description }}</p>
        <div class="actions">
          <button @click="editEntity(entity)" class="btn btn-secondary">
            Edit
          </button>
          <button @click="deleteEntity(entity)" class="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useCustomEntitiesStore } from '@/stores/customEntities'

export default {
  name: 'CustomEntityList',
  data() {
    return {
      filters: {
        status: '',
        priority: ''
      }
    }
  },
  computed: {
    ...mapState(useCustomEntitiesStore, ['entities', 'loading'])
  },
  mounted() {
    this.loadEntities()
  },
  methods: {
    ...mapActions(useCustomEntitiesStore, ['fetchEntities', 'deleteEntity']),
    
    async loadEntities() {
      await this.fetchEntities(this.filters)
    },
    
    showCreateModal() {
      this.$emit('show-create-modal')
    },
    
    editEntity(entity) {
      this.$emit('edit-entity', entity)
    },
    
    async deleteEntity(entity) {
      if (confirm('Are you sure?')) {
        await this.deleteEntity(entity.id)
        this.loadEntities()
      }
    }
  }
}
</script>
```

### Passo 5: Stores (Pinia)

```javascript
// frontend/src/stores/customEntities.js
import { defineStore } from 'pinia'
import { axios } from '@/axios'

export const useCustomEntitiesStore = defineStore('customEntities', {
  state: () => ({
    entities: [],
    loading: false,
    error: null
  }),
  
  getters: {
    activeEntities: (state) => state.entities.filter(e => e.status === 'active'),
    highPriorityEntities: (state) => state.entities.filter(e => e.priority === 'high')
  },
  
  actions: {
    async fetchEntities(filters = {}) {
      this.loading = true
      try {
        const response = await axios.get('/api/v1/custom/custom_entities', {
          params: filters
        })
        this.entities = response.data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    
    async createEntity(entityData) {
      try {
        const response = await axios.post('/api/v1/custom/custom_entities', entityData)
        this.entities.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async updateEntity(id, entityData) {
      try {
        const response = await axios.put(`/api/v1/custom/custom_entities/${id}`, entityData)
        const index = this.entities.findIndex(e => e.id === id)
        this.entities[index] = response.data
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async deleteEntity(id) {
      try {
        await axios.delete(`/api/v1/custom/custom_entities/${id}`)
        this.entities = this.entities.filter(e => e.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
})
```

## 🎨 Adicionando Menus e Navegação

### 1. Menu Principal

```ruby
# app/helpers/custom_navigation_helper.rb
module CustomNavigationHelper
  def custom_navigation_items
    [
      {
        name: 'Custom Entities',
        icon: 'custom-icon',
        url: '/custom/custom_entities',
        active: controller_name == 'custom_entities'
      },
      {
        name: 'Custom Reports',
        icon: 'chart-icon',
        url: '/custom/reports',
        active: controller_name == 'reports'
      }
    ]
  end
end
```

### 2. Sidebar Navigation

```javascript
// frontend/src/components/CustomSidebar.vue
<template>
  <div class="custom-sidebar">
    <div class="sidebar-header">
      <h3>Custom Features</h3>
    </div>
    
    <nav class="sidebar-nav">
      <router-link 
        v-for="item in navigationItems" 
        :key="item.name"
        :to="item.url"
        class="nav-item"
        :class="{ active: isActive(item) }"
      >
        <i :class="item.icon"></i>
        <span>{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'CustomSidebar',
  data() {
    return {
      navigationItems: [
        { name: 'Entities', icon: 'fas fa-database', url: '/custom/entities' },
        { name: 'Reports', icon: 'fas fa-chart-bar', url: '/custom/reports' },
        { name: 'Settings', icon: 'fas fa-cog', url: '/custom/settings' }
      ]
    }
  },
  methods: {
    isActive(item) {
      return this.$route.path.startsWith(item.url)
    }
  }
}
</script>
```

## 🏷️ Etiquetas e Filtros

### 1. Sistema de Etiquetas

```ruby
# app/models/concerns/taggable.rb
module Taggable
  extend ActiveSupport::Concern
  
  included do
    has_many :taggings, as: :taggable, dependent: :destroy
    has_many :tags, through: :taggings
    
    scope :tagged_with, ->(name) { joins(:tags).where(tags: { name: name }) }
    scope :tagged_with_any, ->(names) { joins(:tags).where(tags: { name: names }) }
  end
  
  class_methods do
    def tag_counts
      Tag.joins(:taggings)
         .where(taggings: { taggable_type: name })
         .group('tags.id', 'tags.name')
         .select('tags.*, COUNT(*) as count')
    end
  end
  
  def tag_list
    tags.pluck(:name).join(', ')
  end
  
  def tag_list=(names)
    tag_names = names.to_s.split(',').map(&:strip).reject(&:blank?)
    self.tags = tag_names.map { |name| Tag.find_or_create_by(name: name) }
  end
end
```

### 2. Componente de Filtros

```javascript
// frontend/src/components/custom/FilterPanel.vue
<template>
  <div class="filter-panel">
    <div class="filter-section">
      <h4>Status</h4>
      <div class="filter-options">
        <label v-for="status in statusOptions" :key="status.value">
          <input 
            type="checkbox" 
            :value="status.value"
            v-model="filters.status"
            @change="applyFilters"
          >
          {{ status.label }}
        </label>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Priority</h4>
      <div class="filter-options">
        <label v-for="priority in priorityOptions" :key="priority.value">
          <input 
            type="checkbox" 
            :value="priority.value"
            v-model="filters.priority"
            @change="applyFilters"
          >
          {{ priority.label }}
        </label>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Tags</h4>
      <div class="filter-options">
        <label v-for="tag in availableTags" :key="tag.id">
          <input 
            type="checkbox" 
            :value="tag.name"
            v-model="filters.tags"
            @change="applyFilters"
          >
          {{ tag.name }}
        </label>
      </div>
    </div>
    
    <div class="filter-actions">
      <button @click="clearFilters" class="btn btn-secondary">
        Clear Filters
      </button>
      <button @click="saveFilters" class="btn btn-primary">
        Save Filters
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterPanel',
  data() {
    return {
      filters: {
        status: [],
        priority: [],
        tags: []
      },
      statusOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ],
      priorityOptions: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ],
      availableTags: []
    }
  },
  mounted() {
    this.loadTags()
  },
  methods: {
    async loadTags() {
      // Carregar tags disponíveis
      const response = await this.$axios.get('/api/v1/tags')
      this.availableTags = response.data
    },
    
    applyFilters() {
      this.$emit('filters-changed', this.filters)
    },
    
    clearFilters() {
      this.filters = {
        status: [],
        priority: [],
        tags: []
      }
      this.applyFilters()
    },
    
    saveFilters() {
      // Salvar filtros preferidos do usuário
      localStorage.setItem('custom-filters', JSON.stringify(this.filters))
    }
  }
}
</script>
```

## 🎯 Dashboard Widgets

### 1. Widget Customizado

```ruby
# app/widgets/custom_stats_widget.rb
class CustomStatsWidget
  attr_reader :account, :user
  
  def initialize(account:, user:)
    @account = account
    @user = user
  end
  
  def data
    {
      total_entities: total_entities,
      active_entities: active_entities,
      recent_activity: recent_activity,
      top_tags: top_tags
    }
  end
  
  private
  
  def total_entities
    CustomEntity.where(account: account).count
  end
  
  def active_entities
    CustomEntity.where(account: account, status: 'active').count
  end
  
  def recent_activity
    CustomEntity.where(account: account)
                  .where('created_at > ?', 1.week.ago)
                  .count
  end
  
  def top_tags
    Tag.joins(:taggings)
       .joins('JOIN custom_entities ON taggings.taggable_id = custom_entities.id')
       .where(custom_entities: { account: account })
       .group('tags.name')
       .order('COUNT(*) DESC')
       .limit(5)
       .pluck('tags.name')
  end
end
```

### 2. Frontend Widget

```javascript
// frontend/src/widgets/CustomStatsWidget.vue
<template>
  <div class="custom-stats-widget">
    <div class="widget-header">
      <h3>Custom Statistics</h3>
    </div>
    
    <div class="widget-content">
      <div class="stat-item">
        <div class="stat-value">{{ data.total_entities }}</div>
        <div class="stat-label">Total Entities</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ data.active_entities }}</div>
        <div class="stat-label">Active Entities</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ data.recent_activity }}</div>
        <div class="stat-label">Recent Activity</div>
      </div>
      
      <div class="stat-item">
        <div class="stat-value">{{ data.top_tags.join(', ') }}</div>
        <div class="stat-label">Top Tags</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CustomStatsWidget',
  props: {
    data: {
      type: Object,
      required: true
    }
  }
}
</script>
```

## 🔄 Permissões e Autorizações

### 1. Abilities

```ruby
# app/models/ability.rb
class Ability
  include CanCan::Ability
  
  def initialize(user)
    user ||= User.new
    
    if user.admin?
      can :manage, CustomEntity
    elsif user.agent?
      can :read, CustomEntity
      can :create, CustomEntity
      can :update, CustomEntity, created_by: user
    else
      can :read, CustomEntity, account: user.account
    end
  end
end
```

### 2. Policies

```ruby
# app/policies/custom_entity_policy.rb
class CustomEntityPolicy < ApplicationPolicy
  def index?
    user.account == record.account
  end
  
  def show?
    user.account == record.account
  end
  
  def create?
    user.account == record.account
  end
  
  def update?
    user.account == record.account && (user.admin? || record.created_by == user)
  end
  
  def destroy?
    user.account == record.account && (user.admin? || record.created_by == user)
  end
  
  class Scope
    def resolve
      scope.where(account: user.account)
    end
  end
end
```

## 📱 Mobile Responsiveness

```css
/* app/assets/stylesheets/custom_entities.css */
.custom-entity-list {
  padding: 20px;
}

.entities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.entity-card {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .entities-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-panel {
    flex-direction: column;
  }
  
  .custom-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .custom-sidebar.open {
    transform: translateX(0);
  }
}
```

## 🚀 Deploy e Distribuição

### 1. Plugin Distribution

```ruby
# Gemfile para plugin
source 'https://rubygems.org'

gem 'meu_chatwoot_plugin', path: 'plugins/meu_plugin'
```

### 2. Docker Integration

```dockerfile
# Dockerfile customizado
FROM chatwoot/chatwoot:latest

# Copiar plugin
COPY ./plugins/meu_plugin /app/plugins/meu_plugin

# Instalar dependências
RUN cd /app/plugins/meu_plugin && bundle install

# Rodar migrations
RUN rails db:migrate

# Build assets
RUN rails assets:precompile
```

## 📋 Roadmap de Implementação

### Fase 1: Estrutura Básica (1-2 semanas)
- [ ] Criar estrutura de plugin
- [ ] Implementar model básico
- [ ] Criar controller CRUD
- [ ] Configurar routes

### Fase 2: Frontend (2-3 semanas)
- [ ] Criar componentes Vue.js
- [ ] Implementar stores Pinia
- [ ] Adicionar navegação
- [ ] Criar layouts responsivos

### Fase 3: Funcionalidades Avançadas (2-3 semanas)
- [ ] Implementar filtros e etiquetas
- [ ] Adicionar widgets ao dashboard
- [ ] Criar sistema de permissões
- [ ] Implementar API REST

### Fase 4: Integração e Testes (1-2 semanas)
- [ ] Integração com Chatwoot existente
- [ ] Testes automatizados
- [ ] Documentação
- [ ] Deploy em produção

## 🎯 Melhores Práticas

1. **Sempre use plugins** para funcionalidades independentes
2. **Siga as convenções** do Chatwoot (naming, estrutura)
3. **Implemente testes** para todas as funcionalidades
4. **Use as APIs existentes** sempre que possível
5. **Pense em mobile-first** para todos os componentes
6. **Implemente permissões** adequadas
7. **Documente tudo** de forma clara
8. **Teste em staging** antes de produção

---

## 🏆 Conclusão

Estender o Chatwoot é **bastante acessível** com as abordagens certas. A arquitetura dele foi desenhada para ser extensível, e a comunidade oferece muitos exemplos e plugins.

**Recomendação:** Comece com um **plugin simples** e evolua gradualmente. Use a estrutura existente como guia e não tenha medo de explorar o código fonte do Chatwoot para entender como as coisas funcionam.

---

*Generated by AI Agent - 10 de Fevereiro de 2026*  
*Chatwoot Extension Guide - Complete Implementation*
