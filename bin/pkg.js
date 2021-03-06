#!/usr/bin/env node

'use strict';

const cli = require('cli');
const inquirer = require('inquirer');
const _ = require('lodash');
const packageManager = require('../lib/pkg');
const compare = require('../utils/compare');

let nodearch;

async function pkgsToInstall (requestedPkgs = []) {
  let pkgsInfo = await packageManager.pkgsInfo();

  if (_.isEmpty(pkgsInfo)) {
    nodearch.logger.error(`no extensions to download!`);
    return [];
  }

  pkgsInfo = filterCompatible(pkgsInfo, nodearch.pkgInfo.version);

  if (_.isEmpty(pkgsInfo)) {
    nodearch.logger.error(`your version of nodearch is not compatiable with any extension version`);
    return [];
  }

  requestedPkgs = _.map(requestedPkgs, requestedPkg => {
    const parts = requestedPkg.split('@');
    return {
      name: parts[0],
      requestedTag: packageManager.resolveVersion(parts[1])
    };
  });

  const notFoundPkgs = _.difference(_.map(requestedPkgs, 'name'), _.map(pkgsInfo, 'name'));

  if (!_.isEmpty(notFoundPkgs)) {
    throw new Error(`the following packages were not found... ${notFoundPkgs}`);
  }

  if (_.isEmpty(requestedPkgs)) {
    const answers = await inquirer.prompt([{
      type: 'checkbox',
      name: 'pkgs',
      message: `choose from the available packages`,
      pageSize: 5,
      choices: _.map(pkgsInfo, 'name')
    }]);
    requestedPkgs = _.map(answers.pkgs, x => ({ name: x }));
  }

  if (_.isEmpty(requestedPkgs)) {
    throw new Error('no packages to install');
  }

  requestedPkgs = _.map(requestedPkgs, requestedPkg => {
    const pkgInfo = _.find(pkgsInfo, { name: requestedPkg.name })
    return {
      name: requestedPkg.name,
      requestedTag: requestedPkg.requestedTag,
      tags: _.get(pkgInfo, 'tags')
    };
  });

  return requestedPkgs || [];

} 

function filterCompatible (pkgsInfo, archVersion) {
  return _.chain(pkgsInfo)
    .map(pkgInfo => {
      
      pkgInfo.tags = _.filter(pkgInfo.tags, tag => {
        if (!tag.arch) return true;
        return compare.compatiable(tag.arch, archVersion);
      });

      return pkgInfo.tags.length ? pkgInfo : null;
    })
    .compact()
    .value();
}

async function resolveTags (requestedPkgs) {
  for (const requestedPkg of requestedPkgs) {

    if (requestedPkg.requestedTag && !_.find(requestedPkg.tags, { version: requestedPkg.requestedTag })) {
      nodearch.logger.warn(`package ${requestedPkg.name} with the tag ${requestedPkg.requestedTag} does not exist!`);
      requestedPkg.requestedTag = null;
    }

    if (!requestedPkg.requestedTag) {
      const answers = await inquirer.prompt([{
        type: 'list',
        name: 'tags',
        message: `choose from the available tags for the package ${requestedPkg.name}`,
        pageSize: 5,
        choices: _.map(requestedPkg.tags, 'version').sort(compare.semver).reverse()
      }]);
      requestedPkg.requestedTag = answers.tags;
    }

  }
  return requestedPkgs || [];
}

async function remove (requestedPkgs) {

  for (const requestedPkg of requestedPkgs) {
    nodearch.logger.info(`removing package ${requestedPkg}...`);
    await packageManager.remove(nodearch.paths.extensions, requestedPkg);
  }

}

async function install(requestedPkgs = []) {

  nodearch.logger.info(`fetching packages info...`);

  requestedPkgs = await pkgsToInstall(requestedPkgs);

  requestedPkgs = await resolveTags(requestedPkgs);

  for (const requestedPkg of requestedPkgs) {

    nodearch.logger.info(`downloading package ${requestedPkg.name}...`);
    const data = await packageManager.download({ 
      pkgName: requestedPkg.name, 
      version: requestedPkg.requestedTag,
      filter: file => file.path.match('index.js') || file.path.match('package.json'),
      strip: 1  
    });

    await packageManager.save(data, [{ path: 'index.js', newPath: requestedPkg.name + '.js' }], nodearch.paths.extensions);

    await packageManager.installDeps(data, nodearch.paths.app);

  }

}

module.exports = function (nodearchObj) {

  nodearch = nodearchObj;

  return {
    install,
    remove
  };

};
