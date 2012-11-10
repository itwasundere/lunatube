var serverside=!1;"undefined"!=typeof require&&(serverside=!0);if(serverside){var db=require("./database.js"),now=require("./sutils").now,Backbone=require("backbone"),crypto=require("crypto"),names=require("./names.js");Backbone.sync=function(a,c,b){switch(a){case "create":db.create(c,b);break;case "read":c.attributes?db.read(c,b):db.read_all(c,b);break;case "update":db.update(c,b);break;case "delete":db.ddelete(c,b)}}}var models={};
models.Video=Backbone.Model.extend({db_fields:["queue_id","prev","next","url","time"],defaults:{queue_id:0,prev:0,next:0,url:"00000000000",time:0,thumb:"static/img/novid.png",title:"Loading video...",uploader:"",time_text:"",watched:!1},initialize:function(){this.classname="video";if(serverside&&!this.id&&this.get("hash")){var a=crypto.createHash("md5");a.update(""+Math.random());this.set("id",a.digest("hex"))}!serverside&&this.verify()&&this.fetch_yt()},fetch_yt:function(){var a="http://gdata.youtube.com/feeds/api/videos/"+
this.get("url")+"?v=2&alt=json&key=AI39si5Us3iYwmRdK0wa2Qf2P9eV-Z8tbjogUWw1B4JQUs191PgYNJChEKEooOq6ykQzhywLEBA9WxuKphpWUoCRA7S7jeLi5w",c=this;$.get(a,function(a){a.entry||(a=JSON.parse(a));var d=parseInt(a.entry.media$group.yt$duration.seconds),f=Math.floor(d/60),e=d%60+"";2!=e.length&&(e="0"+e);c.set({title:a.entry.title.$t,uploader:a.entry.author[0].name.$t,time:d,thumb:a.entry.media$group.media$thumbnail[0].url,time_text:f+":"+e});c.get("ready")&&c.get("ready")()})},verify:function(){var a=this.get("url");
return"string"!=typeof a||11!=a.length||"00000000000"==a?!1:!0}});
models.VideoList=Backbone.Collection.extend({model:models.Video,initialize:function(){this.classname="video"},get_first:function(){var a=new models.Video({url:"Bq6WULV78Cw"});return this.at(0)||a},after:function(a){a=this.get(a.id);return!a?this.at(0):(a=a.get("next"))?this.get(a)||this.get_first():this.at(0)||this.get_first()},append:function(a){var c=this,a={url:a.url,time:a.time};if(this.id)if(0==this.length){a.queue_id=this.id;var b=new models.Video(a);b.save({},{success:function(){c.add(b)}})}else{var d=
this.last();d.id&&(a.prev=d.id);a.queue_id=this.id;b=new models.Video(a);b.save({},{success:function(){d.save({next:b.id},{success:function(){c.add(b)}})}})}else a.hash=!0,b=new models.Video(a),b.verify()&&this.add(b)},insert:function(a,c){video=new models.Video({hash:!0,url:a.url,time:a.time});if(video.verify()){var b;c&&(b=c.id);b=this.indexOf(this.get(b));this.add(video,{at:b+1})}},kill:function(a){var c=this.get(a.get("prev")),b=this.get(a.get("next"));c&&c.set("next",a.get("next"));b&&b.set("prev",
a.get("prev"));c&&c.save();b&&b.save();a.destroy();this.remove(a)}});
models.Player=Backbone.Model.extend({defaults:{state:"paused",current:new models.Video,prev:new models.Video,time:0},play:function(){this.set("state","playing");this.trigger("action")},pause:function(){this.set("state","paused");this.trigger("action")},initialize:function(){this.start_ticker();this.get("current")},start_ticker:function(){var a=this;setInterval(function(){a.tick()},1E3)},tick:function(){if(this.get("current")){var a=this.get("time");"playing"==this.get("state")&&(a+=1);a<=this.get("current").get("time")?
this.set({time:a},{silent:!0}):this.trigger("end")}},set_vid:function(a){a&&(a.set({watched:!0}),this.set({time:0,current:a,state:"playing"}))},seek:function(a){var c=this.get("current").get("time");a<c?this.set("time",a):this.set("time",c);this.trigger("action")},time:function(){var a=this.get("time"),c=""+Math.floor(a/60),a=""+a%60;2>a.length&&(a="0"+a);return c+":"+a}});
models.Message=Backbone.Model.extend({defaults:{author:0,content:"",time:0,rendered:!1},initialize:function(){if(!this.id){var a=crypto.createHash("md5");a.update(""+Math.random());this.set("id",a.digest("hex"))}this.get("time")||this.set("time",(new Date).getTime())}});models.MessageList=Backbone.Collection.extend({model:models.Message});
models.User=Backbone.Model.extend({defaults:{username:"",avatar_url:""},initialize:function(){this.classname="luser";if(this.get("blank"))this.attributes=this.get("blank");else{if(!this.id&&serverside){var a=crypto.createHash("md5");a.update(""+Math.random());this.set("id",a.digest("hex"))}!this.get("username")&&serverside&&this.set("username",names.gen_name())}},avatar:function(){return this.get("avatar_url")?"http://www.gravatar.com/avatar/"+this.get("avatar_url")+"?s=32":"/static/avatars/newfoal.png"}});
models.UserList=Backbone.Collection.extend({model:models.User,initialize:function(){this.classname="luser"}});
models.Room=Backbone.Model.extend({defaults:{userlist:new models.UserList,queue:new models.VideoList,playlist:new models.VideoList,player:new models.Player,mutelist:new models.UserList,hidelist:new models.UserList,modlist:new models.UserList,owner:new models.User,messages:new models.MessageList},initialize:function(){this.classname="room";serverside&&this.db_fetch();var a=this,c=this.get("player");c.on("end",function(){c.set_vid(a.next_video())})},db_fetch:function(){var a=this,c=new Backbone.Collection;
c.classname="mod";c.query="room_id="+this.id;c.fetch();c.bind("reset",function(){c.each(function(b){a.get("modlist").add(b)})});var b=this.get("playlist"),d=this.get("player");b.on("reset",function(){d.get("current").get("time")||d.set_vid(b.get_first())});b.id=this.get("queue_id");b.query="queue_id="+b.id;b.fetch();var f=this.get("owner");f.id=this.get("owner_id");f.fetch()},next_video:function(){var a=this.get("player").get("current"),a=this.get("playlist").after(a),c=this.get("queue").where({watched:!1});
c.length&&(a=c[0]);return a},message:function(a,c){if(this.get("userlist").get(a.id)&&!this.get("mutelist").get(a.id)){var b=this.get("messages");100<=b.length&&b.reset();b.add({author:a.id,content:c})}},join:function(a){this.get("userlist").add(a)},leave:function(a){this.get("userlist").remove(a.id)},json:function(){var a=this.toJSON();a.messages=[];return a}});models.RoomList=Backbone.Collection.extend({model:models.Room,initialize:function(){this.classname="room"}});models.SessionStore=Backbone.Model.extend({});
serverside&&(module.exports=models);var TickerView=Backbone.View.extend({initialize:function(){if(google){this.feed=new google.feeds.Feed("http://feeds.feedburner.com/EquestriaDaily");this.feed.setNumEntries(10);this.fetch_feeds();this.model=new Backbone.Collection;var a=this;setInterval(function(){a.flip()},5E3);this.render();this.$el.find("#hide").click(function(){a.$el.remove()});$("#admin").css({margin:"auto",width:"500px","background-color":"#ddd",padding:"10px 20px","margin-bottom":"30px"});$("#admin #hide").css({color:"blue"}).click(function(){$("#admin").remove()});
$.browser.chrome&&23<=parseInt($.browser.version)&&$("#admin").remove();$("#news").css({margin:"auto","background-color":"#ddd",width:"500px",padding:"10px 20px","text-align":"center","margin-bottom":"30px"})}},render:function(){var a=this.$el;a.find("#ttitle, #inner").css({"float":"left",margin:"5px",color:"#00C2FF"});a.css({margin:"auto",width:"1280","background-color":"#ddd"});a.find("#hide").css({"float":"right",margin:"5px",cursor:"pointer"})},fetch_feeds:function(){var a=this;this.feed.load(function(c){c&&
(c.feed&&c.feed.entries&&c.feed.entries.length)&&($.each(c.feed.entries,function(b,c){a.model.add({title:c.title,link:c.link})}),a.flip())})},flip:function(){var a=this.model.at(parseInt(Math.random()*this.model.length)),c=this.$el;c.find("#inner").animate({opacity:0},500,function(){c.find("#text").text(a.get("title"));c.find("a").attr("href",a.get("link"));c.find("a").attr("target","_blank");c.find("#inner").animate({opacity:1},500)})}});var ConnectionApi=Backbone.Model.extend({defaults:{refresh:4E3},initialize:function(){var a=io.connect(this.get("ip"));this.set("sock",a);a.on("connect",function(){console.log("connected");a.emit("join",window.room.id)});this.start_player_loop();this.bind_room_events();this.bind_sock_events();window.mod=ismod(window.user)},start_player_loop:function(){var a=this.get("sock");setInterval(function(){a.emit("player_prompt")},this.get("refresh"))},bind_room_events:function(){var a=this.get("room"),c=this.get("user"),
b=this.get("sock");a.bind("message",function(a){b.emit("message",a);console.log("outputting message "+a)});var d=a.get("player");d.bind("action",function(){mod&&(b.emit("player_action",d.toJSON()),console.log("outputting player state"))});a.on("play play_new",function(a){mod&&b.emit("play_video",a.toJSON())});a.on("delete",function(a){mod&&b.emit("remove_video",a.toJSON())});a.on("queue",function(a){mod&&b.emit("add_queue",a.toJSON())});a.on("playlist",function(a){mod&&b.emit("add_playlist",a.toJSON())});
a.on("clear",function(a){mod&&b.emit("clear",a)});c.on("login",function(){b.emit("login",c.toJSON())});c.on("logout",function(){b.emit("logout")});a.bind("mod",function(a){isowner&&(console.log("mod"),b.emit("mod",a.id))});a.bind("mute",function(a){mod&&b.emit("mute",a.id)});a.bind("avatar",function(a){b.emit("avatar",a)})},bind_sock_events:function(){var a=this.get("room"),c=this.get("user"),b=this.get("sock");b.on("player",function(b){var c=a.get("player");c.set({state:b.state,time:b.time});c.get("current").id!=
b.current.id&&c.set("current",new models.Video(b.current))});b.on("status",function(b){a.trigger("status",b)});b.on("userlist",function(b){a.get("userlist").reset(b)});b.on("modlist",function(b){a.get("modlist").reset(b)});b.on("mutelist",function(b){a.get("mutelist").reset(b)});b.on("message",function(b){if(!a.get("hidelist").get(b.author)&&(a.get("messages").add(b),!document.hasFocus()||window.blurred))window.msgcount||(window.msgcount=0),window.msgcount++,document.title="("+window.msgcount+") Lunatube"});
b.on("playlist",function(b){a.get("playlist").reset(b)});b.on("queue",function(b){a.get("queue").reset(b)});b.on("jtv",function(a){"none"==a?window.plv.nojtv():window.plv.jtv(a)});b.on("login",function(a){a||alert("bad password");c.set(a)});b.on("refresh",function(){document.location.reload(!0)})}});window.onblur=function(){window.blurred=!0};window.addEventListener("focus",function(){window.blurred=!1;document.title="Lunatube";window.msgcount=0});var PrefsView=Backbone.View.extend({initialize:function(){window.user.bind("change reset",this.render,this);this.template=_.template('<div id="prefs">\t\t\t<div id="title">Preferences</div>\t\t\t<div id="avatar">\t\t\t\t<div><a href="http://gravatar.com" target="_blank"><b>Gravatar</b></a> email</div>\t\t\t\t<img src="[[gravatar]]" />\t\t\t\t<input type="text"></input>\t\t\t</div>\t\t\t<div id="save" class="button">save</div>\t\t\t<div class="small">changes will take effect after refresh</div>\t\t</div>')},
render:function(){var a=this.$el;a.html(this.template({gravatar:window.user.avatar()}));a.find("#prefs").css({position:"absolute",width:400,height:170,"background-color":"#444","z-index":2,"margin-left":-200,left:"50%",top:200});a.find("#title").css({margin:10,color:"white","font-weight":"bold","font-size":18});a.find("a").css({color:"white"});a.find("#avatar").css({margin:10,color:"white"});a.find("img").css({"float":"left",width:32,height:32,"margin-top":12});a.find("input").css({"float":"left",
height:32,width:200,"margin-top":12,"padding-left":4});a.find(".button").css({"margin-left":10});a.find(".small").css({"font-size":10,color:"white","margin-left":10,"margin-top":5});a.find("#save").click(function(){var c=a.find("input").val();room.trigger("avatar",c);a.css("display","none")})}});var ChatView=Backbone.View.extend({initialize:function(){var a=this;this.model.get("messages").bind("add",function(){var b=room.get("messages").where({rendered:!1});$.each(b,function(b,c){a.message(c);c.set("rendered",!0)})});var c=this.$el.find("#messages");room.bind("status",function(b){var d=$('<div id="status">');d.html(b);c.append(d);c.scrollTop(c[0].scrollHeight);a.options.status=!0})},message:function(a){var c=this.$el.find("#messages"),b=this.last_message_view;if(this.options.status||!b||
!b.append(a))b=new MessageView({model:a}),b.render(),c.append(b.el),this.last_message_view=b;c=$("#messages");c.scrollTop(c[0].scrollHeight);this.options.status=!1},render:function(){var a=this.model,c=this.$el,b=this;c.find("#mouth #avatar img").attr("src",window.user.avatar());var d=c.find("#mouth #input input");d.keydown(function(f){13==f.keyCode&&("/clear"==d.val()?(b.last_message_view=null,c.find("#messages").html("")):"/help"==d.val()||"/list"==d.val()||"/commands"==d.val()?a.trigger("status",
"/clear to clear screen, > to greentext, # to spoilertext"):a.trigger("message",d.val()),d.val(""))})}}),MessageView=Backbone.View.extend({initialize:function(){if(this.model){var a=this.model.get("content");is_img_link(a)?(this.options.url=a,this.options.thumbnail=a):is_yt_link(a)&&(a=get_yt_vidid(a),this.options.video=new models.Video({url:a}),this.options.video.bind("change",this.render,this),this.options.url="http://youtube.com/watch?v="+a,this.options.thumbnail=get_yt_thumbnail(a))}},media:function(a){a=
a.get("content");return is_img_link(a)||is_yt_link(a)},append:function(a){if(this.options.thumbnail||this.media(a)||a.get("author")!=this.model.get("author"))return!1;this.options.appendum||(this.options.appendum=[]);this.options.appendum.push(a);this.render();return!0},render:function(){var a=$("<div>"),c=$("<div>").text(this.model.get("content")),b=$("#messages");islink(this.model.get("content"))&&(c=$('<a target="_blank">').text(this.model.get("content")).attr("href",this.model.get("content")));
a.append(c);">"==this.model.get("content")[0]&&c.css("color","green");"#"==this.model.get("content")[0]&&(c.css("color","black"),c.css("background-color","black"),c.css("cursor","pointer"),c.click(function(){$(this).css("background-color","")}));var d=this.$el,f=this,c="/static/avatars/sleep.png",e="Offline User";if(window.room){var h=room.get("userlist").get(this.model.get("author"));h&&(c=h.avatar(),e=h.get("username"))}this.options.appendum&&$.each(this.options.appendum,function(b,c){var d=$("<div>").text(c.get("content"));
islink(c.get("content"))&&(d=$('<a target="_blank">').text(c.get("content")).attr("href",c.get("content")));">"==c.get("content")[0]&&d.css("color","green");"#"==c.get("content")[0]&&(d.css("color","black"),d.css("background-color","black"),d.css("cursor","pointer"),d.click(function(){$(this).css("background-color","");$(this).css("cursor","")}));a.append(d)});if(this.options.thumbnail&&this.options.url)if(this.options.video)d.html(_.template($("script#video_msg").html(),{avatar:c,username:e,content:a,
url:this.options.url,thumb:this.options.thumbnail,title:this.options.video.get("title"),uploader:this.options.video.get("uploader"),time_text:this.options.video.get("time_text")})),ismod(window.user)?(d.find("#play").click(function(){window.room.trigger("play_new",f.options.video)}),d.find("#queue").click(function(){window.room.trigger("queue",f.options.video)}),d.find("#playlist").click(function(){window.room.trigger("playlist",f.options.video)})):d.find("#play, #queue, #playlist").remove();else{d.html(_.template($("script#image_msg").html(),
{avatar:c,username:e,content:a,url:add_pretext(this.options.url),thumb:add_pretext(this.options.thumbnail)}));var g=new Image;g.onload=function(){1E3<g.width||1E3<g.height?d.find("#content a").html(a.append(" (too large to display)")):(d.find("#content a").empty().append(g),$(g).attr("id","image_thumb"),b.scrollTop(b[0].scrollHeight))};g.onerror=function(){d.find("#content a").html(a)};g.src=add_pretext(this.options.url)}else c==d.find(".avatar img").attr("src")&&e==d.find("#username").html()?d.find("#content").html(a):
d.html(_.template($("script#message").html(),{avatar:c,username:e,content:""})),d.find("#content").append(a);c=d.find("img");b=$("#messages");c&&$.each(c,function(a,c){$(c).load(function(){b.scrollTop(b[0].scrollHeight)})})}});$(document).ready(function(){window.room=new models.Room;for(idx in globals.room){var a=globals.room[idx];if("object"==typeof a){var c=room.get(idx);if(c.reset)c.reset(a);else if(c.set)for(idx2 in a){var b=a[idx2],d=c.get(idx2);"object"!=typeof b?c.set(idx2,b):d.set?d.set(b):d.reset&&d.reset(b)}}}window.room.id=globals.room.id;window.room.set({jtv:globals.room.jtv});window.user=new models.User(globals.user);window.api=new ConnectionApi({ip:"ws://"+window.location.host,room:window.room,user:window.user,
refresh:4E3});window.cv=new CatalogView({el:$("#catalog"),playlists:{queue:room.get("queue"),playlist:room.get("playlist")}});cv.render();window.plv=new PlayerView({el:$("#theater"),model:room.get("player"),tolerance:5});room.get("player").get("current").initialize();plv.render();window.cv=new ChatView({el:$("#chatroom"),model:room});cv.render();window.ulv=new UserListView({el:$("#chatroom"),model:room.get("userlist")});ulv.render();window.liv=new LoginView({el:$("#login"),model:window.user});liv.render();
window.cams=new CamsView({el:$("#cams")});window.prefs=new PrefsView({el:$("#prefs")});prefs.render();window.ticker=new TickerView({el:$("#ticker")});$("body").click(function(){$("#menu").remove()});$("#login")[0].onselectstart=function(){return!1};$("#theater")[0].onselectstart=function(){return!1};$("#catalog")[0].onselectstart=function(){return!1};$("#header")[0].onselectstart=function(){return!1}});var plapi="https://gdata.youtube.com/feeds/api/playlists/",plapi2="?v=2&alt=json&key=AI39si5Us3iYwmRdK0wa2Qf2P9eV-Z8tbjogUWw1B4JQUs191PgYNJChEKEooOq6ykQzhywLEBA9WxuKphpWUoCRA7S7jeLi5w",CatalogView=Backbone.View.extend({initialize:function(){var a=this.$el,c=this;this.subviews={};$.each(this.options.playlists,function(b){a.find(".section#"+b).click(function(){c.show(b)})});room.get("player").bind("change:current",this.show_current,this);a.find("#import").hover(function(){var a=$('<div id="dropdown">\t\t\t\t\t<input type="text" id="input" placeholder="Youtube Playlist URL"/>\t\t\t\t</div>');
$(this).append(a)},function(){$(this).find("#dropdown").remove()});a.find("#import #btn").click(function(){var b=a.find("#import input").val();b&&(b=get_yt_plid(b))&&b.length&&$.get(plapi+b+plapi2,function(a){a&&(a.feed&&a.feed.entry&&a.feed.entry.length)&&$.each(a.feed.entry,function(a,b){var c=new models.Video({url:get_yt_vidid(b.link[0].href),ready:function(){window.room.trigger("playlist",c)}})})})});a.find("#add").hover(function(){var a=$('<div id="dropdown">\t\t\t\t\t<input type="text" id="input" placeholder="Youtube Video URL"/>\t\t\t\t</div>');
$(this).append(a)},function(){$(this).find("#dropdown").remove()});a.find("#add #btn").click(function(){var b=get_yt_vidid(a.find("#add input").val());if(b)var c=new models.Video({url:b,ready:function(){window.room.trigger("playlist",c)}})});a.find("#clear").click(function(){window.room.trigger("clear",c.showing)})},render:function(){var a=this.$el.find("#videos").empty(),c=this;ismod(window.user)||this.$el.find("#headers #right").css("visibility","hidden");$.each(this.options.playlists,function(b,
d){var f=$("<div>"),e=c.$el.find(".section#"+b+" #count");a.append(f);c.subviews[b]=new PlaylistView({model:d,el:f,cel:e});c.subviews[b].render()});this.show_current()},show:function(a){this.showing=a;$.each(this.subviews,function(c,b){c==a?b.$el.css("display","block"):b.$el.css("display","none")});this.$el.find(".section.selected").removeClass("selected");this.$el.find(".section#"+a).addClass("selected")},show_current:function(){var a=this;$.each(this.options.playlists,function(c,b){var d=room.get("player").get("current");
b.get(d.id)&&a.show(c)})}}),PlaylistView=Backbone.View.extend({initialize:function(){this.model.bind("add remove reset",this.render,this);room.get("player").bind("change:current",this.render_current,this);this.subviews={}},render:function(){var a=this,c=this.$el.empty();this.options.cel.html("("+this.model.length+")");this.model.each(function(b){var d=a.subviews[b.id];d||(d=new PlaylistItemView({model:b,removable:!0}),a.subviews[b.id]=d);c.append(d.el);d.render()});this.render_current()},render_current:function(){this.$el.find("#video.selected").removeClass("selected");
var a=this.subviews[room.get("player").get("current").id];a&&a.$el.addClass("selected")}}),PlaylistItemView=Backbone.View.extend({initialize:function(){this.model&&(this.model.bind("change",this.render,this),this.template=_.template($("script#video").html()))},render:function(){var a=this.$el,c=this;if(this.model){var b=$(this.template(this.model.toJSON()));a.html(b.html());this.options.removable&&(a.find("#thumbnail, #info").click(function(){room.trigger("play",c.model)}),a.hover(function(){a.find("#actions").css("display",
"block")},function(){a.find("#actions").css("display","none")}),a.find("#open").click(function(){var a="http://youtube.com/watch?v="+c.model.get("url");window.open(a,"_blank")}),ismod(window.user)||a.find("#delete").css("display","none"),a.find("#delete").click(function(){window.room.trigger("delete",c.model)}));a.attr("id",b.attr("id"))}}});var chromeless="http://www.youtube.com/apiplayer?version=3&enablejsapi=1&playerapiid=player1",jtv='<object type="application/x-shockwave-flash" height="480" width="853" id="jtv_player_flash" data="http://www.justin.tv/widgets/jtv_player.swf?channel=[[chan]]" bgcolor="#000000"><param name="allowFullScreen" value="true" /><param name="allowscriptaccess" value="always" /> <param name="movie" value="http://www.justin.tv/widgets/jtv_player.swf" /><param name="flashvars" value="channel=[[chan]]&auto_play=false&start_volume=50&watermark_position=top_right" /></object>',
PlayerView=Backbone.View.extend({initialize:function(){var a=this,c=this.$el;this.options.dimensions||(this.options.dimensions={width:853,height:480});this.options.tolerance||(this.options.tolerance=2);window.onYouTubePlayerReady=function(){a.ready()};this.model.bind("change",this.render,this);room.get("playlist").bind("reset add remove",this.render,this);room.get("queue").bind("reset add remove",this.render,this);room.get("player").bind("change:current",this.render,this);ismod(window.user)&&this.$el.find("#play").click(function(){"playing"==
a.model.get("state")?a.model.pause():a.model.play()});this.$el.find("#overlay").click(function(){$("#apiplayer")[0].webkitRequestFullscreen()});$(document).bind("webkitfullscreenchange mozfullscreenchange fullscreenchange",function(){window.fullscreen=!window.fullscreen;window.fullscreen?$("#apiplayer").css({width:window.screen.width,height:window.screen.height}):$("#apiplayer").css({width:"100%",height:"100%"})});var b=this.$el.find("#scrobbler"),d=this.$el.find("#playhead");ismod(window.user)&&
(b.click(function(c){var e=a.model.get("current");e&&(c=c.offsetX/(b.width()-d.width()),e=Math.floor(c*e.get("time")),a.model.seek(e))}),b.hover(function(){d.css("background-color","red")},function(){d.css("background-color","white")}));var f=c.find("#next"),e=c.find("#next_vid");if(!this.pliv||this.pliv.get("url")!=room.next_video()){var h=new PlaylistItemView({model:room.next_video(),el:e});h.render();this.pliv=h}e.css({display:"none",position:"absolute",left:-e.width()+f.width(),top:-e.height(),
"text-align":"left",border:"none"});f.hover(function(){e.css("display","block")},function(){e.css("display","none")});ismod(window.user)&&f.click(function(){"Bq6WULV78Cw"!=room.next_video().get("url")&&3!=event.which&&room.trigger("play",room.next_video())});var f=c.find("#volume"),g=f.find("#volume_slider");f.hover(function(){c.find("#mute,#max").css("display","block")},function(){c.find("#mute,#max").css("display","none")});c.find("#vol").mousedown(function(b){var c=100*(b.offsetX/$(this).width());
a.volume(c);g.width(b.offsetX)});c.find("#max").click(function(){a.volume(100);g.width("100%")});c.find("#mute").click(function(){a.volume(0);g.width(0)});this.$el.find("#vid_title").click(function(){var b="http://youtube.com/watch?v="+a.model.get("current").get("url");window.open(b,"_blank")})},render:function(){var a=this.$el,c=this;if(room.get("jtv")&&"none"!=room.get("jtv")&&!this.tv)setTimeout(function(){c.jtv(room.get("jtv"))},2E3);else{!this.player&&window.swfobject&&swfobject.embedSWF(chromeless,
"youtube",String(this.options.dimensions.width),String(this.options.dimensions.height),"9",null,null,{allowScriptAccess:"always"},{id:"apiplayer"});if(this.player){var b=this.model.get("time"),d=this.player.getCurrentTime();Math.abs(d-b)>this.options.tolerance&&this.player.seekTo(b,!0);b=this.model.get("current").get("url");d=get_yt_vidid(this.player.getVideoUrl());b!=d&&this.player.cueVideoById(b);b=this.model.get("state");d=this.player.getPlayerState();this.player.setPlaybackQuality("large");"playing"==
b&&1!=d&&3!=d?this.player.playVideo():"paused"==b&&1==d&&this.player.pauseVideo()}this.pliv.model=room.next_video();this.pliv.render();"playing"==this.model.get("state")?ismod(window.user)?a.find("#play").html("pause"):a.find("#play").html("playing"):ismod(window.user)?a.find("#play").html("play"):a.find("#play").html("paused");this.$el.find("#vid_title").html("Now Playing: "+c.model.get("current").get("title"));b=a.find("#playhead");a=a.find("#scrobbler");d=this.model.get("time")/this.model.get("current").get("time");
a=(a.width()-b.width())*d;b.css("visibility","");b.css("margin-left",a);b=$("#ph_time");b.html(c.model.time());b.css({left:a-b.width()/2,top:-b.height()-8});this.model.get("current")&&this.model.get("current").get("title")&&$("#banner").html(this.model.get("current").get("title"))}},jtv:function(a){a=_.template(jtv,{chan:a});this.tv=!0;$("#apiplayer").css("display","none");$("#jtv_player_flash").remove();$("#player").append(a);$("#invisible").css("display","none")},nojtv:function(){this.tv=!1;$("#jtv_player_flash").remove();
$("#invisible").css("display","block");$("#apiplayer").css("display","block")},ready:function(){this.player=document.getElementById("apiplayer");cookie("volume")?this.volume(parseInt(cookie("volume"))):this.volume(50);this.trigger("ready")},set_video:function(a){player&&this.player.cueVideoById(a.get("url"))},update:function(a){if(this.player){switch(this.model.get("state")){case "playing":this.player.playVideo();case "paused":this.player.pauseVideo()}this.player.getCurrentTime();a.time-this.player.get("time")>
this.options.tolerance&&this.set("time",a.time)}},play:function(){this.player&&this.player.playVideo()},pause:function(){this.player&&this.player.pauseVideo()},volume:function(a){cookie("volume",a);this.player&&(this.player.setVolume(a),a=this.$el.find("#vol").width()*a/100,this.$el.find("#volume_slider").width(a))}});window.UserListView=Backbone.View.extend({initialize:function(){this.model.bind("add remove reset",this.render,this);room.get("modlist").bind("add remove reset",this.render,this);room.get("mutelist").bind("add remove reset",this.render,this);room.get("hidelist").bind("add remove reset",this.render,this);this.subviews={};var a=this.$el.find("#header #user"),c=this.$el.find("#users");a.click(function(){"none"==c.css("display")?c.css("display","block"):c.css("display","none")});this.$el.find("#cam").click(function(){$(this).hasClass("selected")?
cams.quit():(cams.join(),$(this).toggleClass("selected"))})},render:function(){this.$el.find("#header #user").html(this.model.length+" Users");if("none"!=this.$el.find("#users").css("display")){var a=this.$el.find("#users").empty(),c=this.subviews;a.css({"max-height":"300px"});this.model.each(function(b){var d=c[b.id];d||(d=new UserView({model:b}),c[b.id]=d);a.append(d.el);d.render()})}}});
window.UserView=Backbone.View.extend({initialize:function(){this.model.bind("change",this.render,this)},render:function(){var a=_.template($("script#user").html()),c=this.model,b=this.$el;b.html(a({avatar:this.model.avatar(),username:this.model.get("username")}));ismod(c)?b.find("#mod.button").addClass("selected"):isowner(window.user)||b.find("#mod.button").remove();room.get("mutelist").get(c.id)?b.find("#mute.button").addClass("selected"):ismod(window.user)||b.find("#mute.button").remove();room.get("hidelist").get(c.id)&&
b.find("#hide.button").addClass("selected");isowner(window.user)&&b.find("#mod.button").hover(function(){$(this).addClass("hovered")},function(){$(this).removeClass("hovered")});isowner(window.user)?b.find("#mod.button").click(function(){room.trigger("mod",c)}):(b.find("#mod").removeClass("button"),b.find("#mod").addClass("disabled_button"));ismod(window.user)?b.find("#mute.button").click(function(){room.trigger("mute",c)}):(b.find("#mute").removeClass("button"),b.find("#mute").addClass("disabled_button"));
b.find("#hide.button").click(function(){var a=room.get("hidelist").get(c.id);a?room.get("hidelist").remove(a):room.get("hidelist").add(c)})}});window.LoginView=Backbone.View.extend({initialize:function(){this.model.bind("change reset",this.render,this);var a=this.$el,c=a.find("#unfield"),b=a.find("#password"),d=this.model,f=function(){(!c.val()||!b.val())&&alert("Please enter your registration credentials in the textboxes to the top right.");d.set({username:c.val(),password:b.val()});d.trigger("login")};c.keydown(function(a){13==a.keyCode&&f()});b.keydown(function(a){13==a.keyCode&&f()});cookie("theme")&&($("link").attr("href","static/themes/"+
cookie("theme")+".less"),less.refresh());a.find("a").css({color:"white"});a.find("#themes.themes").click(function(){if($("#tmenu").length)$("#tmenu").remove();else{var a=$('<div id="tmenu">\t\t\t\t\t<div id="luna">luna</div>\t\t\t\t\t<div id="twilight">twilight</div>\t\t\t\t\t<div id="applejack">applejack</div>\t\t\t\t\t<div id="pinkie">pinkie</div>\t\t\t\t\t<div id="rarity">rarity</div>\t\t\t\t\t<div id="fluttershy">fluttershy</div>\t\t\t\t\t<div id="rainbow">rainbow</div>\t\t\t\t\t<div id="simple">monoshy</div>\t\t\t\t</div>');
a.css({position:"absolute",top:$(this).offset().top+32,left:$(this).offset().left});a.find("#pinkie").click(function(){cookie("theme","pinkie");$("link").attr("href","static/themes/pinkie.less");less.refresh();$("#tmenu").remove()});a.find("#luna").click(function(){cookie("theme","luna");$("link").attr("href","static/themes/luna.less");less.refresh();$("#tmenu").remove()});a.find("#twilight").click(function(){cookie("theme","twilight");$("link").attr("href","static/themes/twilight.less");less.refresh();
$("#tmenu").remove()});a.find("#applejack").click(function(){cookie("theme","applejack");$("link").attr("href","static/themes/applejack.less");less.refresh();$("#tmenu").remove()});a.find("#rarity").click(function(){cookie("theme","rarity");$("link").attr("href","static/themes/rarity.less");less.refresh();$("#tmenu").remove()});a.find("#rainbow").click(function(){cookie("theme","rainbow");$("link").attr("href","static/themes/rainbow.less");less.refresh();$("#tmenu").remove()});a.find("#fluttershy").click(function(){cookie("theme",
"fluttershy");$("link").attr("href","static/themes/fluttershy.less");less.refresh();$("#tmenu").remove()});a.find("#simple").click(function(){cookie("theme","simple");$("link").attr("href","static/themes/simple.less");less.refresh();$("#tmenu").remove()});$("body").append(a)}});a.find("#login_button").click(f);a.find("#reg_button").click(f);a.find("#logout").click(function(){d.trigger("logout")});a.find("#username").css({"min-width":"80px","text-align":"left"});a.find("#username").click(function(){if($("#smenu").length)$("#smenu").remove();
else{var a=$('<div id="smenu">\t\t\t\t\t<div id="prefs">preferences</div>\t\t\t\t\t<div id="logout">logout</div>\t\t\t\t</div>');a.css({position:"absolute",width:$(this).width()+24,top:$(this).offset().top+32,left:$(this).offset().left});a.find("#prefs").click(function(){"none"==$("#prefs").css("display")?$("#prefs").css("display","block"):$("#prefs").css("display","none")});a.find("#logout").click(function(){$("#smenu").remove();d.trigger("logout")});$("body").append(a)}})},render:function(){var a=
this.$el;this.model.id&&32>(this.model.id+"").length?(a.find("#status").css("display",""),a.find("#logout").css("display",""),a.find("#fields").css("display","none"),a.find("#username").html(this.model.get("username")),a.find("#avatar img").attr("src",this.model.avatar())):(a.find("#logout").css("display","none"),a.find("#status").css("display","none"),a.find("#fields").css("display",""))}});var CamsView=Backbone.View.extend({join:function(){var a=this.$el;this.$el.css("display","block");var c=_.template($("script#cam").html());(!$.browser.chrome||23>parseInt($.browser.version))&&alert("for cams to work properly, you should use chrome v23");var b=$(c());b.click(function(){"400px"!=$(this).css("width")?$(this).css({width:400,height:300}):$(this).css({width:160,height:120})});a.append(b);rtc.createStream({video:!0,audio:!0},function(a){b.attr("src",URL.createObjectURL(a))});rtc.connect("ws://"+
window.location.hostname+":4000/",window.room.id);rtc.on("add remote stream",function(b,f){var e=$(c());e.attr({id:f,src:URL.createObjectURL(b)});e.click(function(){"400px"!=$(this).css("width")?$(this).css({width:400,height:300}):$(this).css({width:160,height:120})});a.append(e)});rtc.on("disconnect stream",function(a){$(document.getElementById(a)).remove()})},quit:function(){alert("there's no other way to quit cams other than to refresh the page. i'm getting this fixed as soon as possible.")}});
