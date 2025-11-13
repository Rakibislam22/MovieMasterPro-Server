const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    const moviesCollection = db.collection('movies');

    // users data post
    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const email = newUser.email;

      const query = { email: email };
      const userExist = await userCollection.findOne(query);

      if (userExist) {
        res.send({ message: 'User already exist...!' })
      } else {
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      }
    })

    // All movies
    app.get('/movies', async (req, res) => {
      try {
        const { addedBy, genres, minRating, maxRating } = req.query;

        const filter = {};

        // Filter by addedBy
        if (addedBy) {
          filter.addedBy = addedBy;
        }

        // Filter by multiple genres
        if (genres) {
          const genreArray = genres.split(",");
          filter.genre = { $in: genreArray };
        }

        // Filter by rating range
        if (minRating || maxRating) {
          filter.rating = {};
          if (minRating) filter.rating.$gte = Number(minRating);
          if (maxRating) filter.rating.$lte = Number(maxRating);
        }

        const movies = await moviesCollection.find(filter).toArray();
        res.send(movies);

      } catch (error) {
        res.status(500).send({
          error: "Failed to fetch movies",
          details: error.message
        });
      }
    });


    app.get("/stats", async (req, res) => {
      try {
        const usersCount = await userCollection.countDocuments();
        const moviesCount = await moviesCollection.countDocuments();

        res.send({
          users: usersCount,
          movies: moviesCount
        });
      } catch (error) {
        res.status(500).send({ message: "Error fetching stats", error });
      }
    });

    app.get('/top-rated-movies', async (req, res) => {
      const cursor = moviesCollection.find({ rating: { $gte: 8.7 } }).limit(5);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/recently-added', async (req, res) => {
      const cursor = moviesCollection.find().sort({ _id: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/movies/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await moviesCollection.findOne(query);
      res.send(result);
    })

    app.get('/hero-movies', async (req, res) => {
      const cursor = moviesCollection.find().limit(8);
      const result = await cursor.toArray();
      res.send(result);
    })

    // add movie
    app.post('/movies/add', async (req, res) => {
      try {
        const newMovie = req.body;
        const result = await moviesCollection.insertOne(newMovie);
        res.status(201).send(result);
      } catch (err) {
        res.status(500).send({ error: "Failed to add movie", details: err.message });
      }
    });

    // delete my collection

    app.delete('/movies/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await moviesCollection.deleteOne(query);
      res.send(result);
    })

    // update movie
    app.put('/movies/update/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedMovie = req.body;

        // Prevent editing addedBy
        if (updatedMovie.addedBy) {
          delete updatedMovie.addedBy;
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedMovie };

        const result = await moviesCollection.updateOne(query, updateDoc);

        res.send({ success: true, modifiedCount: result.modifiedCount });

      } catch (error) {
        res.status(500).send({
          error: "Failed to update movie",
          details: error.message
        });
      }
    });




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