#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "Lyo";
const char* password = "76245441";

WebServer server(80);

// กล่องยา 5 ช่อง
const int ledPins[5] = { 2, 4, 16, 17, 5 };     // LED สำหรับแต่ละช่อง
const int irPins[5] = { 18, 19, 21, 22, 23 };   // IR Sensor สำหรับแต่ละช่อง
const int buzzerPin = 13;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());

  // default pin
  for (int i = 0; i < 5; i++) {
    pinMode(ledPins[i], OUTPUT);
    pinMode(irPins[i], INPUT);
    digitalWrite(ledPins[i], LOW); // ปิด LED default
  }
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW); // ปิด buzzer default

  // default route
  server.onNotFound(handleTrigger);
  server.begin();
}

void loop() {
  server.handleClient();
}

void handleTrigger() {
  String uri = server.uri(); 
  if (!uri.startsWith("/trigger/")) {
    server.send(404, "text/plain", "Invalid endpoint");
    return;
  }

  int boxId = uri.substring(9).toInt(); 
  if (boxId < 0 || boxId >= 5) {
    server.send(400, "text/plain", "Invalid boxId");
    return;
  }

  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Missing body");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, server.arg("plain"));
  if (error) {
    server.send(400, "text/plain", "Invalid JSON");
    return;
  }

  String action = doc["action"] | "start"; 
  String title = doc["title"] | "No Title";

  Serial.printf("Box %d - Action: %s - Title: %s\n", boxId, action.c_str(), title.c_str());

  if (action == "start") {
    digitalWrite(ledPins[boxId], HIGH);
    digitalWrite(buzzerPin, HIGH);

    // รอให้ IR Sensor ตรวจจับการหยิบยา (LOW)
    unsigned long startTime = millis();
    bool picked = false;
    while (millis() - startTime < 10000) { 
      if (digitalRead(irPins[boxId]) == LOW) {
        picked = true;
        break;
      }
      delay(100);
    }

    digitalWrite(ledPins[boxId], LOW);
    digitalWrite(buzzerPin, LOW);

    if (picked) {
      Serial.println("ยาถูกหยิบแล้ว");
      server.send(200, "text/plain", "Medicine picked");
    } else {
      Serial.println("หมดเวลา รอไม่พบการหยิบยา");
      server.send(200, "text/plain", "Timeout, no pickup");
    }

  } else if (action == "stop") {
    digitalWrite(ledPins[boxId], LOW);
    digitalWrite(buzzerPin, LOW);
    Serial.println("หยุดการแจ้งเตือน");
    server.send(200, "text/plain", "Stopped");
  } else {
    server.send(400, "text/plain", "Unknown action");
  }
}
