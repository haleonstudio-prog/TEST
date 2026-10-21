/**
 * Complete production-ready Windows Python Photobooth Software Suite
 * Ready to view, inspect, copy, and export directly as .zip or individual files.
 */

export interface PythonFile {
  name: string;
  description: string;
  language: string;
  content: string;
}

export const PYTHON_PHOTOBOOTH_FILES: PythonFile[] = [
  {
    name: "photobooth_pro.py",
    description: "Full Touch-Enabled Windows 11 Desktop Photobooth (PyQt6 + OpenCV + Pillow + Win32Print)",
    language: "python",
    content: `"""
=============================================================================
PHOTOBOOTH PRO - WINDOWS EDITION
Touchscreen-Ready Photobooth Software with Live OpenCV Capture,
Animated Countdown, Multi-Pose Filmstrips, and Windows Print Spooler.
=============================================================================
Requirements:
    pip install PyQt6 opencv-python pillow pywin32 qrcode
Run:
    python photobooth_pro.py
Build EXE:
    pyinstaller --noconfirm --windowed photobooth_pro.py
=============================================================================
"""

import sys
import os
import json
import time
from datetime import datetime
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageOps

from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer, QSize
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QLabel, QPushButton,
    QVBoxLayout, QHBoxLayout, QStackedWidget, QFrame,
    QComboBox, QMessageBox, QGraphicsDropShadowEffect
)
from PyQt6.QtGui import QImage, QPixmap, QFont, QColor, QKeySequence, QShortcut

# Optional Windows native printer spooler integration
try:
    import win32print
    import win32ui
    from PIL import ImageWin
    HAS_WIN32PRINT = True
except ImportError:
    HAS_WIN32PRINT = False


CONFIG_FILE = "config.json"
DEFAULT_CONFIG = {
    "event_title": "Sarah & Alex 2026",
    "event_subtitle": "Celebration of Love",
    "show_date": True,
    "camera_index": 0,
    "camera_width": 1280,
    "camera_height": 720,
    "countdown_seconds": 3,
    "photos_per_strip": 4,
    "frame_color": "#FFFFFF",
    "text_color": "#18181B",
    "output_dir": "photobooth_captures",
    "printer_name": "",
    "auto_print": False,
    "kiosk_mode": True
}


def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return {**DEFAULT_CONFIG, **json.load(f)}
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()


class CameraThread(QThread):
    """High-performance non-blocking OpenCV camera capture thread"""
    frame_ready = pyqtSignal(np.ndarray)

    def __init__(self, camera_index=0, width=1280, height=720):
        super().__init__()
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.running = True

    def run(self):
        # cv2.CAP_DSHOW provides fastest startup & zero lag on Windows DirectShow
        cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        cap.set(cv2.CAP_PROP_FPS, 30)

        if not cap.isOpened():
            # Fallback to default backend if DirectShow not found
            cap = cv2.VideoCapture(self.camera_index)

        while self.running:
            ret, frame = cap.read()
            if ret:
                # Mirror horizontally for natural photobooth mirror experience
                frame = cv2.flip(frame, 1)
                self.frame_ready.emit(frame)
            else:
                time.sleep(0.02)

        cap.release()

    def stop(self):
        self.running = False
        self.wait()


class PhotoStripRenderer:
    """Combines captured photo frames into a professional 2x6 or 4x6 print strip"""
    
    @staticmethod
    def create_strip(photo_paths, config, filter_name="normal"):
        images = [Image.open(p) for p in photo_paths]
        strip_width = 600
        strip_height = 1800
        
        # Create base canvas
        bg_color = config.get("frame_color", "#FFFFFF")
        strip = Image.new("RGB", (strip_width, strip_height), bg_color)
        
        # Dimensions & Margins
        padding_x = 36
        padding_top = 40
        footer_height = 220
        available_height = strip_height - padding_top - footer_height
        
        num_photos = len(images)
        gap = 20
        photo_h = int((available_height - gap * (num_photos - 1)) / num_photos)
        photo_w = strip_width - (padding_x * 2)

        for i, img in enumerate(images):
            # Apply Filter
            processed = PhotoStripRenderer.apply_filter(img, filter_name)
            
            # Crop to fill slot maintaining aspect ratio
            fitted = ImageOps.fit(processed, (photo_w, photo_h), Image.Resampling.LANCZOS)
            
            y_pos = padding_top + i * (photo_h + gap)
            strip.paste(fitted, (padding_x, y_pos))

        # Render Event Footer Typography
        draw = ImageDraw.Draw(strip)
        text_color = config.get("text_color", "#18181B")
        
        try:
            title_font = ImageFont.truetype("arialbd.ttf", 32)
            sub_font = ImageFont.truetype("arial.ttf", 20)
            date_font = ImageFont.truetype("courbd.ttf", 18)
        except IOError:
            title_font = ImageFont.load_default()
            sub_font = ImageFont.load_default()
            date_font = ImageFont.load_default()

        footer_y = strip_height - footer_height + 30
        
        # Event Title
        title_text = config.get("event_title", "PHOTOBOOTH STUDIO")
        bbox = draw.textbbox((0, 0), title_text, font=title_font)
        tx = (strip_width - (bbox[2] - bbox[0])) // 2
        draw.text((tx, footer_y), title_text, fill=text_color, font=title_font)

        # Event Subtitle
        sub_text = config.get("event_subtitle", "")
        if sub_text:
            s_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
            sx = (strip_width - (s_bbox[2] - s_bbox[0])) // 2
            draw.text((sx, footer_y + 44), sub_text, fill="#71717A", font=sub_font)

        # Event Date
        if config.get("show_date", True):
            date_text = datetime.now().strftime("%B %d, %Y")
            d_bbox = draw.textbbox((0, 0), date_text, font=date_font)
            dx = (strip_width - (d_bbox[2] - d_bbox[0])) // 2
            draw.text((dx, footer_y + (86 if sub_text else 50)), date_text, fill="#A1A1AA", font=date_font)

        return strip

    @staticmethod
    def apply_filter(img, filter_name):
        img = img.convert("RGB")
        if filter_name == "bw":
            return ImageOps.grayscale(img).convert("RGB")
        elif filter_name == "vintage":
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.2)
            # Add subtle warm sepia tint
            r, g, b = img.split()
            r = r.point(lambda i: min(255, int(i * 1.15)))
            b = b.point(lambda i: int(i * 0.85))
            return Image.merge("RGB", (r, g, b))
        elif filter_name == "soft":
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(1.1)
            contrast = ImageEnhance.Contrast(img)
            return contrast.enhance(0.95)
        return img


class WindowsPhotoboothApp(QMainWindow):
    """Main Touch-Screen Photobooth Window"""

    def __init__(self):
        super().__init__()
        self.config = load_config()
        self.setWindowTitle("PhotoBooth Pro - Windows Edition")
        self.setMinimumSize(1024, 768)

        # State tracking
        self.current_frame = None
        self.captured_photos = []
        self.current_filter = "normal"
        self.countdown_remaining = 0
        self.current_take_index = 0
        self.total_takes = self.config.get("photos_per_strip", 4)
        self.final_strip_image = None

        os.makedirs(self.config.get("output_dir", "photobooth_captures"), exist_ok=True)

        self.init_ui()
        self.init_camera()
        self.init_shortcuts()

        if self.config.get("kiosk_mode", True):
            self.showFullScreen()
        else:
            self.showMaximized()

    def init_ui(self):
        self.central_stack = QStackedWidget()
        self.setCentralWidget(self.central_stack)

        # Style with modern Windows 11 Dark Mica aesthetic
        self.setStyleSheet("""
            QMainWindow { background-color: #09090B; color: #F4F4F5; }
            QPushButton {
                background-color: #E11D48;
                color: #FFFFFF;
                font-family: 'Segoe UI', sans-serif;
                font-size: 20px;
                font-weight: bold;
                border-radius: 12px;
                padding: 16px 32px;
            }
            QPushButton:hover { background-color: #BE123C; }
            QPushButton:pressed { background-color: #9F1239; }
            QPushButton#secondaryBtn {
                background-color: #27272A;
                color: #F4F4F5;
            }
            QPushButton#secondaryBtn:hover { background-color: #3F3F46; }
            QLabel { font-family: 'Segoe UI', sans-serif; }
        """)

        # 1. Welcome Screen
        self.welcome_screen = self.create_welcome_screen()
        self.central_stack.addWidget(self.welcome_screen)

        # 2. Camera Live Kiosk Screen
        self.camera_screen = self.create_camera_screen()
        self.central_stack.addWidget(self.camera_screen)

        # 3. Review & Print Screen
        self.review_screen = self.create_review_screen()
        self.central_stack.addWidget(self.review_screen)

        # Countdown Timer
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.countdown_tick)

    def create_welcome_screen(self):
        screen = QWidget()
        layout = QVBoxLayout(screen)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(24)

        title = QLabel(self.config.get("event_title", "PHOTOBOOTH STUDIO"))
        title.setFont(QFont("Segoe UI", 38, QFont.Weight.Bold))
        title.setStyleSheet("color: #FFFFFF;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        subtitle = QLabel(self.config.get("event_subtitle", "Touch the screen below to begin!"))
        subtitle.setFont(QFont("Segoe UI", 18))
        subtitle.setStyleSheet("color: #A1A1AA;")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(subtitle)

        start_btn = QPushButton("✨ TOUCH TO START PHOTOBOOTH")
        start_btn.setMinimumHeight(80)
        start_btn.setMinimumWidth(380)
        start_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        start_btn.clicked.connect(self.start_session)
        layout.addWidget(start_btn, alignment=Qt.AlignmentFlag.AlignCenter)

        return screen

    def create_camera_screen(self):
        screen = QWidget()
        layout = QVBoxLayout(screen)
        layout.setContentsMargins(16, 16, 16, 16)

        # Live viewfinder container
        self.viewfinder = QLabel()
        self.viewfinder.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.viewfinder.setStyleSheet("background-color: #000000; border-radius: 16px;")
        layout.addWidget(self.viewfinder, stretch=1)

        # Pose & Take Progress label
        self.progress_label = QLabel("Pose 1 of 4")
        self.progress_label.setFont(QFont("Segoe UI", 24, QFont.Weight.Bold))
        self.progress_label.setStyleSheet("color: #F43F5E; padding: 10px;")
        self.progress_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.progress_label)

        # Giant countdown overlay
        self.countdown_label = QLabel("")
        self.countdown_label.setFont(QFont("Segoe UI", 96, QFont.Weight.Bold))
        self.countdown_label.setStyleSheet("color: #FFFFFF; background-color: rgba(0, 0, 0, 0.4); border-radius: 20px;")
        self.countdown_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.countdown_label.setFixedSize(200, 200)
        self.countdown_label.hide()

        return screen

    def create_review_screen(self):
        screen = QWidget()
        layout = QHBoxLayout(screen)
        layout.setContentsMargins(32, 32, 32, 32)
        layout.setSpacing(32)

        # Left: Strip Preview
        self.preview_strip_label = QLabel()
        self.preview_strip_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.preview_strip_label.setStyleSheet("background-color: #18181B; border-radius: 12px; padding: 12px;")
        layout.addWidget(self.preview_strip_label, stretch=1)

        # Right: Action Panel
        right_panel = QVBoxLayout()
        right_panel.setAlignment(Qt.AlignmentFlag.AlignCenter)
        right_panel.setSpacing(20)

        header = QLabel("Your Photo Strip is Ready!")
        header.setFont(QFont("Segoe UI", 26, QFont.Weight.Bold))
        right_panel.addWidget(header)

        # Filter buttons
        filter_layout = QHBoxLayout()
        for f_name, f_key in [("Normal", "normal"), ("B&W Vintage", "bw"), ("Warm 70s", "vintage"), ("Soft Glow", "soft")]:
            btn = QPushButton(f_name)
            btn.setObjectName("secondaryBtn")
            btn.clicked.connect(lambda _, k=f_key: self.change_filter(k))
            filter_layout.addWidget(btn)
        right_panel.addLayout(filter_layout)

        # Print Button
        print_btn = QPushButton("🖨️ PRINT PHOTO STRIP")
        print_btn.setMinimumHeight(70)
        print_btn.clicked.connect(self.print_strip)
        right_panel.addWidget(print_btn)

        # Save & Restart
        new_session_btn = QPushButton("🔄 TAKE ANOTHER SESSION")
        new_session_btn.setObjectName("secondaryBtn")
        new_session_btn.setMinimumHeight(60)
        new_session_btn.clicked.connect(self.reset_to_welcome)
        right_panel.addWidget(new_session_btn)

        layout.addLayout(right_panel, stretch=1)
        return screen

    def init_camera(self):
        cam_idx = self.config.get("camera_index", 0)
        w = self.config.get("camera_width", 1280)
        h = self.config.get("camera_height", 720)
        self.camera_thread = CameraThread(cam_idx, w, h)
        self.camera_thread.frame_ready.connect(self.on_frame_ready)
        self.camera_thread.start()

    def on_frame_ready(self, frame):
        self.current_frame = frame
        if self.central_stack.currentWidget() == self.camera_screen:
            # Convert OpenCV BGR to Qt RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            h, w, ch = rgb_frame.shape
            bytes_per_line = ch * w
            qt_img = QImage(rgb_frame.data, w, h, bytes_per_line, QImage.Format.Format_RGB888)
            pixmap = QPixmap.fromImage(qt_img)
            self.viewfinder.setPixmap(
                pixmap.scaled(self.viewfinder.size(), Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
            )

    def start_session(self):
        self.captured_photos = []
        self.current_take_index = 0
        self.central_stack.setCurrentWidget(self.camera_screen)
        self.start_next_take()

    def start_next_take(self):
        self.current_take_index += 1
        self.progress_label.setText(f"Pose {self.current_take_index} of {self.total_takes} - Get Ready!")
        self.countdown_remaining = self.config.get("countdown_seconds", 3)
        self.timer.start(1000)

    def countdown_tick(self):
        if self.countdown_remaining > 0:
            self.progress_label.setText(f"Pose {self.current_take_index} in {self.countdown_remaining}...")
            self.countdown_remaining -= 1
        else:
            self.timer.stop()
            self.capture_take()

    def capture_take(self):
        if self.current_frame is not None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            out_path = os.path.join(self.config.get("output_dir", "photobooth_captures"), f"raw_{timestamp}.jpg")
            # Save raw BGR
            cv2.imwrite(out_path, self.current_frame)
            self.captured_photos.append(out_path)

            if self.current_take_index < self.total_takes:
                # Brief pause before next take
                QTimer.singleShot(1200, self.start_next_take)
            else:
                self.finish_session()

    def finish_session(self):
        self.update_preview()
        self.central_stack.setCurrentWidget(self.review_screen)
        if self.config.get("auto_print", False):
            self.print_strip()

    def update_preview(self):
        if not self.captured_photos:
            return
        strip_pil = PhotoStripRenderer.create_strip(self.captured_photos, self.config, self.current_filter)
        self.final_strip_image = strip_pil

        # Save finished composite
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        strip_path = os.path.join(self.config.get("output_dir", "photobooth_captures"), f"strip_{ts}.jpg")
        strip_pil.save(strip_path, quality=95)

        # Display on review screen
        data = strip_pil.convert("RGBA").tobytes("raw", "RGBA")
        qim = QImage(data, strip_pil.width, strip_pil.height, QImage.Format.Format_RGBA8888)
        pix = QPixmap.fromImage(qim)
        self.preview_strip_label.setPixmap(
            pix.scaled(320, 800, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
        )

    def change_filter(self, filter_name):
        self.current_filter = filter_name
        self.update_preview()

    def print_strip(self):
        """Spool to Windows native printer via win32print"""
        if not self.final_strip_image:
            return

        if not HAS_WIN32PRINT:
            QMessageBox.information(self, "Print Simulation", "win32print is not installed or running outside Windows. Simulated print spooling completed successfully!")
            return

        try:
            printer_name = self.config.get("printer_name") or win32print.GetDefaultPrinter()
            hprinter = win32print.OpenPrinter(printer_name)
            hdc = win32ui.CreateDC()
            hdc.CreatePrinterDC(printer_name)
            
            hdc.StartDoc("Photobooth Print Job")
            hdc.StartPage()

            # Fit to printer page
            printable_width = hdc.GetDeviceCaps(win32con.HORZRES)
            printable_height = hdc.GetDeviceCaps(win32con.VERTRES)

            dib = ImageWin.Dib(self.final_strip_image)
            dib.draw(hdc.GetHandleOutput(), (0, 0, printable_width, printable_height))

            hdc.EndPage()
            hdc.EndDoc()
            hdc.DeleteDC()
            win32print.ClosePrinter(hprinter)
            QMessageBox.information(self, "Printing", f"Sent to printer: {printer_name}")
        except Exception as e:
            QMessageBox.warning(self, "Printer Error", f"Could not print: {str(e)}")

    def reset_to_welcome(self):
        self.central_stack.setCurrentWidget(self.welcome_screen)

    def init_shortcuts(self):
        # F11 toggles Fullscreen Kiosk
        QShortcut(QKeySequence("F11"), self, self.toggle_fullscreen)
        # Escape exits
        QShortcut(QKeySequence("Esc"), self, self.close)

    def toggle_fullscreen(self):
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    def closeEvent(self, event):
        self.camera_thread.stop()
        event.accept()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = WindowsPhotoboothApp()
    sys.exit(app.exec())
`,
  },
  {
    name: "photobooth_simple.py",
    description: "Lightweight Zero-Install Windows Photobooth (Tkinter + OpenCV)",
    language: "python",
    content: `"""
=============================================================================
PHOTOBOOTH SIMPLE - LIGHTWEIGHT TKINTER EDITION
A minimalist Windows photobooth script that runs anywhere with Python & OpenCV.
=============================================================================
Installation:
    pip install opencv-python pillow
Run:
    python photobooth_simple.py
=============================================================================
"""

import tkinter as tk
from tkinter import ttk, messagebox
import cv2
from PIL import Image, ImageTk, ImageOps, ImageDraw, ImageFont
import os
import time
from datetime import datetime

class SimplePhotobooth:
    def __init__(self, root):
        self.root = root
        self.root.title("Simple Windows PhotoBooth")
        self.root.geometry("900x700")
        self.root.configure(bg="#121212")

        self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)

        self.photos = []
        self.countdown = 0
        self.taking_photos = False
        self.shots_target = 4
        
        os.makedirs("captures", exist_ok=True)

        self.setup_ui()
        self.update_video()

    def setup_ui(self):
        # Title
        title_label = tk.Label(self.root, text="PHOTOBOOTH KIOSK", font=("Segoe UI", 24, "bold"), fg="#FFFFFF", bg="#121212")
        title_label.pack(pady=10)

        # Video Frame
        self.video_label = tk.Label(self.root, bg="#000000")
        self.video_label.pack(expand=True, fill="both", padx=20, pady=10)

        # Status & Countdown
        self.status_label = tk.Label(self.root, text="Ready! Press Start to take 4 photos", font=("Segoe UI", 16), fg="#10B981", bg="#121212")
        self.status_label.pack(pady=5)

        # Action Button
        self.start_btn = tk.Button(
            self.root, text="📸 START PHOTOBOOTH", font=("Segoe UI", 18, "bold"),
            bg="#E11D48", fg="#FFFFFF", activebackground="#BE123C", activeforeground="#FFFFFF",
            relief="flat", padx=30, pady=12, command=self.start_session
        )
        self.start_btn.pack(pady=15)

    def update_video(self):
        ret, frame = self.cap.read()
        if ret:
            frame = cv2.flip(frame, 1)
            # Convert to PIL
            cv_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(cv_rgb)
            pil_img = ImageOps.contain(pil_img, (640, 480))
            self.current_frame = frame
            
            img_tk = ImageTk.PhotoImage(image=pil_img)
            self.video_label.img_tk = img_tk
            self.video_label.configure(image=img_tk)

        self.root.after(30, self.update_video)

    def start_session(self):
        if self.taking_photos:
            return
        self.taking_photos = True
        self.photos = []
        self.start_btn.config(state="disabled")
        self.take_photo_step(1)

    def take_photo_step(self, shot_num):
        if shot_num > self.shots_target:
            self.build_strip()
            self.taking_photos = False
            self.start_btn.config(state="normal")
            return

        self.countdown = 3
        self.run_countdown(shot_num)

    def run_countdown(self, shot_num):
        if self.countdown > 0:
            self.status_label.config(text=f"Pose {shot_num}/{self.shots_target} in {self.countdown}...", fg="#F59E0B")
            self.countdown -= 1
            self.root.after(1000, lambda: self.run_countdown(shot_num))
        else:
            # Capture
            ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            path = f"captures/pose_{ts}.jpg"
            cv2.imwrite(path, self.current_frame)
            self.photos.append(path)
            self.status_label.config(text=f"Captured pose {shot_num}!", fg="#10B981")
            self.root.after(1200, lambda: self.take_photo_step(shot_num + 1))

    def build_strip(self):
        strip = Image.new("RGB", (600, 1800), "#FFFFFF")
        draw = ImageDraw.Draw(strip)
        slot_h = 380
        slot_w = 520
        pad_x = 40
        pad_y = 40
        gap = 20

        for idx, p in enumerate(self.photos):
            img = Image.open(p)
            fitted = ImageOps.fit(img, (slot_w, slot_h))
            strip.paste(fitted, (pad_x, pad_y + idx * (slot_h + gap)))

        draw.text((200, 1680), "PHOTOBOOTH 2026", fill="#18181B")
        out_name = f"captures/strip_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        strip.save(out_name)
        messagebox.showinfo("Photobooth Finished", f"Your photostrip was saved to:\\n{out_name}")
        self.status_label.config(text="Session Complete! Ready for next guests.", fg="#10B981")

    def on_closing(self):
        self.cap.release()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = SimplePhotobooth(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()
`,
  },
  {
    name: "requirements.txt",
    description: "Python Dependencies for Windows (OpenCV, PyQt6, Pillow, pywin32, qrcode)",
    language: "text",
    content: `opencv-python>=4.8.0
PyQt6>=6.5.0
Pillow>=10.0.0
pywin32>=306
qrcode>=7.4.2
`,
  },
  {
    name: "build_exe.bat",
    description: "Windows 1-Click PyInstaller Build Script to create photobooth.exe",
    language: "bat",
    content: `@echo off
title PhotoBooth Pro - Windows Standalone EXE Compiler
color 0A
echo ========================================================
echo   PHOTOBOOTH PRO - WINDOWS STANDALONE EXE BUILDER
echo ========================================================
echo.

echo [1/3] Checking Python installation...
python --version
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b
)

echo.
echo [2/3] Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

echo.
echo [3/3] Compiling standalone Windows .exe...
pyinstaller --noconfirm --onedir --windowed ^
    --name "PhotoBoothPro" ^
    --add-data "config.json;." ^
    photobooth_pro.py

echo.
echo ========================================================
echo [SUCCESS] Your Windows EXE is ready!
echo Location: dist\\PhotoBoothPro\\PhotoBoothPro.exe
echo ========================================================
pause
`,
  },
  {
    name: "config.json",
    description: "Custom Event Configuration File for Python Photobooth",
    language: "json",
    content: `{
  "event_title": "Grand Celebration 2026",
  "event_subtitle": "Making Unforgettable Memories",
  "show_date": true,
  "camera_index": 0,
  "camera_width": 1920,
  "camera_height": 1080,
  "countdown_seconds": 3,
  "photos_per_strip": 4,
  "frame_color": "#FFFFFF",
  "text_color": "#18181B",
  "output_dir": "photobooth_captures",
  "printer_name": "",
  "auto_print": false,
  "kiosk_mode": true
}
`,
  },
  {
    name: "README_WINDOWS.md",
    description: "Complete Windows Hardware, Camera, and Thermal Printer Setup Manual",
    language: "markdown",
    content: `# PhotoBooth Pro - Windows Setup & Hardware Guide

## 1. Quick Start
1. Ensure **Python 3.10+** is installed on Windows with "Add Python to PATH" checked.
2. Open Command Prompt in this folder and run:
   \`\`\`cmd
   pip install -r requirements.txt
   python photobooth_pro.py
   \`\`\`

## 2. Compiling into a Standalone Windows .exe
Double-click \`build_exe.bat\` or run:
\`\`\`cmd
pip install pyinstaller
pyinstaller --noconfirm --onedir --windowed --add-data "config.json;." photobooth_pro.py
\`\`\`
The compiled executable will be located in \`dist\\PhotoBoothPro\\PhotoBoothPro.exe\`.

## 3. Recommended Cameras & Windows Drivers
- **Standard USB 1080p/4K Webcams**:
  Logitech Brio, C920, Razer Kiyo Pro, or Elgato Facecam.
  Uses Windows DirectShow (\`cv2.CAP_DSHOW\`) for zero latency.
- **Canon / Nikon DSLRs as Webcam**:
  Use **DigiCamControl** (free open source) or **Canon EOS Webcam Utility**.
  Select the virtual webcam device in \`config.json\` (\`"camera_index": 1\`).

## 4. Professional Dye-Sub Photo Printers (2x6" Strip & 4x6" Postcard)
- **Supported Models**: DNP DS620A, DNP RX1HS, HiTi P525L, Sinfonia CS2, Citizen CY-02.
- **2x6 Cut Feature**: In Windows Printer Properties, select **"2-inch Cut"** so each 4x6 sheet is automatically sliced into two classic 2x6 photostrips!
- **Windows Print Spooler**: In \`config.json\`, leave \`"printer_name": ""\` to automatically use Windows Default Printer, or specify the exact printer name.

## 5. Keyboard Shortcuts
- **Spacebar / Touch**: Start new photobooth session
- **F11**: Toggle borderless fullscreen Kiosk mode
- **Esc**: Exit application
`,
  },
];
