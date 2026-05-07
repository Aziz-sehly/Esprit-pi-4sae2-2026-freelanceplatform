services = [
    '/work/milestone/milestone/pom.xml',
    '/work/payment/payment/pom.xml',
    '/work/microservice_service/pom.xml',
    '/work/microservice_user/pom.xml',
]

actuator_correct = '\n\t\t<dependency>\n\t\t\t<groupId>org.springframework.boot</groupId>\n\t\t\t<artifactId>spring-boot-starter-actuator</artifactId>\n\t\t</dependency>'

for f in services:
    with open(f, 'rb') as file:
        content = file.read().decode('utf-8')
    
    if 'spring-boot-starter-actuator' in content:
        print(f"{f.split('/work/')[1]}: already has actuator, skipping")
        continue
    
    # Find the first <dependencies> tag
    idx = content.find('<dependencies>')
    print(f"{f.split('/work/')[1]}: first <dependencies> at position {idx}")
    print(repr(content[idx:idx+80]))
    
    # Insert actuator after first <dependencies>
    content = content.replace('<dependencies>', '<dependencies>' + actuator_correct, 1)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f"  -> Fixed: {content.count('spring-boot-starter-actuator')} actuator entries")
