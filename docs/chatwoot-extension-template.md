# 🚀 Chatwoot Extension - Quick Start Template

## 🎯 Template para Nova Funcionalidade

### Estrutura Básica
```
plugins/minha_funcionalidade/
├── app/
│   ├── controllers/
│   │   └── minha_entidades_controller.rb
│   ├── models/
│   │   └── minha_entidade.rb
│   └── views/
│       └── minha_entidades/
├── db/
│   └── migrate/
│       └── 20260210000001_create_minha_entidades.rb
├── frontend/
│   └── src/
│       ├── components/
│       │   └── MinhaEntidadeList.vue
│       └── stores/
│           └── minhaEntidade.js
├── config/
│   └── routes.rb
├── lib/
│   └── minha_funcionalidade.rb
├── package.json
└── README.md
```

## 📋 Exemplo Prático - Sistema de Tarefas

### 1. Model
```ruby
# app/models/task.rb
class Task < ApplicationRecord
  self.table_name = 'tasks'
  
  belongs_to :account
  belongs_to :assigned_to, class_name: 'User', optional: true
  belongs_to :created_by, class_name: 'User'
  
  validates :title, presence: true
  validates :status, inclusion: { in: ['todo', 'in_progress', 'done'] }
  validates :priority, inclusion: { in: ['low', 'medium', 'high'] }
  
  # Scopes
  scope :by_status, ->(status) { where(status: status) }
  scope :by_priority, ->(priority) { where(priority: priority) }
  scope :assigned, -> { where.not(assigned_to_id: nil) }
  scope :unassigned, -> { where(assigned_to_id: nil) }
  
  # Métodos
  def complete!
    update!(status: 'done', completed_at: Time.current)
  end
  
  def assign_to(user)
    update!(assigned_to: user)
  end
  
  # Class methods
  def self.by_priority_order
    order("CASE priority 
           WHEN 'high' THEN 1 
           WHEN 'medium' THEN 2 
           WHEN 'low' THEN 3 
           END")
  end
end
```

### 2. Migration
```ruby
# db/migrate/20260210000001_create_tasks.rb
class CreateTasks < ActiveRecord::Migration[7.1]
  def change
    create_table :tasks do |t|
      t.references :account, null: false, foreign_key: true
      t.references :assigned_to, foreign_key: { to_table: 'users' }
      t.references :created_by, null: false, foreign_key: { to_table: 'users' }
      
      t.string :title, null: false
      t.text :description
      t.string :status, default: 'todo'
      t.string :priority, default: 'medium'
      t.datetime :due_date
      t.datetime :completed_at
      
      t.timestamps
    end
    
    add_index :tasks, :status
    add_index :tasks, :priority
    add_index :tasks, :assigned_to_id
    add_index :tasks, :due_date
  end
end
```

### 3. Controller
```ruby
# app/controllers/tasks_controller.rb
class TasksController < ApplicationController
  before_action :set_task, only: [:show, :update, :destroy]
  before_action :authorize_task
  
  def index
    @tasks = current_account.tasks
                         .includes(:assigned_to, :created_by)
                         .filter(params.slice(:status, :priority, :assigned_to_id))
                         .by_priority_order
                         .page(params[:page])
                         .per(20)
    
    render json: {
      tasks: @tasks.map(&:to_json_with_associations),
      pagination: {
        current_page: @tasks.current_page,
        total_pages: @tasks.total_pages,
        total_count: @tasks.total_count
      }
    }
  end
  
  def show
    render json: @task.to_json_with_associations
  end
  
  def create
    @task = current_account.tasks.build(task_params)
    @task.created_by = current_user
    
    if @task.save
      render json: @task.to_json_with_associations, status: :created
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def update
    if @task.update(task_params)
      render json: @task.to_json_with_associations
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end
  
  def destroy
    @task.destroy
    head :no_content
  end
  
  # Actions customizadas
  def complete
    @task.complete!
    render json: @task.to_json_with_associations
  end
  
  def assign
    user = current_account.users.find(params[:user_id])
    @task.assign_to(user)
    render json: @task.to_json_with_associations
  end
  
  private
  
  def set_task
    @task = current_account.tasks.find(params[:id])
  end
  
  def task_params
    params.require(:task).permit(:title, :description, :status, :priority, :due_date, :assigned_to_id)
  end
  
  def authorize_task
    authorize! :manage, @task
  end
end
```

### 4. Routes
```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Tasks routes
  resources :tasks, only: [:index, :show, :create, :update, :destroy] do
    member do
      post :complete
      post :assign
    end
    
    collection do
      get :my_tasks
      get :unassigned
      get :overdue
    end
  end
  
  # API routes
  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      resources :tasks, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :complete
          post :assign
        end
      end
    end
  end
end
```

### 5. Frontend Component
```vue
<!-- frontend/src/components/tasks/TaskList.vue -->
<template>
  <div class="task-list">
    <div class="header">
      <h2>Tasks</h2>
      <div class="actions">
        <button @click="showCreateModal" class="btn btn-primary">
          <i class="fas fa-plus"></i>
          New Task
        </button>
        <button @click="showFilters = !showFilters" class="btn btn-secondary">
          <i class="fas fa-filter"></i>
          Filters
        </button>
      </div>
    </div>
    
    <!-- Filters Panel -->
    <div v-if="showFilters" class="filters-panel">
      <div class="filter-group">
        <label>Status:</label>
        <select v-model="filters.status" @change="loadTasks">
          <option value="">All</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Priority:</label>
        <select v-model="filters.priority" @change="loadTasks">
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Assigned To:</label>
        <select v-model="filters.assigned_to_id" @change="loadTasks">
          <option value="">Anyone</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.name }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Tasks List -->
    <div class="tasks-container">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Loading tasks...
      </div>
      
      <div v-else-if="tasks.length === 0" class="empty-state">
        <i class="fas fa-tasks"></i>
        <p>No tasks found</p>
      </div>
      
      <div v-else class="tasks-grid">
        <div v-for="task in tasks" :key="task.id" class="task-card" :class="task.status">
          <div class="task-header">
            <h3>{{ task.title }}</h3>
            <div class="task-priority" :class="task.priority">
              {{ task.priority }}
            </div>
          </div>
          
          <div class="task-description" v-if="task.description">
            {{ task.description }}
          </div>
          
          <div class="task-meta">
            <div class="task-status">
              <span class="status-badge" :class="task.status">
                {{ formatStatus(task.status) }}
              </span>
            </div>
            
            <div class="task-assignment" v-if="task.assigned_to">
              <img :src="task.assigned_to.avatar_url" :alt="task.assigned_to.name">
              {{ task.assigned_to.name }}
            </div>
            
            <div class="task-due-date" v-if="task.due_date">
              <i class="fas fa-calendar"></i>
              {{ formatDate(task.due_date) }}
            </div>
          </div>
          
          <div class="task-actions">
            <button @click="editTask(task)" class="btn btn-sm btn-secondary">
              <i class="fas fa-edit"></i>
            </button>
            
            <button @click="completeTask(task)" 
                    v-if="task.status !== 'done'" 
                    class="btn btn-sm btn-success">
              <i class="fas fa-check"></i>
            </button>
            
            <button @click="deleteTask(task)" class="btn btn-sm btn-danger">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pagination -->
    <div class="pagination" v-if="pagination.total_pages > 1">
      <button @click="loadTasks(pagination.current_page - 1)" 
              :disabled="pagination.current_page === 1"
              class="btn btn-secondary">
        Previous
      </button>
      
      <span class="page-info">
        Page {{ pagination.current_page }} of {{ pagination.total_pages }}
      </span>
      
      <button @click="loadTasks(pagination.current_page + 1)" 
              :disabled="pagination.current_page === pagination.total_pages"
              class="btn btn-secondary">
        Next
      </button>
    </div>
    
    <!-- Create/Edit Modal -->
    <TaskModal v-if="showModal" 
               :task="selectedTask" 
               :users="users"
               @close="closeModal" 
               @saved="taskSaved" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useTasksStore } from '@/stores/tasks'
import TaskModal from './TaskModal.vue'

export default {
  name: 'TaskList',
  components: {
    TaskModal
  },
  data() {
    return {
      showFilters: false,
      showModal: false,
      selectedTask: null,
      filters: {
        status: '',
        priority: '',
        assigned_to_id: ''
      }
    }
  },
  computed: {
    ...mapState(useTasksStore, ['tasks', 'loading', 'pagination', 'users'])
  },
  mounted() {
    this.loadTasks()
    this.loadUsers()
  },
  methods: {
    ...mapActions(useTasksStore, ['fetchTasks', 'createTask', 'updateTask', 'deleteTask', 'completeTask', 'fetchUsers']),
    
    async loadTasks(page = 1) {
      await this.fetchTasks({ ...this.filters, page })
    },
    
    async loadUsers() {
      await this.fetchUsers()
    },
    
    showCreateModal() {
      this.selectedTask = null
      this.showModal = true
    },
    
    editTask(task) {
      this.selectedTask = task
      this.showModal = true
    },
    
    closeModal() {
      this.showModal = false
      this.selectedTask = null
    },
    
    async taskSaved(taskData) {
      try {
        if (this.selectedTask) {
          await this.updateTask({ id: this.selectedTask.id, ...taskData })
        } else {
          await this.createTask(taskData)
        }
        this.closeModal()
        this.loadTasks()
      } catch (error) {
        console.error('Error saving task:', error)
      }
    },
    
    async completeTask(task) {
      try {
        await this.completeTask(task.id)
        this.loadTasks()
      } catch (error) {
        console.error('Error completing task:', error)
      }
    },
    
    async deleteTask(task) {
      if (confirm('Are you sure you want to delete this task?')) {
        try {
          await this.deleteTask(task.id)
          this.loadTasks()
        } catch (error) {
          console.error('Error deleting task:', error)
        }
      }
    },
    
    formatStatus(status) {
      return status.replace('_', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.task-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.filters-panel {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: 600;
  color: #495057;
}

.filter-group select {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  min-width: 150px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.task-card {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.task-header h3 {
  margin: 0;
  color: #1a202c;
  font-size: 1.1em;
}

.task-priority {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
}

.task-priority.high {
  background: #feb2b2;
  color: #742a2a;
}

.task-priority.medium {
  background: #feebc8;
  color: #744210;
}

.task-priority.low {
  background: #c6f6d5;
  color: #22543d;
}

.task-description {
  color: #4a5568;
  margin-bottom: 15px;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 600;
}

.status-badge.todo {
  background: #e2e8f0;
  color: #4a5568;
}

.status-badge.in_progress {
  background: #bee3f8;
  color: #2c5282;
}

.status-badge.done {
  background: #c6f6d5;
  color: #22543d;
}

.task-assignment {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
}

.task-assignment img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.task-due-date {
  font-size: 0.9em;
  color: #718096;
}

.task-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.page-info {
  color: #4a5568;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #718096;
}

.empty-state i {
  font-size: 3em;
  margin-bottom: 10px;
  display: block;
}

@media (max-width: 768px) {
  .tasks-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-panel {
    flex-direction: column;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
  }
  
  .actions {
    width: 100%;
    justify-content: stretch;
  }
}
</style>
```

### 6. Store (Pinia)
```javascript
// frontend/src/stores/tasks.js
import { defineStore } from 'pinia'
import { axios } from '@/axios'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_count: 0
    },
    users: []
  }),
  
  getters: {
    myTasks: (state) => state.tasks.filter(task => task.assigned_to?.id === currentUser.id),
    unassignedTasks: (state) => state.tasks.filter(task => !task.assigned_to),
    overdueTasks: (state) => state.tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
    ),
    tasksByStatus: (state) => {
      const grouped = {}
      state.tasks.forEach(task => {
        if (!grouped[task.status]) {
          grouped[task.status] = []
        }
        grouped[task.status].push(task)
      })
      return grouped
    }
  },
  
  actions: {
    async fetchTasks(filters = {}) {
      this.loading = true
      try {
        const response = await axios.get('/api/v1/tasks', { params: filters })
        this.tasks = response.data.tasks
        this.pagination = response.data.pagination
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async createTask(taskData) {
      try {
        const response = await axios.post('/api/v1/tasks', taskData)
        this.tasks.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async updateTask({ id, ...taskData }) {
      try {
        const response = await axios.put(`/api/v1/tasks/${id}`, taskData)
        const index = this.tasks.findIndex(task => task.id === id)
        this.tasks[index] = response.data
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async deleteTask(id) {
      try {
        await axios.delete(`/api/v1/tasks/${id}`)
        this.tasks = this.tasks.filter(task => task.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async completeTask(id) {
      try {
        const response = await axios.post(`/api/v1/tasks/${id}/complete`)
        const index = this.tasks.findIndex(task => task.id === id)
        this.tasks[index] = response.data
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async assignTask(id, userId) {
      try {
        const response = await axios.post(`/api/v1/tasks/${id}/assign`, { user_id: userId })
        const index = this.tasks.findIndex(task => task.id === id)
        this.tasks[index] = response.data
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    },
    
    async fetchUsers() {
      try {
        const response = await axios.get('/api/v1/users')
        this.users = response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
})
```

## 🚀 Como Usar este Template

### 1. Copiar e Adaptar
```bash
# Criar nova funcionalidade
cp -r plugins/minha_funcionalidade plugins/nova_funcionalidade

# Adaptar nomes
find plugins/nova_funcionalidade -type f -exec sed -i 's/minha/nova/g' {} \;
find plugins/nova_funcionalidade -type f -exec sed -i 's/funcionalidade/feature/g' {} \;
find plugins/nova_funcionalidade -type f -exec sed -i 's/task/novo_modelo/g' {} \;
```

### 2. Instalar Plugin
```ruby
# Gemfile
gem 'nova_funcionalidade', path: 'plugins/nova_funcionalidade'

# Instalar
bundle install
rails db:migrate
rails assets:precompile
```

### 3. Testar
```bash
# Iniciar servidor
rails server

# Acessar nova funcionalidade
http://localhost:3000/nova_funcionalidade
```

## 📋 Checklist de Implementação

- [ ] Criar estrutura do plugin
- [ ] Implementar model com validações
- [ ] Criar migration
- [ ] Implementar controller CRUD
- [ ] Configurar routes
- [ ] Criar componentes Vue.js
- [ ] Implementar store Pinia
- [ ] Adicionar navegação
- [ ] Implementar filtros
- [ ] Adicionar permissões
- [ ] Testar funcionalidade
- [ ] Documentar código

---

*Template criado para acelerar desenvolvimento de novas funcionalidades no Chatwoot*
