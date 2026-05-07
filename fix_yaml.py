with open('/work/k8s/services.yaml', 'rb') as f:
    content = f.read().decode('utf-8')

# Fix wrong image tag
content = content.replace(
    'faresjebali/pidev_microservices:microservice-contract',
    'faresjebali/pidev_microservices:contract-service'
)

# Add imagePullPolicy: Always after every image: line
lines = content.split('\n')
new_lines = []
for line in lines:
    new_lines.append(line)
    if 'image: faresjebali/pidev_microservices:' in line:
        indent = len(line) - len(line.lstrip())
        new_lines.append(' ' * indent + 'imagePullPolicy: Always')

with open('/work/k8s/services.yaml', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print('Done')
print('imagePullPolicy count:', '\n'.join(new_lines).count('imagePullPolicy: Always'))
print('contract image:', [l.strip() for l in new_lines if 'contract' in l and 'image:' in l])
