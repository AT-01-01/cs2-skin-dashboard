import { useEffect, useState } from 'react';
import axios from 'axios';

const BACKEND = 'https://cs2-skin-dashboard.onrender.com';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get(`${BACKEND}/api/me`, { withCredentials: true })
      .then(res => {
        setUser(res.data);
      })
      .catch(() => {});

    // 清理 ?loggedIn=true
    if (window.location.search.includes('loggedIn=true')) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const login = () => {
    window.location.href = `${BACKEND}/auth/steam`;
  };

  const logout = () => {
    window.location.href = `${BACKEND}/api/logout`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#171a21', color: 'white', textAlign: 'center', paddingTop: '100px', fontFamily: 'Arial' }}>
      <h1 style={{ fontSize: '50px', color: '#66c0f4', marginBottom: '30px' }}>
        CS2 皮肤仪表盘
      </h1>

      {!user ? (
        <div style={{ marginTop: '200px' }}>
          <button onClick={login} style={{
            padding: '22px 90px',
            fontSize: '30px',
            background: '#1b2838',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            Steam 登录
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '120px' }}>
          <h2 style={{ fontSize: '42px', color: '#66c0f4' }}>登录成功！</h2>
          <p style={{ fontSize: '28px', margin: '30px 0' }}>
            欢迎回来，<span style={{ color: '#ff6b6b' }}>{user.steamid}</span>
          </p>
          <div style={{ fontSize: '36px', color: '#4ecdc4', margin: '60px 0' }}>
            你的专属 CS2 皮肤仪表盘已就绪！
          </div>
          <button onClick={logout} style={{
            padding: '14px 40px',
            background: '#c0392b',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer'
          }}>
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
