const bcrypt = require('bcryptjs');

const senhaOriginal = 'admin123'; // << aqui é sua senha original
const salt = bcrypt.genSaltSync(10); // gera um "sal" aleatório para reforçar a segurança
const senhaCriptografada = bcrypt.hashSync(senhaOriginal, salt); // gera a senha criptografada

console.log('Senha criptografada:', senhaCriptografada);
