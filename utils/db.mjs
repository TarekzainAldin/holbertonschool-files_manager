import { createHash } from 'crypto';
import mongodb from 'mongodb';

const { MongoClient, ObjectId } = mongodb;

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';

    // Création d'une instance de MongoClient pour se connecter à la base de données MongoDB
    this.mongoClient = new MongoClient(`mongodb://${host}:${port}/${database}`, { useUnifiedTopology: true });
    this.isConnectionAlive = false;

    // Connexion à MongoDB et mise à jour de l'état de la connexion
    this.mongoClient.connect().then(() => {
      this.isConnectionAlive = true;
    });
  }

  isAlive() {
    return this.isConnectionAlive;
  }

  // Méthode pour obtenir le nombre d'utilisateurs dans la collection 'users'
  async nbUsers() {
    if (!this.isAlive()) {
      return -1;
    }
    const collection = this.mongoClient.db().collection('users');
    const count = await collection.countDocuments();
    return count;
  }

  async nbFiles() {
    if (!this.isAlive()) {
      return -1;
    }
    const collection = this.mongoClient.db().collection('files');
    const count = await collection.countDocuments();
    return count;
  }

  async doesUserExist(email) {
    if (!this.isAlive()) {
      return false;
    }

    const collection = this.mongoClient.db().collection('users');
    const user = await collection.findOne({ email });

    return user != null;
  }

  async createUser(email, password) {
    if (!this.isAlive()) {
      return -1;
    }

    // Création d'un hachage SHA-1 pour le mot de passe
    const hash = createHash('sha1');
    hash.update(password);

    // Création du document utilisateur
    const document = { email, password: hash.digest('hex') };

    const collection = this.mongoClient.db().collection('users');
    const result = await collection.insertOne(document);

    return result.insertedId;
  }

  async findUserByEmail(email) {
    if (!this.isAlive()) {
      return null;
    }

    const collection = this.mongoClient.db().collection('users');
    const user = await collection.findOne({ email });
    return user;
  }

  async findUserById(id) {
    if (!this.isAlive()) {
      return null;
    }

    const collection = this.mongoClient.db().collection('users');
    const user = await collection.findOne(ObjectId(id));
    return user;
  }

  async findFileById(id, userId = null) {
    if (!this.isAlive()) {
      return null;
    }

    // Création de la requête pour la recherche du fichier
    const query = { _id: ObjectId(id) };

    if (userId !== null) {
      query.userId = userId;
    }

    const collection = this.mongoClient.db().collection('files');
    const file = await collection.findOne(query);
    return file;
  }

  async createFile(file) {
    if (!this.isAlive()) {
      return -1;
    }

    const collection = this.mongoClient.db().collection('files');
    const result = await collection.insertOne(file);

    return result.insertedId;
  }

  async updateIsPublic(fileId, userId, isPublic) {
    const filesCollection = this.mongoClient.db().collection('files');
    await filesCollection.updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic } });

    const updatedFile = await this.findFileById(fileId, userId);
    return (updatedFile);
  }

  // Méthode pour récupérer les fichiers d'un utilisateur avec pagination
  async getFilesForUser(userId, parentId, page) {
    if (!this.isAlive()) {
      return -1;
    }

    const collection = this.mongoClient.db().collection('files');
    const result = await collection.aggregate([
      { $match: { userId, parentId } },
      { $skip: 20 * page },
      { $limit: 20 },
    ]).toArray();

    return result;
  }
}

const dbClient = new DBClient();
export default dbClient;
