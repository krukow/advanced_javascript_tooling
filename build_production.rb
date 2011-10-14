#! /usr/bin/env jruby
require "rubygems"

if !system("gjslint -r public/chatpp")
  puts "Should I run fixjsstyle -r ? (y/n)"
  while a = gets
    a=a.strip
    if a == 'y'
      system("fixjsstyle -r public/chatpp")
      puts("Finished fixjsstyle. If any errors remain, fix them and re-run this script.")
      exit(0)
    elsif a =='n'
      exit(1)
    else
      puts "You must answer y or n. Should I run fixjsstyle -r ?"
    end
  end
end

require 'fileutils'



COMPILER="closure-compiler/compiler.jar"
LEVEL = "ADVANCED_OPTIMIZATIONS"



def get_namespaces
  "--namespace \"chatpp.modules\""
end

cmd = "public/closure-library/closure/bin/build/closurebuilder.py --root public/closure-library/ --root public/chatpp/ #{get_namespaces} --output_mode=list"
puts "Running closurebuilder.py command:"
puts cmd

deps = %x{#{cmd}}

files = deps.split("\n")

cmd_arr = ["java -jar #{COMPILER}",
           "--compilation_level #{LEVEL}"]

cmd_arr << "--js public/closure-library/closure/goog/deps.js"

cmd_arr = cmd_arr.concat(files.map {|f| "--js #{f}"})

cmd_arr  = cmd_arr.concat([
  "--warning_level=VERBOSE",
  "--externs=public/stomple/stomple-0.95_extern.js",
  "--externs=closure-compiler/contrib/externs/json.js",
  "--externs=closure-compiler/contrib/externs/webkit_console.js",
  "> tmp/out.js"
])


puts "Running compiler:\n#{cmd_arr.join(" ")}"
puts %x{#{cmd_arr.join(" ")}}

if !system('public/closure-library/closure/bin/build/closurebuilder.py --root public/closure-library/ --root public/chatpp/ --namespace="chatpp.main" --output_mode=compiled --compiler_jar closure-compiler/compiler.jar --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" --compiler_flags="--externs=public/stomple/stomple-0.95_extern.js" --compiler_flags="--externs=closure-compiler/contrib/externs/json.js" --compiler_flags="--warning_level=VERBOSE" > public/chatpp-compiled-`date "+%Y-%m-%d_%H-%M-%S"`.js')
  exit(1)
end
system("ls -aloh public/*.js")
