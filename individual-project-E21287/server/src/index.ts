// main backend entry point

import * as express from 'express';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import * as os from "node:os";


// Load environment variables from ../.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import buildingsRouter from './routes/buildings';
import countsRouter from './routes/counts';
//import logsRouter from './routes/entryExitlogs';
//import debugRouter from './routes/debug';
import validationRouter from './routes/validation';

const app = express();

//  Allow all cross-origin requests (from phone & localhost)
app.use(cors());

//  Parse incoming JSON requests
app.use(express.json());

//  Register API routes
app.use('/api/buildings', buildingsRouter);
app.use('/api/counts', countsRouter);
//app.use('/api/entryExitlogs', logsRouter);
//app.use('/api/debug', debugRouter);
app.use('/api/validate', validationRouter);


const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// 👉 Get local network IP automatically
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const localIp = getLocalIp();

app.get("/", (req, res) => {
  res.send("Backend is running ");
});

app.listen(PORT, () => {
  console.log(` Server running on:`);
  console.log(`   → Local:    http://localhost:${PORT}`);
  console.log(`   → Network:  http://${localIp}:${PORT}`);
});