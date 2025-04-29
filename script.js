// Constantes do sistema
const NULL_VOTE = "null";
const BLANK_VOTE = "blank";
const DEFAULT_PASSWORD = "admin";

// Variáveis globais
let currentNumber = '';
let currentCandidate = null;
let adminPassword = DEFAULT_PASSWORD;
let currentAction = null;
let candidatePhotoUrl = null;
let currentRole = '';
let accessibilityMode = false;
let electionActive = true;

// Inicialização
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
        localStorage.setItem('electionRoles', JSON.stringify([]));
    }
    
    if (localStorage.getItem('currentRole')) {
        currentRole = localStorage.getItem('currentRole');
    }
    
    updateRoleDisplay();
    updateClock();
    updateMessages();
}

// Atualiza o relógio
function updateClock() {
    const brasiliaTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const clock = document.getElementById('clock');
    
    const day = String(brasiliaTime.getDate()).padStart(2, '0');
    const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
    const year = brasiliaTime.getFullYear();
    const hours = String(brasiliaTime.getHours()).padStart(2, '0');
    const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
    
    clock.textContent = `${day}/${month}/${year} ${hours}:${minutes} (BRT)`;
    setTimeout(updateClock, 60000); // Atualiza a cada minuto
}

// Atualiza mensagens na tela
function updateMessages() {
    const line1 = document.getElementById('message-line1');
    const line2 = document.getElementById('message-line2');
    
    if (currentNumber.length === 0) {
        line1.textContent = "Aperte a tecla:";
        line2.textContent = "BRANCO para VOTAR EM BRANCO";
    } else if (currentNumber.length === 1) {
        line1.textContent = "Aperte a tecla:";
        line2.textContent = "CORRIGE para REINICIAR";
    } else if (currentNumber.length === 2) {
        if (currentCandidate) {
            line1.textContent = "Aperte a tecla:";
            line2.textContent = "VERDE para CONFIRMAR este voto";
        } else {
            line1.textContent = "NÚMERO ERRADO";
            line2.textContent = "Aperte CORRIGE para REINICIAR";
        }
    }
}

// Funções da urna
function addNumber(num) {
    if (!electionActive) return;
    if (currentNumber.length < 2) {
        currentNumber += num;
        updateDisplay();
        checkCandidate();
        
        if (accessibilityMode) {
            speak(`Digitado ${num}`);
        }
    }
}

function correct() {
    currentNumber = '';
    currentCandidate = null;
    updateDisplay();
    
    if (accessibilityMode) {
        speak('Voto corrigido');
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
    updateMessages();
}

function checkCandidate() {
    if (currentNumber.length === 2) {
        const candidates = JSON.parse(localStorage.getItem('candidates'));
        currentCandidate = candidates.find(c => c.number === currentNumber && c.role === currentRole);
        
        if (currentCandidate) {
            document.getElementById('candidate-name').textContent = currentCandidate.name;
            document.getElementById('candidate-party').textContent = currentCandidate.party;
            document.getElementById('vice-name').textContent = currentCandidate.viceName || "Não informado";
            
            const photoContainer = document.querySelector('.photo-container');
            if (currentCandidate.photo) {
                photoContainer.innerHTML = `<img src="${currentCandidate.photo}" alt="${currentCandidate.name}" style="width:100%;height:100%;object-fit:cover;">`;
            } else {
                photoContainer.innerHTML = '<div class="photo-placeholder"><i class="fas fa-user"></i></div>';
            }
        } else {
            document.getElementById('candidate-name').textContent = "";
            document.getElementById('candidate-party').textContent = "";
            document.getElementById('vice-name').textContent = "";
            document.querySelector('.photo-container').innerHTML = '<div class="photo-placeholder"><i class="fas fa-user"></i></div>';
        }
    }
    updateMessages();
}

function updateRoleDisplay() {
    const roleDisplay = document.getElementById('current-role-display');
    const voteRoleDisplay = document.getElementById('vote-role-display');
    
    if (currentRole) {
        roleDisplay.textContent = `- ${currentRole.toUpperCase()}`;
        voteRoleDisplay.textContent = currentRole.toUpperCase();
    } else {
        roleDisplay.textContent = '';
        voteRoleDisplay.textContent = '[NÃO SELECIONADO]';
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

function showCandidateForm() {
    const roles = JSON.parse(localStorage.getItem('electionRoles')) || [];
    
    const modalContent = `
        <h2><i class="fas fa-user-plus"></i> Cadastrar Candidato</h2>
        <div class="form-group">
            <label for="candidate-role">Cargo:</label>
            <input type="text" id="candidate-role" class="form-control" placeholder="Ex: Prefeito" list="roles-list" required>
            <datalist id="roles-list">
                ${roles.map(role => `<option value="${role}">`).join('')}
            </datalist>
        </div>
        <div class="form-group">
            <label for="candidate-number">Número (2 dígitos):</label>
            <input type="text" id="candidate-number" maxlength="2" 
                   oninput="this.value=this.value.replace(/[^0-9]/g,'')" 
                   placeholder="Ex: 99" required>
        </div>
        <div class="form-group">
            <label for="candidate-name">Nome do Candidato:</label>
            <input type="text" id="candidate-name" placeholder="Nome completo" required>
        </div>
        <div class="form-group">
            <label for="candidate-party">Partido:</label>
            <input type="text" id="candidate-party" placeholder="Sigla do partido" required>
        </div>
        <div class="form-group">
            <label for="vice-name">Nome do Vice:</label>
            <input type="text" id="vice-name" placeholder="Nome completo do vice">
        </div>
        <div class="form-group">
            <label for="vice-party">Partido do Vice:</label>
            <input type="text" id="vice-party" placeholder="Deixe em branco para usar o mesmo partido">
        </div>
        <div class="form-group">
            <label>Foto do Candidato:</label>
            <div id="register-preview">
                <i class="fas fa-user"></i>
            </div>
            <div class="photo-options">
                <button onclick="document.getElementById('file-input').click()" class="btn btn-primary">
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
    
    document.getElementById('file-input').onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                candidatePhotoUrl = event.target.result;
                document.getElementById('register-preview').innerHTML = `<img src="${candidatePhotoUrl}" alt="Foto do candidato">`;
            };
            reader.readAsDataURL(file);
        }
    };
}

function registerCandidate() {
    const role = document.getElementById('candidate-role').value.trim();
    const number = document.getElementById('candidate-number').value;
    const name = document.getElementById('candidate-name').value.trim();
    const party = document.getElementById('candidate-party').value.trim().toUpperCase();
    const viceName = document.getElementById('vice-name').value.trim();
    const viceParty = document.getElementById('vice-party').value.trim().toUpperCase() || party;

    if (!number || number.length !== 2 || isNaN(number)) {
        alert('Número inválido! Deve conter 2 dígitos.');
        return;
    }

    if (!name) {
        alert('Digite o nome do candidato!');
        return;
    }

    if (!party) {
        alert('Digite a sigla do partido!');
        return;
    }

    if (!role) {
        alert('Selecione ou digite um cargo!');
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
        name, 
        party,
        viceName: viceName || "Não informado",
        viceParty,
        photo: candidatePhotoUrl 
    };

    candidates.push(newCandidate);
    localStorage.setItem('candidates', JSON.stringify(candidates));
    alert('Candidato cadastrado com sucesso!');
    closeModal();
}

function showRolesManagement() {
    const roles = JSON.parse(localStorage.getItem('electionRoles')) || [];
    
    let rolesHTML = roles.map(role => `
        <div class="role-item">
            <input type="text" value="${role}" class="role-input">
            <button onclick="removeRole(this)" class="btn btn-danger">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    if (roles.length === 0) {
        rolesHTML = '<div class="no-roles-warning">Nenhum cargo cadastrado</div>';
    }
    
    const modalContent = `
        <h2><i class="fas fa-tags"></i> Gerenciar Cargos</h2>
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
                <option value="">Nenhum cargo selecionado</option>
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
        
        if (rolesList.querySelector('.no-roles-warning')) {
            rolesList.innerHTML = '';
        }
        
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
    button.closest('.role-item').remove();
    
    const rolesList = document.getElementById('roles-list');
    if (rolesList.children.length === 0) {
        rolesList.innerHTML = '<div class="no-roles-warning">Nenhum cargo cadastrado</div>';
    }
}

function saveRoles() {
    const roleInputs = document.querySelectorAll('.role-input');
    const roles = Array.from(roleInputs).map(input => input.value.trim()).filter(role => role);
    
    localStorage.setItem('electionRoles', JSON.stringify(roles));
    
    const selectedRole = document.getElementById('current-role-select').value;
    currentRole = selectedRole;
    localStorage.setItem('currentRole', currentRole);
    
    updateRoleDisplay();
    alert('Cargos atualizados com sucesso!');
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
        localStorage.removeItem('currentRole');
        currentRole = '';
        
        // Mantém apenas a senha admin
        localStorage.setItem('adminPassword', DEFAULT_PASSWORD);
        adminPassword = DEFAULT_PASSWORD;
        
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
    doc.text('Relatório da Urna Eletrônica', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Gerado em: ${now.toLocaleString()}`, 105, 22, { align: 'center' });
    
    // Resumo de votos
    doc.setFontSize(14);
    doc.text('Resumo de Votos', 14, 35);
    
    let yPos = 45;
    const roles = JSON.parse(localStorage.getItem('electionRoles')) || [];
    
    if (roles.length === 0) {
        doc.setFontSize(12);
        doc.text('Nenhum cargo definido na eleição', 14, yPos);
        yPos += 10;
    } else {
        roles.forEach(role => {
            const roleVotes = votes.filter(v => v.role === role);
            const total = roleVotes.length;
            
            doc.setFontSize(12);
            doc.text(`Cargo: ${role} - Total de votos: ${total}`, 14, yPos);
            yPos += 10;
            
            // Contagem por candidato
            const candidatesForRole = candidates.filter(c => c.role === role);
            candidatesForRole.forEach(candidate => {
                const votesForCandidate = roleVotes.filter(v => v.type === candidate.number).length;
                doc.text(`- ${candidate.number}: ${candidate.name} (${candidate.party}): ${votesForCandidate} votos`, 20, yPos);
                yPos += 7;
            });
            
            // Votos nulos e brancos
            const nullVotes = roleVotes.filter(v => v.type === NULL_VOTE).length;
            const blankVotes = roleVotes.filter(v => v.type === BLANK_VOTE).length;
            
            doc.text(`- Votos nulos: ${nullVotes}`, 20, yPos);
            yPos += 7;
            doc.text(`- Votos em branco: ${blankVotes}`, 20, yPos);
            yPos += 10;
        });
    }
    
    // Lista completa de votos (se houver espaço)
    if (yPos < 250) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('Registro Completo de Votos', 105, 15, { align: 'center' });
        
        yPos = 25;
        votes.forEach((vote, index) => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 15;
            }
            
            let voteInfo;
            if (vote.type === NULL_VOTE) {
                voteInfo = `VOTO NULO (${vote.role || 'Sem cargo'})`;
            } else if (vote.type === BLANK_VOTE) {
                voteInfo = `VOTO EM BRANCO (${vote.role || 'Sem cargo'})`;
            } else {
                const candidate = candidates.find(c => c.number === vote.type && c.role === vote.role);
                voteInfo = candidate 
                    ? `Voto para ${candidate.name} (${candidate.party}) - ${vote.role}`
                    : `Voto inválido (número ${vote.type})`;
            }
            
            const voteTime = new Date(vote.timestamp).toLocaleString();
            doc.text(`${index + 1}. ${voteTime} - ${voteInfo}`, 14, yPos);
            yPos += 10;
        });
    }
    
    doc.save(`relatorio-urna-${now.toISOString().slice(0,10)}.pdf`);
}

// Funções auxiliares
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('admin-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('admin-modal').style.display = 'none';
    document.getElementById('file-input').value = '';
}

function toggleAccessibility() {
    accessibilityMode = !accessibilityMode;
    document.body.classList.toggle('accessibility-mode');
    alert(`Modo acessibilidade ${accessibilityMode ? 'ativado' : 'desativado'}`);
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        speechSynthesis.speak(utterance);
    }
}

// Inicialização
window.onload = function() {
    initializeData();
    
    // Configura o teclado físico
    document.addEventListener('keydown', function(e) {
        if (e.key >= '0' && e.key <= '9') {
            addNumber(e.key);
        } else if (e.key === 'Backspace') {
            correct();
        } else if (e.key === 'Enter') {
            confirmVote();
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });
};