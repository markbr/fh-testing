var http = require("http"),
	https = require("https"),
	url = require("url"),
	path = require("path"),
	fs = require("fs"),
	argv = process.argv,
	args = {
		baseDomain: ".feedhenry.com",
		//default domain
		domain: "apps",
		//app guid
		app: "",
		//default port
		port: 8888
	},
	//small subset of mime types so to prevent warnings in chrome
	mimeTypes = {
		js: "text/javascript",
		css: "text/css",
		html: "text/html",
		xml: "text/xml",
		txt: "text/plain"
	};



//parse the parameters
for(var i = 0, il = argv.length; i < il; i++) {
	var param = argv[i].split("=");

	if(param.length === 2) {
		args[param[0]] = param[1];
	}
}

var domain = args.domain + args.baseDomain,
	viewportTag = '<meta name="viewport" content="initial-scale = 1.0,maximum-scale = 1.0" />',
	browserScript = '<script src="https://' + domain + '/static/pec/script/studio/155-scripts.js"></script>',
	//the device script is loaded from the device because it includes phonegap which the browser does not need
	deviceScript = '<script src="fhext/js/container.js"></script><script src="js/shake.js"></script><script>window.addEventListener("shake", function() { window.location = "file:///android_asset/www/index.html"}, false);</script>',
	initialiseScript =  '<script>' +
	'        $fhclient = $fh.init({' +
	'            "appMode":"debug",' +
	'            "checkDeliveryScheme":true,' +
	'            "debugCloudType":"fh",' +
	'            "debugCloudUrl":' +
	'            "https://' + domain + '",' +
	'            "deliveryScheme":"https://",' +
	'            "destination":{' +
	'                "inline":false,' +
	'                "name":"studio"' +
	'            },' +
	'            "domain": "' + args.domain + '",' +
	'            "host": "' + domain + '",' +
	'            "nameserver":"https://ainm.feedhenry.com",' +
	'            "releaseCloudType":"fh",' +
	'            "releaseCloudUrl":"https://' + domain + '",' +
	'            "swagger_view":"Sju8tJFwM7kox_S1rr1wZ2PS",' +
	'            "urltag":"",' +
	'            "useSecureConnection":true,' +
	'            "user":{' +
	'                "id":"YqxcBngHv4nt3j1VstTjQj0X",' +
	'                "role":"sub"' +
	'            },' +
	'            "widget":{' +
	'                "guid": "' + args.app + '",' +
	'                "inline":false,' +
	'                "instance": "' + args.app +'",' +
	'                "version":328' +
	'            }' +
	'        });' +
	'</script>';

http.createServer(function(request, response) {

	var requestParams = url.parse(request.url, true),
		uri = requestParams.pathname,
		filename = path.join(process.cwd(), uri),
		post = new Buffer(parseInt(request.headers["content-length"], 10)),
		postLen = 0;

	console.log(filename);

	request.on("data", function(chunk) {
		chunk.copy(post, postLen);
		postLen += chunk.length;
	});

	request.on("end", function() {
		path.exists(filename, function(exists) {
			if(!exists && uri.indexOf("/box/srv/") !== -1) {

				var proxyReq = https.request({
					path: request.url,
					method: request.method,
					host: args.domain + args.baseDomain,
					headers: request.headers
				}, function(proxyRes) {
					response.writeHead(proxyRes.statusCode, proxyRes.headers);

					proxyRes.on("data", function(chunk) {
						response.write(chunk);
					});
					proxyRes.on("end", function() {
						response.end();
					});
				});


				proxyReq.write(post);

				proxyReq.end();

				return;
			}
			else if(!exists) {
				response.writeHead(404,{
					"Content-Type": mimeTypes.txt
				});
				response.write("404 Not found");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) 
				filename += '/index.html';

			fs.readFile(filename, "binary", function(err, file) {
				if(err) {        
					response.writeHead(500, {
						"Content-Type": mimeTypes.txt
					});
					response.write(err + "\n");
					response.end();
					return;
				}

				response.writeHead(200,{
					//set the response type or default to text/plain
					"content-type": mimeTypes[filename.split(".").pop()] || mimeTypes.txt
				});
				if(filename.indexOf("index.html") > 0) {
					response.write(viewportTag);
					response.write(requestParams.query.device !== undefined ? deviceScript : browserScript);
					response.write(initialiseScript);
				}
				response.write(file, "binary");
				response.end();
			});
		});
	});
}).listen(parseInt(args.port, 10));
