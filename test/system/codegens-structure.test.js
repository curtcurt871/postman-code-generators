var _ = require('lodash'),
    expect = require('chai').expect,
    parseIgnore = require('parse-gitignore'),
    path = require('path'),
    codegens = [],
    fs = require('fs');
// Keep adding new options
const expectedOptions = {
    multiLine: {
        name: 'MultiLine Curl Request',
        type: 'boolean',
        default: true,
        description: 'denoting whether to get the request in single or multiple lines'
    },
    longFormat: {
        name: 'Long Format',
        type: 'boolean',
        default: true,
        description: 'denoting whether to get the request in short form or long form'
    },
    indentCount: {
        name: 'Indent Count',
        type: 'integer',
        default: 0,
        description: 'Integer denoting count of indentation required'
    },
    indentType: {
        name: 'Indent type',
        type: 'String',
        default: 'tab',
        description: 'String denoting type of indentation for code snippet. eg: \'space\', \'tab\''
    },
    requestTimeout: {
        name: 'Request Timeout',
        type: 'integer',
        default: 0,
        description: 'Integer denoting time after which the request will bail out in milliseconds'
    },
    followRedirect: {
        name: 'Follow redirect',
        type: 'boolean',
        default: true,
        description: 'Boolean denoting whether or not to automatically follow redirect'
    },
    requestBodyTrim: {
        name: 'Body trim',
        type: 'boolean',
        default: true,
        description: 'Boolean denoting whether to trim request body fields'
    }};

fs.readdirSync('./codegens').forEach((file) => {
    if (file !== '.DS_Store' && file !== 'DS_STORE' && file !== '.gitkeep') {
        codegens.push(file);
    }
});


codegens.forEach((codegen) => {
    const CODEGEN_ABS_PATH = `./codegens/${codegen}`;

    describe('Code-gen repository ' + codegen, function () {
        var content,
            json;

        try {
            content = fs.readFileSync(`${CODEGEN_ABS_PATH}/package.json`).toString();
            json = JSON.parse(content);
        }
        catch (e) {
            console.error(e);
            content = '';
            json = {};
        }

        const mainEntryFileAddress = path.resolve(CODEGEN_ABS_PATH, json.main);
        describe('package.json', function () {

            it('must have readable JSON content', function () {
                expect(content).to.be.ok;
                expect(json).to.not.eql({});
            });

            describe('package.json JSON data', function () {
                it('must have valid name, description and author', function () {
                    expect(json).to.have.property('name', '@postman/' + codegen);
                    expect(json).to.have.property('author', 'Postman Labs <help@getpostman.com>');
                    expect(json).to.have.property('license', 'Apache-2.0');
                    expect(json).to.have.property('com_postman_plugin');
                    expect(json.com_postman_plugin).to.have.property('lang');
                    expect(json.com_postman_plugin).to.have.property('type');
                    expect(json.com_postman_plugin).to.have.property('variant');
                    expect(json).to.have.property('engines');
                    expect(json.engines).to.eql({ node: '>=4' });
                });

                it('must have a valid version string in form of <major>.<minor>.<revision>', function () {
                    // eslint-disable-next-line max-len
                    expect(json.version).to.match(/^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/);
                });
            });


            describe('dependencies', function () {
                it('object must exist', function () {
                    expect(json.dependencies).to.be.a('object');
                });

                it('must point to a valid and precise (no * or ^) semver', function () {
                    json.dependencies && Object.keys(json.dependencies).forEach(function (item) {
                        expect(json.dependencies[item]).to.match(new RegExp('^((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
                            '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$')); // eslint-disable-line max-len
                    });
                });
            });

            describe('devDependencies', function () {
                it('must exist', function () {
                    expect(json.devDependencies).to.be.a('object');
                });

                it('must point to a valid and precise (no * or ^) semver', function () {
                    json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
                        expect(json.devDependencies[item]).to.match(new RegExp('^((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
                            '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$')); // eslint-disable-line max-len
                    });
                });

                it('should not overlap dependencies', function () {
                    var clean = [];

                    json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
                        !json.dependencies[item] && clean.push(item);
                    });

                    expect(Object.keys(json.devDependencies)).to.eql(clean);
                });
            });

            describe('main entry script', function () {
                it('must point to a valid file', function (done) {
                    expect(json.main).to.equal('index.js');
                    fs.stat(json.main, done);
                });

                it('must return convert function', function () {
                    expect(_.isFunction(require(mainEntryFileAddress).convert)).to.be.true;
                });

                it('must return getOptions function', function () {
                    expect(_.isFunction(require(mainEntryFileAddress).getOptions)).to.be.true;
                });
            });
        });

        describe('getOptions', function () {
            var getOptions = require(mainEntryFileAddress).getOptions,
                options = getOptions();
            it('must have a valid structure', function () {
                options.forEach((option) => {
                    expect(option).to.have.property('name');
                    expect(option).to.have.property('id');
                    expect(option).to.have.property('type');
                    expect(option).to.have.property('default');
                    expect(option).to.have.property('description');
                });
            });
            it('must have correct description and name', function () {
                options.forEach((option) => {
                    if (expectedOptions[option.id]) {
                        expect(option.description).to.be.eql(expectedOptions[option.id].description);
                        expect(option.name).to.be.eql(expectedOptions[option.id].name);
                    }
                    else {
                        console.log(`Option ${option.name} not present in the list of expected options.`);
                    }
                });
            });
        });

        describe('README.md', function () {
            it('must exist', function (done) {
                fs.stat(`${CODEGEN_ABS_PATH}/README.md`, done);
            });

            it('must have readable content', function () {
                expect(fs.readFileSync(`${CODEGEN_ABS_PATH}/README.md`).toString()).to.be.ok;
            });
        });
        describe('.eslintrc', function () {
            it('must exist', function (done) {
                fs.stat(`${CODEGEN_ABS_PATH}/.eslintrc`, done);
            });

            it('must have readable content', function () {
                expect(fs.readFileSync(`${CODEGEN_ABS_PATH}/.eslintrc`).toString()).to.be.ok;

            });
        });

        describe('.ignore files', function () {
            var gitIgnorePath = '.gitignore',
                gitIgnore = parseIgnore(gitIgnorePath);
            describe(gitIgnorePath, function () {
                it('must exist', function (done) {
                    fs.stat(gitIgnorePath, done);
                });

                it('must have valid content', function () {
                    expect(_.isEmpty(gitIgnore)).to.not.be.ok;
                    expect(gitIgnore).to.include('.DS_Store');
                    expect(gitIgnore).to.include('*.log');
                    expect(gitIgnore).to.include('.coverage/**');
                    expect(gitIgnore).to.include('node_modules/**');
                    expect(gitIgnore).to.include('out/**');
                    expect(gitIgnore).to.include('.npm');
                    expect(gitIgnore).to.include('.npm/**');
                    expect(gitIgnore).to.include('logs');

                });
            });
        });

        describe('LICENSE.md', function () {
            it('must exist', function (done) {
                fs.stat(`${CODEGEN_ABS_PATH}/LICENSE.md`, done);
            });

            it('must have readable content', function () {
                expect(fs.readFileSync(`${CODEGEN_ABS_PATH}/LICENSE.md`).toString()).to.be.ok;
            });
        });

        describe('lib folder', function () {
            it('must exist', function (done) {
                fs.stat(`${CODEGEN_ABS_PATH}/lib`, done);
            });
        });

    });
});