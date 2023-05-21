const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s5ynbm1.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize:10,
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect(err => {
      if (err) {
        console.error(err);
        return;
      }
    });

    const toysCollection = client.db('toyDB').collection('toys');
    const featuredCollection = client.db('toyDB').collection('featuredToy');


    // get all toys data from database
    app.get('/toys', async (req, res) => {
      const result = await toysCollection.find().toArray();
      res.send(result);
    });

    // get all data from featured toy collection
    app.get('/featuredToy', async (req, res) => {
      const result = await featuredCollection.find().toArray();
      res.send(result);
    })

    // get single toy data from database using id
    app.get('/toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    })
    
    // get the only user toy data add by user
    app.get('/myToys', async (req, res) => {
      console.log(req.query.sort);
      let query = {};
      let sort = {};
      if (req.query.sort === 'Ascending') {
        sort = { price: 1 };
      }
      else {
        sort = { price: -1 }
      }
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await toysCollection.find(query).sort(sort).toArray();
      res.send(result);
    });

    // get data by sub_category
    app.get('/:category', async (req, res) => {
      const result = await toysCollection.find({ sub_category: req.params.category }).toArray();
      res.send(result);
    })

    // search with toy name and get toys
    app.get('/allToys/:text', async (req, res) => {
      const text = req.params.text;
      const result = await toysCollection
        .find({
          $or: [
            { toy_name: { $regex: text, $options: 'i' } },
            { sub_category: { $regex: text, $options: 'i' } },
          ],
        })
        .toArray();
      res.send(result);
    });
    // add toy data in database
    app.post('/addToy', async (req, res) => {
      const toy = req.body;
      const result = await toysCollection.insertOne(toy);
      res.send(result);
    })

    // update toy data
    app.put('/updateToy/:id', async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const toyData = req.body;
      const updateToy = {
        $set: {
          seller_name: toyData.seller_name,
          email: toyData.email,
          toy_name: toyData.toy_name,
          toy_picture: toyData.toy_picture,
          price: toyData.price,
          rating: toyData.rating,
          available_quantity: toyData.available_quantity,
          sub_category: toyData.sub_category,
          description: toyData.description
        },
      };
      const result = await toysCollection.updateOne(filter, updateToy, options);
      res.send(result);
    })

    // delete a toy data from database
    app.delete('/myToys/:id', async (req, res) => {
      const id = req.params.id;
      const result = await toysCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("Toy MarketPlace Server Is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
})