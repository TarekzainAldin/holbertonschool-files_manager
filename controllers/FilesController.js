import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import mime from 'mime-types';
import Queue from 'bull';

import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileInfo = {
      userId,
      name: req.body.name,
      type: req.body.type,
      isPublic: req.body.isPublic || false,
      parentId: req.body.parentId || 0,
    };

    if (!fileInfo.name) return res.status(400).json({ error: 'Missing name' });

    const validFileTypes = ['folder', 'file', 'image'];
    if (!fileInfo.type || !validFileTypes.includes(fileInfo.type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!req.body.data && fileInfo.type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (fileInfo.parentId !== 0) {
      const parentFile = await dbClient.findFileById(fileInfo.parentId);
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (fileInfo.type === 'folder') {
      const id = await dbClient.createFile({ ...fileInfo });
      return res.status(201).json({ id, ...fileInfo });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    mkdirSync(folderPath, { recursive: true });

    const localPath = path.join(folderPath, uuidv4());
    writeFileSync(localPath, req.body.data, { encoding: 'base64' });

    const id = await dbClient.createFile({ ...fileInfo, localPath });

    if (fileInfo.type === 'image') {
      const fileQueue = new Queue('fileQueue');
      fileQueue.add({ userId, fileId: id });
    }

    return res.status(201).json({ id, ...fileInfo });
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId, userId);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const updatedFile = await dbClient.updateIsPublic(fileId, userId, true);
    return res.status(200).json(updatedFile);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId, userId);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const updatedFile = await dbClient.updateIsPublic(fileId, userId, false);
    return res.status(200).json(updatedFile);
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const file = await dbClient.findFileById(req.params.id, userId);
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page || '0', 10);

    let files = await dbClient.getFilesForUser(userId, parentId, page);
    files = files.map((f) => ({
      id: f._id,
      userId: f.userId,
      name: f.name,
      type: f.type,
      isPublic: f.isPublic,
      parentId: f.parentId,
    }));

    return res.status(200).json(files);
  }

  static async getFile(req, res) {
    const token = req.headers['x-token'] || null;
    const fileId = req.params.id;
    const file = await dbClient.findFileById(fileId);
    if (!file) return res.status(404).json({ error: 'Not found' });

    const tokenKey = `auth_${token}`;
    const userId = await redisClient.get(tokenKey);

    if (!file.isPublic && (!userId || userId !== file.userId.toString())) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    const querySize = req.query.size;
    const validSizes = ['500', '250', '100'];

    if (querySize && validSizes.includes(querySize)) {
      file.localPath = `${file.localPath}_${querySize}`;
    }

    try {
      const data = readFileSync(file.localPath);
      const mimeType = mime.lookup(file.name) || 'application/octet-stream';
      return res.set('Content-Type', mimeType).status(200).send(data);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

export default FilesController;
