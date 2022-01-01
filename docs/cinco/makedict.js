var fs = require('fs');
var dict = {};

let lines = fs.readFileSync('./input.dict', "utf8");

lines.split("\r\n").map(word => {
    if (word.length != 5) {return;}
    let tracking = dict;
    for (let i=0; i<word.length-1; i++)
    {
        if (!tracking[word[i]])
        {
            tracking[word[i]] = {};
        }

        tracking = tracking[word[i]];
    }
    tracking[word[word.length-1]] = 1;
});

console.log(JSON.stringify(dict));
