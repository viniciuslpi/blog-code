const nodemailer = require('nodemailer');

const criaConfiguracaoEmailTeste = (contaTeste) => ({
    host: 'smtp.ethereal.email',
    auth: contaTeste,
});

const configuracaoEmailProducao = {
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_USUARIO,
        pass: process.env.EMAIL_SENHA
    },
    secure: true
}

async function criaConfiguracaoEmail() {
    if (process.env.NODE_ENV === 'production') {
        return configuracaoEmailProducao;
    } else {
        const contaTeste = await nodemailer.createTestAccount();
        return criaConfiguracaoEmailTeste(contaTeste);
    }
}

class Email {

    async enviaEmail() {
        const configuracaoEmail = await criaConfiguracaoEmail();
        const transportador = nodemailer.createTransport(configuracaoEmail);
        const info = await transportador.sendMail(this);
        if (process.env.NODE_ENV !== 'production') {
            console.log('URL: ' + nodemailer.getTestMessageUrl(info));
        }
    }
}

class EmailVerificacao extends Email {
    constructor(usuario, endereco) {
        super();
        this.from = '"Blog do Cógido" <vinicius.pimentel@tems.com.br>';
        this.to = usuario.email;
        this.subject = 'Verificação de email';
        this.text = `Olá! Verifique seu email aqui: ${endereco}`;
        this.html = `<h1>Olá!</h1> Verifique seu email aqui: <a href="http://${endereco}">${endereco}</a>`;
    }
}

module.exports = { EmailVerificacao };