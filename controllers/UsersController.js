import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  // Méthode pour gérer la création de nouveaux utilisateurs
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400);
      return res.json({ error: 'Missing email' });
    }

    if (!password) {
      res.status(400);
      return res.json({ error: 'Missing password' });
    }

    // Vérification si un utilisateur avec cet email existe déjà dans la base de données
    const exist = await dbClient.doesUserExist(email);
    if (exist) {
      res.status(400);
      return res.json({ error: 'Already exist' });
    }

    // Création d'un nouvel utilisateur dans la base de données
    const id = await dbClient.createUser(email, password);

    res.status(201);
    return res.json({ id, email });
  }

  // Méthode pour récupérer les informations de l'utilisateur authentifié
  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    // Vérification si le token est valide et correspond à un utilisateur existant
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Recherche de l'utilisateur dans la base de données par son identifiant
    const user = await dbClient.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Réponse avec les informations de l'utilisateur
    return res.status(200).json({ id: user._id, email: user.email });
  }
}
export default UsersController;
