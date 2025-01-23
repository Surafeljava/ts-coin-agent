import requests

def is_prompt_or_output_valid(url, prompt, project_id, api_key, output=''):
    scanner_use_data = [
        {
            "name": "PromptInjection",
            "type": "PromptInjection"
        }
    ]
    
    metadata = {
        "project-type": "blockchain ai-agent",
        "session": "4638f2f8-87bc-4e30-9fb9-e1ca31bd8dba",
        "file": "ai_agent.py",
        "tags": ["task", "taskclassifier", "blockchain"],
        "name": "AI Agent"
    }
    
    api_onfig = {
        "project_id": f"{project_id}",
        "fail_fast": True,
        "cache": {
            "enabled": True,
            "ttl": 3600
        }
    }
    
    prompt_data = {
        'config': api_onfig,
        'prompt': f"{prompt}",
        'output': f"{output}",
        'metadata': metadata,
        'use': scanner_use_data
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": f"{api_key}"
    }
    
    url_end = 'prompt' if not output else 'output'
    
    try:
        response = requests.post(f"{url}/{url_end}", json=prompt_data, headers=headers)
        response_data = response.json()
        return response_data.get("is_valid", True), response_data
    except Exception as e:
        print(f"Error checking malicious prompt: {e}")
        return True, {}