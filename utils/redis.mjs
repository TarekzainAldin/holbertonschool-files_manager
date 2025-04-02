import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // Création d'un client Redis
    this.client = redis.createClient();
    this.client.on('error', (error) => {
      console.log(error);
    });

    // Conversion des méthodes callback de Redis en promesses pour une utilisation asynchrone
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  // Méthode asynchrone pour obtenir la valeur d'une clé Redis
  async get(key) {
    try {
      const value = await this.getAsync(key);
      return (value);
    } catch (err) {
      console.error('Error fetching value:', err);
      return null;
    }
  }

  // Méthode asynchrone pour définir une clé Redis avec une durée d'expiration
  async set(key, value, duration) {
    try {
      await this.setAsync(key, value, 'EX', duration);
    } catch (err) {
      console.error('Error setting value:', err);
    }
  }

  // Méthode asynchrone pour supprimer une clé Redis
  async del(key) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error('Error deleting value:', err);
    }
  }
}
// Création d'une instance de RedisClient
const redisClient = new RedisClient();
export default redisClient;
