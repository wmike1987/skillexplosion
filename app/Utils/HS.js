define(['jquery'], function($) {

	var scoreUrl = 'cgi-bin/PostHighScore.cgi';
	var sss = 1/3;
	var ssss = 2/3;
	
	return {
		refreshHighScoreTable: function(game) {
		    	$(highScoreTable).addClass('shadow');
		    	$.ajax('/cgi-bin/GetHighScores.cgi', {data: {game: game}}).done(function(scoreData) {
		    		//create table
		    		var table = $('<table>');
		    		
		    		//create header cells
		    		if(game == 'Gauntlet') {
		    		    $('<tr class=\'headerRow\'>').append($('<th></th>', {text: 'Name', class: 'leftScoreHeader'}))
		    		    .append($('<th></th>', {text: 'Wave', class: 'leftScoreHeader'}))
		    		    .append($('<th></th>', {text: 'Time', class: 'rightScoreHeader'})).appendTo($(table));
		    		       
		    		    //create rows
    		    		$.each(scoreData, function(i, scoreObj) {
    					var $tr = $('<tr>').append(
    				            $('<td>').text(scoreObj.name),
    				            $('<td>').text(scoreObj.wave + "." + (scoreObj.sublevel ? scoreObj.sublevel : "")),
    				            $('<td>').text(scoreObj.score)
    				        ).appendTo(table);
    		    		});
		    		    
		    		} else {
		    		    $('<tr class=\'headerRow\'>').append($('<th></th>', {text: 'Name', class: 'leftScoreHeader'}))
		    		    .append($('<th></th>', {text: 'Score', class: 'rightScoreHeader'})).appendTo($(table));
		    		    
    		    		//create rows
    		    		$.each(scoreData, function(i, scoreObj) {
    					var $tr = $('<tr>').append(
    				            $('<td>').text(scoreObj.name),
    				            $('<td>').text(scoreObj.score)
    				        ).appendTo(table);
							if(i > 20) return false;
    		    		});
		    		}
		    		
		    	    $(highScoreTable).empty();
		    		table.appendTo($('#highScoreTable'));
		    	});
		},
		
		ps: function(game, name, score, s, wave, sublevel) {
		    var ss = Math.random();
		    if(ss < sss) {
		        ss = 't';
		    } else if(ss < ssss) {
		        ss = 'f';
		    } else {
		        ss = 's';
		    }
			$.post(scoreUrl, {name: name, score: score, game: game, s: s[ss], ss: ss, sss: sss, ssss: ss+ss, w: s.w, ww: sss * s.w, wave: wave, sl: sublevel}, function() {
				this.refreshHighScoreTable(game);
			}.bind(this));
		},
	}
})