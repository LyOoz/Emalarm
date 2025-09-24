#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "";
const char* password = "";

WebServer server(80);

// กำหนดพิน - กล่องยา 5 ช่อง (0ไม่นับในกล่อง)
const int IR_PINS[6] = {-1, 4, 21, 18, 19, 5};      // IR Sensors 
const int BUZZER_PIN = 23;                           // Buzzer HIGH=ปิด LOW=เปิด
const int LED_PINS[6] = {-1, 2, 15, 13, 12, 14};    // LED 

// ตัวแปรสำหรับจัดการสถานะ
struct MedicineBox {
  bool buzzerActive;
  bool ledActive;
  unsigned long startTime;
  unsigned long lastBlinkTime;
  bool ledState;
  bool medicinePresent;
  bool previousState;
  String title;
  String note;
  String reminderId;
};

MedicineBox boxes[6];
const unsigned long BUZZER_TIMEOUT = 60000; 
const unsigned long LED_BLINK_INTERVAL = 500; 
int activeBuzzerBox = -1; 

void setup() {
  Serial.begin(115200);
  
  // ตั้งค่าพิน
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, HIGH);
  
  for (int i = 1; i < 6; i++) {
    pinMode(IR_PINS[i], INPUT);
    pinMode(LED_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW); 
    
    // เริ่มต้นสถานะกล่อง - อ่านสถานะปัจจุบัน
    boxes[i].buzzerActive = false;
    boxes[i].ledActive = false;
    boxes[i].startTime = 0;
    boxes[i].lastBlinkTime = 0;
    boxes[i].ledState = false;
    boxes[i].medicinePresent = (digitalRead(IR_PINS[i]) == LOW); // LOW = ไม่มียา, HIGH = มียา
    boxes[i].previousState = boxes[i].medicinePresent;
    boxes[i].title = "";
    boxes[i].note = "";
    boxes[i].reminderId = "";
  }
  

  connectWiFi();
  setupRoutes();
  
  server.begin();
  Serial.println("ESP32 Medicine Box Server เริ่มทำงาน");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  
  // ทดสอบระบบเริ่มต้น
  systemTest();
}

void loop() {
  server.handleClient();
  
  // ตรวจสอบสถานะของทุกกล่อง
  for (int i = 1; i < 6; i++) {
    checkMedicineBox(i);
    updateLED(i); // อัปเดต LED กระพริบ
  }
  
  delay(50); 
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("กำลังเชื่อมต่อ WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi เชื่อมต่อสำเร็จ!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void setupRoutes() {
  // Route สำหรับรับคำสั่งจากแอพ - ตาม API ที่แอพใช้
  server.on("/trigger/1", HTTP_POST, []() { handleTrigger(1); });
  server.on("/trigger/2", HTTP_POST, []() { handleTrigger(2); });
  server.on("/trigger/3", HTTP_POST, []() { handleTrigger(3); });
  server.on("/trigger/4", HTTP_POST, []() { handleTrigger(4); });
  server.on("/trigger/5", HTTP_POST, []() { handleTrigger(5); }); 
  
  // Route สำหรับหยุด buzzer และ LED (จากแอพ)
  server.on("/stop", HTTP_POST, handleStop);
  
  // Route สำหรับตรวจสอบสถานะ
  server.on("/status", HTTP_GET, handleStatus);
  
  // Route สำหรับทดสอบ
  server.on("/test", HTTP_GET, handleTest);
  
  // CORS Headers
  server.enableCORS(true);
}

void handleTrigger(int boxId) {
  if (boxId < 1 || boxId > 5) { 
    server.send(400, "application/json", "{\"error\":\"Invalid box ID\"}");
    return;
  }
  
  // อ่าน JSON data จากแอพ
  if (server.hasArg("plain")) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, server.arg("plain"));
    
    String title = doc["title"].as<String>();
    String note = doc["note"].as<String>();
    String timestamp = doc["timestamp"].as<String>();
    
    // ข้อมูลการแจ้งเตือน
    boxes[boxId].title = title;
    boxes[boxId].note = note;
    boxes[boxId].reminderId = timestamp;
    
    Serial.println("=== ได้รับคำสั่งจากแอพ ===");
    Serial.println("Box ID: " + String(boxId));
    Serial.println("Title: " + title);
    Serial.println("Note: " + note);
    Serial.println("Timestamp: " + timestamp);
  }
  
  // เริ่มการแจ้งเตือน (Buzzer + LED)
  startAlert(boxId);
  
  server.send(200, "application/json", "{\"success\":true,\"box\":" + String(boxId) + "}");
}

void handleStop() {
  stopAllAlerts();
  
  Serial.println("ได้รับคำสั่งหยุด buzzer และ LED จากแอพ");
  server.send(200, "application/json", "{\"success\":true,\"message\":\"All alerts stopped\"}");
}

void handleStatus() {
  DynamicJsonDocument doc(2048);
  JsonArray boxArray = doc.createNestedArray("boxes");
  
  for (int i = 1; i < 6; i++) {
    JsonObject box = boxArray.createNestedObject();
    box["id"] = i;
    box["buzzerActive"] = boxes[i].buzzerActive;
    box["ledActive"] = boxes[i].ledActive;
    box["medicinePresent"] = boxes[i].medicinePresent;
    box["title"] = boxes[i].title;
    box["note"] = boxes[i].note;
    
    if (boxes[i].buzzerActive || boxes[i].ledActive) {
      unsigned long elapsed = millis() - boxes[i].startTime;
      box["timeRemaining"] = max(0L, (long)(BUZZER_TIMEOUT - elapsed));
    }
  }
  
  doc["activeBuzzerBox"] = activeBuzzerBox;
  doc["wifiConnected"] = WiFi.status() == WL_CONNECTED;
  doc["ipAddress"] = WiFi.localIP().toString();
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleTest() {
  Serial.println("ทดสอบระบบ");
  
  // ทดสอบ buzzer
  digitalWrite(BUZZER_PIN, LOW);
  delay(500);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(200);
  digitalWrite(BUZZER_PIN, LOW);
  delay(500);
  digitalWrite(BUZZER_PIN, HIGH);
  
  // ทดสอบ LED ทุกตัว
  Serial.println("ทดสอบ LED");
  for (int i = 1; i < 6; i++) {
    digitalWrite(LED_PINS[i], HIGH);
    Serial.println("เปิด LED กล่อง " + String(i));
    delay(300);
    digitalWrite(LED_PINS[i], LOW);
    delay(100);
  }
  
  // ทดสอบ IR sensors
  DynamicJsonDocument doc(1024);
  JsonArray sensors = doc.createNestedArray("sensors");
  
  for (int i = 1; i < 6; i++) {
    JsonObject sensor = sensors.createNestedObject();
    sensor["box"] = i;
    sensor["irPin"] = IR_PINS[i];
    sensor["ledPin"] = LED_PINS[i];
    sensor["irValue"] = digitalRead(IR_PINS[i]);
    sensor["medicinePresent"] = (digitalRead(IR_PINS[i]) == LOW);
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
  
  Serial.println("ทดสอบระบบเสร็จสิ้น");
}

void startAlert(int boxId) {
  // หยุด alert ที่กำลังทำงานอยู่ก่อน
  if (activeBuzzerBox != -1 && activeBuzzerBox != boxId) {
    stopAlert(activeBuzzerBox);
  }
  
  // เริ่มการแจ้งเตือน
  boxes[boxId].buzzerActive = true;
  boxes[boxId].ledActive = true;
  boxes[boxId].startTime = millis();
  boxes[boxId].lastBlinkTime = millis();
  boxes[boxId].ledState = true;
  activeBuzzerBox = boxId;
  
  // เปิด buzzer และ LED
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PINS[boxId], HIGH);
  
  Serial.println("เริ่มการแจ้งเตือน - กล่อง " + String(boxId));
  Serial.println("ยา: " + boxes[boxId].title);
  Serial.println("หมายเหตุ: " + boxes[boxId].note);
  Serial.println("เปิด Buzzer และ LED");
}

void stopAlert(int boxId) {
  boxes[boxId].buzzerActive = false;
  boxes[boxId].ledActive = false;
  digitalWrite(LED_PINS[boxId], LOW);
  
  if (activeBuzzerBox == boxId) {
    digitalWrite(BUZZER_PIN, HIGH);
    activeBuzzerBox = -1;
  }
  
  Serial.println("หยุดการแจ้งเตือน - กล่อง " + String(boxId));
}

void stopAllAlerts() {
  digitalWrite(BUZZER_PIN, HIGH);
  
  for (int i = 1; i < 6; i++) {
    if (boxes[i].buzzerActive || boxes[i].ledActive) {
      boxes[i].buzzerActive = false;
      boxes[i].ledActive = false;
      digitalWrite(LED_PINS[i], LOW);
      Serial.println("หยุดการแจ้งเตือน - กล่อง " + String(i));
    }
  }
  
  activeBuzzerBox = -1;
}

void updateLED(int boxId) {
  if (boxes[boxId].ledActive) {
    unsigned long currentTime = millis();
    
    // ตรวจสอบเวลากระพริบ
    if (currentTime - boxes[boxId].lastBlinkTime >= LED_BLINK_INTERVAL) {
      boxes[boxId].ledState = !boxes[boxId].ledState;
      digitalWrite(LED_PINS[boxId], boxes[boxId].ledState ? HIGH : LOW);
      boxes[boxId].lastBlinkTime = currentTime;
    }
  }
}

void checkMedicineBox(int boxId) {
  bool currentState = (digitalRead(IR_PINS[boxId]) == LOW);
  boxes[boxId].medicinePresent = currentState;
  
  // ตรวจสอบการเปลี่ยนแปลงสถานะ IR SENSOR ยาถูกหยิบออก
  if (boxes[boxId].previousState == true && currentState == false) {
    if (boxes[boxId].buzzerActive || boxes[boxId].ledActive) {
      stopAlert(boxId);
      
      Serial.println("ยาถูกหยิบออกแล้ว - กล่อง " + String(boxId));
      Serial.println("หยุดการแจ้งเตือน (Buzzer + LED)");
    }
  }
  
  boxes[boxId].previousState = currentState;
  
  // ตรวจสอบ timeout 
  if (boxes[boxId].buzzerActive || boxes[boxId].ledActive) {
    unsigned long elapsed = millis() - boxes[boxId].startTime;
    
    if (elapsed >= BUZZER_TIMEOUT) {
      stopAlert(boxId);
      
      Serial.println("หมดเวลาการแจ้งเตือน - กล่อง " + String(boxId));
      Serial.println("หยุด buzzer และ LED อัตโนมัติ");
    }
  }
}

void systemTest() {
  Serial.println("ทดสอบระบบเริ่มต้น");
  
  // debug buzzer
  Serial.println("ทดสอบ Buzzer");
  digitalWrite(BUZZER_PIN, LOW);
  delay(200);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(200);
  digitalWrite(BUZZER_PIN, HIGH);
  
  // debug LED 
  Serial.println("ทดสอบ LED");
  for (int i = 1; i < 6; i++) {
    Serial.println("ทดสอบ LED กล่อง " + String(i) + " (Pin " + String(LED_PINS[i]) + ")");
    digitalWrite(LED_PINS[i], HIGH);
    delay(300);
    digitalWrite(LED_PINS[i], LOW);
    delay(200);
  }
  
  // สถานะ IR sensors
  Serial.println("สถานะ IR Sensors:");
  for (int i = 1; i < 6; i++) {
    bool state = digitalRead(IR_PINS[i]) == LOW;
    Serial.println("กล่อง " + String(i) + " (IR Pin " + String(IR_PINS[i]) + 
                   ", LED Pin " + String(LED_PINS[i]) + "): " + 
                   (state ? "มียา" : "ไม่มียา"));
  }
  
  Serial.println("ทดสอบระบบเสร็จสิ้น");
  Serial.println("พร้อมรับคำสั่งจากแอพ");
}