#!/usr/bin/env ruby

require 'fileutils'

res = system("gjslint public/stomple/stomple-0.99.js")
if !res
  puts "Should I run fixjsstyle -r ? (y/n)"
  while a = gets
    a=a.strip
    if a == 'y'
      system("fixjsstyle public/stomple/stomple-0.99.js")
      puts("Finished fixjsstyle. If any errors remain, fix them and re-run this script.")
      break
    elsif a =='n'
      exit(1)
    else
      puts "You must answer y or n. Should I run fixjsstyle -r ?"
    end
  end
end

res = system("gjslint -r public/stomple/object")
if !res
  puts "Should I run fixjsstyle -r ? (y/n)"
  while a = gets
    a=a.strip
    if a == 'y'
      system("fixjsstyle -r public/stomple/object")
      puts("Finished fixjsstyle. If any errors remain, fix them and re-run this script.")
      exit(1)
    elsif a =='n'
      exit(1)
    else
      puts "You must answer y or n. Should I run fixjsstyle -r ?"
    end
  end
end
