define(['jquery'], function($) {

	var scoreUrl = 'cgi-bin/PostHighScore.cgi';
	
	return {
		refreshHighScoreTable: function(game) {
		    	$(highScoreTable).addClass('shadow');
		    	$.ajax('/cgi-bin/GetHighScores.cgi', {data: {game: game}}).done(function(scoreData) {
		    		//create table
		    		var table = $('<table>');
		    		
		    		//create header cells
		    		$('<tr class=\'headerRow\'>').append($('<th></th>', {text: 'Name', class: 'leftScoreHeader'})).append($('<th></th>', {text: 'Score', class: 'rightScoreHeader'})).appendTo($(table));
		    		
		    		//create rows
		    		$.each(scoreData, function(i, scoreObj) {
					var $tr = $('<tr>').append(
				            $('<td>').text(scoreObj.name),
				            $('<td>').text(scoreObj.score)
				        ).appendTo(table);
		    		});
		    		
		    	    $(highScoreTable).empty();
		    		table.appendTo($('#highScoreTable'));
		    	});
		},
		
		ps: function(game, name, score, s) {
			$.post(scoreUrl, {name: name, score: score, game: game, s: s}, function() {
				this.refreshHighScoreTable(game);
			}.bind(this));
		},
		
		postScore: function(game, name, score) {
			$.post(scoreUrl, {name: name, score: score, game: game, s: s}, function() {
				this.refreshHighScoreTable(game);
			}.bind(this));
		}
	}
})