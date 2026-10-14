import os
import sys
import subprocess

try:
    from roboflow import Roboflow
    from ultralytics import YOLO
except ImportError:
    print("Installing required dependencies (Roboflow, Ultralytics)...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "roboflow", "ultralytics"])
    from roboflow import Roboflow
    from ultralytics import YOLO

def main():
    print("====================================")
    print("🚀 AeroGuard AI Trainer pipeline")
    print("====================================\n")

    print("[1] Downing YOLOv8 Annotated Dataset from Roboflow...")
    rf = Roboflow(api_key="pD6KFjJYptGqdt2gYnHN")
    project = rf.workspace("capstone-u7skk").project("plant-disease-6ex9f")
    version = project.version(1)
    dataset = version.download("yolov8")
    
    print(f"\n[+] Dataset downloaded successfully to: {dataset.location}\n")

    print("[2] Initializing YOLOv8n architecture and starting PyTorch Training...")
    model = YOLO('yolov8n.pt')
    
    data_yaml_path = os.path.join(dataset.location, "data.yaml")
    results = model.train(data=data_yaml_path, epochs=3, imgsz=640, plots=False)

    print("\n[3] Exporting trained model to ONNX format...")
    exported_path = model.export(format='onnx')
    
    print(f"\n✅ SUCCESS! YOLO Model trained and exported to: {exported_path}")
    print("The .onnx file is ready to be linked into AeroGuard C++ Engine.")

if __name__ == "__main__":
    main()
