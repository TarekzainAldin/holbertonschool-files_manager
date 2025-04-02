import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  // Méthode pour gérer la connexion des utilisateurs
  static async getConnect(req, res) {
    // Récupération des informations d'authentification depuis les en-têtes de la requête
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extraction et décodage des informations d'authentification de l'en-tête Authorization
    const base64Credentials = authHeader.split(' ')[1];
    const credentialsBuffer = Buffer.from(base64Credentials, 'base64');

    // Vérification si les informations décodées correspondent au format attendu
    if (credentialsBuffer.toString('base64') !== base64Credentials) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Conversion des informations décodées en email et mot de passe
    const credentials = credentialsBuffer.toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Hachage du mot de passe fourni par l'utilisateur
    const hashedPassword = sha1(password);
    // Recherche de l'utilisateur dans la base de données par email
    const user = await dbClient.findUserByEmail(email);

    // Vérification de l'existence de l'utilisateur et de la correspondance du mot de passe
    if (!user || user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Génération d'un token unique pour la session utilisateur
    const token = uuidv4();
    const tokenKey = `auth_${token}`;
    // Stockage du token dans Redis avec une durée de vie de 86400 secondes (24 heures)
    await redisClient.set(tokenKey, user._id.toString(), 86400);

    return res.status(200).json({ token });
  }

  // Méthode pour gérer la déconnexion des utilisateurs
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Suppression du token de Redis pour invalider la session
    await redisClient.del(tokenKey);
    return res.status(204).send();
  }
}

export default AuthController;
