const nodemailer = require('nodemailer');

module.exports = nodemailer.createTransport({
  host: 'smtp.seu-provedor.com',
  port: 587,
  secure: false,
  auth: {
    user: 'seu-usuario',
    pass: 'sua-senha'
  }
});
