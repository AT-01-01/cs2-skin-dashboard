// frontend/src/App.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:8080';

function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [apiKey, setApiKey] = useState(''); // do not auto-load from localStorage by default
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // 请求本地后端的 /api/me 如果你后端实现了 steam oauth，会返回登录用户
    axios.get(`${BACKEND}/api/me`, { withCredentials: true })
      .then(res => {
        setUser(res.data);
        if (!apiKey && res.data?.steamid) {
          setShowKeyInput(true);
        }
      })
      .catch(() => setUser(null));

    // 清理 URL 上的参数
    if (window.location.search.includes('loggedIn=true')) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const loadInventory = async (useStored = false) => {
    setErrorMsg('');
    if (!user?.steamid) {
      setErrorMsg('请先登录 Steam（或手动输入 steamid）');
      return;
    }
    // if you intentionally want to use a stored key in localStorage:
    const keyToUse = useStored ? localStorage.getItem('steamApiKey') : apiKey;

    setLoading(true);
    setInventory([]);
    try {
      const res = await axios.post(`${BACKEND}/api/inventory`, {
        steamid: user.steamid,
        key: keyToUse
      }, { withCredentials: true });

      const items = res.data.items || [];
      const processed = items
        .filter(i => !!i.name)
        .slice(0, 50)
        .map(item => {
          // paintwear: keep industry-friendly formatting
          let wear = '未知';
          if (item.paintwear !== null && item.paintwear !== undefined && !Number.isNaN(item.paintwear)) {
            // keep as decimal (0.xxxx) with up to 6 decimals
            wear = Number(item.paintwear).toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
          } else if (item.floatvalue) {
            wear = String(item.floatvalue);
          }

          const icon = item.icon_url || '/placeholder-360.png'; // ensure you have a placeholder in public/

          return {
            id: item.id,
            name: item.name,
            icon,
            wear,
            buffPrice: '加载中...'
          };
        });

      setInventory(processed);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || err.message || '请求失败';
      setErrorMsg(String(message));
    } finally {
      setLoading(false);
    }
  };

  const saveKeyAndLoad = () => {
    if (!apiKey.trim()) return alert('请输入 Key');
    // 用户主动选择保存才写 localStorage
    localStorage.setItem('steamApiKey', apiKey.trim());
    setShowKeyInput(false);
    loadInventory(true);
  };

  const login = () => {
    window.location.href = `${BACKEND}/auth/steam`;
  };
  const logout = () => {
    window.location.href = `${BACKEND}/api/logout`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0e141b', color: 'white', fontFamily: 'Arial, sans-serif' }}>
      {user && (
        <div style={{ padding: '30px', textAlign: 'center', background: 'linear-gradient(90deg, #1a2a3a, #16232f)' }}>
          <h1 style={{ fontSize: '44px', color: '#66c0f4', margin: 0 }}>{user.steamid}</h1>
          <p style={{ color: '#8be9fd' }}>CS2 专属皮肤仪表盘</p>
        </div>
      )}

      {!user ? (
        <div style={{ textAlign: 'center', paddingTop: '150px' }}>
          <h1 style={{ fontSize: '48px', color: '#66c0f4' }}>CS2 皮肤仪表盘</h1>
          <button onClick={login} style={{
            marginTop: '50px',
            padding: '20px 80px',
            fontSize: '28px',
            background: '#1b2838',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer'
          }}>
            Steam 登录
          </button>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          {showKeyInput && inventory.length === 0 && (
            <div style={{ textAlign: 'center', margin: '50px auto', maxWidth: '600px', padding: '40px', background: '#16232f', borderRadius: '16px' }}>
              <p style={{ fontSize: '20px' }}>首次使用需要你的 Steam Web API Key（可选：你也可以把 key 填到后端环境变量中）</p>
              <input
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="粘贴 32 位 Key（可选）"
                style={{ width: '100%', padding: '14px', fontSize: '18px', borderRadius: '8px', margin: '15px 0' }}
              />
              <br />
              <button onClick={saveKeyAndLoad} style={{
                padding: '14px 40px',
                background: '#66c0f4',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px'
              }}>
                加载我的库存并保存 Key
              </button>
              <button onClick={() => loadInventory(false)} style={{
                padding: '12px 28px',
                marginLeft: '12px',
                background: '#1b2838',
                border: '1px solid #66c0f4',
                color: '#66c0f4',
                borderRadius: '8px',
                fontSize: '16px'
              }}>
                临时加载（不保存 Key）
              </button>
              <p style={{ marginTop: '15px', fontSize: '14px' }}>
                <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer" style={{ color: '#66c0f4' }}>
                  点此免费申请 Key
                </a>
              </p>
            </div>
          )}

          {errorMsg && <div style={{ color: '#ffcccb', textAlign: 'center', margin: '12px' }}>{errorMsg}</div>}

          {loading && <div style={{ textAlign: 'center', padding: '60px', fontSize: '24px' }}>正在拉取你的库存...</div>}

          {inventory.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '24px',
              padding: '20px 20px',
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              {inventory.map((item) => (
                <div key={item.id} className="card" style={{
                  background: '#1a2332',
                  borderRadius: '16px',
                  padding: '16px',
                  textAlign: 'center',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                  transition: 'transform 0.25s ease',
                }}>
                  <img src={item.icon} alt="" style={{ width: '100%', borderRadius: '12px' }} />
                  <h4 style={{ margin: '12px 0 8px', fontSize: '15px', height: '50px', overflow: 'hidden' }}>
                    {item.name}
                  </h4>
                  <p style={{ color: '#8be9fd', margin: '8px 0' }}>磨损: {item.wear}</p>
                  <p style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '18px' }}>
                    {item.buffPrice}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', margin: '40px 0 80px' }}>
            <button onClick={logout} style={{ padding: '12px 32px', background: '#e74c3c', border: 'none', borderRadius: '8px' }}>
              退出登录
            </button>
          </div>
        </div>
      )}
      <style>{`
        .card:hover { transform: translateY(-10px); }
      `}</style>
    </div>
  );
}

export default App;
