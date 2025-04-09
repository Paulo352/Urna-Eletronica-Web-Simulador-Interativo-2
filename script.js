// Constantes do sistema
const NULL_VOTE = "null";
const BLANK_VOTE = "blank";
const DEFAULT_PASSWORD = "urna2023";

// Variáveis globais
let currentNumber = '';
let currentCandidate = null;
let adminPassword = DEFAULT_PASSWORD;
let currentAction = null;
let candidatePhotoUrl = null;

// Inicialização dos dados
function initializeData() {
    // Não cria candidatos padrão se não existirem
    if (!localStorage.getItem('candidates')) {
        localStorage.setItem('candidates', JSON.stringify([])); // Lista vazia
    }
    
    if (!localStorage.getItem('votes')) {
        localStorage.setItem('votes', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('adminPassword')) {
        localStorage.setItem('adminPassword', DEFAULT_PASSWORD);
    } else {
        adminPassword = localStorage.getItem('adminPassword');
    }
}

// Atualiza o relógio
function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    clock.textContent = now.toLocaleTimeString();
    setTimeout(updateClock, 1000);
}

// Funções da urna
function addNumber(num) {
    if (currentNumber.length < 2) {
        currentNumber += num;
        updateDisplay();
        checkCandidate();
    }
}

function correct() {
    currentNumber = '';
    currentCandidate = null;
    updateDisplay();
    document.getElementById('candidate-info').innerHTML = '';
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
    }
}

function voteNull() {
    if (confirm("Deseja votar NULO?")) {
        registerVote(NULL_VOTE);
        alert("Voto NULO confirmado!");
        correct();
    }
}

function voteBlank() {
    if (confirm("Deseja votar em BRANCO?")) {
        registerVote(BLANK_VOTE);
        alert("Voto em BRANCO confirmado!");
        correct();
    }
}

function confirmVote() {
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
}

function registerVote(voteType) {
    const votes = JSON.parse(localStorage.getItem('votes'));
    votes.push(voteType);
    localStorage.setItem('votes', JSON.stringify(votes));
}

function updateDisplay() {
    document.getElementById('vote-input').value = currentNumber;
}

function checkCandidate() {
    if (currentNumber.length === 2) {
        const candidates = JSON.parse(localStorage.getItem('candidates'));
        currentCandidate = candidates.find(c => c.number === currentNumber);
        
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
        } else {
            infoDiv.innerHTML = '<div style="color:red;">Número não cadastrado (voto será NULO)</div>';
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
    const modalContent = `
        <h2><i class="fas fa-user-plus"></i> Cadastrar Candidato</h2>
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

function openFileExplorer() {
    document.getElementById('file-input').click();
}

document.getElementById('file-input').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            candidatePhotoUrl = event.target.result;
            document.getElementById('register-preview').innerHTML = 
                `<img src="${candidatePhotoUrl}" alt="Pré-visualização" style="max-width:100%; height:auto;">`;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

function registerCandidate() {
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

    const candidates = JSON.parse(localStorage.getItem('candidates')) || '[]';
    
    if (candidates.some(c => c.number === number)) {
        alert('Já existe um candidato com este número!');
        return;
    }

    const newCandidate = { 
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

    localStorage.removeItem('votes');
    localStorage.removeItem('candidates');
    initializeData();
    alert('Urna zerada com sucesso!');
    closeModal();
    correct();
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
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 40, 196, 40);
    
    // Cabeçalho da tabela
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Nº", 14, 50);
    doc.text("Candidato", 30, 50);
    doc.text("Partido", 100, 50);
    doc.text("Votos", 160, 50);
    doc.text("%", 180, 50);
    
    // Dados dos candidatos
    doc.setFont(undefined, 'normal');
    let y = 60;
    
    const sortedCandidates = candidates.sort((a, b) => {
        const votesA = votes.filter(v => v === a.number).length;
        const votesB = votes.filter(v => v === b.number).length;
        return votesB - votesA;
    });
    
    sortedCandidates.forEach(candidate => {
        const candidateVotes = votes.filter(v => v === candidate.number).length;
        const percentage = votes.length > 0 ? (candidateVotes / votes.length * 100).toFixed(1) : 0;
        
        doc.text(candidate.number, 14, y);
        doc.text(candidate.name, 30, y);
        doc.text(candidate.party, 100, y);
        doc.text(candidateVotes.toString(), 160, y);
        doc.text(percentage + "%", 180, y);
        
        y += 10;
    });
    
    // Total de votos
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de votos: ${votes.length}`, 14, y + 10);
    
    // Salva o PDF
    doc.save(`relatorio_urna_${now.toISOString().slice(0,10)}.pdf`);
    closeModal();
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

// Suporte ao teclado físico
document.addEventListener('keydown', function(event) {
    const modalOpen = document.getElementById('admin-modal').style.display === 'block';
    
    // Se um modal estiver aberto, permite Backspace/Delete normalmente
    if (modalOpen) {
        // Permite navegação com Tab nos modais
        if (event.key === 'Escape') {
            closeModal();
        }
        return;
    }
    
    // Comportamento na tela principal
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
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    updateClock();
    
    // Fecha o modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
});