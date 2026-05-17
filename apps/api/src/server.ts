import { createApp } from './app.js';
import 'dotenv/config';

const app = createApp();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;