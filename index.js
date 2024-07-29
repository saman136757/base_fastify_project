import { initMongoDbConnection } from "./initiation/InitMongoDb.js";
// import { initHttpServer } from "./initiation/InitHttpServer.js";
// import { MongoDbServices } from "./src/microservices/MongoDbServices.js";
// import { initModels } from "./initiation/initModels.js";

const initServer = async () => {
    try {
        
        let mongo = await initMongoDbConnection();
        console.log('mongo ok');
        // MongoDbServices.setClient(mongo);
        // let models = await initModels(mongo);
      
        //let httpServer = await initHttpServer();
     

    } catch (e) {
        console.log(e)
    }
}
initServer()