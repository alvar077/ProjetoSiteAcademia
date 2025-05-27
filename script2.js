// Sistema de Administração - Versão Completa
class AdminDashboard {
    constructor() {
        this.data = {
            leads: [],
            matriculas: [],
            contatos: []
        };
        this.baseUrl = window.location.origin;
        this.isLoading = false;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando dashboard admin...');
        try {
            // Primeiro testa a conectividade da API
            await this.testAPI();
            
            // Carrega os dados
            await this.loadDataFromAPI();
            
            // Configura eventos
            this.bindEvents();
            
            // Atualiza o dashboard
            this.updateDashboard();
            
            console.log('✅ Dashboard inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao inicializar dashboard:', error);
            this.showError('Erro ao carregar dados do sistema: ' + error.message);
            this.showOfflineData();
        }
    }

    // Testa conectividade da API
    async testAPI() {
        try {
            const response = await fetch(`${this.baseUrl}/api/test`);
            if (!response.ok) {
                throw new Error(`API indisponível: ${response.status}`);
            }
            const data = await response.json();
            console.log('✅ API conectada:', data.message);
        } catch (error) {
            console.error('❌ Erro na API:', error);
            throw new Error('Servidor não está respondendo. Verifique se o servidor está rodando.');
        }
    }

    // Carregar dados da API com retry
    async loadDataFromAPI() {
        this.setGlobalLoading(true);
        
        try {
            console.log('📥 Carregando dados da API...');
            
            const [leads, matriculas, contatos] = await Promise.all([
                this.fetchData('/api/leads'),
                this.fetchData('/api/matriculas'),
                this.fetchData('/api/contatos')
            ]);

            this.data.leads = Array.isArray(leads) ? leads : [];
            this.data.matriculas = Array.isArray(matriculas) ? matriculas : [];
            this.data.contatos = Array.isArray(contatos) ? contatos : [];

            console.log('📊 Dados carregados:', {
                leads: this.data.leads.length,
                matriculas: this.data.matriculas.length,
                contatos: this.data.contatos.length
            });

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        } finally {
            this.setGlobalLoading(false);
        }
    }

    // Método auxiliar para fazer requisições com retry
    async fetchData(endpoint, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`🔄 Tentativa ${i + 1} para ${endpoint}`);
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log(`✅ Dados obtidos de ${endpoint}:`, data.length, 'itens');
                return data;

            } catch (error) {
                console.error(`❌ Tentativa ${i + 1} falhou para ${endpoint}:`, error.message);
                
                if (i === retries - 1) {
                    throw new Error(`Falha ao carregar ${endpoint} após ${retries} tentativas: ${error.message}`);
                }
                
                // Aguarda antes da próxima tentativa
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // Método para fazer POST
    async postData(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro POST:', error);
            throw error;
        }
    }

    // Método para fazer PUT
    async putData(endpoint, data) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro PUT:', error);
            throw error;
        }
    }

    // Método para fazer DELETE
    async deleteData(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro DELETE:', error);
            throw error;
        }
    }

    // Atualizar dashboard com estatísticas
    updateDashboard() {
        try {
            // Total de matrículas ativas
            const totalMatriculas = this.data.matriculas.filter(m => m.status === 'ativa').length;
            this.updateElement('.total-matriculas', totalMatriculas);

            // Calcular receita estimada
            const receita = this.calculateReceita();
            this.updateElement('.receita-estimada', `R$ ${receita.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);

            // Total de leads
            const totalLeads = this.data.leads.length;
            this.updateElement('.total-aulas-experimentais', totalLeads);

            // Total de contatos
            const totalContatos = this.data.contatos.length;
            this.updateElement('.total-contatos', totalContatos);

            // Renderizar tabelas
            this.renderLeads();
            this.renderMatriculas();
            this.renderContatos();

            console.log('📊 Dashboard atualizado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao atualizar dashboard:', error);
            this.showError('Erro ao atualizar estatísticas');
        }
    }

    updateElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Elemento ${selector} não encontrado`);
        }
    }

    calculateReceita() {
        const precos = {
            'basic': 89.90,
            'premium': 149.90,
            'zen': 119.90
        };

        return this.data.matriculas
            .filter(m => m.status === 'ativa')
            .reduce((total, matricula) => {
                return total + (precos[matricula.plano] || 0);
            }, 0);
    }

    // Renderizar tabela de leads - FUNÇÃO COMPLETA
    renderLeads() {
        const tbody = document.querySelector('#aulas-experimentais-table tbody');
        if (!tbody) {
            console.warn('Tabela de aulas experimentais não encontrada');
            return;
        }

        tbody.innerHTML = '';
        
        if (this.data.leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma aula experimental cadastrada</td></tr>';
            return;
        }

        this.data.leads.forEach((lead) => {
            const row = document.createElement('tr');
            const dataFormatada = this.formatDate(lead.data_cadastro);
            
            row.innerHTML = `
                <td>${this.escapeHtml(lead.nome)}</td>
                <td>${this.escapeHtml(lead.email)}</td>
                <td>${this.escapeHtml(lead.telefone)}</td>
                <td>${this.escapeHtml(lead.modalidade || 'Não especificado')}</td>
                <td>${dataFormatada}</td>
                <td><span class="status-badge status-${lead.status}">${lead.status}</span></td>
                <td class="btn-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="dashboard.toggleStatus('leads', '${lead.id}', '${lead.status}')">
                        ${lead.status === 'novo' ? 'Marcar Ativo' : 'Marcar Novo'}
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboard.removeItem('leads', '${lead.id}')">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Renderizar tabela de matrículas - FUNÇÃO COMPLETA
    renderMatriculas() {
        const tbody = document.querySelector('#matriculas-table tbody');
        if (!tbody) {
            console.warn('Tabela de matrículas não encontrada');
            return;
        }

        tbody.innerHTML = '';
        
        if (this.data.matriculas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma matrícula cadastrada</td></tr>';
            return;
        }

        this.data.matriculas.forEach((matricula) => {
            const row = document.createElement('tr');
            const dataFormatada = this.formatDate(matricula.data_cadastro);
            
            row.innerHTML = `
                <td>${this.escapeHtml(matricula.nome)}</td>
                <td>${this.escapeHtml(matricula.cpf || 'N/A')}</td>
                <td>${this.escapeHtml(matricula.email)}</td>
                <td><span class="badge bg-secondary">${this.escapeHtml(matricula.plano)}</span></td>
                <td>${dataFormatada}</td>
                <td><span class="status-badge status-${matricula.status}">${matricula.status}</span></td>
                <td class="btn-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="dashboard.toggleStatus('matriculas', '${matricula.id}', '${matricula.status}')">
                        ${matricula.status === 'ativa' ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboard.removeItem('matriculas', '${matricula.id}')">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Renderizar tabela de contatos - FUNÇÃO COMPLETA
    renderContatos() {
        const tbody = document.querySelector('#contatos-table tbody');
        if (!tbody) {
            console.warn('Tabela de contatos não encontrada');
            return;
        }

        tbody.innerHTML = '';
        
        if (this.data.contatos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum contato cadastrado</td></tr>';
            return;
        }

        this.data.contatos.forEach((contato) => {
            const row = document.createElement('tr');
            const dataFormatada = this.formatDate(contato.dataContato);
            
            row.innerHTML = `
                <td>${this.escapeHtml(contato.nome)}</td>
                <td>${this.escapeHtml(contato.email)}</td>
                <td>${this.escapeHtml(contato.assunto || 'N/A')}</td>
                <td class="text-truncate" style="max-width: 200px;" title="${this.escapeHtml(contato.mensagem)}">${this.escapeHtml(contato.mensagem.substring(0, 50))}...</td>
                <td>${dataFormatada}</td>
                <td><span class="status-badge status-${contato.status.toLowerCase()}">${contato.status}</span></td>
                <td class="btn-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="dashboard.toggleStatus('contatos', '${contato.id}', '${contato.status}')">
                        ${contato.status === 'Pendente' ? 'Marcar Respondido' : 'Marcar Pendente'}
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="dashboard.removeItem('contatos', '${contato.id}')">Excluir</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Alternar status de um item
    async toggleStatus(type, id, currentStatus) {
        try {
            let newStatus;
            
            switch (type) {
                case 'leads':
                    newStatus = currentStatus === 'novo' ? 'ativo' : 'novo';
                    break;
                case 'matriculas':
                    newStatus = currentStatus === 'ativa' ? 'inativa' : 'ativa';
                    break;
                case 'contatos':
                    newStatus = currentStatus === 'Pendente' ? 'Respondido' : 'Pendente';
                    break;
            }

            await this.putData(`/api/${type}/${id}`, { status: newStatus });
            await this.loadDataFromAPI();
            this.updateDashboard();
            this.showSuccess('Status atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            this.showError('Erro ao atualizar status: ' + error.message);
        }
    }

    // Remover item
    async removeItem(type, id) {
        if (!confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            await this.deleteData(`/api/${type}/${id}`);
            await this.loadDataFromAPI();
            this.updateDashboard();
            this.showSuccess('Item removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover item:', error);
            this.showError('Erro ao remover item: ' + error.message);
        }
    }

    // Recarregar dados
    async refreshData() {
        try {
            this.showLoading();
            await this.loadDataFromAPI();
            this.updateDashboard();
            this.hideLoading();
            this.showSuccess('Dados atualizados com sucesso!');
        } catch (error) {
            this.hideLoading();
            this.showError('Erro ao atualizar dados: ' + error.message);
        }
    }

    // Bind de eventos
    bindEvents() {
        // Botão de refresh
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // Auto-refresh a cada 5 minutos
        setInterval(() => {
            if (!this.isLoading) {
                this.refreshData();
            }
        }, 5 * 60 * 1000);
    }

    // Funções utilitárias
    formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Data inválida';
        }
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    // Funções de UI
    setGlobalLoading(loading) {
        this.isLoading = loading;
        const loadingEl = document.querySelector('.loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = loading ? 'block' : 'none';
        }
    }

    showLoading() {
        this.setGlobalLoading(true);
    }

    hideLoading() {
        this.setGlobalLoading(false);
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showAlert(message, type) {
        // Remove alertas existentes
        const existingAlerts = document.querySelectorAll('.admin-alert');
        existingAlerts.forEach(alert => alert.remove());

        // Criar elemento de alerta
        const alert = document.createElement('div');
        alert.className = `admin-alert alert alert-${type === 'success' ? 'success' : 'danger'}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        alert.innerHTML = `
            <strong>${type === 'success' ? '✅' : '❌'}</strong> ${message}
            <button type="button" class="btn-close ms-2" onclick="this.parentElement.remove()"></button>
        `;

        document.body.appendChild(alert);

        // Remover após 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    showOfflineData() {
        // Mostrar dados de exemplo quando offline
        console.log('📱 Mostrando dados offline...');
        this.data = {
            leads: [],
            matriculas: [],
            contatos: []
        };
        this.updateDashboard();
    }
}

// Inicializar dashboard quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOM carregado, iniciando dashboard...');
    window.dashboard = new AdminDashboard();
});

// Tratamento de erros globais
window.addEventListener('error', (e) => {
    console.error('❌ Erro global JavaScript:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Promise rejeitada:', e.reason);
});
