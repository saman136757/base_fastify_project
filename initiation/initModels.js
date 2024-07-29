import annotations from 'annotations'
import fs from 'fs'
import {mongoDbDatabase} from '../src/microservices/MongoDbServices.js'
import ApplicationException from '../src/ApplicationException.js'

export const initModels = async (mongodb) => {
  let models = fs.readdirSync('./src/models')
  let collections = await mongodb.db(mongoDbDatabase).listCollections().toArray()
  let sConn = []
  for (let i in collections) {
    sConn.push(collections[i].name)
  }
  try {
    for (let file of models) {
      let w = await annotations.get('./src/models/' + file)

      for (let model in w) {
        if (w[model].mongoCollection) {
          if (!sConn.includes(w[model].mongoCollection)) {
            let json = {
              bsonType: 'object',
              required: [],
              properties: {},
            }
            for (let s in w[model].model) {
              let mod = JSON.parse(w[model].model[s])
              if (mod.required) {
                json.required.push(mod.name)
              }
              json.properties[mod.name] = {
                bsonType: mod.type,
                description: mod.description || '',
              }
            }
            if (!json.required[0]) {
              json.required = false
            }
            let indices = []
            if (w[model].index) {
              if (typeof w[model].index === typeof '') {
                indices[0] = JSON.parse(w[model].index)
              } else if (typeof w[model].index === typeof []) {
                for (let i in w[model].index) {
                  indices.push(JSON.parse(w[model].index[i]))
                }
              }
            }

            try {
              console.log('MYS:', w[model])
              console.log('json', json)
              let s = await mongodb.db(mongoDbDatabase).createCollection(w[model].mongoCollection, {
                validator: {
                  $jsonSchema: json,
                },
                writeConcern: {w: 1, j: true, wtimeout: 100},
                validationLevel: 'moderate',
              })
              for (let i in indices) {
                let indexOpts = {name: indices[i].name}
                let indexQuery = {}
                for (let y of indices[i].indices) {
                  if (indices[i].unique) {
                    indexOpts.unique = true
                  }
                  indexQuery[y] = 1
                }
                await mongodb
                  .db(mongoDbDatabase)
                  .collection(w[model].mongoCollection)
                  .createIndex(indexQuery, indexOpts)
              }
            } catch (e) {
              console.log('Could Not Create DataBase', e)
              throw new ApplicationException('Could Not Create DataBase', 500, 500)
            }
          }
        }
        let s = await import('../src/models/' + file)
        await s.default.setModel(mongodb.db(mongoDbDatabase))
      }
    }
  } catch (e) {
    console.error(e)

    throw new ApplicationException(e, 500, 500)
  }
}
