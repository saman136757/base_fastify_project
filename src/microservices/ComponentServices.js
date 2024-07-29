import { MongoDbServices } from "./MongoDbServices.js";
import ComponentModel from "../models/ComponentModel.js";

const insert = async (model, context) => {
    model.time = new Date().getTime();
    model.status = true

    return await MongoDbServices.insertOne(ComponentModel.collection(), model, context);
};
const validate = (content) => {
    let newContent = {};
    if (!content.name) return false;
    newContent.name = content.name;
    if (!content.caption) return false;
    newContent.caption = content.caption;


    return newContent;
};


const get = async (query, projection, context) => {
    return await MongoDbServices.find(ComponentModel.collection(), query, projection, { _id: -1 }, context);
};

const getWithPage = async (query, pageNumber, pageSize, context) => {
    // console.log(ComponentModel.collection())
    return await MongoDbServices.findPage(ComponentModel.collection(), query, {}, pageNumber * pageSize, pageSize, { _id: -1 }, { _id: -1 }, context);
};

const disable = async (id, context) => {
    id = MongoDbServices.convertToObjectId(id);
    return await MongoDbServices.updateOne(ComponentModel.collection(), { _id: id }, { status: false }, context);
};

const update = async (model, context) => {

    model.date = new Date().getTime();

    return await MongoDbServices.updateOne(ComponentModel.collection(), { _id: model._id }, model, context);
};


const getSingle = async (_id, context) => {
    _id = MongoDbServices.convertToObjectId(_id);

    let resp = await MongoDbServices.findOne(ComponentModel.collection(), { _id, status: true }, {}, context);
    if(resp)
        await MongoDbServices.updateOne(ComponentModel.collection(), { _id: MongoDbServices.convertToObjectId(_id) }, { views: resp.views + 1 || 1 }, context);
    return resp;
};


const getCount = async (query, context) => {
    return await MongoDbServices.count(
        ComponentModel.collection(),
        query, {
        status: -1,
    },
        context
    );
};

export default { get, getCount, getSingle, update, insert, disable, validate, getWithPage };