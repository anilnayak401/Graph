import neo4j, { Driver, Session, QueryResult, Record as Neo4jRecord } from 'neo4j-driver';

/**
 * CognoDB / Neo4j Driver Connection Setup for Cloudflare & Node.js Runtime
 * 
 * Required Environment Variables:
 * - NEO4J_URI: Connection string (e.g. bolt+s://your-instance.cognodb.io:7687 or bolt://localhost:7687)
 * - NEO4J_USERNAME: Username (strictly set/defaulted to "cognodb")
 * - NEO4J_PASSWORD: Password for authentication
 */

let driverInstance: Driver | null = null;

/**
 * Validates and retrieves required environment configuration.
 */
function getDbCredentials() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  // Strictly enforce 'cognodb' username per assignment requirements
  const username = process.env.NEO4J_USERNAME || 'cognodb';
  const password = process.env.NEO4J_PASSWORD || '';

  return { uri, username, password };
}

/**
 * Retrieves or creates a singleton Neo4j driver instance.
 */
export function getDriver(): Driver {
  if (!driverInstance) {
    const { uri, username, password } = getDbCredentials();

    if (!uri) {
      throw new Error(
        'Missing environment variable: NEO4J_URI. Please configure your CognoDB URI (e.g. bolt+s://xxx.cognodb.io:7687).'
      );
    }

    try {
      driverInstance = neo4j.driver(
        uri,
        neo4j.auth.basic(username, password),
        {
          maxConnectionLifetime: 3 * 60 * 1000, // 3 minutes
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 5000,
          disableLosslessIntegers: true, // Native JavaScript Number support
        }
      );
    } catch (error) {
      console.error('Failed to initialize Neo4j/CognoDB driver:', error);
      throw new Error(
        `Database Initialization Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return driverInstance;
}

/**
 * Verify database connectivity.
 */
export async function verifyConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { uri } = getDbCredentials();
    const driver = getDriver();
    const serverInfo = await driver.getServerInfo();
    return {
      success: true,
      message: `Connected successfully to CognoDB (${serverInfo.agent || 'Bolt Server'}) at ${uri}`,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('CognoDB connection verification failed:', errMsg);
    return {
      success: false,
      message: `Unable to connect to CognoDB. Ensure database is active and credentials are valid. Error: ${errMsg}`,
    };
  }
}

/**
 * Helper to convert Neo4j data types (like neo4j.int) to standard JSON-serializable JS types.
 * Converts Integers using .toNumber() or .toInt() to avoid JSON serialization errors.
 */
export function deserializeNeo4jValue(val: any): any {
  if (val === null || val === undefined) return val;
  if (neo4j.isInt(val)) {
    return val.toNumber ? val.toNumber() : val.toInt ? val.toInt() : Number(val);
  }
  if (Array.isArray(val)) return val.map(deserializeNeo4jValue);
  if (typeof val === 'object') {
    // If it's a Node or Relationship object from Neo4j driver
    if (val.properties) {
      return {
        id: val.identity ? deserializeNeo4jValue(val.identity) : undefined,
        labels: val.labels || undefined,
        type: val.type || undefined,
        ...deserializeNeo4jValue(val.properties),
      };
    }
    const result: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      result[key] = deserializeNeo4jValue(val[key]);
    }
    return result;
  }
  return val;
}

/**
 * Executes a parameterized Cypher query safely inside an auto-managed session.
 * 
 * @param cypher The Cypher query string with parameter placeholders ($paramKey)
 * @param params Object containing key-value parameters
 * @param mode 'READ' | 'WRITE'
 */
export async function runQuery<T = any>(
  cypher: string,
  params: Record<string, any> = {},
  mode: 'READ' | 'WRITE' = 'READ'
): Promise<T[]> {
  const driver = getDriver();
  const session: Session = driver.session({
    defaultAccessMode: mode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ,
  });

  try {
    const result: QueryResult = await session.run(cypher, params);
    return result.records.map((record: Neo4jRecord) => {
      const keys = record.keys;
      if (keys.length === 1) {
        return deserializeNeo4jValue(record.get(0));
      }
      const rowObject: Record<string, any> = {};
      record.keys.forEach((key) => {
        rowObject[String(key)] = deserializeNeo4jValue(record.get(key));
      });
      return rowObject as T;
    });
  } catch (error) {
    console.error(`Error executing Cypher query [${mode}]:`, cypher, params, error);
    throw new Error(
      `Cypher Execution Error: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    await session.close();
  }
}

/**
 * Gracefully close driver connection (for process teardown).
 */
export async function closeDriver(): Promise<void> {
  if (driverInstance) {
    await driverInstance.close();
    driverInstance = null;
  }
}
