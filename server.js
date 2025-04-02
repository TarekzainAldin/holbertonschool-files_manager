import express from 'express';
import routes from './routes/index.js'; // ✅ تأكد من استيراد `routes`

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // ✅ مهم جدًا لتحليل JSON
app.use('/', routes); // ✅ تحميل جميع المسارات

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
