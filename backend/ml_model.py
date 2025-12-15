import torch
import torchvision.models as models
from torchvision import transforms
from PIL import Image
import io
import os

# Placeholder class names. You might need to adjust these based on training data.
# Common mappings for Brain Tumor datasets (e.g., Kaggle)
CLASS_NAMES = ["Glioma", "Meningioma", "No Tumor", "Pituitary"]

class BrainTumorClassifier:
    def __init__(self, model_path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Loading model from {model_path} to {self.device}...")
        self.model = self._load_model(model_path)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            # Standard ImageNet normalization
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        print("Model loaded successfully.")

    def _load_model(self, path):
        # Try ResNet18 first
        model = models.resnet18(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, 4)
        
        try:
            state_dict = torch.load(path, map_location=self.device)
            model.load_state_dict(state_dict)
        except RuntimeError as e:
            print(f"ResNet18 failed: {e}")
            print("Trying ResNet34...")
            model = models.resnet34(weights=None)
            model.fc = torch.nn.Linear(model.fc.in_features, 4)
            model.load_state_dict(state_dict)
            
        model.to(self.device)
        model.eval()
        return model

    def predict(self, image_bytes):
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted_class = torch.max(probabilities, 1)
            
        class_idx = int(predicted_class.item())
        # Safe access
        class_name = CLASS_NAMES[class_idx] if class_idx < len(CLASS_NAMES) else f"Class {class_idx}"

        return {
            "class_id": class_idx,
            "class_name": class_name,
            "confidence": float(confidence.item())
        }

# Global instance
classifier = None

def get_model():
    return classifier

def load_model_at_startup():
    global classifier
    # Path relative to usage or absolute
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../image_classifier.pth"))
    classifier = BrainTumorClassifier(model_path)
