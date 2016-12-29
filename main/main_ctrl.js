define(['muplayer/player','muplayer/core/engines/audioCore','app'], function (Player,AudioCore) {
  'use strict';
  return ['$scope','$rootScope','BaiduSongsAPI','LocalStorage', function ($scope,$rootScope,BaiduSongsAPI,LocalStorage) {
      var player=$scope.player= new Player({
        // baseDir是必填初始化参数，指向刚才签出的MuPlayer静态资源目录
        baseDir: 'lib/muplayer/',
        engines: [
          {
            type: AudioCore
          }
        ],
        $audio:document.getElementById('iframe').contentWindow.document.getElementById('audio'),
        absoluteUrl: false,
        fetch: function() {
          var cur, def;
          def = $.Deferred();
          cur = this.getCur();
          var that = this;
          $scope.lrc=null;
          $scope.current = null;
          BaiduSongsAPI.getLrc(cur).then(function(data){
            $scope.lrc = data;
          },function(data){
            console.log(data);
          });
          $scope.file_link = null;
          BaiduSongsAPI.getDownLoadUrl(cur).then(function(data){
            var file_bitrate = 0;
            angular.forEach(data.data.bitrate,function(bitrate){
              if (bitrate.file_bitrate > file_bitrate && bitrate.file_link){
                $scope.file_link = bitrate.file_link;
                file_bitrate = bitrate.file_bitrate;
              }
            });
          },function(data){
            console.log(data)
          });

          BaiduSongsAPI.getSongUrl(cur).then(function(data){
            that.setUrl(data.data.bitrate.file_link);
            $scope.current = data.data.songinfo;
            $rootScope.safeApply();
            return def.resolve();
          },function(data){
            return def.reject();
          });
          return def.promise();
        }
      });

    player.on('playing pause ended next prev', function() {
        $scope.safeApply();
    });

    $scope.setMute = function(){
      $scope.mute = !$scope.mute;
      player.setMute($scope.mute);
    };



    $scope.setMode = function(m){
      var modeList = ['loop','list-random','single'];
      var modeStr  = ['fa-refresh','fa-random','fa-repeat'];
      var mode = player.getMode();
      var nextIndex = (modeList.indexOf(mode)+1) % modeList.length;
      $scope.mode = modeList[nextIndex];
      $scope.modeStr = modeStr[nextIndex];
      player.setMode($scope.mode);
    };

    $scope.mode = 'loop';
    $scope.modeStr = 'fa-refresh';


    $rootScope.safeApply = function(fn) {
      var phase = $rootScope.$$phase;
      if (phase == '$apply' || phase == '$digest') {
        if (fn && (typeof(fn) === 'function')) {
          fn();
        }
      } else {
        $rootScope.$apply(fn);
      }
    };

    $scope.loadNewSongs = function(type, page){
      BaiduSongsAPI.getNetworkSongs(type, page).then(function(data){
        $scope.song_type = type;
        $scope.song_list = data.data.song_list;
        player.reset();
        if ($scope.song_list.length){
          $scope.play($scope.song_list[0].song_id);
        }
        angular.forEach($scope.song_list,function(song,key){
          player.add(song.song_id,false);
        });
      },function(data){
        console.log(data);
      });
    };

    $scope.song_type = 20;

    $scope.collection = LocalStorage.get('music_collection') || {};

    $scope.song_list = [];

    $scope.loadCollection = function(){
      $scope.song_list = [];
      player.reset();
      angular.forEach($scope.collection,function(song){
        $scope.song_list.push(song);
        player.add(song.song_id,false);
      });
      if ($scope.song_list.length)
        $scope.play($scope.song_list[0].song_id);
      $scope.song_type = -1;
    };


    $scope.play = function(song_id){
        player.setCur(song_id);
        player.play()
    };

    $scope.remove = function($index,song_id){
      if (player.getCur() === song_id){
        player.next();
      }
      player.remove(song_id);
      $scope.song_list.splice($index,1);
    };

    $scope.collect = function(song){
      if ($scope.collection[song.song_id]){
        delete $scope.collection[song.song_id];

      }else{
        $scope.collection[song.song_id] = song;
      }
      LocalStorage.set('music_collection',$scope.collection);
    };

    $scope.hasCollect = function(song){
      return !!$scope.collection[song.song_id]
    };

    $scope.search = function(keyword){
      return BaiduSongsAPI.queryKeyword(keyword).then(function(data){
        $scope.song_list = [];
        player.reset();
        angular.forEach(data.data.song,function(song){
          $scope.song_list.push({
            song_id:song.songid,
            title:song.songname,
            artist_name:song.artistname
          });
          player.add(song.songid,false);
        });
        if ($scope.song_list.length){
          $scope.play($scope.song_list[0].song_id);
        }
        $scope.song_type = -2;
      },function(data){
        console.log(data);
      })
    };

    $scope.queryArtistSongs = function(song_id){
      BaiduSongsAPI.getSongUrl(song_id).then(function(data){
        var info = data.data.songinfo;
        return BaiduSongsAPI.queryArtistSongs(info.all_artist_ting_uid || info.ting_uid).then(function(data){
          try{
            $scope.song_type = -3;
            $scope.song_list = data.data.songlist;
            player.reset();
            if ($scope.song_list.length){
              $scope.play($scope.song_list[0].song_id);
            }
            angular.forEach($scope.song_list,function(song,key){
              player.add(song.song_id,false);
            });
          }catch(e){
            console.log(e);
          }
        },function(data){
          console.log(data);
        });
      },function(data){
        console.log(data);
      });

    };


  }];
});

