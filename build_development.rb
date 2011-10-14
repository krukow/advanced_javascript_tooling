#!/usr/bin/env ruby

require 'fileutils'


COMPILER="closure-compiler/compiler.jar"
LEVEL = "ADVANCED_OPTIMIZATIONS"

def get_namespaces
  "--namespace \"chatpp.modules\""
end

cmd = "public/closure-library/closure/bin/build/closurebuilder.py --root public/closure-library/ --root public/chatpp/ --root public/stomple/ #{get_namespaces} --output_mode=list"
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




puts "Google Closure Compiler says 'OK'. Running Deps writer."
exit(system('public/closure-library/closure/bin/build/depswriter.py --root_with_prefix="public/chatpp ../../../chatpp" --root_with_prefix="public/stomple ../../../stomple"> public/chatpp-deps.js'))

