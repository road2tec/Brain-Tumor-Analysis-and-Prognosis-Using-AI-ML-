import torch

try:
    checkpoint = torch.load("image_classifier.pth", map_location='cpu', weights_only=True)
    if 'fc.weight' in checkpoint:
        print(f"FC Weight Shape: {checkpoint['fc.weight'].shape}")
    else:
        print("fc.weight not found")
        # Print first few keys
        print(list(checkpoint.keys())[:5])
except Exception as e:
    print(f"Error: {e}")
