const functions = require("firebase-functions");
const { createHash } = require("crypto");
const admin = require("firebase-admin");

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express API for PGIS',
    version: '1.0.0',
  },
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./routes/*.js'],
  servers: [
    // {
    //   url: 'https://us-central1-eco-web-gis.cloudfunctions.net/dataApi'
    // },
    {
      url: 'http://127.0.0.1:5001/eco-web-gis/us-central1/workers',
      description: 'Development server',
    },
  ]
};
const swaggerSpec = swaggerJSDoc(options);
const app = express();

app.use('.eco-web-gis/us-central1/workers/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.put('/Rdemo', async (req, res) => {
  // get File from request
  const file = req.body;

  // write file to src/demo/data.csv
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'src/demo/data.csv');
  fs.writeFile(filePath, file, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

  // run R script
  const { exec } = require('child_process');





});


app.post('/pingRawData', async (req, res) => {
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
});

// exports.acceptRawDataFromSensors = functions.https.onRequest(async (req, res) => {
//   const allowedSources = ['Libergon', 'Libergon-dev'];
//
//   function generateAccessHash(sourceString) {
//     const salt = 'Paprika';
//     return Buffer.from(createHash('sha256').update(sourceString + salt).digest('hex')).toString('base64');
//   }
//
//   const allowedSourcesHMAC = allowedSources.map(source => {
//     return generateAccessHash(source);
//   });
//   if (req.method !== 'POST') {
//     res.status(405);
//   }
//   // Check if the request comes from an allowed source, via Header Token
//   const token = req.get('Authorization');
//   if (! token) {
//     res.status(401);
//   }
//   if (! allowedSourcesHMAC.includes(token)) {
//     res.status(403);
//   }
//
//   // write all body to firestore collection 'rawDataStreams'
//   const rawData = req.body;
//   const rawDataRef = admin.firestore().collection('rawDataStreams');
//   await rawDataRef.add(rawData);
//   res.status(200);
// });

exports.dataApi = functions.https.onRequest(app);
