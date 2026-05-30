# HƯỚNG DẪN TRIỂN KHAI VÀ SỬ DỤNG AI ENGLISH VISION

Tài liệu này cung cấp chi tiết về cách quản lý các bản deploy (Render & Vercel), hướng dẫn sử dụng các chức năng tiện ích, và cách xử lý các trường hợp lỗi thường gặp trong quá trình vận hành dự án.

---

## PHẦN 1: TỔNG QUAN HỆ THỐNG VÀ DEPLOY

Hệ thống được chia làm 2 phần riêng biệt nhưng kết nối chặt chẽ với nhau qua API:

### 1. Backend (Triển khai trên Render)
- **Nền tảng:** Render.com (Gói Free).
- **Đường dẫn (Ví dụ):** `https://snapenglish-api.onrender.com`
- **Cách quản lý (Tự động):** 
  - Hệ thống sử dụng file `render.yaml` tại thư mục gốc. Bạn chỉ cần sửa code ở nhánh `main` và push lên GitHub, Render sẽ tự động cập nhật code mới (CI/CD).
  - Biến môi trường (`.env`) đã được thiết lập qua giao diện Blueprint của Render để bảo mật API Key.
- **Đặc điểm quan trọng (Cold Start):** Vì dùng gói Free của Render, nếu không có ai truy cập trong 15 phút, server sẽ vào trạng thái "ngủ". Khi bạn (hoặc người dùng khác) truy cập lại web lần đầu tiên, server sẽ mất khoảng **30 - 50 giây** để khởi động lại. Lúc này, tính năng quét ảnh lần đầu sẽ xoay loading khá lâu. Hãy kiên nhẫn! Từ bức ảnh thứ 2 trở đi, tốc độ sẽ cực nhanh (2-5 giây).

### 2. Frontend (Triển khai trên Vercel)
- **Nền tảng:** Vercel (Gói Hobby/Free).
- **Cách quản lý:** Vercel tự động build lại mỗi khi có code mới được push lên nhánh `main`.
- **Cấu hình:** Sử dụng framework Vite và thư mục gốc là `client`. 
- **Biến môi trường:** Chỉ có duy nhất 1 biến là `VITE_API_URL` trỏ tới đường link của Backend Render.

---

## PHẦN 2: HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG CHÍNH

### 1. Nhận diện Đồ vật bằng AI (Camera / Tải ảnh)
- **Sử dụng Camera:** 
  - Chức năng tự động lấy Camera sau (nếu dùng trên điện thoại).
  - Cần cấp quyền truy cập máy ảnh trên trình duyệt.
- **Tải ảnh lên (Upload):**
  - Kéo thả hoặc click để tải ảnh lên (kích thước tối đa 10MB).
  - Tích hợp chuẩn hoá ảnh (resize/nén nhẹ tự động) trước khi gửi cho AI để tiết kiệm băng thông.

### 2. Dữ liệu Từ vựng & Phát âm (Text-to-Speech)
- Khi AI nhận diện xong, thẻ từ vựng (Vocabulary Card) sẽ hiển thị Tiếng Anh, phiên âm (IPA), loại từ, nghĩa tiếng Việt, và câu ví dụ.
- Nút **"Nghe"** (biểu tượng cái loa): Hệ thống sẽ ưu tiên dùng bộ đọc giọng tự nhiên của Google Translate. Nếu bị chặn do mạng hoặc CORS, nó sẽ tự động lùi về (fallback) dùng giọng đọc mặc định của trình duyệt web.

### 3. Hệ thống Flashcard (Ghi nhớ và Ôn tập)
- Bạn có thể bấm **"Lưu vào bộ thẻ"** để lưu từ đang xem vào các danh mục (Vd: Electronics, Furniture,...).
- Vào trang **Flashcards** để xem lại toàn bộ từ vựng theo chủ đề.
- **Study Mode (Chế độ học):** Bấm "Học thẻ này" để lật mặt trước/mặt sau thẻ giúp ghi nhớ nhanh chóng.

### 4. Cơ chế Offline / Online thông minh
- **Khi có mạng:** 
  - Ảnh được đưa lên Cloud AI (Gemini 2.5) để nhận diện đồ vật và cung cấp từ vựng chuẩn xác.
  - Dữ liệu Flashcard được lưu thẳng lên cơ sở dữ liệu MongoDB Atlas.
- **Khi rớt mạng (Offline Mode):**
  - Giao diện hiện thanh thông báo đỏ (Offline).
  - Tính năng nhận diện sẽ chuyển sang sử dụng mô hình AI tích hợp sẵn trên trình duyệt (TensorFlow COCO-SSD). Mô hình này sẽ quét ảnh trực tiếp trên máy của bạn mà không cần mạng.
  - Từ vựng sẽ được lấy từ file `vocabulary.json` có sẵn trong máy.
  - Nếu bạn bấm Lưu thẻ, thẻ sẽ được lưu tạm thời vào thẻ nhớ trình duyệt (`localStorage`). Khi có mạng trở lại, ứng dụng sẽ tự động đồng bộ (Sync) dữ liệu này lên MongoDB.

---

## PHẦN 3: XỬ LÝ LỖI & SỰ CỐ (TROUBLESHOOTING)

Trong quá trình sử dụng, nếu gặp lỗi, bạn hãy tham khảo bảng cách giải quyết sau:

| Tên Lỗi / Biểu hiện | Nguyên nhân & Giải thích | Cách khắc phục |
| :--- | :--- | :--- |
| **Bấm quét ảnh mà xoay mãi không ra kết quả (lần đầu tiên vào web)** | Server Render đang bị ngủ (Cold Start). Render cần 50 giây để khởi động lại máy chủ. | Hãy kiên nhẫn đợi loading. Ở bức ảnh tiếp theo sẽ nhanh bình thường. |
| **"Không có quyền truy cập camera"** | Trình duyệt hoặc hệ điều hành đã chặn cấp quyền máy ảnh cho trang web. | Bấm vào biểu tượng ổ khóa trên thanh địa chỉ của trình duyệt -> Cho phép Máy ảnh (Camera). Hoặc bạn có thể chọn Upload (Tải ảnh) để thay thế. |
| **"Ảnh quá lớn. Kích thước tối đa là 10MB"** | AI API giới hạn dung lượng 1 lần xử lý để đảm bảo tốc độ, file của bạn đang nặng hơn 10MB. | Thử chụp một tấm ảnh khác, hoặc cắt gọn (crop) lại ảnh, hoặc chọn ảnh từ máy không bị nén quá mức. |
| **"Không tìm thấy đồ vật. Hãy thử ảnh rõ hơn"** | Ảnh quá mờ, thiếu sáng, hoặc đồ vật trong ảnh quá lạ, mô hình AI không quét được viền đồ vật. | Hãy bật đèn, đưa camera đến gần đồ vật hơn và đổi góc độ chụp. |
| **Thẻ từ vựng báo "Không có dữ liệu từ vựng"** | Đồ vật quét được thành công nhưng không có bản dịch trong hệ thống (thường xảy ra ở chế độ Offline bị giới hạn dữ liệu). | Kết nối Internet trở lại để Cloud AI phân tích nghĩa và tạo từ mới hoàn toàn. |
| **Lưu flashcard báo lỗi "Đã lưu cục bộ..."** | Chức năng lưu lên MongoDB bị lỗi (do server sập hoặc đứt cáp, mất mạng). | Không cần làm gì cả. Chữ "cục bộ" nghĩa là thẻ đã lưu trong máy tính/điện thoại của bạn. Chờ khi mạng ổn định, mở lại web, nó sẽ tự đẩy lên server an toàn. |
| **"Không thể nhận diện. Vui lòng thử lại sau"** | Có thể do Gemini bị quá tải. Đáng ra hệ thống sẽ chuyển sang OpenRouter/Groq, nhưng nếu toàn bộ dự phòng đều sập thì sẽ báo lỗi này. | Đợi khoảng 1-2 phút và thử lại (API thường sẽ hết bị quá tải sau vài phút). |

---

*Tài liệu này được tạo vào thời điểm dự án được đưa vào hoạt động chính thức. Nếu có chỉnh sửa logic API hoặc cách gọi mô hình AI mới, vui lòng cập nhật tài liệu tương ứng.*
