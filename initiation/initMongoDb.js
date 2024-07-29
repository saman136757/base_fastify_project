import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';



export const initMongoDbConnection = async () => {
    try {
        dotenv.config();
        const uri = process.env.MONGODB_URI; 
        const client = new MongoClient(uri);
        return client.connect();
    } catch (err) {
        console.error('error connecting:', err);
    }
}


