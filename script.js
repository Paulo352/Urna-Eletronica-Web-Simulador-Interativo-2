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
    if (!localStorage.getItem('candidates')) {
        localStorage.setItem('candidates', JSON.stringify([
            { number: '13', name: 'Candidato A', party: 'PT' },
            { number: '22', name: 'Candidato B', party: 'PL' },
            { number: '12', name: 'Candidato C', party: 'PDT' }
        ]));
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
    }
}

function showCandidateForm() {
    const modalContent = `
        <h2><i class="fas fa-user-plus"></i> Cadastrar Candidato</h2>
        <div class="form-group">
            <label for="candidate-number">Número (2 dígitos):</label>
            <input type="text" id="candidate-number" maxlength="2" placeholder="Ex: 99">
        </div>
        <div class="form-group">
            <label for="candidate-name">Nome:</label>
            <input type="text" id="candidate-name" placeholder="Nome do candidato">
        </div>
        <div class="form-group">
            <label for="candidate-party">Partido:</label>
            <input type="text" id="candidate-party" placeholder="Sigla do partido">
        </div>
        <div class="form-group">
            <label>Foto do Candidato (opcional):</label>
            <div id="register-preview">
                <i class="fas fa-user"></i>
            </div>
            <button onclick="promptForPhoto()" class="btn" style="width: 100%;">
                <i class="fas fa-camera"></i> Adicionar Foto
            </button>
        </div>
        <button onclick="registerCandidate()" class="btn btn-primary">
            <i class="fas fa-save"></i> Salvar Candidato
        </button>
    `;
    
    showModal(modalContent);
}

function promptForPhoto() {
    const url = prompt('Cole a URL da foto do candidato (deve terminar com .jpg, .jpeg ou .png):');
    
    if (url) {
        if (url.match(/\.(jpeg|jpg|png)$/) && url.startsWith('http')) {
            candidatePhotoUrl = url;
            document.getElementById('register-preview').innerHTML = `<img src="${url}" alt="Pré-visualização">`;
        } else {
            alert('URL inválida! Deve ser uma imagem (jpg, jpeg ou png) e começar com http');
        }
    }
}

function registerCandidate() {
    const number = document.getElementById('candidate-number').value;
    const name = document.getElementById('candidate-name').value;
    const party = document.getElementById('candidate-party').value;

    if (!number || number.length !== 2 || isNaN(number)) {
        alert('Número inválido! Deve conter 2 dígitos.');
        return;
    }

    if (!name) {
        alert('Nome inválido!');
        return;
    }

    if (!party) {
        alert('Partido inválido!');
        return;
    }

    const candidates = JSON.parse(localStorage.getItem('candidates'));
    
    if (candidates.some(c => c.number === number)) {
        alert('Já existe um candidato com este número!');
        return;
    }

    const newCandidate = { number, name, party };
    if (candidatePhotoUrl) {
        newCandidate.photo = candidatePhotoUrl;
    }

    candidates.push(newCandidate);
    localStorage.setItem('candidates', JSON.stringify(candidates));
    alert('Candidato cadastrado com sucesso!');
    candidatePhotoUrl = null;
    closeModal();
}

function showPasswordForm() {
    const modalContent = `
        <h2><i class="fas fa-key"></i> Alterar Senha</h2>
        <div class="form-group">
            <label for="current-password">Senha atual:</label>
            <input type="password" id="current-password" placeholder="Digite a senha atual">
        </div>
        <div class="form-group">
            <label for="new-password">Nova senha:</label>
            <input type="password" id="new-password" placeholder="Digite a nova senha">
        </div>
        <div class="form-group">
            <label for="confirm-password">Confirmar nova senha:</label>
            <input type="password" id="confirm-password" placeholder="Confirme a nova senha">
        </div>
        <button onclick="changeAdminPassword()" class="btn btn-primary">
            <i class="fas fa-save"></i> Alterar Senha
        </button>
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
        <p>Tem certeza que deseja apagar TODOS os dados da urna?</p>
        <p style="color: red; font-weight: bold;">Esta ação não pode ser desfeita!</p>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="resetUrn()" class="btn btn-danger">
                <i class="fas fa-trash-alt"></i> Sim, zerar
            </button>
            <button onclick="closeModal()" class="btn">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    showModal(modalContent);
}

function resetUrn() {
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
    doc.text("Relatório de Votação - Urna Eletrônica", 105, 20, { align: 'center' });
    
    // Informações de segurança
    doc.setFontSize(10);
    doc.text(`Gerado em: ${now.toLocaleDateString()} às ${now.toLocaleTimeString()}`, 14, 30);
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 35, 196, 35);
    
    // Cálculo de votos
    const validVotes = votes.filter(v => v !== NULL_VOTE && v !== BLANK_VOTE);
    const nullVotes = votes.filter(v => v === NULL_VOTE).length;
    const blankVotes = votes.filter(v => v === BLANK_VOTE).length;
    
    // Cabeçalho da tabela
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Nº", 14, 45);
    doc.text("Candidato", 30, 45);
    doc.text("Partido", 100, 45);
    doc.text("Votos", 160, 45);
    doc.text("%", 180, 45);
    
    // Dados dos candidatos
    doc.setFont(undefined, 'normal');
    let y = 55;
    
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
    
    // Votos nulos e brancos
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.text("Votos Nulos:", 14, y);
    doc.text(nullVotes.toString(), 160, y);
    doc.text(((nullVotes / votes.length) * 100).toFixed(1) + "%", 180, y);
    
    y += 10;
    doc.text("Votos em Branco:", 14, y);
    doc.text(blankVotes.toString(), 160, y);
    doc.text(((blankVotes / votes.length) * 100).toFixed(1) + "%", 180, y);
    
    y += 10;
    doc.text("Votos Válidos:", 14, y);
    doc.text(validVotes.length.toString(), 160, y);
    doc.text(((validVotes.length / votes.length) * 100).toFixed(1) + "%", 180, y);
    
    // Total de votos
    y += 10;
    doc.text(`Total de votos: ${votes.length}`, 14, y);
    
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
    currentAction = null;
    candidatePhotoUrl = null;
}

// Suporte ao teclado físico
document.addEventListener('keydown', function(event) {
    if (event.key >= '0' && event.key <= '9') {
        addNumber(event.key);
        event.preventDefault();
    }
    else if (event.key === 'Enter') {
        confirmVote();
        event.preventDefault();
    }
    else if (event.key === 'Backspace' || event.key === 'Delete') {
        correct();
        event.preventDefault();
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