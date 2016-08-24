'use strict';

module.exports = function jenkinsApi(config) {
  const http = config.http;
  const storage = config.storage;
  const url = `${config.domain}/api/json`;
  const logger = config.logger || {};

  return {
    authenticate
  };

  /**
   * Authenticates the user by saving his credentials to the storage (user/apiKey)
   * @param  {Object} params [description]
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
          const errorMessage = `Got a ${res.statusCode} while authenticating: ${res.statusMessage}`;
          logger.error(errorMessage);
          return reject(errorMessage);
        }
        const jenkinsWaiter = Object.assign({credentials: {}}, storage.get('jenkinsWaiter'));
        jenkinsWaiter.credentials[params.chatUser] = {
          user: params.user,
          apiKey: params.apiKey
        };
        storage.set('jenkinsWaiter', jenkinsWaiter);
        logger.info(`Authenticated ${JSON.stringify(params.response.message.user.name)} on Jenkins.`);
        resolve(`You're authenticated now. I'll use your credentials for all the commands you give me.`);
      });
    });
  }
};
