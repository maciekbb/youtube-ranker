var express = require('express'),
    app = express();

var redis = require("redis"),
    redis_client = redis.createClient();

var youtube = require('youtube-feeds')

var fetch_and_store_popular_videos = function(start_index) {
    console.log("Start_index = " + start_index);
    youtube.feeds.videos({
            'max-results': 50,
            'start-index': start_index,
            'duration': 'short',
            'orderby': 'relevance',
            'licence': 'cc',
            'genre': 4,
            'time': 'today'
        },
        function(result, data) {
            if (data) {
                if (data.items) {
                    data.items.filter(function(v) {
                        return v.duration <= 60
                    }).forEach(function(video) {
                        console.log("Loaded: " + video.player.
                            default);
                        redis_client.zadd("videos", 0, video.player.
                            default);
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

app.get('/:rank', function(request, response) {
    var rank = request.params.rank;
    redis_client.zrange("videos", rank, rank, function(res, val) {
        response.render('index.ejs', {
            "url": val
        });
    });
});

app.listen(3000);