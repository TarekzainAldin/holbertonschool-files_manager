import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    try {
      // Retrieve user from token
      const token = req.headers['x-token'];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await dbClient.client.db().collection('users').findOne({ _id: dbClient.getObjectId(userId) });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // Extract and validate request data
      const {
        name,
        type,
        parentId = 0,
        isPublic = false,
        data,
      } = req.body;

      if (!name) return res.status(400).json({ error: 'Missing name' });
      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Check parent folder if parentId is provided
      let parentFile = null;
      if (parentId !== 0) {
        parentFile = await dbClient.client.db().collection('files').findOne({ _id: dbClient.getObjectId(parentId) });

        if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
      }

      // Prepare file document
      const fileDocument = {
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
      };

      // Handle actual file storage if it's not a folder
      if (type === 'file' || type === 'image') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        await fs.mkdir(folderPath, { recursive: true }); // Ensure folder exists

        const fileUuid = uuidv4();
        const filePath = path.join(folderPath, fileUuid);

        // Decode base64 and save the file
        const fileData = Buffer.from(data, 'base64');
        await fs.writeFile(filePath, fileData);

        fileDocument.localPath = filePath;
      }

      // Insert into database
      const result = await dbClient.client.db().collection('files').insertOne(fileDocument);
      fileDocument._id = result.insertedId;

      return res.status(201).json(fileDocument);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
