setContent = (html) => {
    document.getElementById("output").innerHTML = html;
}

main = () => {
    var queryParameters = location.search.slice(1).split("&");
    for (var i = 0; i < queryParameters.length; i++)
    {
        var params = queryParameters[i].split('=');
        var key = params[0];
        var value = params[1];
        if (key.toLowerCase() == "query") {
            // Make sure the document is ready and window.data is defined, before proceeding.
            document.addEventListener("DOMContentLoaded", (event) => {
                this.onSearch(value);
            });
            break;
        }
    }
}

// From https://stackoverflow.com/questions/247483/http-get-request-in-javascript/38297729#38297729
httpGetAsync = (theUrl, callback) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            callback(xmlHttp.responseText);
        }
    }

    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null); // ?!
}

onSearch = (searchQuery) => {
    if (searchQuery == null)
    {
        // came from a form submission, not a parameter
        searchQuery = document.getElementById("query").value;
    }
    
    searchQuery = decodeURI(searchQuery);
    document.getElementById("query").value = searchQuery;

    var searchWords = searchQuery.split(' ');

    // Fetch data
    var config = JSON.parse(window.config)
    var siteRootUrl = config["siteRootUrl"];
    var searchData = httpGetAsync(siteRootUrl + "/data.json", (searchData) => {

        // Parse data
        var allData = JSON.parse(searchData);

        // Array. Each item is an "item" (data), then the score, then the order (pseudo-date).
        // We sort by score descending, then by id/order ascending (older is better). Age 0 = older.
        //
        // This is deliberately to contrast the homepage and tags, where newer is better - we're
        // trying to surface more/different things in search.

        // title match is kinda important, tags match are meh, blurb match is super important.
        // This is the point scoring, per keyword.
        var weights = { "title": 2, "tags": 1, "blurb": 4 }
        var everything = [];

        // Search for matching tags, titles, and blurbs
        for (var i = 0; i < allData.length; i++)
        {
            var item = allData[i];

            everything.push({"item": item, "score": 0, "age": i}); // age 0 is older than age 1
            
            for (var k = 0; k < searchWords.length; k++)
            {
                var searchWord = searchWords[k];
                
                // Do any words match any tag words?
                // e.g. searching for "core" matches the tags "core" and "core loop" and "core-loop"
                // e.g. searching for "core loop" matches the tags "core" and "core loop" and "loop stuff"
                var tags = item["tags"];
                for (var j = 0; j < tags.length; j++)
                {
                    if (tags[j].toLowerCase().indexOf(searchWord.toLowerCase()) > -1)
                    {
                        everything[i]["score"] += weights["tags"];
                    }
                }

                // Does the word appear (possibly as a substring) in the blurb? We can use regex to make sure it's a word,
                // but that might be against user expectations, and it would be slow if we have lots of long blurbs.
                var blurb = item["blurb"].toLowerCase();
                if (blurb.indexOf(searchWord.toLowerCase()) > -1)
                {
                    everything[i]["score"] += weights["blurb"];
                }

                // Finally, search the title.
                var title = item["title"].toLowerCase();
                if (title.indexOf(searchWord.toLowerCase()) > -1)
                {
                    everything[i]["score"] += weights["title"];
                }
            }
        }

        // Sort by score descending, then age ascending (oldest first)
        everything.sort((a, b) => a.score == b.score ? a.age > b.age : a.score < b.score)
        
        var finalHtml = "";
        var config = JSON.parse(window.config)
        var rootUrl = "siteRootUrl" in config ? config["siteRootUrl"] : ""

        var relevantCount = 0;
        for (var i = 0; i < everything.length; i++)
        {
            var data = everything[i];
            if (data["score"] > 0)
            {
                relevantCount += 1;

                var item = data["item"];
                var tags = item["tags"];
                var tagsHtml = "";
                for (var j = 0; j < tags.length; j++)
                {
                    // match everywhere we do tag normalization
                    var clean_tag = tags[j].replace(' ', '-').replace("'", "");
                    var proper_tag_name = tags[j].replace(/-/g, ' ');
                    tagsHtml += "<span class='tag'><a href='" + rootUrl + "/tags/" + clean_tag + ".html" + "'>" + proper_tag_name + "</a></span>"
                }
                
                titleHtml = '<a href="' + item["url"] + '">' + item["title"] + "</a>"

                blurb = item["blurb"] || ""
                if ("type" in item) {
                    titleHtml += "<img class='icon' src='" + rootUrl + "/images/" + item["type"] + ".png' title='" + item["type"] + "' />"
                }
                
                finalHtml += window.snippet.replace("{title}", titleHtml)
                    .replace("{url}", '<a href="' + item["url"] + '">' + item["url"] + "</a>")
                    .replace("{tags}", tagsHtml)
                    .replace("{blurb}", blurb);
            }
        }
        
        var header = "<h2>" + relevantCount + " items matching " + searchQuery + "</h2>";
        setContent(header + finalHtml);
    });
}

main();
