const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError } = require('../erros');
const bcrypt = require('bcrypt');
const BearerStrategy = require('passport-http-bearer');
const jwt = require('jsonwebtoken');
const keyJWT = process.env.KEY_JWT;

passport.use(
    new LocalStrategy({
        usernameField: 'email',
        passwordField: 'senha',
        session: false
    }, async (email, senha, done) => {
        try {
            const usuario = await Usuario.buscaPorEmail(email);
            verificaUsuario(usuario);
            await verificaSenha(senha, usuario.senhaHash);
            done(null, usuario);
        } catch (erro) {
            done(erro)
        }

    })
)

function verificaUsuario(usuario) {
    if (!usuario) {
        throw new InvalidArgumentError('Não existe usuário com esse email.');
    }
}

async function verificaSenha(senha, senhaHash) {
    const senhaValida = await bcrypt.compare(senha, senhaHash);
    if (!senhaValida) {
        throw new InvalidArgumentError('Email ou senha inválidos.')
    }
}

passport.use(
    new BearerStrategy(
        async (token, done) => {
            try {
                const payload = jwt.verify(token, keyJWT);
                const usuario = await Usuario.buscaPorId(payload.id);
                done(null, usuario);
            } catch (error) {
                done(erro);
            }
        }
    )
)