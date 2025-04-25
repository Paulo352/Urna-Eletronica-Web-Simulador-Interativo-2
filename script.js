// Constantes do sistema
const NULL_VOTE = "null";
const BLANK_VOTE = "blank";
const DEFAULT_PASSWORD = "admin";
const DEFAULT_ROLES = ['Prefeito', 'Vereador'];

// Variáveis globais
let currentNumber = '';
let currentCandidate = null;
let adminPassword = DEFAULT_PASSWORD;
let currentAction = null;
let candidatePhotoUrl = null;
let currentRole = DEFAULT_ROLES[0];
let accessibilityMode = false;
let electionActive = true;
let electionEndTime = new Date();
electionEndTime.setHours(electionEndTime.getHours() + 2); // 2 horas de eleição

// Inicialização dos dados
function initializeData() {
    // Candidatos
    if (!localStorage.getItem('candidates')) {
        localStorage.setItem('candidates', JSON.stringify([]));
    }
    
    // Votos
    if (!localStorage.getItem('votes')) {
        localStorage.setItem('votes', JSON.stringify([]));
    }
    
    // Senha admin
    if (!localStorage.getItem('adminPassword')) {
        localStorage.setItem('adminPassword', DEFAULT_PASSWORD);
    } else {
        adminPassword = localStorage.getItem('adminPassword');
    }
    
    // Cargos
    if (!localStorage.getItem('electionRoles')) {
        localStorage.setItem('electionRoles', JSON.stringify(DEFAULT_ROLES));
    }
    
    // Cargo atual
    if (localStorage.getItem('currentRole')) {
        currentRole = localStorage.getItem('currentRole');
    }
    
    // Tempo de eleição
    if (localStorage.getItem('electionEndTime')) {
        electionEndTime = new Date(localStorage.getItem('electionEndTime'));
    } else {
        localStorage.setItem('electionEndTime', electionEndTime.toISOString());
    }
    
    updateRoleDisplay();
    checkElectionTime();
}

// Atualiza o relógio
// Adicione esta função no seu script.js existente
function getBrasiliaTime() {
    const now = new Date();
    const offset = -3; // UTC-3 para Brasília (BRT)
    return new Date(now.getTime() + (offset * 60 * 60 * 1000));
}

// Substitua a função updateClock existente por esta:
function updateClock() {
    const brasiliaTime = getBrasiliaTime();
    const clock = document.getElementById('clock');
    
    // Formatação completa com data e hora
    const options = {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    try {
        // Tenta usar Intl para formatação precisa (melhor método)
        clock.textContent = new Intl.DateTimeFormat('pt-BR', options).format(brasiliaTime) + ' (BRT)';
    } catch (e) {
        // Fallback caso Intl não esteja disponível
        const hours = String(brasiliaTime.getHours()).padStart(2, '0');
        const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
        const seconds = String(brasiliaTime.getSeconds()).padStart(2, '0');
        const day = String(brasiliaTime.getDate()).padStart(2, '0');
        const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
        const year = brasiliaTime.getFullYear();
        
        clock.textContent = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} (BRT)`;
    }
    
    setTimeout(updateClock, 1000);
}

// Modifique a verificação do tempo de eleição para usar horário de Brasília
function checkElectionTime() {
    const now = getBrasiliaTime();
    if (now >= electionEndTime && electionActive) {
        electionActive = false;
        alert('O tempo da eleição terminou! A urna está encerrada.');
    }
 }
   
    // Verifica se o tempo da eleição acabou
    if (now >= electionEndTime && electionActive) {
        electionActive = false;
        alert('O tempo da eleição terminou! A urna está encerrada.');
    }
    
    setTimeout(updateClock, 1000);


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
    // Cria um hash simples para auditoria
    const data = `${voteType}-${currentRole}-${new Date().getTime()}-${Math.random()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
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
    const roles = JSON.parse(localStorage.getItem('electionRoles')) || DEFAULT_ROLES;
    
    let rolesHTML = roles.map(role => `
        <div class="role-item">
            <input type="text" value="${role}" class="role-input">
            <button onclick="removeRole(this)" class="btn btn-danger">
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
                <button onclick="removeRole(this)" class="btn btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        document.getElementById('new-role').value = '';
    }
}

function removeRole(button) {
    const roleItem = button.closest('.role-item');
    const roleName = roleItem.querySelector('.role-input').value;
    
    if (confirm(`Remover o cargo "${roleName}"?`)) {
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
    const roles = JSON.parse(localStorage.getItem('electionRoles')) || DEFAULT_ROLES;
    
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
                <button onclick="document.getElementById('file-input').click()" class="photo-option-btn">
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

function registerCandidate() {
    const role = document.getElementById('candidate-role').value;
    const number = document.getElementById('candidate-number').value;
    const name = document.getElementById('candidate-name').value;
    const party = document.getElementById('candidate-party').value;

    if (!number || number.length !== 2 || isNaN(number)) {
        alert('Número inválido! Deve conter 2 dígitos.');
        return;
    }

    if (!name || name.trim() === '') {
        alert('Digite o nome do candidato!');
        return;
    }

    if (!party || party.trim() === '') {
        alert('Digite a sigla do partido!');
        return;
    }

    const candidates = JSON.parse(localStorage.getItem('candidates')) || [];
    
    if (candidates.some(c => c.number === number && c.role === role)) {
        alert('Já existe um candidato com este número para este cargo!');
        return;
    }

    const newCandidate = { 
        role,
        number, 
        name: name.trim(), 
        party: party.trim().toUpperCase(),
        photo: candidatePhotoUrl 
    };

    candidates.push(newCandidate);
    localStorage.setItem('candidates', JSON.stringify(candidates));
    alert('Candidato cadastrado com sucesso!');
    closeModal();
}

function showPasswordForm() {
    const modalContent = `
        <h2><i class="fas fa-key"></i> Alterar Senha</h2>
        <div class="form-group">
            <label for="current-password">Senha atual:</label>
            <input type="password" id="current-password" placeholder="Digite a senha atual" required>
        </div>
        <div class="form-group">
            <label for="new-password">Nova senha:</label>
            <input type="password" id="new-password" placeholder="Digite a nova senha" required>
        </div>
        <div class="form-group">
            <label for="confirm-password">Confirmar nova senha:</label>
            <input type="password" id="confirm-password" placeholder="Confirme a nova senha" required>
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="changeAdminPassword()" class="btn btn-primary" style="flex: 1;">
                <i class="fas fa-save"></i> Alterar
            </button>
            <button onclick="closeModal()" class="btn btn-danger">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    showModal(modalContent);
}

function changeAdminPassword() {
    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;

    if (currentPass !== adminPassword) {
        alert('Senha atual incorreta!');
        return;
    }

    if (newPass !== confirmPass) {
        alert('As novas senhas não coincidem!');
        return;
    }

    if (newPass.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres!');
        return;
    }

    adminPassword = newPass;
    localStorage.setItem('adminPassword', adminPassword);
    alert('Senha alterada com sucesso!');
    closeModal();
}

function showResetConfirmation() {
    const modalContent = `
        <h2><i class="fas fa-exclamation-triangle"></i> Zerar Urna</h2>
        <div class="form-group">
            <label for="reset-password">Senha administrativa:</label>
            <input type="password" id="reset-password" placeholder="Digite a senha" required>
        </div>
        <p style="color: red; font-weight: bold;">Esta ação apagará TODOS os dados!</p>
        <div style="display: flex; gap: 10px;">
            <button onclick="resetUrn()" class="btn btn-danger" style="flex: 1;">
                <i class="fas fa-trash-alt"></i> Confirmar
            </button>
            <button onclick="closeModal()" class="btn">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    showModal(modalContent);
}

function resetUrn() {
    const password = document.getElementById('reset-password').value;
    if (password !== adminPassword) {
        alert('Senha administrativa incorreta!');
        return;
    }

    if (confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita!')) {
        localStorage.removeItem('votes');
        localStorage.removeItem('candidates');
        localStorage.removeItem('electionRoles');
        localStorage.setItem('currentRole', DEFAULT_ROLES[0]);
        currentRole = DEFAULT_ROLES[0];
        
        // Mantém a senha admin e o tempo de eleição
        const newEndTime = new Date();
        newEndTime.setHours(newEndTime.getHours() + 2);
        localStorage.setItem('electionEndTime', newEndTime.toISOString());
        electionEndTime = newEndTime;
        electionActive = true;
        
        initializeData();
        alert('Urna zerada com sucesso!');
        closeModal();
        correct();
        updateRoleDisplay();
    }
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const votes = JSON.parse(localStorage.getItem('votes'));
    const candidates = JSON.parse(localStorage.getItem('candidates'));
    const now = new Date();
    
    // Título
    doc.setFontSize(18);
    doc.text("Relatório de Votação", 105, 20, { align: 'center' });
    
    // Data e hora
    doc.setFontSize(12);
    doc.text(`Data: ${now.toLocaleDateString()}`, 14, 30);
    doc.text(`Hora: ${now.toLocaleTimeString()}`, 14, 35);
    doc.text(`Cargo: ${currentRole}`, 14, 40);
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 45, 196, 45);
    
    // Cabeçalho da tabela
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Nº", 14, 55);
    doc.text("Candidato", 30, 55);
    doc.text("Partido", 100, 55);
    doc.text("Votos", 160, 55);
    doc.text("%", 180, 55);
    
    // Dados dos candidatos
    doc.setFont(undefined, 'normal');
    let y = 65;
    
    // Filtra candidatos pelo cargo atual
    const roleCandidates = candidates.filter(c => c.role === currentRole);
    
    // Ordena por votos
    const sortedCandidates = roleCandidates.sort((a, b) => {
        const votesA = votes.filter(v => v.type === a.number && v.role === currentRole).length;
        const votesB = votes.filter(v => v.type === b.number && v.role === currentRole).length;
        return votesB - votesA;
    });
    
    // Total de votos para este cargo
    const totalVotes = votes.filter(v => v.role === currentRole && ![NULL_VOTE, BLANK_VOTE].includes(v.type)).length;
    
    sortedCandidates.forEach(candidate => {
        const candidateVotes = votes.filter(v => v.type === candidate.number && v.role === currentRole).length;
        const percentage = totalVotes > 0 ? (candidateVotes / totalVotes * 100).toFixed(1) : 0;
        
        doc.text(candidate.number, 14, y);
        doc.text(candidate.name, 30, y);
        doc.text(candidate.party, 100, y);
        doc.text(candidateVotes.toString(), 160, y);
        doc.text(percentage + "%", 180, y);
        
        y += 10;
    });
    
    // Votos nulos e brancos
    const nullVotes = votes.filter(v => v.type === NULL_VOTE && v.role === currentRole).length;
    const blankVotes = votes.filter(v => v.type === BLANK_VOTE && v.role === currentRole).length;
    
    y += 5;
    doc.text("Votos Nulos: " + nullVotes, 14, y);
    y += 10;
    doc.text("Votos em Branco: " + blankVotes, 14, y);
    
    // Total geral
    y += 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de votos (${currentRole}): ${votes.filter(v => v.role === currentRole).length}`, 14, y);
    
    // Salva o PDF
    doc.save(`relatorio_urna_${currentRole}_${now.toISOString().slice(0,10)}.pdf`);
    closeModal();
}

// Funções de acessibilidade
function toggleAccessibility() {
    accessibilityMode = !accessibilityMode;
    document.body.classList.toggle('accessibility-mode', accessibilityMode);
    
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

// Funções auxiliares
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('admin-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('admin-modal').style.display = 'none';
    document.getElementById('modal-content').innerHTML = '';
    currentAction = null;
    candidatePhotoUrl = null;
    
    // Limpa todos os inputs do modal
    const inputs = document.querySelectorAll('#modal-content input');
    inputs.forEach(input => {
        input.value = '';
    });
    
    // Reseta a pré-visualização de foto
    const preview = document.getElementById('register-preview');
    if (preview) {
        preview.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    // Reseta o input de arquivo
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Manipulação de arquivos
document.getElementById('file-input').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            candidatePhotoUrl = event.target.result;
            const preview = document.getElementById('register-preview');
            if (preview) {
                preview.innerHTML = `<img src="${candidatePhotoUrl}" alt="Pré-visualização" style="max-width:100%; height:auto;">`;
            }
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

// Suporte ao teclado físico
document.addEventListener('keydown', function(event) {
    const modalOpen = document.getElementById('admin-modal').style.display === 'block' || 
                     document.getElementById('biometric-modal').style.display === 'block';
    
    if (modalOpen) {
        if (event.key === 'Escape') {
            closeModal();
            closeBiometricModal();
        }
        return;
    }
    
    if (!electionActive) return;
    
    switch(event.key) {
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
            addNumber(event.key);
            break;
        case 'Enter':
            confirmVote();
            event.preventDefault();
            break;
        case 'Backspace':
        case 'Delete':
            backspace();
            event.preventDefault();
            break;
        case 'Escape':
            closeModal();
            break;
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    updateClock();
    
    // Fecha o modal ao clicar fora
    window.addEventListener('click', function(event) {
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
    
    // Garante que todas as funções estão disponíveis globalmente
    window.addNumber = addNumber;
    window.correct = correct;
    window.voteNull = voteNull;
    window.voteBlank = voteBlank;
    window.confirmVote = confirmVote;
    window.toggleAccessibility = toggleAccessibility;
    window.simulateBiometric = simulateBiometric;
});