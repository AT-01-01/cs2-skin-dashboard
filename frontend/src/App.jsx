import { useEffect, useState } from 'react';
import axios from 'axios';

// ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
// 重要：这里全部改成你的 Render 后端真实地址！
const BACKEND_URL = 'https://cs2-skin-dashboard.onrender.com';
// ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←

function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [prices] = useState({});
  const [total] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('loggedIn')) {
      fetchInventory();
    }
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/inventory`, { withCredentials: true });
      // 这里省略部分逻辑，保持原样
      setUser({ steamid: 'logged' });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const login = () => {
    window.location.href = `${BACKEND_URL}/auth/steam`;
  };

  const logout = () => {
    window.location.href = `${BACKEND_URL}/api/logout`;
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial', background: '#171a21', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#66c0f4' }}>CS2 皮肤仪表盘</h1>
      {!user ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <button 
            onClick={login} 
            style={{ 
              padding: '15px 40px', 
              fontSize: '18px', 
              background: '#1b2838', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}>
            Steam 登录
          </button>
        </div>
      ) : (
        <div>
          <div style={{ textAlign: 'center', margin: '20px' }}>
            <button onClick={logout}>登出</button>
            <h2>登录成功！正在加载你的库存...</h2>
            <p>总价值：¥{total.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
