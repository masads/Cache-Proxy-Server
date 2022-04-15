const express = require("express");
const NodeCache = require("node-cache");
const myCache = new NodeCache();
const app = express();
const port = 9000;

const routes = express.Router();
const { exec } = require("child_process");

const blockedSites = [
  "www.facebook.com",
  "www.youtube.com",
  "www.twitter.com",
  "www.instagram.com",
];

app.use("/public", express.static("public"));
routes.get("/", (req, res) => {
  site = req.query["site"];
  if (blockedSites.includes(site)) {
    let list = "";
    for (let site in blockedSites) {
      list += `<li>${blockedSites[site]}</li>`;
    }

    res.send(`<html>
    <head>
      <title>Site Blocked</title>
    </head>
    <body>
      <h1
        style="
          color: white;
          background-color: red;
          padding: 20px;
          text-align: center;
        "
      >
        SITE IS BLOCKED
      </h1>
      <h2 style="text-align: center">HERE IS THE LIST OF BLOCKED SITES</h2>
      <ul style="list-style: none; text-align:center; font-size:20px">${list}</ul>
    </body>
  </html>
  `);
  } else {
    console.log(site);
    if (myCache.get(site)) {
      console.log("in cache");
      res.sendFile(__dirname + `/public/${site}/index.html`);
    } else {
      console.log(site, "not in cache");

      let wget = exec(
        `wget -np -N -k -p -nd -nH -H -E --no-check-certificate -e robots=off -U 'Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.1.6) Gecko/20070802 SeaMonkey/1.1.4' --directory-prefix=public/${site} --reject js  --accept html,css ${site}`,
        (error, stdout, stderr) => {
          if (error) {
            console.log(error.stack);
            console.log("Error code: " + error.code);
            console.log("Signal received: " + error.signal);
          }
          console.log("Child Process STDOUT: " + stdout);
          console.log("Child Process STDERR: " + stderr);
        }
      );
      wget.on("exit", function (code) {
        console.log("Child process exited with exit code " + code);
        success = myCache.set(site, true, 10000);
        res.sendFile(__dirname + `/public/${site}/index.html`);
      });
    }
  }
});
app.use(routes);
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});