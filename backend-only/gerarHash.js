const bcrypt = require('bcryptjs');

async function gerarHash() {
  try {
    const senha = 'davi080401'; // substitua pela senha desejada
    const hash = await bcrypt.hash(senha, 10); // 10 é o salt rounds
    console.log('Hash gerado:', hash);
  } catch (err) {
    console.error('Erro ao gerar hash:', err);
  }
}

gerarHash();
