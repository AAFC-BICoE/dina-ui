const express = require('express')
const next = require('next')
const nextI18NextMiddleware = require('next-i18next/middleware')

const nextI18next = require('./i18n')

const cors = require('cors')

const port = process.env.PORT || 3000
const app = next({ dev: process.env.NODE_ENV !== 'production' })
const handle = app.getRequestHandler();
const { parse } = require('url');

(async () => {
  await app.prepare()
  const server = express()
  server.use(nextI18NextMiddleware(nextI18next))
  //server.options('*', cors())


  /*var corsOptions = {
    origin: 'http://localhost:8080/login,http://localhost:9999',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }*?

  //server.use(cors(corsOptions))
  /* Second, declare custom routes */
  //server.get('/api*', cors(corsOptions), (req, res) => {
  /*server.get('/api*', cors(), (req, res) => {
    console.log("header is " + req.headers)
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;
    console.log("parsedUrl is " + req.url);
    console.log("pathname is " + pathname);
    res.setHeader("Access-Control-Allow-Origin", "*");
    //return app.render(req, res, 'http://127.0.0.1:8080' + pathname, query)
    //res.send(app.render(req, res, 'http://127.0.0.1:9999/127.0.0.1:8080' + pathname, query))
    //console.log("http://127.0.0.1:9999/127.0.0.1:8080/' + req.url" + 'http://127.0.0.1:9999/127.0.0.1:8080' + req.url)


    res.redirect('http://127.0.0.1:9999/127.0.0.1:8080' + req.url)

    //res.redirect('http://localhost:8080' + req.url)
    //handle(req, res);
    //res.redirect('http://localhost:8080' + req.url)
    //return;
  })*/

  server.get('*', (req, res) => handle(req, res))

  await server.listen(port)
  console.log(`> Ready on http://localhost:${port}`) // eslint-disable-line no-console
})()
