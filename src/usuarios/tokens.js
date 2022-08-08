const keyJWT = process.env.KEY_JWT;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const allowlistRefreshToken = require('../../redis/allowlist-refresh-token');
const blacklistAcessToken = require('../../redis/blacklist-acess-token');
const { InvalidArgumentError } = require('../erros');


// COMANDO PARA GERAR UMA CHAVE ALEATORIA USANDO CRYPTO
//  node -e "console.log(require('crypto').randomBytes(256).toString('base64'))" 

function criaTokenJWT(id, [tempoQuantidade, tempoUnidade]) {
    const payload = { id }
    const token = jwt.sign(payload, keyJWT, { expiresIn: tempoQuantidade + tempoUnidade });
    return token;
}

async function verificaTokenJwt(token, blacklist) {
    await verificaTokenBlackList(token, blacklist);
    const { id } = jwt.verify(token, keyJWT);
    return id;
}

async function verificaTokenBlackList(token, blacklist) {
    const tokenBlacklist = await blacklist.contemToken(token);
    if (tokenBlacklist) {
        throw new jwt.JsonWebTokenError('Token invalidado por logout');
    }
}

async function criaTokenOpaco(id, [tempoQuantidade, tempoUnidade], allowlist) {
    const tokenOpaco = crypto.randomBytes(24).toString('hex');
    const dataExpiracao = moment().add(tempoQuantidade, tempoUnidade).unix();
    await allowlist.adiciona(tokenOpaco, id, dataExpiracao);
    return tokenOpaco;
}

async function verificaTokenOpaco(token, nome, allowlist) {
    verificaTokenEnviado(token, nome);
    const id = await allowlist.buscaValor(token);
    verificaTokenValido(id, nome);
    return id;
}

function verificaTokenEnviado(token, nome) {
    if (!token) {
        throw new InvalidArgumentError(`${nome} nao enviado!`);
    }
}

function verificaTokenValido(id, nome) {
    if (!id) {
        throw new InvalidArgumentError(`${nome} é invalido!`);
    }
}


module.exports = {
    acess: {
        lista: blacklistAcessToken,
        expiracao: [15, 'm'],
        cria(id) {
            return criaTokenJWT(id, this.expiracao);
        },
        verifica(token) {
            return verificaTokenJwt(token, this.lista);
        }
    },
    refresh: {
        nome: 'refresh token',
        expiracao: [5, 'd'],
        lista: allowlistRefreshToken,
        cria(id) {
            return criaTokenOpaco(id, this.expiracao, this.lista);
        },
        verifica(token) {
            return verificaTokenOpaco(token, this.nome, this.lista);
        }
    }

}

