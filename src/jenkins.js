// Description:
//    A hubot integration with Jenkins
//
// Configuration
//    HUBOT_JENKINS_URL - The URL of the jenkins instance where the jobs are configured.
//    HUBOT_SLACK_TOKEN - The token that is generated by slack. It must be configured in Jenkins as well.
//
// Commands:
//    hubot jobs|list jobs [job name] - List the current jobs, filtering by the job name if needed
//    hubot build <branch> on <job name> - Builds branch on the environment specified by the job
//    hubot create alias <alias> for <job name> - Creates an alias for the job
//    hubot aliases|list aliases - Displays the list of aliases
//    hubot remove alias <alias name> - Removes an alias
//    hubot job status <job|alias name> - Displays the last status for the job.
//    hubot jenkins auth <user> <apiKey> - Authenticate on Jenkins

'use strict';

const TOKEN = process.env.HUBOT_SLACK_TOKEN;
const JENKINS_URL = process.env.HUBOT_JENKINS_URL;
const aliases = require(`${__dirname}/alias`);
const builder = require(`${__dirname}/build`);
const jobs = require(`${__dirname}/jobs`);
const api = require(`${__dirname}/api`);

module.exports = robot => {
  if (!TOKEN || !JENKINS_URL) {
    robot.logger.error(`Please make sure the required environment variables are all set.`);
    throw new Error(`Please make sure the required environment variables are all set.`);
  }

  const jenkinsApi = api({
    http: robot.http.bind(robot),
    storage: robot.brain,
    domain: JENKINS_URL,
    logger: robot.logger
  });

  robot.respond(/jenkins auth (.[^\s]+)\s(.[^\s]+)/i, response => {
    const user = response.match[1];
    const apiKey = response.match[2];
    const chatUserId = response.message.user.id;

    jenkinsApi
      .authenticate({chatUserId, user, apiKey})
      .then(result => response.send(result))
      .catch(err => response.send(err));
  });

  robot.respond(/(?:list jobs|jobs)\s*(.*)/i, response => {
    jobs.listJobs({robot, response, JENKINS_URL});
  });

  robot.respond(/build (\w+)-(\w+)-(.+)/i, response => {
    response.send('This command is not supported anymore. Please use build <branch> on <job name|job alias>');
  });

  robot.respond(/build (.+) on (.+)/i, response => {
    const buildParams = {
      robot,
      response,
      aliases,
      JENKINS_URL,
      TOKEN
    };

    builder.build(buildParams);
  });

  robot.respond(/create alias (.+) for (.+)/i, response => {
    aliases.newAlias(robot, response);
  });

  robot.respond(/list aliases|aliases/i, response => {
    aliases.listAliases(robot, response);
  });

  robot.respond(/remove alias (.+)/i, response => {
    aliases.removeAlias(robot, response);
  });

  robot.respond(/job status (.+)/i, response => {
    const jobName = aliases.getJobNameFromAlias(robot, response.match[1]) || response.match[1];
    jobs.jobStatus({robot, response, JENKINS_URL, jobName});
  });
};
