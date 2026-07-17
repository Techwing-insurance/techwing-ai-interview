import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'http://localhost:8000/ai/technical/generate-questions',
    data=json.dumps({'role_name':'Software Engineer', 'resume_skills':['Java', 'Spring'], 'count':3}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print("SUCCESS:")
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"OTHER ERROR: {str(e)}")
