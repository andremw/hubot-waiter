'use strict';

/**
 * Creates a new instance of the jenkinsApi
 * @param  {object} config API config
 * @param  {object} config.http The HTTP module that the API will use (currently a node-scoped-http-client)
 * @param  {object} config.storage The storage object (needs to have get and set methods)
 * @param  {string} config.domain Jenkins domain
 * @param  {object} config.logger The logger that will be used.
 * @return {Function} object.authenticate Function to authenticate the user by saving his credentials to the storage
 */
module.exports = function jenkinsApi(config) {
  const http = config.http;
  const storage = config.storage;
  const url = `${config.domain}/api/json`;
  const logger = config.logger || {};

  return {
    authenticate
  };

  /**
   * Authenticates the user by saving his credentials (user/apiKey) to the storage
   * @param  {string} params.user User's ID on Jenkins
   * @param  {string} params.apiKey User's API Key on Jenkins
   * @param  {integer} params.chatUserId User's id on the chat.
   * @return {Promise}        A resolved/reject promise with the result message.
   */
  function authenticate(params) {
    return new Promise((resolve, reject) => {
      logger.info(`Authenticating ${params.user}`);
      http(url)
      .auth(params.user, params.apiKey)
      .get()((err, res) => {
        if (err) {
          const errorMessage = `Couldn't authenticate. Got this error: ${err}`;
          logger.error(errorMessage);
          return reject(errorMessage);
        }
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          const errorMessage = `Got a ${res.statusCode} while authenticating ${params.user}: ${res.statusMessage}`;
          logger.error(errorMessage);
          return reject(errorMessage);
        }
        const jenkinsWaiter = Object.assign({credentials: {}}, storage.get('jenkinsWaiter'));
        jenkinsWaiter.credentials[params.chatUserId] = {
          user: params.user,
          apiKey: params.apiKey
        };
        storage.set('jenkinsWaiter', jenkinsWaiter);
        logger.info(`Authenticated ${JSON.stringify(params.user)} on Jenkins.`);
        resolve(`You're authenticated now. I'll use your credentials for all the commands you give me.`);
      });
    });
  }
};
