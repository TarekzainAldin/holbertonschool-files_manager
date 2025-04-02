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
}
export default UsersController;
