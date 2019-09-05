const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const ZENODO_URL = 'https://zenodo.org/api/deposit/depositions';
const GITHUB_URL = 'https://api.github.com';

app.post('/getDoi', (req, response) => {
  console.log('Request /getDoi received');
  response.setHeader('Content-Type', 'application/json');
  const data = req.body;

  if (!data.token || !data.token.trim()) {
    response.send(JSON.stringify({
        'status': 0,
        'message': 'Invalid token!'
    }));
    return;
  }

  fetch(ZENODO_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${data.token}`
    },
    body: JSON.stringify({})
  })
    .then(res => res.json())
    .then(res => {
      console.log(res);
      response.send(JSON.stringify({
        'status': 1,
        'message': res.metadata.prereserve_doi.doi
      }))
    })
    .catch(err => {
      console.log("Error occurred!", err);
      response.send(JSON.stringify({
        'status': 0,
        'message': 'Error!'
      }))
    })
})

app.post('/generateCff', (req, response) => {
  console.log('Request /generateCff received');
  response.setHeader('Content-Type', 'application/json');
  const data = req.body;

  function getDate () {
    let date = new Date();
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() + (offset*60*1000));
    return date.toISOString().split('T')[0];
  }

  function parseGithubUrl (url) {
    url = url.toLowerCase();
    url = url.slice(url.indexOf('github'));
    if (url[url.length-1] == '/')
      url = url.slice(0, -1);
    url = url.split('/');
    return {
      owner: url[1],
      repo: url[2]
    }
  }

  if (!data.doi || !data.doi.trim()) {
    response.send(JSON.stringify({
        'status': 0,
        'message': 'Invalid doi!'
    }));
    return;
  }

  if (!data.githubUrl || !data.githubUrl.trim()) {
    response.send(JSON.stringify({
        'status': 0,
        'message': 'Invalid GitHub URL!'
    }));
    return;
  }

  if (!data.version || !data.version.trim()) {
    response.send(JSON.stringify({
        'status': 0,
        'message': 'Invalid version!'
    }));
    return;
  }

  let todaysDate = getDate();

  let cff = {
    "cff-version": "1.0.0",
    "doi": data.doi,
    "date-released": todaysDate,
    "version": data.version
  }

  githubUrl = parseGithubUrl(data.githubUrl);

  fetch(GITHUB_URL+`/repos/${githubUrl.owner}/${githubUrl.repo}`, {
    method: 'GET'
  })
    .then(res => {
      if (res.status == 200)
        return res.json();
      else {
        response.send(JSON.stringify({
          status: 0,
          message: 'Error getting details from GitHub'
        }))
      }
    })
    .then(res => {
      cff.title = res.name;
      cff.message = res.description;

      let ymlText = json2yaml(cff);
      const randomFolder = `${cff.title.trim()}${Math.floor(Math.random()*100000)}`;
      const dataDirName = path.resolve(__dirname, 'public/data');

      if (!fs.existsSync(dataDirName)){
          fs.mkdirSync(dataDirName);
      }

      const dirName = path.resolve(dataDirName, randomFolder);
      if (!fs.existsSync(dirName)){
        fs.mkdirSync(dirName);
      }

      const yamlFileUrl = path.resolve(dirName, 'CITATION.yml');
      fs.writeFileSync(yamlFileUrl, ymlText);

      const jsonText = cffToZenodoJson(cff);
      const jsonFileUrl = path.resolve(dirName, 'zenodo.json');
      fs.writeFileSync(jsonFileUrl, JSON.stringify(jsonText, null, 2));

      response.send(JSON.stringify({
        status: 1,
        message: `/data/${randomFolder}`
      }))
    })
    .catch(err => {
      console.log(err);
      response.send(JSON.stringify({
        status: 0,
        message: 'Error getting details from GitHub'
      }))
    })

})

function json2yaml (json) {
  let yaml = "";
  for (let key in json) {
    if (typeof json[key] == "string")
      yaml += `${key}: "${json[key]}"\n`
    else {
      yaml += `${key}:\n`;
      let obj = json[key];
      for (let key in obj) {
        // if (typeof obj[key] == "string")
        yaml += `\t- ${key}: "${obj[key]}"\n`;
      }
    }
  }

  return yaml;
}

function cffToZenodoJson (cff) {
  let obj = {};

  obj.version = cff.version;
  obj.title = cff.title;
  obj.doi = cff.doi;
  obj.created = cff["date-released"];

  return obj;
}

app.listen(process.env.port || 8000);
console.log("App hosted on localhost:8000");