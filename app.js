/* eslint-disable no-unused-vars */
/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
var express = require('express');
var app = express();
var LanguageTranslatorV3 = require('watson-developer-cloud/language-translator/v3');
const AuthorizationV1 = require('ibm-watson/authorization/v1');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const vcapServices = require('vcap_services');
const cors =require('cors');
const IamTokenManagerV1 = require('watson-developer-cloud/iam-token-manager/v1');




// Bootstrap application settings
require('./config/express')(app);

var translator = new LanguageTranslatorV3({
  // If unspecified here, the LANGUAGE_TRANSLATOR_USERNAME and LANGUAGE_TRANSLATOR_PASSWORD environment properties will be checked
  // LANGUAGE_TRANSLATOR_IAM_APIKEY if apikey is present
  // After that, the SDK will fall back to the ibm-cloud-provided VCAP_SERVICES environment property
  // username: '<username>',
  // password: '<password>'
  version: '2018-05-01',
  headers: {
    'X-Watson-Technology-Preview': '2018-05-01',
    'X-Watson-Learning-Opt-Out': true,
  },
});

// render index page
app.get('/', function(req, res) {
  // If hide_header is found in the query string and is set to 1 or true,
  // the header should be hidden. Default is to show header
  res.render('index', {
    hideHeader: !!(req.query.hide_header == 'true' || req.query.hide_header == '1'),
  });
});

app.get('/api/models', function(req, res, next) {
  console.log('/v3/models');
  translator.listModels()
    .then(models => res.json(models))
    .catch(error => next(error));
});

app.post('/api/identify', function(req, res, next) {
  console.log('/v3/identify');
  translator.identify(req.body)
    .then(models => res.json(models))
    .catch(error => next(error));
});

app.get('/api/identifiable_languages', function(req, res, next) {
  console.log('/v3/identifiable_languages');
  translator.listIdentifiableLanguages(req.body)
    .then(models => res.json(models))
    .catch(error => next(error));
});

app.post('/api/translate', function(req, res, next) {
  console.log('/v3/translate');
  translator.translate(req.body)
    .then(models => res.json(models))
    .catch(error => next(error));
});


//======================================================speech_to_text==============================================================



let tokenManager_speech_text;
let instanceType;
const serviceUrl = process.env.SPEECH_TO_TEXT_URL || 'https://stream-fra.watsonplatform.net/speech-to-text/api/v1/recognize';

if (process.env.SPEECH_TO_TEXT_IAM_APIKEY && process.env.SPEECH_TO_TEXT_IAM_APIKEY !== '') {
  instanceType = 'iam';
  tokenManager_speech_text = new IamTokenManagerV1({
    iamApikey: process.env.SPEECH_TO_TEXT_IAM_APIKEY || '0_IEnQGV5N8Zklc8R8zEt42f9-PbXxc2nGY3dY22wLtb',
    iamUrl: process.env.SPEECH_TO_TEXT_IAM_URL || 'https://iam.cloud.ibm.com/identity/token',
  });
} else {
  instanceType = 'cf';
  const speechService = new SpeechToTextV1({
    username: process.env.SPEECH_TO_TEXT_USERNAME || '<username>',
    password: process.env.SPEECH_TO_TEXT_PASSWORD || '<password>',
    url: serviceUrl,
  });
  tokenManager_speech_text = new AuthorizationV1(speechService.getServiceCredentials());}
app.use('/api/speech-to-text/token', function(req, res) {
  console.log('hello');
  tokenManager_speech_text.getToken((err, token) => {
    if (err) {
      //next(err);
      console.log('error');
    } else {
      let credentials;
      if (instanceType === 'iam') {
        credentials = {
          accessToken: token,
        };
      } else {
        credentials = {
          token: token.token,
        };
      }
      res.json(credentials);
    }
  });

});

//=============================================TEXT_TO_SPEECH======================================================================




let tokenManager_text_speech;

if (process.env.TEXT_TO_SPEECH_IAM_APIKEY && process.env.TEXT_TO_SPEECH_IAM_APIKEY !== '') {
  instanceType = 'iam';
  tokenManager_text_speech = new IamTokenManagerV1({

    iamApikey: process.env.TEXT_TO_SPEECH_IAM_APIKEY || 'Trp_vjS2Gi3e7ujb-71s0aRLTt0tsdpMqDVSKtWf-VCF',
    iamUrl: process.env.TEXT_TO_SPEECH_IAM_URL || 'https://iam.cloud.ibm.com/identity/token',
  });
} 
//tokenManager_text_speech = new AuthorizationV1(speechService.getServiceCredentials());

app.use('/api/text-to-speech/token', function(req, res) {
  console.log('hello');
  tokenManager_text_speech.getToken((err, token) => {
    if (err) {
      //next(err);
      console.log('error');
    } else {
      let credentials;
      if (instanceType === 'iam') {
        credentials = {
          accessToken: token,
        };
      } else {
        credentials = {
          token: token.token,
        };
      }
      res.json(credentials);
    }
  });

});
// express error handler
require('./config/error-handler')(app);
module.exports = app;
app.use(cors);




