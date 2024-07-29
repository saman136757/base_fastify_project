/**
 * @service
 * @mongoCollection Component
 * @model {"name": "name", "type":"string", "required":true, "min":2, "max":150 }
 * @model {"name": "icon", "type":"string", "required":false }
 * @model {"name": "title", "type":"string", "required":true }
 * @model {"name": "caption", "type":"string", "required":true }
 * @model {"name": "type", "type":"string", "required":false }
 * @model {"name": "priority", "type":"number", "required":true, "min":8, "max":100 }
 * @model {"name": "time", "type":"number", "required":true, "min":8, "max":100 }
 * @model {"name": "events", "type":"array", "required":false }
 * @index {"name": "name", "indices":["name"] }
 * @index {"name": "time", "indices":["time"]}
 */

const setModel = async (mongodb) => {
  _collection = await mongodb.collection('Component')
}
let _collection

const collection = () => {
  return _collection
}
export default { collection, setModel }
