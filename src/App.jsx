import React, { useState, useMemo } from 'react';
import { 
  Search, 
  GraduationCap, 
  MapPin, 
  Filter, 
  Info, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Sparkles, 
  TrendingUp, 
  CheckCircle, 
  ChevronRight,
  ExternalLink,
  X
} from 'lucide-react';
import rawData from './data/diem_chuan.json';

// Helper to determine region based on school name
const getRegion = (schoolName) => {
  const nameLower = schoolName.toLowerCase();
  
  const northernKeywords = [
    'hà nội', 'thái nguyên', 'hải phòng', 'bắc giang', 'hùng vương', 'bắc ninh', 
    'nam định', 'mỏ - địa chất', 'quảng ninh', 'thái bình', 'hải dương', 'kinh bắc', 
    'sư phạm nghệ thuật', 'sân khấu điện ảnh', 'bách khoa', 'kinh tế quốc dân', 'phương đông'
  ];
  
  const centralKeywords = [
    'đà nẵng', 'huế', 'vinh', 'nha trang', 'quy nhơn', 'phú yên', 'quảng nam', 
    'quảng bình', 'tây nguyên', 'hà tĩnh', 'đà lạt', 'khánh hòa', 'phan thiết', 
    'phan châu trinh', 'quảng trị'
  ];
  
  const southernKeywords = [
    'tphcm', 'hồ chí minh', 'sài gòn', 'cần thơ', 'đồng nai', 'bình dương', 
    'tiền giang', 'lâm đồng', 'nông lâm', 'vũng tàu', 'trà vinh', 'an giang', 
    'long an', 'đồng tháp', 'gia định', 'hoa sen', 'văn lang', 'hồng bàng', 
    'tôn đức thắng', 'lạc hồng', 'bình phước', 'cửu long'
  ];

  if (northernKeywords.some(key => nameLower.includes(key))) return 'Miền Bắc';
  if (centralKeywords.some(key => nameLower.includes(key))) return 'Miền Trung';
  if (southernKeywords.some(key => nameLower.includes(key))) return 'Miền Nam';
  return 'Khác';
};

// Common Subject Groups in Vietnam
const SUBJECT_GROUPS = [
  { id: 'A00', name: 'A00 (Toán, Lý, Hóa)' },
  { id: 'A01', name: 'A01 (Toán, Lý, Anh)' },
  { id: 'B00', name: 'B00 (Toán, Hóa, Sinh)' },
  { id: 'C00', name: 'C00 (Văn, Sử, Địa)' },
  { id: 'D01', name: 'D01 (Toán, Văn, Anh)' },
  { id: 'D07', name: 'D07 (Toán, Hóa, Anh)' },
  { id: 'D14', name: 'D14 (Văn, Sử, Anh)' },
  { id: 'D15', name: 'D15 (Văn, Địa, Anh)' }
];

export default function App() {
  // Navigation tabs: 'suggest' (Smart Suggestion) or 'search' (General search)
  const [activeTab, setActiveTab] = useState('suggest');
  
  // Suggestion Engine States
  const [userScore, setUserScore] = useState('24.0');
  const [selectedGroup, setSelectedGroup] = useState('A00');
  const [safetyMargin, setSafetyMargin] = useState(0); // Offset: 0, 0.5, 1.0, 2.0
  const [suggestedLevel, setSuggestedLevel] = useState('All'); // All, University, College
  
  // General Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  
  // Detail Modal State
  const [selectedUni, setSelectedUni] = useState(null);

  // Compute overall stats from dataset
  const stats = useMemo(() => {
    let totalMajors = 0;
    let highestScore = 0;
    rawData.forEach(uni => {
      uni.admission_data.forEach(method => {
        method.majors.forEach(m => {
          totalMajors++;
          if (m.score > highestScore && m.score <= 30) {
            highestScore = m.score;
          }
        });
      });
    });
    return {
      totalSchools: rawData.length,
      totalMajors,
      highestScore
    };
  }, []);

  // Extract all unique admission methods and years for filters
  const filterOptions = useMemo(() => {
    const methods = new Set();
    const years = new Set();
    rawData.forEach(uni => {
      uni.admission_data.forEach(method => {
        methods.add(method.method);
        years.add(method.year);
      });
    });
    return {
      methods: ['All', ...Array.from(methods)],
      years: ['All', ...Array.from(years).sort((a,b) => b-a)]
    };
  }, []);

  // Logic: Filter and find suggested majors where user is likely to pass
  const suggestedResults = useMemo(() => {
    const score = parseFloat(userScore) || 0.0;
    const results = [];

    rawData.forEach(uni => {
      // Apply level filter
      if (suggestedLevel === 'University' && !uni.is_university) return;
      if (suggestedLevel === 'College' && uni.is_university) return;

      uni.admission_data.forEach(method => {
        // We only suggest based on High school exam (THPT) and Transcript (Học bạ) as standard
        if (!method.method.includes('THPT') && !method.method.includes('Học bạ')) return;

        method.majors.forEach(major => {
          // Check if subject group matches
          const groups = major.subject_group.toUpperCase();
          const isGroupMatch = groups.includes(selectedGroup) || groups.includes('TẤT CẢ') || groups === 'TẤT CẢ';
          
          if (!isGroupMatch) return;

          // Check if score satisfies target range
          const targetLimit = score + safetyMargin;
          const isScoreMatch = major.score > 0 && major.score <= targetLimit;

          if (isScoreMatch) {
            const scoreDifference = score - major.score;
            let status = 'Tuyệt vời'; // Safe option (user score >= benchmark score)
            let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

            if (scoreDifference < 0) {
              status = 'Thử thách'; // Reach option (slightly higher than user score)
              statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            } else if (scoreDifference > 3.0) {
              status = 'An toàn cao'; // Very safe option
              statusColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
            }

            results.push({
              uni_name: uni.name,
              uni_code: uni.code,
              uni_url: uni.url,
              uni_is_university: uni.is_university,
              region: getRegion(uni.name),
              method: method.method,
              year: method.year,
              major_name: major.major_name,
              subject_group: major.subject_group,
              score: major.score,
              score_str: major.score_str,
              note: major.note,
              diff: scoreDifference,
              status,
              statusColor
            });
          }
        });
      });
    });

    return results.sort((a, b) => b.score - a.score);
  }, [userScore, selectedGroup, safetyMargin, suggestedLevel]);

  // Logic: General search query filtering
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query && selectedMethod === 'All' && selectedLevel === 'All' && selectedRegion === 'All' && selectedYear === 'All') {
      return rawData.slice(0, 50).map(uni => ({ ...uni, region: getRegion(uni.name) }));
    }

    const filtered = [];
    rawData.forEach(uni => {
      const region = getRegion(uni.name);
      
      // Filters
      if (selectedLevel === 'University' && !uni.is_university) return;
      if (selectedLevel === 'College' && uni.is_university) return;
      if (selectedRegion !== 'All' && region !== selectedRegion) return;

      const uniMatch = uni.name.toLowerCase().includes(query) || uni.code.toLowerCase().includes(query);
      
      const matchedMethods = [];
      uni.admission_data.forEach(method => {
        if (selectedMethod !== 'All' && method.method !== selectedMethod) return;
        if (selectedYear !== 'All' && method.year !== parseInt(selectedYear)) return;

        const matchedMajors = method.majors.filter(major => {
          if (!query) return true;
          if (uniMatch) return true; 
          return major.major_name.toLowerCase().includes(query) || major.subject_group.toLowerCase().includes(query);
        });

        if (matchedMajors.length > 0) {
          matchedMethods.push({
            ...method,
            majors: matchedMajors
          });
        }
      });

      if (matchedMethods.length > 0) {
        filtered.push({
          ...uni,
          region,
          admission_data: matchedMethods
        });
      }
    });

    return filtered;
  }, [searchQuery, selectedMethod, selectedLevel, selectedRegion, selectedYear]);

  // Handle opening modal
  const openUniModal = (uniCode) => {
    const uni = rawData.find(u => u.code === uniCode);
    if (uni) {
      setSelectedUni({
        ...uni,
        region: getRegion(uni.name)
      });
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Background Orbs */}
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-logo">
              <GraduationCap style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h1 className="brand-title">AdmissionPro 2026</h1>
              <p className="brand-subtitle font-medium">Hệ thống Tra cứu Điểm chuẩn Đại học & Cao đẳng</p>
            </div>
          </div>
          
          <div className="stats-bar">
            <div className="stat-item">
              Trường: <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{stats.totalSchools}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              Ngành học: <span style={{ fontWeight: 'bold', color: '#10b981' }}>{stats.totalMajors.toLocaleString()}</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              Điểm sàn tối đa: <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{stats.highestScore}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Welcome Section */}
        <section className="hero-section glass-panel-accent">
          <div className="hero-content">
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>Tuyển sinh năm học 2025 - 2026</span>
            <h2 className="hero-title">Tra cứu Khả Năng Trúng Tuyển Cực Nhanh</h2>
            <p className="hero-desc">
              Hệ thống cung cấp điểm chuẩn chính xác từ hơn 290+ trường Đại học, Cao đẳng Việt Nam. Hãy sử dụng bộ lọc thông minh bên dưới để tìm ra ngành học phù hợp nhất với điểm số của bạn.
            </p>
            <div className="hero-actions">
              <button 
                onClick={() => setActiveTab('suggest')}
                className={activeTab === 'suggest' ? '' : 'secondary'}
              >
                <Sparkles style={{ width: '1rem', height: '1rem' }} />
                Gợi ý đỗ theo điểm số
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className={activeTab === 'search' ? '' : 'secondary'}
              >
                <Search style={{ width: '1rem', height: '1rem' }} />
                Tìm kiếm theo trường
              </button>
            </div>
          </div>
          <div className="hero-bg-icon">
            <Award style={{ width: '12rem', height: '12rem', color: '#6366f1' }} />
          </div>
        </section>

        {/* Tab 1: Smart Suggestion Engine */}
        {activeTab === 'suggest' && (
          <div className="suggestion-layout animate-fade-in">
            {/* Input Parameters Panel */}
            <div className="config-sidebar">
              <div className="config-card glass-panel">
                <div className="config-header">
                  <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
                  <h3 style={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Cấu hình Điểm & Khối</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Score Input */}
                  <div className="config-form-group">
                    <label className="config-label">Điểm thi của bạn:</label>
                    <div className="config-input-wrapper">
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="30"
                        value={userScore}
                        onChange={(e) => setUserScore(e.target.value)}
                        style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', paddingRight: '3rem' }}
                        placeholder="24.0"
                      />
                      <span className="config-input-suffix">Điểm</span>
                    </div>
                  </div>

                  {/* Subject Group */}
                  <div className="config-form-group">
                    <label className="config-label">Tổ hợp xét tuyển:</label>
                    <select 
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                      {SUBJECT_GROUPS.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Safety Margin Selector */}
                  <div className="config-form-group">
                    <label className="config-label">Biên độ điểm gợi ý:</label>
                    <select 
                      value={safetyMargin}
                      onChange={(e) => setSafetyMargin(parseFloat(e.target.value))}
                    >
                      <option value="0">Điểm chuẩn &le; điểm của tôi (An toàn)</option>
                      <option value="0.5">Cao hơn tối đa +0.5đ (Thử thách nhẹ)</option>
                      <option value="1.0">Cao hơn tối đa +1.0đ (Thử thách)</option>
                      <option value="2.0">Cao hơn tối đa +2.0đ (Nguyện vọng mơ ước)</option>
                    </select>
                  </div>

                  {/* Level Selector */}
                  <div className="config-form-group">
                    <label className="config-label">Bậc học:</label>
                    <div className="config-grid-3">
                      {['All', 'University', 'College'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSuggestedLevel(lvl)}
                          className={suggestedLevel === lvl ? '' : 'secondary'}
                          style={{ padding: '6px 4px', fontSize: '0.75rem' }}
                        >
                          {lvl === 'All' ? 'Tất cả' : lvl === 'University' ? 'Đại học' : 'Cao đẳng'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips block */}
              <div className="tip-box">
                <Info className="tip-icon" style={{ width: '1.2rem', height: '1.2rem' }} />
                <div className="tip-text">
                  <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '2px' }}>Chiến thuật sắp xếp:</strong>
                  Nên chia các nguyện vọng thành 3 nhóm: Nhóm mơ ước (+1.0đ đến +2.0đ), Nhóm vừa tầm (bằng hoặc chênh lệch &plusmn;0.5đ) và Nhóm an toàn (-1.0đ trở lên).
                </div>
              </div>
            </div>

            {/* Suggestions Results Panel */}
            <div className="results-panel">
              <div className="results-header-info">
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Gợi ý ngành trúng tuyển</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tìm thấy <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{suggestedResults.length}</span> ngành học có điểm chuẩn phù hợp.
                  </p>
                </div>
              </div>

              {suggestedResults.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <BookOpen style={{ width: '2.5rem', height: '2.5rem', color: '#475569', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#94a3b8', fontWeight: '500' }}>Không tìm thấy kết quả phù hợp.</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Vui lòng tăng biên độ điểm hoặc điều chỉnh điểm thi của bạn.</p>
                </div>
              ) : (
                <div className="results-grid">
                  {suggestedResults.slice(0, 100).map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => openUniModal(item.uni_code)}
                      className="result-card glass-panel"
                    >
                      <div>
                        <div className="card-top">
                          <span className="card-code">{item.uni_code}</span>
                          <span className={`badge ${item.statusColor}`} style={{ fontSize: '0.65rem' }}>
                            {item.status}
                          </span>
                        </div>
                        <h4 className="card-title">{item.major_name}</h4>
                        <p className="card-subtitle">{item.uni_name}</p>
                      </div>

                      <div className="card-bottom">
                        <div className="card-meta">
                          <div className="card-meta-item">
                            <MapPin style={{ width: '0.85rem', height: '0.85rem', color: '#818cf8' }} />
                            {item.region}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {item.method} ({item.year})
                          </div>
                        </div>
                        <div className="card-score-box">
                          <div className="card-score-label">Điểm chuẩn</div>
                          <div className="card-score-val">{item.score}</div>
                        </div>
                      </div>
                      <ChevronRight className="card-hover-arrow" style={{ width: '1.25rem', height: '1.25rem' }} />
                    </div>
                  ))}
                  {suggestedResults.length > 100 && (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                      Đang hiển thị 100 gợi ý tối ưu nhất...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: General Search & Filters */}
        {activeTab === 'search' && (
          <div className="search-layout animate-fade-in">
            {/* Search Input & Filters Board */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="search-bar-wrapper">
                <Search className="search-icon" style={{ width: '1.2rem', height: '1.2rem' }} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  placeholder="Tìm theo tên trường, mã trường (BKA, FTU...), tên ngành học..."
                />
              </div>

              <div className="filters-row">
                {/* Method filter */}
                <div className="filter-group">
                  <span className="filter-label">
                    <Filter style={{ width: '0.8rem', height: '0.8rem' }} /> Phương thức xét tuyển
                  </span>
                  <select 
                    value={selectedMethod} 
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="filter-select"
                  >
                    {filterOptions.methods.map((m, idx) => (
                      <option key={idx} value={m}>{m === 'All' ? 'Tất cả phương thức' : m}</option>
                    ))}
                  </select>
                </div>

                {/* Level filter */}
                <div className="filter-group">
                  <span className="filter-label">
                    <GraduationCap style={{ width: '0.8rem', height: '0.8rem' }} /> Hệ đào tạo
                  </span>
                  <select 
                    value={selectedLevel} 
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">Tất cả hệ học</option>
                    <option value="University">Đại học</option>
                    <option value="College">Cao đẳng</option>
                  </select>
                </div>

                {/* Region filter */}
                <div className="filter-group">
                  <span className="filter-label">
                    <MapPin style={{ width: '0.8rem', height: '0.8rem' }} /> Khu vực / Miền
                  </span>
                  <select 
                    value={selectedRegion} 
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">Tất cả miền</option>
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Miền Trung">Miền Trung</option>
                    <option value="Miền Nam">Miền Nam</option>
                  </select>
                </div>

                {/* Year filter */}
                <div className="filter-group">
                  <span className="filter-label">
                    <TrendingUp style={{ width: '0.8rem', height: '0.8rem' }} /> Năm công bố
                  </span>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="filter-select"
                  >
                    {filterOptions.years.map((y, idx) => (
                      <option key={idx} value={y}>{y === 'All' ? 'Tất cả các năm' : `Năm ${y}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Danh sách các trường tuyển sinh</h3>
              {searchResults.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <GraduationCap style={{ width: '2.5rem', height: '2.5rem', color: '#475569', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#94a3b8', fontWeight: '500' }}>Không tìm thấy trường nào phù hợp.</p>
                </div>
              ) : (
                <div className="search-results-grid">
                  {searchResults.map((uni) => (
                    <div 
                      key={uni.code}
                      onClick={() => setSelectedUni(uni)}
                      className="uni-search-card glass-panel"
                    >
                      <div>
                        <div className="uni-card-header">
                          <span className="badge badge-primary">{uni.code}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin style={{ width: '0.8rem', height: '0.8rem', color: '#6366f1' }} /> {uni.region}
                          </span>
                        </div>
                        <h4 className="uni-card-title">{uni.name}</h4>
                      </div>

                      <div className="uni-card-footer">
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Có <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{uni.admission_data.length}</span> tổ hợp xét tuyển
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Chi tiết <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* University Detail Modal */}
      {selectedUni && (
        <div className="modal-backdrop">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{selectedUni.code}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin style={{ width: '0.8rem', height: '0.8rem', color: '#6366f1' }} /> {selectedUni.region}
                  </span>
                </div>
                <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{selectedUni.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedUni(null)}
                className="modal-close-btn"
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {selectedUni.admission_data.map((method, mIdx) => (
                <div key={mIdx} className="method-section">
                  <div className="method-title-wrapper">
                    <CheckCircle style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                    <span>{method.method} (Năm {method.year})</span>
                  </div>
                  
                  <div className="method-table-wrapper">
                    <table className="method-table">
                      <thead>
                        <tr>
                          <th>Ngành học</th>
                          <th style={{ width: '30%' }}>Tổ hợp môn</th>
                          <th style={{ width: '20%', textAlign: 'center' }}>Điểm chuẩn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {method.majors.map((m, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: '500' }}>{m.major_name}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{m.subject_group}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>{m.score > 0 ? m.score : m.score_str}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <span>Nguồn: Tuyensinh247</span>
              <a 
                href={selectedUni.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}
              >
                Xem trang chính thức <ExternalLink style={{ width: '0.85rem', height: '0.85rem' }} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
