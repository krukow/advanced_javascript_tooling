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

puts "Looking for older versions"
js_file = Dir.foreach('public').find { |x| /chatpp-simple/.match(x) }


if !js_file.nil? && File.exist?("public/#{js_file}")
  puts "moving public/#{js_file} to public/backup"
  FileUtils.mv("public/#{js_file}","public/backup/")
end

if !system('public/closure-library/closure/bin/build/closurebuilder.py --root public/closure-library/ --root public/chatpp/ --root public/soy/ --namespace="chatpp.main" --output_mode=compiled --compiler_jar closure-compiler/compiler.jar --compiler_flags="--compilation_level=SIMPLE_OPTIMIZATIONS" --compiler_flags="--warning_level=VERBOSE" > public/chatpp-simple-`date "+%Y-%m-%d_%H-%M-%S"`.js')
  exit(1)
end
system("ls -aloh public/*.js")
