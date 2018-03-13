'use strict';

const config = require('./config');
const fs = require('../utils/fs');
const path = require('path');
const archConfig = require('../config.json');
const memory = require('./memory');
const paths = require('../text/paths.json');
const env = require('./env');
const log = require('../utils/log');
const loader = require('./loader');
const extension = require('./extension');
const arch = require('./arch');

class NodeArch {
  constructor (dir) {
    this.fs = fs;
    this.log = log;
    this.ENV = process.env.NODE_ENV = env(process.env.NODE_ENV, process.argv);
    this.paths = this._resolvePaths(paths, dir);
    this.paths.app = dir;
    this.deps = {};
  }

  async init () {
    this.arch = await arch(this.paths.arch);
    this.config = await config.load(this.paths.config, this.ENV); 
  }

  async start (serverHandler) {
    try {
      await this.init();
      await extension.loadExtensions(this.paths.extensions, this.arch.extensions);
      await extension.exec('before', this);
      await loader.loadPlugins(this.paths.api, this, 'deps');
      await serverHandler(this);
      await extension.exec('after', this);      
    }
    catch (e) {
      this.log.error(e);
      console.log(e.stack);
    }
  }

  _resolvePaths (pathsList, prefix) {
    const resolved = {};
  
    this.fs.resolvePaths(pathsList, prefix, (resolvedPath, key) => {
      resolved[key] = resolvedPath;
    });
  
    return resolved;
  }

}

module.exports = NodeArch;