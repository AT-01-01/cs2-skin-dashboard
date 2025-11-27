import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [prices, setPrices] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(5); // 价差阈值 %

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('loggedIn')) {
      fetchInventory();
    }
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3001/api/inventory', { withCredentials: true });
      setInventory(res.data.inventory);
      setPrices(res.data.prices);
      setTotal(res.data.totalValue);
      setUser({ steamid: res.data.steamid || 'logged' }); // 简化
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const login = () => {
    window.location.href = 'http://localhost:3001/auth/steam';
  };

  const logout = () => {
    window.location.href = 'http://localhost:3001/api/logout';
  };

  const copyPrice = async (price) => {
    await navigator.clipboard.writeText(price);
    alert('价格已复制！');
  };

  const jumpBuy = (hash) => {
    window.open(`https://steamcommunity.com/market/listings/730/${encodeURIComponent(hash)}`);
  };

  const checkAlert = async (hash, currentPrice) => {
    const res = await axios.get(`http://localhost:3001/api/market/${encodeURIComponent(hash)}`);
    const { spread, buyMax, sellMin } = res.data;
    if (spread / buyMax * 100 > alertThreshold) {
      // 模拟警报（实际连 Telegram）
      axios.post('http://localhost:3001/api/alert', {
        message: `${hash} 低价警报！买 ${buyMax}¥ / 卖 ${sellMin}¥ (差 ${spread.toFixed(2)}¥)`,
        chatId: '你的chatId' // 用户需填
      });
      alert(`警报: ${hash} 价差 ${spread.toFixed(2)}¥！`);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>CS2 Skin Dashboard</h1>
      {!user ? (
        <button onClick={login} style={{ padding: '10px', background: '#1b2838', color: 'white' }}>
          Steam 登录
        </button>
      ) : (
        <div>
          <button onClick={logout}>登出</button>
          <h2>库存总值: ¥{total.toFixed(2)}</h2>
          <input 
            type="number" 
            value={alertThreshold} 
            onChange={e => setAlertThreshold(e.target.value)} 
            placeholder="警报阈值 %" 
          />
          <button onClick={() => inventory.forEach(item => checkAlert(item.market_hash_name, prices[item.market_hash_name]))}>
            检查所有警报
          </button>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th>皮肤</th><th>价格</th><th>操作</th></tr>
            </thead>
            <tbody>
              {inventory.map((item, i) => (
                <tr key={i} style={{ border: '1px solid #ccc' }}>
                  <td>{item.market_hash_name}</td>
                  <td>¥{prices[item.market_hash_name] || 'N/A'}</td>
                  <td>
                    <button onClick={() => copyPrice(prices[item.market_hash_name])}>复制售价</button>
                    {' '}
                    <button onClick={() => jumpBuy(item.market_hash_name)}>跳转买入</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={fetchInventory}>刷新库存</button>
        </div>
      )}
    </div>
  );
}

export default App;
