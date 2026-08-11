import { NextResponse } from 'next/server';
import { runQuery, verifyConnection } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const connStatus = await verifyConnection();

  if (!connStatus.success) {
    return NextResponse.json(
      {
        status: 'error',
        connected: false,
        message: connStatus.message,
        counts: { nodes: 0, relationships: 0 },
      },
      { status: 503 }
    );
  }

  try {
    // Parameterized Cypher query to count total nodes and relationships
    const nodeCountRes = await runQuery<{ count: number }>(
      'MATCH (n) RETURN count(n) as count',
      {},
      'READ'
    );
    const relCountRes = await runQuery<{ count: number }>(
      'MATCH ()-[r]->() RETURN count(r) as count',
      {},
      'READ'
    );

    const nodeCount = nodeCountRes[0]?.count || 0;
    const relCount = relCountRes[0]?.count || 0;

    return NextResponse.json({
      status: 'ok',
      connected: true,
      message: connStatus.message,
      counts: {
        nodes: nodeCount,
        relationships: relCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        connected: false,
        message: error instanceof Error ? error.message : String(error),
        counts: { nodes: 0, relationships: 0 },
      },
      { status: 500 }
    );
  }
}
