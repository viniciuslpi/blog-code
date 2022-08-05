const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError } = require('../erros');
const bcrypt = require('bcrypt');
const BearerStrategy = require('passport-http-bearer').Strategy;
const jwt = require('jsonwebtoken');
const keyJWT = process.env.KEY_JWT;
const blacklist = require('../../redis/blacklist-acess-token');

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

async function verificaTokenBlackList(token) {
    const tokenBlacklist = await blacklist.contemToken(token);
    if (tokenBlacklist) {
        throw new jwt.JsonWebTokenError('Token invalidado por logout');
    }
}


passport.use(
    new BearerStrategy(
        async (token, done) => {
            try {
                await verificaTokenBlackList(token);
                const payload = jwt.verify(token, keyJWT);
                const usuario = await Usuario.buscaPorId(payload.id);
                done(null, usuario, { token: token });
            } catch (error) {
                done(error);
            }
        }
    )
)