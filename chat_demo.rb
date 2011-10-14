require 'sinatra/base'
require "haml"
require 'fileutils'

class ChatDemo < Sinatra::Base

  set :haml, :format => :html5

  helpers TorqueBox::Injectors

  helpers do
    def content_for(key, &block)
      @content ||= {}
      @content[key] = capture_haml(&block)
    end
    def content(key)
      @content && @content[key]
    end
    def development?
      settings.environment == :development
    end

    def compiled_script
      reg = /compiled_chatpp_modules/
      if ENV['UA_DETECT'] && !/Opera/.match(request.user_agent) then
        puts "DETECTUA"
        if /WebKit/.match(request.user_agent)
          puts "WebKit"
            reg = /compiled_webkit_chatpp_modules/
        elsif (/Gecko/.match(request.user_agent))
          puts "Gecko"
            reg = /compiled_gecko_chatpp_modules/
        end
      end
      js_file = Dir.foreach('public').find { |x| reg.match(x) }
      "#{js_file}"
    end
    def goog_base
      "closure-library/closure/goog/base.js"
    end
  end

  puts "#{Dir.pwd}"

  get '/' do
    haml :login
  end
  
  post '/' do
    username = params[:username]
    redirect to( '/' ) and return if username.nil?
    username.strip!
    redirect to( '/' ) and return if ( username == '' )
    redirect to( '/' ) and return if ( ! ( username =~ /^[a-zA-Z0-9_]+$/ ) )

    session[:username] = username
    if development?
      haml :chat_devel
    else
      haml :chat
    end
  end

  get '/profile/:username' do
    username = params[:username]
    message = "#{username}, someone from #{env['REMOTE_ADDR']} checked out your profile"
    inject( '/topics/chat' ).publish( message, :properties=>{ :recipient=>username, :sender=>'system' } )
    haml :profile
  end
end
