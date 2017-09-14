
var currentCall = null
var incomingCall = null
var firstTimestamp = 0

ciscospark = ciscospark.init({credentials:{access_token:"<your token here>"}})
ciscospark.on('change:authorization', function() {
  console.log('change:authorization')
  localStorage.setItem('credentials', JSON.stringify(ciscospark.credentials));
});


ciscospark.on('change:credentials', function() {
  console.log('change:credentials')
  localStorage.setItem('credentials', JSON.stringify(ciscospark.credentials));
});


ciscospark.on('change:device', function() {
  console.log("changing device")
  localStorage.setItem('device', JSON.stringify(ciscospark.device));
});

var startCapture = false
/*
var device = localStorage.getItem('device');
if (device) {
  console.log("Saving device")
  ciscospark.device.set(JSON.parse(device))
}
else {
  console.log("registering device")
}
*/

ciscospark.phone.register()
  .then(function(d){
    console.log("registered")
   /* ciscospark.phone.createLocalMediaStream().then(function(stream){
      console.log(stream)
      var video = document.querySelector("#outgoing-video");
      video.src = window.URL.createObjectURL(stream);
      video.muted = true;

    })
    */
  });


$(document).ready(function(){

  ciscospark.phone.on('call:incoming', function(call) {
    // Set up listeners to update the UI if the callee chooses to answer the call.
    console.log("Incoming call!!!")
    call.on('connected', function() {
      document.getElementById('incoming-video').src = call.remoteMediaStreamUrl;
    });
    /*call.on('localMediaStream:change', function() {
     document.getElementById('outgoing-video').src = call.localMediaStreamUrl;
     // Mute the local video so you don't hear yourself speaking
     document.getElementById('outgoing-video').muted = true;
     });
     */
    // Let the caller know that you've indicated to the callee that there's an incoming call
    call.acknowledge();

    // Answer the call
    call.answer();
    currentCall = call;
  });

  $('#incoming-video').on('loadedmetadata', function(e) {
    console.log("loadedmetadata")
    console.log(e)
    var dimensions = [this.videoWidth, this.videoHeight];
    var video = document.querySelector("#incoming-video");
    video.width = this.videoWidth/2;
    video.height = this.videoHeight/2;
  });

  $('#outgoing-video').on('loadedmetadata', function() {
    var dimensions = [this.videoWidth, this.videoHeight];
    var video = document.querySelector("#outgoing-video");
    video.width = this.videoWidth/4;
    video.height = this.videoHeight/4;
  });

  $('#callbutton').click(function(){
    var uritext = $('#uri').val()
    console.log("calling "+uritext)
    var call = ciscospark.phone.dial(uritext);
    currentCall = call
    call.on('remoteMediaStream:change', function() {
      console.log("Call connected")
      document.querySelector('#incoming-video').src = call.remoteMediaStreamUrl;
      var rvideo = document.querySelector("#incoming-video");

    });

    call.on(`change:status`, function() {
      console.log("call status change!!!!!!!!!!")
      console.log(call)
    })
    call.on("change",function(event){
      console.log("change")
     // console.log(event)
      console.log(event.status)

    })
    call.on(`disconnected`, function(c) {
      try {
        console.log("Call connected")
      }
      catch(e)
      {
        cnosole.log("ex")
      }
    })
call.on('_onLocusEvent',function(event){
  console.log("Got Locus EVENT")
  console.log(event)
})
    call.on(`ringing`, function(c) {
      console.log("Call ringing")

    });
    call.on('localMediaStream:change', function() {
      console.log("local media changed")
      var video = document.querySelector("#outgoing-video");
      video.src = call.localMediaStreamUrl;
      video.muted = true;
      // Mute the local video so you don't hear yourself speaking

    });

    call.on('hangup', function() {
      console.log("Call Hangup")
      startCapture = false;
      detector.reset();
      firstTimestamp = 0;
      startCapture = false;
    });



  });


  var captureImage = function() {

    console.log("Testing")
    var $output = $("#output");
    var video = document.querySelector("#incoming-video");
    var canvas = document.createElement("canvas");
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')
      .drawImage(video, 0, 0, canvas.width, canvas.height);

    var img = document.createElement("img");
    img.src = canvas.toDataURL();
    var context = canvas.getContext('2d');
    console.log(canvas)
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    console.log(imageData)
    var timestamp = (new Date()).getTime()
    if (firstTimestamp == 0)
    {
      detector.process(imageData,0);
      firstTimestamp = timestamp;
    }
    else
    {
      var deltaTime = timestamp  - firstTimestamp
      detector.process(imageData,deltaTime);
    }




    //$output.prepend(img);
  };


  $('#capture').click(function() {
    startCapture = true;
    captureImage()

  });

  $('#hangup').click(function() {
    startCapture = false;
    detector.reset();
    firstTimestamp = 0;
    if (currentCall)
      currentCall.hangup()
    else
      console.log("Current call is null")

  })




  var faceMode = affdex.FaceDetectorMode.LARGE_FACES;
//Construct a FrameDetector and specify the image width / height and face detector mode.
  var detector = new affdex.FrameDetector(faceMode);
  detector.addEventListener("onInitializeSuccess", function() {
    console.log("Init Success");
  });
  detector.addEventListener("onInitializeFailure", function() {
    console.log("Init Fail");
  });


  /*
  onImageResults success is called when a frame is processed successfully and receives 3 parameters:
    - Faces: Dictionary of faces in the frame keyed by the face id.
    For each face id, the values of detected emotions, expressions, appearane metrics
  and coordinates of the feature points
  - image: An imageData object containing the pixel values for the processed frame.
  - timestamp: The timestamp of the captured image in seconds.
  */

  detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
    console.log("Got Success")
    var p = document.createElement("p");
    p.innerHTML = "hello"
    var $output = $("#output");
    var $faceOverlay = $("#faceOverlay");
    console.log(faces)
    currentEmotion={}
    currentEmotion.value=-1
    currentEmotion.desc = "Unknown"
    console.log(image)
    var emotions={}
    if (faces.length > 0)
    {
      emotions = faces[0].emotions
      for (var emotion in emotions)
      {
        if (emotions[emotion] > currentEmotion.value)
        {
          currentEmotion.value = emotions[emotion]
          currentEmotion.desc = emotion
        }
      }

    }
    console.log(emotions.valence)

    if (emotions.valence > 0)
      $faceOverlay.html("<img  height='50' width='50' src='/images/happyface.png'>")
    else
      $faceOverlay.html("<img  height='50' width='50' src='/images/sadface.png'>")


    if (currentEmotion.value * 100 > 1) {
      /*
      if (currentEmotion.desc == "joy")
        $faceOverlay.html("<img  height='50' width='50' src='/images/happyface.png'>")
      else if (currentEmotion.desc == "anger")
        $faceOverlay.html("<img  height='50' width='50' src='/images/sadface.png'>")
      else
        $faceOverlay.html("")

*/
      $output.html("<br>><p>" + currentEmotion.desc + "</p><br>" + currentEmotion.value+ "%")

    }
    else
    {
      $output.html("<br><br><p>Neutral</p><br>")
    }
    detector.reset()
    if (startCapture)
      setTimeout(captureImage,100)
  });

  /*
   onImageResults success receives 3 parameters:
   - image: An imageData object containing the pixel values for the processed frame.
   - timestamp: An imageData object contain the pixel values for the processed frame.
   - err_detail: A string contains the encountered exception.
   */

  detector.addEventListener("onImageResultsFailure", function (image, timestamp, err_detail) {


      console.log("Got failure  ")
    console.log(err_detail)
  });

// Track smiles
  detector.detectExpressions.smile = true;

// Track joy emotion
 // detector.detectEmotions.joy = true;
 // detector.detectEmotions.anger = true;
 // detector.detectEmotions.contempt = true;

// Detect person's gender
  detector.detectAppearance.gender = true;


//  detector.detectAllExpressions();
  detector.detectAllEmotions();
  detector.detectAllEmojis();
//  detector.detectAllAppearance();


  detector.start();


});
