const usuariosControlador = require('./usuarios-controlador');
const passport = require('passport');
const middlewaresAutenticacao = require('./middlewares-autenticacao');

module.exports = app => {

  app
    .route('/usuario/login')
    .post(middlewaresAutenticacao.local, usuariosControlador.login)

  app
    .route('/usuario')
    .post(usuariosControlador.adiciona)
    .get(usuariosControlador.lista);

  app
    .route('/usuario/:id')
    .get(usuariosControlador.buscaPorId)
    .delete(middlewaresAutenticacao.bearer, usuariosControlador.deleta);
};
