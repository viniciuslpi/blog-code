const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError, InternalServerError } = require('../erros');
const jwt = require('jsonwebtoken');
const keyJWT = process.env.KEY_JWT;

function criaTokenJWT(usuario){
  const payload = {
    id: usuario.id
  }

  // COMANDO PARA GERAR UMA CHAVE ALEATORIA USANDO CRYPTO
  //  node -e "console.log(require('crypto').randomBytes(256).toString('base64'))" 

  const token = jwt.sign(payload, keyJWT, { expiresIn: '1s' });
  return token;
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

  login: (req, res) => {
    const token = criaTokenJWT(req.user);
    res.set('Authorization', token);
    res.status(204).send();
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
