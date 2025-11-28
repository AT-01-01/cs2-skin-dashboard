// src/App.jsx   ← 完整可直接替换
import { useEffect, useState } from 'react';
import axios from 'axios';

// 支持环境变量，Vite使用VITE_前缀
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'https://cs2-skin-dashboard.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [apiKey, setApiKey] = useState(''); // 改为空字符串，在 useEffect 中初始化
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 在客户端环境中初始化 apiKey
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('steamApiKey') || '';
      setApiKey(savedKey);
    }

    axios
      .get(`${BACKEND}/api/me`, { withCredentials: true })
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {});

    if (typeof window !== 'undefined' && window.location.search.includes('loggedIn=true')) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const loadInventory = async () => {
  if (!user?.steamid) return;
  setLoading(true);
  try {
    const res = await fetch(
      `https://steamcommunity.com/inventory/${user.steamid}/730/2?l=english&count=5000`
    );
    const data = await res.json();

    if (!data?.success || !data?.assets || data.assets.length === 0) {
      throw new Error('库存为空或未公开');
    }

    // 构建描述映射
    const descriptions = {};
    data.descriptions.forEach(d => {
      const key = `${d.classid}_${d.instanceid || '0'}`;
      descriptions[key] = d;
    });

    const items = data.assets
      .map(asset => {
        const desc = descriptions[`${asset.classid}_${asset.instanceid || '0'}`];
        if (!desc || !desc.market_hash_name || !desc.marketable) return null;
        return { ...asset, ...desc };
      })
      .filter(Boolean)
      .slice(0, 50);

    // 加 Buff 价格
    const itemsWithPrice = await Promise.all(
      items.map(async (item) => {
        let buffPrice = '加载中...';
        try {
          const r = await fetch(
            `https://buff.163.com/api/market/goods/sell_order?game=csgo&page_num=1&search=${encodeURIComponent(item.market_hash_name)}`
          );
          const d = await r.json();
          buffPrice = d.data?.items?.[0]?.price ? `¥${d.data.items[0].price}` : '暂无挂单';
        } catch (e) {
          buffPrice = '网络错误';
        }

        return {
          name: item.market_hash_name,
          icon: `https://community.akamai.steamstatic.com/economy/image/${item.icon_url}/360fx360f`,
          // 公共接口没有精确磨损，留空或写“未知”
          wear: '未知',
          buffPrice,
        };
      })
    );

    setInventory(itemsWithPrice); // ← 这一步必须执行！
  } catch (err) {
    console.error(err);
    alert('无法加载库存，请确认 Steam 库存已设为“公开”');
  } finally {
    setLoading(false);
  }
};


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
          <h1 style={{ fontSize: '42px', color: '#66c0f4', margin: 0 }}>{user.steamid}</h1>
          <p style={{ color: '#8be9fd', margin: '10px 0 0' }}>CS2 专属皮肤仪表盘</p>
        </div>
      )}

      {/* 未登录 */}
      {!user ? (
        <div style={{ textAlign: 'center', paddingTop: '200px' }}>
          <h1 style={{ fontSize: '48px', color: '#66c0f4' }}>CS2 皮肤仪表盘</h1>
          <button
            onClick={login}
            style={{
              marginTop: '50px',
              padding: '20px 80px',
              fontSize: '28px',
              background: '#1b2838',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            Steam 登录
          </button>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          {/* API Key 输入框 */}
          {(showKeyInput || (inventory.length === 0 && !loading && !apiKey)) && (
            <div style={{ textAlign: 'center', margin: '40px auto', maxWidth: '600px', padding: '30px', background: '#16232f', borderRadius: '16px' }}>
              <p style={{ fontSize: '20px' }}>首次使用需绑定你的 Steam Web API Key（免费申请）</p>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="粘贴你的 32 位 API Key"
                style={{ width: '100%', padding: '14px', fontSize: '18px', margin: '15px 0', borderRadius: '8px', border: 'none' }}
              />
              <br />
              <button
                onClick={saveKeyAndLoad}
                style={{
                  padding: '14px 40px',
                  background: '#66c0f4',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  margin: '10px',
                }}
              >
                加载我的库存
              </button>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#888' }}>
                <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer" style={{ color: '#66c0f4' }}>
                  点此免费申请 Key（30秒）
                </a>
              </p>
            </div>
          )}

          {/* 加载中 */}
          {loading && <div style={{ textAlign: 'center', padding: '100px', fontSize: '24px' }}>正在加载你的库存，请稍等...</div>}

          {/* 库存网格 */}
          {inventory.length > 0 && (
            <div>
              <h2 style={{ textAlign: 'center', color: '#ff79c6', margin: '40px 0' }}>你的 CS2 库存（实时 Buff 参考价）</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '20px',
                  padding: '0 20px',
                  maxWidth: '1400px',
                  margin: '0 auto',
                }}
              >
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
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-8px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <img src={item.icon} alt={item.name} style={{ width: '100%', borderRadius: '12px', marginBottom: '12px' }} />
                    <h4
                      style={{
                        margin: '8px 0',
                        fontSize: '15px',
                        color: '#fff',
                        height: '48px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.name}
                    </h4>
                    <p style={{ color: '#8be9fd', fontSize: '14px' }}>磨损: {item.wear}</p>
                    <p style={{ color: '#ff6b6b', fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>{item.buffPrice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 空库存提示 */}
          {inventory.length === 0 && !loading && !showKeyInput && (
            <div style={{ textAlign: 'center', padding: '100px', color: '#888' }}>
              暂无 CS2 物品或库存设为私密，请在 Steam 设置中公开库存
            </div>
          )}

          {/* 底部按钮 */}
          <div style={{ textAlign: 'center', marginTop: '80px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowKeyInput(true)}
              style={{ padding: '12px 30px', background: '#66c0f4', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              重新输入 API Key
            </button>
            <button
              onClick={logout}
              style={{ padding: '12px 30px', background: '#e74c3c', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
