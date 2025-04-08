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

// ... (mantenha todas as funções existentes até showCandidateForm) ...

function showCandidateForm() {
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
}

// Funções para manipulação de fotos
function openFileExplorer() {
    document.getElementById('file-input').click();
}

document.getElementById('file-input').addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            candidatePhotoUrl = event.target.result;
            document.getElementById('register-preview').innerHTML = 
                `<img src="${candidatePhotoUrl}" alt="Pré-visualização">`;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

async function startCamera() {
    try {
        const video = document.getElementById('camera-preview');
        video.style.display = 'block';
        document.getElementById('camera-controls').style.display = 'flex';
        
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
        });
        video.srcObject = cameraStream;
    } catch (err) {
        alert('Não foi possível acessar a câmera: ' + err.message);
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
    
    candidatePhotoUrl = canvas.toDataURL('image/jpeg');
    document.getElementById('register-preview').innerHTML = 
        `<img src="${candidatePhotoUrl}" alt="Foto capturada">`;
    
    stopCamera();
}

// ... (mantenha todas as outras funções existentes) ...

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