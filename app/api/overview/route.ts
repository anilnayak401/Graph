import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  try {
    // 1. Get Node type counts using parameterized queries
    const counts = await runQuery<{ label: string; count: number }>(
      `
      MATCH (n)
      WITH labels(n)[0] AS label, count(n) AS count
      RETURN label, count
      `,
      {},
      'READ'
    );

    // 2. Fetch all Regions for selection menus
    const regions = await runQuery(
      `
      MATCH (r:Region)
      OPTIONAL MATCH (r)<-[:LOCATED_IN]-(s:Supplier)
      RETURN r, count(s) as supplierCount
      ORDER BY r.riskTier DESC, r.name ASC
      `,
      {},
      'READ'
    );

    // 3. Fetch all Products for selection menus
    const products = await runQuery(
      `
      MATCH (p:Product)
      OPTIONAL MATCH (p)-[:REQUIRES]->(c:Component)
      RETURN p, count(c) as componentCount
      ORDER BY p.price DESC
      `,
      {},
      'READ'
    );

    // 4. Single Points of Failure summary count
    const spofSummary = await runQuery<{ count: number }>(
      `
      MATCH (c:Component)
      OPTIONAL MATCH (c)-[:SUPPLIED_BY]->(s:Supplier)
      WITH c, count(s) as supplierCount
      WHERE supplierCount = 1
      RETURN count(c) as count
      `,
      {},
      'READ'
    );

    return NextResponse.json({
      success: true,
      counts: counts.reduce((acc: Record<string, number>, item) => {
        if (item.label) acc[item.label.toLowerCase()] = item.count;
        return acc;
      }, {}),
      spofCount: spofSummary[0]?.count || 0,
      regions: regions.map((item) => ({
        ...item.r,
        supplierCount: item.supplierCount,
      })),
      products: products.map((item) => ({
        ...item.p,
        componentCount: item.componentCount,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
