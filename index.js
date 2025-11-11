const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.URI;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('movie server is running!');
})



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db('movie-master-pro');
    const userCollection = db.collection('users');

    // users data post
    app.post('/users', async (res,req) => {
        const newUser = req.body;
        const email = newUser.email;

        const query = {email : email};
        const userExist = await userCollection.findOne(query);

        if(userExist){
            res.send({message: 'User already exist...!'})
        }else{
            const result = userCollection.insertOne(newUsers);
        }
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}





run().catch(console.dir);




app.listen(port, () => {
    console.log(`Movie server is running on port ${port}`);
})