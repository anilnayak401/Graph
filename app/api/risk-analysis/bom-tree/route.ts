import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/neo4j';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') || 'prod_phone';

  // Variable-Length Path Cypher Traversal (RDBMS Awkward Query):
  // Traces nested multi-level Bill of Materials (BOM) up to depth $maxDepth
  const cypherQuery = `
    MATCH (p:Product {id: $productId})
    OPTIONAL MATCH path = (p)-[:REQUIRES|DEPENDS_ON*1..8]->(c:Component)
    OPTIONAL MATCH (c)-[subRel:SUPPLIED_BY]->(s:Supplier)-[:LOCATED_IN]->(r:Region)
    RETURN p AS product,
           c AS component,
           length(path) AS depth,
           s AS supplier,
           r AS region,
           subRel.isPrimary AS isPrimarySupplier,
           subRel.unitPrice AS unitPrice
    ORDER BY depth ASC, c.name ASC
  `;

  const queryParams = { productId, maxDepth: 8 };

  try {
    const startTime = Date.now();
    const records = await runQuery(cypherQuery, queryParams, 'READ');
    const executionTimeMs = Date.now() - startTime;

    if (!records || records.length === 0 || !records[0].product) {
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

    const product = records[0].product;

    // Process nodes into structured multi-level tree structure
    const componentsMap = new Map<string, any>();
    
    records.forEach((row) => {
      if (!row.component) return;

      const compId = row.component.id;
      if (!componentsMap.has(compId)) {
        componentsMap.set(compId, {
          ...row.component,
          depth: row.depth,
          suppliers: [],
        });
      }

      if (row.supplier) {
        const comp = componentsMap.get(compId);
        // Avoid duplicate suppliers
        if (!comp.suppliers.some((sup: any) => sup.id === row.supplier.id)) {
          comp.suppliers.push({
            ...row.supplier,
            region: row.region,
            isPrimary: row.isPrimarySupplier ?? true,
            unitPrice: row.unitPrice ?? row.component.cost,
          });
        }
      }
    });

    const componentsTree = Array.from(componentsMap.values());

    // Calculate aggregate risk score based on components & supplier risk
    let maxSupplierRisk = 0;
    componentsTree.forEach((comp) => {
      comp.suppliers.forEach((sup: any) => {
        if (sup.riskScore > maxSupplierRisk) {
          maxSupplierRisk = sup.riskScore;
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        product,
        totalComponentsCount: componentsTree.length,
        maxDepthReached: Math.max(...componentsTree.map((c) => c.depth), 0),
        maxSupplierRisk,
        components: componentsTree,
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
