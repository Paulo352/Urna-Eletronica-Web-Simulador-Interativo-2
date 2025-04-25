// Constantes do sistema
const NULL_VOTE = "null";
const BLANK_VOTE = "blank";
const DEFAULT_PASSWORD = "admin";
const ELECTION_ROLES = ['Prefeito', 'Vereador'];

// Variáveis globais
let currentNumber = '';
let currentCandidate = null;
let adminPassword = DEFAULT_PASSWORD;
let currentAction = null;
let candidatePhotoUrl = null;
let currentRole = ELECTION_ROLES[0];
let accessibilityMode = false;
let electionActive = true;
let electionEndTime = new Date();
electionEndTime.setHours(electionEndTime.getHours() + 2); // 2 horas de eleição

// Inicialização dos dados
function initializeData() {
    if (!localStorage.getItem('candidates')) {
        localStorage.setItem('candidates', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('votes')) {
        localStorage.setItem('votes', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('adminPassword')) {
        localStorage.setItem('adminPassword', DEFAULT_PASSWORD);
    } else {
        adminPassword = localStorage.getItem('adminPassword');
    }
    
    if (!localStorage.getItem('electionRoles')) {
        localStorage.setItem('electionRoles', JSON.stringify(ELECTION_ROLES));
    } else {
        currentRole = JSON.parse(localStorage.getItem('electionRoles'))[0];
    }
    
    if (!localStorage.getItem('electionEndTime')) {
        localStorage.setItem('electionEndTime', electionEndTime.toISOString());
    } else {
        electionEndTime = new Date(localStorage.getItem('electionEndTime'));
    }
    
    updateRoleDisplay();
    checkElectionTime();
}

// Atualiza o relógio
function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    clock.textContent = now.toLocaleTimeString();
    
    // Verifica se o tempo da eleição acabou
    if (now >= electionEndTime && electionActive) {
        electionActive = false;
        alert('O tempo da eleição terminou! A urna está encerrada.');
    }
    
    setTimeout(updateClock, 1000);
}

// Funções da urna
function addNumber(num) {
    if (!electionActive) return;
    if (currentNumber.length < 2) {
        currentNumber += num;
        updateDisplay();
        checkCandidate();
        
        // Feedback de acessibilidade
        if (accessibilityMode) {
            speak(`Digitado ${num}`);
        }
    }
}

function correct() {
    currentNumber = '';
    currentCandidate = null;
    updateDisplay();
    document.getElementById('candidate-info').innerHTML = '';
    
    if (accessibilityMode) {
        speak('Voto corrigido');
    }
}

function backspace() {
    if (currentNumber.length > 0) {
        currentNumber = currentNumber.slice(0, -1);
        updateDisplay();
        
        if (currentNumber.length === 0) {
            document.getElementById('candidate-info').innerHTML = '';
            currentCandidate = null;
        } else {
            checkCandidate();
        }
        
        if (accessibilityMode) {
            speak('Número apagado');
        }
    }
}

function voteNull() {
    if (!electionActive) return;
    if (confirm("Deseja votar NULO?")) {
        registerVote(NULL_VOTE);
        alert("Voto NULO confirmado!");
        correct();
        
        if (accessibilityMode) {
            speak('Voto nulo confirmado');
        }
    }
}

function voteBlank() {
    if (!electionActive) return;
    if (confirm("Deseja votar em BRANCO?")) {
        registerVote(BLANK_VOTE);
        alert("Voto em BRANCO confirmado!");
        correct();
        
        if (accessibilityMode) {
            speak('Voto em branco confirmado');
        }
    }
}

function confirmVote() {
    if (!electionActive) return;
    
    if (currentNumber.length === 0) {
        voteBlank();
        return;
    }

    if (currentNumber.length !== 2) {
        alert('Digite 2 números para votar!');
        return;
    }

    if (!currentCandidate) {
        voteNull();
        return;
    }

    registerVote(currentNumber);
    alert(`Voto confirmado para ${currentCandidate.name} (${currentCandidate.party})!`);
    correct();
    
    if (accessibilityMode) {
        speak(`Voto confirmado para ${currentCandidate.name}`);
    }
}

function registerVote(voteType) {
    const votes = JSON.parse(localStorage.getItem('votes'));
    const voteData = {
        type: voteType,
        role: currentRole,
        timestamp: new Date().toISOString(),
        hash: generateVoteHash(voteType)
    };
    votes.push(voteData);
    localStorage.setItem('votes', JSON.stringify(votes));
}

function generateVoteHash(voteType) {
    // Cria um hash simples para auditoria (não é criptograficamente seguro, apenas para demonstração)
    const data = `${voteType}-${currentRole}-${new Date().getTime()}-${Math.random()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Converte para 32bit integer
    }
    return hash.toString(16);
}

function updateDisplay() {
    document.getElementById('vote-input').value = currentNumber;
}

function checkCandidate() {
    if (currentNumber.length === 2) {
        const candidates = JSON.parse(localStorage.getItem('candidates'));
        currentCandidate = candidates.find(c => c.number === currentNumber && c.role === currentRole);
        
        const infoDiv = document.getElementById('candidate-info');
        if (currentCandidate) {
            let photoHTML = currentCandidate.photo 
                ? `<img src="${currentCandidate.photo}" alt="${currentCandidate.name}">`
                : '<div class="photo-placeholder"><i class="fas fa-user"></i></div>';
            
            infoDiv.innerHTML = `
                <div class="candidate-photo">${photoHTML}</div>
                <div class="candidate-display">
                    <span class="candidate-name">${currentCandidate.name}</span>
                    <span class="candidate-party">${currentCandidate.party}</span>
                </div>
            `;
            
            if (accessibilityMode) {
                speak(`Candidato ${currentCandidate.name}, ${currentCandidate.party}`);
            }
        } else {
            infoDiv.innerHTML = '<div style="color:red;">Número não cadastrado (voto será NULO)</div>';
            
            if (accessibilityMode) {
                speak('Número não cadastrado, voto será nulo');
            }
        }
    }
}

// Funções administrativas
function showAdminLogin(action) {
    currentAction = action;
    const modalContent = `
        <h2><i class="fas fa-lock"></i> Acesso Administrativo</h2>
        <div class="form-group">
            <label for="password">Senha:</label>
            <input type="password" id="password" placeholder="Digite a senha" autofocus>
        </div>
        <button onclick="verifyAdminPassword()" class="btn btn-primary">
            <i class="fas fa-sign-in-alt"></i> Acessar
        </button>
    `;
    
    showModal(modalContent);
}

function verifyAdminPassword() {
    const password = document.getElementById('password').value;
    if (password === adminPassword) {
        switch(currentAction) {
            case 'report':
                generatePDF();
                break;
            case 'register':
                showCandidateForm();
                break;
            case 'roles':
                showRolesManagement();
                break;
            case 'password':
                showPasswordForm();
                break;
            case 'reset':
                showResetConfirmation();
                break;
            default:
                closeModal();
        }
    } else {
        alert('Senha incorreta!');
        document.getElementById('password').value = '';
    }
}

function showRolesManagement() {
    const roles = JSON.parse(localStorage.getItem('electionRoles')) || ELECTION_ROLES;
    
    let rolesHTML = roles.map(role => `
        <div class="role-item">
            <input type="text" value="${role}" class="role-input">
            <button onclick="removeRole('${role}')" class="btn btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    const modalContent = `
        <h2><i class="fas fa-exchange-alt"></i> Gerenciar Cargos</h2>
        <div id="roles-list">
            ${rolesHTML}
        </div>
        <div class="form-group">
            <input type="text" id="new-role" placeholder="Novo cargo">
            <button onclick="addRole()" class="btn btn-primary">
                <i class="fas fa-plus"></i> Adicionar
            </button>
        </div>
        <div class="form-group">
            <label>Cargo Atual:</label>
            <select id="current-role-select" class="form-control">
                ${roles.map(role => `<option value="${role}" ${role === currentRole ? 'selected' : ''}>${role}</option>`).join('')}
            </select>
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="saveRoles()" class="btn btn-primary" style="flex: 1;">
                <i class="fas fa-save"></i> Salvar
            </button>
            <button onclick="closeModal()" class="btn btn-danger">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    showModal(modalContent);
}

function addRole() {
    const newRole = document.getElementById('new-role').value.trim();
    if (newRole) {
        const rolesList = document.getElementById('roles-list');
        rolesList.innerHTML += `
            <div class="role-item">
                <input type="text" value="${newRole}" class="role-input">
                <button onclick="removeRole('${newRole}')" class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        document.getElementById('new-role').value = '';
    }
}

function removeRole(role) {
    if (confirm(`Remover o cargo "${role}"?`)) {
        const roleItem = event.target.closest('.role-item');
        roleItem.remove();
    }
}

function saveRoles() {
    const roleInputs = document.querySelectorAll('.role-input');
    const roles = Array.from(roleInputs).map(input => input.value.trim()).filter(role => role);
    
    if (roles.length === 0) {
        alert('Adicione pelo menos um cargo!');
        return;
    }
    
    localStorage.setItem('electionRoles', JSON.stringify(roles));
    
    const selectedRole = document.getElementById('current-role-select').value;
    currentRole = selectedRole;
    localStorage.setItem('currentRole', currentRole);
    
    updateRoleDisplay();
    alert('Cargos atualizados com sucesso!');
    closeModal();
}

function updateRoleDisplay() {
    document.getElementById('current-role').textContent = currentRole ? ` - ${currentRole}` : '';
}

function showCandidateForm() {
    const roles = JSON.parse(localStorage.getItem('electionRoles')) || ELECTION_ROLES;
    
    const modalContent = `
        <h2><i class="fas fa-user-plus"></i> Cadastrar Candidato</h2>
        <div class="form-group">
            <label for="candidate-role">Cargo:</label>
            <select id="candidate-role" class="form-control">
                ${roles.map(role => `<option value="${role}">${role}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label for="candidate-number">Número (2 dígitos):</label>
            <input type="text" id="candidate-number" maxlength="2" 
                   oninput="this.value=this.value.replace(/[^0-9]/g,'')" 
                   placeholder="Ex: 99" required>
        </div>
        <div class="form-group">
            <label for="candidate-name">Nome:</label>
            <input type="text" id="candidate-name" placeholder="Nome do candidato" required>
        </div>
        <div class="form-group">
            <label for="candidate-party">Partido:</label>
            <input type="text" id="candidate-party" placeholder="Sigla do partido" required>
        </div>
        <div class="form-group">
            <label>Foto do Candidato:</label>
            <div id="register-preview">
                <i class="fas fa-user"></i>
            </div>
            <div class="photo-options">
                <button onclick="openFileExplorer()" class="photo-option-btn">
                    <i class="fas fa-folder-open"></i> Escolher Foto
                </button>
            </div>
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="registerCandidate()" class="btn btn-primary" style="flex: 1;">
                <i class="fas fa-save"></i> Salvar
            </button>
            <button onclick="closeModal()" class="btn btn-danger">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    showModal(modalContent);
    candidatePhotoUrl = null;
}

// ... (restante das funções administrativas permanecem iguais)

// Funções de acessibilidade
function toggleAccessibility() {
    accessibilityMode = !accessibilityMode;
    if (accessibilityMode) {
        alert('Modo acessibilidade ativado');
        speak('Modo acessibilidade ativado');
    } else {
        alert('Modo acessibilidade desativado');
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        speechSynthesis.speak(utterance);
    }
}

// Funções de biometria simulada
function showBiometricModal() {
    document.getElementById('biometric-modal').style.display = 'block';
}

function closeBiometricModal() {
    document.getElementById('biometric-modal').style.display = 'none';
}

function simulateBiometric() {
    document.getElementById('biometric-status').textContent = 'Autenticando...';
    setTimeout(() => {
        document.getElementById('biometric-status').textContent = 'Autenticação bem-sucedida!';
        setTimeout(() => {
            closeBiometricModal();
            alert('Autenticação biométrica confirmada. Pode votar.');
        }, 1000);
    }, 2000);
}

// Verifica tempo da eleição
function checkElectionTime() {
    const now = new Date();
    if (now >= electionEndTime) {
        electionActive = false;
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    updateClock();
    
    // Fecha o modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
            closeBiometricModal();
        }
    });
    
    // Verifica se é a primeira visita para mostrar biometria simulada
    if (!localStorage.getItem('biometricShown')) {
        setTimeout(showBiometricModal, 2000);
        localStorage.setItem('biometricShown', 'true');
    }
});