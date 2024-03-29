OpenPaas
=======

This is a social network for enterprises & organizations.

Installation
------------

1. clone the repository

        git clone http://ci-openpaas.linagora.com/stash/scm/or/rse.git

2. install node.js

3. install the npm dependencies

        npm install -g mocha grunt-cli bower karma-cli
    
4. install the gjslint dependency

        easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz

    more informations [can be found here](https://developers.google.com/closure/utilities/docs/linter_howto)
    
5. Go into the project directory and install project dependencies

        cd rse
        npm install

Testing
-------

You can check that everything works by launching the test suite:

    grunt

If you want to launch tests from a single test, you can specify the file as command line argument.
For example, you can launch the backend tests on the test/unit-backend/webserver/index.js file like this:

    grunt test-unit-backend --test=test/unit-backend/webserver/index.js

Note: This works for backend and midway tests.

Some specialized Grunt tasks are available :

    grunt linters # launch hinter and linter against the codebase
    grunt test-frontend # only run the fontend unit tests
    grunt test-unit-backend # only run the unit backend tests
    grunt test-midway-bakend # only run the midway backend tests
    grunt test # launch all the testsuite

Fixtures
--------

Fixtures can be configured in the fixtures folder and injected in the system using grunt:

    grunt fixtures

Note that this will override all the current configuration resources with the fixtures ones.

Starting the server
------------------

Use npm start to start the server !

    npm start
    

Develop the ESN
---------------

Use 

    grunt dev

to start the server in development mode.

Licence
-------

[Affero GPL v3](http://www.gnu.org/licenses/agpl-3.0.html)
