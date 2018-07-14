var app = {
  startCameraAbove: function(){
    CameraPreview.startCamera({x: 50, y: 50, width: 100, height: 100, toBack: false, previewDrag: true, tapPhoto: true});
    CameraPreview.switchCamera();
    CameraPreview.hide();
  },

  startCameraBelow: function(){
    CameraPreview.startCamera({x: 50, y: 50, width: 100, height:100, camera: "front", tapPhoto: true, previewDrag: false, toBack: true});
  },

  stopCamera: function(){
    CameraPreview.stopCamera();
  },

  takePicture: function(){
    CameraPreview.takePicture(function(imgData){
        // document.getElementById('originalPicture').src = 'data:image/jpeg;base64,' + imgData; // Show Preview
		$.post("http://poonja.co.uk/index.php",
			{
				image: 'data:image/jpeg;base64,' + imgData
			},function(data, status){
               alert("Data: " + data + "\nStatus: " + status);
        });

    });
  },
  
  switchCamera: function(){
    CameraPreview.switchCamera();
  },

  show: function(){
    CameraPreview.show();
  },

  hide: function(){
    CameraPreview.hide();
  },

  changeColorEffect: function(){
    var effect = document.getElementById('selectColorEffect').value;
    CameraPreview.setColorEffect(effect);
  },

  changeFlashMode: function(){
    var mode = document.getElementById('selectFlashMode').value;
    CameraPreview.setFlashMode(mode);
  },

  changeZoom: function(){
    var zoom = document.getElementById('zoomSlider').value;
    document.getElementById('zoomValue').innerHTML = zoom;
    CameraPreview.setZoom(zoom);
  },

  changePreviewSize: function(){
    window.smallPreview = !window.smallPreview;
    if(window.smallPreview){
      CameraPreview.setPreviewSize({width: 100, height: 100});
    }else{
      CameraPreview.setPreviewSize({width: window.screen.width, height: window.screen.height});
    }
  },

  showSupportedPictureSizes: function(){
    CameraPreview.getSupportedPictureSizes(function(dimensions){
      dimensions.forEach(function(dimension) {
        console.log(dimension.width + 'x' + dimension.height);
      });
    });
  },

  init: function(){
    document.getElementById('startCameraAboveButton').addEventListener('click', this.startCameraAbove, false);
    document.getElementById('showButton').addEventListener('click', this.show, false);
    document.getElementById('hideButton').addEventListener('click', this.hide, false);
    document.getElementById('takePictureButton').addEventListener('click', this.takePicture, false);

    window.smallPreview = false;
  }
};

document.addEventListener('deviceready', function(){	
  app.init();
}, false);
