define(['angularAMD','nanoscroller'], function (angularAMD) {
  'use strict';
  angularAMD.directive('xlProgressBar', [
    function() {
      return {
        restrict:'EA',
        scope:{
          player:'='
        },
        template:'<div class="sm-progress"><div class="sm-progress-bar sm-progress-load"></div><div class="sm-progress-bar sm-progress-play"></div>',
        link: function(scope, ele) {
          var $loadProgress = ele.find('.sm-progress-load').eq(0);
          var $progressPlay = ele.find('.sm-progress-play').eq(0);
          var player = scope.player;

          player.on('timeupdate', function() {
            //var time = (player.curPos(true) + ' / ' + player.duration(true));
            var duration = player.duration();
            var progress = (duration ? player.curPos() / duration * 100 : 0)+'%';
            $progressPlay.width(progress);
          });

          player.on('progress', function(loadProgress) {
            // progress为0 - 1以内的浮点数，表示当前音频资源的缓冲进度。
            $loadProgress.width(loadProgress * 100 + '%');
          });

          ele.bind('click', function(e) {
            var rect = ele[0].getBoundingClientRect(); //进度条rect
            var percent = e.offsetX / rect.width;//百分比
            percent = percent > 1 ? 1 : percent;
            player.play(player.duration()*percent*1000);
          });
        }
      }
    }
  ]);

  angularAMD.directive('xlTimer', [
    function() {
      return {
        restrict:'EA',
        scope:{
          player:'='
        },
        link: function(scope, ele) {
          var player = scope.player;
          ele.text('00:00 / 00:00');
          player.on('timeupdate', function() {
            ele.text(player.curPos(true) + ' / ' + player.duration(true));
          });
        }
      }
    }
  ]);

  angularAMD.directive('xlVolumeBar', [
    function() {
      return {
        restrict:'EA',
        scope:{
          player:'='
        },
        template:'<div class="sm-progress"><div class="sm-progress-bar sm-progress-play"></div></div>',
        link: function(scope, ele) {
          var player = scope.player;
          var $volume = ele.find('.sm-progress-bar').eq(0);
          $volume.width(player.getVolume() + '%');
          ele.bind('click', function(e) {
            var rect = ele[0].getBoundingClientRect(); //进度条rect
            var percent = e.offsetX / rect.width;//百分比
            percent = percent > 1 ? 1 : percent;
            player.setVolume(percent*100);
            $volume.width(player.getVolume() + '%');
          });
        }
      }
    }
  ]);

  angularAMD.directive('xlLrcHighlight', [
    function() {
      return {
        restrict:'EA',
        scope:{
          player:'=',
          lrc:'='
        },
        template:'<ul><li id ="lrc-time-{{key}}" ng-click="player.play(key*1000)" class="ui-lrc-sentence sm-clickable" ng-repeat="(key, value) in lrc">{{value}}</li></ul>',
        link: function(scope, ele) {
          var player = scope.player;
          var $ul = ele.find('ul').eq(0);
          player.on('timeupdate', function() {
            if (scope.lrc){
              var duration = parseInt(player.curPos());
              if (scope.lrc[duration]){
                $('.ui-lrc-sentence.active').removeClass('active');
                $('#lrc-time-'+duration).addClass('active');
                var offsetTop = $('#lrc-time-'+duration)[0].offsetTop;
                if (offsetTop > 160){
                  $ul.animate({'top':160-offsetTop});
                }else{
                  $ul.css('top',0);
                }
              }
            }
          });
        }
      }
    }
  ]);



  angularAMD.directive('paddingRight',[function(){
    return {
      restrict:'A',
      link:function(scope,element,attrs){
        var div = $('<div />',{style:'padding-right:'+(attrs.paddingRight?attrs.paddingRight:'7px')});
        element.wrap(div);
      }
    }
  }]);

  angularAMD.directive('nano',[function(){
    return {
      restrict: 'C',
      link: function (scope, element, attrs) {
        var content = element.find('.nano-content').eq(0).children();
        var content_height;
        content.on('mouseenter',function(){
          if (content.height() == content_height){
            return;
          }
          element.nanoScroller();
          content_height = content.height();
        })
      }
    }
  }]);

  angularAMD.directive('smSearch',[function(){
    return {
      restrict:'C',
      scope:{
        trigger:'&'
      },
      link:function(scope,ele){
        ele.on("keydown",function(e){
          var theEvent = e || window.event;
          var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
          if (code == 13) {
            scope.trigger();
          }
        });
      }
    }
  }])


});
