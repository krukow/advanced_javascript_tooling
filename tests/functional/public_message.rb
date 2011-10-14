require 'test/unit'
require "selenium-webdriver"

class PublicMessage < Test::Unit::TestCase
   def setup
     @driver = Selenium::WebDriver.for :firefox
     @driver.navigate.to "http://localhost:8080"

     element = @driver.find_element(:name, 'username')
     element.send_keys "Firefox"
     element.submit

     list = @driver.find_element(:id => "userlist")
     wait = Selenium::WebDriver::Wait.new(:timeout => 10) # seconds
     wait.until { sleep(1); true}
     tabs = @driver.find_elements(:xpath,"//div[@role='tab']")
     assert_equal(3,tabs.count,"Expected three tabs. Got #{tabs.count}")

     texts = tabs.map {|e| e.text}

     assert_equal(["system", "public", "Firefox"], texts,
                    "Expected channels: system,public,Firefox, got: #{texts}")

   end
   def teardown
     @driver.quit
   end
   def test_channels
     msg_el = @driver.find_element(:id,'message-txt')
     msg_el.send_keys "Hello from Firefox"
     msg_el.submit
     wait = Selenium::WebDriver::Wait.new(:timeout => 10) # seconds
     wait.until { sleep(2); true}
     msgs = @driver.find_elements(:class,"message")
     msgs.find {|m| m.text == "Hello from Firefox"}
   end
end


