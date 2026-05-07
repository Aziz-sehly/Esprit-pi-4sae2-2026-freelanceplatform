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

actuator_pattern = r'\s*<dependency>\s*<groupId>org\.springframework\.boot</groupId>\s*<artifactId>spring-boot-starter-actuator</artifactId>\s*<version>3\.3\.5</version>\s*</dependency>'

actuator_correct = '''
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>'''

for f in services:
    with open(f, 'r') as file:
        content = file.read()
    
    # Remove actuator from wherever it is
    content = re.sub(actuator_pattern, '', content)
    
    # Add it correctly in the main <dependencies> block (after </dependencyManagement>)
    content = content.replace('</dependencyManagement>\n    <dependencies>', '</dependencyManagement>\n    <dependencies>' + actuator_correct)
    
    with open(f, 'w') as file:
        file.write(content)
    
    count = content.count('spring-boot-starter-actuator')
    after_mgmt = content.split('</dependencyManagement>')[1].count('spring-boot-starter-actuator')
    print(f"{f.split('/work/')[1]}: total={count}, after_dependencyManagement={after_mgmt}")
