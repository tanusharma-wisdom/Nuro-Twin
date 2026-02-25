# 🧠 NuroTwin: Cognitive Health Twin 🤖❤️

![Hackathon](https://img.shields.io/badge/Hackathon-2025-purple)
![ESP32](https://img.shields.io/badge/Hardware-ESP32-blue)
![Three.js](https://img.shields.io/badge/3D-Three.js-black)
![WebSockets](https://img.shields.io/badge/Realtime-WebSockets-green)
![Status](https://img.shields.io/badge/Status-Prototype-orange)

> **A real-time digital twin that visualizes stress, health, and cognitive load through an expressive 3D avatar.**

NuroTwin turns raw biometric signals into something humans actually understand.  
By streaming live physiological data from an ESP32, it creates a responsive 3D companion that mirrors your internal state in real time.


---
## 🔐 Authentication & User Management

NuroTwin uses **Google Firebase Authentication** to handle secure user access.

- Email & password–based authentication  
- Secure session handling

Firebase allows users to sign in, maintain persistent sessions, and lays the foundation for personalized health history and profiles as the platform evolves.


## 🚀 Key Features

### 🤖 Digital Twin Visualization
A custom 3D robot built with **Three.js** that reacts instantly to biometric input.

### ❤️ Live Bio-Feedback
The avatar visually communicates stress levels:

- **Healthy**  
  Calm floating motion, blue glow  

- **Stressed**  
  Subtle jittering, orange glow  

- **Critical**  
  Slumped posture, red glow, blackened eyes  

### 🔌 Real-Time Hardware Streaming
Live vitals streamed from ESP32 via WebSockets:

- Heart Rate (BPM)
- SpO₂
- Temperature

Low latency. No polling. No laggy UI.

### 🧠 AI-Driven Insights
Vitals are analyzed to generate actionable feedback, for example:
> “High cognitive load detected. Try box breathing.”

### 🖥️ Responsive Cyberpunk Dashboard
Built with **pure HTML, CSS, and JavaScript**.  
Works on desktop and mobile without framework bloat.

---

## 🛠️ Tech Stack

### Hardware
- ESP32 Dev Board (DOIT DEVKIT V1)
- MAX30102 Pulse Oximeter & Heart Rate Sensor
- Ad8232 ECG Sensor
- I2C  
  - SDA: GPIO 21  
  - SCL: GPIO 22  

### Software
- **Frontend:** HTML5, CSS3, Vanilla JS  
- **3D Engine:** Three.js (WebGL)  
- **Charts:** Chart.js  
- **Communication:** WebSockets (ESPAsyncWebServer)  
- **3D Modeling:** Blender (rigging, animation, shape keys)

---

## 📦 Installation & Setup

### 1️⃣ ESP32 Setup

1. Install **Arduino IDE**
2. Install **ESP32 Board Manager**
3. Install libraries:
   - ESPAsyncWebServer (ESP32 v3.0+ patched)
   - AsyncTCP
   - MAX30105 (SparkFun) or DFRobot_MAX30102
4. Open `esp32_code.ino`
5. Update WiFi credentials
6. Upload to ESP32
7. Open Serial Monitor (115200 baud)
8. Note the IP address (example: `192.168.1.15`)

---

### 2️⃣ Web Dashboard Setup

1. Clone this repository
2. Open in VS Code
3. Install **Live Server**
4. Right-click `index.html` → **Open with Live Server**
5. Enter ESP32 IP
6. Click **Connect Hardware**

---

## 🎮 How It Works

### Simulation Mode
Runs by default. The robot reacts to simulated data for demos and testing.

### Hardware Mode
1. Power the ESP32  
2. Connect to the same WiFi network  
3. Enter the ESP32 IP  
4. Place your finger on the sensor  
5. Watch the avatar mirror your heartbeat in real time

---

## 🌟 Future Roadmap

- Integration with consumer and medical-grade wearables
- WebBluetooth support for frictionless pairing
- Google Gemini API for real-time AI health coaching
- User profiles and historical health tracking (Firebase)

---

## 🏁 Hackathon Submission

Built for **Hackathon 2025**

**Problem:**  
Physiological data is hard to interpret, emotionally disconnected, and ignored until it’s too late.

**Solution:**  
NuroTwin makes internal health states visible, intuitive, and emotionally legible through a real-time digital twin.

---

## 📌 One-Paragraph Pitch

NuroTwin is a real-time cognitive health twin that transforms raw biometric data into an expressive 3D avatar. By streaming live vitals from an ESP32, it visualizes stress, heart rate, and oxygen levels through motion, posture, and color. Instead of charts and numbers, users experience their health as behavior, making invisible physiological states instantly understandable. NuroTwin bridges hardware, AI, and 3D interaction to create a more human way of monitoring cognitive and physical well-being.

---
