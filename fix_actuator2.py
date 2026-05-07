import re

services = [
    '/work/dispute-service/pom.xml',
    '/work/message-service/pom.xml',
    '/work/milestone/milestone/pom.xml',
    '/work/payment/payment/pom.xml',
    '/work/microservice_service/pom.xml',
    '/work/media-analysis-service/pom.xml',
    '/work/microservice_user/pom.xml',
]

actuator_pattern = r'[ \t]*<dependency>[ \t]*[\r\n]+[ \t]*<groupId>org\.springframework\.boot</groupId>[ \t]*[\r\n]+[ \t]*<artifactId>spring-boot-starter-actuator</artifactId>[ \t]*[\r\n]+[ \t]*<version>[^<]*</version>[ \t]*[\r\n]+[ \t]*</dependency>'

actuator_correct = '\n        <dependency>\n            <groupId>org.springframework.boot</groupId>\n            <artifactId>spring-boot-starter-actuator</artifactId>\n        </dependency>'

for f in services:
    with open(f, 'rb') as file:
        content = file.read().decode('utf-8')
    
    # Remove actuator from wherever it is
    content = re.sub(actuator_pattern, '', content)
    
    # Find </dependencyManagement> and insert before the next <dependencies>
    content = re.sub(r'(</dependencyManagement>[\r\n\s]*<dependencies>)', r'\1' + actuator_correct, content, count=1)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    
    count = content.count('spring-boot-starter-actuator')
    after_mgmt = content.split('</dependencyManagement>')[1].count('spring-boot-starter-actuator') if '</dependencyManagement>' in content else 0
    print(f"{f.split('/work/')[1]}: total={count}, after_dependencyManagement={after_mgmt}")
