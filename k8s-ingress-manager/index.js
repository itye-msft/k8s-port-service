var express = require('express')
var request = require('request');
var router = express.Router();

const Paths = {
    GetPort: 'http://localhost:4000/getport',
    HelmUpgrade: 'http://localhost:4000/upgrade'
}

router.get('/setrule', (req, res, next) => {
    //init params
    let serivceName = req.query.servicename;
    let servicePort = req.query.serviceport;

    GetIpPortRelease(req, function (ip, port, release) {
        //prepare data to post
        let tcp = 'tcp.' + port;
        let v = {};
        v[tcp] = serivceName + ":" + servicePort;
        let formData = {
            "chartName": "stable/nginx-ingress",
            reuseValue: true,
            "releaseName": release,
            "values": v
        }

        // send it to the helm service
        HttpPost(Paths.HelmUpgrade, formData).then(
            function (httpResponse) {
                res.send(httpResponse);
            }, function (err) {
                res.send(err);
            })
    });
});

function GetIpPortRelease(req, callback) {
    let port = ip = release = '';
    //if specific port/ip/release were requested:
    if (req.query.specificport != undefined && req.query.specificport != "" &&
        req.query.specificlb != undefined && req.query.specificlb != "" &&
        req.query.specificrelease != undefined && req.query.specificrelease != "") {
        ip = req.query.specificlb;
        port = req.query.specificport;
        release = req.query.specificrelease;

        callback(ip, port, release);
    }
    else {
        //get free port/ip/release
        HttpGet(Paths.GetPort).then(function (portData) {
            let data = JSON.parse(portData);
            ip = data.public_ip;
            port = data.port;
            release = data.release;
            callback(ip, port, release);
        })
    }
}

function HttpGet(url) {
    const options = {
        url: url,
        method: 'GET',
    };

    return AsyncRequest(options);
}

function HttpPost(url, form) {
    const options = {
        url: url,
        method: 'POST',
        body: form,
        json:true
    };

    return AsyncRequest(options);
}

function AsyncRequest(options) {
    // Return new promise 
    return new Promise(function (resolve, reject) {
        // Do async job
        if (options.method == "GET") {
            request.get(options, function (err, resp, body) {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            })
        }
        if (options.method == "POST") {
            request.post(options, function (err, resp, body) {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            })
        }
    })
}
module.exports = router;