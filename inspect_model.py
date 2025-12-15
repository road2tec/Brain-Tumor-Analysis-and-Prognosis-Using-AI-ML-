import torch

try:
    checkpoint = torch.load("image_classifier.pth", map_location='cpu')
    print(f"Type: {type(checkpoint)}")
    if isinstance(checkpoint, dict):
        print(f"Keys: {checkpoint.keys()}")
        if 'state_dict' in checkpoint:
            print("Contains state_dict")
        if 'model_state_dict' in checkpoint:
            print("Contains model_state_dict")
    else:
        print("Likely a full model object")
except Exception as e:
    print(f"Error loading model: {e}")
