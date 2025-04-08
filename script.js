// Configurações iniciais
let currentNumber = '';
let currentCandidate = null;
let adminPassword = "urna2023"; // Senha padrão - altere na primeira utilização

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
        localStorage.setItem('adminPassword', adminPassword);
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

function confirmVote() {
    if (currentNumber.length !== 2) {
        alert('Digite 2 números para votar!');
        return;
    }

    if (!currentCandidate) {
        alert('Candidato não encontrado!');
        return;
    }

    const votes = JSON.parse(localStorage.getItem('votes'));
    votes.push(currentNumber);
    localStorage.setItem('votes', JSON.stringify(votes));

    alert(`Voto confirmado para ${currentCandidate.name} (${currentCandidate.party})!`);
    correct();
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
            infoDiv.innerHTML = `
                <div class="candidate-display">
                    <span class="candidate-name">${currentCandidate.name}</span>
                    <span class="candidate-party">${currentCandidate.party}</span>
                </div>
            `;
        } else {
            infoDiv.innerHTML = '<div style="color:red; text-align:center;">Candidato não encontrado</div>';
        }
    }
}

// Funções administrativas
function showAdminLogin() {
    const modalContent = `
        <h2><i class="fas fa-lock"></i> Acesso Administrativo</h2>
        <div class="form-group">
            <label for="password">Senha:</label>
            <input type="password" id="password" placeholder="Digite a senha">
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
        showResults();
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
        <button onclick="registerCandidate()" class="btn btn-primary">
            <i class="fas fa-save"></i> Salvar
        </button>
    `;
    
    showModal(modalContent);
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

    candidates.push({ number, name, party });
    localStorage.setItem('candidates', JSON.stringify(candidates));
    alert('Candidato cadastrado com sucesso!');
    closeModal();
}

function showResults() {
    const votes = JSON.parse(localStorage.getItem('votes'));
    const candidates = JSON.parse(localStorage.getItem('candidates'));
    
    let results = {};
    votes.forEach(vote => {
        results[vote] = (results[vote] || 0) + 1;
    });
    
    const sortedCandidates = candidates.sort((a, b) => {
        const votesA = results[a.number] || 0;
        const votesB = results[b.number] || 0;
        return votesB - votesA;
    });
    
    let resultsHTML = '<h2><i class="fas fa-poll"></i> Resultados da Votação</h2>';
    resultsHTML += '<div class="results-list">';
    
    sortedCandidates.forEach(candidate => {
        const voteCount = results[candidate.number] || 0;
        const percentage = votes.length > 0 ? (voteCount / votes.length * 100).toFixed(1) : 0;
        
        resultsHTML += `
            <div class="result-item">
                <span>${candidate.number} - ${candidate.name} (${candidate.party})</span>
                <span>${voteCount} votos (${percentage}%)</span>
            </div>
        `;
    });
    
    resultsHTML += `
        </div>
        <div class="total-votes" style="margin-top: 20px; font-weight: bold;">
            Total de votos: ${votes.length}
        </div>
        <button onclick="generatePDF()" class="btn btn-primary">
            <i class="fas fa-file-pdf"></i> Gerar PDF
        </button>
    `;
    
    showModal(resultsHTML);
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const votes = JSON.parse(localStorage.getItem('votes'));
    const candidates = JSON.parse(localStorage.getItem('candidates'));
    
    // Título
    doc.setFontSize(18);
    doc.text("Relatório de Votação - Urna Eletrônica", 105, 20, { align: 'center' });
    
    // Data e hora
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 14, 38);
    
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
    doc.text(`Total de votos: ${votes.length}`, 14, y + 15);
    
    // Salva o PDF
    doc.save(`relatorio_urna_${new Date().toISOString().slice(0,10)}.pdf`);
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

// Funções auxiliares
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('admin-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('admin-modal').style.display = 'none';
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