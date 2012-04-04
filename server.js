var http = require("http"),
	https = require("https"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    argv = process.argv,
    args = {
		domain: "apps",
		app: "KwnzC0J1iaSKWsR9NOS-7D9G",
		port: 8888
	},
	mimeTypes = {
		js: "text/javascript",
		css: "text/css",
		html: "text/html",
		xml: "text/xml"
	};

for(var i = 0, il = argv.length; i < il; i++) {
	var param = argv[i].split("=");

	if(param.length === 2) {
		args[param[0]] = param[1];
	}
}


var injection = ['<script src="https://' + args.domain + '.feedhenry.com/static/pec/script/studio/155-scripts.js"></script>',
'<script src="js/stacktrace.js"></script>',
'<script src="js/EventEmitter.js"></script>',
'<script src="js/ErrorStore.js"></script>',
'<script src="js/fh-testing.js"></script>',
'<script>',
'        $fhclient = $fh.init({',
'            "appMode":"debug",',
'            "checkDeliveryScheme":true,',
'            "debugCloudType":"fh",',
'            "debugCloudUrl":',
'            "https://' + args.domain + '.feedhenry.com",',
'            "deliveryScheme":"https://",',
'            "destination":{',
'                "inline":false,',
'                "name":"studio"',
'            },',
'            "domain": "' + args.domain + '",',
'            "host": "' + args.domain + '.feedhenry.com",',
'            "nameserver":"https://ainm.feedhenry.com",',
'            "releaseCloudType":"fh",',
'            "releaseCloudUrl":"https://' + args.domain + '.feedhenry.com",',
'            "swagger_view":"Sju8tJFwM7kox_S1rr1wZ2PS",',
'            "urltag":"",',
'            "useSecureConnection":true,',
'            "user":{',
'                "id":"YqxcBngHv4nt3j1VstTjQj0X",',
'                "role":"sub"',
'            },',
'            "widget":{',
'                "guid": "' + args.app + '",',
'                "inline":false,',
'                "instance": "' + args.app +'",',
'                "version":328',
'            }',
'        });',
'</script>'].join('');


http.createServer(function(request, response) {

	var uri = url.parse(request.url).pathname,
		filename = path.join(process.cwd(), uri),
		post = [];

	request.on("data", function(chunk) {
		post.push(chunk.toString());
	});

	request.on("end", function() {
		path.exists(filename, function(exists) {
			if(!exists && uri.indexOf("/box/srv/") !== -1) {

				post = post.join('');

				var proxyReq = https.request({
					path: request.url,
					method: request.method,
					host: args.domain + ".feedhenry.com",
					headers: {
						"content-length": post.length,
						"content-type": "application/json"
					}
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
				response.writeHead(404,"");
				response.write("derp");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) 
				filename += '/index.html';

			fs.readFile(filename, "binary", function(err, file) {
				if(err) {        
					response.writeHead(500, {
						"Content-Type": "text/plain"
					});
					response.write(err + "\n");
					response.end();
					return;
				}

				response.writeHead(200,{
					"Content-Type": mimeTypes[filename.split(".").pop()] || "text/plain"
				});
				if(filename.indexOf("index.html") > 0) {
					response.write(injection);
				}
				response.write(file, "binary");
				response.end();
			});
		});
	});
}).listen(parseInt(args.port, 10));
