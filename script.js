// Configurações da eleição
const electionTypes = {
    MUNICIPAL: {
        name: "Eleição Municipal",
        stages: [
            { title: "Vereador", digits: 5, maxVotes: 2 },
            { title: "Prefeito", digits: 2, maxVotes: 1 }
        ]
    },
    STATE: {
        name: "Eleição Estadual",
        stages: [
            { title: "Deputado Estadual", digits: 5, maxVotes: 2 },
            { title: "Deputado Federal", digits: 4, maxVotes: 2 },
            { title: "Senador", digits: 3, maxVotes: 2 },
            { title: "Governador", digits: 2, maxVotes: 1 },
            { title: "Presidente", digits: 2, maxVotes: 1 }
        ]
    },
    CUSTOM: {
        name: "Eleição Personalizada",
        stages: []
    }
};

// Estado da aplicação
let currentElection = null;
let currentStageIndex = 0;
let currentVotes = [];
let inputNumbers = "";
let candidates = {};
let adminMode = false;
const ADMIN_PASSWORD = "admin";

// Elementos DOM
const electionTypeEl = document.getElementById('election-type');
const stageTitleEl = document.getElementById('stage-title');
const stageInstructionEl = document.getElementById('stage-instruction');
const candidateDisplayEl = document.getElementById('candidate-display');
const numberInputEl = document.getElementById('number-input');
const messagesEl = document.getElementById('messages');
const adminPanelEl = document.getElementById('admin-panel');
const adminToggleEl = document.getElementById('admin-toggle');
const electionSelectEl = document.getElementById('election-select');
const initElectionBtn = document.getElementById('init-election');
const customConfigEl = document.getElementById('custom-config');
const addPositionBtn = document.getElementById('add-position');
const customPositionsEl = document.getElementById('custom-positions');
const candidatesListEl = document.getElementById('candidates-list');
const addCandidateBtn = document.getElementById('add-candidate');
const showResultsBtn = document.getElementById('show-results');
const resetVotesBtn = document.getElementById('reset-votes');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setupKeyboard();
    loadCandidates();
    setupAdminPanel();
});

// Configura o teclado
function setupKeyboard() {
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => handleKeyPress(key.dataset.value));
    });
}

// Manipula pressionamento de tecla
function handleKeyPress(value) {
    if (adminMode) return;
    
    const currentStage = currentElection?.stages[currentStageIndex];
    if (!currentStage) return;

    if (value === 'corrige') {
        inputNumbers = "";
        updateNumberInput();
        clearMessages();
    } 
    else if (value === 'branco') {
        inputNumbers = "branco";
        updateNumberInput();
        clearMessages();
    } 
    else if (value === 'confirma') {
        confirmVote();
    } 
    else if (/^[0-9]$/.test(value)) {
        if (inputNumbers === "branco") inputNumbers = "";
        if (inputNumbers.length < currentStage.digits) {
            inputNumbers += value;
            updateNumberInput();
            checkCandidate();
        }
    }
}

// Atualiza o display de números
function updateNumberInput() {
    if (inputNumbers === "branco") {
        numberInputEl.textContent = "VOTO EM BRANCO";
    } else {
        numberInputEl.textContent = inputNumbers.split('').join(' ');
    }
}

// Verifica se o número digitado corresponde a um candidato
function checkCandidate() {
    const currentStage = currentElection.stages[currentStageIndex];
    if (inputNumbers.length === currentStage.digits) {
        const candidate = findCandidate(inputNumbers, currentStage.title);
        displayCandidate(candidate);
    } else {
        clearCandidateDisplay();
    }
}

// Encontra candidato pelo número e cargo
function findCandidate(number, position) {
    return candidates[position]?.find(c => c.number === number) || null;
}

// Exibe informações do candidato
function displayCandidate(candidate) {
    if (!candidate) {
        candidateDisplayEl.innerHTML = `
            <div class="candidate-info">
                <div class="candidate-photo"></div>
                <p>Candidato não encontrado</p>
                <p>Número: ${inputNumbers}</p>
            </div>
        `;
        return;
    }

    candidateDisplayEl.innerHTML = `
        <div class="candidate-info">
            <div class="candidate-photo"></div>
            <p><strong>${candidate.name}</strong></p>
            <p>${candidate.party}</p>
            <p>Número: ${candidate.number}</p>
            <p>${currentElection.stages[currentStageIndex].title}</p>
        </div>
    `;
}

// Limpa o display do candidato
function clearCandidateDisplay() {
    candidateDisplayEl.innerHTML = "";
}

// Confirma o voto
function confirmVote() {
    const currentStage = currentElection.stages[currentStageIndex];
    
    if (inputNumbers === "" && currentStage.maxVotes > 0) {
        showMessage("Digite um número ou vote em BRANCO");
        return;
    }

    // Verifica se já atingiu o máximo de votos para este cargo
    const votesForStage = currentVotes.filter(v => v.stageIndex === currentStageIndex);
    if (votesForStage.length >= currentStage.maxVotes) {
        showMessage(`Você já votou o máximo permitido para ${currentStage.title}`);
        return;
    }

    // Registra o voto
    const vote = {
        stageIndex: currentStageIndex,
        position: currentStage.title,
        number: inputNumbers,
        timestamp: new Date().toISOString()
    };
    
    currentVotes.push(vote);
    saveVotes();

    // Avança para o próximo estágio ou finaliza
    if (votesForStage.length + 1 < currentStage.maxVotes) {
        // Permite mais votos para o mesmo cargo
        inputNumbers = "";
        updateNumberInput();
        clearCandidateDisplay();
        showMessage(`Você pode votar em mais ${currentStage.maxVotes - votesForStage.length - 1} candidato(s) para ${currentStage.title}`);
    } else {
        goToNextStage();
    }
}

// Avança para o próximo estágio da eleição
function goToNextStage() {
    if (currentStageIndex < currentElection.stages.length - 1) {
        currentStageIndex++;
        inputNumbers = "";
        updateUI();
    } else {
        showFinalScreen();
    }
}

// Mostra tela final de confirmação
function showFinalScreen() {
    candidateDisplayEl.innerHTML = `
        <div class="final-screen">
            <h2>FIM DA VOTAÇÃO</h2>
            <p>Obrigado por votar!</p>
            <p>Seus votos foram registrados.</p>
        </div>
    `;
    numberInputEl.textContent = "";
    stageTitleEl.textContent = "";
    stageInstructionEl.textContent = "";
}

// Atualiza a interface
function updateUI() {
    if (!currentElection) return;

    electionTypeEl.textContent = currentElection.name;
    
    const currentStage = currentElection.stages[currentStageIndex];
    stageTitleEl.textContent = currentStage.title;
    stageInstructionEl.textContent = `Digite ${currentStage.digits} números (Máximo: ${currentStage.maxVotes} voto(s))`;
    
    inputNumbers = "";
    updateNumberInput();
    clearCandidateDisplay();
    clearMessages();
}

// Exibe mensagem
function showMessage(message) {
    messagesEl.textContent = message;
}

// Limpa mensagens
function clearMessages() {
    messagesEl.textContent = "";
}

// Painel administrativo
function setupAdminPanel() {
    adminToggleEl.addEventListener('click', toggleAdminPanel);
    initElectionBtn.addEventListener('click', initElectionFromPanel);
    addPositionBtn.addEventListener('click', addCustomPosition);
    addCandidateBtn.addEventListener('click', addCandidate);
    showResultsBtn.addEventListener('click', showResults);
    resetVotesBtn.addEventListener('click', resetVotes);
    
    electionSelectEl.addEventListener('change', (e) => {
        customConfigEl.classList.toggle('hidden', e.target.value !== 'CUSTOM');
    });
}

// Alterna o painel administrativo
function toggleAdminPanel() {
    if (adminPanelEl.classList.contains('hidden')) {
        const password = prompt("Digite a senha administrativa:");
        if (password === ADMIN_PASSWORD) {
            adminMode = true;
            adminPanelEl.classList.remove('hidden');
            loadAdminData();
        }
    } else {
        adminMode = false;
        adminPanelEl.classList.add('hidden');
        updateUI();
    }
}

// Inicia eleição a partir do painel
function initElectionFromPanel() {
    const type = electionSelectEl.value;
    
    if (type === 'CUSTOM' && electionTypes.CUSTOM.stages.length === 0) {
        alert("Configure os cargos para a eleição personalizada primeiro");
        return;
    }
    
    initElection(type);
    adminPanelEl.classList.add('hidden');
    adminMode = false;
}

// Inicializa a eleição
function initElection(type) {
    currentElection = JSON.parse(JSON.stringify(electionTypes[type]));
    currentStageIndex = 0;
    currentVotes = [];
    updateUI();
}

// Adiciona cargo personalizado
function addCustomPosition() {
    const positionName = prompt("Nome do cargo:");
    if (!positionName) return;
    
    const digits = parseInt(prompt("Quantidade de dígitos para este cargo:"));
    if (isNaN(digits) || digits < 1) {
        alert("Número inválido");
        return;
    }
    
    const maxVotes = parseInt(prompt("Número máximo de votos para este cargo:"));
    if (isNaN(maxVotes) {
        alert("Número inválido");
        return;
    }
    
    electionTypes.CUSTOM.stages.push({
        title: positionName,
        digits: digits,
        maxVotes: maxVotes
    });
    
    renderCustomPositions();
}

// Renderiza cargos personalizados
function renderCustomPositions() {
    customPositionsEl.innerHTML = "";
    electionTypes.CUSTOM.stages.forEach((stage, index) => {
        const div = document.createElement('div');
        div.className = 'position-item';
        div.innerHTML = `
            <p><strong>${stage.title}</strong></p>
            <p>Dígitos: ${stage.digits}</p>
            <p>Votos máx.: ${stage.maxVotes}</p>
            <button onclick="removeCustomPosition(${index})">Remover</button>
        `;
        customPositionsEl.appendChild(div);
    });
}

// Remove cargo personalizado
function removeCustomPosition(index) {
    electionTypes.CUSTOM.stages.splice(index, 1);
    renderCustomPositions();
}

// Adiciona candidato
function addCandidate() {
    const position = prompt("Cargo do candidato:");
    if (!position) return;
    
    const number = prompt("Número do candidato:");
    if (!number) return;
    
    const name = prompt("Nome do candidato:");
    if (!name) return;
    
    const party = prompt("Partido:");
    if (!party) return;
    
    if (!candidates[position]) {
        candidates[position] = [];
    }
    
    candidates[position].push({
        number: number,
        name: name,
        party: party
    });
    
    saveCandidates();
    renderCandidatesList();
}

// Renderiza lista de candidatos
function renderCandidatesList() {
    candidatesListEl.innerHTML = "";
    for (const position in candidates) {
        candidates[position].forEach(candidate => {
            const div = document.createElement('div');
            div.className = 'candidate-item';
            div.innerHTML = `
                <p><strong>${candidate.name}</strong></p>
                <p>${position} - Nº ${candidate.number}</p>
                <p>${candidate.party}</p>
                <button onclick="removeCandidate('${position}', '${candidate.number}')">Remover</button>
            `;
            candidatesListEl.appendChild(div);
        });
    }
}

// Remove candidato
function removeCandidate(position, number) {
    if (confirm("Tem certeza que deseja remover este candidato?")) {
        candidates[position] = candidates[position].filter(c => c.number !== number);
        if (candidates[position].length === 0) {
            delete candidates[position];
        }
        saveCandidates();
        renderCandidatesList();
    }
}

// Mostra resultados
function showResults() {
    alert("Esta funcionalidade será implementada na próxima versão");
}

// Reseta votos
function resetVotes() {
    if (confirm("Tem certeza que deseja zerar todos os votos?")) {
        currentVotes = [];
        saveVotes();
        alert("Votos resetados com sucesso");
    }
}

// Carrega dados do admin
function loadAdminData() {
    renderCustomPositions();
    renderCandidatesList();
}

// Armazenamento local
function saveVotes() {
    localStorage.setItem('urnaVotes', JSON.stringify(currentVotes));
}

function loadVotes() {
    const votes = localStorage.getItem('urnaVotes');
    if (votes) {
        currentVotes = JSON.parse(votes);
    }
}

function saveCandidates() {
    localStorage.setItem('urnaCandidates', JSON.stringify(candidates));
}

function loadCandidates() {
    const cands = localStorage.getItem('urnaCandidates');
    if (cands) {
        candidates = JSON.parse(cands);
    } else {
        // Candidatos de exemplo
        candidates = {
            "Vereador": [
                { number: "12345", name: "Fulano de Tal", party: "ABC" },
                { number: "54321", name: "Beltrano Silva", party: "XYZ" }
            ],
            "Prefeito": [
                { number: "12", name: "Candidato A", party: "ABC" },
                { number: "34", name: "Candidato B", party: "XYZ" }
            ]
        };
        saveCandidates();
    }
}

// Funções globais para os event listeners
window.removeCustomPosition = removeCustomPosition;
window.removeCandidate = removeCandidate;