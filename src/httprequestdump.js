const express = require('express')
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const format = require('date-format');
const multer  = require('multer')
const url = require('url');
const app = express()

const port = process.argv[2]

const server = http.createServer(app);

const outDir = 'dump'

server.listen(port, () => {
    console.log("server starting on port : " + port)
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))
// parse application/json
app.use(bodyParser.json())
// parse application/vnd.api+json as json
app.use(bodyParser.json({type: 'application/vnd.api+json'}))

app.set('views', './src/views')

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
}

app.set('view engine', 'pug')

app.get('/dump', (req, res) => {
    var requests = fs.readdirSync(outDir);
    var files = [];
    for (const request of requests) {
        files.push({link: `/requests?name=${request}`, name: request})
    }
    res.render('dump', {files: files})
})

app.get('/requests', (req, res) => {
    const path = `${outDir}/${req.query.name}`
    if (fs.existsSync(path)) {
        res.contentType("application/json");
        fs.createReadStream(path).pipe(res)
    } else {
        res.status(404)
        console.log(`File not found: ${path}`)
        res.send('File not found')
    }
})

app.all('/request', multer().none(), (req, res) => {
    const request = {
        headers: req.rawHeaders,
        url: req.url,
        parameters: url.parse(req.url,true).query,
        method: req.method,
        body: req.body,
    }

    fs.writeFile(`${outDir}/${format.asString("yyMMdd-hhmmss", new Date())}-${request.method}`, JSON.stringify(request, null, 2), function (err) {
        if (err) return console.log(err);
    });
    res.sendStatus(200);
});
