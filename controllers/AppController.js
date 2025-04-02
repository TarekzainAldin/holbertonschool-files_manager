import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  // Méthode pour obtenir le statut de santé des services Redis et MongoDB
  static async getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();

    res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  // Méthode pour obtenir des statistiques sur les utilisateurs et les fichiers
  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    res.status(200).json({ users, files });
  }
}
export default AppController;
