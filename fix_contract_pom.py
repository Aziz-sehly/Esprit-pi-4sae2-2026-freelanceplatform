import re

f = '/work/microservice_contract/pom.xml'
with open(f, 'rb') as file:
    content = file.read().decode('utf-8')

actuator = '\r\n        <dependency>\r\n            <groupId>org.springframework.boot</groupId>\r\n            <artifactId>spring-boot-starter-actuator</artifactId>\r\n        </dependency>'

# Find the second <dependencies> tag (outside dependencyManagement)
idx1 = content.find('<dependencies>')
idx2 = content.find('<dependencies>', idx1 + 1)

if idx2 != -1:
    content = content[:idx2 + len('<dependencies>')] + actuator + content[idx2 + len('<dependencies>'):]
    print("Added after second <dependencies> at position", idx2)
else:
    # No second one, add after </dependencyManagement>
    idx = content.find('</dependencyManagement>')
    content = content[:idx + len('</dependencyManagement>')] + '\r\n    <dependencies>' + actuator + '\r\n    </dependencies>' + content[idx + len('</dependencyManagement>'):]
    print("Added new <dependencies> block after </dependencyManagement>")

with open(f, 'w', encoding='utf-8') as file:
    file.write(content)

print("Actuator count:", content.count("spring-boot-starter-actuator"))
