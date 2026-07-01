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
  X,
  Compass,
  Check
} from 'lucide-react';
import rawData from './data/diem_chuan.json';
import rawDataLop10 from './data/diem_chuan_lop10.json';

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

// Normalize names/queries for HCM city synonyms
const normalizeHcmSynonyms = (str) => {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/tp\.hcm/g, 'hcm')
    .replace(/tphcm/g, 'hcm')
    .replace(/hồ chí minh/g, 'hcm')
    .replace(/sài gòn/g, 'hcm');
};

// Common Subject Groups in Vietnam (University)
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
  // Main level switcher: 'university' (Đại học & Cao đẳng) or 'grade10' (Tuyển sinh Lớp 10)
  const [mainMode, setMainMode] = useState('university');
  
  // Navigation tabs: 'suggest' (Smart Suggestion) or 'search' (General search)
  const [activeTab, setActiveTab] = useState('suggest');
  
  // =========================================================================
  // 1. UNIVERSITY & COLLEGE STATES
  // =========================================================================
  const [userScore, setUserScore] = useState('24.0');
  const [selectedGroup, setSelectedGroup] = useState('A00');
  const [safetyMargin, setSafetyMargin] = useState(0); // Offset: 0, 0.5, 1.0, 2.0
  const [suggestedLevel, setSuggestedLevel] = useState('All'); // All, University, College
  
  // University Search Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  
  // =========================================================================
  // 2. GRADE 10 (THPT) STATES
  // =========================================================================
  const [selectedProvince, setSelectedProvince] = useState('Hà Nội');
  const [userAvgScore, setUserAvgScore] = useState('8.0');
  const [g10SafetyMargin, setG10SafetyMargin] = useState(0); // Offset (average): 0, 0.2, 0.4
  
  // Grade 10 Search Filters
  const [g10SearchQuery, setG10SearchQuery] = useState('');
  const [g10SelectedProvince, setG10SelectedProvince] = useState('All');

  // Detail Modal States
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedHighschool, setSelectedHighschool] = useState(null);

  // =========================================================================
  // COMPUTED PROPERTIES - UNIVERSITY
  // =========================================================================
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

  const suggestedResults = useMemo(() => {
    const score = parseFloat(userScore) || 0.0;
    const results = [];

    rawData.forEach(uni => {
      if (suggestedLevel === 'University' && !uni.is_university) return;
      if (suggestedLevel === 'College' && uni.is_university) return;

      uni.admission_data.forEach(method => {
        if (!method.method.includes('THPT') && !method.method.includes('Học bạ')) return;

        method.majors.forEach(major => {
          const groups = major.subject_group.toUpperCase();
          const isGroupMatch = groups.includes(selectedGroup) || groups.includes('TẤT CẢ') || groups === 'TẤT CẢ';
          
          if (!isGroupMatch) return;

          const targetLimit = score + safetyMargin;
          const isScoreMatch = major.score > 0 && major.score <= targetLimit;

          if (isScoreMatch) {
            const scoreDifference = score - major.score;
            let status = 'Tuyệt vời';
            let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

            if (scoreDifference < 0) {
              status = 'Thử thách';
              statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            } else if (scoreDifference > 3.0) {
              status = 'An toàn cao';
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

  const searchResults = useMemo(() => {
    const query = normalizeHcmSynonyms(searchQuery);
    if (!query && selectedMethod === 'All' && selectedLevel === 'All' && selectedRegion === 'All' && selectedYear === 'All') {
      return rawData.slice(0, 50).map(uni => ({ ...uni, region: getRegion(uni.name) }));
    }

    const filtered = [];
    rawData.forEach(uni => {
      const region = getRegion(uni.name);
      
      if (selectedLevel === 'University' && !uni.is_university) return;
      if (selectedLevel === 'College' && uni.is_university) return;
      if (selectedRegion !== 'All' && region !== selectedRegion) return;

      const normName = normalizeHcmSynonyms(uni.name);
      const normCode = normalizeHcmSynonyms(uni.code);
      const uniMatch = normName.includes(query) || normCode.includes(query);
      
      const matchedMethods = [];
      uni.admission_data.forEach(method => {
        if (selectedMethod !== 'All' && method.method !== selectedMethod) return;
        if (selectedYear !== 'All' && method.year !== parseInt(selectedYear)) return;

        const matchedMajors = method.majors.filter(major => {
          if (!query) return true;
          if (uniMatch) return true; 
          
          const normMajorName = normalizeHcmSynonyms(major.major_name);
          const normSubGroup = normalizeHcmSynonyms(major.subject_group);
          return normMajorName.includes(query) || normSubGroup.includes(query);
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

  // =========================================================================
  // COMPUTED PROPERTIES - GRADE 10 (THPT)
  // =========================================================================
  const g10Stats = useMemo(() => {
    const provinces = new Set();
    rawDataLop10.forEach(school => {
      provinces.add(school.province);
    });
    return {
      totalSchools: rawDataLop10.length,
      totalProvinces: provinces.size
    };
  }, []);

  const g10Provinces = useMemo(() => {
    const provinces = new Set();
    rawDataLop10.forEach(school => {
      provinces.add(school.province);
    });
    return Array.from(provinces).sort((a, b) => a.localeCompare(b, 'vi'));
  }, []);

  // Helper to extract the latest score and nv1_avg for a high school
  const getLatestG10Score = (school) => {
    if (!school.scores || school.scores.length === 0) return null;
    // Sort scores to get the latest year
    const sorted = [...school.scores].sort((a,b) => b.year - a.year);
    // Find the first valid nv1 score
    return sorted.find(s => s.nv1 !== null && s.nv1_avg !== null) || sorted[0];
  };

  const g10SuggestedResults = useMemo(() => {
    const targetAvg = parseFloat(userAvgScore) || 0.0;
    const results = [];

    rawDataLop10.forEach(school => {
      // Filter by selected province
      if (school.province !== selectedProvince) return;

      const latestScore = getLatestG10Score(school);
      if (!latestScore || latestScore.nv1_avg === null) return;

      // targetAvg + margin must be >= latestScore.nv1_avg
      const targetLimit = targetAvg + g10SafetyMargin;
      if (latestScore.nv1_avg <= targetLimit) {
        const diff = targetAvg - latestScore.nv1_avg;
        let status = 'Tuyệt vời';
        let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

        if (diff < 0) {
          status = 'Thử thách';
          statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        } else if (diff > 1.0) {
          status = 'An toàn cao';
          statusColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        }

        results.push({
          ...school,
          latest: latestScore,
          diff,
          status,
          statusColor
        });
      }
    });

    // Sort by latest nv1_avg descending
    return results.sort((a, b) => b.latest.nv1_avg - a.latest.nv1_avg);
  }, [selectedProvince, userAvgScore, g10SafetyMargin]);

  const g10SearchResults = useMemo(() => {
    const query = g10SearchQuery.toLowerCase().trim();
    
    return rawDataLop10.filter(school => {
      // Province filter
      if (g10SelectedProvince !== 'All' && school.province !== g10SelectedProvince) return false;
      
      if (!query) return true;

      const matchName = school.name.toLowerCase().includes(query);
      const matchCode = school.code.toLowerCase().includes(query);
      const matchArea = school.area && school.area.toLowerCase().includes(query);
      return matchName || matchCode || matchArea;
    });
  }, [g10SearchQuery, g10SelectedProvince]);

  // Dynamic multipliers for total score representation
  const getProvinceMultiplierText = (prov, avgStr) => {
    const avg = parseFloat(avgStr) || 0.0;
    if (prov.includes('Hà Nội')) {
      const total = (avg * 5).toFixed(2);
      return `~ ${total}đ (Hệ số: Toán x2, Văn x2, Anh x1)`;
    }
    if (prov.includes('Hồ Chí Minh') || prov.includes('HCM')) {
      const total = (avg * 3).toFixed(2);
      return `~ ${total}đ (Hệ số: Toán x1, Văn x1, Anh x1)`;
    }
    return '';
  };

  // Helper to open university modal
  const openUniModal = (uniCode) => {
    const uni = rawData.find(u => u.code === uniCode);
    if (uni) {
      setSelectedUni({
        ...uni,
        region: getRegion(uni.name)
      });
    }
  };

  // Helper to open high school modal
  const openHighschoolModal = (schoolCode) => {
    const hs = rawDataLop10.find(s => s.code === schoolCode);
    if (hs) {
      setSelectedHighschool(hs);
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
              <p className="brand-subtitle font-medium">Hệ thống Tra cứu Điểm chuẩn & Đề xuất Nguyện vọng</p>
            </div>
          </div>
          
          {mainMode === 'university' ? (
            <div className="stats-bar">
              <div className="stat-item">
                Trường ĐH/CĐ: <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{stats.totalSchools}</span>
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
          ) : (
            <div className="stats-bar">
              <div className="stat-item">
                Trường THPT: <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{g10Stats.totalSchools}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                Tỉnh/Thành phố: <span style={{ fontWeight: 'bold', color: '#10b981' }}>{g10Stats.totalProvinces}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container">
        {/* Main Mode Selector Pill Button Group */}
        <div className="mode-selector-container">
          <button 
            className={`mode-btn ${mainMode === 'university' ? 'active' : ''}`}
            onClick={() => {
              setMainMode('university');
              setActiveTab('suggest');
            }}
          >
            <GraduationCap style={{ width: '1.1rem', height: '1.1rem' }} />
            Đại học & Cao đẳng
          </button>
          <button 
            className={`mode-btn ${mainMode === 'grade10' ? 'active' : ''}`}
            onClick={() => {
              setMainMode('grade10');
              setActiveTab('suggest');
            }}
          >
            <BookOpen style={{ width: '1.1rem', height: '1.1rem' }} />
            Tuyển sinh Lớp 10 (THPT)
          </button>
        </div>

        {/* Welcome Section */}
        <section className="hero-section glass-panel-accent">
          <div className="hero-content">
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
              {mainMode === 'university' ? 'Tuyển sinh Đại học/Cao đẳng 2025/2026' : 'Tuyển sinh THPT Chuyên & Công lập 2025/2026'}
            </span>
            <h2 className="hero-title">
              {mainMode === 'university' ? 'Tra cứu khả năng trúng tuyển Đại Học' : 'Ước lượng khả năng đỗ vào Lớp 10'}
            </h2>
            <p className="hero-desc">
              {mainMode === 'university' ? (
                'Hệ thống cung cấp điểm chuẩn chính xác từ hơn 420+ trường Đại học, Cao đẳng Việt Nam. Hãy sử dụng bộ gợi ý thông minh dựa trên tổ hợp thi để xếp nguyện vọng tối ưu.'
              ) : (
                'Dữ liệu điểm chuẩn thi vào 10 của gần 2.000 trường THPT thuộc hơn 34 tỉnh thành trên cả nước. Trải nghiệm ngay công cụ gợi ý thông minh đồng nhất theo điểm trung bình.'
              )}
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
                {mainMode === 'university' ? 'Tìm kiếm theo trường ĐH' : 'Tìm kiếm theo trường cấp 3'}
              </button>
            </div>
          </div>
          <div className="hero-bg-icon">
            {mainMode === 'university' ? (
              <Award style={{ width: '12rem', height: '12rem', color: '#6366f1' }} />
            ) : (
              <Compass style={{ width: '12rem', height: '12rem', color: '#10b981' }} />
            )}
          </div>
        </section>

        {/* =========================================================================
            MODE 1: UNIVERSITY & COLLEGE
            ========================================================================= */}
        {mainMode === 'university' && activeTab === 'suggest' && (
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
                  <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '2px' }}>Chiến thuật xếp NV ĐH:</strong>
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
                    Tìm thấy <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{suggestedResults.length}</span> ngành học phù hợp.
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

        {mainMode === 'university' && activeTab === 'search' && (
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

        {/* =========================================================================
            MODE 2: GRADE 10 (THPT)
            ========================================================================= */}
        {mainMode === 'grade10' && activeTab === 'suggest' && (
          <div className="suggestion-layout animate-fade-in">
            {/* Input Parameters Panel */}
            <div className="config-sidebar">
              <div className="config-card glass-panel">
                <div className="config-header">
                  <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />
                  <h3 style={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Cấu hình Điểm & Tỉnh</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Province Selector */}
                  <div className="config-form-group">
                    <label className="config-label">Chọn Tỉnh/Thành phố:</label>
                    <select 
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                    >
                      {g10Provinces.map((prov, idx) => (
                        <option key={idx} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>

                  {/* Average Score Input */}
                  <div className="config-form-group">
                    <label className="config-label">Điểm trung bình mỗi môn:</label>
                    <div className="config-input-wrapper">
                      <input 
                        type="number" 
                        step="0.05"
                        min="0"
                        max="10"
                        value={userAvgScore}
                        onChange={(e) => setUserAvgScore(e.target.value)}
                        style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', paddingRight: '3.5rem' }}
                        placeholder="8.0"
                      />
                      <span className="config-input-suffix">/ 10 đ</span>
                    </div>
                    {/* Equivalent total score display */}
                    {getProvinceMultiplierText(selectedProvince, userAvgScore) && (
                      <p style={{ fontSize: '0.7rem', color: '#a5b4fc', marginTop: '0.25rem', textAlign: 'right' }}>
                        {getProvinceMultiplierText(selectedProvince, userAvgScore)}
                      </p>
                    )}
                  </div>

                  {/* Safety Margin Selector */}
                  <div className="config-form-group">
                    <label className="config-label">Biên độ điểm trung bình gợi ý:</label>
                    <select 
                      value={g10SafetyMargin}
                      onChange={(e) => setG10SafetyMargin(parseFloat(e.target.value))}
                    >
                      <option value="0">Điểm chuẩn &le; điểm của tôi (An toàn)</option>
                      <option value="0.2">Cao hơn tối đa +0.2đ/môn (Thử thách nhẹ)</option>
                      <option value="0.4">Cao hơn tối đa +0.4đ/môn (Thử thách)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tips block */}
              <div className="tip-box" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <Info className="tip-icon" style={{ width: '1.2rem', height: '1.2rem', color: '#10b981' }} />
                <div className="tip-text">
                  <strong style={{ color: '#a7f3d0', display: 'block', marginBottom: '2px' }}>Về điểm chuẩn hóa lớp 10:</strong>
                  Do mỗi tỉnh tính điểm tổng khác nhau (thang 30 hoặc 50), chúng tôi quy đổi toàn bộ điểm chuẩn về **Điểm trung bình môn (Scale 10)** để bạn so sánh trực quan và chính xác nhất.
                </div>
              </div>
            </div>

            {/* Suggestions Results Panel */}
            <div className="results-panel">
              <div className="results-header-info">
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Gợi ý trường THPT trúng tuyển</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Tìm thấy <span style={{ fontWeight: 'bold', color: '#10b981' }}>{g10SuggestedResults.length}</span> trường THPT tại <span style={{ fontWeight: 'bold', color: 'white' }}>{selectedProvince}</span> có điểm phù hợp.
                  </p>
                </div>
              </div>

              {g10SuggestedResults.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <BookOpen style={{ width: '2.5rem', height: '2.5rem', color: '#475569', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#94a3b8', fontWeight: '500' }}>Không tìm thấy trường THPT phù hợp.</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Vui lòng tăng biên độ điểm gợi ý hoặc kiểm tra lại mức điểm.</p>
                </div>
              ) : (
                <div className="results-grid">
                  {g10SuggestedResults.map((school, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => openHighschoolModal(school.code)}
                      className="result-card glass-panel"
                      style={{ borderLeft: '3px solid rgba(16, 185, 129, 0.4)' }}
                    >
                      <div>
                        <div className="card-top">
                          <span className="card-code">{school.code.toUpperCase()}</span>
                          <span className={`badge ${school.statusColor}`} style={{ fontSize: '0.65rem' }}>
                            {school.status}
                          </span>
                        </div>
                        <h4 className="card-title" style={{ fontSize: '0.95rem' }}>{school.name}</h4>
                        <p className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}>
                          <MapPin style={{ width: '0.75rem', height: '0.75rem', color: '#10b981' }} />
                          {school.area || 'Không rõ khu vực'}
                        </p>
                      </div>

                      <div className="card-bottom">
                        <div className="card-meta">
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Dựa trên điểm tuyển sinh đợt 1 ({school.latest.year})
                          </div>
                        </div>
                        <div className="card-score-box">
                          <div className="card-score-label">Điểm chuẩn (TB môn)</div>
                          <div className="card-score-val" style={{ color: '#10b981' }}>
                            {school.latest.nv1} <span style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>({school.latest.nv1_avg.toFixed(2)}đ/môn)</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="card-hover-arrow" style={{ width: '1.25rem', height: '1.25rem' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {mainMode === 'grade10' && activeTab === 'search' && (
          <div className="search-layout animate-fade-in">
            {/* Search Input & Filters Board */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="search-bar-wrapper">
                <Search className="search-icon" style={{ width: '1.2rem', height: '1.2rem' }} />
                <input 
                  type="text"
                  value={g10SearchQuery}
                  onChange={(e) => setG10SearchQuery(e.target.value)}
                  className="search-input"
                  placeholder="Tìm trường cấp 3 theo tên trường, mã trường, quận huyện..."
                />
              </div>

              <div className="filters-row">
                {/* Province filter */}
                <div className="filter-group" style={{ flex: '1' }}>
                  <span className="filter-label">
                    <MapPin style={{ width: '0.8rem', height: '0.8rem' }} /> Tỉnh / Thành phố
                  </span>
                  <select 
                    value={g10SelectedProvince} 
                    onChange={(e) => setG10SelectedProvince(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">Tất cả tỉnh thành</option>
                    {g10Provinces.map((prov, idx) => (
                      <option key={idx} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Danh sách các trường THPT ({g10SearchResults.length} trường)</h3>
              {g10SearchResults.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <GraduationCap style={{ width: '2.5rem', height: '2.5rem', color: '#475569', margin: '0 auto 1rem' }} />
                  <p style={{ color: '#94a3b8', fontWeight: '500' }}>Không tìm thấy trường THPT nào phù hợp.</p>
                </div>
              ) : (
                <div className="search-results-grid">
                  {g10SearchResults.map((school) => {
                    const latest = getLatestG10Score(school);
                    return (
                      <div 
                        key={school.code}
                        onClick={() => setSelectedHighschool(school)}
                        className="uni-search-card glass-panel"
                        style={{ borderLeft: '3px solid rgba(16, 185, 129, 0.4)' }}
                      >
                        <div>
                          <div className="uni-card-header">
                            <span className="badge badge-primary">{school.code.toUpperCase()}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin style={{ width: '0.8rem', height: '0.8rem', color: '#10b981' }} /> {school.province}
                            </span>
                          </div>
                          <h4 className="uni-card-title">{school.name}</h4>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Khu vực: {school.area || 'Không rõ'}
                          </p>
                        </div>

                        <div className="uni-card-footer">
                          {latest ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Điểm chuẩn ({latest.year}): <span style={{ fontWeight: 'bold', color: '#10b981' }}>{latest.nv1}đ</span> ({latest.nv1_avg.toFixed(2)}đ/môn)
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Chưa công bố điểm chuẩn
                            </div>
                          )}
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            Lịch sử <ArrowRight style={{ width: '0.85rem', height: '0.85rem' }} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Grade 10 High School Detail Modal */}
      {selectedHighschool && (
        <div className="modal-backdrop">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header" style={{ borderBottomColor: 'rgba(16, 185, 129, 0.15)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    {selectedHighschool.code.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin style={{ width: '0.8rem', height: '0.8rem', color: '#10b981' }} /> {selectedHighschool.province}
                  </span>
                </div>
                <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{selectedHighschool.name}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Khu vực địa lý: {selectedHighschool.area || 'Chưa rõ thông tin'}
                </p>
              </div>
              <button 
                onClick={() => setSelectedHighschool(null)}
                className="modal-close-btn"
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <div className="method-section">
                <div className="method-title-wrapper" style={{ color: '#10b981' }}>
                  <CheckCircle style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
                  <span>Lịch sử điểm trúng tuyển vào lớp 10 qua các năm</span>
                </div>
                
                <div className="method-table-wrapper">
                  <table className="method-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}>Năm tuyển sinh</th>
                        <th style={{ textAlign: 'center' }}>Điểm chuẩn NV1</th>
                        <th style={{ textAlign: 'center' }}>Điểm chuẩn NV2</th>
                        <th style={{ textAlign: 'center' }}>Điểm chuẩn NV3</th>
                        <th style={{ textAlign: 'center' }}>Điểm TB môn (Scale 10)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedHighschool.scores && selectedHighschool.scores.length > 0 ? (
                        [...selectedHighschool.scores]
                          .sort((a,b) => b.year - a.year)
                          .map((scoreObj, idx) => (
                            <tr key={idx}>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: 'white' }}>Năm {scoreObj.year}</td>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>
                                {scoreObj.nv1 !== null ? `${scoreObj.nv1}đ` : '-'}
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                {scoreObj.nv2 !== null ? `${scoreObj.nv2}đ` : '-'}
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                {scoreObj.nv3 !== null ? `${scoreObj.nv3}đ` : '-'}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#a5b4fc' }}>
                                {scoreObj.nv1_avg !== null ? `${scoreObj.nv1_avg.toFixed(2)} đ/môn` : '-'}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            Chưa có dữ liệu điểm chuẩn lịch sử
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <span>Nguồn: Tuyensinh247</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                * Điểm trung bình môn được tính bằng tổng điểm chia cho hệ số các môn thi của từng tỉnh.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
