import re

f = '/work/message-service/src/main/java/com/prolance/message/web/GlobalExceptionHandler.java'
with open(f, 'r') as file:
    content = file.read()

new_handler = '    @ExceptionHandler(NoResourceFoundException.class)\n    public ResponseEntity<String> handleNoResource(NoResourceFoundException ex) {\n        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found: " + ex.getMessage());\n    }\n\n    '

content = re.sub(r'@ExceptionHandler\(Exception\.class\)', new_handler + '@ExceptionHandler(Exception.class)', content, count=1)

with open(f, 'w') as file:
    file.write(content)

print('Done')
print([l for l in content.splitlines() if 'NoResource' in l])
