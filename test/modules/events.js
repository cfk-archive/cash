
var fixture = '\
  <div class="parent">\
    <div class="event">\
      <div class="child">\
        <div class="grandchild"></div>\
      </div>\
    </div>\
    <input class="event-focus">\
  </div>\
';

describe ( 'Events', { beforeEach: getFixtureInit ( fixture ) }, function () {

  describe ( '$.fn.on', function ( it ) {

    it ( 'attaches a single event', function ( t ) {

      var ele = $('.event');
      var count = 0;
      var that;

      function handler () {
        count++;
        that = this;
      }

      ele.on ( 'click', handler );
      ele.trigger ( 'click' ).trigger ( 'click' );

      t.is ( count, 2 );
      t.is ( that, ele[0] );

    });

    it ( 'attaches multiple events', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo bar', handler );
      ele.trigger ( 'foo' ).trigger ( 'bar' );

      t.is ( count, 2 );

    });

    it ( 'attaches multiple events via a map', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ({
        foo: handler,
        bar: handler
      });

      ele.trigger ( 'foo' ).trigger ( 'bar' );

      t.is ( count, 2 );

    });

    it ( 'stops propagation if false is returned', function ( t ) {

      var ele = $('.event');
      var parent = $('.parent');
      var count = 0;

      function handler () {
        count++;
        return false;
      }

      parent.on ( 'foo', handler );
      parent.on ( 'foo', handler );
      ele.on ( 'foo', handler );
      ele.on ( 'foo', handler ); // We are not using `stopImmediatePropagation`
      ele.trigger ( 'foo' );

      t.is ( count, 2 );

    });

    ( document.hasFocus () ? it : it.skip )( 'supports events that do not bubble', function ( t ) { // If the document isn't focused the element won't get the focus either

      var events = ['focus', 'blur', 'mouseenter', 'mouseleave'],
          eventsTrigger = ['focus', 'blur', 'mouseover', 'mouseout'];

      events.forEach ( function ( event, index ) {

        var ele = $('.event-focus');
        var parent = $('.parent');
        var count = 0;
        var eventTrigger = eventsTrigger[index];

        function handler () {
          count++;
        }

        parent.on ( event, handler );
        ele.on ( event, handler );
        ele.trigger ( eventTrigger );

        parent.off ( event );
        ele.off ( event );
        ele.trigger ( eventTrigger );

        t.is ( count, 2 );

      });

    });

    it ( 'calls native event triggerers directly', function ( t ) {

      var ele = $('.event-focus');
      var count = 0;

      ele[0].focus = function () {
        count++;
      };

      ele.trigger ( 'focus' );

      t.is ( count, 1 );

    });

    it ( 'supports namespaces', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo bar.ns1', handler );
      ele.on ( 'foo.ns1.ns2', handler );
      ele.trigger ( 'foo.ns1.ns2' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' );

      t.is ( count, 3 );

    });

    it ( 'supports event delegation', function ( t ) {

      var ele = $('.event');
      var parent = $('.parent');
      var grandchild = $('.grandchild');
      var count = 0;

      function handler () {
        count++;
      }

      parent.on ( 'click', '.event', handler );
      ele.trigger ( 'click' );
      grandchild.trigger ( 'click' );

      t.is ( count, 2 );

      parent.off ( 'click', handler );
      ele.trigger ( 'click' );

      t.is ( count, 2 );

    });

    it ( 'supports a data argument', function ( t ) {

      var ele = $('.event');
      var count = 0;
      var datas = [];

      function handler ( event ) {
        count++;
        datas.push ( event.data );
      }

      var values = [123, 'string', { obj: true }, 0, ''];

      values.forEach ( function ( value ) {

        ele.on ( 'foo', value, handler ); // Simple + Naive
        ele.on ( 'foo', undefined,  value, handler ); // Simple
        ele.on ( 'foo', '.event',  value, handler ); // Event delegation (Matching)
        ele.on ( 'foo', '.eventz',  value, handler ); // Event delegation (Not Matching)
        ele.on ( { foo: handler }, value ); // Map Simple + Naive
        ele.on ( { foo: handler }, null, value ); // Map Simple
        ele.on ( { foo: handler }, '.event', value ); // Map + Event delegation (Matching)
        ele.on ( { foo: handler }, '.evenz', value ); // Map + Event delegation (Not Matching)

      });

      ele.trigger ( 'foo' );

      t.is ( count, 28 );
      t.deepEqual ( datas, [123, 123, 123, 123, 123, 123, 'string', 'string', 'string', 'string', { obj: true }, { obj: true }, { obj: true }, { obj: true }, { obj: true }, { obj: true }, 0, 0, 0, 0, 0, 0, undefined, '', '', undefined, '', ''] );

    });

    it ( 'ignores the order of namespaces', function ( t ) {

      var ele = $('.event');
      var count = 0;
      var namespaces = [];

      function handler ( event ) {
        count++;
        namespaces.push ( event.namespace );
      }

      ele.on ( 'foo.ns1.ns2', handler ).on ( 'foo.ns2.ns1', handler );

      ele.trigger ( 'foo.ns1.ns2' );
      ele.trigger ( 'foo.ns2.ns1' );

      ele.off ( 'foo.ns1.ns2' ).trigger ( 'foo.ns1.ns2' );

      t.is ( count, 4 );
      t.deepEqual ( namespaces, ['ns1.ns2', 'ns1.ns2', 'ns1.ns2', 'ns1.ns2'] );

    });

    it ( 'ignores namespaces-only events', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( '.ns1.ns2', handler );
      ele.trigger ( '.ns1.ns2' );

      t.is ( count, 0 );

    });

    it ( 'ignores non-elements objects in the collections', function ( t ) {

      var ele = $(document.createTextNode ( '.css' ));
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo', handler );
      ele.trigger ( 'foo' );

      t.is ( count, 0 );

    });

    it ( 'overwrites event.currentTarget when using event delegation', function ( t ) {

      var ele = $('.event');
      var parent = $('.parent');
      var html = $('html');
      var count = 0;
      var currentTargets = [];

      function handler ( event ) {
        count++;
        event.bubbles; // Ensuring the event object hasn't been corrupted
        currentTargets.push ( event.currentTarget );
      }

      ele.on ( 'click', handler );
      parent.on ( 'click', '.event', handler );
      html.on ( 'click', handler );
      ele.trigger ( 'click' );

      t.is ( count, 3 );
      t.deepEqual ( currentTargets, [ele[0], ele[0], html[0]] );

    });

    it.skip ( 'stops propagation if false is returned when using event delegation', function ( t ) { //URL: https://github.com/kenwheeler/cash/issues/235

      var ele = $('.event');
      var parent = $('.parent');
      var child = $('.child');
      var count = 0;
      var currentTargets = [];

      function handler ( event ) {
        count++;
        currentTargets.push ( event.currentTarget );
        return false;
      }

      parent.on ( 'foo', handler );
      parent.on ( 'foo', handler );
      parent.on ( 'foo', '.event', handler );
      parent.on ( 'foo', '.event', handler );
      parent.on ( 'foo', '.child', handler );
      parent.on ( 'foo', '.child', handler );

      parent.trigger ( 'foo' );

      t.is ( count, 2 );
      t.deepEqual ( currentTargets.slice ( 0 ), [parent[0], parent[0]] );

      ele.trigger ( 'foo' );

      t.is ( count, 4 );
      t.deepEqual ( currentTargets.slice ( 2 ), [ele[0], ele[0]] );

      child.trigger ( 'foo' );

      t.is ( count, 6 );
      t.deepEqual ( currentTargets.slice ( 4 ), [child[0], child[0]] );

    });

    it ( 'doesn\'t throw an error when receiving a falsy callback', function ( t ) {

      var ele = $('.event');

      ele.on ( 'click', 0 );
      ele.on ( 'click', '' );
      ele.on ( 'click', undefined );
      ele.on ( 'click', null );

      t.pass ();

    });

  });

  describe ( '$.fn.one', function ( it ) {

    it ( 'removes the handler after the first call', function ( t ) {

      var ele = $('.event');
      var count = 0;

      var handler = function () {
        count++;
      };

      ele.one ( 'click', handler );
      ele.trigger ( 'click' ).trigger ( 'click' );

      t.is ( count, 1 );

      ele.one ( 'click', handler ).off ( 'click', handler ).trigger ( 'click' );

      t.is ( count, 1 );

    });

  });

  describe ( '$.fn.off', function ( it ) {

    it ( 'removes a single event', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'click', handler );
      ele.trigger ( 'click' );
      ele.off ( 'click' );
      ele.trigger ( 'click' );

      t.is ( count, 1 );

    });

    it ( 'removes multiple events', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo bar baz', handler );
      ele.off ( 'foo bar', handler );
      ele.trigger ( 'foo' ).trigger ( 'bar' ).trigger ( 'baz' );

      t.is ( count, 1 );

    });

    it ( 'removes multiple events via a map', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      var events = {
        foo: handler,
        bar: handler
      };

      ele.on ( events ).off ( events );
      ele.trigger ( 'foo' ).trigger ( 'bar' );

      t.is ( count, 0 );

    });

    it ( 'removes namespaced events, preserving regular ones', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo foo.ns1', handler ).off ( '.ns1' ).trigger ( 'foo' ).off ( 'foo' ).trigger ( 'foo' );

      t.is ( count, 1 );

    });

    it ( 'removes all events', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo bar', handler );
      ele.off ();
      ele.trigger ( 'foo' ).trigger ( 'bar' );

      t.is ( count, 0 );

    });

    it ( 'supports namespaces', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo.ns1.ns2', handler ).off ( 'foo' ).trigger ( 'foo' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' ).trigger ( 'foo.ns3' );

      t.is ( count, 0 );

      ele.on ( 'foo.ns1.ns2', handler ).off ( 'foo.ns1' ).trigger ( 'foo' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' ).trigger ( 'foo.ns3' );

      t.is ( count, 0 );

      ele.on ( 'foo.ns1.ns2', handler ).off ( 'foo.ns2' ).trigger ( 'foo' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' ).trigger ( 'foo.ns3' );

      t.is ( count, 0 );

      ele.on ( 'foo.ns1.ns2', handler ).off ( 'foo.ns1.ns2' ).trigger ( 'foo' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' ).trigger ( 'foo.ns3' );

      t.is ( count, 0 );

      ele.on ( 'foo.ns1.ns2 bar.ns1.ns2 baz.ns1.ns2', handler ).off ( '.ns1' ).trigger ( 'foo' ).trigger ( 'bar' ).trigger ( 'baz' );

      t.is ( count, 0 );

      ele.on ( 'foo.ns1.ns2', handler ).off ( 'foo.ns3' ).trigger ( 'foo' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' ).trigger ( 'foo.ns3' );

      t.is ( count, 3 );

    });

    it ( 'supports event delegation', function ( t ) {

      var ele = $('.event');
      var parent = $('.parent');
      var countChild = 0;
      var countDelegate = 0;

      function handlerChild () {
        countChild++;
      }

      function handlerDelegate () {
        countDelegate++;
      }

      ele.on ( 'click', handlerChild );
      parent.on ( 'click', '.event', handlerDelegate );
      parent.off ( 'click', '.event', handlerDelegate );
      ele.trigger ( 'click' );

      t.is ( countChild, 1 );
      t.is ( countDelegate, 0 );

    });

    it ( 'doesn\'t throw an error when receiving a falsy callback', function ( t ) {

      var ele = $('.event');

      ele.off ( 'click', 0 );
      ele.off ( 'click', '' );
      ele.off ( 'click', undefined );
      ele.off ( 'click', null );

      t.pass ();

    });

  });

  describe ( '$.fn.ready', function () {

    QUnit.test ( 'calls the callback if the DOM is already ready', function ( assert ) { // For some reason we can't use our nice helpers for async assertions :(

      Object.defineProperty ( document, 'readyState', {
        configurable: true,
        value: 'complete'
      });

      var done = assert.async ();
      var count = 0;
      var arg;

      var handler = function ( $ ) {
        count++;
        arg = $;
      };

      $(handler);

      setTimeout ( function () {
        assert.is ( count, 1 );
        assert.is ( arg, $ );
        done ();
      }, 100 );

    });

    QUnit.test ( 'calls the callback if the DOM is not ready already', function ( assert ) { // For some reason we can't use our nice helpers for async assertions :(

      Object.defineProperty ( document, 'readyState', {
        configurable: true,
        value: 'loading'
      });

      var done = assert.async ();
      var count = 0;
      var arg;

      var handler = function ( $ ) {
        count++;
        arg = $;
      };

      $(handler);
      $(document).trigger ( 'DOMContentLoaded' );

      setTimeout ( function () {
        assert.is ( count, 1 );
        assert.is ( arg, $ );
        done ();
      }, 100 );

    });

    QUnit.test ( 'exceptions aren\'t propagated', function ( assert ) { // For some reason we can't use our nice helpers for async assertions :(

      var done = assert.async ();

      var handler = function () {
        throw new Error ();
      };

      $(handler);
      $(document).trigger ( 'DOMContentLoaded' );

      setTimeout ( function () {
        assert.is ( true, true );
        done ();
      }, 100 );

    });

  });

  describe ( '$.fn.trigger', function ( it ) {

    it ( 'triggers single event', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'click', handler );
      ele.trigger ( 'click' );

      t.is ( count, 1 );

    });

    ( document.hasFocus () ? it : it.skip )( 'triggers focus/blur natively', function ( t ) { // If the document isn't focused the element won't get the focus either

      var events = ['focus', 'blur'];

      events.forEach ( function ( event ) {

        var ele = $('.event-focus');
        var count = 0;

        function handler () {
          count++;
        }

        var nativeHandler = ele[0][event];
        ele[0][event] = function () {
          handler ();
          nativeHandler.apply ( this, arguments );
        };

        ele.on ( event, handler );
        ele.trigger ( event );

        t.is ( count, 2 );

      });

    });

    it ( 'can pass data to the handler', function ( t ) {

      var ele = $('.event');
      var count;
      var data;

      function handler ( event, d ) {
        count++;
        data = d;
      }

      var values = [123, 'string', { obj: true }, 0, ''];

      values.forEach ( function ( value ) {

        count = 0;

        ele.on ( 'custom', handler );
        ele.trigger ( 'custom', value );
        ele.off ( 'custom', handler );

        t.is ( count, 1 );
        t.is ( data, value );

      });

    });

    it ( 'can pass namespaces to the handler', function ( t ) {

      var ele = $('.event');
      var namespaces = [];

      function handler ( event ) {
        namespaces.push ( event.namespace );
      }

      ele.on ( 'foo.ns1.ns2', handler );
      ele.trigger ( 'foo' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' ).trigger ( 'foo.ns1.ns2' );

      t.deepEqual ( namespaces, ['', 'ns1', 'ns2', 'ns1.ns2'] );

    });

    it ( 'supports namespaces', function ( t ) {

      var ele = $('.event');
      var count = 0;

      function handler () {
        count++;
      }

      ele.on ( 'foo.ns1.ns2', handler ).trigger ( 'foo' ).trigger ( 'foo.ns1' ).trigger ( 'foo.ns2' ).trigger ( 'foo.ns3' ).trigger ( 'foo.ns1.ns3' );

      t.is ( count, 3 );

    });

  });

});
