
if (!window.TorqueBox) {
  window.TorqueBox = {};
  window.TorqueBox.Events = {};
}

$( function() {
	
  var chatView = new TorqueBox.ChatView();
  chatView.initialize();
  Stomple.debug = true;
  var client = Stomple.create_client({
        url:stomp_url
  });

  client.connect({
    success: function() {
        client.subscribe({
                options:{headers:{destination:"/public"}},
                handler: function() {onPublicMessageUpdate.apply(window,arguments);},

                success: function() {//did subscription succeed?
                     console.log("pub sub ok..");
                     onChatConnect();
                },
                failure: function(reason) {//did subscription fail?
                    console.log(reason);
                }
            });
            client.subscribe({
                options:{headers:{destination:"/private"}},
                handler: function() {onPrivateMessageUpdate.apply(window,arguments);},

                success: function() {//did subscription succeed?
                     console.log("priv sub ok..");
                },
                failure: function(reason) {//did subscription fail?
                    console.log(reason);
                }
            });
    }

  });




  onNewMessage = function(message, recipient) {
      if ( recipient == 'public' ) {
      client.send({
            options:{headers:{destination:'/public'}},
            body: message
        });
    } else {
          client.send({
            options:{
                headers:{
                        destination:'/private',
                        recipient:recipient
                }},
            body: message
        });

    }

  };

} );

