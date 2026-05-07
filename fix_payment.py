with open('/work/k8s/services.yaml', 'rb') as f:
    content = f.read().decode('utf-8')

# Fix payment readiness probe path
content = content.replace(
    '''  name: payment
  namespace: pidev
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payment''',
    '''  name: payment
  namespace: pidev
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payment'''
)

# Find and fix payment probe path
import re
content = re.sub(
    r'(# ── payment.*?path: )/actuator/health(\s+port: 8082)',
    r'\1/payment/actuator/health\2',
    content,
    flags=re.DOTALL
)

with open('/work/k8s/services.yaml', 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
idx = content.find('port: 8082')
print(content[idx-100:idx+50])
