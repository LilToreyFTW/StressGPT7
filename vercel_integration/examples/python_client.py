"""
StressGPT7 Python Client Examples
Complete Python implementation for calling the StressGPT7 Vercel API
"""

import requests
import asyncio
import aiohttp
import json
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum


class RequestType(Enum):
    """Request type enumeration for optimization"""
    CODE_GENERATION = "code"
    CREATIVE_DESIGN = "creative"
    SYSTEM_ARCHITECTURE = "system"
    DEFAULT = "default"


@dataclass
class StressGPT7Response:
    """Response data structure"""
    success: bool
    output: str
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: Optional[str] = None


class StressGPT7Client:
    """Python client for StressGPT7 API"""
    
    def __init__(
        self, 
        base_url: str = "https://your-app.vercel.app",
        api_key: Optional[str] = None,
        timeout: int = 60,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """
        Initialize StressGPT7 client
        
        Args:
            base_url: Base URL for the API
            api_key: Optional API key for authentication
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            retry_delay: Initial retry delay in seconds (exponential backoff)
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.session = requests.Session()
        
        # Set up default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'StressGPT7-Python-Client/1.0'
        })
        
        if api_key:
            self.session.headers['Authorization'] = f'Bearer {api_key}'
    
    def _detect_request_type(self, input_text: str) -> RequestType:
        """Detect request type for optimization"""
        input_lower = input_text.lower()
        
        if any(keyword in input_lower for keyword in ['code', 'program', 'function', 'class', 'app']):
            return RequestType.CODE_GENERATION
        elif any(keyword in input_lower for keyword in ['design', 'creative', 'ui', 'ux', 'art']):
            return RequestType.CREATIVE_DESIGN
        elif any(keyword in input_lower for keyword in ['system', 'architecture', 'infrastructure', 'microservices']):
            return RequestType.SYSTEM_ARCHITECTURE
        
        return RequestType.DEFAULT
    
    def _make_request_with_retry(self, input_text: str) -> Dict[str, Any]:
        """Make API request with retry logic"""
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/stressgpt7",
                    json={"input": input_text},
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code >= 500 and attempt < self.max_retries:
                    # Server error - retry
                    last_exception = requests.RequestException(f"Server error: {response.status_code}")
                    time.sleep(self.retry_delay * (2 ** attempt))
                    continue
                else:
                    # Client error or final attempt - don't retry
                    error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                    raise requests.RequestException(error_data.get('error', f'HTTP {response.status_code}'))
                    
            except requests.exceptions.Timeout as e:
                last_exception = e
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay * (2 ** attempt))
                    continue
                raise
            except requests.exceptions.RequestException as e:
                last_exception = e
                if attempt < self.max_retries:
                    time.sleep(self.retry_delay * (2 ** attempt))
                    continue
                raise
        
        raise last_exception or requests.RequestException("Max retries exceeded")
    
    def call(self, input_text: str) -> StressGPT7Response:
        """
        Call StressGPT7 API
        
        Args:
            input_text: Input prompt for StressGPT7
            
        Returns:
            StressGPT7Response object
            
        Raises:
            requests.RequestException: If the request fails
        """
        try:
            # Make request with retry
            data = self._make_request_with_retry(input_text)
            
            # Parse response
            response = StressGPT7Response(
                success=data.get('success', False),
                output=data.get('output', ''),
                metadata=data.get('metadata'),
                error=data.get('error'),
                request_id=data.get('metadata', {}).get('requestId') if data.get('metadata') else None,
                timestamp=data.get('metadata', {}).get('timestamp') if data.get('metadata') else None
            )
            
            if not response.success:
                raise requests.RequestException(response.error or 'Request failed')
            
            return response
            
        except requests.RequestException as e:
            raise
        except Exception as e:
            raise requests.RequestException(f"Unexpected error: {str(e)}")
    
    def create_web_application(self, description: str) -> StressGPT7Response:
        """Create a complete web application"""
        prompt = f"Create a complete web application: {description}. Include all necessary files, dependencies, setup instructions, and deployment configuration."
        return self.call(prompt)
    
    def create_mobile_application(self, description: str) -> StressGPT7Response:
        """Create a complete mobile application"""
        prompt = f"Create a complete mobile application: {description}. Include React Native code, backend API, database design, and deployment instructions."
        return self.call(prompt)
    
    def design_system_architecture(self, requirements: str) -> StressGPT7Response:
        """Design a complete system architecture"""
        prompt = f"Design a complete system architecture: {requirements}. Include component diagrams, technology stack, scalability considerations, and implementation details."
        return self.call(prompt)
    
    def implement_security_features(self, features: str) -> StressGPT7Response:
        """Implement comprehensive security features"""
        prompt = f"Implement comprehensive security features: {features}. Include authentication, authorization, input validation, encryption, and security best practices."
        return self.call(prompt)
    
    def create_ai_ml_pipeline(self, description: str) -> StressGPT7Response:
        """Create an AI/ML pipeline"""
        prompt = f"Create a complete AI/ML pipeline: {description}. Include data preprocessing, model training, evaluation, deployment, and monitoring."
        return self.call(prompt)
    
    def create_blockchain_application(self, description: str) -> StressGPT7Response:
        """Create a blockchain application"""
        prompt = f"Create a complete blockchain application: {description}. Include smart contracts, frontend interface, deployment, and testing."
        return self.call(prompt)
    
    def health_check(self) -> Dict[str, Any]:
        """Check API health status"""
        try:
            response = self.session.get(f"{self.base_url}/api/stressgpt7", timeout=10)
            return response.json()
        except requests.RequestException as e:
            return {"status": "unhealthy", "error": str(e)}


class AsyncStressGPT7Client:
    """Async Python client for StressGPT7 API"""
    
    def __init__(
        self, 
        base_url: str = "https://your-app.vercel.app",
        api_key: Optional[str] = None,
        timeout: int = 60,
        max_retries: int = 3,
        retry_delay: float = 1.0
    ):
        """Initialize async client"""
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'StressGPT7-Async-Python-Client/1.0'
        }
        
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
    
    async def call(self, input_text: str) -> StressGPT7Response:
        """Async call to StressGPT7 API"""
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                async with aiohttp.ClientSession(timeout=self.timeout, headers=self.headers) as session:
                    async with session.post(
                        f"{self.base_url}/api/stressgpt7",
                        json={"input": input_text}
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            
                            return StressGPT7Response(
                                success=data.get('success', False),
                                output=data.get('output', ''),
                                metadata=data.get('metadata'),
                                error=data.get('error'),
                                request_id=data.get('metadata', {}).get('requestId') if data.get('metadata') else None,
                                timestamp=data.get('metadata', {}).get('timestamp') if data.get('metadata') else None
                            )
                        elif response.status >= 500 and attempt < self.max_retries:
                            # Server error - retry
                            last_exception = aiohttp.ClientResponseError(
                                request_info=response.request_info,
                                history=response.history,
                                status=response.status,
                                message=f"Server error: {response.status}"
                            )
                            await asyncio.sleep(self.retry_delay * (2 ** attempt))
                            continue
                        else:
                            # Client error or final attempt
                            error_data = await response.json() if response.content_type == 'application/json' else {}
                            raise aiohttp.ClientResponseError(
                                request_info=response.request_info,
                                history=response.history,
                                status=response.status,
                                message=error_data.get('error', f'HTTP {response.status}')
                            )
                            
            except aiohttp.ClientError as e:
                last_exception = e
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay * (2 ** attempt))
                    continue
                raise
        
        raise last_exception or aiohttp.ClientError("Max retries exceeded")
    
    async def batch_call(self, inputs: List[str]) -> List[StressGPT7Response]:
        """Batch process multiple inputs"""
        tasks = [self.call(input_text) for input_text in inputs]
        return await asyncio.gather(*tasks, return_exceptions=True)


# Usage Examples
def example_sync_usage():
    """Example of synchronous client usage"""
    client = StressGPT7Client()
    
    try:
        # Create a web application
        print("Creating web application...")
        result = client.create_web_application(
            "E-commerce platform with React frontend, Node.js backend, MongoDB database, and Stripe payments"
        )
        print(f"Success! Request ID: {result.request_id}")
        print(f"Tokens used: {result.metadata.get('tokensUsed', 'N/A')}")
        print(f"Output length: {len(result.output)} characters")
        
        # Design system architecture
        print("\nDesigning system architecture...")
        architecture = client.design_system_architecture(
            "Social media platform for 1M+ users with microservices, real-time chat, and video streaming"
        )
        print(f"Architecture designed! Request ID: {architecture.request_id}")
        
        # Implement security
        print("\nImplementing security features...")
        security = client.implement_security_features(
            "JWT authentication, OAuth2, rate limiting, input validation, and security monitoring"
        )
        print(f"Security implemented! Request ID: {security.request_id}")
        
    except requests.RequestException as e:
        print(f"Error: {e}")


async def example_async_usage():
    """Example of async client usage"""
    client = AsyncStressGPT7Client()
    
    try:
        # Batch process multiple requests
        inputs = [
            "Create a REST API for task management with Node.js and Express",
            "Build a React dashboard with charts and real-time updates",
            "Design a database schema for a booking system"
        ]
        
        print("Processing batch requests...")
        results = await client.batch_call(inputs)
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Request {i+1} failed: {result}")
            else:
                print(f"Request {i+1} succeeded! ID: {result.request_id}")
        
    except Exception as e:
        print(f"Error: {e}")


def example_error_handling():
    """Example of error handling and retry logic"""
    client = StressGPT7Client(
        max_retries=5,
        retry_delay=2.0
    )
    
    try:
        # This will retry on server errors
        result = client.call("Create a simple hello world application")
        print("Success:", result.request_id)
        
    except requests.RequestException as e:
        print(f"Failed after retries: {e}")
    
    # Check health
    health = client.health_check()
    print(f"API Health: {health.get('status', 'unknown')}")


class StressGPT7CLI:
    """Command-line interface for StressGPT7"""
    
    def __init__(self):
        self.client = StressGPT7Client()
    
    def run_interactive(self):
        """Run interactive CLI"""
        print("StressGPT7 Interactive CLI")
        print("Type 'help' for commands, 'quit' to exit")
        print("-" * 50)
        
        while True:
            try:
                user_input = input("\nStressGPT7> ").strip()
                
                if user_input.lower() == 'quit':
                    break
                elif user_input.lower() == 'help':
                    self.show_help()
                elif user_input.lower() == 'health':
                    health = self.client.health_check()
                    print(f"Health Status: {health}")
                elif user_input.lower() == 'stats':
                    self.show_stats()
                elif user_input:
                    print("Processing...")
                    result = self.client.call(user_input)
                    print(f"\nResponse (ID: {result.request_id}):")
                    print("-" * 50)
                    print(result.output)
                    print("-" * 50)
                    print(f"Tokens: {result.metadata.get('tokensUsed', 'N/A')}")
                    print(f"Model: {result.metadata.get('model', 'N/A')}")
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except requests.RequestException as e:
                print(f"Error: {e}")
    
    def show_help(self):
        """Show help information"""
        print("""
Available commands:
  help     - Show this help message
  health   - Check API health status
  stats    - Show usage statistics
  quit     - Exit the CLI
  
Any other input will be sent to StressGPT7 for processing.
        """)
    
    def show_stats(self):
        """Show usage statistics"""
        print("Statistics not implemented in this demo")
        print("In a real implementation, this would show:")
        print("- Total requests made")
        print("- Tokens used")
        print("- Average response time")
        print("- Success rate")


# Main execution
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "interactive":
            cli = StressGPT7CLI()
            cli.run_interactive()
        elif command == "example":
            example_sync_usage()
        elif command == "async":
            asyncio.run(example_async_usage())
        elif command == "error":
            example_error_handling()
        else:
            print("Usage: python python_client.py [interactive|example|async|error]")
    else:
        # Default: run example
        example_sync_usage()
