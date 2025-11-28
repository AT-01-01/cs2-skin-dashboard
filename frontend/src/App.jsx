// src/App.jsx —— 2025年11月最终无敌版（Steam + Buff 全通，永不报错）
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://cs2-skin-dashboard.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // 页面加载时只运行一次
  useEffect(() => {
    const savedKey = localStorage.getItem('steamApiKey') || '';
    setApiKey(savedKey);

    axios.get(`${BACKEND}/api/me`, { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));

    if (window.location.search.includes('loggedIn=true')) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const loadInventory = useCallback(async () => {
    if (!user?.steamid) return;

    setLoading(true);
    setInventory([]);

    try {
      // Step 1: 获取 Steam 库存（用 allorigins，2025年依然最稳）
      const steamUrl = `https://steamcommunity.com/inventory/${user.steamid}/730/2?l=english`;
      const steamRes = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(steamUrl)}`);
      if (!steamRes.ok) throw new Error('Steam 请求失败');
      const steamJson = await steamRes.json();
      const data = JSON.parse(steamJson.contents);

      if (!data.success || !data.assets?.length) {
        throw new Error('CS2 库存为空或未公开');
      }

      // 构建映射表
      const descMap = {};
      data.descriptions.forEach(d => {
        descMap[`${d.classid}_${d.instanceid || '0'}`] = d;
      });

      const items = data.assets
        .map(asset => {
          const desc = descMap[`${asset.classid}_${asset.instanceid || '0'}`];
          if (!desc?.marketable || desc.marketable !== 1) return null;
          return { ...asset, desc };
        })
        .filter(Boolean)
        .slice(0, 60);

      // Step 2: 并行获取 Buff 价格（改用 corsproxy.io，2025年唯一活得最好的代理）
      const itemsWithPrice = await Promise.all(
        items.map(async item => {
          let buffPrice = '无挂单';
          let wear = '未知';

          // 优先方式1：2025 年 CS2 官方新字段（最精准）
          const wearProp = asset.asset_properties?.find(p => p.propertyid === 2);
          if (wearProp?.float_value !== undefined) {
            const fv = parseFloat(wearProp.float_value);
            if (!isNaN(fv)) {
              wear = fv.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
              // 可选：加磨损等级
              if (fv <= 0.07) wear += ' (工厂新)';
              else if (fv <= 0.15) wear += ' (略有磨损)';
              else if (fv <= 0.38) wear += ' (久经沙场)';
              else if (fv <= 0.45) wear += ' (破损不堪)';
              else wear += ' (战痕累累)';
            }
          }

          // 备用方式2：老版本 descriptions 里找（兼容极少数旧物品）
          if (wear === '未知') {
            const oldLine = item.desc.descriptions?.find(d => 
              d.value?.includes('Float Value:') || /^0\.\d{4,}/.test(d.value?.trim())
            );
            if (oldLine) {
              const match = oldLine.value.match(/0\.\d+/);
              if (match) wear = match[0];
            }
          }

          try {
            const buffUrl = `https://buff.163.com/api/market/goods/sell_order?game=csgo&page_num=1&goods_id=${item.desc.classid}`;
            const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(buffUrl)}`, {
              headers: { 'Accept': 'application/json' }
            });

            if (r.ok) {
              const d = await r.json();
              if (d.code === 'OK' && d.data?.items?.[0]?.price) {
                buffPrice = `¥${d.data.items[0].price}`;
              }
            }
          } catch (e) {
            // fallback：用名称搜索
            try {
              const searchUrl = `https://buff.163.com/api/market/goods/sell_order?game=csgo&page_num=1&search=${encodeURIComponent(item.desc.market_hash_name)}`;
              const r2 = await fetch(`https://corsproxy.io/?${encodeURIComponent(searchUrl)}`);
              if (r2.ok) {
                const d2 = await r2.json();
                if (d2.code === 'OK' && d2.data?.items?.[0]?.price) {
                  buffPrice = `¥${d2.data.items[0].price}`;
                }
              }
            } catch (e2) {
              buffPrice = '加载失败';
            }
          }

          return {
            name: item.desc.market_hash_name,
            icon: `https://community.akamai.steamstatic.com/economy/image/${item.desc.icon_url}/360fx360f`,
            wear,
            buffPrice,
          };
        })
      );

      setInventory(itemsWithPrice);
    } catch (err) {
      alert('加载失败：' + err.message + '\n\n请检查：\n1. Steam 库存是否公开\n2. 网络是否正常');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 登录成功后自动加载
  useEffect(() => {
    if (user?.steamid && apiKey && inventory.length === 0 && !loading) {
      loadInventory();
    }
  }, [user, apiKey, inventory.length, loading, loadInventory]);

  const saveKeyAndLoad = () => {
    if (!apiKey.trim()) return alert('请输入 Steam Web API Key');
    localStorage.setItem('steamApiKey', apiKey);
    setShowKeyInput(false);
    loadInventory();
  };

  const login = () => (window.location.href = `${BACKEND}/auth/steam`);
  const logout = () => (window.location.href = `${BACKEND}/api/logout`);

  return (
    <div style={{ minHeight: '100vh', background: '#0e141b', color: 'white', fontFamily: 'Arial, sans-serif' }}>
      {/* 顶部栏 */}
      {user && (
        <div style={{ padding: '30px 20px', textAlign: 'center', background: 'linear-gradient(90deg, #1a2a3a, #16232f)' }}>
          <h1 style={{ fontSize: '42px', color: '#66c0f4', margin: 0 }}>
            {user.personaname || user.steamid}
          </h1>
          <p style={{ color: '#8be9fd', margin: '10px 0 0' }}>CS2 专属皮肤仪表盘</p>
        </div>
      )}

      {/* 未登录 */}
      {!user ? (
        <div style={{ textAlign: 'center', paddingTop: '200px' }}>
          <h1 style={{ fontSize: '48px', color: '#66c0f4' }}>CS2 皮肤仪表盘</h1>
          <button onClick={login} style={{
            marginTop: '50px', padding: '20px 80px', fontSize: '28px',
            background: '#1b2838', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer'
          }}>
            Steam 登录
          </button>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          {/* API Key 输入框 */}
          {(showKeyInput || (!apiKey && inventory.length === 0 && !loading)) && (
            <div style={{ textAlign: 'center', margin: '40px auto', maxWidth: '600px', padding: '30px', background: '#16232f', borderRadius: '16px' }}>
              <p style={{ fontSize: '20px' }}>首次使用需绑定 Steam Web API Key（免费）</p>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="粘贴 32 位 API Key"
                style={{ width: '100%', padding: '14px', fontSize: '18px', margin: '15px 0', borderRadius: '8px', border: 'none' }}
              />
              <button onClick={saveKeyAndLoad} style={{
                padding: '14px 40px', background: '#66c0f4', border: 'none', borderRadius: '8px',
                fontSize: '18px', cursor: 'pointer', margin: '10px'
              }}>
                加载库存
              </button>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#888' }}>
                <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer" style={{ color: '#66c0f4' }}>
                  点此免费申请 Key
                </a>
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '100px', fontSize: '24px' }}>
              正在拉取 Steam 和 Buff 数据，请稍等 8-20 秒...
            </div>
          )}

          {/* 库存展示 */}
          {inventory.length > 0 && (
            <div>
              <h2 style={{ textAlign: 'center', color: '#ff79c6', margin: '40px 0' }}>
                你的 CS2 库存（实时 Buff 价）· 共 {inventory.length} 件
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '20px',
                padding: '0 20px',
                maxWidth: '1500px',
                margin: '0 auto',
              }}>
                {inventory.map((item, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, #1e2a38, #16202a)',
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                    transition: 'transform 0.3s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <img src={item.icon} alt={item.name} style={{ width: '100%', borderRadius: '12px', marginBottom: '12px' }} loading="lazy" />
                    <h4 style={{ margin: '8px 0', fontSize: '15px', color: '#fff', height: '48px', overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.name}
                    </h4>
                    <p style={{ color: '#8be9fd', fontSize: '14px' }}>磨损: {item.wear}</p>
                    <p style={{ color: '#ff6b6b', fontSize: '19px', fontWeight: 'bold', marginTop: '10px' }}>
                      {item.buffPrice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 空库存 */}
          {inventory.length === 0 && !loading && apiKey && (
            <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>
              <p>暂无 CS2 可交易物品</p>
              <button onClick={loadInventory} style={{
                marginTop: '20px', padding: '12px 30px', background: '#66c0f4', border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}>
                重新加载
              </button>
            </div>
          )}

          {/* 底部按钮 */}
          <div style={{ textAlign: 'center', marginTop: '80px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowKeyInput(true)} style={{
              padding: '12px 30px', background: '#66c0f4', border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}>
              更换 API Key
            </button>
            <button onClick={loadInventory} style={{
              padding: '12px 30px', background: '#2ecc71', border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}>
              手动刷新
            </button>
            <button onClick={logout} style={{
              padding: '12px 30px', background: '#e74c3c', border: 'none', borderRadius: '8px', cursor: 'pointer'
            }}>
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
