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

onSearch = (searchQuery) => {
    if (searchQuery == null)
    {
        // came from a form submission, not a parameter
        searchQuery = document.getElementById("query").value;
    }
    
    searchQuery = decodeURI(searchQuery);
    document.getElementById("query").value = searchQuery;

    var searchWords = searchQuery.split(' ');
    var allData = JSON.parse(window.data);

    // Too hard/complicated to write as lambdas/filters
    var matchingItems = [];

    // Search for matching tags
    for (var i = 0; i < allData.length; i++)
    {
        var item = allData[i];
        var tags = item["tags"];
        var isMatch = false;
        
        // Do any words match a tag?
        for (var k = 0; k < searchWords.length; k++)
        {
            var searchWord = searchWords[k];
            for (var j = 0; j < tags.length; j++)
            {
                if (tags[j].toLowerCase() == searchWord.toLowerCase())
                {
                    isMatch = true;
                    matchingItems.push(item);
                    break;
                }
            }

            // If match, don't search remaining search words
            if (isMatch)
            {
                break;
            }
        }

        // If we didn't find a tag, search blurbs next.
        // Does the word appear (possibly as a substring) in the blurb? We can use regex to make sure it's a word,
        // but that might be against user expectations, and it would be slow if we have lots of long blurbs.
        if (!isMatch)
        {
            var blurb = item["blurb"].toLowerCase();
            for (var k = 0; k < searchWords.length; k++)
            {
                var searchWord = searchWords[k];
                if (blurb.indexOf(searchWord.toLowerCase()) > -1)
                {
                    isMatch = true;
                    matchingItems.push(item);
                    break;
                }
            }
        }

        // Finally, search the title.
        if (!isMatch)
        {
            var title = item["title"].toLowerCase();
            for (var k = 0; k < searchWords.length; k++)
            {
                var searchWord = searchWords[k];
                if (title.indexOf(searchWord.toLowerCase()) > -1)
                {
                    isMatch = true;
                    matchingItems.push(item);
                    break;
                }
            }
        }
    }
    
    var finalHtml = "";
    for (var i = 0; i < matchingItems.length; i++)
    {
        var item = matchingItems[i];
        var tags = item["tags"];

        var tagsHtml = "";
        for (var j = 0; j < tags.length; j++)
        {
            tagsHtml += "<span class='tag'><a href='/tags/" + tags[j] + ".html" + "'>" + tags[j] + "</a></span>"
        }
        
        finalHtml += window.snippet.replace("{title}", '<a href="' + item["url"] + '">' + item["title"] + "</a>")
            .replace("{url}", '<a href="' + item["url"] + '">' + item["url"] + "</a>")
            .replace("{tags}", tagsHtml)
            .replace("{blurb}", item["blurb"]);
    }
    
    var header = "<h2>" + matchingItems.length + " items matching " + searchQuery + "</h2>";
    setContent(header + finalHtml);
}

main();
