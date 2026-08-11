import { NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Query to find components that rely on only a single supplier (Single Point of Failure)
  // or suppliers with risk score >= $minRiskScore
  const cypherQuery = `
    MATCH (c:Component)-[:SUPPLIED_BY]->(s:Supplier)-[:LOCATED_IN]->(r:Region)
    WITH c, collect({supplier: s, region: r}) AS supplierList
    WHERE size(supplierList) = 1 OR any(item IN supplierList WHERE item.supplier.riskScore >= $minRiskScore)
    OPTIONAL MATCH (p:Product)-[:REQUIRES|DEPENDS_ON*1..5]->(c)
    WITH c, supplierList, collect(DISTINCT p) AS affectedProducts
    RETURN c AS component, 
           supplierList[0].supplier AS primarySupplier,
           supplierList[0].region AS supplierRegion,
           size(supplierList) AS totalSupplierCount,
           affectedProducts,
           size(affectedProducts) AS affectedProductCount
    ORDER BY primarySupplier.riskScore DESC, affectedProductCount DESC
  `;

  const queryParams = { minRiskScore: 70 };

  try {
    const startTime = Date.now();
    const records = await runQuery(cypherQuery, queryParams, 'READ');
    const executionTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      spofComponents: records.map((r) => ({
        component: r.component,
        primarySupplier: r.primarySupplier,
        supplierRegion: r.supplierRegion,
        totalSupplierCount: r.totalSupplierCount,
        isSingleSourced: r.totalSupplierCount === 1,
        affectedProducts: r.affectedProducts || [],
        affectedProductCount: r.affectedProductCount || 0,
      })),
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
