import mongodb from 'mongodb';

const { MongoClient } = mongodb;

class DBClient {
  constructor() {
    this.db = null; // Initialize db as null
  }

  // Asynchronous method to connect to the database
  async connect() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    try {
      const client = await MongoClient.connect(url, { useUnifiedTopology: true });
      this.db = client.db(database); // Store the db connection
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
  }

  isAlive() {
    return this.db !== null; // Return true if the db is connected
  }

  async nbUsers() {
    if (!this.isAlive()) return 0; // Ensure db connection is available
    const users = this.db.collection('users');
    return users.countDocuments();
  }

  async nbFiles() {
    if (!this.isAlive()) return 0; // Ensure db connection is available
    const files = this.db.collection('files');
    return files.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
