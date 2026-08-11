import { runQuery, closeDriver, verifyConnection } from '../lib/neo4j';

/**
 * Seed Script for CognoDB Supply Chain Risk Analyzer
 * 
 * Clears database and seeds a realistic graph network:
 * (Product)-[:REQUIRES]->(Component)-[:DEPENDS_ON*]->(Component)-[:SUPPLIED_BY]->(Supplier)-[:LOCATED_IN]->(Region)
 */

export async function seedDatabase() {
  console.log('🚀 Starting CognoDB Database Seeding Process...');

  // 1. Verify Connection
  const connCheck = await verifyConnection();
  if (!connCheck.success) {
    console.error('❌ Connection Failed:', connCheck.message);
    throw new Error(connCheck.message);
  }
  console.log('✅ Connection verified:', connCheck.message);

  // 2. Clear existing database
  console.log('🧹 Clearing existing database graph...');
  await runQuery('MATCH (n) DETACH DELETE n', {}, 'WRITE');
  console.log('✅ Graph wiped clean.');

  // 3. Create Constraints & Indexes (Ignored if CognoDB auto-handles or syntax differs, wrapped safely)
  try {
    await runQuery('CREATE CONSTRAINT region_id_unique IF NOT EXISTS FOR (r:Region) REQUIRE r.id IS UNIQUE', {}, 'WRITE');
    await runQuery('CREATE CONSTRAINT supplier_id_unique IF NOT EXISTS FOR (s:Supplier) REQUIRE s.id IS UNIQUE', {}, 'WRITE');
    await runQuery('CREATE CONSTRAINT component_id_unique IF NOT EXISTS FOR (c:Component) REQUIRE c.id IS UNIQUE', {}, 'WRITE');
    await runQuery('CREATE CONSTRAINT product_id_unique IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE', {}, 'WRITE');
  } catch (e) {
    // Some Cypher implementations handle constraint creation differently; safe fallback log
    console.log('ℹ️ Constraints check finished (or skipped by database engine).');
  }

  // 4. Seed Regions
  console.log('📍 Seeding Regions...');
  const regions = [
    { id: 'reg_east_asia', name: 'East Asia (Taiwan, Japan, SK)', code: 'EA-01', country: 'Taiwan / Japan / South Korea', riskTier: 'HIGH', vulnerabilityReason: 'Geopolitical tension & seismic earthquake zone' },
    { id: 'reg_west_europe', name: 'Western Europe (Germany, NL)', code: 'EU-01', country: 'Germany / Netherlands / France', riskTier: 'LOW', vulnerabilityReason: 'Strict environmental compliance & energy grid costs' },
    { id: 'reg_north_america', name: 'North America (USA, Canada)', code: 'NA-01', country: 'United States / Canada', riskTier: 'LOW', vulnerabilityReason: 'High labor costs & onshore logistics bottlenecks' },
    { id: 'reg_southeast_asia', name: 'Southeast Asia (Vietnam, MY)', code: 'SEA-01', country: 'Vietnam / Malaysia', riskTier: 'MEDIUM', vulnerabilityReason: 'Monsoon weather & port congestion risks' },
    { id: 'reg_south_america', name: 'South America (Chile, Brazil)', code: 'SA-01', country: 'Chile / Brazil', riskTier: 'HIGH', vulnerabilityReason: 'Raw lithium export duties & political volatility' },
  ];

  for (const r of regions) {
    await runQuery(
      `CREATE (r:Region {
        id: $id,
        name: $name,
        code: $code,
        country: $country,
        riskTier: $riskTier,
        vulnerabilityReason: $vulnerabilityReason
      })`,
      r,
      'WRITE'
    );
  }

  // 5. Seed Suppliers
  console.log('🏭 Seeding Suppliers...');
  const suppliers = [
    { id: 'sup_tsmc', name: 'TSMC Semiconductor Foundry', code: 'SUP-TSMC', riskScore: 88, contactEmail: 'supply@tsmc.com', regionId: 'reg_east_asia' },
    { id: 'sup_asml', name: 'ASML Lithography Tech', code: 'SUP-ASML', riskScore: 22, contactEmail: 'ops@asml.com', regionId: 'reg_west_europe' },
    { id: 'sup_samsung_mem', name: 'Samsung Memory Division', code: 'SUP-SEC', riskScore: 64, contactEmail: 'semicon@samsung.com', regionId: 'reg_east_asia' },
    { id: 'sup_lg_chem', name: 'LG Energy Solution', code: 'SUP-LGE', riskScore: 72, contactEmail: 'batteries@lgchem.com', regionId: 'reg_east_asia' },
    { id: 'sup_sqm', name: 'SQM Lithium Mining Corp', code: 'SUP-SQM', riskScore: 92, contactEmail: 'lithium-sales@sqm.cl', regionId: 'reg_south_america' },
    { id: 'sup_foxconn', name: 'Foxconn Precision Assembly', code: 'SUP-FXC', riskScore: 58, contactEmail: 'orders@foxconn.com', regionId: 'reg_east_asia' },
    { id: 'sup_intel', name: 'Intel Foundry Services', code: 'SUP-INTC', riskScore: 18, contactEmail: 'foundry@intel.com', regionId: 'reg_north_america' },
    { id: 'sup_murata', name: 'Murata Capacitor Works', code: 'SUP-MUR', riskScore: 42, contactEmail: 'sales@murata.jp', regionId: 'reg_east_asia' },
    { id: 'sup_nxp', name: 'NXP Semiconductors', code: 'SUP-NXP', riskScore: 28, contactEmail: 'auto-chips@nxp.com', regionId: 'reg_west_europe' },
    { id: 'sup_stmicro', name: 'STMicroelectronics NV', code: 'SUP-STM', riskScore: 32, contactEmail: 'support@st.com', regionId: 'reg_west_europe' },
    { id: 'sup_infineon', name: 'Infineon Power Systems', code: 'SUP-INF', riskScore: 30, contactEmail: 'power@infineon.com', regionId: 'reg_west_europe' },
    { id: 'sup_tdk', name: 'TDK Electronics Components', code: 'SUP-TDK', riskScore: 40, contactEmail: 'components@tdk.com', regionId: 'reg_east_asia' },
  ];

  for (const s of suppliers) {
    await runQuery(
      `
      MATCH (r:Region {id: $regionId})
      CREATE (s:Supplier {
        id: $id,
        name: $name,
        code: $code,
        riskScore: $riskScore,
        contactEmail: $contactEmail
      })-[:LOCATED_IN]->(r)
      `,
      s,
      'WRITE'
    );
  }

  // 6. Seed Components & Sub-components
  console.log('🧩 Seeding Components & Sub-Components...');
  const components = [
    { id: 'comp_soc_3nm', name: '3nm Neural Processor SoC', sku: 'CMP-SOC-3NM', type: 'Semiconductor', leadTimeDays: 120, cost: 185.00 },
    { id: 'comp_wafer_3nm', name: '3nm Purified Silicon Wafer', sku: 'CMP-WFR-3NM', type: 'Sub-assembly', leadTimeDays: 90, cost: 65.00 },
    { id: 'comp_euv_lens', name: 'High-NA EUV Optics System', sku: 'CMP-EUV-OPT', type: 'Sub-assembly', leadTimeDays: 180, cost: 450.00 },
    { id: 'comp_ram_16gb', name: '16GB LPDDR5X Memory Chip', sku: 'CMP-RAM-16G', type: 'Memory', leadTimeDays: 45, cost: 42.00 },
    { id: 'comp_oled_display', name: '6.7" LTPO 120Hz OLED Screen', sku: 'CMP-DSP-OLED', type: 'Display', leadTimeDays: 60, cost: 95.00 },
    { id: 'comp_li_battery', name: '75kWh / 5000mAh Battery Pack Assembly', sku: 'CMP-BAT-PACK', type: 'Energy', leadTimeDays: 75, cost: 320.00 },
    { id: 'comp_li_cell', name: 'High-Density NMC Lithium Cell', sku: 'CMP-BAT-CELL', type: 'Sub-assembly', leadTimeDays: 60, cost: 180.00 },
    { id: 'comp_raw_lithium', name: 'Battery Grade Lithium Hydroxide', sku: 'CMP-MAT-LITH', type: 'Raw Material', leadTimeDays: 150, cost: 90.00 },
    { id: 'comp_camera_sensor', name: '200MP Quad-Pixel Camera Sensor', sku: 'CMP-CAM-200M', type: 'Optics', leadTimeDays: 50, cost: 55.00 },
    { id: 'comp_lens_glass', name: 'Fluorite Anti-Reflective Glass Element', sku: 'CMP-OPT-GLASS', type: 'Sub-assembly', leadTimeDays: 40, cost: 18.00 },
    { id: 'comp_power_ic', name: 'GaN Power Management IC', sku: 'CMP-PMIC-GAN', type: 'Semiconductor', leadTimeDays: 35, cost: 14.50 },
    { id: 'comp_5g_modem', name: 'Sub-6GHz & mmWave 5G Modem', sku: 'CMP-MOD-5G', type: 'Telecommunications', leadTimeDays: 60, cost: 48.00 },
    { id: 'comp_mcu_auto', name: 'ASIL-D Automotive Safety MCU', sku: 'CMP-MCU-AUTO', type: 'Automotive Chip', leadTimeDays: 90, cost: 28.00 },
    { id: 'comp_mlcc_cap', name: 'High-Temp MLCC Ceramic Capacitors', sku: 'CMP-CAP-MLCC', type: 'Passive Component', leadTimeDays: 20, cost: 3.20 },
    { id: 'comp_titanium_chassis', name: 'Aerospace Grade Titanium Frame', sku: 'CMP-CHS-TIT', type: 'Mechanical', leadTimeDays: 40, cost: 110.00 },
  ];

  for (const c of components) {
    await runQuery(
      `CREATE (c:Component {
        id: $id,
        name: $name,
        sku: $sku,
        type: $type,
        leadTimeDays: $leadTimeDays,
        cost: $cost
      })`,
      c,
      'WRITE'
    );
  }

  // 7. Seed Sub-component Dependencies (Component -> DEPENDS_ON -> Component)
  console.log('🔗 Seeding Multi-level Sub-component Dependencies...');
  const subDependencies = [
    { parentId: 'comp_soc_3nm', childId: 'comp_wafer_3nm', quantity: 1 },
    { parentId: 'comp_wafer_3nm', childId: 'comp_euv_lens', quantity: 1 },
    { parentId: 'comp_li_battery', childId: 'comp_li_cell', quantity: 12 },
    { parentId: 'comp_li_cell', childId: 'comp_raw_lithium', quantity: 1 },
    { parentId: 'comp_camera_sensor', childId: 'comp_lens_glass', quantity: 4 },
  ];

  for (const dep of subDependencies) {
    await runQuery(
      `
      MATCH (parent:Component {id: $parentId})
      MATCH (child:Component {id: $childId})
      CREATE (parent)-[:DEPENDS_ON { quantity: $quantity }]->(child)
      `,
      dep,
      'WRITE'
    );
  }

  // 8. Connect Components to Suppliers (Component -> SUPPLIED_BY -> Supplier)
  console.log('🤝 Linking Components to Suppliers...');
  const componentSuppliers = [
    // 3nm SoC -> ONLY TSMC (CRITICAL SINGLE POINT OF FAILURE SPOF!)
    { componentId: 'comp_soc_3nm', supplierId: 'sup_tsmc', isPrimary: true, unitPrice: 185.00 },
    
    // EUV Lens -> ONLY ASML (CRITICAL SINGLE POINT OF FAILURE SPOF!)
    { componentId: 'comp_euv_lens', supplierId: 'sup_asml', isPrimary: true, unitPrice: 450.00 },
    
    // Wafer -> TSMC & Intel (Dual Sourced)
    { componentId: 'comp_wafer_3nm', supplierId: 'sup_tsmc', isPrimary: true, unitPrice: 65.00 },
    { componentId: 'comp_wafer_3nm', supplierId: 'sup_intel', isPrimary: false, unitPrice: 72.00 },

    // RAM -> Samsung & TSMC (Dual Sourced)
    { componentId: 'comp_ram_16gb', supplierId: 'sup_samsung_mem', isPrimary: true, unitPrice: 42.00 },
    { componentId: 'comp_ram_16gb', supplierId: 'sup_tsmc', isPrimary: false, unitPrice: 45.00 },

    // OLED Display -> Samsung
    { componentId: 'comp_oled_display', supplierId: 'sup_samsung_mem', isPrimary: true, unitPrice: 95.00 },

    // Battery Pack -> LG Chem
    { componentId: 'comp_li_battery', supplierId: 'sup_lg_chem', isPrimary: true, unitPrice: 320.00 },

    // Li Cell -> LG Chem
    { componentId: 'comp_li_cell', supplierId: 'sup_lg_chem', isPrimary: true, unitPrice: 180.00 },

    // Raw Lithium -> ONLY SQM (CRITICAL SINGLE POINT OF FAILURE SPOF!)
    { componentId: 'comp_raw_lithium', supplierId: 'sup_sqm', isPrimary: true, unitPrice: 90.00 },

    // Camera Sensor -> Samsung & Foxconn
    { componentId: 'comp_camera_sensor', supplierId: 'sup_samsung_mem', isPrimary: true, unitPrice: 55.00 },
    { componentId: 'comp_camera_sensor', supplierId: 'sup_foxconn', isPrimary: false, unitPrice: 58.00 },

    // Lens Glass -> Murata & TDK
    { componentId: 'comp_lens_glass', supplierId: 'sup_murata', isPrimary: true, unitPrice: 18.00 },
    { componentId: 'comp_lens_glass', supplierId: 'sup_tdk', isPrimary: false, unitPrice: 20.00 },

    // PMIC -> STMicro & NXP
    { componentId: 'comp_power_ic', supplierId: 'sup_stmicro', isPrimary: true, unitPrice: 14.50 },
    { componentId: 'comp_power_ic', supplierId: 'sup_nxp', isPrimary: false, unitPrice: 15.00 },

    // 5G Modem -> Intel & Qualcomm/TSMC
    { componentId: 'comp_5g_modem', supplierId: 'sup_intel', isPrimary: true, unitPrice: 48.00 },
    { componentId: 'comp_5g_modem', supplierId: 'sup_tsmc', isPrimary: false, unitPrice: 52.00 },

    // Automotive MCU -> Infineon & NXP
    { componentId: 'comp_mcu_auto', supplierId: 'sup_infineon', isPrimary: true, unitPrice: 28.00 },
    { componentId: 'comp_mcu_auto', supplierId: 'sup_nxp', isPrimary: false, unitPrice: 29.50 },

    // MLCC Capacitors -> Murata & TDK
    { componentId: 'comp_mlcc_cap', supplierId: 'sup_murata', isPrimary: true, unitPrice: 3.20 },
    { componentId: 'comp_mlcc_cap', supplierId: 'sup_tdk', isPrimary: false, unitPrice: 3.40 },

    // Titanium Chassis -> Foxconn
    { componentId: 'comp_titanium_chassis', supplierId: 'sup_foxconn', isPrimary: true, unitPrice: 110.00 },
  ];

  for (const cs of componentSuppliers) {
    await runQuery(
      `
      MATCH (c:Component {id: $componentId})
      MATCH (s:Supplier {id: $supplierId})
      CREATE (c)-[:SUPPLIED_BY { isPrimary: $isPrimary, unitPrice: $unitPrice }]->(s)
      `,
      cs,
      'WRITE'
    );
  }

  // 9. Seed Finished Products & Connect to Components
  console.log('📦 Seeding Finished Products...');
  const products = [
    { id: 'prod_phone', name: 'Quantum X Pro Smartphone', sku: 'PRD-QNT-PRO', category: 'Consumer Electronics', price: 1299.00, importance: 'HIGH' },
    { id: 'prod_ev', name: 'Aegis EV Model S Sedan', sku: 'PRD-AEG-EVS', category: 'Automotive Electric Vehicles', price: 68000.00, importance: 'CRITICAL' },
    { id: 'prod_laptop', name: 'Apex Studio Workstation Laptop', sku: 'PRD-APX-STD', category: 'Enterprise Computing', price: 2899.00, importance: 'HIGH' },
    { id: 'prod_drone', name: 'SkyGuardian Industrial Drone', sku: 'PRD-SKY-DRN', category: 'Aerospace & Defense', price: 12500.00, importance: 'HIGH' },
    { id: 'prod_med_mri', name: 'PulseMed Surgical MRI Scanner', sku: 'PRD-PLS-MRI', category: 'Medical Equipment', price: 420000.00, importance: 'CRITICAL' },
    { id: 'prod_sat', name: 'OrbitCom LEO Communications Satellite', sku: 'PRD-ORB-SAT', category: 'Space Telecommunications', price: 1500000.00, importance: 'CRITICAL' },
  ];

  for (const p of products) {
    await runQuery(
      `CREATE (p:Product {
        id: $id,
        name: $name,
        sku: $sku,
        category: $category,
        price: $price,
        importance: $importance
      })`,
      p,
      'WRITE'
    );
  }

  // 10. Link Products to Components (Product -> REQUIRES -> Component)
  console.log('⚡ Linking Products to Required Components...');
  const productRequirements = [
    // Smartphone requirements
    { productId: 'prod_phone', componentId: 'comp_soc_3nm', quantity: 1 },
    { productId: 'prod_phone', componentId: 'comp_ram_16gb', quantity: 1 },
    { productId: 'prod_phone', componentId: 'comp_oled_display', quantity: 1 },
    { productId: 'prod_phone', componentId: 'comp_li_battery', quantity: 1 },
    { productId: 'prod_phone', componentId: 'comp_camera_sensor', quantity: 1 },
    { productId: 'prod_phone', componentId: 'comp_power_ic', quantity: 2 },
    { productId: 'prod_phone', componentId: 'comp_5g_modem', quantity: 1 },
    { productId: 'prod_phone', componentId: 'comp_mlcc_cap', quantity: 50 },
    { productId: 'prod_phone', componentId: 'comp_titanium_chassis', quantity: 1 },

    // EV Sedan requirements
    { productId: 'prod_ev', componentId: 'comp_li_battery', quantity: 1 },
    { productId: 'prod_ev', componentId: 'comp_mcu_auto', quantity: 18 },
    { productId: 'prod_ev', componentId: 'comp_power_ic', quantity: 12 },
    { productId: 'prod_ev', componentId: 'comp_mlcc_cap', quantity: 250 },
    { productId: 'prod_ev', componentId: 'comp_5g_modem', quantity: 2 },

    // Laptop requirements
    { productId: 'prod_laptop', componentId: 'comp_soc_3nm', quantity: 1 },
    { productId: 'prod_laptop', componentId: 'comp_ram_16gb', quantity: 2 },
    { productId: 'prod_laptop', componentId: 'comp_oled_display', quantity: 1 },
    { productId: 'prod_laptop', componentId: 'comp_power_ic', quantity: 4 },
    { productId: 'prod_laptop', componentId: 'comp_titanium_chassis', quantity: 1 },

    // Industrial Drone requirements
    { productId: 'prod_drone', componentId: 'comp_soc_3nm', quantity: 1 },
    { productId: 'prod_drone', componentId: 'comp_camera_sensor', quantity: 2 },
    { productId: 'prod_drone', componentId: 'comp_li_battery', quantity: 2 },
    { productId: 'prod_drone', componentId: 'comp_5g_modem', quantity: 1 },

    // Medical MRI Scanner requirements
    { productId: 'prod_med_mri', componentId: 'comp_mcu_auto', quantity: 8 },
    { productId: 'prod_med_mri', componentId: 'comp_power_ic', quantity: 24 },
    { productId: 'prod_med_mri', componentId: 'comp_mlcc_cap', quantity: 500 },

    // Satellite requirements
    { productId: 'prod_sat', componentId: 'comp_soc_3nm', quantity: 4 },
    { productId: 'prod_sat', componentId: 'comp_5g_modem', quantity: 8 },
    { productId: 'prod_sat', componentId: 'comp_titanium_chassis', quantity: 4 },
  ];

  for (const pr of productRequirements) {
    await runQuery(
      `
      MATCH (p:Product {id: $productId})
      MATCH (c:Component {id: $componentId})
      CREATE (p)-[:REQUIRES { quantity: $quantity }]->(c)
      `,
      pr,
      'WRITE'
    );
  }

  console.log('✨ Seed database populated successfully!');
}

// Allow CLI execution directly (npm run seed)
if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding complete!');
      return closeDriver();
    })
    .catch((err) => {
      console.error('💥 Fatal Seeding Error:', err);
      closeDriver().finally(() => process.exit(1));
    });
}

