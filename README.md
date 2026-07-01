# AdmissionPro 2026 - Tra cứu Điểm chuẩn Đại học & Cao đẳng

**AdmissionPro 2026** là một ứng dụng Web MVP Single Page Application (SPA) cao cấp giúp thí sinh và phụ huynh dễ dàng tra cứu điểm chuẩn, điểm sàn trúng tuyển của các trường Đại học, Cao đẳng trên cả nước cho kỳ tuyển sinh năm 2025/2026. 

Đặc biệt, ứng dụng tích hợp **Bộ gợi ý đỗ nguyện vọng thông minh** dựa trên điểm số thực tế của thí sinh và khối xét tuyển.

👉 **Bản chạy thử trực tuyến:** Chạy trực tiếp qua GitHub Pages sau khi triển khai.

---

## ✨ Tính Năng Nổi Bật

1.  **Gợi ý Nguyện vọng Thông minh (Smart Suggestion):**
    *   Thí sinh chỉ cần nhập điểm thi tốt nghiệp THPT hoặc điểm học bạ (Thang 30) và chọn khối thi (A00, A01, B00, C00, D01...).
    *   Hệ thống tự động đề xuất tất cả các ngành học có điểm tuyển sinh năm trước phù hợp.
    *   Phân loại trực quan mức độ an toàn: **Tuyệt vời** (Đỗ an toàn), **An toàn cao** (Điểm thi vượt trội), và **Thử thách** (Điểm chuẩn năm trước cao hơn một chút từ 0.5 - 2.0đ để xếp làm nguyện vọng mơ ước).
2.  **Tra cứu Toàn diện (Universal Search & Filter):**
    *   Tìm kiếm tức thì theo tên trường, mã trường (BKA, FTU, NEU...), hoặc tên ngành.
    *   Bộ lọc đa dạng: Theo Phương thức xét tuyển (Điểm thi THPT, Học bạ, ĐGNL, ĐGTD), Hệ đào tạo (Đại học, Cao đẳng), Vùng miền (Bắc, Trung, Nam) và Năm xét tuyển.
3.  **Xem chi tiết điểm của từng trường (Interactive Detail Modal):**
    *   Nhấp vào một trường bất kỳ để xem toàn bộ danh sách ngành học, tổ hợp môn, và mức điểm tương ứng.
    *   Liên kết trực tiếp tới trang tin tuyển sinh chính thức để đối chiếu dữ liệu.
4.  **Tốc độ phản hồi tức thì (Zero Latency):**
    *   Toàn bộ dữ liệu điểm chuẩn đã được nhúng cục bộ dưới dạng tệp JSON, cho phép tìm kiếm và gợi ý diễn ra trong **0ms** và hoạt động hoàn toàn offline.
5.  **Giao diện tối sang trọng (Premium Dark UI):**
    *   Thiết kế theo phong cách tối sang trọng với hiệu ứng kính mờ (Glassmorphism), viền phát sáng (Glow borders) và các chuyển động vi mô (Micro-animations) mượt mà.

---

## 🛠️ Công Nghệ Sử Dụng

*   **Frontend:** React (Vite), JavaScript, Lucide React (Icons).
*   **Styling:** Vanilla CSS (Cấu hình Custom Design Token bằng biến CSS HSL).
*   **Data Scraper:** Script Python (`BeautifulSoup4` + `requests`) chạy đa luồng truy xuất dữ liệu từ nguồn uy tín Tuyensinh247.

---

## 🚀 Hướng Dẫn Chạy Dưới Local

### Yêu cầu hệ thống
*   Đã cài đặt **Node.js** (Phiên bản 18 trở lên) và **npm**.
*   (Tùy chọn) **Python 3** nếu muốn chạy lại bộ cào dữ liệu.

### Các bước cài đặt và khởi chạy:
1.  Di chuyển vào thư mục dự án:
    ```bash
    cd frontend
    ```
2.  Cài đặt các gói thư viện phụ thuộc:
    ```bash
    npm install
    ```
3.  Khởi chạy máy chủ phát triển (Development Server):
    ```bash
    npm run dev
    ```
4.  Mở trình duyệt và truy cập: **`http://localhost:5173`**

---

## 🕷️ Bộ Cào Dữ Liệu Tuyển Sinh (Python Scraper)

Dữ liệu được thu thập tự động thông qua script Python đa luồng nằm tại thư mục `/scraper`.

*   **Chạy scraper:**
    ```bash
    python scraper/scrape_scores.py
    ```
*   **Cơ chế:** Script sử dụng `ThreadPoolExecutor` chạy song song 15 luồng truy xuất dữ liệu từ các liên kết điểm chuẩn của gần 300 trường trên Tuyensinh247, tự động xử lý trích xuất bảng, chuẩn hóa điểm số và xuất ra tệp `frontend/src/data/diem_chuan.json`.

---

## 📦 Triển khai lên GitHub Pages

Để triển khai dự án này lên GitHub Pages cực kỳ đơn giản với một dòng lệnh duy nhất đã cấu hình sẵn:

```bash
npm run deploy
```
*Lệnh này sẽ tự động biên dịch dự án React và đẩy bản build lên nhánh `gh-pages` trên GitHub của bạn.*
