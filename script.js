const board = document.getElementById('game-board');
const restartBtn = document.getElementById('restart-btn');

// Seletores das telas
const cadastroSection = document.getElementById('cadastro-section');
const jogoSection = document.getElementById('jogo-section');
const premioSection = document.getElementById('premio-section');
const failSection = document.getElementById('fail-section');

// Formulário de cadastro
const cadastroForm = document.getElementById('cadastro-form');
const nomeInput = document.getElementById('nome');
const telefoneInput = document.getElementById('telefone');
const emailInput = document.getElementById('email');
const cpfInput = document.getElementById('cpf');
const cadastroErro = document.getElementById('cadastro-erro');

// Info do jogo
const memorizarTimer = document.getElementById('memorizar-timer');
const jogoTimer = document.getElementById('jogo-timer');
const tentativasSpan = document.getElementById('tentativas');

// Configurações do jogo
const icons = ['🍎','🍌','🍇','🍉','🍒','🍋','🍓','🍍','🥝','🥥']; // 10 pares
let cards = [];
let flippedCards = [];
let lockBoard = false;
let tentativas = 0;
let memorizarTimeout, jogoTimeout, jogoInterval;
let jogadorCPF = '';

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showSection(section) {
    cadastroSection.style.display = 'none';
    jogoSection.style.display = 'none';
    premioSection.style.display = 'none';
    failSection.style.display = 'none';
    section.style.display = 'block';
}

function validarCPF(cpf) {
    return /^\d{11}$/.test(cpf);
}

function cadastroJaFeito(cpf) {
    const usados = JSON.parse(localStorage.getItem('cpfs_usados') || '[]');
    return usados.includes(cpf);
}

function marcarCPFusado(cpf) {
    const usados = JSON.parse(localStorage.getItem('cpfs_usados') || '[]');
    usados.push(cpf);
    localStorage.setItem('cpfs_usados', JSON.stringify(usados));
}

cadastroForm.onsubmit = function(e) {
    e.preventDefault();
    cadastroErro.textContent = '';
    const nome = nomeInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const email = emailInput.value.trim();
    const cpf = cpfInput.value.trim();
    if (!nome || !telefone || !email || !cpf) {
        cadastroErro.textContent = 'Preencha todos os campos.';
        return;
    }
    if (!validarCPF(cpf)) {
        cadastroErro.textContent = 'CPF inválido. Informe 11 dígitos.';
        return;
    }
    if (cadastroJaFeito(cpf)) {
        cadastroErro.textContent = 'Este CPF já jogou.';
        return;
    }
    jogadorCPF = cpf;
    showSection(jogoSection);
    iniciarJogo();
};

function iniciarJogo() {
    // Configura matriz 4x5
    board.innerHTML = '';
    tentativas = 0;
    tentativasSpan.textContent = 'Tentativas: 0';
    memorizarTimer.textContent = 'Memorize: 10s';
    jogoTimer.textContent = '';
    let pares = shuffle([...icons, ...icons]);
    cards = pares.map((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;
        card.dataset.index = index;
        card.innerHTML = '<span>' + icon + '</span>';
        card.addEventListener('click', flipCard);
        board.appendChild(card);
        return card;
    });
    board.style.gridTemplateColumns = 'repeat(5, 80px)';
    board.style.gridGap = '10px';
    // Mostrar todas as cartas por 10s
    cards.forEach(card => {
        card.classList.add('flipped');
        card.querySelector('span').style.visibility = 'visible';
    });
    lockBoard = true;
    memorizarTimeout = setTimeout(() => {
        cards.forEach(card => {
            card.classList.remove('flipped');
            card.querySelector('span').style.visibility = 'hidden';
        });
        lockBoard = false;
        iniciarContagemJogo();
    }, 10000);
    let tempoRestante = 10;
    let memorizarInterval = setInterval(() => {
        tempoRestante--;
        memorizarTimer.textContent = 'Memorize: ' + tempoRestante + 's';
        if (tempoRestante <= 0) clearInterval(memorizarInterval);
    }, 1000);
}

function iniciarContagemJogo() {
    let tempo = 60;
    jogoTimer.textContent = 'Tempo: 60s';
    jogoInterval = setInterval(() => {
        tempo--;
        jogoTimer.textContent = 'Tempo: ' + tempo + 's';
        if (tempo <= 0) {
            clearInterval(jogoInterval);
            encerrarJogo(false);
        }
    }, 1000);
    jogoTimeout = setTimeout(() => {
        encerrarJogo(false);
    }, 60000);
}

function flipCard() {
    if (lockBoard) return;
    if (this.classList.contains('flipped') || this.classList.contains('matched')) return;
    this.classList.add('flipped');
    this.querySelector('span').style.visibility = 'visible';
    flippedCards.push(this);
    if (flippedCards.length === 2) {
        tentativas++;
        tentativasSpan.textContent = 'Tentativas: ' + tentativas;
        checkForMatch();
    }
}

function checkForMatch() {
    lockBoard = true;
    const [card1, card2] = flippedCards;
    if (card1.dataset.icon === card2.dataset.icon) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        flippedCards = [];
        lockBoard = false;
        if (document.querySelectorAll('.matched').length === cards.length) {
            encerrarJogo(true);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.querySelector('span').style.visibility = 'hidden';
            card2.querySelector('span').style.visibility = 'hidden';
            flippedCards = [];
            lockBoard = false;
        }, 1000);
    }
}

function encerrarJogo(venceu) {
    clearTimeout(memorizarTimeout);
    clearTimeout(jogoTimeout);
    clearInterval(jogoInterval);
    marcarCPFusado(jogadorCPF);
    if (venceu) {
        showSection(premioSection);
    } else {
        showSection(failSection);
    }
}

restartBtn.addEventListener('click', iniciarJogo);

// Inicialização: mostrar tela de cadastro
showSection(cadastroSection);
