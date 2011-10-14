TestCase("ModuleInfoTest", sinon.testCase({
  
  setUp: function () {
   
  },
  
  tearDown: function() {

  },

  "test MODULE_INFO and MODULE_URIS are defined": function () {
      assertTrue(typeof MODULE_INFO !='undefined');
      assertTrue(typeof MODULE_URIS !='undefined');

  }

}));
