var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring'); // 쿼리 값을 가져온다.
var template = require('./lib/template.js'); // 모듈화한 스크립트 파일을 가져온다.
var path = require('path'); // 경로를 표시하지 않게 해준다.
var sanitizeHtml = require('sanitize-html'); // 결점이 있는 스크립트를 걸러준다.

// 웹 서버 생성
var app = http.createServer(function(request, response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    
    // 현재 페이지의 절대 경로가 표시된다.
    //console.log(__dirname + url);
    // 해당 경로에 해당하는 파일을 읽어서 웹페이지로 보여준다.
    //response.end('test : ' + url);
    //response.end(fs.readFileSync(__dirname + _url));

    if(pathname === '/') {
        if(queryData.id === undefined) {
            fs.readdir('./data', function(error, filelist){
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = template.list(filelist);
                var html = template.html(title, list, 
                    `<h2>${title}</h2>${description}`, 
                    `<a href="/create">create</a>`
                );
                
                response.writeHead(200);
                response.end(html);
            })
        } else {
            fs.readdir('./data', function(error, filelist){
                var filteredId = path.parse(queryData.id).base;
                // 파일 읽어서 가져오기
                fs.readFile(`data/${filteredId}`, 'utf-8', function(err, description){
                var title = queryData.id;
                var sanitizedTitle = sanitizeHtml(title);
                var sanitizedDescription = sanitizeHtml(description, {
                    allowedTags: ['h1'] // 해당 태크는 허용한다.
                });
                var list = template.list(filelist);
                var html = template.html(title, list, 
                    `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`, 
                    `<a href="/create">create</a>
                    <a href="/update?id=${sanitizedTitle}">update</a>
                    <form action="delete_process" method="post">
                        <input type="hidden" name="id" value="${sanitizedTitle}">
                        <input type="submit" value="delete">
                    </form>`
                );
                
                response.writeHead(200);
                response.end(html);
                });
            })
        }
    } else if (pathname === '/create') {
        fs.readdir('./data', function(error, filelist){
            var title = 'WEB - create';
            var list = template.list(filelist);
            var html = template.html(title, list, `
                    <form action="/create_process" method="POST">
                    <p><input type="text" name="title" placeholder="title"></p>
                    <p>
                        <textarea name="description" placeholder="description"></textarea>
                    </p>
                    <p>
                        <input type="submit">
                    </p>
                    </form>
                    `, ''
                );
            
            response.writeHead(200);
            response.end(html);
        })
    } else if (pathname === '/create_process') {
        var body = '';

        // 웹브라우저가 post 방식으로 데이터를 전송할 때 너무 많으면 무리가 가는 문제가 생겨서 데이터가 많을 경우를 대비해 사용
        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            // 데이터가 너무 많을 경우 접속 해제
            // if (body.length > 1e6)
            //     request.connection.destroy();
        });

        // 데이터 수신이 끝난 상태
        request.on('end', function () {
            var post = qs.parse(body);
            //console.log(post);
            var title = post.title;
            var description = post.description;

            fs.writeFile(`data/${title}`, description, 'utf-8', 
            function(err){
                response.writeHead(302, {Location: `/?id=${title}`});
                response.end('success');
            });
            // use post['blah'], etc.
        });
    } else if (pathname === '/update') {
        fs.readdir('./data', function(error, filelist){
            var filteredId = path.parse(queryData.id).base;
            fs.readFile(`data/${filteredId}`, 'utf-8', function(err, description){
                var title = queryData.id;
                var list = template.list(filelist);
                var html = template.html(title, list, 
                    `
                    <form action="/update_process" method="POST">
                        <input type="hidden" name="id" value="${title}">
                        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                        <p>
                            <textarea name="description" placeholder="description">${description}</textarea>
                        </p>
                        <p>
                            <input type="submit">
                        </p>
                        </form>
                    ` , 
                    `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
                );
                
                response.writeHead(200);
                response.end(html);
                });
        });
} else if (pathname === '/update_process') {
        var body = '';

        // 웹브라우저가 post 방식으로 데이터를 전송할 때 너무 많으면 무리가 가는 문제가 생겨서 데이터가 많을 경우를 대비해 사용
        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            // 데이터가 너무 많을 경우 접속 해제
            // if (body.length > 1e6)
            //     request.connection.destroy();
        });

        // 데이터 수신이 끝난 상태
        request.on('end', function () {
            var post = qs.parse(body);
            //console.log(post);
            var id = post.id;
            var title = post.title;
            var description = post.description;
            var filteredId = path.parse(id).base;
            var filteredTitle = path.parse(title).base;

            fs.rename(`data/${filteredId}`, `data/${filteredTitle}`, function(error) {
                // 에러 처리
                fs.writeFile(`data/${title}`, description, 'utf-8', 
                function(err){
                    response.writeHead(302, {Location: `/?id=${title}`});
                    response.end('success');
                });
            });
        });
    } else if (pathname === '/delete_process') {
        var body = '';

        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            // 데이터가 너무 많을 경우 접속 해제
            // if (body.length > 1e6)
            //     request.connection.destroy();
        });

        // 데이터 수신이 끝난 상태
        request.on('end', function () {
            var post = qs.parse(body);
            var id = post.id;
            var filteredId = path.parse(id).base;

            fs.unlink(`data/${filteredId}`, function(error) {
                response.writeHead(302, {Location: `/`});
                response.end();
            });
        });

    } else {
        response.writeHead(404);
        response.end('Not found');
    }
    
});

// 포트 3000 으로 동작하게 한다.
app.listen(3000);