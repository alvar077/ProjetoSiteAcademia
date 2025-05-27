const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

async function initDatabase() {
    try {
        await fs.access(DB_FILE);
        console.log('Database encontrado');
    } catch {
        console.log('Criando database inicial...');
        const initialData = {
            leads: [],
            matriculas: [],
            contatos: []
        };
        await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
        console.log('Database criado com sucesso');
    }
}

async function readDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler database:', error);
        return { leads: [], matriculas: [], contatos: [] };
    }
}

async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao escrever no database:', error);
        return false;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/leads', async (req, res) => {
    try {
        const db = await readDatabase();
        console.log('Leads encontrados:', db.leads.length);
        res.json(db.leads || []);
    } catch (error) {
        console.error('Erro ao buscar leads:', error);
        res.status(500).json({ error: 'Erro ao buscar leads', details: error.message });
    }
});

app.get('/api/matriculas', async (req, res) => {
    try {
        const db = await readDatabase();
        console.log('Matrículas encontradas:', db.matriculas.length);
        res.json(db.matriculas || []);
    } catch (error) {
        console.error('Erro ao buscar matrículas:', error);
        res.status(500).json({ error: 'Erro ao buscar matrículas', details: error.message });
    }
});

app.get('/api/contatos', async (req, res) => {
    try {
        const db = await readDatabase();
        console.log('Contatos encontrados:', db.contatos.length);
        res.json(db.contatos || []);
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).json({ error: 'Erro ao buscar contatos', details: error.message });
    }
});

app.post('/api/leads', async (req, res) => {
    try {
        const { nome, email, telefone, modalidade } = req.body;
        if (!nome || !email || !telefone) {
            return res.status(400).json({ error: 'Campos obrigatórios: nome, email, telefone' });
        }

        const db = await readDatabase();
        const newLead = {
            id: Date.now().toString(),
            nome,
            email,
            telefone,
            modalidade: modalidade || 'Não especificado',
            tipo: 'aula_experimental',
            data_cadastro: new Date().toISOString(),
            status: 'novo'
        };

        if (!db.leads) db.leads = [];
        db.leads.push(newLead);
        
        if (await writeDatabase(db)) {
            console.log('Lead criado:', newLead.id);
            res.status(201).json(newLead);
        } else {
            res.status(500).json({ error: 'Erro ao salvar lead' });
        }
    } catch (error) {
        console.error('Erro ao criar lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/matriculas', async (req, res) => {
    try {
        const { nome, email, telefone, cpf, plano, aceite_termos } = req.body;
        if (!nome || !email || !telefone || !plano) {
            return res.status(400).json({ error: 'Campos obrigatórios: nome, email, telefone, plano' });
        }

        const db = await readDatabase();
        const newMatricula = {
            id: Date.now().toString(),
            nome,
            email,
            telefone,
            cpf,
            plano,
            aceite_termos: !!aceite_termos,
            data_cadastro: new Date().toISOString(),
            status: 'ativa'
        };

        if (!db.matriculas) db.matriculas = [];
        db.matriculas.push(newMatricula);
        
        if (await writeDatabase(db)) {
            console.log('Matrícula criada:', newMatricula.id);
            res.status(201).json(newMatricula);
        } else {
            res.status(500).json({ error: 'Erro ao salvar matrícula' });
        }
    } catch (error) {
        console.error('Erro ao criar matrícula:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/contatos', async (req, res) => {
    try {
        const { nome, email, telefone, mensagem, assunto } = req.body;
        if (!nome || !email || !mensagem) {
            return res.status(400).json({ error: 'Campos obrigatórios: nome, email, mensagem' });
        }

        const db = await readDatabase();
        const newContato = {
            id: Date.now().toString(),
            nome,
            email,
            telefone: telefone || 'Não informado',
            mensagem,
            assunto: assunto || 'Contato geral',
            dataContato: new Date().toISOString(),
            status: 'Pendente'
        };

        if (!db.contatos) db.contatos = [];
        db.contatos.push(newContato);
        
        if (await writeDatabase(db)) {
            console.log('Contato criado:', newContato.id);
            res.status(201).json(newContato);
        } else {
            res.status(500).json({ error: 'Erro ao salvar contato' });
        }
    } catch (error) {
        console.error('Erro ao criar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const db = await readDatabase();
        
        if (!db.leads) db.leads = [];
        const leadIndex = db.leads.findIndex(lead => lead.id === id);

        if (leadIndex === -1) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }

        db.leads[leadIndex] = { ...db.leads[leadIndex], ...updateData };
        if (await writeDatabase(db)) {
            console.log('Lead atualizado:', id);
            res.json(db.leads[leadIndex]);
        } else {
            res.status(500).json({ error: 'Erro ao atualizar lead' });
        }
    } catch (error) {
        console.error('Erro ao atualizar lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/matriculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const db = await readDatabase();
        
        if (!db.matriculas) db.matriculas = [];
        const matriculaIndex = db.matriculas.findIndex(matricula => matricula.id === id);

        if (matriculaIndex === -1) {
            return res.status(404).json({ error: 'Matrícula não encontrada' });
        }

        db.matriculas[matriculaIndex] = { ...db.matriculas[matriculaIndex], ...updateData };
        if (await writeDatabase(db)) {
            console.log('Matrícula atualizada:', id);
            res.json(db.matriculas[matriculaIndex]);
        } else {
            res.status(500).json({ error: 'Erro ao atualizar matrícula' });
        }
    } catch (error) {
        console.error('Erro ao atualizar matrícula:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/contatos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const db = await readDatabase();
        
        if (!db.contatos) db.contatos = [];
        const contatoIndex = db.contatos.findIndex(contato => contato.id === id);

        if (contatoIndex === -1) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        db.contatos[contatoIndex] = { ...db.contatos[contatoIndex], ...updateData };
        if (await writeDatabase(db)) {
            console.log('Contato atualizado:', id);
            res.json(db.contatos[contatoIndex]);
        } else {
            res.status(500).json({ error: 'Erro ao atualizar contato' });
        }
    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/leads/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await readDatabase();
        
        if (!db.leads) db.leads = [];
        const initialLength = db.leads.length;
        db.leads = db.leads.filter(lead => lead.id !== id);

        if (db.leads.length === initialLength) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }

        if (await writeDatabase(db)) {
            console.log('Lead removido:', id);
            res.json({ message: 'Lead removido com sucesso' });
        } else {
            res.status(500).json({ error: 'Erro ao remover lead' });
        }
    } catch (error) {
        console.error('Erro ao remover lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/matriculas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await readDatabase();
        
        if (!db.matriculas) db.matriculas = [];
        const initialLength = db.matriculas.length;
        db.matriculas = db.matriculas.filter(matricula => matricula.id !== id);

        if (db.matriculas.length === initialLength) {
            return res.status(404).json({ error: 'Matrícula não encontrada' });
        }

        if (await writeDatabase(db)) {
            console.log('Matrícula removida:', id);
            res.json({ message: 'Matrícula removida com sucesso' });
        } else {
            res.status(500).json({ error: 'Erro ao remover matrícula' });
        }
    } catch (error) {
        console.error('Erro ao remover matrícula:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/api/contatos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await readDatabase();
        
        if (!db.contatos) db.contatos = [];
        const initialLength = db.contatos.length;
        db.contatos = db.contatos.filter(contato => contato.id !== id);

        if (db.contatos.length === initialLength) {
            return res.status(404).json({ error: 'Contato não encontrado' });
        }

        if (await writeDatabase(db)) {
            console.log('Contato removido:', id);
            res.json({ message: 'Contato removido com sucesso' });
        } else {
            res.status(500).json({ error: 'Erro ao remover contato' });
        }
    } catch (error) {
        console.error('Erro ao remover contato:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/test', (req, res) => {
    res.json({
        message: 'API funcionando!',
        timestamp: new Date().toISOString(),
        database: DB_FILE
    });
});

app.use((err, req, res, next) => {
    console.error('Erro global:', err);
    res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

async function startServer() {
    try {
        await initDatabase();
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📱 Site: http://localhost:${PORT}`);
            console.log(`⚙️  Admin: http://localhost:${PORT}/admin.html`);
            console.log(`🔧 API Test: http://localhost:${PORT}/api/test`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
