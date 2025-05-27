const API_BASE_URL = 'http://localhost:3000/api';

// Estado global da aplicação
const appState = {
    currentSlide: 0,
    totalSlides: 0,
    isLoading: false
};

// Inicialização quando DOM carrega
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupMobileMenu();
    setupModalEvents();
    setupFormHandlers();
    setupFilters();
    setupSlider();
    setupFormValidations();
}

// Menu Mobile
function setupMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const menu = document.querySelector('.menu');
    
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            menu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }
}

// Modais
function setupModalEvents() {
    const modal = document.getElementById('modal-matricula');
    const matriculaBtns = document.querySelectorAll('.btn-matricula');
    const closeBtn = document.querySelector('.close');

    if (modal && matriculaBtns.length > 0) {
        matriculaBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plano = e.target.getAttribute('data-plano');
                openMatriculaModal(plano);
            });
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

function openMatriculaModal(plano) {
    const modal = document.getElementById('modal-matricula');
    const planoSelect = document.getElementById('plano-escolhido');
    
    if (modal && planoSelect) {
        // Limpa e popula o select de planos
        planoSelect.innerHTML = `
            <option value="">Selecione o plano</option>
            <option value="basic">Plano Basic - R$ 89,90/mês</option>
            <option value="premium">Plano Premium - R$ 149,90/mês</option>
            <option value="zen">Plano Zen - R$ 119,90/mês</option>
        `;
        
        if (plano) {
            planoSelect.value = plano;
        }
        
        modal.style.display = 'block';
    }
}

// Filtros de planos
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filtro-btn');
    const planoCards = document.querySelectorAll('.plano-card');
    
    if (filterBtns.length > 0 && planoCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const objetivo = e.target.getAttribute('data-objetivo');
                
                // Atualiza botões ativos
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Filtra cards
                planoCards.forEach(card => {
                    const cardObjetivos = card.getAttribute('data-objetivo');
                    if (objetivo === 'todos' || cardObjetivos.includes(objetivo)) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 100);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
}

// Slider de depoimentos
function setupSlider() {
    const depoimentos = document.querySelectorAll('.depoimento');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (depoimentos.length > 0) {
        appState.totalSlides = depoimentos.length;
        
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => changeSlide(-1));
            nextBtn.addEventListener('click', () => changeSlide(1));
        }

        // Auto-play do slider
        setInterval(() => {
            changeSlide(1);
        }, 5000);
    }
}

function changeSlide(direction) {
    const depoimentos = document.querySelectorAll('.depoimento');
    if (depoimentos.length === 0) return;

    depoimentos[appState.currentSlide].classList.remove('active');
    
    appState.currentSlide += direction;
    if (appState.currentSlide >= appState.totalSlides) {
        appState.currentSlide = 0;
    } else if (appState.currentSlide < 0) {
        appState.currentSlide = appState.totalSlides - 1;
    }

    depoimentos[appState.currentSlide].classList.add('active');
}

// Manipuladores de formulários
function setupFormHandlers() {
    // Formulário de aula experimental
    const formExperimental = document.getElementById('form-experimental');
    if (formExperimental) {
        formExperimental.addEventListener('submit', handleAulaExperimental);
    }

    // Formulário de matrícula
    const formMatricula = document.getElementById('form-matricula');
    if (formMatricula) {
        formMatricula.addEventListener('submit', handleMatricula);
    }

    // Formulário de contato
    const formContato = document.getElementById('form-contato');
    if (formContato) {
        formContato.addEventListener('submit', handleContato);
    }
}

// Validações de formulário
function setupFormValidations() {
    // Validação de CPF em tempo real
    const cpfInput = document.getElementById('cpf-matricula');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})/, '$1-$2');
            value = value.replace(/(-\d{2})\d+?$/, '$1');
            e.target.value = value;
        });

        cpfInput.addEventListener('blur', (e) => {
            if (!validateCPF(e.target.value)) {
                showFieldError(e.target, 'CPF inválido');
            } else {
                clearFieldError(e.target);
            }
        });
    }

    // Validação de telefone
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d)(\d{4})$/, '$1-$2');
            e.target.value = value;
        });
    });
}

// Handlers dos formulários
async function handleAulaExperimental(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('nome-exp').value,
        email: document.getElementById('email-exp').value,
        telefone: document.getElementById('telefone-exp').value,
        modalidade: document.getElementById('modalidade-exp').value
    };

    try {
        setFormLoading(e.target, true);
        const response = await fetch(`${API_BASE_URL}/leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showSuccessMessage(e.target, 'Aula experimental agendada! Entraremos em contato em breve.');
            e.target.reset();
            trackEvent('aula_experimental_agendada', {
                modalidade: formData.modalidade
            });
        } else {
            throw new Error('Erro no servidor');
        }
    } catch (error) {
        showErrorMessage(e.target, 'Erro ao agendar aula. Tente novamente.');
        console.error('Erro:', error);
    } finally {
        setFormLoading(e.target, false);
    }
}

async function handleMatricula(e) {
    e.preventDefault();
    
    const cpf = document.getElementById('cpf-matricula').value;
    if (!validateCPF(cpf)) {
        showErrorMessage(e.target, 'CPF inválido. Verifique e tente novamente.');
        return;
    }

    const formData = {
        nome: document.getElementById('nome-matricula').value,
        cpf: cpf,
        email: document.getElementById('email-matricula').value,
        telefone: document.getElementById('telefone-matricula').value,
        plano: document.getElementById('plano-escolhido').value,
        aceite_termos: document.getElementById('aceite-termos').checked
    };

    try {
        setFormLoading(e.target, true);
        const response = await fetch(`${API_BASE_URL}/matriculas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const result = await response.json();
            showSuccessMessage(e.target, 'Matrícula realizada com sucesso! ID: ' + result.id);
            e.target.reset();
            document.getElementById('modal-matricula').style.display = 'none';
            trackEvent('matricula_realizada', {
                plano: formData.plano,
                valor: getPlanoValue(formData.plano)
            });
        } else {
            throw new Error('Erro no servidor');
        }
    } catch (error) {
        showErrorMessage(e.target, 'Erro ao realizar matrícula. Tente novamente.');
        console.error('Erro:', error);
    } finally {
        setFormLoading(e.target, false);
    }
}

async function handleContato(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('nome-contato').value,
        email: document.getElementById('email-contato').value,
        telefone: document.getElementById('telefone-contato').value,
        assunto: document.getElementById('assunto-contato').value,
        mensagem: document.getElementById('mensagem-contato').value
    };

    try {
        setFormLoading(e.target, true);
        const response = await fetch(`${API_BASE_URL}/contatos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showSuccessMessage(e.target, 'Mensagem enviada com sucesso! Responderemos em breve.');
            e.target.reset();
        } else {
            throw new Error('Erro no servidor');
        }
    } catch (error) {
        showErrorMessage(e.target, 'Erro ao enviar mensagem. Tente novamente.');
        console.error('Erro:', error);
    } finally {
        setFormLoading(e.target, false);
    }
}

// Funções utilitárias
function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    
    const cpfDigits = cpf.split('').map(el => +el);
    const rest = (count) => {
        return (cpfDigits.slice(0, count-12)
            .reduce((soma, el, index) => (soma + el * (count-index)), 0)*10) % 11 % 10;
    };
    return rest(10) === cpfDigits[9] && rest(11) === cpfDigits[10];
}

function setFormLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (loading) {
        form.classList.add('loading');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }
    } else {
        form.classList.remove('loading');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.getAttribute('data-original-text') || 'Enviar';
        }
    }
}

function showSuccessMessage(form, message) {
    removeMessages(form);
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    form.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showErrorMessage(form, message) {
    removeMessages(form);
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    form.appendChild(messageDiv);
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function removeMessages(form) {
    const messages = form.querySelectorAll('.success-message, .error-message');
    messages.forEach(msg => msg.remove());
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.style.borderColor = '#dc2626';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(field) {
    field.style.borderColor = '#ddd';
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) errorDiv.remove();
}

function getPlanoValue(plano) {
    const valores = {
        'basic': 89.90,
        'premium': 149.90,
        'zen': 119.90
    };
    return valores[plano] || 0;
}

function trackEvent(eventName, properties) {
    console.log('Event tracked:', eventName, properties);
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
}

// Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Lazy loading para imagens
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Performance monitoring
window.addEventListener('load', () => {
    setTimeout(() => {
        if ('performance' in window) {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`Page load time: ${loadTime}ms`);
        }
    }, 0);
});
