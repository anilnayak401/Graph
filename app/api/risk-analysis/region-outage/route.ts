import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get('regionId') || 'reg_east_asia';

  // Multi-hop Traversal Cypher Query:
  // Hop 1: Region <- LOCATED_IN - Supplier
  // Hop 2: Supplier <- SUPPLIED_BY - Component
  // Hop 3+: Component <- REQUIRES | DEPENDS_ON*1..5 - Product
  const cypherQuery = `
    MATCH (r:Region {id: $regionId})
    OPTIONAL MATCH (s:Supplier)-[:LOCATED_IN]->(r)
    OPTIONAL MATCH (c:Component)-[:SUPPLIED_BY]->(s)
    OPTIONAL MATCH path = (p:Product)-[:REQUIRES|DEPENDS_ON*1..5]->(c)
    WITH r, 
         collect(DISTINCT s) AS suppliers, 
         collect(DISTINCT c) AS components, 
         collect(DISTINCT p) AS products,
         collect(DISTINCT path) AS paths
    RETURN r AS region, 
           suppliers, 
           components, 
           products,
           size(products) AS impactedProductCount
  `;

  const queryParams = { regionId };

  try {
    const startTime = Date.now();
    const result = await runQuery(cypherQuery, queryParams, 'READ');
    const executionTimeMs = Date.now() - startTime;

    if (!result || result.length === 0 || !result[0].region) {
      return NextResponse.json({
        success: true,
        data: null,
        queryInfo: {
          cypher: cypherQuery.trim(),
          params: queryParams,
          executionTimeMs,
        },
      });
    }

    const row = result[0];
    const region = row.region;
    const suppliers = row.suppliers || [];
    const components = row.components || [];
    const products = row.products || [];

    // Calculate total revenue risk (sum of prices of impacted products)
    const totalRevenueRisk = products.reduce(
      (sum: number, p: any) => sum + (p.price || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        region,
        suppliers,
        components,
        products,
        impactedProductCount: products.length,
        totalRevenueRisk,
      },
      queryInfo: {
        cypher: cypherQuery.trim(),
        params: queryParams,
        executionTimeMs,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        queryInfo: {
          cypher: cypherQuery.trim(),
          params: queryParams,
          executionTimeMs: 0,
        },
      },
      { status: 500 }
    );
  }
}
