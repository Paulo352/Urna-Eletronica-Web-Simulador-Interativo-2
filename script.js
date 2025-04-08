// Inicialização dos dados
if (!localStorage.getItem('candidates')) {
    localStorage.setItem('candidates', JSON.stringify([
        { number: '13', name: 'Lula', party: 'PT' },
        { number: '22', name: 'Bolsonaro', party: 'PL' },
        { number: '12', name: 'Ciro Gomes', party: 'PDT' }
    ]));
    localStorage.setItem('votes', JSON.stringify([]));
}

let currentNumber = '';
let currentCandidate = null;

// Atualiza o relógio
function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    clock.textContent = now.toLocaleTimeString();
    setTimeout(updateClock, 1000);
}

// Adiciona número ao display
function addNumber(num) {
    if (currentNumber.length < 2) {
        currentNumber += num;
        updateDisplay();
        checkCandidate();
    }
}

// Corrige o número digitado
function correct() {
    currentNumber = '';
    currentCandidate = null;
    updateDisplay();
    document.getElementById('candidate-info').innerHTML = '';
}

// Confirma o voto
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

// Atualiza o display
function updateDisplay() {
    document.getElementById('vote-input').value = currentNumber;
}

// Verifica o candidato digitado
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

// Cadastra novo candidato
function registerCandidate() {
    const number = prompt('Digite o número do candidato (2 dígitos):');
    if (!number || number.length !== 2 || isNaN(number)) {
        alert('Número inválido! Deve conter 2 dígitos.');
        return;
    }

    const name = prompt('Digite o nome do candidato:');
    if (!name) {
        alert('Nome inválido!');
        return;
    }

    const party = prompt('Digite o partido do candidato:');
    if (!party) {
        alert('Partido inválido!');
        return;
    }

    const candidates = JSON.parse(localStorage.getItem('candidates'));
    
    // Verifica se o número já existe
    if (candidates.some(c => c.number === number)) {
        alert('Já existe um candidato com este número!');
        return;
    }

    candidates.push({ number, name, party });
    localStorage.setItem('candidates', JSON.stringify(candidates));
    alert('Candidato cadastrado com sucesso!');
}

// Mostra os resultados
function showResults() {
    const votes = JSON.parse(localStorage.getItem('votes'));
    const candidates = JSON.parse(localStorage.getItem('candidates'));
    
    let results = {};
    votes.forEach(vote => {
        results[vote] = (results[vote] || 0) + 1;
    });
    
    // Ordena por mais votados
    const sortedCandidates = candidates.sort((a, b) => {
        const votesA = results[a.number] || 0;
        const votesB = results[b.number] || 0;
        return votesB - votesA;
    });
    
    let resultsHTML = '<div class="results-list">';
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
    `;
    
    document.getElementById('results-content').innerHTML = resultsHTML;
    document.getElementById('results-modal').style.display = 'block';
}

// Gera relatório em PDF
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
    
    // Ordena por mais votados
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

// Zera a urna
function resetUrn() {
    if (confirm('Tem certeza que deseja ZERAR TODOS os dados da urna?\nEsta ação não pode ser desfeita!')) {
        localStorage.removeItem('votes');
        localStorage.removeItem('candidates');
        localStorage.setItem('candidates', JSON.stringify([]));
        localStorage.setItem('votes', JSON.stringify([]));
        alert('Urna zerada com sucesso!');
        correct();
    }
}

// Fecha o modal
function closeModal() {
    document.getElementById('results-modal').style.display = 'none';
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    
    // Fecha o modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
});