TestCase("Model should generate various custom events", sinon.testCase({
  
  setUp: function () {
      chatpp.model.Model.getInstance().init();
  },
  
  tearDown: function() {

  },

  "test model generates events on initialize": function () {
      var model =chatpp.model.Model.getInstance();


      var eventFired = false;
      var selectUser = model.findUserByName("B");
      goog.events.listen(model,
        chatpp.events.AppEventType.USER_SELECTED,
        function(e) {
            eventFired = true;
            var u = e.getEventData();
            assertTrue(u === selectUser);
        },
        false,
        this);
      model.setSelectedUser(selectUser);
      assertTrue(eventFired);
  }

}));
