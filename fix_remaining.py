import re

services = [
    '/work/milestone/milestone/pom.xml',
    '/work/payment/payment/pom.xml',
    '/work/microservice_service/pom.xml',
    '/work/microservice_user/pom.xml',
]

actuator_correct = '\n        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-actuator</artifactId>\n        </dependency>'

for f in services:
    with open(f, 'rb') as file:
        content = file.read().decode('utf-8')
    
    # Check if actuator already exists anywhere
    has_actuator = 'spring-boot-starter-actuator' in content
    has_dep_mgmt = '</dependencyManagement>' in content
    print(f"{f.split('/work/')[1]}: has_actuator={has_actuator}, has_dependencyManagement={has_dep_mgmt}")
    
    if not has_actuator:
        # Just find <dependencies> that comes after </dependencyManagement> or the first one
        if has_dep_mgmt:
            content = re.sub(r'(</dependencyManagement>[\r\n\s]*<dependencies>)', r'\1' + actuator_correct, content, count=1)
        else:
            content = re.sub(r'(<dependencies>)', r'\1' + actuator_correct, content, count=1)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"  -> Fixed: {content.count('spring-boot-starter-actuator')} actuator entries")
