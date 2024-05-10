const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
  origin : [
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

// console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o4dtxo0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const assignmentCollection = client.db('assignment').collection('assignmentsCreate')
    const submitCollection = client.db('assignment').collection('submit')

    //auth related api
    app.post('/jwt', async(req,res)=>{
      const user = req.body
      console.log('user for token',user );
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'})
      res.cookie('token',token,{
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success : true})
    })
    app.post('/logout', async(req,res)=>{
      const user = req.body
      res.clearCookie('token', {maxAge: 0}).send({success:true})
    })

    app.get('/assignmentsCreate', async (req, res) => {
      const cursor = assignmentCollection.find()
      const result = await cursor.toArray()
      res.send(result);
    })

    app.get('/assignmentsCreate/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await assignmentCollection.findOne(query)
      res.send(result)
    })

    app.put('/assignmentsCreate/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const updatedAssignment = req.body
      const assignment = {
        $set: {
          name: updatedAssignment.name,
          description: updatedAssignment.description,
          marks: updatedAssignment.marks,
          img: updatedAssignment.img,
        }
      }
      const result = await assignmentCollection.updateOne(filter, assignment, options)
      res.send(result)
    })
    app.post('/assignmentsCreate', async (req, res) => {
      const newAssignment = req.body
      console.log(newAssignment);
      const result = await assignmentCollection.insertOne(newAssignment)
      res.send(result)
    })
    app.delete('/assignmentsCreate/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await assignmentCollection.deleteOne(query)
      res.send(result);
    })
    //submit collection

    app.post('/submit', async(req,res)=>{
      const submit = req.body;
      console.log(submit);
      const result = await submitCollection.insertOne(submit)
      res.send(result)
    })
    app.get('/submit', async (req, res) => {
      const cursor = submitCollection.find()
      const result = await cursor.toArray()
      res.send(result);
    })
    app.get("/submit/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await submitCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('server is running')
})

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
})