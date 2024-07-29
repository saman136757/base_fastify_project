import Fastify from 'fastify'
import fastifyHelmet from 'fastify-helmet'
import fastifySwagger from 'fastify-swagger'
import path from 'path'
import fs from 'fs'
import fastifyCors from '@fastify/cors'
import annotations from 'annotations'
import JWTServices from '../src/microservices/JWTServices.js'
import ApplicationException from '../src/ApplicationException.js'
import fileUpload from 'fastify-multipart'
import {ObjectId} from 'mongodb'
import {MongoDbServices} from '../src/microservices/MongoDbServices.js'
import {v4} from 'uuid'
import {MongoError} from 'mongodb'



let fastifyInstance
const prepareFunctionCall = async (req, resp, schema, func, inputs, authenticationLevel, apiPath, transactional) => {
  let timeX = new Date().toLocaleTimeString()
  let timeZ = new Date().getTime()
  try {
    // if (req.validationError) {
    //   resp.status(200)
    //   console.log(timeX, 'validation error')
    //   resp.send(JSON.stringify({code: 400, reason: 'Validation Failed'}))
    //   return
    // }

    let authorization = req.headers.authorization
    let user
    if (authenticationLevel === '1') {
      console.log('authenticationLevel')
      let decodedToken = JWTServices.verifyJWT(authorization)

      if (!decodedToken) {
        resp.status(200)
        resp.send(JSON.stringify({code: 401, reason: 'Wrong token'}))
        console.log(timeX, 'resp', '{"code": 401, "reason": "Wrong token"}')
        return
      }
      user = decodedToken
    }
    if (authenticationLevel === '2') {
      if (authorization.indexOf('$') !== -1) {
        resp.status(401)
        resp.send('{"code": 403, "reason": "XSE W2AR"}')
        return
      }
      let decodedToken = JWTServices.verifyJWT(authorization)
      if (!decodedToken) {
        resp.status(401)
        resp.send('{"code": 403, "reason": "Wrong token"}')
        return
      }
      if (decodedToken.type.indexOf('admin') === -1) {
        resp.status(401)
        resp.send('{"code": 403, "reason": "Wrong token"}')
        return
      }
      user = decodedToken
    }
    let compositeInputs = {}
    if (schema.params) {
      for (let i in schema.params.properties) {
        compositeInputs[i] = req.params[i]
      }
    }
    if (schema.body && apiPath.indexOf('upload') === -1) {
      for (let i in schema.body.properties) {
        compositeInputs[i] = req.body[i]
      }
    }
    let compositeInputList = []
    for (let i in inputs) {
      if (inputs[i].source === 'session') {
        if (inputs[i].name === 'userId') {
          compositeInputList.push(new ObjectId(user.userId))
        }
      } else if (inputs[i].source === 'request') {
        compositeInputList.push(req)
      } else if (inputs[i].type2 === 'ObjectId') {
        compositeInputList.push(new ObjectId(compositeInputs[inputs[i].name]))
      } else compositeInputList.push(compositeInputs[inputs[i].name])
    }
    for (let i of compositeInputList) {
      if (typeof i === 'string') {
        if (i.indexOf('$') !== -1) {
          resp.status(400)
          resp.send('{"code": 400, "reason": "XSE W2AR"}')
          return
        }
      } else if (i) {
        if (i.toString().indexOf('$') !== -1) {
          resp.status(400)
          resp.send('{"code": 400, "reason": "XSE W2AR"}')
          return
        }
      }
    }

    if (transactional) {
      transactional = await MongoDbServices.startSession()
    }
    try {
      let context = {transactionId: v4()}

      let response
      if (transactional) {
        context.session = transactional
        compositeInputList.push(context)
        await transactional.withTransaction(async () => {
          return (response = await func.apply({}, compositeInputList))
        })
      } else {
        compositeInputList.push(context)

        response = await func.apply({}, compositeInputList)
      }
      if (transactional) {
        transactional = transactional.endSession()
      }
      if (response) {
        // resp.log(response)
        req.log.info(timeX + ' : ' + JSON.stringify({response, spanId: 2000}))
        req.log.info(timeX + ' , time elapsed :' + (new Date().getTime() - timeZ))
        console.log(timeX, 'resppp', response, new Date().getTime() - timeZ)
        response.code = 200
        resp.send(response)
        return
      }
      req.log.info(timeX + ' , time elapsed :' + (new Date().getTime() - timeZ))
      console.log(timeX, 'finished ', new Date().getTime() - timeZ)
      resp.status(204)
      resp.send()
    } catch (e) {
      console.log('err', e)
      try {
        // await transactional.abortTransaction()
        if (transactional) transactional.endSession()
      } catch (e) {
        console.log('error ending transaction', e)
      }
      if (e instanceof ApplicationException) {
        console.log('application exception')
        resp.status(e.httpCode)
        req.log.error(e)
        resp.send(JSON.stringify({code: e.errorCode, reason: e.errorMessage}))
        return
      } else if (e instanceof MongoError) {
        console.log('MongoError', e)
        if (e.message.indexOf('validation') !== -1) {
          resp.status(400)
          req.log.error(e)
          resp.send(JSON.stringify({reason: 'Validation Failed', code: 418}))
          return
        } else if (e.message.indexOf('duplicate') !== -1) {
          resp.status(400)
          req.log.error(e)
          resp.send(JSON.stringify({reason: 'Wrong Data', code: 419}))
          return
        } else {
          resp.status(500)
          req.log.error(e)
          resp.send()
          return
        }
      } else {
        console.log('unhandled error', e)
        req.log.error({critical: 'unhandled error', e: e})
        resp.status(500)

        resp.send()
        return
      }
    }
  } catch (e) {
    console.log('unhandled error2', e)
    req.log.error({critical: 'unhandled error', e: e})
    resp.status(500)
    resp.send('Internal Error')
    return
  }
}
export const initHttpServer = async () => {


  fastifyInstance = fastify

  fastify.register(fastifySwagger, {
    hiddenTag: 'X-HIDDEN',
    exposeRoute: true,
    openapi: {
      info: {
        title: 'Educational Site!',
        description: 'Educational Site Exposed APIS',
        version: '3.0.3',
      },
    },
    routePrefix: '/api/uigenerator/documentations',
  })

  await fastify.register(fastifyCors, {
    origin: ['http://localhost'],
    origin: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'xsrf-token', 'set-cookie'], // 'auhtorizationlize'
  })

  let compositePaths = fs.readdirSync('./src/compositeservices')
  try {
    for (let file of compositePaths) {
      let s = await import('../src/compositeservices/' + file)
      let w = await annotations.get('./src/compositeservices/' + file)
      for (let o in w) {
        let method = w[o].method
        let path = w[o].path
        let authenticationLevel = w[o].authenticationLevel
        let pathParams = []
        let bodyParam = []
        let inputs = w[o].inputs
        let outputs = w[o].outputs
        try {
          if (typeof outputs === typeof []) {
            for (let p in outputs) {
              outputs[p] = JSON.parse(outputs[p])
            }
          } else if (typeof outputs === typeof '') {
            outputs = [JSON.parse(outputs)]
          } else {
            outputs = false
          }
        } catch (e) {
          outputs = false
        }
        if (typeof inputs === typeof []) {
          let s = []
          for (let i in inputs) {
            s.push(JSON.parse(inputs[i]))
          }
          inputs = s
        } else if (inputs) {
          inputs = [JSON.parse(inputs)]
        }
        let multipart = {}
        if (inputs)
          for (let i in inputs) {
            if (inputs[i].source === 'path') {
              pathParams.push(inputs[i])
            } else if (inputs[i].source === 'body') {
              bodyParam.push(inputs[i])
            } else if (inputs[i].source === 'request') {
              bodyParam.push('request')
              // multipart[bodyParam.length-1] = (inputs[i])
            }
          }
        let schema = {}
        schema.tags = [file]
        if (pathParams[0]) {
          schema.params = {}
          for (let i in pathParams) {
            schema.params[pathParams[i].name] = {
              type: pathParams[i].type,
              description: pathParams[i].description || 'asdas',
            }
          }
        }
        if (bodyParam[0]) {
          schema.body = {type: 'object', properties: {}}
          for (let i in bodyParam) {
            if (bodyParam[i] === 'request') {
              console.log('multipart[i]', multipart[i])
              console.log('multipart', multipart)
              console.log('i', i)
            } else {
              schema.body.properties[bodyParam[i].name] = {
                type: bodyParam[i].type,
                description: bodyParam[i].description,
              }
              if (bodyParam[i].enum) {
                schema.body.properties[bodyParam[i].name].enum = bodyParam[i].enum
              }
            }
            if (bodyParam[i].type === 'array') {
              schema.body.properties[bodyParam[i].name].items = bodyParam[i].items
            }
            if (bodyParam[i].type === 'object') {
              schema.body.properties[bodyParam[i].name].properties = bodyParam[i].properties
            }
          }
        }
        schema.response = {
          400: {
            description: 'General Error',
            type: 'object',
            properties: {
              reason: {type: 'string'},
              code: {type: 'number'},
            },
          },
          500: {
            description: 'Application Exception',
            type: 'object',
            properties: {
              reason: {type: 'string'},
              code: {type: 'number'},
            },
          },
        }
        if (outputs) {
          schema.response[200] = {
            description: w[o].okResponse || 'OK response',
            type: 'object',
            properties: {},
          }
          for (let i in outputs) {
            schema.response[200].properties[outputs[i].name] = {
              type: outputs[i].type,
            }
            if (outputs[i].type === 'array') {
              schema.response[200].properties[outputs[i].name].items = outputs[i].items
            }
          }
        } else {
          schema.response[204] = {
            description: w[o].okResponse || 'No Body',
            type: 'object',
            properties: {
              reason: {type: 'string'},
              code: {type: 'number'},
            },
          }
        }
        if (authenticationLevel > 0) {
          schema.headers = {
            type: 'object',
            required: ['token'],
            properties: {
              // Fastify lowercases all headers https://github.com/fastify/help/issues/71
              token: {type: 'string'},
            },
          }
          schema.response[401] = {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              reason: {type: 'string'},
              code: {type: 'number'},
            },
          }
          schema.response[403] = {
            description: 'Forbidden',
            type: 'object',
            properties: {
              reason: {type: 'string'},
              code: {type: 'number'},
            },
          }
        }
        let transactional = !!w[o].transactional

        if (w[o].errorCode) {
          w[o].errorCode = JSON.parse(w[o].errorCode)
          w[o].reason = JSON.parse(w[o].reason)
          schema.response[400] = {
            description: 'Unauthorized',
            type: 'object',
            properties: {
              reason: {type: 'string', enum: w[o].reason},
              code: {type: 'number', enum: w[o].errorCode},
            },
          }
        }
        try {
          console.log('registering: ', path)
          if (path.indexOf('upload') !== -1) {
            schema.consumes = ['multipart/form-data']
            schema.path = {title: {type: 'string'}}
            fastify[method](path, {attachValidation: true}, async (req, resp) =>
              prepareFunctionCall(req, resp, schema, s[o], inputs, authenticationLevel, path, transactional)
            )
          } else
            fastify[method](
              path,
              {
                schema,
                attachValidation: true,
              },
              async (req, resp) => prepareFunctionCall(req, resp, schema, s[o], inputs, authenticationLevel, path, transactional)
            )
          console.log('finished registering')
        } catch (e) {
          console.log('eee', e)
        }
      }
    }
  } catch (wwwww) {
    console.log('eeeee', wwwww)
  }
  let cont = true
  let counter = 0
  // let logStream = fs.createWriteStream('geo.txt', {flags: 'a'});
  // await timeOut()
  // await timeOut()
  // await timeOut()
  // while(cont && counter < 127 && false){
  // let response = await axios.get('https://parseapi.back4app.com/classes/City?limit=1000&skip='+(counter*1000), {
  //         headers: {
  //             'X-Parse-Application-Id': 'mxsebv4KoWIGkRntXwyzg6c6DhKWQuit8Ry9sHja', // This is the fake app's application id
  //             'X-Parse-Master-Key': 'TpO0j3lG2PmEVMXlKYQACoOXKQrL3lwM0HwR9dbH', // This is the fake app's readonly master key
  //         }
  //     }
  // ).catch((e)=>{console.log('e',cont = false)});
  // counter = counter+1;
  // let s = []
  // for (let i of response.data.results){
  //     s.push(i)
  // }
  // await MongoDbServices.insertMany("","Cities",s)
  // console.log('count :',counter)
  // }
  console.log('finished http')

  fastify.listen(process.env.PORT || 4008, function (err, address) {
    if (err) {
      console.log('err', err)
      fastify.log.error(err)
      process.exit(1)
    }
  })
}



