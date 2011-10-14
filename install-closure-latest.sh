#!/bin/bash
hash curl 2>&- || { echo >&2 "Curl must be installed. Please consult Google.  Aborting."; exit 1; }
hash javac 2>&- || { echo >&2 "java jdk version 6 must be installed. Please consult Google.  Aborting."; exit 1; }
hash ant 2>&- || { echo >&2 "Apache ant must be installed. Please consult Google.  Aborting."; exit 1; }
hash svn 2>&- || { echo >&2 "Subversion must be installed. Please consult Google.  Aborting."; exit 1; }
hash python 2>&- || { echo >&2 "Python must be installed. Please consult Google.  Aborting."; exit 1; }
hash easy_install 2>&- || { echo >&2 "Python easy_in must be installed. Please consult Google.  Aborting."; exit 1; }

curdir=`pwd`
torque="../torquebox"
closure_compiler="closure-compiler"
closure_soy="closure-templates"
closure_lib="closure-library"

echo "Now I'll install google closure tools in $closure_compiler, $closure_lib, $closure_soy

If you wish to change these directories. Select No (option 2) and modify this script.

Now: Select 1 or 2:"
select yn in "Yes" "No"; do
    case $yn in
        Yes ) break;;
        No ) exit 1;;
    esac
done



svn checkout http://closure-compiler.googlecode.com/svn/trunk/ $closure_compiler
cd $closure_compiler
ant
cp build/compiler.jar .
cd ..


svn checkout http://closure-library.googlecode.com/svn/trunk/ public/closure-library


mkdir -p $closure_soy
curl http://closure-templates.googlecode.com/files/closure-templates-for-javascript-latest.zip -o $closure_soy/closure-templates-for-javascript-latest.zip
cd $closure_soy
unzip closure-templates-for-javascript-latest.zip
cd ..

sudo easy_install http://closure-linter.googlecode.com/files/closure_linter-latest.tar.gz

echo "Closure tools installed..."
