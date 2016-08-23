'use strict';

module.exports = {
  build
};

function build(params) {
  const commandParams = {
    branch: params.response.match[1],
    jobName: params.aliases.getJobNameFromAlias(params.robot, params.response.match[2]) || params.response.match[2]
  };

  params.robot.logger.info(`jenkinsWaiter: ${JSON.stringify(params.robot.brain.get('jenkinsWaiter'))}`);
  const user = params.response.message.user;
  const credentials = (params.robot.brain.get('jenkinsWaiter') || {credentials: {}}).credentials[user] || {};

  const buildUrl = `${params.JENKINS_URL}/job/${commandParams.jobName}/buildWithParameters?token=${params.TOKEN}&BRANCH=${commandParams.branch}`;

  params.robot.logger.info(`Logging work with ${credentials.user}/${credentials.apiKey}`);
  params.robot
    .http(buildUrl)
    .auth(credentials.user, credentials.apiKey)
    .get()((err, res) => {
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
