require 'test/unit'
require "selenium-webdriver"

class Login < Test::Unit::TestCase
   def setup
     @driver = Selenium::WebDriver.for :firefox
   end
   def teardown
     @driver.quit
   end
   def test_login
     @driver.navigate.to "http://localhost:8080"

     element = @driver.find_element(:name, 'username')
     element.send_keys "Firefox"
     element.submit

     wait = Selenium::WebDriver::Wait.new(:timeout => 10) # seconds
     wait.until { @driver.find_element(:id => "userlist") }

     assert_equal("Chat++",@driver.title,"Expected page title to be Chat++ after login")

   end
end


