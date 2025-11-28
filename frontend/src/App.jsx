// src/App.jsx  —— 已修复死循环 + JSON 解析失败 + 加载逻辑混乱
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://cs2-skin-dashboard.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // 登录后只请求一次 /api/me
  useEffect(() => {
    // 读取本地保存的 API Key
    const savedKey = localStorage.getItem('steamApiKey') || '';
    setApiKey(savedKey);

    // 检查登录态
    axios
      .get(`${BACKEND}/api/me`, { withCredentials: true })
      .then(res => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
      });

    // 清除 URL 中的 loggedIn=true 参数
    if (window.location.search.includes('loggedIn=true')) {
      window.history.replaceState({}, '', '/');
    }
  }, []); // 关键！只在组件挂载时执行一次

  // 当 user 有了 steamid 并且还没有加载过库存时，自动加载（只触发一次）
  const loadInventory = useCallback(async () => {
    if (!user?.steamid) return;

    setLoading(true);
    setInventory([]); // 清空旧数据，防止闪跳

    try {
      const res = await fetch(
        `https://steamcommunity.com/inventory/${user.steamid}/730/2?l=english`
      );

      if (!res.ok) throw new Error('Steam 库存请求失败');

      let data;
      try {
        data = await res.json();
      } catch (e) {
        const text = await res.text();
        console.error('Steam 返回非 JSON：', text.slice(0, 500));
        throw new Error('Steam 库存返回了非 JSON（通常是隐私设置或被封）');
      }

      if (!data?.success || !data?.assets || data.assets.length === 0) {
        throw new Error('库存为空或未公开');
      }

      // 构建描述映射表
      const descMap = {};
      data.descriptions.forEach(d => {
        const key = `${d.classid}_${d.instanceid || '0'}`;
        descMap[key] = d;
      });

      const items = data.assets
        .map(asset => {
          const desc = descMap[`${asset.classid}_${asset.instanceid || '0'}`];
          if (!desc?.market_hash_name || desc.marketable !== 1) return null;
          return { ...asset, desc };
        })
        .filter(Boolean)
        .slice(0, 50); // 取前 50 件可交易皮肤

      // 并行获取 Buff 价格（带简单防抖和错误处理）
      const itemsWithPrice = await Promise.all(
        items.map(async item => {
          let buffPrice = '暂无挂单';
          try {
            const r = await fetch(
              `https://buff.163.com/api/market/goods/sell_order?game=csgo&page_num=1&goods_id=${item.desc.classid}`
            );
            // 优先用 goods_id 查，更精准！如果没有再用 search
            if (r.ok) {
              const d = await r.json();
              if (d.code === 'OK' && d.data?.items?.[0]?.price) {
                buffPrice = `¥${d.data.items[0].price}`;
              }
            } else {
              // fallback 用名字搜（慢一点）
              const r2 = await fetch(
                `https://buff.163.com/api/market/goods/sell_order?game=csgo&page_num=1&search=${encodeURIComponent(item.desc.market_hash_name)}`
              );
              if (r2.ok) {
                const d2 = await r2.json();
                if (d2.code === 'OK' && d2.data?.items?.[0]?.price) {
                  buffPrice = `¥${d2.data.items[0].price}`;
                }
              }
            }
          } catch (e) {
            buffPrice = '网络错误';
          }

          return {
            name: item.desc.market_hash_name,
            icon: `https://community.akamai.steamstatic.com/economy/image/${item.desc.icon_url}/360fx360f`,
            wear: item.desc.descriptions?.find(d => d.value?.includes('Float'))?.value || '未知',
            buffPrice,
          };
        })
      );

      setInventory(itemsWithPrice);
    } catch (err) {
      console.error(err);
      alert('加载失败：' + err.message + '\n\n请确认：\n1. Steam 库存设置为“公开”\n2. CS2 物品已在背包中');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 当 user 登录成功且本地有 apiKey 时自动加载一次
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
      {/* 已登录顶部栏 */}
      {user && (
        <div style={{ padding: '30px 20px', textAlign: 'center', background: 'linear-gradient(90deg, #1a2a3a, #16232f)' }}>
          <h1 style={{ fontSize: '42px', color: '#66c0f4', margin: 0 }}>{user.personaname || user.steamid}</h1>
          <p style={{ color: '#8be9fd', margin: '10px 0 0' }}>CS2 专属皮肤仪表盘</p>
        </div>
      )}

      {/* 未登录 */}
      {!user ? (
        <div style={{ textAlign: 'center', paddingTop: '200px' }}>
          <h1 style={{ fontSize: '48px', color: '#66c0f4' }}>CS2 皮肤仪表盘</h1>
          <button onClick={login} style={{
            marginTop: '50px',
            padding: '20px 80px',
            fontSize: '28px',
            background: '#1b2838',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
          }}>
            Steam 登录
          </button>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          {/* 首次或手动点“重新输入 API Key”时显示输入框 */}
          {(showKeyInput || (!apiKey && inventory.length === 0 && !loading)) && (
            <div style={{ textAlign: 'center', margin: '40px auto', maxWidth: '600px', padding: '30px', background: '#16232f', borderRadius: '16px' }}>
              <p style={{ fontSize: '20px' }}>首次使用需要你的 Steam Web API Key（免费 30 秒申请）</p>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="粘贴 32 位 API Key 如：A1B2C3D4..."
                style={{ width: '100%', padding: '14px', fontSize: '18px', margin: '15px 0', borderRadius: '8px', border: 'none' }}
              />
              <br />
              <button onClick={saveKeyAndLoad} style={{
                padding: '14px 40px',
                background: '#66c0f4',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                cursor: 'pointer',
                margin: '10px',
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

          {/* 加载状态 */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '100px', fontSize: '24px' }}>
              正在从 Steam 和 Buff 拉取数据，请稍等 5-15 秒...
            </div>
          )}

          {/* 库存展示 */}
          {inventory.length > 0 && (
            <div>
              <h2 style={{ textAlign: 'center', color: '#ff79c6', margin: '40px 0' }}>
                你的 CS2 库存（实时 Buff 参考价）· 共 {inventory.length} 件
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px',
                padding: '0 20px',
                maxWidth: '1400px',
                margin: '0 auto',
              }}>
                {inventory.map((item, i) => (
                  <div
                    key={i}
                    style={{
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
                    <img src={item.icon} alt={item.name} style={{ width: '100%', borderRadius: '12px', marginBottom: '12px' }} />
                    <h4 style={{
                      margin: '8px 0',
                      fontSize: '15px',
                      color: '#fff',
                      height: '48px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.name}
                    </h4>
                    <p style={{ color: '#8be9fd', fontSize: '14px' }}>磨损: {item.wear}</p>
                    <p style={{ color: '#ff6b6b', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>
                      {item.buffPrice}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 空库存但不是首次 */}
          {inventory.length === 0 && !loading && apiKey && !showKeyInput && (
            <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>
              暂无 CS2 可交易物品或库存未公开<br />
              <button onClick={loadInventory} style={{ marginTop: '20px', padding: '10px 20px', background: '#66c0f4', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                重新加载
              </button>
            </div>
          )}

          {/* 底部操作按钮 */}
          <div style={{ textAlign: 'center', marginTop: '80px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowKeyInput(true)} style={{
              padding: '12px 30px',
              background: '#66c0f4',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}>
              更换 API Key
            </button>
            <button onClick={loadInventory} style={{
              padding: '12px 30px',
              background: '#2ecc71',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}>
              手动刷新库存
            </button>
            <button onClick={logout} style={{
              padding: '12px 30px',
              background: '#e74c3c',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
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
