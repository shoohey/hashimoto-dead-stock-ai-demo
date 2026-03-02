// ============================================================
// 橋本総業株式会社 不動在庫削減AI デモデータ
// ============================================================

const DemoData = (() => {
  // 乱数シード（再現性のため）
  let seed = 42;
  function seededRandom() {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function randInt(min, max) {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
  }

  function randFloat(min, max, decimals = 2) {
    return parseFloat((seededRandom() * (max - min) + min).toFixed(decimals));
  }

  function pick(arr) {
    return arr[Math.floor(seededRandom() * arr.length)];
  }

  // ---- 40拠点マスタ ----
  const branches = [
    { id: 'BR001', name: '東京本社', region: '関東', prefecture: '東京都' },
    { id: 'BR002', name: '大阪支店', region: '関西', prefecture: '大阪府' },
    { id: 'BR003', name: '名古屋支店', region: '中部', prefecture: '愛知県' },
    { id: 'BR004', name: '福岡支店', region: '九州', prefecture: '福岡県' },
    { id: 'BR005', name: '札幌支店', region: '北海道', prefecture: '北海道' },
    { id: 'BR006', name: '仙台支店', region: '東北', prefecture: '宮城県' },
    { id: 'BR007', name: '広島支店', region: '中国', prefecture: '広島県' },
    { id: 'BR008', name: '横浜支店', region: '関東', prefecture: '神奈川県' },
    { id: 'BR009', name: '千葉支店', region: '関東', prefecture: '千葉県' },
    { id: 'BR010', name: 'さいたま支店', region: '関東', prefecture: '埼玉県' },
    { id: 'BR011', name: '神戸支店', region: '関西', prefecture: '兵庫県' },
    { id: 'BR012', name: '京都支店', region: '関西', prefecture: '京都府' },
    { id: 'BR013', name: '新潟支店', region: '中部', prefecture: '新潟県' },
    { id: 'BR014', name: '静岡支店', region: '中部', prefecture: '静岡県' },
    { id: 'BR015', name: '浜松支店', region: '中部', prefecture: '静岡県' },
    { id: 'BR016', name: '岡山支店', region: '中国', prefecture: '岡山県' },
    { id: 'BR017', name: '高松支店', region: '四国', prefecture: '香川県' },
    { id: 'BR018', name: '松山支店', region: '四国', prefecture: '愛媛県' },
    { id: 'BR019', name: '熊本支店', region: '九州', prefecture: '熊本県' },
    { id: 'BR020', name: '鹿児島支店', region: '九州', prefecture: '鹿児島県' },
    { id: 'BR021', name: '那覇支店', region: '九州', prefecture: '沖縄県' },
    { id: 'BR022', name: '金沢支店', region: '中部', prefecture: '石川県' },
    { id: 'BR023', name: '長野支店', region: '中部', prefecture: '長野県' },
    { id: 'BR024', name: '宇都宮支店', region: '関東', prefecture: '栃木県' },
    { id: 'BR025', name: '水戸支店', region: '関東', prefecture: '茨城県' },
    { id: 'BR026', name: '前橋支店', region: '関東', prefecture: '群馬県' },
    { id: 'BR027', name: '富山支店', region: '中部', prefecture: '富山県' },
    { id: 'BR028', name: '福井支店', region: '中部', prefecture: '福井県' },
    { id: 'BR029', name: '大分支店', region: '九州', prefecture: '大分県' },
    { id: 'BR030', name: '長崎支店', region: '九州', prefecture: '長崎県' },
    { id: 'BR031', name: '宮崎支店', region: '九州', prefecture: '宮崎県' },
    { id: 'BR032', name: '盛岡支店', region: '東北', prefecture: '岩手県' },
    { id: 'BR033', name: '秋田支店', region: '東北', prefecture: '秋田県' },
    { id: 'BR034', name: '山形支店', region: '東北', prefecture: '山形県' },
    { id: 'BR035', name: '福島支店', region: '東北', prefecture: '福島県' },
    { id: 'BR036', name: '甲府支店', region: '中部', prefecture: '山梨県' },
    { id: 'BR037', name: '奈良支店', region: '関西', prefecture: '奈良県' },
    { id: 'BR038', name: '和歌山支店', region: '関西', prefecture: '和歌山県' },
    { id: 'BR039', name: '徳島支店', region: '四国', prefecture: '徳島県' },
    { id: 'BR040', name: '高知支店', region: '四国', prefecture: '高知県' },
  ];

  // ---- 商品カテゴリマスタ ----
  const categories = [
    { id: 'CAT01', name: '管材・継手', color: '#3B82F6' },
    { id: 'CAT02', name: 'バルブ', color: '#EF4444' },
    { id: 'CAT03', name: '住設機器', color: '#10B981' },
    { id: 'CAT04', name: '空調機器', color: '#F59E0B' },
    { id: 'CAT05', name: '電設資材', color: '#8B5CF6' },
    { id: 'CAT06', name: '給排水設備', color: '#EC4899' },
    { id: 'CAT07', name: 'ポンプ', color: '#06B6D4' },
    { id: 'CAT08', name: '衛生陶器', color: '#84CC16' },
  ];

  // ---- 商品マスタ（サンプル）----
  const productTemplates = [
    { cat: 'CAT01', names: ['VP管 50A', 'VP管 75A', 'VP管 100A', 'HI継手 エルボ 50A', 'HI継手 チーズ 75A', 'HIVP管 20A', 'SGP管 25A', 'SUS管 50A', 'PE管 30A', 'ライニング管 80A'] },
    { cat: 'CAT02', names: ['ゲートバルブ 50A', 'ボールバルブ 25A', 'バタフライバルブ 100A', 'チェックバルブ 50A', 'グローブバルブ 40A', '電動バルブ 80A', 'ストレーナ 50A', '減圧弁 25A'] },
    { cat: 'CAT03', names: ['システムキッチン TypeA', 'システムキッチン TypeB', 'ユニットバス 1616', 'ユニットバス 1218', '洗面化粧台 750', '洗面化粧台 900', 'トイレ一体型 GG', 'シャワーユニット'] },
    { cat: 'CAT04', names: ['ルームエアコン 2.2kW', 'ルームエアコン 4.0kW', 'パッケージエアコン 5HP', 'GHP 10HP', '換気扇 天埋型', '換気扇 壁付型', 'ダクト用送風機', '全熱交換器'] },
    { cat: 'CAT05', names: ['VVFケーブル 2C', 'VVFケーブル 3C', 'CV線 38sq', '配電盤 標準型', '分電盤 住宅用', 'LED照明 40W型', 'LED照明 直管型', 'コンセント 2口'] },
    { cat: 'CAT06', names: ['排水トラップ 50A', '排水管 VU100', '排水桝 300型', '通気弁 40A', 'グリーストラップ', '雨水タンク 200L', '量水器BOX', '水道メーター 25mm'] },
    { cat: 'CAT07', names: ['渦巻ポンプ 1.5kW', '水中ポンプ 0.75kW', '加圧ポンプユニット', '給湯循環ポンプ', '深井戸ポンプ', '汚水ポンプ 2.2kW', 'ブースターポンプ', '消火ポンプ'] },
    { cat: 'CAT08', names: ['洋風便器 CS230', '和風便器 C750', '手洗器 L210', '洗面器 L270', '小便器 U307','ウォシュレット TCF', '手洗カウンター', 'アクセサリー棚'] },
  ];

  // ---- 商品マスタ生成 ----
  let products = [];
  let productId = 1;
  productTemplates.forEach(tmpl => {
    tmpl.names.forEach(name => {
      products.push({
        id: `P${String(productId).padStart(4, '0')}`,
        name: name,
        categoryId: tmpl.cat,
        categoryName: categories.find(c => c.id === tmpl.cat).name,
        unitPrice: (() => {
          switch (tmpl.cat) {
            case 'CAT01': return randInt(500, 15000);
            case 'CAT02': return randInt(3000, 80000);
            case 'CAT03': return randInt(50000, 800000);
            case 'CAT04': return randInt(30000, 500000);
            case 'CAT05': return randInt(200, 50000);
            case 'CAT06': return randInt(1000, 30000);
            case 'CAT07': return randInt(20000, 300000);
            case 'CAT08': return randInt(5000, 200000);
            default: return randInt(1000, 50000);
          }
        })(),
      });
      productId++;
    });
  });

  // ---- 在庫データ生成 ----
  const today = new Date('2026-03-02');

  function generateInventory() {
    const inventory = [];
    let invId = 1;

    branches.forEach(branch => {
      // 各拠点で取り扱う商品数を調整（大きい拠点ほど多い）
      const productCount = branch.region === '関東' ? randInt(50, 70) :
                          branch.region === '関西' ? randInt(40, 60) :
                          randInt(25, 45);

      // 取り扱い商品をランダムに選択
      const shuffled = [...products].sort(() => seededRandom() - 0.5);
      const branchProducts = shuffled.slice(0, Math.min(productCount, products.length));

      branchProducts.forEach(product => {
        const qty = randInt(1, 200);
        const daysNoShipment = (() => {
          const r = seededRandom();
          if (r < 0.25) return randInt(0, 30);      // 25% 直近出荷
          if (r < 0.50) return randInt(31, 90);      // 25% 1-3ヶ月
          if (r < 0.70) return randInt(91, 180);     // 20% 3-6ヶ月
          if (r < 0.85) return randInt(181, 365);    // 15% 6-12ヶ月（不動在庫）
          return randInt(366, 730);                  // 15% 1年以上（不動在庫）
        })();

        const lastShipmentDate = new Date(today);
        lastShipmentDate.setDate(lastShipmentDate.getDate() - daysNoShipment);

        const isDeadStock = daysNoShipment >= 180; // 半年 = 180日
        const monthlyDemand = isDeadStock ? randFloat(0, 0.5) : randFloat(1, 30);
        const annualSales = isDeadStock ? product.unitPrice * qty * randFloat(0, 0.1) : product.unitPrice * monthlyDemand * 12;
        const avgInventoryValue = product.unitPrice * qty;
        const turnoverRate = annualSales > 0 ? parseFloat((annualSales / avgInventoryValue).toFixed(2)) : 0;

        // リベート率（カテゴリと取引量に依存）
        const rebateRate = (() => {
          if (avgInventoryValue > 500000) return randFloat(3, 8);
          if (avgInventoryValue > 100000) return randFloat(1.5, 5);
          return randFloat(0.5, 3);
        })();

        inventory.push({
          id: `INV${String(invId).padStart(5, '0')}`,
          branchId: branch.id,
          branchName: branch.name,
          region: branch.region,
          productId: product.id,
          productName: product.name,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          quantity: qty,
          unitPrice: product.unitPrice,
          totalValue: product.unitPrice * qty,
          lastShipmentDate: lastShipmentDate.toISOString().split('T')[0],
          daysSinceLastShipment: daysNoShipment,
          isDeadStock: isDeadStock,
          turnoverRate: turnoverRate,
          monthlyDemand: monthlyDemand,
          rebateRate: rebateRate,
          rebateAmount: Math.round(avgInventoryValue * rebateRate / 100),
          riskLevel: daysNoShipment >= 365 ? 'high' : daysNoShipment >= 180 ? 'medium' : 'low',
          // AI推奨アクション
          recommendation: isDeadStock ? pick([
            '他拠点への移管を推奨',
            '値下げ販売を検討',
            '仕入先への返品交渉',
            'セット販売でのプロモーション',
            '廃棄検討（在庫評価損計上）',
            'ECサイトでの特価販売',
            '関連商品とのバンドル販売',
          ]) : null,
        });
        invId++;
      });
    });

    return inventory;
  }

  // ---- 月別推移データ生成 ----
  function generateMonthlyTrend() {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today);
      d.setMonth(d.getMonth() - i);
      const monthStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      // 不動在庫は徐々に増加傾向（AI導入前）
      const baseDeadStock = 180000000 + i * 2000000;
      const totalInventory = 850000000 + randInt(-20000000, 20000000);
      const deadStockValue = baseDeadStock + randInt(-5000000, 5000000);

      months.push({
        month: monthStr,
        totalInventory: totalInventory,
        deadStockValue: Math.max(deadStockValue, 0),
        deadStockRate: parseFloat((deadStockValue / totalInventory * 100).toFixed(1)),
        avgTurnoverRate: randFloat(3.5, 5.5),
        totalRebate: randInt(8000000, 15000000),
      });
    }

    // 直近3ヶ月はAI導入効果で改善トレンド
    for (let i = 2; i >= 0; i--) {
      const idx = months.length - 1 - i;
      months[idx].deadStockValue = Math.round(months[idx].deadStockValue * (0.85 + i * 0.05));
      months[idx].deadStockRate = parseFloat((months[idx].deadStockValue / months[idx].totalInventory * 100).toFixed(1));
      months[idx].avgTurnoverRate = parseFloat((months[idx].avgTurnoverRate * (1.05 + (2 - i) * 0.03)).toFixed(2));
    }

    return months;
  }

  // ---- 拠点サマリー生成 ----
  function generateBranchSummary(inventory) {
    return branches.map(branch => {
      const branchItems = inventory.filter(inv => inv.branchId === branch.id);
      const deadStockItems = branchItems.filter(inv => inv.isDeadStock);
      const totalValue = branchItems.reduce((sum, inv) => sum + inv.totalValue, 0);
      const deadStockValue = deadStockItems.reduce((sum, inv) => sum + inv.totalValue, 0);
      const avgTurnover = branchItems.length > 0
        ? parseFloat((branchItems.reduce((sum, inv) => sum + inv.turnoverRate, 0) / branchItems.length).toFixed(2))
        : 0;
      const totalRebate = branchItems.reduce((sum, inv) => sum + inv.rebateAmount, 0);

      return {
        ...branch,
        totalItems: branchItems.length,
        totalValue: totalValue,
        deadStockItems: deadStockItems.length,
        deadStockValue: deadStockValue,
        deadStockRate: totalValue > 0 ? parseFloat((deadStockValue / totalValue * 100).toFixed(1)) : 0,
        avgTurnoverRate: avgTurnover,
        totalRebate: totalRebate,
        highRiskItems: branchItems.filter(inv => inv.riskLevel === 'high').length,
        mediumRiskItems: branchItems.filter(inv => inv.riskLevel === 'medium').length,
        score: (() => {
          // AIスコア（不動在庫削減余地）
          const rate = totalValue > 0 ? deadStockValue / totalValue : 0;
          if (rate > 0.35) return { value: randInt(25, 45), label: '要改善', class: 'score-bad' };
          if (rate > 0.25) return { value: randInt(46, 65), label: '注意', class: 'score-warn' };
          if (rate > 0.15) return { value: randInt(66, 80), label: '良好', class: 'score-ok' };
          return { value: randInt(81, 95), label: '優秀', class: 'score-good' };
        })(),
      };
    });
  }

  // ---- データ生成実行 ----
  const inventory = generateInventory();
  const monthlyTrend = generateMonthlyTrend();
  const branchSummary = generateBranchSummary(inventory);

  // ---- 集計KPI ----
  const kpi = {
    totalInventoryValue: inventory.reduce((sum, inv) => sum + inv.totalValue, 0),
    totalDeadStockValue: inventory.filter(inv => inv.isDeadStock).reduce((sum, inv) => sum + inv.totalValue, 0),
    totalItems: inventory.length,
    deadStockItems: inventory.filter(inv => inv.isDeadStock).length,
    avgTurnoverRate: parseFloat((inventory.reduce((sum, inv) => sum + inv.turnoverRate, 0) / inventory.length).toFixed(2)),
    totalRebate: inventory.reduce((sum, inv) => sum + inv.rebateAmount, 0),
    get deadStockRate() {
      return parseFloat((this.totalDeadStockValue / this.totalInventoryValue * 100).toFixed(1));
    },
    get estimatedSavings() {
      return Math.round(this.totalDeadStockValue * 0.35); // AI削減見込み35%
    },
  };

  // ---- カテゴリ別集計 ----
  const categorySummary = categories.map(cat => {
    const catItems = inventory.filter(inv => inv.categoryId === cat.id);
    const deadItems = catItems.filter(inv => inv.isDeadStock);
    return {
      ...cat,
      totalItems: catItems.length,
      totalValue: catItems.reduce((sum, inv) => sum + inv.totalValue, 0),
      deadStockItems: deadItems.length,
      deadStockValue: deadItems.reduce((sum, inv) => sum + inv.totalValue, 0),
      avgTurnoverRate: catItems.length > 0
        ? parseFloat((catItems.reduce((sum, inv) => sum + inv.turnoverRate, 0) / catItems.length).toFixed(2))
        : 0,
    };
  });

  // ---- 公開API ----
  return {
    branches,
    categories,
    products,
    inventory,
    monthlyTrend,
    branchSummary,
    kpi,
    categorySummary,

    // フィルタ関数
    getInventoryByBranch(branchId) {
      return inventory.filter(inv => inv.branchId === branchId);
    },
    getDeadStock(branchId = null) {
      let items = inventory.filter(inv => inv.isDeadStock);
      if (branchId) items = items.filter(inv => inv.branchId === branchId);
      return items.sort((a, b) => b.totalValue - a.totalValue);
    },
    getInventoryByCategory(categoryId) {
      return inventory.filter(inv => inv.categoryId === categoryId);
    },
    getBranchDetail(branchId) {
      return branchSummary.find(b => b.id === branchId);
    },

    // ユーティリティ
    formatCurrency(value) {
      if (value >= 100000000) return `${(value / 100000000).toFixed(1)}億円`;
      if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}万円`;
      return `${value.toLocaleString()}円`;
    },
    formatNumber(value) {
      return value.toLocaleString();
    },
  };
})();
