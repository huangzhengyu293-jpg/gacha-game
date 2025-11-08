import { MongoClient, MongoClientOptions, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URL || '';
if (!uri) {
  // 在构建期避免抛出硬错误；运行期首次调用再抛
}

const options: MongoClientOptions = {
  // 这里可按需设置选项，例如：
  // maxPoolSize: 10,
};

declare global {
  // 为了在开发热更期间复用同一个连接 Promise
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

function ensureClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    if (!uri) {
      throw new Error('MongoDB connection string not found. Please set MONGODB_URI (or MONGO_URL) in .env.local');
    }
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) clientPromise = ensureClientPromise();
  return clientPromise;
}

export async function getDb(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  let resolved = dbName || process.env.MONGODB_DB;
  if (!resolved) {
    try {
      const u = new URL(uri);
      const nameFromUri = u.pathname?.replace(/^\//, '');
      resolved = nameFromUri || 'flamedraw';
    } catch {
      resolved = 'flamedraw';
    }
  }
  return client.db(resolved);
}

export async function withMongo<T>(fn: (db: Db, client: MongoClient) => Promise<T>, dbName?: string): Promise<T> {
  const client = await getMongoClient();
  const db = await getDb(dbName);
  return fn(db, client);
}


