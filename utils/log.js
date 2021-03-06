'use strict';

/**
 * log formatter
 * @module utils/log
 */

const chalk = require('chalk');
const _ = require('lodash');
const APP = require('../text/app.json');

module.exports = {

  info: function () {
    const log = createLog(arguments);
    console.log(chalk.green.apply(null, log));
  },
  
  error: function () {
    const log = createLog(arguments);
    console.log(chalk.red.apply(null, log));
  },
  
  warn: function () {
    const log = createLog(arguments);
    console.log(chalk.yellow.apply(null, log));
  },

  debug: function () {
    const log = createLog(arguments);
    console.log(chalk.blue.apply(null, log));
  },

};

const createLog = function (args) {
  const text = _.toArray(args);
  text.unshift(APP.cliName);
  return text;
};