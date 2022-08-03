const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError, InternalServerError } = require('../erros');
const jwt = require('jsonwebtoken');
const keyJWT = process.env.KEY_JWT;
const blacklist = require('../../redis/manipula-blacklist');
const crypto = require('crypto');
const moment = require('moment');

function criaTokenJWT(usuario) {
  const payload = {
    id: usuario.id
  }

  // COMANDO PARA GERAR UMA CHAVE ALEATORIA USANDO CRYPTO
  //  node -e "console.log(require('crypto').randomBytes(256).toString('base64'))" 

  const token = jwt.sign(payload, keyJWT, { expiresIn: '15m' });
  return token;
}

function criaTokenOpaco(usuario) {
  const tokenOpaco = crypto.randomBytes(24).toString('hex');
  const dataExpiracao = moment().add(5, 'd').unix();
  return tokenOpaco;
}


module.exports = {
  adiciona: async (req, res) => {
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

  login: async (req, res) => {
    try {
      const acessToken = criaTokenJWT(req.user);
      const refreshToken = criaTokenOpaco();
      res.set('Authorization', acessToken);
      res.status(200).json({ refreshToken });
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }

  },

  logout: async (req, res) => {
    try {
      const token = req.token;
      await blacklist.adiciona(token);
      res.status(204).send();
    } catch (erro) {
      res.status(500).json({ erro: erro.message })
    }
  },

  lista: async (req, res) => {
    const usuarios = await Usuario.lista();
    res.json(usuarios);
  },

  deleta: async (req, res) => {
    const usuario = await Usuario.buscaPorId(req.params.id);
    try {
      await usuario.deleta();
      res.status(200).send();
    } catch (erro) {
      res.status(500).json({ erro: erro });
    }
  },

  buscaPorId: async (req, res) => {
    const usuario = await Usuario.buscaPorId(req.params.id);
    try {
      //await usuario.lista();
      res.status(200).send(usuario);
    } catch (erro) {
      res.status(500).json({ erro: erro });
    }
  }
};
