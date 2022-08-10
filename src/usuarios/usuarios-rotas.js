const usuariosControlador = require('./usuarios-controlador');
const middlewaresAutenticacao = require('./middlewares-autenticacao');

module.exports = app => {

  app
    .route('/usuario/login')
    .post(middlewaresAutenticacao.local, usuariosControlador.login)

  app
    .route('/usuario/logout')
    .post([middlewaresAutenticacao.refresh, middlewaresAutenticacao.bearer], usuariosControlador.logout)

  app
    .route('/usuario')
    .post(usuariosControlador.adiciona)
    .get(usuariosControlador.lista);

  app
    .route('/usuario/verifica_email/:id')
    .get(usuariosControlador.verificaEmail);

  app
    .route('/usuario/:id')
    .get(usuariosControlador.buscaPorId)
    .delete(middlewaresAutenticacao.bearer, usuariosControlador.deleta);

  app
    .route('/usuario/atualiza_token')
    .post(middlewaresAutenticacao.refresh, usuariosControlador.login)

};
