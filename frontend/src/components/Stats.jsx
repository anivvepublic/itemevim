import { useEffect, useState } from 'react';

export default function Stats() {
  const [stats, setStats] = useState({
    totalListings: 150000,
    totalUsers: 75000,
    totalOrders: 300000,
    trustRate: 100
  });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data && data.totalListings) {
          setStats({
            totalListings: data.totalListings || 150000,
            totalUsers: data.totalUsers || 75000,
            totalOrders: 300000,
            trustRate: 100
          });
        }
      })
      .catch(() => {});
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + '.000+';
    }
    return num.toString();
  };

  const statItems = [
    {
      value: formatNumber(stats.totalListings),
      label: 'Aktif İlan',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    {
      value: formatNumber(stats.totalUsers),
      label: 'Memnun Kullanıcı',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      value: formatNumber(stats.totalOrders),
      label: 'Tamamlanan Sipariş',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      value: '%' + stats.trustRate,
      label: 'Güvenli Alışveriş',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return (
    <section className="bg-dark-800 rounded-2xl p-6 md:p-8 mb-6 border border-dark-700">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {statItems.map((stat, index) => (
          <div 
            key={index} 
            className={`text-center ${index < 3 ? 'md:border-r md:border-dark-700 md:last:border-r-0' : ''}`}
          >
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {stat.icon}
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-text-muted text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}