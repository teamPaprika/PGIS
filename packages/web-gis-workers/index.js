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

if (admin.apps.length === 0) {
  admin.initializeApp();
}

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

app.get('/installPackages', (req, res) => {
  const { exec } = require('child_process');
  exec("Rscript ./src/demo/00_installpackages.R", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
})





app.post('/addRecord', async (req, res) => {
  const allowedSources = ['Libergon', 'Libergon-dev'];
  function generateAccessHash(sourceString) {
    const salt = 'Paprika';
    return Buffer.from(createHash('sha256').update(sourceString + salt).digest('hex')).toString('base64');
  }

  const allowedSourcesHMAC = allowedSources.map(source => {
    return generateAccessHash(source);
  });
  // if (req.method !== 'POST') {
  //   res.status(405);
  // }
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
  const rawDataRef = admin.firestore().collection('rawDataStreams');
  await rawDataRef.add(rawData);
  res.status(200);
})



const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`web-gis-workers: listening on port ${port}`);
});


// [END run_helloworld_service]
// [END cloudrun_helloworld_service]

// Exports for testing purposes.