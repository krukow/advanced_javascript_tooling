#! /usr/bin/env jruby
require "rubygems"
require "json"
require 'fileutils'
require 'set'

if ARGV.length != 1 && ARGV.length != 2
  puts "Usage\n build_modules.rb <module config.json> (opt compiler level)"
  exit(1)
end

if !system("jruby checkstyle.rb")
   exit(1)
end
#puts "moving public/*_compiled_*.js to public/backup"



COMPILER="closure-compiler/compiler.jar"


mods = JSON.parse(File.open(ARGV[0]).read)

out_path = "public"
prefix = `date "+%Y-%m-%d_%H-%M-%S"`.split("\n")[0]
out_prefix = "#{out_path}/#{prefix}_compiled_"

if (ENV['DEBUG'])
  LEVEL = ARGV.length == 2? ARGV[1] : "WHITESPACE_ONLY"
else
  LEVEL = ARGV.length == 2? ARGV[1] : "ADVANCED_OPTIMIZATIONS"
end

system("rm public/*_compiled_*.js")


@namespaces = mods["modules"].keys
@main_ns = mods["main"]


def get_namespaces
  cmd = @namespaces.map {|ns| "--namespace \"#{ns.gsub("_",".")}\""}
  cmd << "--namespace \"#{@main_ns.gsub("_",".")}\""
  cmd.join(" ")
end

cmd = "public/closure-library/closure/bin/build/closurebuilder.py --root public/closure-library/ --root public/chatpp/ --root public/stomple/ #{get_namespaces} --output_mode=list"
puts "Running closurebuilder.py command:"
puts cmd

deps = %x{#{cmd}}

files = deps.split("\n")

modules = mods["modules"]
modules_files = {}


modules.each_pair do |k, v|
  modules_files[k] = [].concat(v["files"])
  modules_files[k].sort! do |f1, f2|
    i1 = files.index(f1)
    i2 = files.index(f2)
    if i1 < i2
      -1
    elsif i1 == i2
      0
    else
      1
    end
  end
end

indices_to_delete = []

files.each_with_index do |f, i|
  modules_files.each_pair do |mod, mod_files|
    if mod_files.member?f
      indices = modules[mod]["indices"] = modules[mod]["indices"] || {}
      indices[f] = i
      indices_to_delete << i
    end
  end
end

sorted_files = []
files.each_with_index do |f, i|
  sorted_files << f unless indices_to_delete.include?i
end


@base_index = sorted_files.count + 1
modules_commands = ["--module_output_path_prefix #{out_prefix}", "--module #{@main_ns}:#{@base_index}"]

modules_files.each_pair do |mod, files|
  sorted_files = sorted_files.concat(files)
  mod_idx = sorted_files.count + 1 - @base_index
  modules_commands << "--module #{mod}:#{mod_idx}:#{@main_ns}"
end


cmd_arr = ["java -jar #{COMPILER}",
           "--compilation_level #{LEVEL}"]
if ENV['DEBUG']
   cmd_arr << "--formatting PRETTY_PRINT"
else
  cmd_arr << "--define goog.DEBUG=false"
end
cmd_arr = cmd_arr.concat(modules_commands)

cmd_arr << "--js public/closure-library/closure/goog/deps.js"

cmd_arr = cmd_arr.concat(sorted_files.map {|f| "--js #{f}"})

cmd_arr  = cmd_arr.concat([
  "--warning_level=VERBOSE",
  "--externs=closure-compiler/contrib/externs/json.js",
  "--externs=closure-compiler/contrib/externs/webkit_console.js"

])


puts "Running compiler:\n#{cmd_arr.join(" ")}"
puts %x{#{cmd_arr.join(" ")}}



puts "Generating Module info.."
File.open("public/chatpp/moduleinfo.js","w") do |f|
  f.write("var MODULE_INFO = { '#{@main_ns}': []")
  mod_names = modules.keys
  if mod_names.count > 0
    f.write(",\n")
    f.write((mod_names.map {|n| "'#{n}': ['#{@main_ns}']"}).join(",\n"))
  end
  f.write("};\n")
  f.write("var MODULE_URIS = {\n")
  mod_names = modules.keys
  if mod_names.count > 0
    f.write((mod_names.map {|n| "'#{n}':\n['#{prefix}_compiled_#{n}.js']"}).join(",\n"))
  end
  f.write("};\n")



end


system("ls -aloh public/*.js")





#if !system('public/closure-library/closure/bin/build/closurebuilder.py --root public/closure-library/ --root public/chatpp/ --namespace="chatpp.main" --output_mode=compiled --compiler_jar closure-compiler/compiler.jar --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" --compiler_flags="--warning_level=VERBOSE" --compiler_flags="--externs=public/stomple/stomple-0.95_extern.js" --compiler_flags="--externs=closure-compiler/contrib/externs/json.js" --compiler_flags="--externs=closure-compiler/contrib/externs/webkit_console.js" > tmp/out.js')
#   exit(1)
#end
#
#puts "Google Closure Compiler says 'OK'. Running Deps writer."
#exit(system('public/closure-library/closure/bin/build/depswriter.py --root_with_prefix="public/chatpp ../../../chatpp" > public/chatpp-deps.js'))

