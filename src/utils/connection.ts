import { connect } from "mongoose";

export const connectToDB = async () => {
    try {
        await connect(`mongodb+srv://utsav96jaiswal:${process.env.MONGO_PASS}@cluster0.6nb5agg.mongodb.net/`)
    } catch (err){
        console.log(err)
        return err
    }
}