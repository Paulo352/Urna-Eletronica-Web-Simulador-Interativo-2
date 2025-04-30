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
let isProcessing = false;

// Inicialização dos dados
function initializeData() {
    try {
        if (!localStorage.getItem('candidates')) {
            localStorage.setItem('candidates', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('votes')) {
            localStorage.setItem('votes', JSON.stringify([]));
        }
        
        adminPassword = localStorage.getItem('adminPassword') || DEFAULT_PASSWORD;
        localStorage.setItem('adminPassword', adminPassword);
        
        if (!localStorage.getItem('electionRoles')) {
            localStorage.setItem('electionRoles', JSON.stringify([]));
        }
        
        currentRole = localStorage.getItem('currentRole') || '';
        
        updateRoleDisplay();
        updateClock();
        updateMessages();
    } catch (e) {
        console.error("Erro na inicialização:", e);
        // Recuperação básica em caso de erro
        localStorage.clear();
        initializeData();
    }
}

// Atualiza o relógio
function updateClock() {
    try {
        const brasiliaTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const clock = document.getElementById('clock');
        
        const day = String(brasiliaTime.getDate()).padStart(2, '0');
        const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
        const year = brasiliaTime.getFullYear();
        const hours = String(brasiliaTime.getHours()).padStart(2, '0');
        const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
        
        clock.textContent = `${day}/${month}/${year} ${hours}:${minutes} (BRT)`;
        setTimeout(updateClock, 60000);
    } catch (e) {
        console.error("Erro ao atualizar relógio:", e);
        setTimeout(updateClock, 60000);
    }
}

// Atualiza mensagens na tela
function updateMessages() {
    try {
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
    } catch (e) {
        console.error("Erro ao atualizar mensagens:", e);
    }
}

// Funções da urna
function addNumber(num) {
    if (!electionActive || isProcessing) return;
    if (currentNumber.length < 2 && /^[0-9]$/.test(num)) {
        currentNumber += num;
        updateDisplay();
        checkCandidate();
        
        if (accessibilityMode) {
            speak(`Digitado ${num}`);
        }
    }
}

function correct() {
    if (isProcessing) return;
    currentNumber = '';
    currentCandidate = null;
    updateDisplay();
    
    if (accessibilityMode) {
        speak('Voto corrigido');
    }
}

function confirmVote() {
    if (!electionActive || isProcessing) return;
    
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

    isProcessing = true;
    try {
        if (registerVote(currentNumber)) {
            alert(`Voto confirmado para ${currentCandidate.name} (${currentCandidate.party})!`);
            correct();
            
            if (accessibilityMode) {
                speak(`Voto confirmado para ${currentCandidate.name}`);
            }
        } else {
            throw new Error("Falha ao registrar voto");
        }
    } catch (error) {
        console.error("Erro ao confirmar voto:", error);
        alert("Ocorreu um erro ao registrar seu voto.");
    } finally {
        isProcessing = false;
    }
}

function voteNull() {
    if (!electionActive || isProcessing) return;
    if (confirm("Deseja votar NULO?")) {
        isProcessing = true;
        try {
            if (registerVote(NULL_VOTE)) {
                alert("Voto NULO confirmado!");
                correct();
                
                if (accessibilityMode) {
                    speak('Voto nulo confirmado');
                }
            } else {
                throw new Error("Falha ao registrar voto nulo");
            }
        } catch (error) {
            console.error("Erro ao registrar voto nulo:", error);
            alert("Ocorreu um erro ao registrar o voto nulo.");
        } finally {
            isProcessing = false;
        }
    }
}

function voteBlank() {
    if (!electionActive || isProcessing) return;
    if (confirm("Deseja votar em BRANCO?")) {
        isProcessing = true;
        try {
            if (registerVote(BLANK_VOTE)) {
                alert("Voto em BRANCO confirmado!");
                correct();
                
                if (accessibilityMode) {
                    speak('Voto em branco confirmado');
                }
            } else {
                throw new Error("Falha ao registrar voto em branco");
            }
        } catch (error) {
            console.error("Erro ao registrar voto em branco:", error);
            alert("Ocorreu um erro ao registrar o voto em branco.");
        } finally {
            isProcessing = false;
        }
    }
}

function registerVote(voteType) {
    try {
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const voteData = {
            type: voteType,
            role: currentRole,
            timestamp: new Date().toISOString(),
            hash: generateVoteHash(voteType)
        };
        votes.push(voteData);
        localStorage.setItem('votes', JSON.stringify(votes));
        return true;
    } catch (e) {
        console.error("Erro ao registrar voto:", e);
        return false;
    }
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
        try {
            const candidates = JSON.parse(localStorage.getItem('candidates')) || [];
            currentCandidate = candidates.find(c => c.number === currentNumber && c.role === currentRole);
            
            const nameElement = document.getElementById('candidate-name');
            const partyElement = document.getElementById('candidate-party');
            const viceElement = document.getElementById('vice-name');
            const photoContainer = document.querySelector('.photo-container');
            
            if (currentCandidate) {
                nameElement.textContent = currentCandidate.name || "";
                partyElement.textContent = currentCandidate.party || "";
                viceElement.textContent = currentCandidate.viceName || "Não informado";
                
                if (currentCandidate.photo) {
                    photoContainer.innerHTML = `<img src="${currentCandidate.photo}" alt="${currentCandidate.name}" style="width:100%;height:100%;object-fit:cover;">`;
                } else {
                    photoContainer.innerHTML = '<div class="photo-placeholder"><i class="fas fa-user"></i></div>';
                }
            } else {
                nameElement.textContent = "";
                partyElement.textContent = "";
                viceElement.textContent = "";
                photoContainer.innerHTML = '<div class="photo-placeholder"><i class="fas fa-user"></i></div>';
            }
        } catch (e) {
            console.error("Erro ao verificar candidato:", e);
        }
    }
    updateMessages();
}

function updateRoleDisplay() {
    try {
        const roleDisplay = document.getElementById('current-role-display');
        const voteRoleDisplay = document.getElementById('vote-role-display');
        
        if (currentRole) {
            roleDisplay.textContent = `- ${currentRole.toUpperCase()}`;
            voteRoleDisplay.textContent = currentRole.toUpperCase();
        } else {
            roleDisplay.textContent = '';
            voteRoleDisplay.textContent = '[NÃO SELECIONADO]';
        }
    } catch (e) {
        console.error("Erro ao atualizar exibição de cargo:", e);
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
    if (isProcessing) return;
    
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
            <label>Foto do Candidato (opcional):</label>
            <div id="register-preview">
                <i class="fas fa-user"></i>
            </div>
            <div class="photo-options">
                <button type="button" id="upload-btn" class="btn btn-primary">
                    <i class="fas fa-folder-open"></i> Escolher Foto
                </button>
            </div>
        </div>
        <div style="display: flex; gap: 10px;">
            <button type="button" id="save-candidate" class="btn btn-primary" style="flex: 1;">
                <i class="fas fa-save"></i> Salvar
            </button>
            <button type="button" onclick="closeModal()" class="btn btn-danger">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;
    
    showModal(modalContent);
    candidatePhotoUrl = null;

    // Configura o upload de foto
    document.getElementById('upload-btn').addEventListener('click', function() {
        document.getElementById('file-input').click();
    });

    document.getElementById('file-input').onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Por favor, selecione um arquivo de imagem válido (JPEG, PNG, etc.)');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            alert('A imagem deve ter menos de 2MB');
            return;
        }

        showLoading(true);
        document.getElementById('upload-btn').disabled = true;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            candidatePhotoUrl = event.target.result;
            document.getElementById('register-preview').innerHTML = 
                `<img src="${candidatePhotoUrl}" alt="Foto do candidato" style="max-width:100%;max-height:100%;">`;
            document.getElementById('upload-btn').disabled = false;
            showLoading(false);
        };
        reader.onerror = function() {
            alert('Erro ao carregar a imagem. Por favor, tente novamente.');
            document.getElementById('upload-btn').disabled = false;
            showLoading(false);
        };
        reader.readAsDataURL(file);
    };

    // Configura o botão de salvar
    document.getElementById('save-candidate').addEventListener('click', registerCandidate);
}

function registerCandidate() {
    if (isProcessing) return;
    isProcessing = true;
    showLoading(true);
    
    try {
        const role = document.getElementById('candidate-role').value.trim();
        const number = document.getElementById('candidate-number').value.trim();
        const name = document.getElementById('candidate-name').value.trim();
        const party = document.getElementById('candidate-party').value.trim().toUpperCase();
        const viceName = document.getElementById('vice-name').value.trim();

        // Validações
        if (!role || role.length < 3) {
            throw new Error('O cargo deve ter pelo menos 3 caracteres!');
        }

        if (!number || number.length !== 2 || !/^\d+$/.test(number)) {
            throw new Error('O número deve conter exatamente 2 dígitos numéricos!');
        }

        if (!name || name.length < 5) {
            throw new Error('O nome deve ter pelo menos 5 caracteres!');
        }

        if (!party || party.length < 2 || party.length > 10) {
            throw new Error('A sigla do partido deve ter entre 2 e 10 caracteres!');
        }

        // Verificar duplicidade
        const candidates = JSON.parse(localStorage.getItem('candidates')) || [];
        const duplicate = candidates.some(c => 
            c.number === number && c.role.toLowerCase() === role.toLowerCase()
        );

        if (duplicate) {
            const existing = candidates.find(c => c.number === number);
            throw new Error(`Número já usado por: ${existing.name} (${existing.party})`);
        }

        // Criar novo candidato
        const newCandidate = {
            role: role,
            number: number,
            name: name,
            party: party,
            viceName: viceName || "Não informado",
            viceParty: party,
            photo: candidatePhotoUrl || null,
            createdAt: new Date().toISOString()
        };

        // Atualizar lista e salvar
        candidates.push(newCandidate);
        localStorage.setItem('candidates', JSON.stringify(candidates));

        alert(`
          Candidato cadastrado com sucesso!
          \nCargo: ${role}
          \nNúmero: ${number}
          \nNome: ${name}
          \nPartido: ${party}
          ${viceName ? `\nVice: ${viceName}` : ''}
        `);
        
        closeModal();
    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert(error.message || 'Erro ao cadastrar candidato. Verifique os dados.');
    } finally {
        isProcessing = false;
        showLoading(false);
        document.getElementById('file-input').value = '';
    }
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
    try {
        if (typeof jsPDF === 'undefined') {
            alert('Biblioteca jsPDF não carregada. Não é possível gerar o relatório.');
            return;
        }
        
        showLoading(true);
        
        const doc = new jsPDF();
        const votes = JSON.parse(localStorage.getItem('votes')) || [];
        const candidates = JSON.parse(localStorage.getItem('candidates')) || [];
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
        if (votes.length > 0 && yPos < 250) {
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
    } catch (e) {
        console.error("Erro ao gerar PDF:", e);
        alert("Erro ao gerar relatório. Verifique o console para detalhes.");
    } finally {
        showLoading(false);
    }
}

// Funções auxiliares
function showModal(content) {
    document.getElementById('modal-title').textContent = "Administração";
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('admin-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('admin-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('file-input').value = '';
    isProcessing = false;
    showLoading(false);
}

function showLoading(show) {
    document.getElementById('loading-spinner').style.display = show ? 'flex' : 'none';
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