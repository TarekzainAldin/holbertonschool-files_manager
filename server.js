import express from 'express';
// eslint-disable-next-line import/extensions
import routes from './routes/index.js';

const app = express();
const port = process.env.PORT || 5000;

app.use('/', routes); // ✅ تأكد من تمرير `routes` وليس كائنًا آخر

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
