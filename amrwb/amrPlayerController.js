   /* 
    */
var CreateamrPlayerController = function(armUri, guid) {
	    // physical
    var trackBarWidth = 0;
    var leftPositionOfContainer = null;
    var faderPosition = 0;
	var trackDuration = 0;
	var player;
	
	var togglePlayPause = function (){
		player.toggle();
		if (player.isPlaying) {
			$("#"+guid+"playerprogressbar").removeClass("isPaused");
			$("#"+guid+"playerprogressbar").addClass("isPlaying");
			startInterval(faderPosition);
		}
		else
		{
			$("#"+guid+"playerprogressbar").removeClass("isPlaying");
			$("#"+guid+"playerprogressbar").addClass("isPaused");
			resetInterval();
			faderPosition = convertLengthToTime($('#'+guid+'track-bar').width());
		}
	};
	
	var getLeftPositionOfContainer = function () {
        return $('#'+guid+'track-bar-container').offset().left;
    };
	
	var init = function() {
        leftPositionOfContainer = getLeftPositionOfContainer();
		setEventListeners();
		var audiocontext = getAudioContext();
		player = new AmrPlayer(armUri, function() { changeStyle($("#"+guid+"track-bar-loaded"), 'width', '100%'); setTrackDuration(); trackBarWidth = getTrackBarWidth(); }, function(evt) { var percentComplete = (evt.loaded / evt.total) * 100; changeStyle($("#"+guid+"track-bar-loaded"), 'width', percentComplete + "%");}, audiocontext);
		player.endedWith( function(){ 
			$("#"+guid+"playerprogressbar").removeClass("isPlaying");
			$("#"+guid+"playerprogressbar").addClass("isPaused");
			resetInterval();
			faderPosition = 0;
		} );        
	};
		
	var setEventListeners = function () {
        $('#'+guid+'play-btn').on('click', togglePlayPause);
		$('#'+guid+'pause-btn').on('click', togglePlayPause);
        $('#'+guid+'track-bar-container').on('click', faderMoveByClick);
		$('#'+guid+'track-bar-container').mouseenter( mouseenterTrackbar );
		$('#'+guid+'track-bar-container').mouseleave( mouseleaveTrackbar );
		$('#'+guid+'volumeSlider').on('click', changeVolume);
		$('#'+guid+'volumeBtn').mouseenter(mousehoverVolume);
        //$('#track-bar-container').on('mousedown', '#fader', setFaderDrag);
    };
	
	var getTrackBarWidth =  function () {
		//alert($('#track-bar-container').width());
        return $('#'+guid+'track-bar-bg').width();
    };
	
	var mouseenterTrackbar = function (event) {
		mousehoverTrackbar(event);
		$('#'+guid+'track-bar-container').mousemove(mousehoverTrackbar);
	};
	
	var mouseleaveTrackbar = function () {
		$('#'+guid+'track-bar-container').off("mousemove");
	};
	
	var mousehoverTrackbar = function(event){
		var cursorX =  getCursorPos(event);
		changeStyle($('#'+guid+'trackhovertime'), 'left', cursorX);
        var playbackTime = convertLengthToTime(cursorX);
        var htmlOfTime = convertPlaybackTime(playbackTime);
        $('#'+guid+'trackhovertime').html(htmlOfTime);
	};
	
	var mousehoverVolume = function (event) {
		
		changeStyle($('#'+guid+'volumeControl'), 'opacity', '1');
		$('#'+guid+'volumeControl').mouseenter(function() { $('#'+guid+'volumeControl').mouseleave(function() { changeStyle($('#'+guid+'volumeControl'), 'opacity', '0');}); });
	};
	
	var changeVolume = function (event)
	{
		console.log("changeVolume");
		var cursorY =  getCursorPosY(event);
			        
        // view >> fader, progress-bar
        changeStyle($('#'+guid+'volCursor'), 'top', cursorY);
		
		var volsliderhiehgt = 100 * ($('#'+guid+'volumeSlider').height() - cursorY) / $('#'+guid+'volumeSlider').height();
		
		if (volsliderhiehgt > 100)
			volsliderhiehgt = 100;
		if (volsliderhiehgt < 0)
			volsliderhiehgt = 0;
		
        changeStyle($('#'+guid+'volLevel'), 'height', volsliderhiehgt + "%" );
		
		var volumelevel = (1 - (cursorY / $('#'+guid+'volumeSlider').height()));
		if (volumelevel <= 0)
		{
			volumelevel = 0;
			changeStyle($('#'+guid+'volumeIconloud'), 'opacity', '0');
			changeStyle($('#'+guid+'volumeIconmid'), 'opacity', '0');
			changeStyle($('#'+guid+'volumeIconMute'), 'opacity', '1');
		}
		else
		{
			if (volumelevel > 1)
			{
				volumelevel = 1;
			}
			changeStyle($('#'+guid+'volumeIconMute'), 'opacity', '0');
			changeStyle($('#'+guid+'volumeIconmid'), 'opacity', '1');
			if (volumelevel > 0.6)
			{
				changeStyle($('#'+guid+'volumeIconloud'), 'opacity', '1');
			}
			else
			{
				changeStyle($('#'+guid+'volumeIconloud'), 'opacity', '0');
			}
		}
		
		player.setVolume(volumelevel);
		//console.log(volumelevel);
	};
	
	var faderMoveByClick = function (event) {
        // change positions of progressbar
        var cursorX =  getCursorPos(event);
        changeStyle($('#'+guid+'fader'), 'left', cursorX);
        changeStyle($('#'+guid+'track-bar'), 'width', cursorX);

        // playbackTime changed
        isplaybackTimeChanged = true;
        var newplaybackTime = convertLengthToTime(cursorX);
		faderPosition = newplaybackTime;
		if (player.isPlaying)
		{
			clearInterval(progressTimer);
			startInterval(faderPosition);
		}
		player.playAtOffset(newplaybackTime);
		
    };
	
	var getCursorPos = function (event) {
        var cursorX = event.pageX;
        return cursorX - leftPositionOfContainer;
    };
	
	var getCursorPosY = function (event) {
        var cursorY = event.pageY;
		if (cursorY > getTopPositionOfVolumeSlider() + $('#'+guid+'volumeSlider').height())
			cursorY = getTopPositionOfVolumeSlider() + $('#'+guid+'volumeSlider').height();
        return cursorY - getTopPositionOfVolumeSlider();
    };
	
	var getTopPositionOfVolumeSlider = function () {
        return $('#'+guid+'volumeSlider').offset().top;
    };

    	
	var setFaderMoveController =  function (event) {
        // cursor position
        var faderPosX = getCursorPos(event);
        
        // view >> fader, progress-bar
        changeStyle($('#'+guid+'fader'), 'left', faderPosX);
        changeStyle($('#'+guid+'track-bar'), 'width', faderPosX);

        // view >> playback time
        var playbackTime = convertLengthToTime(faderPosX);
        var htmlOfTime = convertPlaybackTime(playbackTime);
        displayPlaybackTime($('#'+guid+'playback-time'), htmlOfTime);

    };

    var checkCursor = function (event) {
        // absolute positions of cursor
        var posX = event.pageX;
        var posY = event.pageY;

        /* 
        container parameters：width height top left
        judge whether cursor is outside or inside the container
        */
        var $target = $('#'+guid+'track-bar-container');
        var targetTop = $target.offset().top;
        var targetLeft = $target.offset().left;
        var targetWidth = trackBarWidth;
        var targetHeight = $target.outerHeight();

        if (targetLeft <= posX && targetLeft + targetWidth &&
            targetTop <= posY && posY <= targetTop + targetHeight) {
            console.log('inside man');
            return true;
        } else {
            console.log('outside lady');
            return false;
        }
    };

    // display the track duration
    var setTrackDuration = function () {
		trackDuration = player.duration();
        var html = convertPlaybackTime(trackDuration);
        displayPlaybackTime($('#'+guid+'song-duration'), html);
		trackBarWidth = getTrackBarWidth();
    };
	
	var displayPlaybackTime = function (aDom, aPlaybackTimeHtml) {
        aDom.html(aPlaybackTimeHtml);
    };
	
	var resetInterval = function () {
        clearInterval(progressTimer);
    };
	
	var startInterval = function (playbackTime) {
        var $fader = $('#'+guid+'fader');
        var $progressBar = $('#'+guid+'track-bar');

        var $playback = $('#'+guid+'playback-time');

        progressTimer = setInterval(function() {
			//aPlaybackTime = player.getCurrentTime();
			
			
            // playbackTime(seconds) >> (pixels)
            var length = convertTimeToLength(playbackTime);
            
			//console.log("aPlaybackTime: "+playbackTime + ", length: " + length);
			
            // view >> progress bar
            changeStyle($fader, 'left', length);
            changeStyle($progressBar, 'width', length);

            // view >> playback time
            var playbackTimeHtml = convertPlaybackTime(playbackTime);
            displayPlaybackTime($playback, playbackTimeHtml);

            // 0.03 is equal to 30 milliseonds 
            playbackTime += 0.03;

            // if aplayback time surpass duration, clear interval
            if (playbackTime >= trackDuration) {
                resetInterval();
            }
        }, 30);
    };
	

	
	var changeStyle = function (aDom, aProperty, aValue) {
        aDom.css(aProperty, aValue);
    };

	var convertPlaybackTime = function (aPlaybackTime) {
        // convert | ex) playbackTime = 360.3452 |
        var minutes = Math.floor(aPlaybackTime/60);
        var seconds = Math.floor(aPlaybackTime%60);

        // just for layout ex) 7 >> 07
        seconds = (seconds < 10) ? '0' + seconds : seconds;

        return minutes + ':' + seconds;
    };

    var convertLengthToTime = function (aLength) {
        return trackDuration * ( aLength/trackBarWidth );
    };

    var convertTimeToLength = function (aPlaybackTime) {
        return aPlaybackTime / trackDuration * trackBarWidth;
    };
	
	init();
}