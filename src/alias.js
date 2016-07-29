'use strict';

module.exports = {

  newAlias(robot, response) {
    const alias = response.match[1];
    const jobName = response.match[2];

    if (!alias || !jobName) {
      response.send(`Missing parameters. Got alias: ${alias}, job name: ${jobName}`);
      return;
    }

    createAlias(robot, alias, jobName);
    response.send(`Alias ${alias} created for ${jobName}`);
  },

  listAliases(robot, response) {
    const aliases = getAliases(robot);
    if (aliases.length === 0) {
      response.send('There are no alias created yet.');
      return;
    }
    const aliasesResponse = aliases.reduce((msg, alias) => {
      return `${msg}\n> *${alias.name}* for ${alias.jobName}`;
    }, 'Here is the list of aliases:\n');
    response.send(aliasesResponse);
  },

  removeAlias(robot, response) {
    let aliases = getAliases(robot);
    const aliasToRemove = response.match[1];
    const aliasExist = aliases.some(alias => alias.name === aliasToRemove);

    if (!aliasExist) {
      response.send(`Alias ${aliasToRemove} does not exist.`);
      return;
    }

    aliases = aliases.filter(alias => {
      return alias.name !== aliasToRemove;
    });
    setAliases(robot, aliases);
    response.send(`Done!`);
  },

  getJobNameFromAlias(robot, aliasName) {
    const aliases = getAliases(robot);
    const alias = aliases.find(alias => alias.name === aliasName) || {};
    return alias.jobName;
  }

};

function createAlias(robot, alias, jobName) {
  const aliases = robot.brain.get('aliases') || [];
  aliases.push({name: alias, jobName});
  setAliases(robot, aliases);
}

function getAliases(robot) {
  return robot.brain.get('aliases') || [];
}

function setAliases(robot, aliases) {
  robot.brain.set('aliases', aliases);
}
