import re

# Read the file
with open(r'e:\Brain-Tumor-Analysis-and-Prognosis-Using-AI-ML-\frontend\app\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the handleGetLocation location update section
# Looking for the exact pattern with proper whitespace
old_pattern = """                    try {
                        // Update user location
                        await api.patch('/users/me', {
                            location: {
                                latitude,
                                longitude
                            }
                        });
                        
                        // Refresh profile
                        await fetchProfile();
                        alert('Location updated successfully!');"""

new_pattern = """                    try {
                        // Get location name from coordinates
                        const locationInfo = await reverseGeocode(latitude, longitude);
                        console.log('Reverse geocoded location:', locationInfo);
                        
                        // Update user location with coordinates and name
                        await api.patch('/users/me', {
                            location: {
                                latitude,
                                longitude,
                                city: locationInfo.city,
                                state: locationInfo.state,
                                country: locationInfo.country
                            }
                        });
                        
                        // Refresh profile
                        await fetchProfile();
                        const locationName = [locationInfo.city, locationInfo.state, locationInfo.country]
                            .filter(Boolean)
                            .join(', ');
                        alert(`Location updated successfully!\\n${locationName || 'Location captured'}`);
                        console.log('Profile after update:', profile);"""

if old_pattern in content:
    content = content.replace(old_pattern, new_pattern)
    print("✓ Updated handleGetLocation with reverse geocoding")
else:
    print("✗ Pattern not found - checking alternative patterns")
    # Try to find the section differently
    import difflib
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'Update user location' in line and i < len(lines) - 15:
            print(f"Found at line {i}:")
            print('\n'.join(lines[i:i+15]))
            break

# Write back
with open(r'e:\Brain-Tumor-Analysis-and-Prognosis-Using-AI-ML-\frontend\app\dashboard\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated")
