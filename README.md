<h1 align="center">🏔️ HỆ THỐNG CẢNH BÁO XÓI MÒN ĐẤT TRÊN ĐỊA HÌNH DỐC</h1>

<div align="center">

<p align="center">
<img src="https://img.shields.io/badge/Arduino-Uno-00979D?style=for-the-badge&logo=arduino&logoColor=white"/>
<img src="https://img.shields.io/badge/Web%20Serial%20API-Chrome%2FEdge-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"/>
<img src="https://img.shields.io/badge/Chart.js-Real--time-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-http--server-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
</p>

</div>

<p align="left">
  Hệ thống giám sát và cảnh báo nguy cơ xói mòn, sạt lở đất trên địa hình dốc theo thời gian thực. Dữ liệu từ các cảm biến độ ẩm đất, lượng mưa và rung lắc địa hình được thu thập qua <strong>Arduino Uno</strong>, truyền về máy tính qua cổng Serial USB, rồi hiển thị trực quan trên <strong>giao diện Web</strong> với biểu đồ, mô phỏng đồi dốc và hệ thống cảnh báo 4 cấp độ.
</p>

---

## 🌟 Sơ Đồ Kết Nối Mạch

> Kết nối các cảm biến vào Arduino Uno như bảng bên dưới:

| Linh kiện | Chân Arduino |
|---|---|
| Cảm biến độ ẩm đất (Soil Moisture) | `A0` |
| Cảm biến mưa (Rain Sensor) | `A1` |
| Cảm biến rung lắc / nghiêng (Tilt Sensor) | `D2` (INPUT_PULLUP) |
| Còi báo động (Buzzer) | `D8` |
| Nguồn | `5V & GND` |

---

## 🌐 GIAO DIỆN WEB GIÁM SÁT

Giao diện dashboard thời gian thực với các thành phần:

- 🟢 **Banner cảnh báo 4 cấp** – Thay đổi màu sắc và phát còi tương ứng
- 💧 **Card độ ẩm đất** – Đồng hồ gauge SVG tròn hiển thị phần trăm
- 🌧️ **Card lượng mưa** – Icon thời tiết động và thanh tiến trình
- 📳 **Card rung lắc địa hình** – Đếm xung rung lắc trong 5 giây
- 🏔️ **Mô phỏng đồi dốc 2D** – Cây cối nghiêng/đổ, đất chuyển màu, mưa rơi động
- 📈 **Đồ thị thời gian thực** – Chart.js cập nhật mỗi 5 giây
- 📋 **Nhật ký hoạt động** – Bảng log chi tiết, xuất ra file CSV

---

## 🌟 Tính Năng

✅ **Giám sát 3 loại cảm biến** – Độ ẩm đất, lượng mưa, rung lắc địa hình  
✅ **Hệ thống cảnh báo 4 cấp độ** – An toàn / Theo dõi / Xói mòn cao / Sạt lở rất cao  
✅ **Còi buzzer Arduino** + **Còi Web Audio API** kích hoạt tự động theo cấp nguy hiểm  
✅ **Mô phỏng đồi dốc 2D tương tác** – Trực quan hóa tình trạng địa hình theo thời gian thực  
✅ **Đồ thị biến thiên thời gian thực** với Chart.js (cập nhật mỗi 5 giây)  
✅ **Nhật ký hoạt động chi tiết** – Lưu tối đa 500 bản ghi, xuất file CSV  
✅ **Hỗ trợ Dark Mode / Light Mode** – Lưu cài đặt bằng localStorage  
✅ **Kết nối trực tiếp Arduino qua Web Serial API** – Không cần phần mềm trung gian  
✅ **Chỉ cần trình duyệt Chrome/Edge** – Không cần cài Python hay driver đặc biệt  

---

## 📌 Yêu Cầu Hệ Thống

### 🔩 Phần Cứng
- **Arduino Uno** (hoặc tương đương)
- **Cảm biến độ ẩm đất** (Capacitive/Resistive Soil Moisture Sensor)
- **Module cảm biến mưa** (Rain Sensor Module)
- **Cảm biến rung lắc / nghiêng** (Tilt/Vibration Sensor SW-520D hoặc tương đương)
- **Còi buzzer** (Active Buzzer 5V)
- **Dây cắm** và **Board điện**
- **Cáp USB** kết nối Arduino với máy tính

### 🖥️ Phần Mềm
- **Arduino IDE** – Để nạp code vào Arduino Uno ([Tải tại arduino.cc](https://www.arduino.cc/en/software))
- **Node.js** – Để chạy local web server ([Tải tại nodejs.org](https://nodejs.org/))
- **Trình duyệt Google Chrome** hoặc **Microsoft Edge** (bắt buộc, hỗ trợ Web Serial API)

### 📦 Thư viện Node.js cần thiết
```bash
npm install
```
Hoặc cài đặt `http-server` toàn cục:
```bash
npm install -g http-server
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### 1️⃣ Nạp Code Arduino

1. Mở **Arduino IDE**
2. Mở file `sketch_may31a.ino` trong thư mục dự án
3. Kết nối **Arduino Uno** với máy tính bằng cáp USB
4. Chọn đúng **Board** (`Arduino Uno`) và **Port** (`COMx`) trong menu `Tools`
5. Nhấn nút **Upload** (→) để nạp code

> ⚠️ **Lưu ý**: Baudrate mặc định trong code là `9600`. Đảm bảo chọn đúng baudrate khi kết nối trên trang web.

---

### 2️⃣ Kết Nối Phần Cứng

Kết nối linh kiện theo sơ đồ:

```
Soil Moisture Sensor  →  Arduino A0
Rain Sensor           →  Arduino A1
Tilt/Vibration Sensor →  Arduino D2 (GND & Signal)
Buzzer (+)            →  Arduino D8
Buzzer (-)            →  Arduino GND
```

---

### 3️⃣ Khởi Động Giao Diện Web

#### Cách 1: Chạy bằng file `.bat` (Nhanh nhất – dành cho Windows)

Double-click vào file **`Run_Web.bat`** trong thư mục dự án.

File sẽ tự động:
- Khởi động Local Web Server tại cổng `http://localhost:8080`
- Chờ 2 giây để server sẵn sàng
- Mở trình duyệt mặc định tại địa chỉ `http://localhost:8080`

#### Cách 2: Chạy thủ công bằng Terminal

```bash
npm run dev
```
Sau đó mở trình duyệt và truy cập: [http://localhost:8080](http://localhost:8080)

---

### 4️⃣ Kết Nối Arduino với Trang Web

1. Mở trang web tại `http://localhost:8080` trên **Chrome** hoặc **Edge**
2. Chọn **Baudrate** phù hợp (mặc định: `9600 Baud`)
3. Nhấn nút **"Kết nối Arduino"**
4. Một hộp thoại xuất hiện yêu cầu chọn cổng COM → Chọn cổng của Arduino và nhấn **Connect**
5. Dữ liệu cảm biến sẽ bắt đầu hiển thị tự động sau mỗi **5 giây**

---

### 5️⃣ Xuất Dữ Liệu Lịch Sử

Trong mục **"Nhật ký hoạt động chi tiết"**, nhấn nút **"Xuất dữ liệu CSV (Excel)"** để tải về file báo cáo dạng `.csv` tương thích với Microsoft Excel.

Tên file mẫu: `Bao_cao_he_thong_canh_bao_xoi_mon_YYYY-MM-DD.csv`

---

## 📊 Hệ Thống Cảnh Báo 4 Cấp Độ

| Cấp | Tên | Điều kiện kích hoạt | Còi buzzer |
|:---:|---|---|:---:|
| 🟢 **Cấp 1** | AN TOÀN | Tất cả thông số bình thường | ❌ |
| 🟡 **Cấp 2** | CẦN THEO DÕI | Độ ẩm > 50% **hoặc** có mưa nhẹ **hoặc** rung lắc nhẹ (>15) | ❌ |
| 🟠 **Cấp 3** | NGUY CƠ XÓI MÒN CAO | Độ ẩm > 75% **và** mưa lớn (rainVal < 500) | ✅ Kêu chậm |
| 🔴 **Cấp 4** | NGUY CƠ SẠT LỞ RẤT CAO | Độ ẩm > 75% **và** mưa rất lớn (rainVal < 400) **và** rung lắc > 60 | ✅ Hú dồn dập |

---

## 📁 Cấu Trúc Thư Mục

```
sketch_may31a/
│
├── sketch_may31a.ino   # Code Arduino – Đọc cảm biến, phân cấp cảnh báo, gửi JSON
├── index.html          # Giao diện Web dashboard chính
├── app.js              # Logic JavaScript – Web Serial, Chart.js, xuất CSV
├── style.css           # CSS – Dark mode, animations, gauge, terrain visualizer
├── package.json        # Cấu hình Node.js (http-server)
├── Run_Web.bat         # Script khởi động nhanh trên Windows
└── README.md           # Tài liệu hướng dẫn
```

---

## ⚠️ Lưu Ý Quan Trọng

- **Bắt buộc dùng Chrome hoặc Edge** – Web Serial API không hoạt động trên Firefox hay Safari.
- **Phải chạy qua Local Server** (`http://localhost:8080`) – Mở file `index.html` trực tiếp bằng `file://` sẽ không hoạt động do giới hạn bảo mật của trình duyệt.
- **Chỉ một tab/cửa sổ** được kết nối với cổng COM cùng lúc – Đóng Serial Monitor trong Arduino IDE trước khi kết nối trên web.
- **Baudrate phải khớp** – Code Arduino dùng `Serial.begin(9600)`, đảm bảo chọn `9600 Baud` trên web.
- Dữ liệu được **cập nhật mỗi 5 giây** do Arduino đếm rung lắc trong vòng lặp 5 giây.

---

## 🎯 Mục Tiêu Dự Án

- **Phát hiện sớm nguy cơ xói mòn và sạt lở đất** trên địa hình dốc bằng cảm biến giá thành thấp.
- **Trực quan hóa dữ liệu môi trường** theo thời gian thực thông qua giao diện web không cần cài đặt phức tạp.
- **Cảnh báo đa phương tiện** – Còi buzzer vật lý + Còi Web Audio API + Banner cảnh báo màu sắc trực quan.
- **Lưu trữ và phân tích** lịch sử dữ liệu cảm biến để đánh giá xu hướng thay đổi địa hình.
- **Dễ dàng mở rộng** – Có thể tích hợp thêm cảm biến GPS, camera, hoặc kết nối IoT cloud.

🏔️ **Hãy triển khai ngay để bảo vệ cộng đồng khỏi thiên tai sạt lở!** 🏔️

---

## 📝 Bản Quyền

© 2026 Nhóm Dự Án, Khoa Công nghệ Thông tin, Đại học Đại Nam. Mọi quyền được bảo lưu.

<div align="center">

Được thực hiện bởi 💻 **Nhóm sinh viên Đại học Đại Nam**

[![DaiNam University](https://img.shields.io/badge/Đại%20học-Đại%20Nam-blue?style=flat-square)](https://dainam.edu.vn)

</div>
