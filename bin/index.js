#!/usr/bin/env node

'use strict';

const cli = require('cli');
const path = require('path');
const events = require('../text/events');
const nodearch = require('./init');
const pkg = require('./pkg')(nodearch);
const example = require('./example')(nodearch);
const archConsole = require('../lib/console')(nodearch);
const compare = require('../utils/compare');
const registryClient = require('./registry');

const appDir = nodearch.cli.app;

nodearch.logger.info(`ARCH CLI v${nodearch.pkgInfo.version}`);

if (appDir) {
  // check local nodearch
  const localArchPkgPath = path.join(appDir, 'node_modules', 'nodearch', 'package.json');
  try {
    const localArchPkg = require(localArchPkgPath);
    const compatiable = compare.compatiable(localArchPkg.version, nodearch.pkgInfo.version);
    nodearch.logger.info(`local version ${localArchPkg.version}`);
    if (!compatiable) {
      nodearch.logger.error(
        `your local version is not compatiable with the global nodearch.
        either update your local version or downgrade your global nodearch `
      );
      process.exit(1);
    }
  }
  catch (e) {}
}

function appNotExist () {
  nodearch.logger.error(
    `cannot identify the current directory as a NodeArch App,
    if this is your app directory, then place nodearch.json file`
  );
}

function appIsExist () {
  nodearch.logger.error(
    `the current directory or a parent directory in the path is already a NodeArch project.
    NodeArch project location is determined by the location of the nodearch.json file,
    and it's currently located at ${appDir}`
  );
}


cli.parse(
  {
    // file: ['f', 'A file to process', 'file', 'asdasd'],           // -f, --file FILE   A file to process
    // time: ['t', 'An access time', 'time', false],                 // -t, --time TIME   An access time
    // work: [false, 'What kind of work to do', 'string', 'sleep']   //     --work STRING What kind of work to do
  },
  {
    start: 'start server that exist in the current or parent directory',
    console: 'start server that exist in the current or parent directory in interactive mode',
    add: 'add nodearch extension',
    remove: 'remove nodearch extension',
    generate: 'generate full and ready to go nodearch example'
  }
);

async function exec() {

  await nodearch.init();

  let registry;

  if (appDir) {
    registry = await registryClient({
      logger: nodearch.logger,
      config: {
        location: nodearch.paths.extensions,
        keyword: 'nodearch-extension',
        app: appDir
      }
    });
  }


  switch (cli.command) {
    case 'start':
      appDir ? require(path.join(appDir, 'index.js')) : appNotExist();
      break;
    case 'console':
      if (appDir)  {
        nodearch.on(events.started, () => archConsole());
        require(path.join(appDir, 'index.js'));
      }
      else {
        appNotExist();
      }
      break;
    case 'add':
      appDir ? await registry.installPackages(cli.args) : appNotExist();
      break;
    case 'remove':
      appDir ? await registry.removePackages(cli.args) : appNotExist();
      break;
    case 'generate':
      appDir ? appIsExist() : await example.generate(cli.args);
      break;
  }

}



exec()
  .then()
  .catch(err => {
    nodearch.logger.error(err.message);
    console.log(err.stack);
  });
