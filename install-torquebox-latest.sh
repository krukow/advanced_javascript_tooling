#!/bin/bash
hash curl 2>&- || { echo >&2 "Curl must be installed. Please consult Google.  Aborting."; exit 1; }
hash javac 2>&- || { echo >&2 "java jdk version 6 must be installed. Please consult Google.  Aborting."; exit 1; }
hash ant 2>&- || { echo >&2 "Apache ant must be installed. Please consult Google.  Aborting."; exit 1; }
hash svn 2>&- || { echo >&2 "Subversion must be installed. Please consult Google.  Aborting."; exit 1; }

curdir=`pwd`
torque="../torquebox"
closure_compiler="closure-compiler"
closure_soy="closure-templates"
closure_lib="closure-library"

echo "This will download latest 2.x version of torquebox and install in $torque.
If you want to install in a different location change 'torque' in this script and in install-download.sh.

Now: Select 1 or 2:"
select yn in "Yes" "No"; do
    case $yn in
        Yes ) break;;
        No ) exit 1;;
    esac
done

curdir=`pwd`
mkdir -p $torque

curl http://torquebox.org/2x/builds/torquebox-dist-bin.zip -o $torque/torquebox-dist-bin.zip
cd $torque
unzip torquebox-dist-bin.zip
version=`ls | grep incremental`
ln -s `pwd`/$version torquebox-current
cd $curdir

echo "torquebox installation complete see: $torque"
