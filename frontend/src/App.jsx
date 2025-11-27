import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = 'https://cs2-skin-dashboard.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('userApiKey') || '');
  const [showInput, setShowInput] = useState(false);

  // 关键：每次打开页面都主动请求后端检查登录状态
  useEffect(() => {
    axios.get(`${BACKEND}/api/me`, { withCredentials: true })
      .then(res => {
        setUser(res.data);
        if (!apiKey) setShowInput(true);
      })
      .catch(() => {
        // 没登录就不管
      });

    // 清理 URL 的 ?loggedIn=true
    if (window.location.search.includes('loggedIn=true')) {
      window.history.replaceState({}, '', '/');
    }
  }, [apiKey]);

  const saveKey = () => {
    if (!apiKey.trim()) return alert('请输入 API Key');
    localStorage.setItem('userApiKey', apiKey);
    setShowInput(false);
    alert('Key 保存成功！完整功能已就绪！');
  };

  const login = () => {
    window.location.href = `${BACKEND}/auth/steam`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#171a21', color: 'white', textAlign: 'center', paddingTop: '80px', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '48px', color: '#66c0f4' }}>CS2 皮肤仪表盘（全国可用）</h1>

      {!user ? (
        <div style={{ marginTop: '200px' }}>
          <button onClick={login} style={{
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
        <div style={{ marginTop: '100px' }}>
          <h2 style={{ color: '#66c0f4', fontSize: '36px' }}>登录成功！</h2>
          <p style={{ fontSize: '24px' }}>SteamID: {user.steamid}</p>

          {showInput && (
            <div style={{ margin: '60px auto', padding: '40px', background: '#2a475e', borderRadius: '16px', maxWidth: '600px', display: 'inline-block' }}>
              <p style={{ fontSize: '20px' }}>请输入你的 Steam Web API Key（<a href="https://steamcommunity.com/dev/apikey" target="_blank" style={{ color: '#66c0f4' }}>点此申请</a>）</p>
              <input
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="例：A1B2C3D4E5F6..."
                style={{ width: '100%', padding: '16px', fontSize: '18px', margin: '10px 0' }}
              />
              <br />
              <button onClick={saveKey} style={{
                marginTop: '20px',
                padding: '16px 40px',
                fontSize: '20px',
                background: '#66c0f4',
                border: 'none',
                borderRadius: '8px'
              }}>
                保存并加载完整库存
              </button>
            </div>
          )}

          {!showInput && (
            <div style={{ marginTop: '100px', fontSize: '36px', color: '#66c0f4' }}>
              API Key 已保存！终极完整版已就绪！
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
