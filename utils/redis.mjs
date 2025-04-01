// utils/redis.mjs

import { createClient } from 'redis';

class RedisClient {
  constructor() {
    // Create a Redis client
    this.client = createClient();

    // Handle Redis client errors
    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    // Connect the client
    this.client.connect();
  }

  // Method to check if the Redis connection is alive
  isAlive() {
    return this.client.isOpen; // Checks if the connection is open
  }

  // Asynchronous method to get the value from Redis for the given key
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      console.error('Error getting key from Redis:', err);
      return null;
    }
  }

  // Asynchronous method to set the value in Redis for the given key with expiration time
  async set(key, value, duration) {
    try {
      await this.client.setEx(key, duration, value);// Sets value with expiration time
    } catch (err) {
      console.error('Error setting key in Redis:', err);
    }
  }

  // Asynchronous method to delete the key from Redis
  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error('Error deleting key from Redis:', err);
    }
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
