// Configurações iniciais
let currentNumber = '';
let currentCandidate = null;
let adminPassword = "urna2023"; // Senha padrão - altere na primeira utilização
let currentAction = null;

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
            infoDiv.innerHTML = '<div style="color:red;">Candidato não encontrado</div>';
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
            <label>Foto do Candidato:</label>
            <div id="register-preview">
                <i class="fas fa-user"></i>
            </div>
            <button onclick="promptForPhoto()" class="btn" style="width: 100%;">
                <i class="fas fa-camera"></i> Adicionar Foto
            </button>
        </div>
        <div class="form-group">
            <label for="register-password">Senha de Administrador:</label>
            <input type="password" id="register-password" placeholder="Confirme sua senha">
        </div>
        <button onclick="registerCandidate()" class="btn btn-primary">
            <i class="fas fa-save"></i> Salvar Candidato
        </button>
    `;
    
    showModal(modalContent);
}

let candidatePhotoUrl = null;

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
    const password = document.getElementById('register-password').value;
    if (password !== adminPassword) {
        alert('Senha administrativa incorreta!');
        return;
    }

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
    doc.text(`Senha administrativa: ${adminPassword}`, 14, 30);
    doc.text(`Gerado em: ${now.toLocaleDateString()} às ${now.toLocaleTimeString()}`, 14, 35);
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 40, 196, 40);
    
    // Cabeçalho da tabela
    doc.setFontSize(12);
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
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Total de votos: ${votes.length}`, 14, y + 10);
    
    // Rodapé de segurança
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Documento protegido por senha administrativa", 105, 290, { align: 'center' });
    
    // Salva o PDF
    doc.save(`relatorio_urna_${now.toISOString().slice(0,10)}.pdf`);
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
        <div class="form-group">
            <label for="reset-password">Senha administrativa:</label>
            <input type="password" id="reset-password" placeholder="Digite a senha">
        </div>
        <p style="color: red; font-weight: bold;">Esta ação não pode ser desfeita!</p>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button onclick="resetUrn()" class="btn btn-danger">
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