/**
 * SRT LYRIC PLAYER
 * based on jQuery v1.5.2 & jQuery UI 1.8.11
 * @name slp.js
 * @author XingxingWoo
 * @version v1.0
 * @date last modified on 2011-4-18
 * @comment
 * Released with the MIT License: http://www.opensource.org/licenses/mit-license.php
 */
var loadSrtLyric = function(){
	var SrtLyric = function($){
		if ($.browser.msie) {
			alert('Sorry! But this script is not for IE!!');
			return false;
		}
		if (!$('#srtDiv').length) {
			$(document.body).append('<div id="srtDiv"></div>');
		}
		if (!$('#srtContent').length) {
			$('#srtDiv').append('<div id="srtContent" title="[Lyric Content Screen], \nhover to toggle {Lyric Dashboard}, dblclick to {Play} or {Pause}, drag to move position, scroll to change opacity, shift & scroll to change font size."> </div>');
		}
		if (!$('#srtDashboard').length) {
			$('#srtDiv').append('<div id="srtDashboard" title="[Lyric Dashboard]"></div>');
			$('#srtDashboard').html('<a id="srtPlay" href="javascript:;" title="Click to [Play] or [Pause]">Play</a> <a id="srtStop" href="javascript:;" title="Click to [Stop]">Stop</a> <a id="srtBackward" href="javascript:;" title="Click to [Backward] 1sec">Backward</a> <a id="srtForward" href="javascript:;" title="Click to [Forward] 1sec">Forward</a> <input id="srtNowTS" type="text" maxlength="12" title="[Lyric Timeline], \nchange to jump to any time" /> <a id="srtViewer" href="javascript:;" title="[Lyric Viewer], \nclick to toggle {Lyric Input Area}">SRT!</a>').hide();
		}
		if (!$('#srtText').length) {
			$('#srtDiv').append($('<textarea id="srtText" title="[Lyric Input Area], \nchange to load new Lyric via SRT source"></textarea>').hide());
		}
		this._debug = function(){
			window.SrtLyric && window.console && console.info.apply(console, arguments);
		};
		//
		this.lyric = {};
		this.lyricArr = [];
		this.timerSrtLyric = null;
		this.isPlaying = false;
		this.pointer = null;
		this.startTS = new Date();
		this.nowTS = new Date();
		this.updateCurTimeStamp = function(isNow){
			if (isNow) {
				o.nowTS = new Date();
			}
			var timeRun = this.nowTS.getTime() - this.startTS.getTime();
			return timeRun;
		};
		this.updateCurTime = function(timeRun){
			timeRun = timeRun || this.updateCurTimeStamp();
			var curTime = '';
			var dt = new Date(timeRun);
			curTime += '000'.concat(dt.getUTCHours()).substr(-2, 2) + ':';
			curTime += '000'.concat(dt.getUTCMinutes()).substr(-2, 2) + ':';
			curTime += '000'.concat(dt.getUTCSeconds()).substr(-2, 2) + ',';
			curTime += '000'.concat(dt.getUTCMilliseconds()).substr(-3, 3);
			$('#srtNowTS').val(curTime);
			return curTime;
		};
		//
		var o = this;
		//
		this.buildLyric = function(){
			var objSrt = {};
			var oriData = $('#srtText').val().replace(/^\s+|\s+$/gm, '\n').replace(/\n?$/, '\n');
			$('#srtText').val(oriData);
			o.lyricArr = oriData.match(/\d+\n\d{2}:\d{2}:\d{2},\d{3} \-\-> \d{2}:\d{2}:\d{2},\d{3}\n(.+\n)+/gm) || [];
			$.each(o.lyricArr, function(i, n){
				//objSrt[i] = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) \-\-> (\d{2}:\d{2}:\d{2},\d{3})\n((?:.+\n)+)/.exec(n)||[];
				var res = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) \-\-> (\d{2}:\d{2}:\d{2},\d{3})\n((?:.+\n)+)/.exec(n) || [];
				objSrt[i] = {
					'_id': res[1],
					'_begin': res[2],
					'_end': res[3],
					'_lyric': res[4]
				};
			});
			o._debug('SRT: %o', objSrt);
			o.lyric = objSrt;
		};
		this.srtFn = function(){
			var nowLyric = '';
			var tDiffer = o.updateCurTimeStamp(true);
			$.each(o.lyric, function(i, n){
				if (o.pointer && o.pointer > i) {
					o._debug('Jump from pointer at begin! p: %i', o.pointer);
					return true;
				}
				var _begin = n['_begin'].split(/[:,]/).map(function(m){
					return parseInt(m, 10);
				});
				var _end = n['_end'].split(/[:,]/).map(function(m){
					return parseInt(m, 10);
				});
				var beginTS = new Date(0);
				var endTS = new Date(0);
				beginTS.setUTCHours.apply(beginTS, _begin);
				endTS.setUTCHours.apply(endTS, _end);
				var btDiffer = beginTS.getTime();
				var etDiffer = endTS.getTime();
				//btDiffer = _begin[0] * 3600000 + _begin[1] * 60000 + _begin[2] * 1000 + _begin[3];
				//etDiffer = _end[0] * 3600000 + _end[1] * 60000 + _end[2] * 1000 + _end[3];
				if (btDiffer < tDiffer && tDiffer < etDiffer) {
					nowLyric = n['_lyric'].replace(/\n+/gm, '<br />');
					o.pointer = 1 * i;
					o._debug('i: ' + i + ', p: %i, time: %i, begin: %i, end: %i', o.pointer, tDiffer, btDiffer, etDiffer);
					return false;
				}
				if (tDiffer < btDiffer) {
					o.pointer = 0;
					o._debug('Nothing matched at end! p: %i', o.pointer);
					return false;
				}
			});
			o.updateCurTime();
			$('#srtContent').html(nowLyric);
			if (o.pointer === null || (o.pointer === o.lyricArr.length - 1 && !nowLyric)) {
				o.srtStop();
				o._debug('All played and finished.');
			}
		};
		this.srtPlay = function(){
			if (o.isPlaying) {
				clearInterval(o.timerSrtLyric);
				o.isPlaying = false;
				$('#srtPlay').html('Play');
			}
			else {
				var sNowTS = new Date();
				o.startTS.setTime(o.startTS.getTime() + sNowTS.getTime() - o.nowTS.getTime());
				o.timerSrtLyric = setInterval(o.srtFn, 100);
				o.isPlaying = true;
				$('#srtPlay').html('Pause');
			}
		};
		this.srtStop = function(){
			clearInterval(o.timerSrtLyric);
			o.startTS = new Date();
			o.nowTS = new Date();
			o.updateCurTime();
			o.pointer = null;
			o.isPlaying = false;
			$('#srtPlay').html('Play');
		};
		this.srtBackward = function(){
			var newTimeRun = o.startTS.getTime() + 1000;
			if (o.nowTS.getTime() > newTimeRun) {
				o.startTS.setTime(newTimeRun);
				o.updateCurTime();
				o._debug('Go backward time 1s.');
			}
		};
		this.srtForward = function(){
			var newTimeRun = o.startTS.getTime() - 1000;
			o.startTS.setTime(newTimeRun);
			o.updateCurTime();
			o._debug('Go forward time 1s.');
		};
		this.srtJump = function(){
			var newTS = new Date(0);
			newTS.setUTCHours.apply(newTS, $('#srtNowTS').val().split(/[:,]/).map(function(m){
				return parseInt(m, 10);
			}));
			var newTimeRun = newTS.getTime();
			o.startTS.setTime(o.nowTS.getTime() - newTimeRun);
			o._debug('Jump to time at %i.', newTimeRun);
		};
		this.srtReload = function(){
			o.buildLyric();
			o.srtStop();
			o._debug('Load succeed! total %i lines.', o.lyricArr.length);
		};
		this.srtHideText = function(){
			$('#srtText').hide();
		};
		this.srtShowText = function(){
			$('#srtText').toggle();
		};
		this.srtShowPanel = function(){
			$('#srtDashboard').fadeIn();
		};
		this.srtHidePanel = function(){
			$('#srtDashboard').fadeOut();
		};
		this.srtScrollObserver = function(event){
			var direct = (event.detail && -event.detail || event.wheelDelta) > 0 ? 1 : -1;
			if (!event.altKey && !event.ctrlKey && event.shiftKey) {
				o._srtScrollZoom(direct);
			}
			if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
				o._srtScrollOpacity(direct);
			}
			event.stopPropagation();
			event.preventDefault();
			return false;
		};
		this._srtScrollZoom = function(offset){
			var size = parseInt($('#srtContent').css('font-size')) + offset;
			if (size >= 12 && size <= 72) {
				o._debug('Font size is %ipx.', size);
				$('#srtContent').css('font-size', size + 'px');
			}
		};
		this._srtScrollOpacity = function(offset){
			var opa = ((parseFloat($('#srtContent').css('opacity')).toFixed(2) * 100 + offset) / 100).toFixed(2);
			if (opa >= 0 && opa <= 1) {
				o._debug('Opacity is %s.', opa);
				$('#srtContent').css('opacity', opa);
			}
		};
		//
		this.buildLyric();
		$('#srtContent').unbind('dblclick').dblclick(this.srtPlay).bind('DOMMouseScroll', this.srtScrollObserver).bind('mousewheel', this.srtScrollObserver);
		$('#srtPlay').unbind('click').click(this.srtPlay);
		$('#srtStop').unbind('click').click(this.srtStop);
		$('#srtBackward').unbind('click').click(this.srtBackward);
		$('#srtForward').unbind('click').click(this.srtForward);
		$('#srtNowTS').unbind('change').change(this.srtJump);
		$('#srtViewer').unbind('click').click(this.srtShowText);
		$('#srtText').unbind('change').change(this.srtReload).unbind('blur').blur(this.srtHideText);
		$('#srtDiv').hover(this.srtShowPanel, this.srtHidePanel).draggable({});
		this.srtStop();
		//get Theatre Mode
		var flashPlayer = $('embed[flashvars]');
		if(flashPlayer.length){
			flashPlayer.closest('div').parents(':not(body,html)').css({top:0,left:0,margin:0,padding:0,border:0,background:0}).siblings(':not("#srtDiv"):visible').hide();
		}
		//
		return this;
	};
	var srtLyric = new SrtLyric(window.jQuery);
};
(function(){
	var dlTmr = null;
	var dlMax = 1200;
	var dlCbk = function($){
		if (!$) {
			return false;
		}
		clearInterval(dlTmr);
		// callback of loadSrtLyric
		$.getScript('http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js', loadSrtLyric);
	};
	var dlTmrCbk = function(){
			dlCbk(window.jQuery);
	};
	var dlJS = function(d, l, c){
		var j = d.createElement('script');
		j.src = l || 'http://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js';
		j.id = 'dlJS' + new Date().getTime();
		j.charset = 'utf-8';
		j.onload = c || dlTmrCbk;
		d.getElementsByTagName('head')[0].appendChild(j);
	};
	dlJS(document);
	dlTmr = setInterval(function(){
		dlTmrCbk();
		dlMax -= 50;
		if (dlMax < 0) {
			clearInterval(dlTmr)
		}
	}, 50);
})();
