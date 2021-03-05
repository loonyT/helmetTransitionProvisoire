
/*
* -- AmrPlayer --
* params:
*  1. amr_url
*  2. download_success_cb (optional)
*  3. download_progress_cb (optional)
* props:
*  1. bool canPlay
*  2. bool isPlaying
* methods:
*  1. play()
*  2. pause()
*  3. toggle() // play() when paused or pause() when playing
*  3. endWith(callback) // fire callback with ended event
* */
var AmrPlayer = function(amr_url, download_success_cb, download_progress_cb, audiocontext){
    this.init( amr_url, download_success_cb, download_progress_cb, audiocontext);
};
AmrPlayer.prototype = {
    init: function(amr_url, download_success_cb, download_progress_cb, audioContext){
        this.audioContext = audioContext;
        this.bufferSource = null;
        this.blob = null;
        this.canPlay = false;
        this.isPlaying = false;
		this.AMR_HEADER = "#!AMR-WB\n";
		//this.player = plaYer;
        var cnt = 0;
		this.startOffset = 0;
		this.startTime = 0;
		
		this.startedAt = 0;
        this.pausedAt = 0;
		this.loaded_cb = null;
		
		this.volume = null;
		this.volumelevel = 0.99;
		this.isshifting = false;
		
		var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
               navigator.userAgent &&
               navigator.userAgent.indexOf('CriOS') == -1 &&
               navigator.userAgent.indexOf('FxiOS') == -1;
        this.ended_cb = function(){
            if(cnt === 0){
                cnt++;
                var msg = "AmrPlayer ended callback\n";
                msg += "usage:\n";
                msg += "var player = new AmrPlayer('http://xxx.com/xxx.amr');\n";
                msg += "player.endedWith( function(){ xxx } );";
                console.info(msg);
            }
        };
        this.downloadAmrBlob(amr_url, download_success_cb, download_progress_cb);
    },
	checkAMRWBFormat: function(amr)
	{
	    // Check file header.
        if (String.fromCharCode.apply(null, amr.subarray(0, this.AMR_HEADER.length)) !== this.AMR_HEADER) {
            return false;
        }
		return true;
	},
    downloadAmrBlob: function(amr_url, download_success_cb, download_progress_cb){
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', amr_url);
        xhr.responseType = 'blob';
        xhr.onreadystatechange = function(e) {
            if ( xhr.readyState == 4 && xhr.status == 200 ) {
                self.blob = new Blob([xhr.response], {type: 'audio/mpeg'});
                self.genPLayer();
                self.canPlay = true;
				setTimeout(function() { download_success_cb && download_success_cb(); }, 10);
                
            }
        };
        xhr.onprogress = function(e){
            if(e.lengthComputable){
                download_progress_cb && download_progress_cb(e);
            }
        };
        xhr.send();
    },
    genPLayer: function(){
        var self = this;
        this.isPlaying = false;
        this.readBlob(this.blob, function(data){
            self.readAmrArray(data);
        });
    },
    readBlob: function(blob, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            callback(data);
        };
        reader.readAsArrayBuffer(blob);
    },
    readAmrArray: function(array) {
		if (this.checkAMRWBFormat(array))
		{
			AMRWB.decodeInit();
			var samples = AMRWB.decode(array);
			AMRWB.decodeExit();
			if (!samples) {
				alert('Failed to decode!');
				return;
			}
			this.play16bPcm(samples);
		}
		else
		{
			var samples = AMR.decode(array);
			if (!samples) {
				alert('Failed to decode!');
				return;
			}
			this.play8bPcm(samples);
		}
    },
    readPcm: function(samples) {
        var self = this;
        var ctx = this.getAudioContext();
		if (this.bufferSource === null)
		{
			// Do nothing...
		}
		else
		{
			try{
				this.bufferSource.stop();
			}
			catch (err) {}
			this.bufferSource = null;
		}
        this.bufferSource = ctx.createBufferSource();
        var buffer = ctx.createBuffer(1, samples.length, 8000);
        if (buffer.copyToChannel) {
            buffer.copyToChannel(samples, 0, 0)
        } else {
            var channelBuffer = buffer.getChannelData(0);
            channelBuffer.set(samples);
        }
        this.bufferSource.buffer = buffer;
        this.bufferSource.connect(ctx.destination);
        this.bufferSource.onended = function(){
			if (!self.isshifting)
			{
				self.ended_cb && self.ended_cb();
				self.genPLayer();
			}
        };
    },
	play16bPcm: function(samples) {
		var self = this;
        var ctx = this.getAudioContext();    
		if (this.bufferSource === null)
		{
			// Do nothing...
		}
		else
		{
			try{
				this.bufferSource.stop();
			}
			catch (err) {}
			this.bufferSource = null;
		}
        this.bufferSource = ctx.createBufferSource();
		
		if (!this.volume)
		{
			var gainNode = ctx.createGain();
			gainNode.gain.value = this.volumelevel; 
			this.volume = gainNode;	
			this.volume.connect(ctx.destination);
		}			
		
		
		
		if (isSafari)
		{
			var resampler = new Resampler(16000, 44100, 1, samples.length)
			var resampledData = resampler.resample(samples);
			var buffer = ctx.createBuffer(1, resampledData.length, 44100);
			if (buffer.copyToChannel) {
				buffer.copyToChannel(resampledData, 0, 0);
			} else {
				buffer.getChannelData(0).set(resampledData);
			}
			this.bufferSource.buffer = buffer;
			this.bufferSource.connect(this.volume);
		}
		else
		{
			var buffer = ctx.createBuffer(1, samples.length, 16000);
			if (buffer.copyToChannel) {
				buffer.copyToChannel(samples, 0, 0)
			} else {
				var channelBuffer = buffer.getChannelData(0);
				channelBuffer.set(samples);
			}
			this.bufferSource.buffer = buffer;
			//this.bufferSource.connect(ctx.destination);
			this.bufferSource.connect(this.volume);
		}
		
		this.bufferSource.onended = function(){
			if (!self.isshifting)
			{
				self.ended_cb && self.ended_cb();
				self.genPLayer();
			}
        };
		//this.player.connect(ctx.destination);
		if (this.loaded_cb)
		{
			this.loaded_cb();
		}
    },
	
	play8bPcm: function(samples) {
		var self = this;
        var ctx = this.getAudioContext();
		if (this.bufferSource === null)
		{
			// Do nothing...
		}
		else
		{
			try{
				this.bufferSource.stop();
			}
			catch (err) {}
			this.bufferSource = null;
		}
        this.bufferSource = ctx.createBufferSource();
		
		if (!this.volume)
		{
			var gainNode = ctx.createGain();
			gainNode.gain.value = this.volumelevel; 
			this.volume = gainNode;	
			this.volume.connect(ctx.destination);
		}	
		
		if (isSafari)
		{
			var resampler = new Resampler(8000, 44100, 1, samples.length)
			var resampledData = resampler.resample(samples);
			var buffer = ctx.createBuffer(1, resampledData.length, 44100);
			if (buffer.copyToChannel) {
				buffer.copyToChannel(resampledData, 0, 0);
			} else {
				buffer.getChannelData(0).set(resampledData);
			}
			this.bufferSource.buffer = buffer;
			//this.bufferSource.connect(ctx.destination);
			this.bufferSource.connect(this.volume);
		}
		else
		{
			var buffer = ctx.createBuffer(1, samples.length, 8000);
			if (buffer.copyToChannel) {
				buffer.copyToChannel(samples, 0, 0)
			} else {
				var channelBuffer = buffer.getChannelData(0);
				channelBuffer.set(samples);
			}
			this.bufferSource.buffer = buffer;
			//this.bufferSource.connect(ctx.destination);
			this.bufferSource.connect(this.volume);
		}

        this.bufferSource.onended = function(){
			if (!self.isshifting)
			{
				self.ended_cb && self.ended_cb();
				self.genPLayer();
			}
        };
		if (this.loaded_cb)
		{
			this.loaded_cb();
		}
    },
    getAudioContext: function(){
        if (!this.audioContext) {
            if(window.AudioContext) {
                this.audioContext = new AudioContext();
            } else {
                this.audioContext = new window.webkitAudioContext();
            }
        }
        return this.audioContext;
    },
    play: function(){
		console.log('play');
        if( !this.isPlaying && this.canPlay ){
			this.isshifting=false;
			var ctx = this.getAudioContext();
			this.startTime = ctx.currentTime;
			var playoffset = 0;
			
			var offset = this.pausedAt;
			
			try{
				if (this.bufferSource.buffer > 0)
				{
					playoffset = this.startOffset % this.bufferSource.buffer;
				}
			}
			catch (err) {}
			
            this.bufferSource.start(0, offset);
            this.isPlaying = true;
			
			this.startedAt = ctx.currentTime - offset;
			this.pausedAt = 0;
			
        }
        else{
            this.warn('can not play now');
        }
    },
	playAtOffset: function(offset){
		console.log('playAtOffset:' + offset);
        if( this.canPlay ){
			if( this.isPlaying  ) {
				
				console.log('isplaying: pausing, setting the offset, then scheduling the restart...');
				this.loaded_cb = function(){
					this.loaded_cb = null;
					var self = this;
					setTimeout(function() {
						
						self.play();
					},5);
				}
				this.pause();
				this.pausedAt = offset;			
			}
			else
			{
				this.pausedAt = offset;
			}
			
        }
        else{
            this.warn('can not play now');
        }
    },
    pause: function(){
		console.log('pause');
        if( this.isPlaying && this.canPlay ) {
			this.isshifting = true;
			this.isPlaying = false;
			try{
				this.bufferSource.stop();
			} catch (err) {}
			var ctx = this.getAudioContext();
			this.startOffset = ctx.currentTime - this.startTime;
            this.genPLayer();
			this.isPlaying = false;
			var elapsed = ctx.currentTime - this.startedAt;
			this.pausedAt = elapsed;
        }
        else{
            this.warn('can not pause now');
        }
    },
    toggle: function(){
		console.log('toggle');
        this.isPlaying ? this.pause() : this.play();
    },
    endedWith: function(cb){
        this.ended_cb = cb;
    },
	duration: function() {
		var durationInS = 0;
		durationInS = this.bufferSource.buffer.duration;
		//alert(durationInS);
		return durationInS;
	},
	playerIsPlaying: function(){
		return this.isPlaying;
	},
	getCurrentTime: function() {
        if(this.pausedAt) {
            return this.pausedAt;
        }
        if(this.startedAt) {
			var ctx = this.getAudioContext();
            return ctx.currentTime - this.startedAt;
        }
        return 0;
    },
	setVolume: function(vol){
		this.volumelevel = vol; 
		if (this.volume)
		{
			this.volume.gain.value =  vol;
		}
	},
    warn: function(msg){
        console.warn(msg);
    }
};