const express = require('express');
const s3toOss = require('./s3toOSS');

let app = express();

app.get("/", (req, res) => {


});

app.listen(3000, function(){
    console.log("Server is listening on Port 3000");
});