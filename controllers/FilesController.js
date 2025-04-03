import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    // Retrieve the user based on the token
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Validate parent if provided
    if (parentId !== '0') {
      try {
        const parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      } catch (err) {
        return res.status(400).json({ error: 'Parent not found' });
      }
    }

    // Handle folder creation
    if (type === 'folder') {
      const newFolder = {
        userId: user._id,
        name,
        type,
        parentId: parentId === '0' ? 0 : ObjectId(parentId),
        isPublic,
      };

      const result = await dbClient.db.collection('files').insertOne(newFolder);
      const createdFolder = {
        id: result.insertedId,
        ...newFolder,
        parentId: newFolder.parentId === 0 ? '0' : newFolder.parentId.toString(),
      };

      return res.status(201).json(createdFolder);
    }

    // Handle file/image creation
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = uuidv4();
    const localPath = path.join(folderPath, filename);

    // Ensure the directory exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Write the file
    const fileContent = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, fileContent);

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? 0 : ObjectId(parentId),
      localPath,
    };

    const result = await dbClient.db.collection('files').insertOne(newFile);
    const createdFile = {
      id: result.insertedId,
      ...newFile,
      parentId: newFile.parentId === 0 ? '0' : newFile.parentId.toString(),
    };

    return res.status(201).json(createdFile);
  }
}

export default FilesController;
