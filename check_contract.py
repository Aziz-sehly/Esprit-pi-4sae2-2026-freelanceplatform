import re

f = '/work/microservice_contract/pom.xml'
with open(f, 'rb') as file:
    content = file.read().decode('utf-8')

print("Has actuator:", "actuator" in content)
print("Has dependencies tag:", "<dependencies>" in content)

# Find first <dependencies> tag position
idx = content.find('<dependencies>')
print("Context around first <dependencies>:")
print(repr(content[idx:idx+200]))
