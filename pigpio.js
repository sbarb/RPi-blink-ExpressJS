var Q = require('q');
var gpio = require("pi-gpio");
var SyncGPIO = {
  write: function (pin, state) {
    var deferred = Q.defer();
    gpio.write(pin, state, function (err) {
      if(err) {
        console.log("Failed to write to pin.", pin, state);
        deferred.reject(err)
      } else {
        deferred.resolve(true);
      }
    });
    return deferred.promise;
  },
  open: function (pin, mode) {
    var deferred = Q.defer();
    gpio.open(pin, mode, function (err) {
      if(err) {
        console.log("Failed to open pin.", pin, mode);
        deferred.reject(err)
      } else {
        deferred.resolve(true);
      }
    });
    return deferred.promise;
  },
  close: function (pin) {
    var deferred = Q.defer();
    gpio.close(pin, function (err) {
      if(err) {
        console.log("Failed to close pin.", pin, state);
        deferred.reject(err)
      } else {
        deferred.resolve(true);
      }
    });
    return deferred.promise;
  }
};

var Pi = function (lightPin) {
  this.lightPin = lightPin;
  this.lightState = null;
  this.HIGH = 1;
  this.LOW = 0;
  this.ready = SyncGPIO.open(lightPin, "output");

  

  // count is the number of times to change the state of the bulb.
  this.blink = function (count) {
    if(count === 0) {
      return;
    }
    var self = this;
    self.toggle().then(function () {
      setTimeout(function () {
        self.blink(count-1);
      }, 1000);
    });
  };
  // returns a promise to turn on
  this.turnOn = function () {
    self = this;
    return SyncGPIO.write(this.lightPin, this.HIGH).then(function () {
      this.lightState = true;
    });
  };
  // returns a promise to turn off
  this.turnOff = function () {
    self = this;
    return SyncGPIO.write(this.lightPin, this.LOW).then(function () {
      this.lightState = false;
    });
  };
  this.toggle = function () {
    if (this.lightState === true) {
      return this.turnOff();
    } else {
      return this.turnOn();
    }
  }
};

var MyPi = new Pi(7);
MyPi.ready.then(function () {
  MyPi.blink(10);
});

var app = require('express')();
app.route('/').get(function (req, res) {
  res.send(200, "Light is " + MyPi.lightState);
});

app.route('/LEDinfo').post(function (req, res) {
  var led = req.body.led;
  if(led === null || led === undefined){
    res.send(400, "Please make a properly formed request.");
    return;
  } else {
    var promise = null;
    if (led) {
      promise = MyPi.turnOn()
    } else {
      promise = MyPi.turnOff()
    }
    promise.then(function () {
      var btn;
      if(MyPi.lightState){
        btn = '<input class="off" type="submit" name="LED" value="OFF">'
      } else {
        btn = '<input class="on" type="submit" name="LED" value="ON">'
      }
      res.send(200, btn + "Changing light maybe. Light is " + MyPi.lightState);
    });
  }
});

var http = require('http').Server(app);
// Determining port to run on and starting the server.
var server_port = process.env.PORT || 9000
http.listen(server_port, function () {
  console.log("Listening on port #{server_port}. ^c to exit");
});