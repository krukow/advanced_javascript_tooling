TestCase("Main should initialize M V C", sinon.testCase({

  setUp: function () {
  },

  tearDown: function() {
  },


  "test model generates events on initialize": function () {
      var m = chatpp.model.Model.getInstance(),
          v =  chatpp.view.View.getInstance(),
          c = chatpp.controller.Controller.getInstance();

      var stub_model_init = sinon.stub(m,"init");
      var stub_view_init = sinon.stub(v,"init");
      var stub_controller_init = sinon.stub(c,"init");

      chatpp.main("karl","http://wsurl");

      assertTrue(stub_model_init.calledOnce);
      assertTrue(stub_model_init.calledWith("karl"));

      assertTrue(stub_view_init.calledOnce);
      assertTrue(stub_controller_init.calledOnce);
      assertTrue(stub_controller_init.calledWith("http://wsurl"));

      assertTrue(stub_view_init.calledBefore(stub_model_init));
      assertTrue(stub_model_init.calledBefore(stub_controller_init));

      m.init.restore();
      v.init.restore();
      c.init.restore();
  }

}));
