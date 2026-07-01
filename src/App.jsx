import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  Plus,
  Trash2,
  Calculator,
  RefreshCw,
  Percent
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

// Categorize majors into 7 groups
const getMajorCategory = (majorName) => {
  const name = majorName.toLowerCase();
  
  const techKeywords = ["công nghệ thông tin", "tin học", "máy tính", "phần mềm", "hệ thống", "kỹ thuật", "cơ khí", "điện tử", "tự động hóa", "xây dựng", "kiến trúc", "mạng", "data", "dữ liệu", "công nghệ", "cơ điện tử", "viễn thông", "hạt nhân", "đo lường"];
  const econKeywords = ["kinh tế", "quản trị", "kinh doanh", "tài chính", "ngân hàng", "kế toán", "kiểm toán", "marketing", "thương mại", "nhân sự", "logistic", "chuỗi cung ứng", "quản lý", "khởi nghiệp", "bảo hiểm", "thuế", "du lịch", "khách sạn"];
  const medicalKeywords = ["y khoa", "dược", "điều dưỡng", "y tế", "nha khoa", "răng", "hộ sinh", "phục hồi", "dinh dưỡng", "y học", "phẫu thuật", "bác sĩ", "xét nghiệm", "khoa học y sinh"];
  const eduKeywords = ["sư phạm", "giáo dục", "giảng dạy", "quản lý giáo dục", "mầm non", "tiểu học"];
  const langKeywords = ["ngôn ngữ", "tiếng", "báo chí", "truyền thông", "văn học", "triết học", "lịch sử", "địa lý", "xã hội", "tâm lý", "luật", "quan hệ quốc tế", "đông phương", "xã hội học", "khoa học quản lý"];
  const artKeywords = ["thiết kế", "mỹ thuật", "âm nhạc", "nhiếp ảnh", "điện ảnh", "sân khấu", "hội họa", "nghệ thuật", "kiến trúc cảnh quan", "nhạc cụ"];

  if (techKeywords.some(key => name.includes(key))) return 'Tech';
  if (econKeywords.some(key => name.includes(key))) return 'Econ';
  if (medicalKeywords.some(key => name.includes(key))) return 'Medical';
  if (eduKeywords.some(key => name.includes(key))) return 'Edu';
  if (langKeywords.some(key => name.includes(key))) return 'Lang';
  if (artKeywords.some(key => name.includes(key))) return 'Art';
  return 'Other';
};

// Major Groups metadata
const MAJOR_GROUPS = [
  { id: 'All', name: 'Tất cả nhóm ngành' },
  { id: 'Tech', name: 'Công nghệ & Kỹ thuật' },
  { id: 'Econ', name: 'Kinh tế & Quản lý' },
  { id: 'Medical', name: 'Y tế & Sức khỏe' },
  { id: 'Edu', name: 'Sư phạm & Giáo dục' },
  { id: 'Lang', name: 'Ngôn ngữ & Nhân văn' },
  { id: 'Art', name: 'Nghệ thuật & Thiết kế' },
  { id: 'Other', name: 'Các ngành học khác' }
];

// Common Subject Groups in Vietnam (University)
const SUBJECT_GROUPS = [
  { id: 'A00', name: 'A00 (Toán, Lý, Hóa)', subjects: ['Toán', 'Vật lý', 'Hóa học'] },
  { id: 'A01', name: 'A01 (Toán, Lý, Anh)', subjects: ['Toán', 'Vật lý', 'Tiếng Anh'] },
  { id: 'B00', name: 'B00 (Toán, Hóa, Sinh)', subjects: ['Toán', 'Hóa học', 'Sinh học'] },
  { id: 'C00', name: 'C00 (Văn, Sử, Địa)', subjects: ['Ngữ văn', 'Lịch sử', 'Địa lý'] },
  { id: 'D01', name: 'D01 (Toán, Văn, Anh)', subjects: ['Toán', 'Ngữ văn', 'Tiếng Anh'] },
  { id: 'D07', name: 'D07 (Toán, Hóa, Anh)', subjects: ['Toán', 'Hóa học', 'Tiếng Anh'] },
  { id: 'D14', name: 'D14 (Văn, Sử, Anh)', subjects: ['Ngữ văn', 'Lịch sử', 'Tiếng Anh'] },
  { id: 'D15', name: 'D15 (Văn, Địa, Anh)', subjects: ['Ngữ văn', 'Địa lý', 'Tiếng Anh'] }
];

// Standard Letter Grade conversions in Vietnamese Universities (Circular 08/2021)
const LETTER_GRADES = [
  { letter: 'A+', gpa4: 4.0, gpa10: 9.5, desc: 'Xuất sắc', color: 'text-purple-400' },
  { letter: 'A', gpa4: 3.7, gpa10: 8.7, desc: 'Giỏi', color: 'text-indigo-400' },
  { letter: 'B+', gpa4: 3.5, gpa10: 8.2, desc: 'Khá giỏi', color: 'text-blue-400' },
  { letter: 'B', gpa4: 3.0, gpa10: 7.5, desc: 'Khá', color: 'text-emerald-400' },
  { letter: 'C+', gpa4: 2.5, gpa10: 6.7, desc: 'Trung bình khá', color: 'text-green-400' },
  { letter: 'C', gpa4: 2.0, gpa10: 6.0, desc: 'Trung bình', color: 'text-yellow-400' },
  { letter: 'D+', gpa4: 1.5, gpa10: 5.2, desc: 'Trung bình yếu', color: 'text-orange-400' },
  { letter: 'D', gpa4: 1.0, gpa10: 4.5, desc: 'Yếu', color: 'text-pink-400' },
  { letter: 'F', gpa4: 0.0, gpa10: 2.5, desc: 'Kém (Học lại)', color: 'text-rose-500' }
];

export default function App() {
  // Main modes: 'university' | 'grade10' | 'gpa'
  const [mainMode, setMainMode] = useState('university');
  
  // Navigation tabs: 'suggest' | 'search' (for modes 1 & 2)
  const [activeTab, setActiveTab] = useState('suggest');
  
  // Tools & Utilities sub-tabs: 'graduation' | 'convert' | 'calculator' (for mode 3)
  const [activeGpaTab, setActiveGpaTab] = useState('graduation');

  // =========================================================================
  // 1. UNIVERSITY & COLLEGE STATES
  // =========================================================================
  const [userScore, setUserScore] = useState('24.0');
  const [selectedGroup, setSelectedGroup] = useState('A00');
  const [safetyMargin, setSafetyMargin] = useState(0); 
  const [suggestedLevel, setSuggestedLevel] = useState('All'); 
  const [selectedMajorGroup, setSelectedMajorGroup] = useState('All');

  // Multi-subject input states
  const [scoreInputMode, setScoreInputMode] = useState('total'); // 'total' | 'detail'
  const [detailScores, setDetailScores] = useState({ s1: '8.0', s2: '8.0', s3: '8.0', priority: '0.0' });

  // Update total score automatically when subject scores change
  useEffect(() => {
    if (scoreInputMode === 'detail') {
      const s1 = parseFloat(detailScores.s1) || 0.0;
      const s2 = parseFloat(detailScores.s2) || 0.0;
      const s3 = parseFloat(detailScores.s3) || 0.0;
      const priority = parseFloat(detailScores.priority) || 0.0;
      const total = s1 + s2 + s3 + priority;
      setUserScore(total.toFixed(2));
    }
  }, [detailScores, scoreInputMode]);

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
  const [g10SafetyMargin, setG10SafetyMargin] = useState(0); 
  
  // Grade 10 Search Filters
  const [g10SearchQuery, setG10SearchQuery] = useState('');
  const [g10SelectedProvince, setG10SelectedProvince] = useState('All');

  // =========================================================================
  // 3. GPA & GRADUATION CALCULATOR STATES
  // =========================================================================
  // Graduation calculator states (GDPT 2018 / 2025 new format)
  const [gradScores, setGradScores] = useState({
    math: '8.0',
    literature: '8.0',
    elective1: '8.0',
    elective2: '8.0',
    gpa12: '8.0',
    priority: '0.0',
    bonus: '0.0'
  });

  // GPA conversion input
  const [gpa10Input, setGpa10Input] = useState('8.0');

  // GPA course listing calculator
  const [courses, setCourses] = useState([
    { id: 1, name: 'Triết học Mác - Lênin', credits: 3, grade: 'A' },
    { id: 2, name: 'Giải tích 1', credits: 4, grade: 'B+' },
    { id: 3, name: 'Tin học cơ sở', credits: 3, grade: 'A+' },
    { id: 4, name: 'Anh văn chuyên ngành 1', credits: 2, grade: 'C+' }
  ]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(3);
  const [newCourseGrade, setNewCourseGrade] = useState('A');

  // Detail Modal States
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedHighschool, setSelectedHighschool] = useState(null);

  // Get subjects for selected group
  const currentSubjects = useMemo(() => {
    const group = SUBJECT_GROUPS.find(g => g.id === selectedGroup);
    return group ? group.subjects : ['Môn 1', 'Môn 2', 'Môn 3'];
  }, [selectedGroup]);

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
          if (selectedMajorGroup !== 'All') {
            const cat = getMajorCategory(major.major_name);
            if (cat !== selectedMajorGroup) return;
          }

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
  }, [userScore, selectedGroup, safetyMargin, suggestedLevel, selectedMajorGroup]);

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

  const getLatestG10Score = (school) => {
    if (!school.scores || school.scores.length === 0) return null;
    const sorted = [...school.scores].sort((a,b) => b.year - a.year);
    return sorted.find(s => s.nv1 !== null && s.nv1_avg !== null) || sorted[0];
  };

  const g10SuggestedResults = useMemo(() => {
    const targetAvg = parseFloat(userAvgScore) || 0.0;
    const results = [];

    rawDataLop10.forEach(school => {
      if (school.province !== selectedProvince) return;

      const latestScore = getLatestG10Score(school);
      if (!latestScore || latestScore.nv1_avg === null) return;

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

    return results.sort((a, b) => b.latest.nv1_avg - a.latest.nv1_avg);
  }, [selectedProvince, userAvgScore, g10SafetyMargin]);

  const g10SearchResults = useMemo(() => {
    const query = g10SearchQuery.toLowerCase().trim();
    
    return rawDataLop10.filter(school => {
      if (g10SelectedProvince !== 'All' && school.province !== g10SelectedProvince) return false;
      if (!query) return true;

      const matchName = school.name.toLowerCase().includes(query);
      const matchCode = school.code.toLowerCase().includes(query);
      const matchArea = school.area && school.area.toLowerCase().includes(query);
      return matchName || matchCode || matchArea;
    });
  }, [g10SearchQuery, g10SelectedProvince]);

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

  // =========================================================================
  // COMPUTED PROPERTIES - GPA & GRADUATION CALCULATOR
  // =========================================================================
  // Graduation calculator logic (Official MOET Formula)
  const graduationResult = useMemo(() => {
    const math = parseFloat(gradScores.math) || 0.0;
    const lit = parseFloat(gradScores.literature) || 0.0;
    const e1 = parseFloat(gradScores.elective1) || 0.0;
    const e2 = parseFloat(gradScores.elective2) || 0.0;
    const gpa = parseFloat(gradScores.gpa12) || 0.0;
    const priority = parseFloat(gradScores.priority) || 0.0;
    const bonus = parseFloat(gradScores.bonus) || 0.0;

    // Check for "diểm liệt" (any score <= 1.0 is failed)
    const rawScores = [math, lit, e1, e2];
    const isLieth = rawScores.some(s => s <= 1.0);
    const failedSubjects = [];
    if (math <= 1.0) failedSubjects.push('Toán');
    if (lit <= 1.0) failedSubjects.push('Ngữ văn');
    if (e1 <= 1.0) failedSubjects.push('Môn tự chọn 1');
    if (e2 <= 1.0) failedSubjects.push('Môn tự chọn 2');

    // Formula
    const examAvg = (math + lit + e1 + e2) / 4;
    const score = ((examAvg * 7) + (gpa * 3)) / 10 + priority + bonus;

    let passed = score >= 5.0 && !isLieth;
    
    return {
      score: score.toFixed(2),
      passed,
      isLieth,
      failedSubjects
    };
  }, [gradScores]);

  // Quick Converter
  const gpaConvertResult = useMemo(() => {
    const score = parseFloat(gpa10Input) || 0.0;
    if (score < 0 || score > 10.0) return null;

    let res = LETTER_GRADES[LETTER_GRADES.length - 1]; 
    for (const item of LETTER_GRADES) {
      if (score >= 9.0) {
        res = LETTER_GRADES.find(g => g.letter === 'A+') || LETTER_GRADES[0];
        break;
      } else if (score >= 8.5) {
        res = LETTER_GRADES.find(g => g.letter === 'A') || LETTER_GRADES[1];
        break;
      } else if (score >= 8.0) {
        res = LETTER_GRADES.find(g => g.letter === 'B+') || LETTER_GRADES[2];
        break;
      } else if (score >= 7.0) {
        res = LETTER_GRADES.find(g => g.letter === 'B') || LETTER_GRADES[3];
        break;
      } else if (score >= 6.5) {
        res = LETTER_GRADES.find(g => g.letter === 'C+') || LETTER_GRADES[4];
        break;
      } else if (score >= 5.5) {
        res = LETTER_GRADES.find(g => g.letter === 'C') || LETTER_GRADES[5];
        break;
      } else if (score >= 5.0) {
        res = LETTER_GRADES.find(g => g.letter === 'D+') || LETTER_GRADES[6];
        break;
      } else if (score >= 4.0) {
        res = LETTER_GRADES.find(g => g.letter === 'D') || LETTER_GRADES[7];
        break;
      } else {
        res = LETTER_GRADES.find(g => g.letter === 'F') || LETTER_GRADES[8];
        break;
      }
    }

    let advice = 'Cần cố gắng nhiều hơn để cải thiện kết quả học tập.';
    if (res.letter.startsWith('A')) {
      advice = 'Kết quả học tập xuất sắc! Đủ tiêu chuẩn xét học bổng Khuyến khích học tập (KKHT) loại Xuất sắc/Giỏi.';
    } else if (res.letter === 'B+') {
      advice = 'Kết quả tốt. Đủ tiêu chuẩn xét học bổng KKHT hoặc xét tốt nghiệp loại Giỏi/Khá.';
    } else if (res.letter === 'B') {
      advice = 'Kết quả Khá. Đảm bảo an toàn tốt nghiệp loại Khá. Tập trung nâng điểm các môn chính.';
    } else if (res.letter.startsWith('C')) {
      advice = 'Kết quả ở mức trung bình. Hãy tập trung cải thiện để tránh rơi xuống nhóm cảnh báo học vụ.';
    } else if (res.letter === 'F') {
      advice = 'Không đạt môn. Thí sinh bắt buộc phải đăng ký học lại để trả nợ môn học này.';
    }

    return { ...res, advice };
  }, [gpa10Input]);

  // GPA Calculator results
  const gpaCalculatorResults = useMemo(() => {
    let totalCredits = 0;
    let totalCreditsPassed = 0;
    let sumGpa4 = 0;
    let sumGpa10 = 0;

    courses.forEach(c => {
      const gradeInfo = LETTER_GRADES.find(g => g.letter === c.grade);
      if (gradeInfo) {
        totalCredits += c.credits;
        if (c.grade !== 'F') {
          totalCreditsPassed += c.credits;
        }
        sumGpa4 += gradeInfo.gpa4 * c.credits;
        sumGpa10 += gradeInfo.gpa10 * c.credits;
      }
    });

    const gpa4 = totalCredits > 0 ? (sumGpa4 / totalCredits) : 0;
    const gpa10 = totalCredits > 0 ? (sumGpa10 / totalCredits) : 0;

    let standing = 'Kém';
    let standingColor = 'text-rose-500';
    if (gpa4 >= 3.6) {
      standing = 'Xuất sắc';
      standingColor = 'text-purple-400';
    } else if (gpa4 >= 3.2) {
      standing = 'Giỏi';
      standingColor = 'text-indigo-400';
    } else if (gpa4 >= 2.5) {
      standing = 'Khá';
      standingColor = 'text-emerald-400';
    } else if (gpa4 >= 2.0) {
      standing = 'Trung bình';
      standingColor = 'text-yellow-400';
    } else if (gpa4 >= 1.0) {
      standing = 'Yếu';
      standingColor = 'text-orange-400';
    }

    return {
      gpa4: gpa4.toFixed(2),
      gpa10: gpa10.toFixed(2),
      totalCredits,
      totalCreditsPassed,
      standing,
      standingColor
    };
  }, [courses]);

  // Handle adding course
  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    const newCourse = {
      id: Date.now(),
      name: newCourseName.trim(),
      credits: parseInt(newCourseCredits),
      grade: newCourseGrade
    };
    setCourses([...courses, newCourse]);
    setNewCourseName('');
  };

  // Handle deleting course
  const handleDeleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
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
              <p className="brand-subtitle font-medium">Hệ thống Tra cứu Điểm chuẩn & Tiện ích Học tập</p>
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
          ) : mainMode === 'grade10' ? (
            <div className="stats-bar">
              <div className="stat-item">
                Trường THPT: <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{g10Stats.totalSchools}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                Tỉnh/Thành phố: <span style={{ fontWeight: 'bold', color: '#10b981' }}>{g10Stats.totalProvinces}</span>
              </div>
            </div>
          ) : (
            <div className="stats-bar">
              <div className="stat-item">
                Môn học đang tính: <span style={{ fontWeight: 'bold', color: '#a5b4fc' }}>{courses.length}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                Số tín chỉ: <span style={{ fontWeight: 'bold', color: '#10b981' }}>{gpaCalculatorResults.totalCredits}</span>
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
          <button 
            className={`mode-btn ${mainMode === 'gpa' ? 'active' : ''}`}
            onClick={() => {
              setMainMode('gpa');
            }}
          >
            <Calculator style={{ width: '1.1rem', height: '1.1rem' }} />
            Công cụ Sinh viên & Học sinh
          </button>
        </div>

        {/* =========================================================================
            HERO SECTION - DYNAMIC BY MODE
            ========================================================================= */}
        {mainMode !== 'gpa' && (
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
        )}

        {/* =========================================================================
            MODE 1: UNIVERSITY & COLLEGE WORKSPACE
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
                  
                  {/* Select Subject Group first */}
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

                  {/* Toggle Input Mode */}
                  <div className="config-form-group">
                    <label className="config-label">Cách thức nhập điểm:</label>
                    <div className="config-grid-2" style={{ gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setScoreInputMode('total')}
                        className={scoreInputMode === 'total' ? 'mini-btn active' : 'mini-btn secondary'}
                        style={{ padding: '6px', fontSize: '0.75rem' }}
                      >
                        Nhập tổng điểm
                      </button>
                      <button
                        type="button"
                        onClick={() => setScoreInputMode('detail')}
                        className={scoreInputMode === 'detail' ? 'mini-btn active' : 'mini-btn secondary'}
                        style={{ padding: '6px', fontSize: '0.75rem' }}
                      >
                        Điểm thi từng môn
                      </button>
                    </div>
                  </div>

                  {/* Score Input Fields based on mode */}
                  {scoreInputMode === 'total' ? (
                    <div className="config-form-group">
                      <label className="config-label">Tổng điểm thi (Scale 30):</label>
                      <div className="config-input-wrapper">
                        <input 
                          type="number" 
                          step="0.05"
                          min="0"
                          max="30"
                          value={userScore}
                          onChange={(e) => setUserScore(e.target.value)}
                          style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', paddingRight: '3.5rem' }}
                          placeholder="24.0"
                        />
                        <span className="config-input-suffix">Điểm</span>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                      {/* Mon 1 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Môn 1: {currentSubjects[0]}</span>
                        <input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="10"
                          value={detailScores.s1}
                          onChange={(e) => setDetailScores({ ...detailScores, s1: e.target.value })}
                          style={{ width: '80px', padding: '6px', textAlign: 'center', fontSize: '0.9rem' }}
                        />
                      </div>
                      {/* Mon 2 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Môn 2: {currentSubjects[1]}</span>
                        <input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="10"
                          value={detailScores.s2}
                          onChange={(e) => setDetailScores({ ...detailScores, s2: e.target.value })}
                          style={{ width: '80px', padding: '6px', textAlign: 'center', fontSize: '0.9rem' }}
                        />
                      </div>
                      {/* Mon 3 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Môn 3: {currentSubjects[2]}</span>
                        <input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="10"
                          value={detailScores.s3}
                          onChange={(e) => setDetailScores({ ...detailScores, s3: e.target.value })}
                          style={{ width: '80px', padding: '6px', textAlign: 'center', fontSize: '0.9rem' }}
                        />
                      </div>
                      {/* Priority */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Điểm cộng / Ưu tiên</span>
                        <input 
                          type="number" 
                          step="0.25"
                          min="0"
                          max="5"
                          value={detailScores.priority}
                          onChange={(e) => setDetailScores({ ...detailScores, priority: e.target.value })}
                          style={{ width: '80px', padding: '6px', textAlign: 'center', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
                        Tổng điểm tính toán: {userScore}đ
                      </div>
                    </div>
                  )}

                  {/* PREFERRED MAJOR GROUP */}
                  <div className="config-form-group">
                    <label className="config-label">Chọn ngành bạn muốn học:</label>
                    <select 
                      value={selectedMajorGroup}
                      onChange={(e) => setSelectedMajorGroup(e.target.value)}
                    >
                      {MAJOR_GROUPS.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
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
                          className={suggestedLevel === lvl ? 'mini-btn active' : 'mini-btn secondary'}
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
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Vui lòng tăng biên độ điểm hoặc điều chỉnh lại cấu hình lọc.</p>
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
            MODE 2: GRADE 10 (THPT) WORKSPACE
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
                <>
                  <div className="search-results-grid">
                    {g10SearchResults.slice(0, 100).map((school) => {
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
                                Điểm chuẩn ({latest.year}): <span style={{ fontWeight: 'bold', color: '#10b981' }}>{latest.nv1}đ</span> ({latest.nv1_avg !== null && latest.nv1_avg !== undefined ? latest.nv1_avg.toFixed(2) + 'đ/môn' : 'chưa có TB'})
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
                  {g10SearchResults.length > 100 && (
                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem', width: '100%' }}>
                      Đang hiển thị 100 trên tổng số {g10SearchResults.length} trường phù hợp. Vui lòng gõ thêm từ khóa để tìm kiếm chính xác hơn.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 3: STUDENT & HIGH SCHOOL UTILITIES (GPA / GRADUATION CALCULATOR)
            ========================================================================= */}
        {mainMode === 'gpa' && (
          <div className="gpa-layout animate-fade-in">
            {/* GPA & Graduation Calculator Sub-Tabs */}
            <div className="gpa-tabs-container">
              <button
                className={`gpa-tab-btn ${activeGpaTab === 'graduation' ? 'active' : ''}`}
                onClick={() => setActiveGpaTab('graduation')}
              >
                <Percent style={{ width: '1rem', height: '1rem' }} />
                Tính Điểm Tốt Nghiệp THPT
              </button>
              <button
                className={`gpa-tab-btn ${activeGpaTab === 'convert' ? 'active' : ''}`}
                onClick={() => setActiveGpaTab('convert')}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                Quy Đổi Điểm Số Hệ 10 (ĐH)
              </button>
              <button
                className={`gpa-tab-btn ${activeGpaTab === 'calculator' ? 'active' : ''}`}
                onClick={() => setActiveGpaTab('calculator')}
              >
                <Calculator style={{ width: '1rem', height: '1rem' }} />
                Bảng Tính GPA Đại Học
              </button>
            </div>

            {/* GPA Sub-tab: HIGH SCHOOL GRADUATION CALCULATOR */}
            {activeGpaTab === 'graduation' && (
              <div className="gpa-convert-grid">
                {/* Inputs Sidebar */}
                <div className="config-sidebar">
                  <div className="config-card glass-panel" style={{ borderLeft: '3px solid var(--primary)' }}>
                    <div className="config-header">
                      <Percent style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                      <h3 style={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Nhập điểm thi THPT QG</h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="config-grid-2" style={{ gap: '0.75rem' }}>
                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Môn Toán:</label>
                          <input 
                            type="number" step="0.1" min="0" max="10" 
                            value={gradScores.math}
                            onChange={(e) => setGradScores({ ...gradScores, math: e.target.value })}
                            style={{ textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Ngữ văn:</label>
                          <input 
                            type="number" step="0.1" min="0" max="10" 
                            value={gradScores.literature}
                            onChange={(e) => setGradScores({ ...gradScores, literature: e.target.value })}
                            style={{ textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                      </div>

                      <div className="config-grid-2" style={{ gap: '0.75rem' }}>
                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Tự chọn 1 (Lý/Sử...):</label>
                          <input 
                            type="number" step="0.1" min="0" max="10" 
                            value={gradScores.elective1}
                            onChange={(e) => setGradScores({ ...gradScores, elective1: e.target.value })}
                            style={{ textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Tự chọn 2 (Hóa/Địa...):</label>
                          <input 
                            type="number" step="0.1" min="0" max="10" 
                            value={gradScores.elective2}
                            onChange={(e) => setGradScores({ ...gradScores, elective2: e.target.value })}
                            style={{ textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                      </div>

                      <div className="config-form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                        <label className="config-label" style={{ fontSize: '0.75rem' }}>TB cả năm lớp 12 (GPA):</label>
                        <input 
                          type="number" step="0.01" min="0" max="10" 
                          value={gradScores.gpa12}
                          onChange={(e) => setGradScores({ ...gradScores, gpa12: e.target.value })}
                          style={{ textAlign: 'center', padding: '8px', fontSize: '1.05rem', fontWeight: 'bold' }}
                        />
                      </div>

                      <div className="config-grid-2" style={{ gap: '0.75rem' }}>
                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Điểm ưu tiên:</label>
                          <input 
                            type="number" step="0.25" min="0" max="5" 
                            value={gradScores.priority}
                            onChange={(e) => setGradScores({ ...gradScores, priority: e.target.value })}
                            style={{ textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Khuyến khích:</label>
                          <input 
                            type="number" step="0.5" min="0" max="5" 
                            value={gradScores.bonus}
                            onChange={(e) => setGradScores({ ...gradScores, bonus: e.target.value })}
                            style={{ textAlign: 'center', padding: '6px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Calculation Results Output Panel */}
                <div className="results-panel">
                  <div className="gpa-result-card glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award style={{ color: 'var(--primary)' }} />
                      Ước Tính Kết Quả Tốt Nghiệp THPT QG
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem' }}>
                      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Điểm xét tốt nghiệp</span>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: graduationResult.passed ? '#10b981' : '#ef4444', marginTop: '0.25rem' }}>
                          {graduationResult.score}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trạng thái tốt nghiệp</span>
                        <div style={{ marginTop: '0.5rem' }}>
                          {graduationResult.passed ? (
                            <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', padding: '6px 16px', fontSize: '1rem', fontWeight: 'bold' }}>
                              ĐỖ TỐT NGHIỆP
                            </span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '6px 16px', fontSize: '1rem', fontWeight: 'bold' }}>
                              TRƯỢT TỐT NGHIỆP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Safety notices and details */}
                    {graduationResult.isLieth && (
                      <div className="tip-box" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                        <Info className="tip-icon" style={{ color: '#ef4444' }} />
                        <div className="tip-text" style={{ color: '#fca5a5', fontSize: '0.85rem' }}>
                          <strong>Chú ý: Bị điểm liệt tốt nghiệp!</strong>
                          <br />
                          Bạn bị điểm thi &le; 1.0đ ở môn: <span style={{ fontWeight: 'bold' }}>{graduationResult.failedSubjects.join(', ')}</span>. Theo quy định của Bộ GD&ĐT, dù điểm xét tốt nghiệp tổng trên 5.0 nhưng có môn thi bị điểm liệt thì vẫn trượt tốt nghiệp THPT.
                        </div>
                      </div>
                    )}

                    {!graduationResult.isLieth && graduationResult.passed && (
                      <div className="tip-box" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
                        <CheckCircle className="tip-icon" style={{ color: '#10b981' }} />
                        <div className="tip-text" style={{ color: '#a7f3d0', fontSize: '0.85rem' }}>
                          <strong>Thông tin an toàn:</strong> Điểm xét tốt nghiệp của bạn đạt yêu cầu (&ge; 5.0đ) và không có môn thi nào bị điểm liệt (&le; 1.0đ). Bạn đủ điều kiện đỗ tốt nghiệp THPT Quốc gia!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Formula and Info */}
                  <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Công thức tính điểm xét tốt nghiệp chính thức của Bộ GD&ĐT:</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      <span style={{ display: 'block', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '0.5rem', textAlign: 'center' }}>
                        Điểm xét TN = [((Tổng điểm 4 bài thi / 4) x 7) + (GPA Lớp 12 x 3)] / 10 + Điểm ưu tiên + Điểm khuyến khích
                      </span>
                      * <strong>Lưu ý chương trình GDPT 2018:</strong> Thí sinh thi 4 bài thi bao gồm 2 môn bắt buộc (Toán, Văn) và 2 môn tự chọn (chọn trong các môn Ngoại ngữ, Vật lý, Hóa học, Sinh học, Lịch sử, Địa lý, GD Kinh tế và Pháp luật, Tin học, Công nghệ).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GPA Sub-tab: QUICK CONVERTER */}
            {activeGpaTab === 'convert' && (
              <div className="gpa-convert-grid">
                <div className="config-sidebar">
                  <div className="config-card glass-panel" style={{ borderLeft: '3px solid var(--primary)' }}>
                    <div className="config-header">
                      <RefreshCw style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)' }} />
                      <h3 style={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Nhập điểm quy đổi</h3>
                    </div>
                    <div className="config-form-group">
                      <label className="config-label">Điểm hệ 10 của môn học / học kỳ:</label>
                      <div className="config-input-wrapper">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={gpa10Input}
                          onChange={(e) => setGpa10Input(e.target.value)}
                          style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}
                          placeholder="8.0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="results-panel">
                  {gpaConvertResult ? (
                    <div className="gpa-result-card glass-panel" style={{ padding: '2rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award style={{ color: 'var(--primary)' }} />
                        Kết quả quy đổi theo Thông tư 08/2021/TT-BGDĐT
                      </h3>
                      
                      <div className="gpa-metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="gpa-metric-box glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thang điểm chữ</span>
                          <div className={`metric-value ${gpaConvertResult.color}`} style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem' }}>
                            {gpaConvertResult.letter}
                          </div>
                        </div>

                        <div className="gpa-metric-box glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thang điểm 4</span>
                          <div className="metric-value text-white" style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem', color: '#a5b4fc' }}>
                            {gpaConvertResult.gpa4.toFixed(1)}
                          </div>
                        </div>

                        <div className="gpa-metric-box glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Xếp loại học tập</span>
                          <div className="metric-value text-white" style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.75rem' }}>
                            {gpaConvertResult.desc}
                          </div>
                        </div>
                      </div>

                      <div className="tip-box" style={{ borderLeftColor: 'var(--primary)' }}>
                        <Info className="tip-icon" style={{ color: 'var(--primary)' }} />
                        <div className="tip-text" style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                          <strong style={{ display: 'block', marginBottom: '4px', color: '#a5b4fc' }}>Lời khuyên / Đánh giá học tập:</strong>
                          {gpaConvertResult.advice}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Vui lòng nhập điểm hợp lệ từ 0 đến 10.
                    </div>
                  )}

                  {/* Standard Table mapping Circular 08 */}
                  <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>Bảng quy đổi tiêu chuẩn của Bộ Giáo dục & Đào tạo</h4>
                    <table className="method-table" style={{ fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>Điểm hệ 10</th>
                          <th style={{ textAlign: 'center' }}>Điểm chữ</th>
                          <th style={{ textAlign: 'center' }}>Điểm hệ 4</th>
                          <th>Xếp loại học lực</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                          <td>9.0 - 10.0</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#c084fc' }}>A+</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>4.0</td>
                          <td style={{ fontWeight: '500', color: '#c084fc' }}>Xuất sắc</td>
                        </tr>
                        <tr style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                          <td>8.5 - 8.9</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#818cf8' }}>A</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>3.7</td>
                          <td style={{ fontWeight: '500', color: '#818cf8' }}>Giỏi</td>
                        </tr>
                        <tr style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                          <td>8.0 - 8.4</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#60a5fa' }}>B+</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>3.5</td>
                          <td style={{ fontWeight: '500', color: '#60a5fa' }}>Khá giỏi</td>
                        </tr>
                        <tr>
                          <td>7.0 - 7.9</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#34d399' }}>B</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>3.0</td>
                          <td style={{ color: '#34d399' }}>Khá</td>
                        </tr>
                        <tr>
                          <td>6.5 - 6.9</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#4ade80' }}>C+</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>2.5</td>
                          <td>Trung bình khá</td>
                        </tr>
                        <tr>
                          <td>5.5 - 6.4</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#facc15' }}>C</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>2.0</td>
                          <td>Trung bình</td>
                        </tr>
                        <tr>
                          <td>5.0 - 5.4</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#f97316' }}>D+</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>1.5</td>
                          <td>Trung bình yếu</td>
                        </tr>
                        <tr>
                          <td>4.0 - 4.9</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#f43f5e' }}>D</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>1.0</td>
                          <td style={{ color: '#f43f5e' }}>Yếu</td>
                        </tr>
                        <tr style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                          <td>&lt; 4.0</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#f87171' }}>F</td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>0.0</td>
                          <td style={{ color: '#f87171' }}>Kém (Trượt môn)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* GPA Sub-tab: DYNAMIC CALCULATOR */}
            {activeGpaTab === 'calculator' && (
              <div className="gpa-calculator-layout animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                
                {/* Dynamic Courses Input Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plus style={{ color: '#10b981', width: '1.2rem', height: '1.2rem' }} />
                      Thêm môn học mới
                    </h3>
                    
                    <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="config-form-group">
                        <label className="config-label" style={{ fontSize: '0.75rem' }}>Tên môn học:</label>
                        <input
                          type="text"
                          value={newCourseName}
                          onChange={(e) => setNewCourseName(e.target.value)}
                          placeholder="Ví dụ: Triết học Mác - Lênin"
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="config-grid-2" style={{ gap: '1rem' }}>
                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Số tín chỉ:</label>
                          <select
                            value={newCourseCredits}
                            onChange={(e) => setNewCourseCredits(parseInt(e.target.value))}
                          >
                            <option value="1">1 tín chỉ</option>
                            <option value="2">2 tín chỉ</option>
                            <option value="3">3 tín chỉ</option>
                            <option value="4">4 tín chỉ</option>
                            <option value="5">5 tín chỉ</option>
                          </select>
                        </div>

                        <div className="config-form-group">
                          <label className="config-label" style={{ fontSize: '0.75rem' }}>Điểm chữ đạt được:</label>
                          <select
                            value={newCourseGrade}
                            onChange={(e) => setNewCourseGrade(e.target.value)}
                          >
                            {LETTER_GRADES.map(g => (
                              <option key={g.letter} value={g.letter}>{g.letter} ({g.desc})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button type="submit" style={{ marginTop: '0.5rem', background: '#10b981' }}>
                        <Plus style={{ width: '1rem', height: '1rem' }} /> Thêm vào bảng điểm
                      </button>
                    </form>
                  </div>

                  {/* Summary Dashboard widget */}
                  <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid #10b981' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp style={{ color: '#10b981', width: '1.2rem', height: '1.2rem' }} />
                      Bảng điểm tổng hợp học kỳ / tích lũy
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GPA Hệ 4</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '0.15rem' }}>
                          {gpaCalculatorResults.gpa4}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GPA Hệ 10</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#a5b4fc', marginTop: '0.15rem' }}>
                          {gpaCalculatorResults.gpa10}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Số tín chỉ đạt</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', marginTop: '0.5rem' }}>
                          {gpaCalculatorResults.totalCreditsPassed} / {gpaCalculatorResults.totalCredits}
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Xếp loại học lực</span>
                        <div className={gpaCalculatorResults.standingColor} style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.6rem' }}>
                          {gpaCalculatorResults.standing}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Courses Listing Table */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '350px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Danh sách các môn học</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Môn học: <span style={{ color: 'white', fontWeight: 'bold' }}>{courses.length}</span>
                    </span>
                  </div>

                  {courses.length === 0 ? (
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                      <BookOpen style={{ width: '2.5rem', height: '2.5rem', color: '#334155', marginBottom: '0.5rem' }} />
                      Chưa có môn học nào trong danh sách.
                    </div>
                  ) : (
                    <div className="method-table-wrapper" style={{ flex: '1', overflowY: 'auto' }}>
                      <table className="method-table">
                        <thead>
                          <tr>
                            <th>Tên môn học</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>Tín chỉ</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>Điểm chữ</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>Hệ 4</th>
                            <th style={{ width: '15%', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses.map(c => {
                            const grInfo = LETTER_GRADES.find(g => g.letter === c.grade);
                            return (
                              <tr key={c.id}>
                                <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{c.name}</td>
                                <td style={{ textAlign: 'center', color: '#94a3b8' }}>{c.credits}</td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: grInfo ? grInfo.color.replace('text-', '#').replace('-400', '') : '#fff' }}>
                                  {c.grade}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: '600' }}>
                                  {grInfo ? grInfo.gpa4.toFixed(1) : '0.0'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleDeleteCourse(c.id)}
                                    style={{ background: 'transparent', color: '#ef4444', padding: '4px 8px', border: 'none', boxShadow: 'none' }}
                                    title="Xóa môn"
                                  >
                                    <Trash2 style={{ width: '0.9rem', height: '0.9rem' }} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
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
