'use strict';

const path = require('path');
const { expect } = require('chai');
const fs = require('fs-extra');
const bluebirdPromise = require('bluebird').Promise;
const _ = require('lodash');
const structure = require('../../lib/structure')._internals;
const exampleLoader = require('../../testHelper/exampleLoader');


describe('lib/structure', () => {

  const temp = path.resolve('./testTempStructure');

  const basicStructure = exampleLoader('basic-structure', { temp });
  const basicDirectories = exampleLoader('basic-directories', { temp });
  const basicSpecs = exampleLoader('basic-specs', { temp });
  const orderdSpecs = exampleLoader('orderd-specs', { temp });
  const missingSpecs = exampleLoader('missing-specs', { temp });

  after(async () => {
    await fs.remove(temp);
  });

  before(async () => {
    await fs.remove(temp);
  });

  describe('loadComponent()', () => {

    before(async () => {
      await bluebirdPromise.map(basicStructure, x => fs.ensureFile(x));
      await bluebirdPromise.map(basicDirectories, x => fs.ensureDir(x));
    });

    after(async () => {
      await fs.remove(temp);
    });

    it('should load component with two modules', async () => {
      const result = await structure.loadComponent('controllers', path.resolve(temp, 'pluginOne', 'controllers'));

      expect(result).to.deep.equal({
        name: 'controllers',
        type: 'component',
        modules: [
          { name: 'TestController.js' },
          { name: 'TestTwoController.js' }
        ]
      });
    });

    it('should load component with no modules', async () => {
      const result = await structure.loadComponent('emptyComp', path.resolve(temp, 'pluginThree', 'emptyComp'));

      expect(result).to.deep.equal({
        name: 'emptyComp',
        type: 'component',
        modules: []
      });
    });

  });

  describe('getPluginsOndisk()', () => {

    before(async () => {
      await bluebirdPromise.map(basicStructure, x => fs.ensureFile(x));
      await bluebirdPromise.map(basicDirectories, x => fs.ensureDir(x));
    });

    after(async () => {
      await fs.remove(temp);
    });

    it('should retrieve all plugins on disk', async () => {
      const result = await structure.getPluginsOndisk(temp);
      expect(result).to.deep.equal([
        { name: 'pluginOne' },
        { name: 'pluginThree' },
        { name: 'pluginTwo' },
        { name: 'plugin_underscore' }
      ]);
    });

  });

  describe('getComponentsOnDisk()', () => {

    before(async () => {
      await bluebirdPromise.map(basicStructure, x => fs.ensureFile(x));
      await bluebirdPromise.map(basicDirectories, x => fs.ensureDir(x));
    });

    after(async () => {
      await fs.remove(temp);
    });

    it('should retrieve all components inside a plugin on disk', async () => {
      const result = await structure.getComponentsOnDisk(path.resolve(temp, 'pluginOne'));

      expect(result).to.deep.equal([
        {
          "name": "controllers",
          "type": "component",
          "modules": [
            {
              "name": "TestController.js"
            },
            {
              "name": "TestTwoController.js"
            }
          ]
        },
        {
          "name": "models",
          "type": "component",
          "modules": [
            {
              "name": "TestModel.js"
            }
          ]
        },
        {
          "name": "services",
          "type": "component",
          "modules": [
            {
              "name": "Test2Service.js"
            },
            {
              "name": "TestService.js"
            }
          ]
        },
        {
          "name": "routes.js",
          "type": "module"
        }
      ]);

    });

    it('should load empty component inside a plugin', async () => {
      const result = await structure.getComponentsOnDisk(path.resolve(temp, 'pluginThree'));

      expect(result).to.deep.equal([
        {
          "name": "emptyComp",
          "type": "component",
          "modules": []
        }
      ]);

    });

  });

  describe('getStructureInfo()', () => {

    afterEach(async () => {
      await fs.remove(temp);
    });

    it('should get structure info for component', async () => {

      await bluebirdPromise.map(basicStructure, x => fs.ensureFile(x));
      await bluebirdPromise.map(basicDirectories, x => fs.ensureDir(x));
      await bluebirdPromise.map(basicSpecs, x => fs.outputFile(x.file, JSON.stringify(x.content)));

      const result = await structure.getStructureInfo(path.resolve(temp, 'pluginOne'), basicSpecs[0].file, structure.getComponentsOnDisk);
      expect(result).to.deep.equal({
        "onDisk": [
          {
            "name": "controllers",
            "type": "component",
            "modules": [
              {
                "name": "TestController.js"
              },
              {
                "name": "TestTwoController.js"
              }
            ]
          },
          {
            "name": "models",
            "type": "component",
            "modules": [
              {
                "name": "TestModel.js"
              }
            ]
          },
          {
            "name": "services",
            "type": "component",
            "modules": [
              {
                "name": "Test2Service.js"
              },
              {
                "name": "TestService.js"
              }
            ]
          },
          {
            "name": "routes.js",
            "type": "module"
          }
        ],
        "spec": [
          {
            "name": "controllers",
            "type": "component"
          }
        ],
        "notFound": []
      });
    });

    it('should a not found component on disk', async () => {

      await bluebirdPromise.map(basicStructure, x => fs.ensureFile(x));
      await bluebirdPromise.map(basicDirectories, x => fs.ensureDir(x));
      await bluebirdPromise.map(missingSpecs, x => fs.outputFile(x.file, JSON.stringify(x.content)));

      const result = await structure.getStructureInfo(path.resolve(temp, 'pluginOne'), missingSpecs[0].file, structure.getComponentsOnDisk);

      expect(result).to.deep.equal({
        "onDisk": [
          {
            "name": "controllers",
            "type": "component",
            "modules": [
              {
                "name": "TestController.js"
              },
              {
                "name": "TestTwoController.js"
              }
            ]
          },
          {
            "name": "models",
            "type": "component",
            "modules": [
              {
                "name": "TestModel.js"
              }
            ]
          },
          {
            "name": "services",
            "type": "component",
            "modules": [
              {
                "name": "Test2Service.js"
              },
              {
                "name": "TestService.js"
              }
            ]
          },
          {
            "name": "routes.js",
            "type": "module"
          }
        ],
        "spec": [
          {
            "name": "controllers",
            "type": "component"
          },
          {
            "name": "notHere",
            "type": "component"
          }
        ],
        "notFound": [path.resolve(temp, 'pluginOne', 'notHere')]
      });
    });

  });

  describe('getComponentsLoaderSchema()', () => {

    before(async () => {
      await bluebirdPromise.map(basicStructure, x => fs.ensureFile(x));
      await bluebirdPromise.map(orderdSpecs, x => fs.outputFile(x.file, JSON.stringify(x.content)));
    });

    after(async () => {
      await fs.remove(temp);
    });

    it('should load components schema', async () => {
      const result = await structure.getComponentsLoaderSchema(path.resolve(temp, 'pluginOne'), path.resolve(temp, 'pluginOne', 'spec.json'));
      expect(result).to.deep.equal({
        mergedSpecs: [
          {
            name: "models",
            type: "component",
            modules: [
              { name: "TestModel.js" }
            ] 
          },
          {
            name: "services",
            type: "component",
            modules: [
              { name: "Test2Service.js" },
              { name: "TestService.js" }
            ]
          },
          { 
            name: "controllers", 
            type: "component", 
            modules: [
              { name: "TestTwoController.js" },
              { name: "TestController.js" }
            ] 
          },
          {
            name: "routes.js",
            type: "module",
            modules: []
          }
        ],
        notFound: []
      });
    });

  });

  describe('getPluginsLoaderSchema()', () => {

    before(async () => {
      await bluebirdPromise.map(basicStructure, x => fs.ensureFile(x));
      await bluebirdPromise.map(orderdSpecs, x => fs.outputFile(x.file, JSON.stringify(x.content)));
    });

    after(async () => {
      await fs.remove(temp);
    });

    it('should load plugins schema()', async () => {

      const result = await structure.getPluginsLoaderSchema(temp, path.resolve(temp, 'spec.json'));
      expect(result).to.deep.equal({
        mergedSpecs: [
          { name: "pluginTwo" },
          { name: "pluginOne" }
        ],
        notFound: []
      });

    });

  });

});