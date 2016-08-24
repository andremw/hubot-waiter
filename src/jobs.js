/* eslint camelcase: 0 */
'use strict';

module.exports.listJobs = listJobs;
module.exports.jobStatus = jobStatus;

function listJobs(params) {
  const robot = params.robot;
  const jobFilter = params.response.match[1].trim();
  const user = params.response.message.user;
  const credentials = (params.robot.brain.get('jenkinsWaiter') || {credentials: {}}).credentials[user] || {};

  robot
    .http(`${params.JENKINS_URL}/api/json`)
    .auth(credentials.user, credentials.apiKey)
    .get()((err, res, body) => {
      params.robot.logger.info(`Tried to retrieve jobs filtering by '${jobFilter || 'no filter'}'.\nErr: ${err}\nStatusCode: ${res.statusCode}\nStatus Message: ${res.statusMessage}`);
      if (err) {
        return params.response.send('Sorry, I could not get the list of jobs.');
      }
      if (res.statusCode === 403) {
        return params.response.send(`You're not authorized to retrieve the jobs. Are you authenticated?`);
      }
      if (res.statusCode !== 201 && res.statusCode !== 200) {
        return params.response.send(`Got a ${res.statusCode} error while retrieving the jobs: ${res.statusMessage}`);
      }

      let jobs = JSON.parse(body).jobs;

      if (jobFilter) {
        const regex = new RegExp(jobFilter, 'i');
        jobs = jobs.filter(job => regex.test(job.name));
      }

      const formattedResponse = jobs.reduce((msg, job) => {
        return `${msg}\n> ${job.name}`;
      }, 'Here is the list of jobs:\n');

      params.response.send(formattedResponse);
    });
}

function jobStatus(params) {
  const robot = params.robot;
  const jobName = params.jobName;
  const jobUrl = `${params.JENKINS_URL}/job/${jobName}`;
  const fullUrl = `${jobUrl}/api/json?tree=healthReport[description,iconUrl],lastBuild[number],lastFailedBuild[number]`;

  robot.http(fullUrl).get()((err, res, body) => {
    if (err) {
      robot.logger.error(err);
      params.response.send(`Sorry, I could not get the status of the job ${jobName}`);
      return;
    }

    const jobJson = JSON.parse(body);
    const healthReport = jobJson.healthReport[0] || {};

    const healthResponse = {
      attachments: [
        {
          fallback: healthReport.description,
          color: getMessageColor(jobJson),
          title: jobName,
          title_link: jobUrl,
          text: healthReport.description,
          footer: 'Jenkins API',
          footer_icon: `${params.JENKINS_URL}/static/aeb9cf3a/images/32x32/${healthReport.iconUrl}`,
          ts: getUnixTime()
        }
      ],
      as_user: true
    };

    params.response.send(healthResponse);
  });
}

function getMessageColor(jobJson) {
  const lastBuild = jobJson.lastBuild || {number: 0};
  const lastFailedBuild = jobJson.lastFailedBuild || {};
  if (lastBuild.number === lastFailedBuild.number) {
    return 'danger';
  }
  return 'good';
}

function getUnixTime() {
  return Math.floor(new Date().getTime() / 1000);
}
