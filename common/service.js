define(['angularAMD'], function (angularAMD) {
  'use strict';
  angularAMD.factory('AudioContextFactory', [ function () {
    return function(){
      function Visualizer() {
        var that = this;
        this.file = null; //the current file
        this.fileName = null; //the current file name
        this.audioContext = null;
        this.source = null; //the audio source
        this.info = document.getElementById('info').innerHTML; //this used to upgrade the UI information
        this.infoUpdateId = null; //to sotore the setTimeout ID and clear the interval
        this.animationId = null;
        this.status = 0; //flag for sound is playing 1 or stopped 0
        this.forceStop = false;
        this.allCapsReachBottom = false;

        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
        try {
          this.audioContext = new AudioContext();
        } catch (e) {
          this._updateInfo('!Your browser does not support AudioContext', false);
          console.log(e);
        }
        var audioInput = document.getElementById('uploadedFile'),
          dropContainer = document.getElementsByTagName("canvas")[0];
        //listen the file upload
        audioInput.onchange = function() {
          if (that.audioContext===null) {return;};

          //the if statement fixes the file selction cancle, because the onchange will trigger even the file selection been canceled
          if (audioInput.files.length !== 0) {
            //only process the first file
            that.file = audioInput.files[0];
            that.fileName = that.file.name;
            if (that.status === 1) {
              //the sound is still playing but we upload another file, so set the forceStop flag to true
              that.forceStop = true;
            };
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Uploading', true);
            //once the file is ready,start the visualizer
            that._start();
          };
        };
        //listen the drag & drop
        dropContainer.addEventListener("dragenter", function() {
          document.getElementById('fileWrapper').style.opacity = 1;
          that._updateInfo('Drop it on the page', true);
        }, false);
        dropContainer.addEventListener("dragover", function(e) {
          e.stopPropagation();
          e.preventDefault();
          //set the drop mode
          e.dataTransfer.dropEffect = 'copy';
        }, false);
        dropContainer.addEventListener("dragleave", function() {
          document.getElementById('fileWrapper').style.opacity = 0.2;
          that._updateInfo(that.info, false);
        }, false);
        dropContainer.addEventListener("drop", function(e) {
          e.stopPropagation();
          e.preventDefault();
          if (that.audioContext===null) {return;};
          document.getElementById('fileWrapper').style.opacity = 1;
          that._updateInfo('Uploading', true);
          //get the dropped file
          that.file = e.dataTransfer.files[0];
          if (that.status === 1) {
            document.getElementById('fileWrapper').style.opacity = 1;
            that.forceStop = true;
          };
          that.fileName = that.file.name;
          //once the file is ready,start the visualizer
          that._start();
        }, false);
      };
      Visualizer.prototype = {
        _start: function() {
          //read and decode the file into audio array buffer
          var that = this,
            file = this.file,
            fr = new FileReader();
          fr.onload = function(e) {
            var fileResult = e.target.result;
            var audioContext = that.audioContext;
            if (audioContext === null) {
              return;
            };
            that._updateInfo('Decoding the audio', true);
            audioContext.decodeAudioData(fileResult, function(buffer) {
              that._updateInfo('Decode succussfully,start the visualizer', true);
              that._visualize(audioContext, buffer);
            }, function(e) {
              that._updateInfo('!Fail to decode the file', false);
              console.log(e);
            });
          };
          fr.onerror = function(e) {
            that._updateInfo('!Fail to read the file', false);
            console.log(e);
          };
          //assign the file to the reader
          this._updateInfo('Starting read the file', true);
          fr.readAsArrayBuffer(file);
        },
        _visualize: function(audioContext, buffer) {
          var audioBufferSouceNode = audioContext.createBufferSource(),
            analyser = audioContext.createAnalyser(),
            that = this;
          //connect the source to the analyser
          audioBufferSouceNode.connect(analyser);
          //connect the analyser to the destination(the speaker), or we won't hear the sound
          analyser.connect(audioContext.destination);
          //then assign the buffer to the buffer source node
          audioBufferSouceNode.buffer = buffer;
          //play the source
          if (!audioBufferSouceNode.start) {
            audioBufferSouceNode.start = audioBufferSouceNode.noteOn //in old browsers use noteOn method
            audioBufferSouceNode.stop = audioBufferSouceNode.noteOff //in old browsers use noteOff method
          };
          //stop the previous sound if any
          if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
          }
          if (this.source !== null) {
            this.source.stop(0);
          }
          audioBufferSouceNode.start(0);
          this.status = 1;
          this.source = audioBufferSouceNode;
          audioBufferSouceNode.onended = function() {
            that._audioEnd(that);
          };
          this._updateInfo('Playing ' + this.fileName, false);
          this.info = 'Playing ' + this.fileName;
          document.getElementById('fileWrapper').style.opacity = 0.2;
          this._drawSpectrum(analyser);
        },
        _drawSpectrum: function(analyser) {
          var that = this,
            canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            meterWidth = 10, //width of the meters in the spectrum
            gap = 2, //gap between meters
            capHeight = 2,
            capStyle = '#fff',
            meterNum = 800 / (10 + 2), //count of the meters
            capYPositionArray = [], ////store the vertical position of hte caps for the preivous frame
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(1, '#0f0');
          gradient.addColorStop(0.5, '#ff0');
          gradient.addColorStop(0, '#f00');
          var drawMeter = function() {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            if (that.status === 0) {
              //fix when some sounds end the value still not back to zero
              for (var i = array.length - 1; i >= 0; i--) {
                array[i] = 0;
              };
              var allCapsReachBottom = true;
              for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
              };
              if (allCapsReachBottom) {
                cancelAnimationFrame(that.animationId); //since the sound is stoped and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
                return;
              };
            };
            var step = Math.round(array.length / meterNum); //sample limited data from the total array
            ctx.clearRect(0, 0, cwidth, cheight);
            for (var i = 0; i < meterNum; i++) {
              var value = array[i * step];
              if (capYPositionArray.length < Math.round(meterNum)) {
                capYPositionArray.push(value);
              };
              ctx.fillStyle = capStyle;
              //draw the cap, with transition effect
              if (value < capYPositionArray[i]) {
                ctx.fillRect(i * 12, cheight - (--capYPositionArray[i]), meterWidth, capHeight);
              } else {
                ctx.fillRect(i * 12, cheight - value, meterWidth, capHeight);
                capYPositionArray[i] = value;
              };
              ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
              ctx.fillRect(i * 12 /*meterWidth+gap*/ , cheight - value + capHeight, meterWidth, cheight); //the meter
            }
            that.animationId = requestAnimationFrame(drawMeter);
          }
          this.animationId = requestAnimationFrame(drawMeter);
        },
        _audioEnd: function(instance) {
          if (this.forceStop) {
            this.forceStop = false;
            this.status = 1;
            return;
          };
          this.status = 0;
          var text = 'HTML5 Audio API showcase | An Audio Viusalizer';
          document.getElementById('fileWrapper').style.opacity = 1;
          document.getElementById('info').innerHTML = text;
          instance.info = text;
          document.getElementById('uploadedFile').value = '';
        },
        _updateInfo: function(text, processing) {
          var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
          infoBar.innerHTML = text + dots.substring(0, i++);
          if (this.infoUpdateId !== null) {
            clearTimeout(this.infoUpdateId);
          };
          if (processing) {
            //animate dots at the end of the info text
            var animateDot = function() {
              if (i > 3) {
                i = 0
              };
              infoBar.innerHTML = text + dots.substring(0, i++);
              that.infoUpdateId = setTimeout(animateDot, 250);
            }
            this.infoUpdateId = setTimeout(animateDot, 250);
          };
        }
      }
      return new Visualizer();
    }
  }]);

  angularAMD.service('RestAPI',['$http',
    function($http){
      var self = this;
      this.call = function(httpMethod,url,params,data){
        return $http({
          method: httpMethod,
          url: encodeURI(url),
          params:params,
          data: data
        });
      };
      this.httpMethod = {
        GET:'GET',
        PUT:'PUT',
        DELETE:'DELETE',
        POST:'POST',
        PATCH:'PATCH',
        JSONP:'JSONP'
      };
      this.jsonp = function(url,params){
        (params = params || {}).callback='JSON_CALLBACK';
        return self.call(self.httpMethod.JSONP,url,params);
      };
      this.get = function(url,params,data){
        return self.call(self.httpMethod.GET,url,params,data);
      };
      this.put = function(url,params,data){
        return self.call(self.httpMethod.PUT,url,params,data);
      };
      this.del = function(url,params,data){
        return self.call(self.httpMethod.DELETE,url,params,data);
      };
      this.post = function(url,params,data){
        return self.call(self.httpMethod.POST,url,params,data);
      };
      this.patch = function(url,params,data){
        return self.call(self.httpMethod.PATCH,url,params,data);
      };
    }]);
  angularAMD.service('BaiduSongsAPI',['RestAPI',function(RestAPI){
    var _api_url = '//tingapi.ting.baidu.com/v1/restserver/ting';
    var _param = {
      from:'qianqian',
      version:'2.1.0',
      method:'baidu.ting.billboard.billList',
      format:'json',
      offset:0,
      size:50
    };
//叱咤歌曲榜 7 美国Billboard单曲榜 8 雪碧音碰音榜 9 雪碧音碰音赛歌榜 10 摇滚榜 11 English 12 unknown 13 影视金曲榜 14
// unknown chinese 15 classic? 16 unknown 17 Hito中文榜 18 unknown english
// 实时展现
// 19 华语金曲榜 20 欧美金曲榜 21 经典老歌榜 22 情歌对唱榜 23 影视金曲榜 24 网络歌曲榜 25 中国好声音榜 31
    this.getNetworkSongs = function(type,page_obj){
      return RestAPI.jsonp(_api_url, $.extend({},_param,{type:type || 20},page_obj))
    };

    this.queryKeyword = function(keyword){
      return RestAPI.jsonp(_api_url,{
        from:'webapp_music',
        method:'baidu.ting.search.catalogSug',
        format:'json',
        query:keyword
      })
    };

    this.queryArtistSongs = function(tinguid,limits){
      return RestAPI.jsonp(_api_url,{
        from:'webapp_music',
        method:'baidu.ting.artist.getSongList',
        format:'json',
        tinguid:tinguid,
        limits:limits || 50,
        use_cluster:1,
        order:2
      })
    };

    this.getSongUrl = function(songid){
      return RestAPI.jsonp(_api_url,{
        from:'qianqian',
        format:'json',
        method:'baidu.ting.song.play',
        songid:songid
      })
    };
    function parseLyric(lrc) {
      if (!lrc) return {};
      var lyrics = lrc.split("\n");
      var lrcObj = {};
      for(var i=0;i<lyrics.length;i++){
        var lyric = decodeURIComponent(lyrics[i]);
        var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
        var timeRegExpArr = lyric.match(timeReg);
        if(!timeRegExpArr)continue;
        var clause = lyric.replace(timeReg,'');

        for(var k = 0,h = timeRegExpArr.length;k < h;k++) {
          var t = timeRegExpArr[k];
          var min = Number(String(t.match(/\[\d*/i)).slice(1)),
            sec = Number(String(t.match(/\:\d*/i)).slice(1));
          var time = min * 60 + sec;
          lrcObj[time] = clause;
        }
      }
      return lrcObj;
    }
    this.getLrc = function(songid){
      return RestAPI.jsonp(_api_url,{
        from:'webapp_music',
        format:'json',
        method:'baidu.ting.song.lry',
        songid:songid
      }).then(function(data){
        return parseLyric(data.data.lrcContent);
      });
    };

    this.getDownLoadUrl = function(song_id,bit){
      return RestAPI.jsonp(_api_url,{
        from:'webapp_music',
        format:'json',
        method:'baidu.ting.song.downWeb',
        songid:song_id,
        bit:bit || 320 //bit:"24, 64, 128, 192, 256, 320, flac"
      })
    }

  }]);

  angularAMD.service('LocalStorage', ['$window', function ($window) {
    var localStorage = $window.localStorage;
    this.set = function (name, value) {
      localStorage.setItem(name, angular.toJson(value));
    };
    this.get = function (name) {
      return angular.fromJson(localStorage.getItem(name));
    };
    this.clearAll = function () {
      localStorage.clear();
    };
  }]);
});
