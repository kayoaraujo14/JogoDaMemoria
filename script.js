  const board = document.getElementById('game-board');

  // Seções do jogo
  const cadastroSection = document.getElementById('cadastro-section');
  const jogoSection = document.getElementById('jogo-section');
  const premioSection = document.getElementById('premio-section');
  const failSection = document.getElementById('fail-section');

  // Formulário
  const cadastroForm = document.getElementById('cadastro-form');
  const nomeInput = document.getElementById('nome');
  const telefoneInput = document.getElementById('telefone');
  const emailInput = document.getElementById('email');
  const cpfInput = document.getElementById('cpf');
  const cadastroErro = document.getElementById('cadastro-erro');

  // Informações do jogo
  const memorizarTimer = document.getElementById('memorizar-timer');
  const jogoTimer = document.getElementById('jogo-timer');
  const tentativasSpan = document.getElementById('tentativas');

  // Teclado virtual
  const tecladoVirtual = document.getElementById('teclado-virtual');

  // Variáveis do jogo
  // Substitua o array de emojis por imagens PNG do diretório 'imagens'
  const icons = [
    'imagens/banco.png',
    'imagens/calculadora.png',
    'imagens/cartao_credito.png',
    'imagens/casa_moeda.png',
    'imagens/cedula.png',
    'imagens/cofre.png',
    'imagens/folha.png',
    'imagens/investimento.png',
    'imagens/saco_dinheiro.png',
    'imagens/seguro.png'
  ];
  let cards = [];
  let flippedCards = [];
  let lockBoard = false;
  let tentativas = 0;
  let memorizarTimeout, jogoTimeout, jogoInterval;
  let jogadorCPF = '';

  // Embaralhar array
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Exibir seções
  function showSection(section) {
    [cadastroSection, jogoSection, premioSection, failSection].forEach(sec => sec.style.display = 'none');
    section.style.display = 'block';
    tecladoVirtual.style.display = section === cadastroSection ? 'block' : 'none';
    if (section === cadastroSection) {
      nomeInput.focus();
    }
  }

  // Validação e controle de CPF
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

  function salvarDadosJogador(nome, telefone, email, cpf) {
    const jogadores = JSON.parse(localStorage.getItem('jogadores') || '[]');
    jogadores.push({ nome, telefone, email, cpf });
    localStorage.setItem('jogadores', JSON.stringify(jogadores));
  }

  function baixarCSV() {
    const jogadores = JSON.parse(localStorage.getItem('jogadores') || '[]');
    if (jogadores.length === 0) return alert('Nenhum dado para exportar.');

    const linhas = ["Nome,Telefone,Email,CPF"];
    jogadores.forEach(j => {
      linhas.push(`"${j.nome}","${j.telefone}","${j.email}","${j.cpf}"`);
    });

    const blob = new Blob([linhas.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jogadores.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpa os dados do localStorage após exportar
    localStorage.removeItem('jogadores');
    localStorage.removeItem('cpfs_usados');

    // Limpa variáveis em memória
    // Se houver variáveis globais relacionadas, zere-as aqui
    // Por segurança, recarrega a página para garantir limpeza total
    setTimeout(() => { location.reload(); }, 300);
  }

  const botaoCSV = document.createElement('button');
  botaoCSV.textContent = 'Baixar CSV';
  botaoCSV.id = 'baixar-csv';
  botaoCSV.onclick = baixarCSV;
  cadastroSection.insertBefore(botaoCSV, cadastroSection.firstElementChild);

  // Submissão do formulário
  cadastroForm.onsubmit = function (e) {
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
      cadastroErro.textContent = 'CPF inválido. Digite 11 números.';
      return;
    }
    if (cadastroJaFeito(cpf)) {
      cadastroErro.textContent = 'Este CPF já jogou.';
      return;
    }

    jogadorCPF = cpf;
    salvarDadosJogador(nome, telefone, email, cpf);
    showSection(jogoSection);
    iniciarJogo();
  };

  function iniciarJogo() {
    board.innerHTML = '';
    tentativas = 0;
    tentativasSpan.textContent = 'Tentativas: 0';
    memorizarTimer.textContent = 'Memorize: 10s';
    memorizarTimer.style.display = 'block';
    jogoTimer.textContent = '';
    jogoTimer.style.display = 'none';

    let pares = shuffle([...icons, ...icons]);
    cards = pares.map((icon, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.icon = icon;
      card.dataset.index = i;
      // Exibe imagem ao invés de emoji, sem limitar o tamanho
      card.innerHTML = `<span><img src="${icon}" alt="Ícone" style="user-select:none;pointer-events:none;" /></span>`;
      card.addEventListener('click', flipCard);
      board.appendChild(card);
      return card;
    });

    board.style.gridTemplateColumns = 'repeat(4, 120px)';
    board.style.gridGap = '24px';

    cards.forEach(card => {
      card.classList.add('flipped');
      card.querySelector('span').style.visibility = 'visible';
    });

    lockBoard = true;
    let tempoRestante = 10;
    memorizarTimeout = setTimeout(() => {
      cards.forEach(card => {
        card.classList.remove('flipped');
        card.querySelector('span').style.visibility = 'hidden';
      });
      memorizarTimer.style.display = 'none';
      jogoTimer.style.display = 'block';
      lockBoard = false;
      iniciarContagemJogo();
    }, 10000);

    const memorizarInterval = setInterval(() => {
      tempoRestante--;
      memorizarTimer.textContent = `Memorize: ${tempoRestante}s`;
      if (tempoRestante <= 0) clearInterval(memorizarInterval);
    }, 1000);
  }

  function iniciarContagemJogo() {
    let tempo = 60;
    jogoTimer.textContent = 'Tempo: 60s';
    jogoTimer.style.display = 'block';
    jogoInterval = setInterval(() => {
      tempo--;
      jogoTimer.textContent = `Tempo: ${tempo}s`;
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
    if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;

    this.classList.add('flipped');
    this.querySelector('span').style.visibility = 'visible';
    flippedCards.push(this);

    if (flippedCards.length === 2) {
      tentativas++;
      tentativasSpan.textContent = `Tentativas: ${tentativas}`;
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

    showSection(venceu ? premioSection : failSection);
  }

  document.getElementById('voltar-cadastro-premio').onclick = resetarCadastro;
  document.getElementById('voltar-cadastro-fail').onclick = resetarCadastro;

  function resetarCadastro() {
    cadastroForm.reset();
    cadastroErro.textContent = '';
    showSection(cadastroSection);
    nomeInput.focus();
  }

  let inputAtivo = null;

function criarTeclado(tipo = 'text') {
  const teclado = {
    number: [
      ['1','2','3'],
      ['4','5','6'],
      ['7','8','9'],
      ['0','←','Próximo']
    ],
    text: [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l','←'],
      ['z','x','c','v','b','n','m','Próximo'],
      ['_','-','Espaço','.','@']
    ]
  };
  tecladoVirtual.innerHTML = '';
  teclado[tipo].forEach(linha => {
    const div = document.createElement('div');
    div.className = 'linha-teclado';
    linha.forEach(tecla => {
      const btn = document.createElement('button');
      btn.className = 'tecla' + (['←','Próximo','Espaço'].includes(tecla) ? ' tecla-func' : '');
      btn.textContent = tecla;
      if (tecla === 'Espaço') btn.style.minWidth = '120px';
      btn.onclick = () => teclaClicada(tecla);
      div.appendChild(btn);
    });
    tecladoVirtual.appendChild(div);
  });
}

function teclaClicada(tecla) {
  if (!inputAtivo) return;
  if (tecla === 'Próximo') {
    // Avança para o próximo campo do formulário
    const campos = [nomeInput, telefoneInput, emailInput, cpfInput];
    const idx = campos.indexOf(inputAtivo);
    if (idx !== -1 && idx < campos.length - 1) {
      campos[idx + 1].focus();
    } else if (idx === campos.length - 1) {
      inputAtivo.blur();
    }
    return;
  }
  if (tecla === '←') return inputAtivo.value = inputAtivo.value.slice(0, -1);
  if (tecla === 'Espaço') return inputAtivo.value += ' ';
  if (inputAtivo.id === 'cpf' && inputAtivo.value.length >= 11) return;
  if (inputAtivo.id === 'telefone' && inputAtivo.value.length >= 11) return;
  inputAtivo.value += tecla;
}

[nomeInput, telefoneInput, emailInput, cpfInput].forEach(input => {
  input.addEventListener('focus', (e) => {
    inputAtivo = e.target;
    if (cadastroSection.style.display === 'block') {
      criarTeclado(input.id === 'cpf' || input.id === 'telefone' ? 'number' : 'text');
    }
  });
});

showSection(cadastroSection);
criarTeclado('text');
