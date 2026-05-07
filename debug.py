f = '/work/milestone/milestone/pom.xml'
with open(f, 'rb') as file:
    content = file.read().decode('utf-8')

idx = content.find('</dependencyManagement>')
print(repr(content[idx:idx+100]))
