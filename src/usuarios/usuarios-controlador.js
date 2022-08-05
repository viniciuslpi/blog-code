const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError, InternalServerError } = require('../erros');
const jwt = require('jsonwebtoken');
const keyJWT = process.env.KEY_JWT;
const crypto = require('crypto');
const moment = require('moment');
const blacklist = require('../../redis/blacklist-acess-token');
const allowlistRefreshToken = require('../../redis/allowlist-refresh-token');

function criaTokenJWT(usuario) {
  const payload = {
    id: usuario.id
  }

  // COMANDO PARA GERAR UMA CHAVE ALEATORIA USANDO CRYPTO
  //  node -e "console.log(require('crypto').randomBytes(256).toString('base64'))" 

  const token = jwt.sign(payload, keyJWT, { expiresIn: '15s' });
  return token;
}

async function criaTokenOpaco(usuario) {
  const tokenOpaco = crypto.randomBytes(24).toString('hex');
  const dataExpiracao = moment().add(5, 'd').unix();
  await allowlistRefreshToken.adiciona(tokenOpaco, usuario.id, dataExpiracao);
  return tokenOpaco;
}


module.exports = {
  async adiciona (req, res){
    const { nome, email, senha } = req.body;

    try {
      const usuario = new Usuario({
        nome,
        email
      });

      await usuario.adicionaSenha(senha);

      await usuario.adiciona();

      res.status(201).json();
    } catch (erro) {
      if (erro instanceof InvalidArgumentError) {
        res.status(422).json({ erro: erro.message });
      } else if (erro instanceof InternalServerError) {
        res.status(500).json({ erro: erro.message });
      } else {
        res.status(500).json({ erro: erro.message });
      }
    }
  },

  async login (req, res) {
    try {
      const acessToken = criaTokenJWT(req.user);
      const refreshToken = await criaTokenOpaco(req.user);
      res.set('Authorization', acessToken);
      res.status(200).json({ refreshToken });
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }

  },

  async logout (req, res) {
    try {
      const token = req.token;
      await blacklist.adiciona(token);
      res.status(204).json({ message: 'Voce executou o logout'});
    } catch (erro) {
      res.status(500).json({ erro: erro.message })
    }
  },

  async lista (req, res) {
    const usuarios = await Usuario.lista();
    res.json(usuarios);
  },

  async deleta (req, res) {
    const usuario = await Usuario.buscaPorId(req.params.id);
    try {
      await usuario.deleta();
      res.status(200).send();
    } catch (erro) {
      res.status(500).json({ erro: erro });
    }
  },

  async buscaPorId (req, res) {
    try {
      const usuario = await Usuario.buscaPorId(req.params.id);
      res.status(200).send(usuario);
    } catch (erro) {
      res.status(500).json({ erro: erro });
    }
  }
};
