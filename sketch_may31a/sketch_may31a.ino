// ======================================
// HỆ THỐNG CẢNH BÁO XÓI MÒN ĐẤT
// TRÊN ĐỊA HÌNH DỐC
// CẬP NHẬT DỮ LIỆU MỖI 5 GIÂY
// ======================================

#define soilSensor A0
#define rainSensor A1
#define tiltSensor 2
#define buzzer 8

int soilValue;
int rainValue;
int soilPercent;
int tiltCount;
int alertLevel; // Cấp độ cảnh báo (1: An toàn, 2: Theo dõi, 3: Xói mòn cao, 4: Sạt lở rất cao)

String tiltStatus;
String rainStatus;

void setup()
{
  Serial.begin(9600);

  pinMode(tiltSensor, INPUT_PULLUP);
  pinMode(buzzer, OUTPUT);

  digitalWrite(buzzer, LOW);

  Serial.println("====================================");
  Serial.println(" HE THONG CANH BAO XOI MON DAT ");
  Serial.println("====================================");
}

void loop()
{
  // ==========================
  // ĐỌC ĐỘ ẨM ĐẤT
  // ==========================
  soilValue = analogRead(soilSensor);

  // Chuyển sang %
  soilPercent = map(soilValue, 1023, 0, 0, 100);

  // ==========================
  // ĐỌC CẢM BIẾN MƯA
  // ==========================
  rainValue = analogRead(rainSensor);

  // ==========================
  // PHÂN LOẠI MƯA
  // ==========================
  if (rainValue > 800)
  {
    rainStatus = "KHONG MUA";
  }
  else if (rainValue > 600)
  {
    rainStatus = "MUA NHE";
  }
  else if (rainValue > 400)
  {
    rainStatus = "MUA VUA";
  }
  else
  {
    rainStatus = "MUA LON";
  }

  // ==========================
  // ĐẾM RUNG LẮC TRONG 5 GIÂY
  // ==========================
  tiltCount = 0;

  for (int i = 0; i < 500; i++)
  {
    if (digitalRead(tiltSensor) == LOW)
    {
      tiltCount++;
    }

    delay(10); // 500 x 10ms = 5000ms = 5 giây
  }

  // ==========================
  // ĐÁNH GIÁ ĐỊA HÌNH
  // ==========================
  if (tiltCount > 80)
  {
    tiltStatus = "CO DAU HIEU DICH CHUYEN DAT";
  }
  else if (tiltCount > 20)
  {
    tiltStatus = "CO RUNG LAC";
  }
  else
  {
    tiltStatus = "BINH THUONG";
  }

  // ==========================
  // HIỂN THỊ DỮ LIỆU
  // ==========================
  Serial.println();
  Serial.println("====================================");
  Serial.println(" BAO CAO MOI 5 GIAY ");
  Serial.println("====================================");

  Serial.print("Do am dat: ");
  Serial.print(soilPercent);
  Serial.println("%");

  Serial.print("Gia tri cam bien dat: ");
  Serial.println(soilValue);

  Serial.print("Gia tri mua: ");
  Serial.println(rainValue);

  Serial.print("Trang thai mua: ");
  Serial.println(rainStatus);

  Serial.print("So lan rung lac (5s): ");
  Serial.println(tiltCount);

  Serial.print("Trang thai dia hinh: ");
  Serial.println(tiltStatus);

  // ==========================
  // CAP 4 - NGUY HIEM CAO
  // ==========================
  if (soilPercent > 75 &&
      rainValue < 400 &&
      tiltCount > 60)
  {
    alertLevel = 4;
    Serial.println();
    Serial.println("CAP 4 - NGUY CO SAT LO RAT CAO");

    for (int i = 0; i < 5; i++)
    {
      digitalWrite(buzzer, HIGH);
      delay(150);
      digitalWrite(buzzer, LOW);
      delay(150);
    }
  }

  // ==========================
  // CAP 3 - NGUY CO XOI MON
  // ==========================
  else if (soilPercent > 75 &&
           rainValue < 500)
  {
    alertLevel = 3;
    Serial.println();
    Serial.println("CAP 3 - NGUY CO XOI MON CAO");

    for (int i = 0; i < 3; i++)
    {
      digitalWrite(buzzer, HIGH);
      delay(300);
      digitalWrite(buzzer, LOW);
      delay(300);
    }
  }

  // ==========================
  // CAP 2 - CAN THEO DOI
  // ==========================
  else if (soilPercent > 50 ||
           rainValue < 700 ||
           tiltCount > 15)
  {
    alertLevel = 2;
    Serial.println();
    Serial.println("CAP 2 - CAN THEO DOI");

    digitalWrite(buzzer, LOW); // Không kêu còi ở cấp 2 để tránh làm phiền
  }

  // ==========================
  // CAP 1 - AN TOAN
  // ==========================
  else
  {
    alertLevel = 1;
    Serial.println();
    Serial.println("CAP 1 - AN TOAN");

    digitalWrite(buzzer, LOW);
  }

  // ==========================
  // GỬI DỮ LIỆU ĐỊNH DẠNG JSON ĐỂ TRANG WEB ĐỌC
  // ==========================
  Serial.print("[JSON_DATA]");
  Serial.print("{\"soil\":");
  Serial.print(soilPercent);
  Serial.print(",\"soilVal\":");
  Serial.print(soilValue);
  Serial.print(",\"rain\":");
  Serial.print(rainValue);
  Serial.print(",\"rainStatus\":\"");
  Serial.print(rainStatus);
  Serial.print("\",\"tilt\":");
  Serial.print(tiltCount);
  Serial.print(",\"tiltStatus\":\"");
  Serial.print(tiltStatus);
  Serial.print("\",\"level\":");
  Serial.print(alertLevel);
  Serial.println("}");
}