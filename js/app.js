// ============================================================
// 橋本総業株式会社 不動在庫削減AI - メインアプリケーション
// ============================================================

(() => {
  'use strict';

  const D = DemoData;
  let charts = {};

  // ---- ユーティリティ ----
  function fmt(value) { return D.formatCurrency(value); }
  function fmtN(value) { return D.formatNumber(value); }

  function getRiskBadge(level) {
    if (level === 'high') return '<span class="badge badge-danger">高</span>';
    if (level === 'medium') return '<span class="badge badge-warning">中</span>';
    return '<span class="badge badge-success">低</span>';
  }

  function getScoreHtml(score) {
    return `<span class="${score.class}" style="font-weight:700">${score.value}</span>
      <div class="score-bar ${score.class}">
        <div class="score-bar-fill" style="width:${score.value}%"></div>
      </div>`;
  }

  // ---- ページナビゲーション ----
  const pageNames = {
    dashboard: 'ダッシュボード',
    branches: '拠点別分析',
    deadstock: '不動在庫一覧',
    turnover: '回転率分析',
    rebate: 'リベート管理',
    ai: 'AI推奨アクション',
    simulation: '削減シミュレーション',
  };

  function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    document.getElementById('pageTitle').textContent = pageNames[page] || '';

    // 遅延初期化
    if (page === 'turnover' && !charts.turnoverCategory) initTurnoverPage();
    if (page === 'rebate' && !charts.rebateCategory) initRebatePage();
    if (page === 'ai' && !document.getElementById('aiSummaryText').textContent) initAiPage();
    if (page === 'simulation' && !charts.simulation) initSimulationPage();
  }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // ===================================================================
  // ダッシュボード
  // ===================================================================
  function initDashboard() {
    // KPIカード
    const kpiData = [
      { label: '📦 総在庫金額', value: fmt(D.kpi.totalInventoryValue), cls: '', change: null },
      { label: '⚠️ 不動在庫金額', value: fmt(D.kpi.totalDeadStockValue), cls: 'danger', change: { text: '前月比 -3.2%', dir: 'down' } },
      { label: '📉 不動在庫率', value: D.kpi.deadStockRate + '%', cls: 'warning', change: { text: '前月比 -1.5pt', dir: 'down' } },
      { label: '🔄 平均回転率', value: D.kpi.avgTurnoverRate + '回', cls: 'primary', change: { text: '前月比 +0.3', dir: 'down' } },
      { label: '💰 リベート対象', value: fmt(D.kpi.totalRebate), cls: '', change: null },
      { label: '🎯 AI削減見込み', value: fmt(D.kpi.estimatedSavings), cls: 'success', change: null },
    ];

    const kpiGrid = document.getElementById('kpiGrid');
    kpiGrid.innerHTML = kpiData.map((k, i) => `
      <div class="kpi-card animate-in delay-${Math.min(i + 1, 5)}">
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value ${k.cls}">${k.value}</div>
        ${k.change ? `<div class="kpi-change ${k.change.dir}">${k.change.dir === 'down' ? '↓' : '↑'} ${k.change.text}</div>` : ''}
      </div>
    `).join('');

    // 不動在庫推移チャート
    const trendCtx = document.getElementById('chartTrend').getContext('2d');
    charts.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: D.monthlyTrend.map(m => m.month),
        datasets: [
          {
            label: '不動在庫金額',
            data: D.monthlyTrend.map(m => Math.round(m.deadStockValue / 10000)),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            borderWidth: 2,
          },
          {
            label: '総在庫金額',
            data: D.monthlyTrend.map(m => Math.round(m.totalInventory / 10000)),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}万円`,
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: v => v.toLocaleString() + '万円' },
          },
        },
      },
    });

    // カテゴリ別在庫構成
    const catCtx = document.getElementById('chartCategory').getContext('2d');
    charts.category = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: D.categorySummary.map(c => c.name),
        datasets: [{
          data: D.categorySummary.map(c => c.totalValue),
          backgroundColor: D.categorySummary.map(c => c.color),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                return `${ctx.label}: ${fmt(ctx.parsed)} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    // ワースト10
    const sortedBranches = [...D.branchSummary].sort((a, b) => b.deadStockRate - a.deadStockRate);
    const worst10 = sortedBranches.slice(0, 10);
    const worstCtx = document.getElementById('chartWorst').getContext('2d');
    charts.worst = new Chart(worstCtx, {
      type: 'bar',
      data: {
        labels: worst10.map(b => b.name),
        datasets: [{
          label: '不動在庫率 (%)',
          data: worst10.map(b => b.deadStockRate),
          backgroundColor: worst10.map(b =>
            b.deadStockRate > 35 ? '#EF4444' :
            b.deadStockRate > 25 ? '#F59E0B' : '#3B82F6'
          ),
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { callback: v => v + '%' }, max: 50 },
        },
      },
    });

    // 回転率分布
    const turnoverBuckets = [0, 1, 2, 3, 4, 5, 6, 8, 10, 999];
    const turnoverLabels = ['0', '0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-8', '8-10', '10+'];
    const turnoverCounts = new Array(turnoverLabels.length).fill(0);
    D.inventory.forEach(inv => {
      for (let i = 0; i < turnoverBuckets.length; i++) {
        if (inv.turnoverRate <= turnoverBuckets[i]) {
          turnoverCounts[i]++;
          break;
        }
      }
    });
    const turnCtx = document.getElementById('chartTurnover').getContext('2d');
    charts.turnoverDist = new Chart(turnCtx, {
      type: 'bar',
      data: {
        labels: turnoverLabels,
        datasets: [{
          label: '商品数',
          data: turnoverCounts,
          backgroundColor: turnoverCounts.map((_, i) =>
            i <= 1 ? '#EF4444' : i <= 3 ? '#F59E0B' : '#10B981'
          ),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: '回転率' } },
          y: { title: { display: true, text: 'SKU数' } },
        },
      },
    });

    // AI推奨アクション（ダッシュボード）
    const topDeadStock = D.getDeadStock().slice(0, 5);
    const actionsHtml = `
      <div class="ai-card">
        <div class="ai-card-header"><span>🎯</span> 最優先：高リスク不動在庫の削減</div>
        <p>全40拠点合計で <strong>${fmtN(D.kpi.deadStockItems)}件</strong> の不動在庫（<strong>${fmt(D.kpi.totalDeadStockValue)}</strong>）が検出されています。
        AIの分析により、<strong>${fmt(D.kpi.estimatedSavings)}</strong> の削減が見込まれます。</p>
      </div>
      <div class="ai-card">
        <div class="ai-card-header"><span>🔄</span> 拠点間移管の推奨</div>
        <p>回転率0の商品が他拠点で需要があるケースを <strong>${Math.round(D.kpi.deadStockItems * 0.18)}件</strong> 検出しました。
        移管により <strong>${fmt(Math.round(D.kpi.totalDeadStockValue * 0.12))}</strong> の在庫適正化が可能です。</p>
      </div>
      <div class="ai-card">
        <div class="ai-card-header"><span>💰</span> リベート最適化</div>
        <p>不動在庫に含まれるリベート対象商品の分析から、仕入先との返品交渉により
        <strong>${fmt(Math.round(D.kpi.totalRebate * 0.08))}</strong> のコスト回収が見込まれます。</p>
      </div>
    `;
    document.getElementById('dashboardAiActions').innerHTML = actionsHtml;

    // 拠点アラート数
    const alertCount = D.branchSummary.filter(b => b.deadStockRate > 30).length;
    document.getElementById('branchAlertCount').textContent = alertCount;
  }

  // ===================================================================
  // 拠点別分析
  // ===================================================================
  let branchSortKey = 'deadStockRate';
  let branchSortDir = 'desc';

  function renderBranchTable() {
    const regionFilter = document.getElementById('branchRegionFilter').value;
    const searchText = document.getElementById('branchSearch').value.toLowerCase();

    let data = [...D.branchSummary];
    if (regionFilter) data = data.filter(b => b.region === regionFilter);
    if (searchText) data = data.filter(b => b.name.toLowerCase().includes(searchText));

    data.sort((a, b) => {
      let aVal = branchSortKey === 'score' ? a.score.value : a[branchSortKey];
      let bVal = branchSortKey === 'score' ? b.score.value : b[branchSortKey];
      if (typeof aVal === 'string') return branchSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return branchSortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const tbody = document.getElementById('branchTableBody');
    tbody.innerHTML = data.map(b => `
      <tr class="clickable" onclick="openBranchModal('${b.id}')">
        <td><strong>${b.name}</strong></td>
        <td><span class="region-tag" data-region="${b.region}">${b.region}</span></td>
        <td>${fmtN(b.totalItems)}</td>
        <td>${fmt(b.totalValue)}</td>
        <td style="color:${b.deadStockValue > 5000000 ? 'var(--danger)' : 'inherit'};font-weight:600">${fmt(b.deadStockValue)}</td>
        <td>
          <span style="font-weight:700;color:${b.deadStockRate > 35 ? 'var(--danger)' : b.deadStockRate > 25 ? 'var(--warning)' : 'var(--success)'}">${b.deadStockRate}%</span>
          <div class="progress-bar" style="width:80px;display:inline-block;vertical-align:middle;margin-left:6px;">
            <div class="progress-bar-fill" style="width:${Math.min(b.deadStockRate, 50) * 2}%;background:${b.deadStockRate > 35 ? 'var(--danger)' : b.deadStockRate > 25 ? 'var(--warning)' : 'var(--success)'}"></div>
          </div>
        </td>
        <td>${b.avgTurnoverRate}回</td>
        <td>${fmt(b.totalRebate)}</td>
        <td>${getScoreHtml(b.score)}</td>
      </tr>
    `).join('');
  }

  // テーブルソート
  document.querySelectorAll('#branchTable th').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (!key) return;
      if (branchSortKey === key) {
        branchSortDir = branchSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        branchSortKey = key;
        branchSortDir = 'desc';
      }
      renderBranchTable();
    });
  });

  document.getElementById('branchRegionFilter').addEventListener('change', renderBranchTable);
  document.getElementById('branchSearch').addEventListener('input', renderBranchTable);

  // 拠点詳細モーダル
  window.openBranchModal = function(branchId) {
    const branch = D.getBranchDetail(branchId);
    const items = D.getInventoryByBranch(branchId);
    const deadItems = items.filter(inv => inv.isDeadStock).sort((a, b) => b.totalValue - a.totalValue);

    document.getElementById('branchModalTitle').textContent = `${branch.name} - 詳細分析`;

    const body = document.getElementById('branchModalBody');
    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-stat">
          <div class="detail-stat-value">${fmtN(branch.totalItems)}</div>
          <div class="detail-stat-label">SKU数</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-value" style="color:var(--primary-light)">${fmt(branch.totalValue)}</div>
          <div class="detail-stat-label">在庫金額</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-value" style="color:var(--danger)">${fmt(branch.deadStockValue)}</div>
          <div class="detail-stat-label">不動在庫額</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-value" style="color:${branch.deadStockRate > 30 ? 'var(--danger)' : 'var(--warning)'}">${branch.deadStockRate}%</div>
          <div class="detail-stat-label">不動在庫率</div>
        </div>
      </div>

      <div class="ai-card">
        <div class="ai-card-header"><span>🤖</span> AI分析（${branch.name}）</div>
        <p>この拠点の不動在庫率は <strong>${branch.deadStockRate}%</strong> で、
        ${branch.deadStockRate > 30 ? '全社平均を大幅に上回っています。早急な対策が必要です。' :
          branch.deadStockRate > 20 ? '全社平均をやや上回っています。改善の余地があります。' :
          '全社平均を下回っており、良好な管理状態です。'}
        高リスク商品が <strong>${branch.highRiskItems}件</strong>、
        中リスク商品が <strong>${branch.mediumRiskItems}件</strong> あります。</p>
      </div>

      <h4 style="margin:16px 0 8px;font-size:14px;">不動在庫 上位商品</h4>
      <div class="table-container">
        <table>
          <thead>
            <tr><th>リスク</th><th>商品名</th><th>カテゴリ</th><th>数量</th><th>金額</th><th>経過日数</th><th>AI推奨</th></tr>
          </thead>
          <tbody>
            ${deadItems.slice(0, 15).map(item => `
              <tr>
                <td>${getRiskBadge(item.riskLevel)}</td>
                <td>${item.productName}</td>
                <td>${item.categoryName}</td>
                <td>${fmtN(item.quantity)}</td>
                <td style="font-weight:600">${fmt(item.totalValue)}</td>
                <td>${item.daysSinceLastShipment}日</td>
                <td><span class="badge badge-info">${item.recommendation || '-'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('branchModal').classList.add('show');
  };

  window.closeBranchModal = function() {
    document.getElementById('branchModal').classList.remove('show');
  };

  document.getElementById('branchModal').addEventListener('click', e => {
    if (e.target === document.getElementById('branchModal')) closeBranchModal();
  });

  // ===================================================================
  // 不動在庫一覧
  // ===================================================================
  let deadstockPage = 1;
  const deadstockPerPage = 30;

  function initDeadstockFilters() {
    const branchFilter = document.getElementById('deadstockBranchFilter');
    D.branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      branchFilter.appendChild(opt);
    });

    const catFilter = document.getElementById('deadstockCategoryFilter');
    D.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catFilter.appendChild(opt);
    });

    branchFilter.addEventListener('change', () => { deadstockPage = 1; renderDeadstock(); });
    catFilter.addEventListener('change', () => { deadstockPage = 1; renderDeadstock(); });
    document.getElementById('deadstockRiskFilter').addEventListener('change', () => { deadstockPage = 1; renderDeadstock(); });
  }

  function renderDeadstock() {
    const branchId = document.getElementById('deadstockBranchFilter').value;
    const catId = document.getElementById('deadstockCategoryFilter').value;
    const risk = document.getElementById('deadstockRiskFilter').value;

    let data = D.getDeadStock(branchId || null);
    if (catId) data = data.filter(inv => inv.categoryId === catId);
    if (risk) data = data.filter(inv => inv.riskLevel === risk);

    // KPI
    const totalDeadValue = data.reduce((sum, inv) => sum + inv.totalValue, 0);
    const highRiskCount = data.filter(inv => inv.riskLevel === 'high').length;
    document.getElementById('deadstockKpi').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">📦 不動在庫件数</div>
        <div class="kpi-value danger">${fmtN(data.length)}件</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">💴 不動在庫金額</div>
        <div class="kpi-value danger">${fmt(totalDeadValue)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">🔴 高リスク（1年以上）</div>
        <div class="kpi-value warning">${fmtN(highRiskCount)}件</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">🎯 削減見込み</div>
        <div class="kpi-value success">${fmt(Math.round(totalDeadValue * 0.35))}</div>
      </div>
    `;

    // ページネーション
    const totalPages = Math.ceil(data.length / deadstockPerPage);
    const pageData = data.slice((deadstockPage - 1) * deadstockPerPage, deadstockPage * deadstockPerPage);

    const tbody = document.getElementById('deadstockTableBody');
    tbody.innerHTML = pageData.map(inv => `
      <tr>
        <td>${getRiskBadge(inv.riskLevel)}</td>
        <td>${inv.branchName}</td>
        <td>${inv.productName}</td>
        <td>${inv.categoryName}</td>
        <td>${fmtN(inv.quantity)}</td>
        <td style="font-weight:600">${fmt(inv.totalValue)}</td>
        <td>${inv.lastShipmentDate}</td>
        <td style="color:${inv.daysSinceLastShipment > 365 ? 'var(--danger)' : 'var(--warning)'};font-weight:600">${inv.daysSinceLastShipment}日</td>
        <td>${inv.turnoverRate}</td>
        <td><span class="badge badge-info">${inv.recommendation || '-'}</span></td>
      </tr>
    `).join('');

    // ページネーション
    const pag = document.getElementById('deadstockPagination');
    if (totalPages <= 1) {
      pag.innerHTML = '';
      return;
    }
    let pagHtml = `<button ${deadstockPage <= 1 ? 'disabled' : ''} onclick="changeDeadstockPage(${deadstockPage - 1})">← 前</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages > 7 && i > 3 && i < totalPages - 2 && Math.abs(i - deadstockPage) > 1) {
        if (i === 4 || i === totalPages - 3) pagHtml += '<button disabled>...</button>';
        continue;
      }
      pagHtml += `<button class="${i === deadstockPage ? 'active' : ''}" onclick="changeDeadstockPage(${i})">${i}</button>`;
    }
    pagHtml += `<button ${deadstockPage >= totalPages ? 'disabled' : ''} onclick="changeDeadstockPage(${deadstockPage + 1})">次 →</button>`;
    pag.innerHTML = pagHtml;
  }

  window.changeDeadstockPage = function(page) {
    deadstockPage = page;
    renderDeadstock();
  };

  // CSV出力
  document.getElementById('deadstockExportBtn').addEventListener('click', () => {
    const data = D.getDeadStock();
    const header = 'リスク,拠点,商品名,カテゴリ,数量,在庫金額,最終出荷日,経過日数,回転率,AI推奨\n';
    const rows = data.map(inv =>
      `${inv.riskLevel},${inv.branchName},${inv.productName},${inv.categoryName},${inv.quantity},${inv.totalValue},${inv.lastShipmentDate},${inv.daysSinceLastShipment},${inv.turnoverRate},${inv.recommendation || ''}`
    ).join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `不動在庫一覧_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ===================================================================
  // 回転率分析
  // ===================================================================
  function initTurnoverPage() {
    // カテゴリ別回転率
    const ctx1 = document.getElementById('chartTurnoverCategory').getContext('2d');
    charts.turnoverCategory = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: D.categorySummary.map(c => c.name),
        datasets: [
          {
            label: '平均回転率',
            data: D.categorySummary.map(c => c.avgTurnoverRate),
            backgroundColor: D.categorySummary.map(c => c.color),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { title: { display: true, text: '回転率（回/年）' } },
        },
      },
    });

    // 拠点別回転率
    const sortedByTurnover = [...D.branchSummary].sort((a, b) => a.avgTurnoverRate - b.avgTurnoverRate);
    const ctx2 = document.getElementById('chartTurnoverBranch').getContext('2d');
    charts.turnoverBranch = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: sortedByTurnover.map(b => b.name),
        datasets: [{
          label: '平均回転率',
          data: sortedByTurnover.map(b => b.avgTurnoverRate),
          backgroundColor: sortedByTurnover.map(b =>
            b.avgTurnoverRate < 1.5 ? '#EF4444' :
            b.avgTurnoverRate < 3 ? '#F59E0B' : '#10B981'
          ),
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { title: { display: true, text: '回転率（回/年）' } },
        },
      },
    });

    // ヒートマップテーブル
    const hHead = document.getElementById('turnoverHeatmapHead');
    const hBody = document.getElementById('turnoverHeatmapBody');
    hHead.innerHTML = `<tr><th>拠点</th>${D.categories.map(c => `<th style="font-size:11px">${c.name}</th>`).join('')}<th>平均</th></tr>`;

    hBody.innerHTML = D.branchSummary.slice(0, 20).map(branch => {
      const cells = D.categories.map(cat => {
        const items = D.inventory.filter(inv => inv.branchId === branch.id && inv.categoryId === cat.id);
        if (items.length === 0) return '<td style="background:#F1F5F9;text-align:center;color:#94A3B8">-</td>';
        const avg = items.reduce((s, inv) => s + inv.turnoverRate, 0) / items.length;
        const bg = avg < 1 ? '#FEE2E2' : avg < 2 ? '#FFFBEB' : avg < 4 ? '#F0FDF4' : '#D1FAE5';
        const color = avg < 1 ? '#DC2626' : avg < 2 ? '#D97706' : '#059669';
        return `<td style="background:${bg};text-align:center;font-weight:600;color:${color}">${avg.toFixed(1)}</td>`;
      });
      return `<tr><td><strong>${branch.name}</strong></td>${cells.join('')}<td style="font-weight:700">${branch.avgTurnoverRate}</td></tr>`;
    }).join('');
  }

  // ===================================================================
  // リベート管理
  // ===================================================================
  function initRebatePage() {
    // KPI
    const deadStockRebate = D.inventory.filter(inv => inv.isDeadStock).reduce((sum, inv) => sum + inv.rebateAmount, 0);
    document.getElementById('rebateKpi').innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">💰 総リベート額</div>
        <div class="kpi-value primary">${fmt(D.kpi.totalRebate)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">⚠️ 不動在庫リベート</div>
        <div class="kpi-value danger">${fmt(deadStockRebate)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">📊 不動在庫リベート比率</div>
        <div class="kpi-value warning">${(deadStockRebate / D.kpi.totalRebate * 100).toFixed(1)}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">🎯 返品交渉による回収見込み</div>
        <div class="kpi-value success">${fmt(Math.round(deadStockRebate * 0.4))}</div>
      </div>
    `;

    // カテゴリ別リベート
    const catRebate = D.categories.map(cat => {
      const items = D.inventory.filter(inv => inv.categoryId === cat.id);
      return {
        name: cat.name,
        total: items.reduce((s, inv) => s + inv.rebateAmount, 0),
        deadStock: items.filter(inv => inv.isDeadStock).reduce((s, inv) => s + inv.rebateAmount, 0),
        color: cat.color,
      };
    });

    const ctx1 = document.getElementById('chartRebateCategory').getContext('2d');
    charts.rebateCategory = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: catRebate.map(c => c.name),
        datasets: [
          { label: '通常在庫リベート', data: catRebate.map(c => Math.round((c.total - c.deadStock) / 10000)), backgroundColor: '#3B82F6', borderRadius: 4 },
          { label: '不動在庫リベート', data: catRebate.map(c => Math.round(c.deadStock / 10000)), backgroundColor: '#EF4444', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, ticks: { callback: v => v.toLocaleString() + '万円' } },
        },
      },
    });

    // 拠点別リベート
    const branchRebate = [...D.branchSummary].sort((a, b) => b.totalRebate - a.totalRebate).slice(0, 15);
    const ctx2 = document.getElementById('chartRebateBranch').getContext('2d');
    charts.rebateBranch = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: branchRebate.map(b => b.name),
        datasets: [{
          label: 'リベート額',
          data: branchRebate.map(b => Math.round(b.totalRebate / 10000)),
          backgroundColor: '#8B5CF6',
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => v.toLocaleString() + '万円' } },
        },
      },
    });

    // リベート分析テキスト
    document.getElementById('rebateAnalysis').innerHTML = `
      <div class="ai-card">
        <div class="ai-card-header"><span>🤖</span> AI分析：リベートと不動在庫の関係</div>
        <p>不動在庫に含まれるリベート対象商品は <strong>${fmt(deadStockRebate)}</strong> に達しています。
        これは総リベート額の <strong>${(deadStockRebate / D.kpi.totalRebate * 100).toFixed(1)}%</strong> を占めています。</p>
        <p style="margin-top:8px;">特に <strong>空調機器</strong> と <strong>住設機器</strong> カテゴリで不動在庫のリベート比率が高く、
        仕入先との返品交渉やリベート条件の見直しにより、<strong>${fmt(Math.round(deadStockRebate * 0.4))}</strong> の回収が見込まれます。</p>
      </div>
      <div class="ai-card">
        <div class="ai-card-header"><span>📊</span> 推奨アクション</div>
        <p>1. リベート率3%以上の不動在庫について、仕入先との返品交渉を優先実施<br>
        2. リベート条件の見直しにより、過剰仕入れの抑制を仕入先と協議<br>
        3. リベート対象外の不動在庫は、セット販売やECチャネルでの特価販売を検討</p>
      </div>
    `;
  }

  // ===================================================================
  // AI推奨アクション
  // ===================================================================
  function initAiPage() {
    // サマリー
    document.getElementById('aiSummaryText').innerHTML = `
      全40拠点の在庫データをAIが分析した結果、<strong>${fmtN(D.kpi.deadStockItems)}件</strong>（<strong>${fmt(D.kpi.totalDeadStockValue)}</strong>）の
      不動在庫が検出されました。不動在庫率は <strong>${D.kpi.deadStockRate}%</strong> です。<br><br>
      AIの最適化アルゴリズムにより、拠点間移管・値下げ販売・仕入先返品・発注最適化を組み合わせることで、
      <strong>${fmt(D.kpi.estimatedSavings)}</strong> の年間削減が可能と推定されます。
      以下に優先度順のアクションを提示します。
    `;

    // 優先度別アクション
    const priorities = [
      {
        level: '🔴 最優先',
        title: '1年以上滞留商品の即時対応',
        count: D.inventory.filter(inv => inv.riskLevel === 'high').length,
        value: D.inventory.filter(inv => inv.riskLevel === 'high').reduce((s, inv) => s + inv.totalValue, 0),
        actions: ['仕入先への返品交渉を即座に開始', '廃棄判定委員会の開催', '在庫評価損の計上検討'],
      },
      {
        level: '🟡 高優先',
        title: '半年〜1年滞留商品の対策',
        count: D.inventory.filter(inv => inv.riskLevel === 'medium').length,
        value: D.inventory.filter(inv => inv.riskLevel === 'medium').reduce((s, inv) => s + inv.totalValue, 0),
        actions: ['他拠点への移管検討', '値下げ販売の実施', 'セット販売プロモーション'],
      },
      {
        level: '🟢 予防',
        title: '新規不動在庫の発生抑制',
        count: D.inventory.filter(inv => inv.daysSinceLastShipment >= 120 && inv.daysSinceLastShipment < 180).length,
        value: D.inventory.filter(inv => inv.daysSinceLastShipment >= 120 && inv.daysSinceLastShipment < 180).reduce((s, inv) => s + inv.totalValue, 0),
        actions: ['4ヶ月以上未出荷のアラート監視', '発注量の自動調整', '需要予測モデルの適用'],
      },
    ];

    document.getElementById('aiPriorityActions').innerHTML = priorities.map(p => `
      <div class="ai-card">
        <div class="ai-card-header">${p.level} ${p.title}</div>
        <p><strong>${fmtN(p.count)}件</strong> / <strong>${fmt(p.value)}</strong></p>
        <ul style="margin-top:8px;padding-left:20px;font-size:13px;color:#475569;">
          ${p.actions.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    // 拠点間移管推奨
    const transfers = [];
    const deadStockItems = D.getDeadStock();
    for (let i = 0; i < Math.min(deadStockItems.length, 8); i++) {
      const item = deadStockItems[i];
      const otherBranches = D.branchSummary.filter(b => b.id !== item.branchId);
      const target = otherBranches[Math.floor(Math.random() * otherBranches.length)];
      transfers.push({
        from: item.branchName,
        to: target.name,
        product: item.productName,
        qty: Math.ceil(item.quantity * 0.5),
        value: Math.round(item.totalValue * 0.5),
      });
    }

    document.getElementById('aiTransferRecommendations').innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr><th>移管元</th><th>移管先</th><th>商品</th><th>数量</th><th>金額</th></tr></thead>
          <tbody>
            ${transfers.map(t => `
              <tr>
                <td>${t.from}</td>
                <td style="color:var(--success);font-weight:600">→ ${t.to}</td>
                <td>${t.product}</td>
                <td>${fmtN(t.qty)}</td>
                <td>${fmt(t.value)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // カテゴリ別AI分析
    document.getElementById('aiCategoryAnalysis').innerHTML = D.categorySummary.map(cat => {
      const deadRate = cat.totalValue > 0 ? (cat.deadStockValue / cat.totalValue * 100).toFixed(1) : 0;
      const status = deadRate > 35 ? '要改善' : deadRate > 25 ? '注意' : '良好';
      const statusColor = deadRate > 35 ? 'var(--danger)' : deadRate > 25 ? 'var(--warning)' : 'var(--success)';
      return `
        <div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid var(--border);">
          <div style="width:12px;height:12px;border-radius:3px;background:${cat.color};flex-shrink:0;"></div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:14px;">${cat.name}</div>
            <div style="font-size:12px;color:var(--text-secondary);">
              SKU: ${fmtN(cat.totalItems)} | 在庫: ${fmt(cat.totalValue)} | 不動: ${fmt(cat.deadStockValue)}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:${statusColor}">${deadRate}%</div>
            <div style="font-size:11px;color:${statusColor}">${status}</div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);width:120px;text-align:right;">
            回転率: ${cat.avgTurnoverRate}回
          </div>
        </div>
      `;
    }).join('');
  }

  // ===================================================================
  // 削減シミュレーション
  // ===================================================================
  function initSimulationPage() {
    updateSimulation();

    ['simTransfer', 'simDiscount', 'simReturn', 'simOptimize'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateSimulation);
    });
  }

  function updateSimulation() {
    const transfer = parseInt(document.getElementById('simTransfer').value);
    const discount = parseInt(document.getElementById('simDiscount').value);
    const returnRate = parseInt(document.getElementById('simReturn').value);
    const optimize = parseInt(document.getElementById('simOptimize').value);

    document.getElementById('simTransferVal').textContent = transfer + '%';
    document.getElementById('simDiscountVal').textContent = discount + '%';
    document.getElementById('simReturnVal').textContent = returnRate + '%';
    document.getElementById('simOptimizeVal').textContent = optimize + '%';

    const totalDeadStock = D.kpi.totalDeadStockValue;
    const transferSave = Math.round(totalDeadStock * transfer / 100);
    const discountSave = Math.round((totalDeadStock - transferSave) * discount / 100);
    const returnSave = Math.round((totalDeadStock - transferSave - discountSave) * returnRate / 100);
    const optimizeSave = Math.round(totalDeadStock * optimize / 100 * 0.5); // 将来分の抑制

    const totalSavings = transferSave + discountSave + returnSave + optimizeSave;
    const newDeadStockRate = Math.max(0, ((totalDeadStock - transferSave - discountSave - returnSave) / D.kpi.totalInventoryValue * 100)).toFixed(1);

    document.getElementById('simResultValue').textContent = fmt(totalSavings);
    document.getElementById('simResultRate').textContent = `${D.kpi.deadStockRate}% → ${newDeadStockRate}%`;

    // チャート更新
    if (charts.simulation) charts.simulation.destroy();
    const ctx = document.getElementById('chartSimulation').getContext('2d');
    charts.simulation = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['現在', '移管後', '値下げ後', '返品後', '最適化後'],
        datasets: [{
          label: '不動在庫金額',
          data: [
            Math.round(totalDeadStock / 10000),
            Math.round((totalDeadStock - transferSave) / 10000),
            Math.round((totalDeadStock - transferSave - discountSave) / 10000),
            Math.round((totalDeadStock - transferSave - discountSave - returnSave) / 10000),
            Math.round(Math.max(0, totalDeadStock - totalSavings) / 10000),
          ],
          backgroundColor: ['#EF4444', '#F59E0B', '#F59E0B', '#3B82F6', '#10B981'],
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ctx.parsed.y.toLocaleString() + '万円' } },
        },
        scales: {
          y: { ticks: { callback: v => v.toLocaleString() + '万円' } },
        },
      },
    });

    // 拠点別テーブル
    const tbody = document.getElementById('simBranchTable');
    tbody.innerHTML = D.branchSummary
      .sort((a, b) => b.deadStockValue - a.deadStockValue)
      .slice(0, 20)
      .map(b => {
        const t = Math.round(b.deadStockValue * transfer / 100);
        const d = Math.round((b.deadStockValue - t) * discount / 100);
        const r = Math.round((b.deadStockValue - t - d) * returnRate / 100);
        const o = Math.round(b.deadStockValue * optimize / 100 * 0.5);
        const after = Math.max(0, b.deadStockValue - t - d - r);
        const rate = b.deadStockValue > 0 ? ((b.deadStockValue - after) / b.deadStockValue * 100).toFixed(0) : 0;
        return `
          <tr>
            <td><strong>${b.name}</strong></td>
            <td style="color:var(--danger);font-weight:600">${fmt(b.deadStockValue)}</td>
            <td>-${fmt(t)}</td>
            <td>-${fmt(d)}</td>
            <td>-${fmt(r)}</td>
            <td>-${fmt(o)}</td>
            <td style="color:var(--success);font-weight:600">${fmt(after)}</td>
            <td><span class="badge badge-success">-${rate}%</span></td>
          </tr>
        `;
      }).join('');
  }

  // ===================================================================
  // 初期化
  // ===================================================================
  function init() {
    initDashboard();
    renderBranchTable();
    initDeadstockFilters();
    renderDeadstock();

    // ローディング解除
    setTimeout(() => {
      document.getElementById('loadingOverlay').classList.add('hidden');
    }, 800);
  }

  // DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
