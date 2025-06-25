require("dotenv").config(); //to set env file

const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV==='production';
//agar production me ha toh true else false

const connectionString=`postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`

//ye production wali condition check kar li
const pool=new Pool({
    connectionString: isProduction ? process.env.DATABASE_URL : connectionString
})

module.exports={pool};