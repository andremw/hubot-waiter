'use strict';

module.exports = {
  listJobs(params) {
    const robot = params.robot;
    const jobFilter = params.response.match[1].trim();

    robot.http(`${params.JENKINS_URL}/api/json`).get()((err, res, body) => {
      if (err) {
        robot.logger.error(err);
        params.response.send('Sorry, I could not get the list of jobs.');
        return;
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
  },

  jobStatus(params) {
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
};

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
