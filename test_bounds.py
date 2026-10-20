import re

with open('public/blue_dart_official_logo.svg') as f:
    content = f.read()

print('Contains fill #065dac:', '#065dac' in content)
print('Contains fill #33a44c:', '#33a44c' in content)
