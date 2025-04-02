import crypto from 'crypto';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // تحقق مما إذا كان المستخدم موجودًا بالفعل
    const userExist = await dbClient.usersCollection.findOne({ email });
    if (userExist) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // تشفير كلمة المرور باستخدام SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // إنشاء المستخدم في قاعدة البيانات
    const newUser = await dbClient.usersCollection.insertOne({ email, password: hashedPassword });

    return res.status(201).json({ id: newUser.insertedId, email });
  }
}

export default UsersController;
