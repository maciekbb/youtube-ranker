var express = require('express'),
    app = express();

var redis_client = require('redis-url').connect(process.env.REDISTOGO_URL || null);

var youtube = require('youtube-feeds')

var fetch_and_store_popular_videos = function(start_index) {
    console.log("Start_index = " + start_index);
    youtube.feeds.videos({
            'max-results': 50,
            'start-index': start_index,
            'duration': 'short',
            'orderby': 'relevance',
            'licence': 'cc',
            'time': 'this_week'
        },
        function(result, data) {
            if (data) {
                if (data.items) {
                    data.items.filter(function(v) {
                        return v.duration <= 60
                    }).forEach(function(video) {
                        var likeCount = video.likeCount ? parseInt(video.likeCount) : 0;
                        console.log(likeCount);
                        console.log("Loaded: " + video.player.
                            default);
                        redis_client.zadd("videos", likeCount, video.id);
                        redis_client.hset("videos:" + video.id, "url", video.player.
                            default);
                        redis_client.hset("videos:" + video.id, "title", video.title);
                        redis_client.hset("videos:" + video.id, "thumb", video.thumbnail.hqDefault);
                    });
                } else {
                    console.log(data);
                }
            }

            if (start_index < 450) {
                return fetch_and_store_popular_videos(start_index + 50);
            } else {
                return;
            }
        }
    )
}

fetch_and_store_popular_videos(1);

app.get('/top', function(request, response) {
    redis_client.zrevrange("videos", 0, 20, function(err, movies_ids) {
        console.log(movies_ids);

        var movies = [];

        var addMovieWithId = function(id, callback) {
            redis_client.hgetall("videos:" + id, function(err, video) {
                movies.push(video);
                callback();

            });
        }

        var checkIfRequestCompleted = function() {
            if (movies.length == movies_ids.length) {
                console.log("Movies prepared " + JSON.stringify(movies));
                response.render('list.ejs', {
                    "movies": movies,
                });
            }
        }

        for (var i = 0; i < movies_ids.length; i++) {
            addMovieWithId(movies_ids[i], checkIfRequestCompleted);
        }


    });
});

app.get('/', function(request, response) {
    response.sendfile(__dirname + "/views/index.html");
});

app.use(express.static(__dirname + '/public'));

var port = Number(process.env.PORT || 5000);
app.listen(port);