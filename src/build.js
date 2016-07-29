'use strict';

module.exports = {
  build
};

function build(params) {
  const commandParams = {
    branch: params.response.match[1],
    jobName: params.aliases.getJobNameFromAlias(params.robot, params.response.match[2]) || params.response.match[2]
  };

  const buildUrl = `${params.JENKINS_URL}/job/${commandParams.jobName}/buildWithParameters?token=${params.TOKEN}&BRANCH=${commandParams.branch}`;

  params.robot
    .http(buildUrl)
    .get()((err, res) => {
      if (err || res.statusCode !== 201) {
        params.response.send(`Sorry, I could not trigger the build. Check the parameters and try again.`);
        return;
      }

      params.response.send(`Building branch ${commandParams.branch} on ${commandParams.jobName}`);
    });
}
