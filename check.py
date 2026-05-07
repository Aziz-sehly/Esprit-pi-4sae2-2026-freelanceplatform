import re

f = '/work/dispute-service/pom.xml'
with open(f, 'r') as file:
    content = file.read()

actuator_block = re.search(r'\s*<dependency>\s*<groupId>org\.springframework\.boot</groupId>\s*<artifactId>spring-boot-starter-actuator</artifactId>\s*<version>3\.3\.5</version>\s*</dependency>', content)
if actuator_block:
    print("Found actuator at position:", actuator_block.start())
    print("Context:", content[actuator_block.start()-50:actuator_block.end()+100])
else:
    print("Not found")
