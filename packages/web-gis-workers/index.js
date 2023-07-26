// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START cloudrun_helloworld_service]
// [START run_helloworld_service]
const admin = require('firebase-admin');
const express = require('express');
const { createHash } = require("crypto");
const app = express();
const util = require('util');
const exec = util.promisify(require('child_process').exec);

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const allowedSources = ['Libergon', 'Libergon-dev'];
function generateAccessHash(sourceString) {
  const salt = 'Paprika';
  return Buffer.from(createHash('sha256').update(sourceString + salt).digest('hex')).toString('base64');
}

const allowedSourcesHMAC = allowedSources.map(source => {
  return generateAccessHash(source);
});

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

// app.get('/installPackages', (req, res) => {
//
//   exec("Rscript ./src/demo/00_installpackages.R", (error, ) => {
//     if (error) {
//       console.log(`error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.log(`stderr: ${stderr}`);
//       return;
//     }
//     console.log(`stdout: ${stdout}`);
//   });
// })

app.get('/Rdemo02', async (req, res) => {

  // exec("Rscript ./src/demo/02_trajectories.R", (error, stdout, stderr) => {
  //   if (error) {
  //     console.log(`error: ${error.message}`);
  //     res.send(`error: ${error.message}`);
  //     return;
  //   }
  //   if (stderr) {
  //     console.log(`stderr: ${stderr}`);
  //     res.send(`stderr: ${stderr}`);
  //     return;
  //   }
  //   console.log(`stdout: ${stdout}`);
  //   res.send(`stdout: ${stdout}`);
  // })
  const {stdout, stderr} = await exec("Rscript ./src/demo/02_trajectories.R");
  console.log(`stdout: ${stdout}`, `stderr: ${stderr}`);
})

app.put('/Rdemo02', async (req, res) => {
  // get file from request
  const file = req.body;

  // write file to disk as demo02.csv
  const fs = require('fs');
  await fs.writeFile('./src/demo/demo02.csv', file, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
  const {stdout, stderr} = await exec("Rscript ./src/demo/02_trajectories.R");
  console.log(`stdout: ${stdout}`, `stderr: ${stderr}`);




})

app.get('/getRecords', async (req, res) => {
  const token = req.get('Authorization');
  if (! token) {
    res.status(401);
  }
  if (! allowedSourcesHMAC.includes(token)) {
    res.status(403);
  }

  const rawDataRef = allowedSourcesHMAC[1] === token ? admin.firestore().collection('rawDataStreams-dev') : admin.firestore().collection('rawDataStreams');
  const rawData = await rawDataRef.get();
  const rawDataArray = rawData.docs.map(doc => doc.data());
  res.send(rawDataArray);
})




app.post('/addRecord', async (req, res) => {




  // Check if the request comes from an allowed source, via Header Token
  const token = req.get('Authorization');
  if (! token) {
    res.status(401);
  }
  if (! allowedSourcesHMAC.includes(token)) {
    res.status(403);
  }

  // write all body to firestore collection 'rawDataStreams'
  const rawData = req.body;
  let rawDataRef = admin.firestore().collection('rawDataStreams');
  if (token === allowedSourcesHMAC[1]) {
    rawDataRef = admin.firestore().collection('rawDataStreams-dev');
  }
  await rawDataRef.add({ ...rawData});
  res.status(200);
})



const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`web-gis-workers: listening on port ${port}`);
});


// [END run_helloworld_service]
// [END cloudrun_helloworld_service]

// Exports for testing purposes.