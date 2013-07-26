var express = require('express'),
    fs = require('fs'),
    app = express.createServer()

app.configure(function(){
    app.use(express.static(__dirname));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.logger());
    app.use(express.errorHandler({
        dumpExceptions: true, 
        showStack: true
    }));
    app.use(app.router);
});

app.post('/save', function(req, res){
    console.log("Save genome");
    fs.writeFile('genome.txt', req.body.genome, function(err) {
        if(err) {
            res.end('Error writing file!');
            return console.log(err);
        }
        res.end('Genome saved!');
        console.log('genome written to genome.txt');
    });
});

app.get('/', function(req, res){
    res.redirect("/index.html");
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Listening on " + port);
});