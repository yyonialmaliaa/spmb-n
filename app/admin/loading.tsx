// Skeleton, bukan halaman putih kosong — admin selalu melihat bentuk halaman
// yang sedang dimuat.
export default function AdminLoading() {
  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="adm-skeleton" style={{ height: 26, width: 240, borderRadius: 6 }} />
      <div style={{ height: 8 }} />
      <div className="adm-skeleton" style={{ height: 13, width: 340, borderRadius: 6 }} />

      <div className="adm-grid-stat" style={{ marginTop: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="adm-card adm-card-pad">
            <div className="adm-skeleton" style={{ height: 11, width: '55%', borderRadius: 6 }} />
            <div style={{ height: 10 }} />
            <div className="adm-skeleton" style={{ height: 26, width: '40%', borderRadius: 6 }} />
          </div>
        ))}
      </div>

      <div className="adm-card" style={{ marginTop: 20, padding: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 12 }}>
            {Array.from({ length: 5 }).map((_, k) => (
              <div key={k} className="adm-skeleton" style={{ height: 14, width: k === 0 ? '80%' : '60%', borderRadius: 6 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
