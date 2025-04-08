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
let cameraStream = null;

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
        // Feedback visual
        const input = document.getElementById('vote-input');
        input.classList.add('active');
        setTimeout(() => input.classList.remove('active'), 100);
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
    candidatePhotoUrl = null; // Resetar foto ao abrir o formulário
    
    const modalContent = `
        <h2><i class="fas fa-user-plus"></i> Cadastrar Candidato</h2>
        <div class="form-group">
            <label for="candidate-number">Número (2 dígitos):</label>
            <input type="text" id="candidate-number" maxlength="2" placeholder="Ex: 99" 
                   oninput="this.value=this.value.replace(/[^0-9]/g,'')">
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
            <div class="photo-options">
                <button onclick="openFileExplorer()" class="photo-option-btn">
                    <i class="fas fa-folder-open"></i> Escolher Foto
                </button>
                <button onclick="startCamera()" class="photo-option-btn">
                    <i class="fas fa-camera"></i> Tirar Foto
                </button>
            </div>
            <video id="camera-preview" autoplay playsinline></video>
            <div id="camera-controls">
                <button onclick="capturePhoto()" class="btn btn-primary">
                    <i class="fas fa-camera"></i> Capturar
                </button>
                <button onclick="stopCamera()" class="btn btn-danger">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
        <button onclick="registerCandidate()" class="btn btn-primary">
            <i class="fas fa-save"></i> Salvar Candidato
        </button>
    `;
    
    showModal(modalContent);
    // Resetar visualização da câmera se estiver aberta
    stopCamera();
}

// Funções para manipulação de fotos
function openFileExplorer() {
    document.getElementById('file-input').click();
}

// Configurar o listener para o input de arquivo
document.getElementById('file-input').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            candidatePhotoUrl = event.target.result;
            updatePhotoPreview();
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

function updatePhotoPreview() {
    const preview = document.getElementById('register-preview');
    if (candidatePhotoUrl) {
        preview.innerHTML = `<img src="${candidatePhotoUrl}" alt="Pré-visualização">`;
    } else {
        preview.innerHTML = '<i class="fas fa-user"></i>';
    }
}

async function startCamera() {
    try {
        const video = document.getElementById('camera-preview');
        video.style.display = 'block';
        document.getElementById('camera-controls').style.display = 'flex';
        
        // Parar qualquer stream existente
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Iniciar nova stream de câmera
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false 
        });
        video.srcObject = cameraStream;
    } catch (err) {
        console.error("Erro ao acessar câmera:", err);
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
}

function stopCamera() {
    const video = document.getElementById('camera-preview');
    video.style.display = 'none';
    document.getElementById('camera-controls').style.display = 'none';
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    candidatePhotoUrl = canvas.toDataURL('image/jpeg', 0.8);
    updatePhotoPreview();
    stopCamera();
}

function registerCandidate() {
    const number = document.getElementById('candidate-number').value;
    const name = document.getElementById('candidate-name').value;
    const party = document.getElementById('candidate-party').value;

    // Validações
    if (!number || number.length !== 2 || !/^\d+$/.test(number)) {
        alert('Número inválido! Deve conter exatamente 2 dígitos.');
        return;
    }

    if (!name || name.trim() === '') {
        alert('Nome inválido!');
        return;
    }

    if (!party || party.trim() === '') {
        alert('Partido inválido!');
        return;
    }

    const candidates = JSON.parse(localStorage.getItem('candidates'));
    
    // Verificar se número já existe
    if (candidates.some(c => c.number === number)) {
        alert('Já existe um candidato com este número!');
        return;
    }

    // Criar novo candidato
    const newCandidate = { 
        number, 
        name: name.trim(), 
        party: party.trim().toUpperCase()
    };
    
    // Adicionar foto se existir
    if (candidatePhotoUrl) {
        newCandidate.photo = candidatePhotoUrl;
    }

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
        <p style="color: red; font-weight: bold;">Esta ação apagará TODOS os dados!</p>
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

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const votes = JSON.parse(localStorage.getItem('votes'));
    const candidates = JSON.parse(localStorage.getItem('candidates'));
    const now = new Date();
    
    // Configurações do documento
    doc.setProperties({
        title: 'Relatório de Votação',
        subject: 'Resultados da Urna Eletrônica',
        author: 'Urna Eletrônica'
    });
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("RELATÓRIO DE VOTAÇÃO", 105, 20, { align: 'center' });
    
    // Informações básicas
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data: ${now.toLocaleDateString()}`, 14, 30);
    doc.text(`Hora: ${now.toLocaleTimeString()}`, 14, 35);
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 40, 196, 40);
    
    // Seção de candidatos
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("RESULTADOS POR CANDIDATO", 14, 50);
    
    // Cabeçalho da tabela
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Nº", 14, 60);
    doc.text("Candidato", 30, 60);
    doc.text("Partido", 100, 60);
    doc.text("Votos", 160, 60);
    doc.text("%", 180, 60);
    
    // Dados dos candidatos
    doc.setFont(undefined, 'normal');
    let y = 70;
    
    // Ordenar candidatos por votos
    const sortedCandidates = candidates.sort((a, b) => {
        const votesA = votes.filter(v => v === a.number).length;
        const votesB = votes.filter(v => v === b.number).length;
        return votesB - votesA;
    });
    
    // Adicionar cada candidato
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
    
    // Seção de totais
    y += 15;
    doc.setFontSize(14);
    doc.text("TOTAIS", 14, y);
    
    // Cálculos
    const validVotes = votes.filter(v => v !== NULL_VOTE && v !== BLANK_VOTE).length;
    const nullVotes = votes.filter(v => v === NULL_VOTE).length;
    const blankVotes = votes.filter(v => v === BLANK_VOTE).length;
    
    y += 10;
    doc.setFontSize(12);
    doc.text("Votos válidos:", 14, y);
    doc.text(validVotes.toString(), 160, y);
    doc.text(((validVotes / votes.length) * 100).toFixed(1) + "%", 180, y);
    
    y += 10;
    doc.text("Votos nulos:", 14, y);
    doc.text(nullVotes.toString(), 160, y);
    doc.text(((nullVotes / votes.length) * 100).toFixed(1) + "%", 180, y);
    
    y += 10;
    doc.text("Votos em branco:", 14, y);
    doc.text(blankVotes.toString(), 160, y);
    doc.text(((blankVotes / votes.length) * 100).toFixed(1) + "%", 180, y);
    
    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text(`Total de votos: ${votes.length}`, 14, y);
    
    // Rodapé
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Documento gerado automaticamente pela Urna Eletrônica", 105, y, { align: 'center' });
    
    // Salvar o PDF
    doc.save(`relatorio_urna_${now.getTime()}.pdf`);
    closeModal();
}

// Funções auxiliares
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('admin-modal').style.display = 'block';
}

function closeModal() {
    // Parar a câmera se estiver ativa
    stopCamera();
    
    document.getElementById('admin-modal').style.display = 'none';
    currentAction = null;
    candidatePhotoUrl = null;
}

// Gerenciamento de teclado
document.addEventListener('keydown', function(event) {
    // Permitir apenas teclas numéricas, Enter e Backspace/Delete
    if ((event.key >= '0' && event.key <= '9') || 
        event.key === 'Enter' || 
        event.key === 'Backspace' || 
        event.key === 'Delete') {
        
        // Prevenir comportamento padrão apenas para teclas de ação
        if (event.key === 'Enter' || event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
        }
        
        // Processar tecla
        if (event.key >= '0' && event.key <= '9') {
            addNumber(event.key);
        } else if (event.key === 'Enter') {
            confirmVote();
        } else {
            correct();
        }
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    updateClock();
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
});