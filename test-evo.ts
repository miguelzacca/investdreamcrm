import 'dotenv/config';
import { createInstance, connectInstance } from './src/lib/evolution.js';

async function test() {
  console.log("Creating instance...");
  const createRes = await createInstance();
  console.log("Create Res:", JSON.stringify(createRes, null, 2));

  console.log("Connecting instance...");
  const connectRes = await connectInstance();
  console.log("Connect Res:", JSON.stringify(connectRes, null, 2));
}

test();
