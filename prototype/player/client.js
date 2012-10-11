<html>
	<head>
		<title>testing player</title>
		<script src="../lib/jquery.js" type="text/javascript"></script>
		<script src="http://www.google.com/jsapi" type="text/javascript"></script>
		<script type="text/javascript">
			google.load("swfobject", "2.1");
		</script>
		<script type="text/javascript">
			
			function onYouTubePlayerReady(player_id) {
				window.player = document.getElementById('player_embed');
				setInterval(player_updated, 1000);
				player_updated();
				player.addEventListener('onStateChange', 'player_state');
				player.addEventListener('onError', 'player_error');
				player.cueVideoById('2EBf8nyRpQU');
				player.playVideo();
				player.pauseVideo();
			};
			
			function player_updated() {
				if (!window.player) return;
				console.log('player updated: ' + player.getCurrentTime());
			}
			function player_state(state) {
				console.log('player state changed: ' + state);
			}
			function player_error(error) {
				console.log('player error: ' + error);
			}
			
			function player_load() {
				var embed_params = {
					player_url: 'http://www.youtube.com/apiplayer?version=3&enablejsapi=1&playerapiid=player1',
					parent_id: 'player',
					element_id: 'player_embed',
					dimensions: { width: 640, height: 360}
				}
				
				swfobject.embedSWF(
					embed_params.player_url,
					embed_params.parent_id,
					String(embed_params.dimensions.width),
					String(embed_params.dimensions.height),
					'9', null, null,
					{allowScriptAccess: "always"},
					{id: embed_params.element_id}
				);
			}
			player_load();
		</script>
	</head>
	<body>
		<div id="player"></div>
		<div id="pause">pause</div>
		<div id="play">play</div>
	</body>
</html>
​