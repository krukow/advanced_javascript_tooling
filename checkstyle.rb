#!/usr/bin/env ruby

require 'fileutils'

res = system("gjslint -r public/chatpp")
if !res
  puts "Should I run fixjsstyle -r ? (y/n)"
  while a = gets
    a=a.strip
    if a == 'y'
      system("fixjsstyle -r public/chatpp")
      puts("Finished fixjsstyle. If any errors remain, fix them and re-run this script.")
      exit(1)
    elsif a =='n'
      exit(1)
    else
      puts "You must answer y or n. Should I run fixjsstyle -r ?"
    end
  end
end
