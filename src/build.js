'use strict';

module.exports = {
  build
};

function build(params) {
  const commandParams = {
    branch: params.response.match[1],
    jobName: params.aliases.getJobNameFromAlias(params.robot, params.response.match[2]) || params.response.match[2]
  };

  const user = params.response.message.user;
  const credentials = (params.robot.brain.get('jenkinsWaiter') || {credentials: {}}).credentials[user] || {};

  const buildUrl = `${params.JENKINS_URL}/buildByToken/buildWithParameters?job=${commandParams.jobName}&token=${params.TOKEN}&BRANCH=${commandParams.branch}`;

  params.robot.logger.info(`Building with ${credentials.user}/${credentials.apiKey}. Request made to ${buildUrl}`);
  params.robot
    .http(buildUrl)
    .auth(credentials.user, credentials.apiKey)
    .get()((err, res) => {
      params.robot.logger.info(`Tried to build.\nErr: ${err}\nStatusCode: ${res.statusCode}\nStatus Message: ${res.statusMessage}`);

      if (err) {
        return params.response.send(`Got an error: ${err}`);
      }
      if (res.statusCode === 403) {
        return params.response.send(`You're not allowed to build. Are you authenticated?`);
      }
      if (res.statusCode !== 201) {
        return params.response.send(`Got ${res.statusCode} while trying to build: '${res.statusMessage}'. Check the parameters and try again.`);
      }

      params.response.send(`Building branch ${commandParams.branch} on ${commandParams.jobName}`);
    });
}
