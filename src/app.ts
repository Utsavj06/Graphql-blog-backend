import express from 'express'
import { config } from 'dotenv'
import { connectToDB } from './utils/connection'
import { graphqlHTTP } from 'express-graphql'
import appSchema from './handlers/handlers'
import cors from 'cors'

config()

const app = express()

app.use(cors())
app.use('/graphql', graphqlHTTP({ schema:appSchema, graphiql:true }))

connectToDB().then(()=>{
    app.listen(process.env.PORT, ()=> console.log('process start at ' + process.env.PORT))
}).catch((err)=> console.log(err))

