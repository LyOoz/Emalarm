# Emalarm — Smart Emergency Reminder & SOS System
# THIS PROJECT IS PROTOTYPE IN CLASS DESIGN THINKING MC-KMUTNB 68
A cross-platform mobile application integrated with ESP32 hardware to provide real-time emergency alerts, reminders, and SOS functionality.

Designed for personal safety, health reminders, and quick emergency response.

# Features

Mobile Application
- Smart reminder system (create / edit / manage events)
- Notification-based alerts
- Reminder context management (state handled globally)
- SOS emergency screen
- Settings & customization
- View all scheduled reminders

IoT Integration (ESP32)
- ESP32 Arduino-based module
- Can be extended for real-world alert triggers
- Ready for sensor / button-based emergency signals

# Tech Stack

Mobile App
- Framework: React Native (Expo)
- TypeScript
- Expo Router
- Context API

Hardware (ESP32)
- ESP32 (Arduino)
- TCRT5000 Ir-Sensor x3
- LEDs x3
- Active Buzzer x1
- C++ (Arduino sketch)

# Emalarm Hardware Design
![esp](https://res.cloudinary.com/dpij1hdso/image/upload/v1781130519/FC291FCB-56FC-4D3A-858E-DF869DC09F7B_qx9tee.png)

# Emalarm Software Design
![sf](https://res.cloudinary.com/dpij1hdso/image/upload/v1784187974/IMG_4823_wbnfhb.png)
# Installation
1. Clone repository
``` bash
git clone https://github.com/LyOoz/Emalarm
cd Emalarm
```
2. Install dependencies
``` bash
npm install
```
3. Run the app
``` bash
npx expo start
```

